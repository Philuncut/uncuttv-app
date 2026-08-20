import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient, reportWrite } from '@/lib/supabase/admin'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Nicht eingeloggt' }, { status: 401 })
  }

  const { plan } = await req.json().catch(() => ({ plan: 'monthly' }))
  const isYearly = plan === 'yearly'

  // Die Altersverifikation wird hier bewusst NICHT verlangt. Sie steht erst
  // vor dem ersten Stream (siehe Content-Gate in src/proxy.ts): Ausweis und
  // Selfie sind die hoechste Huerde im Trichter und haetten vor der Zahlung
  // die meisten Abbrueche gekostet. AGB Paragraph 3 knuepft die Verifikation
  // an den Zugang zu den Inhalten, nicht an den Vertragsschluss.
  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_customer_id')
    .eq('id', user.id)
    .single()

  // Get or create Stripe customer
  let customerId = profile?.stripe_customer_id

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email!,
      name: user.user_metadata?.full_name,
      metadata: { supabase_user_id: user.id },
    })
    customerId = customer.id

    // Systemwert von Stripe, nicht vom Nutzer: mit Service-Role schreiben,
    // damit die Zuordnung nicht an einer UPDATE-Policy der eigenen Zeile
    // haengt. Schlaegt der Write fehl, legt jeder weitere Checkout einen
    // neuen Stripe-Customer an -- deshalb hier hart abbrechen.
    const written = reportWrite(
      'stripe/checkout: profiles.stripe_customer_id',
      await createAdminClient()
        .from('profiles')
        .update({ stripe_customer_id: customerId }, { count: 'exact' })
        .eq('id', user.id)
    )

    if (!written) {
      return NextResponse.json(
        { error: 'Kundenzuordnung konnte nicht gespeichert werden' },
        { status: 500 }
      )
    }
  }

  const priceId = isYearly
    ? process.env.STRIPE_YEARLY_PRICE_ID!
    : process.env.STRIPE_PRICE_ID!

  // Create checkout session
  //
  // 'card' bleibt bewusst stehen und schliesst Apple Pay und Google Pay NICHT
  // aus: Stripe Checkout blendet beide von selbst ein, sobald Karte akzeptiert
  // wird und das Geraet sie unterstuetzt. Sie sind Wallets auf 'card', keine
  // eigenen Typen.
  //
  // Wuerde man payment_method_types weglassen, folgte Checkout der
  // Dashboard-Konfiguration -- und damit erschiene Klarna, das dort aktiv ist.
  // Checkout Sessions kennen kein automatic_payment_methods und damit auch
  // kein allow_redirects, es gibt hier also keinen Schalter, um Klarna
  // gezielt herauszuhalten. Der Weg dafuer waere eine eigene Payment Method
  // Configuration im Dashboard, referenziert ueber payment_method_configuration.
  //
  // Zweiter Grund: Stripe uebertraegt diese Liste auf das entstehende Abo
  // (subscription.payment_settings.payment_method_types). Ein Weglassen
  // wuerde neue Abos anders konfigurieren als alle bestehenden.
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    mode: 'subscription',
    subscription_data: isYearly ? {} : { trial_period_days: 7 },
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/de/welcome?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/de/subscribe`,
    locale: 'de',
    metadata: { supabase_user_id: user.id },
  })

  return NextResponse.json({ url: session.url })
}
