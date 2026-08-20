import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createAdminClient, reportWrite } from '@/lib/supabase/admin'
import { ACCESS_GRANTING_STATUSES } from '@/lib/access'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-02-25.clover' })

/**
 * Kuendigung aus dem eingeloggten Konto: setzt cancel_at_period_end auf dem
 * Abo. Der Zugang bleibt bis zum Ende der bezahlten Periode bestehen.
 *
 * Anders als /api/cancellation fuehrt diese Route tatsaechlich aus -- der
 * Aufrufer weist sich mit einem gueltigen Token aus, die Identitaet steht
 * also fest.
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

    const { data: subscription } = await admin
      .from('subscriptions')
      .select('stripe_subscription_id, current_period_end, trial_end')
      .eq('user_id', user.id)
      .in('status', ACCESS_GRANTING_STATUSES)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!subscription?.stripe_subscription_id) {
      return NextResponse.json({ error: 'No active subscription' }, { status: 404 })
    }

    // WICHTIG: hier wird KEIN metadata.age_gate_cancel gesetzt. Diese
    // Markierung ist der automatischen Kuendigung bei fehlender
    // Altersverifikation vorbehalten -- restoreAgeGatedSubscription() nimmt
    // markierte Kuendigungen bei einer spaeteren Verifikation zurueck und
    // wuerde sonst eine Eigenkuendigung des Nutzers wieder aufheben.
    const updated = await stripe.subscriptions.update(subscription.stripe_subscription_id, {
      cancel_at_period_end: true,
    })

    // Der Webhook schreibt denselben Zustand gleich noch einmal. Hier wird er
    // sofort gesetzt, damit die neu geladene Kontoseite die Kuendigung zeigt,
    // ohne auf das Stripe-Ereignis zu warten.
    reportWrite(
      'cancel-subscription: subscriptions.cancel_at_period_end',
      await admin
        .from('subscriptions')
        .update({ cancel_at_period_end: true }, { count: 'exact' })
        .eq('stripe_subscription_id', subscription.stripe_subscription_id)
    )

    const updatedAny = updated as unknown as { current_period_end?: number }
    const accessUntil = updatedAny.current_period_end
      ? new Date(updatedAny.current_period_end * 1000).toISOString()
      : (subscription.current_period_end ?? subscription.trial_end ?? null)

    return NextResponse.json({ ok: true, accessUntil })
  } catch (err) {
    console.error('cancel-subscription error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
