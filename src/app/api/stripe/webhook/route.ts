import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(req: NextRequest) {
  const body = await req.text()
  const signature = req.headers.get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = await createClient()

  switch (event.type) {

    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.CheckoutSession
      const userId = session.metadata?.supabase_user_id
      if (!userId) break
      await supabase.from('profiles').update({
        subscription_status: 'trialing',
      }).eq('id', userId)
      break
    }

    case 'customer.subscription.updated':
    case 'customer.subscription.created': {
      const sub = event.data.object as Stripe.Subscription
      const customer = await stripe.customers.retrieve(sub.customer as string) as Stripe.Customer
      const userId = customer.metadata?.supabase_user_id
      if (!userId) break

      await supabase.from('profiles').update({
        subscription_status: sub.status,
      }).eq('id', userId)

      await supabase.from('subscriptions').upsert({
        user_id: userId,
        stripe_subscription_id: sub.id,
        stripe_price_id: sub.items.data[0].price.id,
        status: sub.status,
        trial_start: sub.trial_start ? new Date(sub.trial_start * 1000).toISOString() : null,
        trial_end: sub.trial_end ? new Date(sub.trial_end * 1000).toISOString() : null,
        current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
        current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
      }, { onConflict: 'stripe_subscription_id' })
      break
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription
      const customer = await stripe.customers.retrieve(sub.customer as string) as Stripe.Customer
      const userId = customer.metadata?.supabase_user_id
      if (!userId) break

      await supabase.from('profiles').update({
        subscription_status: 'canceled',
      }).eq('id', userId)

      await supabase.from('subscriptions').update({
        status: 'canceled',
        canceled_at: new Date().toISOString(),
      }).eq('stripe_subscription_id', sub.id)
      break
    }

    // Zahlung fehlgeschlagen → Zugang sperren, Email geht automatisch von Stripe
    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice
      const customerId = invoice.customer as string
      const customer = await stripe.customers.retrieve(customerId) as Stripe.Customer
      const userId = customer.metadata?.supabase_user_id
      if (!userId) break

      // Stripe versucht es automatisch nochmal – wir setzen Status auf past_due
      await supabase.from('profiles').update({
        subscription_status: 'past_due',
      }).eq('id', userId)

      await supabase.from('subscriptions').update({
        status: 'past_due',
      }).eq('user_id', userId)

      break
    }

    // Zahlung erfolgreich (auch nach fehlgeschlagenem Versuch) → Zugang wiederherstellen
    case 'invoice.payment_succeeded': {
      const invoice = event.data.object as Stripe.Invoice
      // Nur bei wiederkehrenden Zahlungen, nicht beim ersten Checkout
      if (invoice.billing_reason === 'subscription_create') break

      const customerId = invoice.customer as string
      const customer = await stripe.customers.retrieve(customerId) as Stripe.Customer
      const userId = customer.metadata?.supabase_user_id
      if (!userId) break

      await supabase.from('profiles').update({
        subscription_status: 'active',
      }).eq('id', userId)

      await supabase.from('subscriptions').update({
        status: 'active',
      }).eq('user_id', userId)

      break
    }

  }

  return NextResponse.json({ received: true })
}