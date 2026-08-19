import Stripe from 'stripe'
import { createAdminClient } from '@/lib/supabase/admin'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

/**
 * Markiert eine Kuendigung, die WIR wegen fehlender Altersverifikation
 * gesetzt haben. Ohne diese Markierung liesse sich nicht unterscheiden, ob
 * cancel_at_period_end von uns stammt oder ob der Nutzer selbst gekuendigt
 * hat -- und eine spaetere Verifikation wuerde eine bewusst beendete
 * Mitgliedschaft wiederbeleben.
 */
const AGE_GATE_FLAG = 'age_gate_cancel'

/**
 * Beendet ein Probeabo zum Ende der Testphase, statt es kostenpflichtig
 * werden zu lassen.
 *
 * Wird aus customer.subscription.trial_will_end aufgerufen -- das ist der
 * einzige Haken vor der ersten Abbuchung. Danach ist die Karte belastet und
 * es bliebe nur noch eine Erstattung.
 */
export async function cancelUnverifiedTrial(subscription: Stripe.Subscription): Promise<boolean> {
  if (subscription.cancel_at_period_end) return true

  try {
    await stripe.subscriptions.update(subscription.id, {
      cancel_at_period_end: true,
      metadata: { ...(subscription.metadata ?? {}), [AGE_GATE_FLAG]: 'true' },
    })
    return true
  } catch (error) {
    console.error('cancelUnverifiedTrial: stripe update failed -', error)
    return false
  }
}

/**
 * Nimmt eine wegen fehlender Verifikation gesetzte Kuendigung zurueck,
 * sobald das Alter bestaetigt ist.
 *
 * Greift nur, wenn die Markierung gesetzt ist: Hat der Nutzer selbst
 * gekuendigt, bleibt die Kuendigung bestehen.
 */
export async function restoreAgeGatedSubscription(userId: string): Promise<void> {
  const admin = createAdminClient()

  const { data: rows, error } = await admin
    .from('subscriptions')
    .select('stripe_subscription_id')
    .eq('user_id', userId)
    .in('status', ['trialing', 'active'])
    .limit(5)

  if (error) {
    console.error('restoreAgeGatedSubscription: lookup failed -', error.message)
    return
  }
  if (!rows?.length) return

  for (const row of rows) {
    const subscriptionId = row.stripe_subscription_id
    if (!subscriptionId) continue

    try {
      const subscription = await stripe.subscriptions.retrieve(subscriptionId)

      if (!subscription.cancel_at_period_end) continue
      if (subscription.metadata?.[AGE_GATE_FLAG] !== 'true') continue

      await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: false,
        // Leerer Wert loescht den Schluessel bei Stripe.
        metadata: { [AGE_GATE_FLAG]: '' },
      })

      console.info('restoreAgeGatedSubscription: reinstated', subscriptionId)
    } catch (stripeError) {
      console.error('restoreAgeGatedSubscription: stripe call failed -', stripeError)
    }
  }
}
