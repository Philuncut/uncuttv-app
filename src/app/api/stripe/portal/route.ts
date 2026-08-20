import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { locales, defaultLocale, type Locale } from '@/i18n/config'
import { siteUrl } from '@/lib/env'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-02-25.clover' })

/** Locale kommt vom Aufrufer und wird deshalb gegen die Whitelist geprueft. */
function resolveLocale(value: unknown): Locale {
  return typeof value === 'string' && (locales as readonly string[]).includes(value)
    ? (value as Locale)
    : defaultLocale
}

export async function POST(request: Request) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const authHeader = request.headers.get('Authorization')
    if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error } = await supabase.auth.getUser(token)
    if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json().catch(() => null)
    const locale = resolveLocale((body as { locale?: unknown } | null)?.locale)

    // Bewusst OHNE Statusfilter: gerade Kunden mit past_due muessen ins
    // Portal, um genau das zu reparieren. Die stripe_customer_id ist ueber
    // alle Zeilen eines Nutzers identisch, die neueste genuegt.
    //
    // maybeSingle() statt single(): wer schon einmal gekuendigt und neu
    // abgeschlossen hat, hat mehrere Zeilen -- single() wirft dann und die
    // Route antwortete mit 404 ausgerechnet bei Kunden mit Abo-Historie.
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!subscription?.stripe_customer_id) {
      return NextResponse.json({ error: 'No subscription found' }, { status: 404 })
    }

    // Ohne `configuration` nimmt Stripe die Standard-Konfiguration des
    // jeweiligen Modus. Eine fest verdrahtete bpc_-ID existiert nur in dem
    // Modus, in dem sie angelegt wurde, und bricht beim Moduswechsel.
    const session = await stripe.billingPortal.sessions.create({
      customer: subscription.stripe_customer_id,
      return_url: `${siteUrl()}/${locale}/account`,
    })

    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error('Portal error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
