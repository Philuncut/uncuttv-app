import { NextResponse } from 'next/server'
import { createAdminClient, reportWrite } from '@/lib/supabase/admin'
import { reactivateUserCancellation } from '@/lib/subscriptions'
import { ACCESS_GRANTING_STATUSES } from '@/lib/access'

/**
 * Nimmt eine vorgemerkte Kuendigung zurueck: setzt cancel_at_period_end
 * wieder auf false.
 *
 * Die massgebliche Pruefung, ob die Kuendigung vom Nutzer stammt oder von der
 * Altersverifikation, passiert in reactivateUserCancellation() gegen die
 * Stripe-Metadaten. Die Kontoseite entscheidet nur, was sie anzeigt -- hier
 * liegt die Grenze, die haelt.
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
      .select('stripe_subscription_id')
      .eq('user_id', user.id)
      .in('status', ACCESS_GRANTING_STATUSES)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!subscription?.stripe_subscription_id) {
      return NextResponse.json({ error: 'no_subscription' }, { status: 404 })
    }

    const result = await reactivateUserCancellation(subscription.stripe_subscription_id)

    if (result === 'age_gated') {
      return NextResponse.json({ error: 'age_verification_required' }, { status: 409 })
    }
    if (result === 'error') {
      return NextResponse.json({ error: 'stripe_failed' }, { status: 500 })
    }

    // Auch bei 'not_cancelled' den Datenbankstand angleichen: dann stand dort
    // ein Wert, den Stripe so nicht kennt.
    reportWrite(
      'reactivate-subscription: subscriptions.cancel_at_period_end',
      await admin
        .from('subscriptions')
        .update({ cancel_at_period_end: false }, { count: 'exact' })
        .eq('stripe_subscription_id', subscription.stripe_subscription_id)
    )

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('reactivate-subscription error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
