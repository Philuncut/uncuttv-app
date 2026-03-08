import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Mux from '@mux/mux-node'

const mux = new Mux({
  tokenId: process.env.MUX_TOKEN_ID!,
  tokenSecret: process.env.MUX_TOKEN_SECRET!,
})

export async function GET(req: NextRequest) {
  // Nur eingeloggte User mit aktivem Abo
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
  if (!profile || !activeStatuses.includes(profile.subscription_status)) {
    return NextResponse.json({ error: 'No active subscription' }, { status: 403 })
  }

  const playbackId = req.nextUrl.searchParams.get('playbackId')
  if (!playbackId) {
    return NextResponse.json({ error: 'Missing playbackId' }, { status: 400 })
  }

  // Signed Token generieren – gültig für 6 Stunden
  const token = await mux.jwt.signPlaybackId(playbackId, {
    keyId: process.env.MUX_SIGNING_KEY_ID!,
    keySecret: process.env.MUX_SIGNING_PRIVATE_KEY!,
    expiration: '6h',
    type: 'video',
  })

  return NextResponse.json({ token })
}