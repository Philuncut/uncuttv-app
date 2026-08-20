import Stripe from 'stripe'
import { createAdminClient } from '@/lib/supabase/admin'
import { ACCESS_GRANTING_STATUSES } from '@/lib/access'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-02-25.clover' })

export type StoredPaymentMethod = {
  /** 'card' | 'sepa_debit' | 'paypal' | 'klarna' | 'link' | sonstiges. */
  type: string
  /** Kartenmarke, klein geschrieben wie von Stripe geliefert. */
  brand: string | null
  /** Letzte vier Stellen von Karte bzw. IBAN. */
  last4: string | null
  expMonth: number | null
  expYear: number | null
  /** Bei PayPal und Link die hinterlegte Adresse. */
  email: string | null
  /** 'apple_pay' | 'google_pay' | ... -- Karten, die ueber eine Wallet kamen. */
  wallet: string | null
}

const EMPTY: Omit<StoredPaymentMethod, 'type'> = {
  brand: null,
  last4: null,
  expMonth: null,
  expYear: null,
  email: null,
  wallet: null,
}

/**
 * Ermittelt die Stripe-Kunden-ID eines Nutzers.
 *
 * Zuerst aus profiles: dort steht sie unabhaengig davon, ob gerade ein Abo
 * laeuft. subscriptions ist der Rueckfall fuer Altbestand, bei dem der Write
 * in profiles frueher stillschweigend fehlschlug.
 */
export async function getStripeCustomerId(userId: string): Promise<string | null> {
  const admin = createAdminClient()

  const { data: profile } = await admin
    .from('profiles')
    .select('stripe_customer_id')
    .eq('id', userId)
    .maybeSingle()

  if (profile?.stripe_customer_id) return profile.stripe_customer_id

  const { data: sub } = await admin
    .from('subscriptions')
    .select('stripe_customer_id')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  return sub?.stripe_customer_id ?? null
}

/** Das aktuell laufende Abo eines Nutzers, falls vorhanden. */
export async function getActiveSubscriptionId(userId: string): Promise<string | null> {
  const admin = createAdminClient()

  const { data } = await admin
    .from('subscriptions')
    .select('stripe_subscription_id')
    .eq('user_id', userId)
    .in('status', ACCESS_GRANTING_STATUSES)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  return data?.stripe_subscription_id ?? null
}

/**
 * Uebersetzt eine Stripe-PaymentMethod in das, was die Kontoseite zeigt.
 *
 * Der Rueckfall am Ende ist wichtig: Stripe fuehrt laufend neue Typen ein,
 * und ein unbekannter Typ darf hier weder leer bleiben noch werfen -- die
 * Kontoseite wuerde sonst an der Zahlungsmethode scheitern.
 */
function describe(pm: Stripe.PaymentMethod): StoredPaymentMethod {
  switch (pm.type) {
    case 'card':
      return {
        ...EMPTY,
        type: 'card',
        brand: pm.card?.brand ?? null,
        last4: pm.card?.last4 ?? null,
        expMonth: pm.card?.exp_month ?? null,
        expYear: pm.card?.exp_year ?? null,
        // Apple Pay und Google Pay sind Karten. Ohne diese Angabe saehe der
        // Kunde die Marke der hinterlegten Karte und nicht die Wallet, ueber
        // die er tatsaechlich bezahlt.
        wallet: pm.card?.wallet?.type ?? null,
      }

    case 'sepa_debit':
      return {
        ...EMPTY,
        type: 'sepa_debit',
        last4: pm.sepa_debit?.last4 ?? null,
      }

    case 'paypal':
      return {
        ...EMPTY,
        type: 'paypal',
        email: pm.paypal?.payer_email ?? null,
      }

    case 'link':
      return {
        ...EMPTY,
        type: 'link',
        email: pm.link?.email ?? null,
      }

    case 'klarna':
      // Klarna gibt keine anzeigbare Kennung heraus -- nur der Name.
      return { ...EMPTY, type: 'klarna' }

    default:
      return { ...EMPTY, type: pm.type }
  }
}

/**
 * Liest die Standard-Zahlungsmethode des Kunden.
 *
 * Reihenfolge wie Stripe sie beim Einzug anwendet: erst die am Abo hinterlegte
 * default_payment_method, dann die des Kunden. Genau deshalb muessen beim
 * Wechsel auch beide gesetzt werden -- steht am Abo noch die alte Karte,
 * bucht Stripe weiter von dieser ab, egal was beim Kunden hinterlegt ist.
 */
export async function getDefaultPaymentMethod(userId: string): Promise<StoredPaymentMethod | null> {
  const customerId = await getStripeCustomerId(userId)
  if (!customerId) return null

  try {
    const subscriptionId = await getActiveSubscriptionId(userId)

    if (subscriptionId) {
      const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
        expand: ['default_payment_method'],
      })
      const subPm = subscription.default_payment_method
      if (subPm && typeof subPm !== 'string') return describe(subPm)
    }

    const customer = await stripe.customers.retrieve(customerId, {
      expand: ['invoice_settings.default_payment_method'],
    })

    if (customer.deleted) return null

    const customerPm = customer.invoice_settings?.default_payment_method
    if (customerPm && typeof customerPm !== 'string') return describe(customerPm)

    return null
  } catch (error) {
    console.error('getDefaultPaymentMethod: stripe call failed -', error)
    return null
  }
}
