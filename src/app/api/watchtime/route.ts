import { NextRequest, NextResponse } from 'next/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import { resolveRequestUser } from '@/lib/api-auth'

/**
 * Obergrenze fuer eine einzelne Buchung, in Sekunden.
 *
 * Im Normalbetrieb greift sie nie -- die Clients pingen alle 10 bis 12
 * Sekunden. Sie begrenzt den Schaden, wenn Pings ausgefallen sind: nach einer
 * langen Luecke wird nicht die ganze Luecke gutgeschrieben.
 */
const MAX_BOOKABLE_SECONDS = 60

/**
 * Schreibt ein Ereignis ins Journal public.watchtime_events.
 *
 * Gebucht wird die tatsaechlich abgespielte Zeit seit dem vorigen Ping, nicht
 * die Position. Zwei Wege:
 *
 * 1. Der Client sendet played_seconds -- seine selbst mitgezaehlte
 *    Abspieldauer. Das ist der genaue Weg, siehe docs/watchtime-abrechnung.md.
 * 2. Der Client sendet nur die Position. Dann wird die Differenz zur Position
 *    des letzten Ereignisses gebildet.
 *
 * In beiden Faellen wird gedeckelt:
 * - negativ (Zurueckspulen, Neustart, Sitzungsbeginn) -> 0
 * - hoechstens die seit dem letzten Ereignis verstrichene Uhrzeit. Mehr als
 *   die Wanduhr kann niemand abgespielt haben, also erzeugt Vorspulen keine
 *   Watchtime -- unabhaengig davon, mit welchem Ping-Intervall der jeweilige
 *   Client arbeitet, und ohne dass ein Client sich seine Sekunden ausdenken
 *   kann.
 * - hoechstens MAX_BOOKABLE_SECONDS.
 *
 * Es wird auch dann eine Zeile geschrieben, wenn 0 Sekunden herauskommen: die
 * Zeile traegt die neue Position und ist der Anker fuer den naechsten Ping.
 * Ohne sie wuerde nach einem Ruecksprung gegen eine veraltete Position
 * gerechnet.
 *
 * Wirft nicht. Das Journal ist fuer die Abrechnung, nicht fuer die
 * Wiedergabe -- schlaegt es fehl, darf der Nutzer davon nichts merken und
 * "Weiterschauen" muss trotzdem gespeichert sein. Auch der Fall, dass die
 * Migration noch nicht eingespielt ist, laeuft hier durch.
 */
async function recordWatchtimeEvent(params: {
  admin: SupabaseClient
  userId: string
  filmId: string
  position: number
  playedSeconds: number | null
}) {
  const { admin, userId, filmId, position, playedSeconds } = params

  try {
    const { data: previous } = await admin
      .from('watchtime_events')
      .select('occurred_at, position_seconds')
      .eq('user_id', userId)
      .eq('film_id', filmId)
      .order('occurred_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    let seconds = 0

    if (previous) {
      const elapsed = Math.floor((Date.now() - new Date(previous.occurred_at).getTime()) / 1000)
      const ceiling = Math.max(0, Math.min(elapsed, MAX_BOOKABLE_SECONDS))

      const raw =
        playedSeconds != null
          ? playedSeconds
          : previous.position_seconds != null
            ? position - previous.position_seconds
            : 0

      seconds = Math.max(0, Math.min(Math.floor(raw), ceiling))
    }
    // Ohne Vorgaenger bleibt es bei 0: wie lange vor dem ersten Ping gespielt
    // wurde, ist nicht bekannt. Die Zeile setzt nur den Anker.

    await admin.from('watchtime_events').insert({
      user_id: userId,
      film_id: filmId,
      seconds,
      position_seconds: position,
    })
  } catch (e) {
    console.error('[watchtime_events] nicht geschrieben:', e)
  }
}


/** Persist playback progress / completion. Client sends position every ~12s and at 90% / ended. */
export async function POST(request: NextRequest) {
  try {
    // Cookie-Sitzung (Web) oder Bearer-Token (Fire TV, Google Play, webOS).
    // Die Nutzer-ID kommt ausschliesslich von hier, nie aus dem Koerper --
    // die Begruendung steht in lib/api-auth.ts.
    const { user, admin } = await resolveRequestUser(request, 'watchtime')
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let body: {
      film_id?: string
      last_position?: number
      duration_seconds?: number
      completed?: boolean
      /**
       * Selbst mitgezaehlte Abspieldauer seit dem letzten Ping. Optional --
       * sendet ein Client sie nicht, wird die Differenz aus der Position
       * gebildet. Siehe recordWatchtimeEvent.
       */
      played_seconds?: number
    }
    try {
      body = await request.json()
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

    const { data: existing, error: selErr } = await admin
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
      const { error: upErr } = await admin.from('watchtime').update(payload).eq('id', existing.id)
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
      const { error: insErr } = await admin.from('watchtime').insert(insertRow)
      if (insErr) {
        console.error('watchtime insert:', insErr)
        return NextResponse.json({ error: insErr.message }, { status: 500 })
      }
    }

    // Journal fuer die Ausschuettung. Bewusst NACH dem Upsert und bewusst
    // getrennt davon: das hier oben ist "Weiterschauen" und darf nicht davon
    // abhaengen, dass die Abrechnung durchgeht.
    const playedSeconds =
      body.played_seconds != null && Number.isFinite(Number(body.played_seconds))
        ? Math.max(0, Math.floor(Number(body.played_seconds)))
        : null

    await recordWatchtimeEvent({
      admin,
      userId: user.id,
      filmId,
      position: lp,
      playedSeconds,
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[watchtime] error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
