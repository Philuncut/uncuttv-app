import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, reportWrite } from '@/lib/supabase/admin'
import { sendKuendigungBestaetigungEmail, sendKuendigungInternEmail } from '@/lib/emails'
import type { CancellationSummary } from '@/lib/emails/kuendigung'
import { locales, defaultLocale, type Locale } from '@/i18n/config'

/**
 * Nimmt Kuendigungserklaerungen nach Paragraph 312k BGB entgegen.
 *
 * Bewusst OHNE Authentifizierung -- der Kuendigungsbutton muss ohne Login
 * erreichbar sein. Aus demselben Grund wird hier NICHTS an Stripe
 * weitergereicht: die Identitaet des Absenders ist ungeprueft, eine
 * automatische Ausfuehrung liesse Fremdkuendigungen ueber eine bekannte
 * E-Mail-Adresse zu. Die Erklaerung wird protokolliert und gemeldet, die
 * Ausfuehrung erfolgt manuell.
 */

const MAX_REASON_LENGTH = 5000

type Payload = {
  cancellationType?: unknown
  reason?: unknown
  contract?: unknown
  firstName?: unknown
  lastName?: unknown
  email?: unknown
  terminationType?: unknown
  terminationDate?: unknown
  locale?: unknown
}

function str(value: unknown, max = 200): string {
  return typeof value === 'string' ? value.trim().slice(0, max) : ''
}

function resolveLocale(value: unknown): Locale {
  return typeof value === 'string' && (locales as readonly string[]).includes(value)
    ? (value as Locale)
    : defaultLocale
}

function parseIp(forwardedFor: string | null): string | null {
  if (!forwardedFor) return null
  const first = forwardedFor.split(',')[0]?.trim()
  if (!first) return null
  const isIpv4 = /^\d{1,3}(\.\d{1,3}){3}$/.test(first)
  const isIpv6 = /^[0-9a-f:]+$/i.test(first) && first.includes(':')
  return isIpv4 || isIpv6 ? first : null
}

/** Beschriftungen fuer Mail und Protokoll -- in der Sprache der erklaerenden Person. */
const LABELS = {
  de: {
    type: 'Art der Kündigung',
    ordinary: 'Ordentliche Kündigung',
    extraordinary: 'Außerordentliche Kündigung',
    reason: 'Grund',
    contract: 'Vertrag',
    monthly: 'UncutTV Monatsabo',
    yearly: 'UncutTV Jahresabo',
    name: 'Name',
    email: 'E-Mail-Adresse',
    termination: 'Gewünschte Beendigung',
    nextPossible: 'Zum nächstmöglichen Termin',
    note: 'Den genauen Beendigungstermin bestätigen wir dir gesondert, sobald wir deine Kündigung zugeordnet haben.',
  },
  en: {
    type: 'Type of cancellation',
    ordinary: 'Ordinary cancellation',
    extraordinary: 'Extraordinary cancellation',
    reason: 'Reason',
    contract: 'Contract',
    monthly: 'UncutTV monthly subscription',
    yearly: 'UncutTV annual subscription',
    name: 'Name',
    email: 'Email address',
    termination: 'Requested termination',
    nextPossible: 'At the next possible date',
    note: 'We will confirm the exact termination date separately, once we have matched your cancellation to your contract.',
  },
} as const

export async function POST(req: NextRequest) {
  const payload = (await req.json().catch(() => null)) as Payload | null

  if (!payload || typeof payload !== 'object') {
    return NextResponse.json({ error: 'invalid_request' }, { status: 400 })
  }

  const cancellationType = payload.cancellationType === 'extraordinary' ? 'extraordinary' : 'ordinary'
  const contract = payload.contract === 'yearly' ? 'yearly' : 'monthly'
  const terminationType =
    payload.terminationType === 'specific_date' ? 'specific_date' : 'next_possible'

  const reason = str(payload.reason, MAX_REASON_LENGTH)
  const firstName = str(payload.firstName)
  const lastName = str(payload.lastName)
  const email = str(payload.email)
  const terminationDate = str(payload.terminationDate, 10)
  const locale = resolveLocale(payload.locale)

  // Serverseitig erneut pruefen: die Erklaerung wird protokolliert, ein
  // unvollstaendiger Datensatz waere als Nachweis wertlos.
  if (!firstName || !lastName) {
    return NextResponse.json({ error: 'name_required' }, { status: 400 })
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'invalid_email' }, { status: 400 })
  }
  if (cancellationType === 'extraordinary' && !reason) {
    return NextResponse.json({ error: 'reason_required' }, { status: 400 })
  }
  if (terminationType === 'specific_date' && !/^\d{4}-\d{2}-\d{2}$/.test(terminationDate)) {
    return NextResponse.json({ error: 'date_required' }, { status: 400 })
  }

  const receivedAt = new Date()
  const ip = parseIp(req.headers.get('x-forwarded-for'))

  const admin = createAdminClient()
  const written = reportWrite(
    'cancellation: insert',
    await admin.from('cancellations').insert(
      {
        cancellation_type: cancellationType,
        reason: cancellationType === 'extraordinary' ? reason : null,
        contract,
        first_name: firstName,
        last_name: lastName,
        email,
        termination_type: terminationType,
        termination_date: terminationType === 'specific_date' ? terminationDate : null,
        received_at: receivedAt.toISOString(),
        ip,
        user_agent: req.headers.get('user-agent'),
        locale,
      },
      { count: 'exact' }
    )
  )

  // Ohne Protokollzeile keine Bestaetigung: sonst haette der Nutzer einen
  // Nachweis in der Hand, dem auf unserer Seite nichts entspricht.
  if (!written) {
    return NextResponse.json({ error: 'not_recorded' }, { status: 500 })
  }

  const l = LABELS[locale]
  const dateFormat = locale === 'de' ? 'de-AT' : 'en-GB'

  const effective =
    terminationType === 'specific_date'
      ? new Date(terminationDate).toLocaleDateString(dateFormat, {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        })
      : l.nextPossible

  const summary: CancellationSummary = {
    rows: [
      {
        label: l.type,
        value: cancellationType === 'ordinary' ? l.ordinary : l.extraordinary,
      },
      ...(cancellationType === 'extraordinary' ? [{ label: l.reason, value: reason }] : []),
      { label: l.contract, value: contract === 'monthly' ? l.monthly : l.yearly },
      { label: l.name, value: `${firstName} ${lastName}` },
      { label: l.email, value: email },
      { label: l.termination, value: effective },
    ],
    receivedAt: receivedAt.toLocaleString(dateFormat, {
      dateStyle: 'long',
      timeStyle: 'short',
    }),
    effective,
    effectiveNote: terminationType === 'next_possible' ? l.note : undefined,
  }

  // Mailversand darf die bereits protokollierte Erklaerung nicht entwerten:
  // sie ist mit dem Insert zugegangen, unabhaengig davon, ob Resend liefert.
  try {
    await sendKuendigungBestaetigungEmail(email, summary)
  } catch (mailError) {
    console.error('cancellation: confirmation mail failed -', mailError)
  }

  try {
    await sendKuendigungInternEmail({ ...summary, locale, ip })
  } catch (mailError) {
    console.error('cancellation: internal notification failed -', mailError)
  }

  return NextResponse.json({ ok: true, receivedAt: receivedAt.toISOString() })
}
