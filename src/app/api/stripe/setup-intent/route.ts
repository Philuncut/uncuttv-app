import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createAdminClient } from '@/lib/supabase/admin'
import { getStripeCustomerId } from '@/lib/payment-methods'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-02-25.clover' })

/**
 * Erzeugt einen SetupIntent, mit dem der Kunde eine neue Zahlungsmethode
 * hinterlegt, ohne die Seite zu verlassen.
 *
 * usage: 'off_session' ist entscheidend -- die Methode soll spaeter fuer die
 * automatische Abbuchung taugen, wenn der Kunde nicht anwesend ist. Ohne das
 * wuerde Stripe sie nur fuer Zahlungen mit Anwesenheit freigeben und die
 * Verlaengerung scheitern lassen.
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

    const customerId = await getStripeCustomerId(user.id)
    if (!customerId) {
      return NextResponse.json({ error: 'no_customer' }, { status: 404 })
    }

    // Bewusst nur Karte, nicht automatic_payment_methods.
    //
    // checkout/route.ts legt Abos mit payment_method_types: ['card'] an, und
    // Stripe Checkout uebertraegt das auf das entstehende Abo. Eine hier per
    // Elements hinterlegte SEPA-Methode liesse sich zwar speichern und als
    // Standard setzen, die Verlaengerung wuerde aber scheitern -- der Kunde
    // saehe eine bestaetigte Zahlungsmethode und bekaeme trotzdem eine
    // fehlgeschlagene Abbuchung.
    //
    // SEPA kommt erst dazu, wenn Mandatstext, Glaeubiger-ID und der Umgang
    // mit Ruecklastschriften geklaert sind -- und dann auch im Checkout, nicht
    // nur hier.
    const setupIntent = await stripe.setupIntents.create({
      customer: customerId,
      usage: 'off_session',
      payment_method_types: ['card'],
      metadata: { supabase_user_id: user.id },
    })

    return NextResponse.json({ clientSecret: setupIntent.client_secret })
  } catch (err) {
    console.error('setup-intent error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
