import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Mux from '@mux/mux-node'
import { userHasVoucherForFilm } from '@/lib/vouchers'
import { createClient as createAdminClient } from '@supabase/supabase-js'

const mux = new Mux({
  tokenId: process.env.MUX_TOKEN_ID!,
  tokenSecret: process.env.MUX_TOKEN_SECRET!,
})

function normalizeCountryArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.map(String).map((v) => v.trim()).filter(Boolean)
}

function isFilmAllowedForCountry(film: { allowed_in?: unknown; blocked_in?: unknown }, country: string): boolean {
  if (!country) return true
  const allowedIn = normalizeCountryArray(film.allowed_in)
  const blockedIn = normalizeCountryArray(film.blocked_in)

  // New logic:
  // - If allowed_in is not empty AND country is NOT in allowed_in → block
  // - If allowed_in is empty → fall back to blocked_in logic (country in blocked_in → block)
  // - If both are empty → allow
  if (allowedIn.length > 0) return allowedIn.includes(country)
  if (blockedIn.length > 0) return !blockedIn.includes(country)
  return true
}

export async function GET(req: NextRequest) {
  const country = req.headers.get('x-vercel-ip-country') ?? ''

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_status')
    .eq('id', user.id)
    .single()

  const activeStatuses = ['active', 'trialing']
  const hasSubscription = profile && activeStatuses.includes(profile.subscription_status)

  const playbackId = req.nextUrl.searchParams.get('playbackId')
  const filmId = req.nextUrl.searchParams.get('filmId')

  if (!playbackId) {
    return NextResponse.json({ error: 'Missing playbackId' }, { status: 400 })
  }

  // Territory geoblocking (server-side, prevents geo bypass via direct token calls)
  if (filmId && country) {
    const admin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: film } = await admin
      .from('films')
      .select('id, allowed_in, blocked_in')
      .eq('id', filmId)
      .maybeSingle()

    if (!film) {
      return NextResponse.json({ error: 'Film not found' }, { status: 403 })
    }

    if (!isFilmAllowedForCountry(film, country)) {
      return NextResponse.json({ error: 'No access in your territory' }, { status: 403 })
    }
  }

  if (!hasSubscription) {
    if (!filmId) {
      return NextResponse.json({ error: 'No active subscription' }, { status: 403 })
    }
    const hasVoucher = await userHasVoucherForFilm(user.id, filmId)
    if (!hasVoucher) {
      return NextResponse.json({ error: 'No access' }, { status: 403 })
    }
  }

  const token = await mux.jwt.signPlaybackId(playbackId, {
    keyId: process.env.MUX_SIGNING_KEY_ID!,
    keySecret: process.env.MUX_SIGNING_PRIVATE_KEY!,
    expiration: '6h',
    type: 'video',
  })

  return NextResponse.json({ token })
}