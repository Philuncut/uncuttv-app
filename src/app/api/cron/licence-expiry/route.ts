import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendInternNotification } from '@/lib/emails'

/**
 * Taeglicher Lauf ueber die Filmlizenzen.
 *
 * Zwei Schritte, bewusst getrennt:
 *
 *   1. run_licence_expiry_scan() nimmt abgelaufene Filme aus der Auslieferung
 *      und MELDET faellige Vorwarnungen -- ohne sie zu stempeln.
 *   2. mark_expiry_notified() stempelt sie, aber erst nachdem die Mail
 *      tatsaechlich draussen ist.
 *
 * Vorher stempelte die Datenbank im selben Aufruf. Schlug der Mailversand
 * danach fehl, galt die Warnung als verschickt und tauchte nie wieder auf --
 * der Film lief still aus. Jetzt bleibt sie ungestempelt und kommt morgen
 * wieder.
 *
 * Das Stilllegen abgelaufener Filme haengt bewusst NICHT am Mailversand: ein
 * abgelaufener Film darf nicht weiterlaufen, nur weil Resend gerade nicht
 * erreichbar ist.
 */

export const dynamic = 'force-dynamic'

type Vorgang = {
  aktion: 'abgelaufen' | 'vorwarnung'
  license_id: string
  film_id: string
  film_titel: string
  rechteinhaber: string
  ends_on: string
  tage_bis_ablauf: number
}

function datum(iso: string): string {
  const [j, m, t] = iso.split('-')
  return `${t}.${m}.${j}`
}

export async function GET(req: Request) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()

  // ── Schritt 1 ────────────────────────────────────────────────────────────
  const { data, error } = await admin.rpc('run_licence_expiry_scan', {
    p_vorwarnung_tage: 21,
  })

  if (error) {
    console.error('licence-expiry: scan fehlgeschlagen -', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const vorgaenge = (data ?? []) as Vorgang[]
  const warnungen = vorgaenge.filter((v) => v.aktion === 'vorwarnung')
  const abgelaufen = vorgaenge.filter((v) => v.aktion === 'abgelaufen')

  if (vorgaenge.length === 0) {
    return NextResponse.json({ ok: true, vorwarnungen: 0, abgelaufen: 0 })
  }

  // ── Mail ─────────────────────────────────────────────────────────────────
  const rows = [
    ...warnungen.map((v) => ({
      label: `Läuft ab · ${datum(v.ends_on)}`,
      value: `${v.film_titel} — ${v.rechteinhaber} — noch ${v.tage_bis_ablauf} Tage`,
    })),
    ...abgelaufen.map((v) => ({
      label: `Abgelaufen · ${datum(v.ends_on)}`,
      value: `${v.film_titel} — ${v.rechteinhaber} — aus der Auslieferung genommen`,
    })),
  ]

  const teile: string[] = []
  if (warnungen.length) teile.push(`${warnungen.length} laufen bald ab`)
  if (abgelaufen.length) teile.push(`${abgelaufen.length} abgelaufen`)

  const { error: mailFehler } = await sendInternNotification(
    `Lizenzen: ${teile.join(', ')}`,
    'Lizenzen laufen aus',
    abgelaufen.length
      ? 'Abgelaufene Titel wurden bereits aus der Auslieferung genommen. Verlängern im Steuerpult unter Verträge → Ablauf & Mitgliedschaft.'
      : 'Verlängern im Steuerpult unter Verträge → Ablauf & Mitgliedschaft.',
    rows
  )

  // Ohne zugestellte Mail wird NICHT gestempelt -- die Warnung bleibt faellig
  // und kommt im naechsten Lauf wieder. 500, damit der Fehlschlag im
  // Vercel-Log auftaucht statt still zu verschwinden.
  if (mailFehler) {
    console.error('licence-expiry: Mailversand fehlgeschlagen -', mailFehler.message)
    return NextResponse.json(
      {
        ok: false,
        schritt: 'mail',
        fehler: mailFehler.message,
        vorwarnungen: warnungen.length,
        abgelaufen: abgelaufen.length,
        gestempelt: 0,
      },
      { status: 500 }
    )
  }

  // ── Schritt 2 ────────────────────────────────────────────────────────────
  let gestempelt = 0
  if (warnungen.length > 0) {
    const { data: anzahl, error: stempelFehler } = await admin.rpc('mark_expiry_notified', {
      p_ids: warnungen.map((v) => v.license_id),
    })

    if (stempelFehler) {
      // Die Mail ist raus, der Stempel fehlt. Das ist der harmlosere der
      // beiden Fehler: morgen kommt dieselbe Warnung noch einmal. Trotzdem
      // 500, damit es nicht unbemerkt bleibt.
      console.error('licence-expiry: Stempeln fehlgeschlagen -', stempelFehler.message)
      return NextResponse.json(
        {
          ok: false,
          schritt: 'stempel',
          fehler: stempelFehler.message,
          hinweis: 'Mail wurde verschickt, Vorwarnung bleibt faellig und wiederholt sich morgen.',
          vorwarnungen: warnungen.length,
          abgelaufen: abgelaufen.length,
          gestempelt: 0,
        },
        { status: 500 }
      )
    }

    gestempelt = (anzahl as number) ?? 0
  }

  return NextResponse.json({
    ok: true,
    vorwarnungen: warnungen.length,
    abgelaufen: abgelaufen.length,
    gestempelt,
  })
}
