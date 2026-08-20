import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createAdminClient } from '@/lib/supabase/admin'
import { getActiveSubscriptionId, getStripeCustomerId } from '@/lib/payment-methods'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-02-25.clover' })

/**
 * Setzt eine per SetupIntent hinterlegte Zahlungsmethode als Standard.
 *
 * Sie muss an ZWEI Stellen stehen, sonst greift sie nicht:
 *   1. subscription.default_payment_method -- was das laufende Abo einzieht
 *   2. customer.invoice_settings.default_payment_method -- was fuer alles
 *      andere und fuer kuenftige Abos gilt
 * Fehlt die erste, bucht Stripe die Verlaengerung weiter von der alten Karte
 * ab, obwohl beim Kunden die neue hinterlegt ist. Fehlt die zweite, faellt
 * alles ausserhalb dieses Abos zurueck.
 */
export async function POST(request: Request) {
  try {
    const admin = createAdminClient()

    const authHeader = request.headers.get('Authorization')
    if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const token = authHeader.replace('Bearer ', '')
    const {
      data: { user },
      error: authError,
    } = await admin.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => null)
    const paymentMethodId = (body as { paymentMethodId?: unknown } | null)?.paymentMethodId

    if (typeof paymentMethodId !== 'string' || !paymentMethodId.startsWith('pm_')) {
      return NextResponse.json({ error: 'invalid_payment_method' }, { status: 400 })
    }

    const customerId = await getStripeCustomerId(user.id)
    if (!customerId) {
      return NextResponse.json({ error: 'no_customer' }, { status: 404 })
    }

    // Die Methode muss zu diesem Kunden gehoeren. Ueber den SetupIntent ist
    // sie das bereits, aber die ID kommt aus dem Browser -- ohne Pruefung
    // liesse sich hier eine fremde Zahlungsmethode unterschieben.
    const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId)
    if (paymentMethod.customer !== customerId) {
      return NextResponse.json({ error: 'payment_method_mismatch' }, { status: 403 })
    }

    await stripe.customers.update(customerId, {
      invoice_settings: { default_payment_method: paymentMethodId },
    })

    const subscriptionId = await getActiveSubscriptionId(user.id)
    if (subscriptionId) {
      await stripe.subscriptions.update(subscriptionId, {
        default_payment_method: paymentMethodId,
      })
    }

    return NextResponse.json({ ok: true, subscriptionUpdated: Boolean(subscriptionId) })
  } catch (err) {
    console.error('payment-method error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
