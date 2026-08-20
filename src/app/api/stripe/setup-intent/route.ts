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

    // Folgt der Dashboard-Konfiguration, damit Apple Pay und Google Pay
    // erscheinen. Beide sind keine eigenen payment_method_types, sondern
    // Wallets auf 'card' -- die entstehende Zahlungsmethode ist eine Karte.
    //
    // allow_redirects: 'never' schliesst alle Verfahren aus, die den Kunden
    // auf eine fremde Seite schicken. Das haelt gezielt KLARNA heraus, das im
    // Dashboard aktiv ist und hier nicht angeboten werden soll. Karten und
    // Wallets bleiben, 3D-Secure laeuft im Stripe-Dialog und ist kein
    // Redirect im Sinne dieses Schalters.
    //
    // ACHTUNG SEPA: SEPA-Lastschrift braucht keinen Redirect und wuerde hier
    // deshalb NICHT herausgefiltert. Aktuell ist sie im Dashboard aus, also
    // greift das nicht. Wer sie einschaltet, muss vorher Mandatstext,
    // Glaeubiger-ID und den Umgang mit Ruecklastschriften klaeren UND den
    // Checkout mitziehen: dort steht payment_method_types: ['card'], und
    // Stripe uebertraegt das auf das Abo -- eine hier hinterlegte
    // SEPA-Methode liesse sich sonst speichern, die Verlaengerung wuerde
    // aber scheitern.
    const setupIntent = await stripe.setupIntents.create({
      customer: customerId,
      usage: 'off_session',
      automatic_payment_methods: { enabled: true, allow_redirects: 'never' },
      metadata: { supabase_user_id: user.id },
    })

    return NextResponse.json({ clientSecret: setupIntent.client_secret })
  } catch (err) {
    console.error('setup-intent error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
