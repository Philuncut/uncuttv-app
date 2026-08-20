import Stripe from 'stripe'
import { createAdminClient, reportWrite } from '@/lib/supabase/admin'
import { sendInternNotification } from '@/lib/emails'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-02-25.clover' })

/** Grund, der in subscriptions.access_blocked_reason landet. */
const BLOCK_REASON = 'dispute'

function formatAmount(amount: number, currency: string): string {
  return `${(amount / 100).toFixed(2)} ${currency.toUpperCase()}`
}

/**
 * Ermittelt Nutzer und Abo zu einer angefochtenen Zahlung.
 *
 * Der Weg fuehrt ueber die Charge: sie kennt den Kunden, und der Kunde traegt
 * die supabase_user_id in den Metadaten. Ueber die Rechnung kommt zusaetzlich
 * das Abo dazu, sofern die Zahlung zu einem gehoerte.
 */
async function resolveDispute(dispute: Stripe.Dispute): Promise<{
  userId: string | null
  subscriptionId: string | null
  chargeId: string | null
  paymentMethodType: string | null
}> {
  const chargeId = typeof dispute.charge === 'string' ? dispute.charge : (dispute.charge?.id ?? null)

  if (!chargeId) {
    return { userId: null, subscriptionId: null, chargeId: null, paymentMethodType: null }
  }

  try {
    const charge = await stripe.charges.retrieve(chargeId, { expand: ['invoice'] })

    const customerId = typeof charge.customer === 'string' ? charge.customer : charge.customer?.id
    let userId: string | null = null

    if (customerId) {
      const customer = await stripe.customers.retrieve(customerId)
      if (!customer.deleted) {
        userId = customer.metadata?.supabase_user_id ?? null
      }
    }

    // charge.invoice ist in den aktuellen Typen nicht mehr deklariert, in der
    // Antwort aber vorhanden -- wie bei current_period_end auf der
    // Subscription. Deshalb ueber eine lose Form gelesen.
    const chargeAny = charge as unknown as { invoice?: string | Record<string, unknown> | null }
    const invoice = chargeAny.invoice

    const invoiceAny = invoice && typeof invoice !== 'string' ? (invoice as {
      subscription?: string | { id: string } | null
      parent?: { subscription_details?: { subscription?: string | { id: string } } }
    }) : null

    const rawSubscription =
      invoiceAny?.subscription ?? invoiceAny?.parent?.subscription_details?.subscription ?? null

    const subscriptionId =
      typeof rawSubscription === 'string' ? rawSubscription : (rawSubscription?.id ?? null)

    return {
      userId,
      subscriptionId,
      chargeId,
      paymentMethodType: charge.payment_method_details?.type ?? null,
    }
  } catch (error) {
    console.error('resolveDispute: stripe lookup failed -', error)
    return { userId: null, subscriptionId: null, chargeId, paymentMethodType: null }
  }
}

/**
 * Eine Zahlung wurde angefochten.
 *
 * SEPA-Lastschriften sind acht Wochen lang ohne Angabe von Gruenden
 * anfechtbar und werden in dem Zeitraum automatisch anerkannt -- das Geld ist
 * dann zurueck beim Kunden. Stripe aendert dabei NICHT den Abo-Status, das
 * Abo bleibt 'active'. Ohne die Sperre hier behielte der Kunde seinen Zugang.
 */
export async function handleDisputeCreated(dispute: Stripe.Dispute): Promise<void> {
  const admin = createAdminClient()
  const { userId, subscriptionId, chargeId, paymentMethodType } = await resolveDispute(dispute)

  reportWrite(
    'dispute: payment_disputes insert',
    await admin.from('payment_disputes').insert(
      {
        user_id: userId,
        stripe_dispute_id: dispute.id,
        stripe_charge_id: chargeId,
        stripe_subscription_id: subscriptionId,
        amount: dispute.amount,
        currency: dispute.currency,
        reason: dispute.reason,
        status: dispute.status,
        payment_method_type: paymentMethodType,
      },
      { count: 'exact' }
    )
  )

  // Sperre setzen: am betroffenen Abo, sonst an allen laufenden des Nutzers.
  // Das Feld ist bewusst nicht subscriptions.status -- dort stuende der Wert
  // von Stripe, und das naechste customer.subscription.updated wuerde eine
  // hier gesetzte Sperre wieder ueberschreiben.
  const block = { access_blocked_reason: BLOCK_REASON, access_blocked_at: new Date().toISOString() }

  if (subscriptionId) {
    reportWrite(
      'dispute: block subscription',
      await admin
        .from('subscriptions')
        .update(block, { count: 'exact' })
        .eq('stripe_subscription_id', subscriptionId)
    )
  } else if (userId) {
    reportWrite(
      'dispute: block all subscriptions of user',
      await admin
        .from('subscriptions')
        .update(block, { count: 'exact' })
        .eq('user_id', userId)
        .in('status', ['active', 'trialing'])
    )
  } else {
    console.error('dispute: could not resolve user or subscription for', dispute.id)
  }

  try {
    await sendInternNotification(
      'Zahlung angefochten – Zugang gesperrt',
      'Zahlung angefochten',
      'Eine Zahlung wurde angefochten. Der Zugang wurde automatisch gesperrt. Bitte pruefen.',
      [
        { label: 'Nutzer-ID', value: userId ?? 'nicht ermittelbar' },
        { label: 'Betrag', value: formatAmount(dispute.amount, dispute.currency) },
        { label: 'Grund', value: dispute.reason ?? '—' },
        { label: 'Zahlungsart', value: paymentMethodType ?? '—' },
        { label: 'Abo', value: subscriptionId ?? 'keines zugeordnet' },
        { label: 'Dispute-ID', value: dispute.id },
      ]
    )
  } catch (mailError) {
    console.error('dispute: notification failed -', mailError)
  }
}

