import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const SESSION_TIMEOUT_SECONDS = 60
const MAX_CONCURRENT_SESSIONS = 1

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { session_id, film_id, action } = await req.json()

  // Ping – Session am Leben halten
  if (action === 'ping') {
    await supabase
      .from('active_sessions')
      .update({ last_ping: new Date().toISOString() })
      .eq('user_id', user.id)
      .eq('session_id', session_id)
    return NextResponse.json({ ok: true })
  }

  // Start – prüfen ob bereits aktive Session existiert
  if (action === 'start') {
    const cutoff = new Date(Date.now() - SESSION_TIMEOUT_SECONDS * 1000).toISOString()

    const { data: activeSessions } = await supabase
      .from('active_sessions')
      .select('id, session_id')
      .eq('user_id', user.id)
      .gt('last_ping', cutoff)
      .neq('session_id', session_id)

    if (activeSessions && activeSessions.length >= MAX_CONCURRENT_SESSIONS) {
      return NextResponse.json({ error: 'concurrent_limit', message: 'Dieses Konto wird bereits auf einem anderen Gerät verwendet.' }, { status: 403 })
    }

    // Alte abgelaufene Sessions aufräumen
    await supabase
      .from('active_sessions')
      .delete()
      .eq('user_id', user.id)
      .lt('last_ping', cutoff)

    // Neue Session registrieren
    await supabase.from('active_sessions').upsert({
      user_id: user.id,
      session_id,
      film_id,
      last_ping: new Date().toISOString(),
    }, { onConflict: 'session_id' })

    return NextResponse.json({ ok: true })
  }

  // End – Session beenden
  if (action === 'end') {
    await supabase
      .from('active_sessions')
      .delete()
      .eq('user_id', user.id)
      .eq('session_id', session_id)
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}
