import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/** Persist playback progress / completion. Client sends position every ~12s and at 90% / ended. */
export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let body: {
      film_id?: string
      last_position?: number
      duration_seconds?: number
      completed?: boolean
    }
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    const filmId = body.film_id
    if (!filmId || typeof filmId !== 'string') {
      return NextResponse.json({ error: 'film_id required' }, { status: 400 })
    }

    const lp = Math.max(0, Math.floor(Number(body.last_position) || 0))
    const ds =
      body.duration_seconds != null && Number.isFinite(Number(body.duration_seconds))
        ? Math.max(0, Math.floor(Number(body.duration_seconds)))
        : null

    const ratioComplete = ds != null && ds > 0 ? lp / ds : 0
    const markComplete =
      Boolean(body.completed) || ratioComplete >= 0.9

    const { data: existing, error: selErr } = await supabase
      .from('watchtime')
      .select('id, seconds_watched, last_position, completed')
      .eq('user_id', user.id)
      .eq('film_id', filmId)
      .maybeSingle()

    if (selErr) {
      console.error('watchtime select:', selErr)
      return NextResponse.json({ error: selErr.message }, { status: 500 })
    }

    const prevSeconds = Number((existing as { seconds_watched?: number } | null)?.seconds_watched ?? 0)
    const newSeconds = Math.max(prevSeconds, lp)
    const prevCompleted = Boolean((existing as { completed?: boolean } | null)?.completed)
    const finalCompleted = prevCompleted || markComplete
    const newLast = Math.max(
      lp,
      Math.floor(Number((existing as { last_position?: number } | null)?.last_position) || 0)
    )

    const now = new Date().toISOString()
    const payload = {
      last_position: newLast,
      seconds_watched: newSeconds,
      completed: finalCompleted,
      updated_at: now,
    }

    if (existing?.id) {
      const { error: upErr } = await supabase.from('watchtime').update(payload).eq('id', existing.id)
      if (upErr) {
        console.error('watchtime update:', upErr)
        return NextResponse.json({ error: upErr.message }, { status: 500 })
      }
    } else {
      const insertRow = {
        user_id: user.id,
        film_id: filmId,
        ...payload,
        watched_at: now,
      }
      const { error: insErr } = await supabase.from('watchtime').insert(insertRow)
      if (insErr) {
        console.error('watchtime insert:', insErr)
        return NextResponse.json({ error: insErr.message }, { status: 500 })
      }
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[watchtime] error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