/**
 * Die Anfechtung ist abgeschlossen.
 *
 * Der Zugang wird bewusst NICHT automatisch wiederhergestellt, auch nicht bei
 * 'won'. Begruendung steht im Bericht: eine Anfechtung ist eine Aussage des
 * Kunden, kein technischer Fehler. Die Sperre loest ein Mensch, der vorher
 * geprueft hat, ob das Konto uebernommen wurde.
 */
export async function handleDisputeClosed(dispute: Stripe.Dispute): Promise<void> {
  const admin = createAdminClient()

  reportWrite(
    'dispute: payment_disputes close',
    await admin
      .from('payment_disputes')
      .update(
        { status: dispute.status, outcome: dispute.status, closed_at: new Date().toISOString() },
        { count: 'exact' }
      )
      .eq('stripe_dispute_id', dispute.id)
  )

  try {
    await sendInternNotification(
      `Anfechtung abgeschlossen: ${dispute.status}`,
      'Anfechtung abgeschlossen',
      dispute.status === 'won'
        ? 'Die Anfechtung ging zu unseren Gunsten aus. Der Zugang bleibt gesperrt und muss bei Bedarf von Hand freigegeben werden.'
        : 'Die Anfechtung ist abgeschlossen. Der Zugang bleibt gesperrt.',
      [
        { label: 'Ergebnis', value: dispute.status },
        { label: 'Betrag', value: formatAmount(dispute.amount, dispute.currency) },
        { label: 'Dispute-ID', value: dispute.id },
      ]
    )
  } catch (mailError) {
    console.error('dispute closed: notification failed -', mailError)
  }
}

/**
 * Ein Mandat hat sich geaendert.
 *
 * Faellt an, wenn ein SEPA-Mandat storniert oder eine PayPal-Vereinbarung
 * widerrufen wurde. Nur Benachrichtigung, kein Zugangsentzug: die laufende
 * Periode ist bezahlt, es scheitert erst die naechste Abbuchung. Wer das
 * frueh weiss, kann den Kunden vorher ansprechen.
 */
export async function handleMandateUpdated(mandate: Stripe.Mandate): Promise<void> {
  if (mandate.status === 'active') return

  let userId: string | null = null
  let type: string | null = null

  try {
    const paymentMethodId =
      typeof mandate.payment_method === 'string'
        ? mandate.payment_method
        : (mandate.payment_method?.id ?? null)

    if (paymentMethodId) {
      const pm = await stripe.paymentMethods.retrieve(paymentMethodId)
      type = pm.type

      const customerId = typeof pm.customer === 'string' ? pm.customer : pm.customer?.id
      if (customerId) {
        const customer = await stripe.customers.retrieve(customerId)
        if (!customer.deleted) userId = customer.metadata?.supabase_user_id ?? null
      }
    }
  } catch (error) {
    console.error('mandate.updated: lookup failed -', error)
  }

  try {
    await sendInternNotification(
      'Mandat widerrufen – naechste Abbuchung wird scheitern',
      'Mandat widerrufen',
      'Ein Zahlungsmandat ist nicht mehr aktiv. Die laufende Periode ist bezahlt, die naechste Abbuchung wird fehlschlagen. Kunde ansprechen, bevor das passiert.',
      [
        { label: 'Nutzer-ID', value: userId ?? 'nicht ermittelbar' },
        { label: 'Zahlungsart', value: type ?? '—' },
        { label: 'Mandatsstatus', value: mandate.status },
        { label: 'Mandats-ID', value: mandate.id },
      ]
    )
  } catch (mailError) {
    console.error('mandate.updated: notification failed -', mailError)
  }
}
