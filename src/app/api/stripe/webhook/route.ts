import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createAdminClient, getUserEmail, reportWrite } from '@/lib/supabase/admin'
import { cancelUnverifiedTrial } from '@/lib/subscriptions'
import { handleDisputeCreated, handleDisputeClosed, handleMandateUpdated } from '@/lib/disputes'
import {
  sendWillkommenEmail,
  sendZahlungFehlgeschlagenEmail,
  sendAboGekuendigtEmail,
  sendTestphaseEndetEmail,
  sendVerifikationAusstehendEmail,
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

  // Service-Role: ein Stripe-Webhook bringt kein Nutzer-Cookie mit, der
  // Cookie-Client traefe unter RLS null Zeilen.
  const supabase = createAdminClient()

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      const userId = session.metadata?.supabase_user_id
      if (!userId) break

      reportWrite(
        'checkout.session.completed: profiles.subscription_status',
        await supabase
          .from('profiles')
          .update({ subscription_status: 'trialing' }, { count: 'exact' })
          .eq('id', userId)
      )

      // Willkommen-Email nur einmalig nach Checkout
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('welcome_email_sent')
        .eq('id', userId)
        .single()

      if (profileError) {
        console.error(
          'checkout.session.completed: profile lookup failed -',
          profileError.message
        )
      }

      if (!profile?.welcome_email_sent) {
        const email = await getUserEmail(userId)

        if (email) {
          await sendWillkommenEmail(email)
          reportWrite(
            'checkout.session.completed: profiles.welcome_email_sent',
            await supabase
              .from('profiles')
              .update({ welcome_email_sent: true }, { count: 'exact' })
              .eq('id', userId)
          )
        }
      }
      break
    }

    case 'customer.subscription.updated':
    case 'customer.subscription.created': {
      const sub = event.data.object as Stripe.Subscription
      const customer = await stripe.customers.retrieve(sub.customer as string) as Stripe.Customer
      const userId = customer.metadata?.supabase_user_id
      if (!userId) break

      reportWrite(
        `${event.type}: profiles.subscription_status`,
        await supabase
          .from('profiles')
          .update({ subscription_status: sub.status }, { count: 'exact' })
          .eq('id', userId)
      )

      const subAny = sub as any
      // Stripe fuehrt current_period_start/end inzwischen auf dem
      // Subscription-Item statt auf der Subscription. Ohne diesen Fallback
      // landen beide Felder als null in der Datenbank -- daran fehlte auf der
      // Kontoseite die Datumszeile.
      const item = subAny.items?.data?.[0]
      const periodStart = subAny.current_period_start ?? item?.current_period_start ?? null
      const periodEnd = subAny.current_period_end ?? item?.current_period_end ?? null

      reportWrite(
        `${event.type}: subscriptions upsert`,
        await supabase.from('subscriptions').upsert({
          user_id: userId,
          stripe_subscription_id: sub.id,
          stripe_customer_id: sub.customer as string,
          stripe_price_id: sub.items.data[0].price.id,
          status: sub.status,
          cancel_at_period_end: sub.cancel_at_period_end ?? false,
          trial_start: sub.trial_start ? new Date(sub.trial_start * 1000).toISOString() : null,
          trial_end: sub.trial_end ? new Date(sub.trial_end * 1000).toISOString() : null,
          current_period_start: periodStart ? new Date(periodStart * 1000).toISOString() : null,
          current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
        }, { onConflict: 'stripe_subscription_id', count: 'exact' })
      )
      break
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription
      const customer = await stripe.customers.retrieve(sub.customer as string) as Stripe.Customer
      const userId = customer.metadata?.supabase_user_id
      if (!userId) break

      reportWrite(
        'customer.subscription.deleted: profiles.subscription_status',
        await supabase
          .from('profiles')
          .update({ subscription_status: 'canceled' }, { count: 'exact' })
          .eq('id', userId)
      )

      reportWrite(
        'customer.subscription.deleted: subscriptions.status',
        await supabase
          .from('subscriptions')
          .update({
            status: 'canceled',
            canceled_at: new Date().toISOString(),
          }, { count: 'exact' })
          .eq('stripe_subscription_id', sub.id)
      )

      const email = await getUserEmail(userId)

      if (email) {
        const subAny = sub as any
        const endDate = subAny.current_period_end
          ? new Date(subAny.current_period_end * 1000).toLocaleDateString('de-AT', {
              day: '2-digit', month: '2-digit', year: 'numeric'
            })
          : ''
        await sendAboGekuendigtEmail(email, endDate)
      }
      break
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice
      const customer = await stripe.customers.retrieve(invoice.customer as string) as Stripe.Customer
      const userId = customer.metadata?.supabase_user_id
      if (!userId) break

      reportWrite(
        'invoice.payment_failed: profiles.subscription_status',
        await supabase
          .from('profiles')
          .update({ subscription_status: 'past_due' }, { count: 'exact' })
          .eq('id', userId)
      )

      const email = await getUserEmail(userId)

      if (email) {
        await sendZahlungFehlgeschlagenEmail(email)
      }
      break
    }

    // SEPA-Zahlungen sind acht Wochen ohne Angabe von Gruenden anfechtbar und
    // werden dann automatisch anerkannt. Stripe aendert dabei den Abo-Status
    // NICHT -- ohne diesen Zweig behielte der Kunde seinen Zugang.
    case 'charge.dispute.created': {
      await handleDisputeCreated(event.data.object as Stripe.Dispute)
      break
    }

    case 'charge.dispute.closed': {
      await handleDisputeClosed(event.data.object as Stripe.Dispute)
      break
    }

    // Storniertes SEPA-Mandat oder widerrufene PayPal-Vereinbarung.
    case 'mandate.updated': {
      await handleMandateUpdated(event.data.object as Stripe.Mandate)
      break
    }

    case 'customer.subscription.trial_will_end': {
      const sub = event.data.object as Stripe.Subscription
      const customer = await stripe.customers.retrieve(sub.customer as string) as Stripe.Customer
      const userId = customer.metadata?.supabase_user_id
      if (!userId) break

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('age_verified')
        .eq('id', userId)
        .single()

      if (profileError) {
        console.error(
          'customer.subscription.trial_will_end: profile lookup failed -',
          profileError.message
        )
      }

      const email = await getUserEmail(userId)

      const endDate = sub.trial_end
        ? new Date(sub.trial_end * 1000).toLocaleDateString('de-AT', {
            day: '2-digit', month: '2-digit', year: 'numeric'
          })
        : ''

      // Ohne Altersverifikation darf die Testphase nicht in ein bezahltes Abo
      // kippen: wir duerften die Inhalte gar nicht ausliefern. Stripe feuert
      // dieses Ereignis drei Tage vor Ablauf -- der einzige Haken vor der
      // ersten Abbuchung. Danach waere nur noch eine Erstattung moeglich.
      if (!profile?.age_verified) {
        await cancelUnverifiedTrial(sub)

        if (email) {
          await sendVerifikationAusstehendEmail(email, endDate)
        }
        break
      }

      if (email && sub.trial_end) {
        await sendTestphaseEndetEmail(email, endDate)
      }
      break
    }
  }

  return NextResponse.json({ received: true })
}
