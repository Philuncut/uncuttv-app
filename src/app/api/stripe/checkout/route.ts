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

  // Check age verification
  const { data: profile } = await supabase
    .from('profiles')
    .select('age_verified, stripe_customer_id')
    .eq('id', user.id)
    .single()

  if (!profile?.age_verified) {
    return NextResponse.json({ error: 'Altersverifikation erforderlich' }, { status: 403 })
  }

  // Get or create Stripe customer
  let customerId = profile.stripe_customer_id

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
