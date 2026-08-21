import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import Stripe from 'stripe'
import { resolveRequestUser } from '@/lib/api-auth'
import { ACCESS_GRANTING_STATUSES } from '@/lib/access'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-02-25.clover' })

/**
 * Abo-Status, die eine Kontoloeschung blockieren -- und wie.
 *
 * active und trialing: laufendes Vertragsverhaeltnis. Ein bereits
 * gekuendigtes Abo (cancel_at_period_end) blockiert hier NICHT -- es kommt
 * keine weitere Abbuchung, und der Nutzer hat den Kuendigungsweg ja gerade
 * beschritten. Wuerde es weiter blockieren, koennte er nach dem Kuendigen
 * bis zu einem Monat lang nicht loeschen; genau das soll die Sperre nicht
 * bewirken.
 *
 * past_due: sperrt IMMER, auch bei cancel_at_period_end. Nicht als
 * Inkassomassnahme, sondern aus derselben Logik wie bei active -- das Abo
 * laeuft bei Stripe weiter und es stehen Zahlungsversuche an. Wer jetzt
 * loescht, erzeugt genau den Zustand, den diese Sperre verhindern soll:
 * Abbuchungen ohne Konto, dem sie zuzuordnen waeren.
 *
 * unpaid und canceled sperren nicht: dort versucht Stripe nichts mehr.
 */
const BLOCKING_STATUSES: string[] = [...ACCESS_GRANTING_STATUSES]
const ALWAYS_BLOCKING_STATUSES: string[] = ['past_due']

/**
 * Loescht das Konto des angemeldeten Nutzers.
 *
 * === Reihenfolge und Grundsatz ===
 * Erst pruefen, dann Daten, zuletzt das auth-Konto. Jeder Schritt wird
 * geprueft; schlaegt einer fehl, bricht die Route ab und das auth-Konto
 * bleibt bestehen. Lieber ein Konto zu viel als verwaiste Zeilen und ein
 * ok:true, dem nichts entspricht -- ein Nutzer, dessen Loeschung scheitert,
 * kann es erneut versuchen; verwaiste Zeilen findet niemand wieder.
 *
 * === Was NICHT passiert ===
 * Es wird nichts bei Stripe gekuendigt und nichts erstattet. Ein laufendes
 * Abo blockiert die Loeschung stattdessen (409). Die Kuendigung ist ein
 * eigener, bewusster Schritt mit eigener Bestaetigung -- sie nebenbei aus
 * einer Loeschroutine auszuloesen, waere fuer den Nutzer nicht nachvollziehbar
 * und fuer uns nicht belegbar.
 */
