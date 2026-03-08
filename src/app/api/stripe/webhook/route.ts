import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'
import {
  sendWillkommenEmail,
  sendZahlungFehlgeschlagenEmail,
  sendAboGekuendigtEmail,
  sendTestphaseEndetEmail,
} from '@/lib/emails'

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
      const session = event.data.object as Stripe.Checkout.Session
      const userId = session.metadata?.supabase_user_id
      if (!userId) break

      await supabase.from('profiles').update({
        subscription_status: 'trialing',
      }).eq('id', userId)

      // Willkommen-Email nur einmalig nach Checkout
      const { data: profile } = await supabase
        .from('profiles')
        .select('email, welcome_email_sent')
        .eq('id', userId)
        .single()

      if (profile?.email && !profile.welcome_email_sent) {
        await sendWillkommenEmail(profile.email)
        await supabase.from('profiles').update({ welcome_email_sent: true }).eq('id', userId)
      }
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

      const subAny = sub as any
      await supabase.from('subscriptions').upsert({
        user_id: userId,
        stripe_subscription_id: sub.id,
        stripe_customer_id: sub.customer as string,
        stripe_price_id: sub.items.data[0].price.id,
        status: sub.status,
        trial_start: sub.trial_start ? new Date(sub.trial_start * 1000).toISOString() : null,
        trial_end: sub.trial_end ? new Date(sub.trial_end * 1000).toISOString() : null,
        current_period_start: subAny.current_period_start ? new Date(subAny.current_period_start * 1000).toISOString() : null,
        current_period_end: subAny.current_period_end ? new Date(subAny.current_period_end * 1000).toISOString() : null,
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

      const { data: profile } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', userId)
        .single()

      if (profile?.email) {
        const subAny = sub as any
        const endDate = subAny.current_period_end
          ? new Date(subAny.current_period_end * 1000).toLocaleDateString('de-AT', {
              day: '2-digit', month: '2-digit', year: 'numeric'
            })
          : ''
        await sendAboGekuendigtEmail(profile.email, endDate)
      }
      break
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice
      const customer = await stripe.customers.retrieve(invoice.customer as string) as Stripe.Customer
      const userId = customer.metadata?.supabase_user_id
      if (!userId) break

      await supabase.from('profiles').update({
        subscription_status: 'past_due',
      }).eq('id', userId)

      const { data: profile } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', userId)
        .single()

      if (profile?.email) {
        await sendZahlungFehlgeschlagenEmail(profile.email)
      }
      break
    }

    case 'customer.subscription.trial_will_end': {
      const sub = event.data.object as Stripe.Subscription
      const customer = await stripe.customers.retrieve(sub.customer as string) as Stripe.Customer
      const userId = customer.metadata?.supabase_user_id
      if (!userId) break

      const { data: profile } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', userId)
        .single()

      if (profile?.email && sub.trial_end) {
        const endDate = new Date(sub.trial_end * 1000).toLocaleDateString('de-AT', {
          day: '2-digit', month: '2-digit', year: 'numeric'
        })
        await sendTestphaseEndetEmail(profile.email, endDate)
      }
      break
    }
  }

  return NextResponse.json({ received: true })
}
