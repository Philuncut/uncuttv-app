import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Mux from '@mux/mux-node'
import { userHasVoucherForFilm } from '@/lib/vouchers'

const mux = new Mux({
  tokenId: process.env.MUX_TOKEN_ID!,
  tokenSecret: process.env.MUX_TOKEN_SECRET!,
})

export async function GET(req: NextRequest) {
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