export async function POST(request: NextRequest) {
  const { user, admin } = await resolveRequestUser(request, 'account/delete')
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // ── 1. Laufendes Abo blockiert ─────────────────────────────────────────
  //
  // Stripe ist die Wahrheit, nicht die gespiegelte Tabelle: der Webhook kann
  // hinterherhinken, und beim Loeschen eines Kontos ist ein veralteter
  // Spiegel der teuerste denkbare Irrtum.
  const { data: subs, error: subErr } = await admin
    .from('subscriptions')
    .select('stripe_customer_id, stripe_subscription_id, status')
    .eq('user_id', user.id)

  if (subErr) {
    console.error('account/delete: subscriptions lesen:', subErr.message)
    return NextResponse.json({ error: 'delete_failed' }, { status: 500 })
  }

  const customerIds = [...new Set((subs ?? []).map((s) => s.stripe_customer_id).filter(Boolean))]

  for (const customerId of customerIds) {
    let liste
    try {
      liste = await stripe.subscriptions.list({
        customer: customerId as string,
        status: 'all',
        limit: 100,
      })
    } catch (e) {
      // Nicht erreichbar heisst nicht "kein Abo". Im Zweifel blockieren --
      // sonst loescht sich jemand waehrend einer Stripe-Stoerung das Konto
      // weg und zahlt weiter.
      console.error('account/delete: Stripe nicht erreichbar:', e)
      return NextResponse.json({ error: 'subscription_check_failed' }, { status: 503 })
    }

    const offeneZahlung = liste.data.find((s) => ALWAYS_BLOCKING_STATUSES.includes(s.status))
    if (offeneZahlung) {
      return NextResponse.json(
        { error: 'subscription_past_due', status: offeneZahlung.status },
        { status: 409 }
      )
    }

    const laufend = liste.data.find(
      (s) => BLOCKING_STATUSES.includes(s.status) && !s.cancel_at_period_end
    )
    if (laufend) {
      return NextResponse.json(
        { error: 'subscription_active', status: laufend.status },
        { status: 409 }
      )
    }
  }

  // ── 2. Journal pseudonymisieren ────────────────────────────────────────
  //
  // public.watchtime_events ist die Grundlage der Ausschuettung an die
  // Rechteinhaber und wird deshalb NICHT geloescht. Stattdessen wird die
  // user_id durch einen Zufallswert ersetzt.
  //
  // ERLAUBT IST AUSSCHLIESSLICH DAS ERSETZEN VON user_id. seconds,
  // occurred_at, film_id und position_seconds bleiben unangetastet -- sonst
  // waere die Tabelle keine Abrechnungsgrundlage mehr. Das ist die einzige
  // Ausnahme vom Append-only-Grundsatz dieser Tabelle.
  //
  // Ein Wert je Loeschvorgang, nicht je Zeile: sonst zerfiele jede Sichtung
  // in unverbundene Einzelzeilen und die Frage "wie viele Zuschauer hatte
  // dieser Film" waere nicht mehr zu beantworten.
  //
  // randomUUID() und nicht etwa ein Hash der alten ID: aus einem Hash liesse
  // sich die Zugehoerigkeit durch Nachrechnen wiederherstellen, sobald man
  // die alte ID kennt -- das waere keine Pseudonymisierung.
  //
  // Warum ueberhaupt ersetzen, wo doch auth.users gleich geloescht wird und
  // die alte ID danach ins Leere zeigt: Sicherungen von auth.users bilden die
  // alte ID weiterhin auf eine E-Mail-Adresse ab. Das Ersetzen kappt genau
  // diese Verbindung.
  const pseudonym = randomUUID()
  const { error: pseudoErr, count: pseudoCount } = await admin
    .from('watchtime_events')
    .update({ user_id: pseudonym }, { count: 'exact' })
    .eq('user_id', user.id)

  if (pseudoErr) {
    console.error('account/delete: watchtime_events pseudonymisieren:', pseudoErr.message)
    return NextResponse.json({ error: 'delete_failed' }, { status: 500 })
  }

  // Dasselbe Pseudonym fuer eingeloeste Gutscheine.
  //
  // Bewusst NICHT auf NULL: checkVoucher in lib/vouchers.ts liest
  // `if (voucher.used_by)` und haelt den Code damit fuer unbenutzt. Ein NULL
  // machte den Gutschein wieder einloesbar -- also eine Sicherheitsluecke
  // anstelle einer Datenschutzverbesserung. Der Code bleibt verbraucht, nur
  // die Person wird abgetrennt.
  //
  // created_by bleibt unberuehrt: das ist, wer den Gutschein ausgegeben hat,
  // nicht wer ihn eingeloest hat.
  const { error: voucherErr, count: voucherCount } = await admin
    .from('vouchers')
    .update({ used_by: pseudonym }, { count: 'exact' })
    .eq('used_by', user.id)

  if (voucherErr) {
    console.error('account/delete: vouchers pseudonymisieren:', voucherErr.message)
    return NextResponse.json({ error: 'delete_failed' }, { status: 500 })
  }

  // Protokoll. Die alte ID steht bewusst NICHT darin -- sie zusammen mit dem
  // Pseudonym zu notieren, waere die Zuordnung, die gerade aufgeloest wurde.
  // Dass ein Pseudonym zu einem geloeschten Konto gehoert, erkennt man daran,
  // dass es in auth.users nicht vorkommt.
  console.info(
    `account/delete: pseudonymisiert -- watchtime_events ${pseudoCount ?? 0} Zeilen, ` +
      `vouchers ${voucherCount ?? 0} Zeilen, Pseudonym ${pseudonym}`
  )

  // ── 3. Daten loeschen ──────────────────────────────────────────────────
  //
  // Reihenfolge ist hier egal -- es gibt keine Fremdschluessel zwischen
  // diesen Tabellen. Wichtig ist nur, dass alles vor dem auth-Konto passiert.
  const zuLoeschen: { tabelle: string; spalte: string }[] = [
    // Nur "Weiterschauen", ein Momentanzustand ohne Abrechnungsbezug.
    { tabelle: 'watchtime', spalte: 'user_id' },
    // Laufende Streams. Ein Rest verfaelscht die Parallelstream-Zaehlung.
    { tabelle: 'active_sessions', spalte: 'user_id' },
    // Kurzlebige Rueksetz-Token. Ein Rest waere ein offener Rueksetzpfad.
    { tabelle: 'pin_reset_codes', spalte: 'user_id' },
    // Der gespiegelte Abo-Zustand. Das Abo selbst ist beendet, sonst waeren
    // wir oben mit 409 ausgestiegen.
    { tabelle: 'subscriptions', spalte: 'user_id' },
    { tabelle: 'profiles', spalte: 'id' },
  ]

  for (const { tabelle, spalte } of zuLoeschen) {
    const { error } = await admin.from(tabelle).delete().eq(spalte, user.id)
    if (error) {
      console.error(`account/delete: ${tabelle} loeschen:`, error.message)
      return NextResponse.json({ error: 'delete_failed', step: tabelle }, { status: 500 })
    }
  }

  // ── 4. auth-Konto zuletzt ──────────────────────────────────────────────
  const { error: authErr } = await admin.auth.admin.deleteUser(user.id)
  if (authErr) {
    console.error('account/delete: auth-Konto loeschen:', authErr.message)
    return NextResponse.json({ error: 'delete_failed', step: 'auth' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
