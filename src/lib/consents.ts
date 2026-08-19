import { createAdminClient, reportWrite } from '@/lib/supabase/admin'
import { LEGAL_VERSION, type ConsentKind } from '@/lib/legal'
import { sendRegistrierungEmail } from '@/lib/emails'

/**
 * Serverseitig, niemals aus dem Browser: waere der Zeitstempel vom Client
 * setzbar, taugte er nicht als Nachweis.
 */

/** Grobe Plausibilitaetspruefung, damit die inet-Spalte keinen Muell bekommt. */
function parseIp(forwardedFor: string | null): string | null {
  if (!forwardedFor) return null
  const first = forwardedFor.split(',')[0]?.trim()
  if (!first) return null
  const isIpv4 = /^\d{1,3}(\.\d{1,3}){3}$/.test(first)
  const isIpv6 = /^[0-9a-f:]+$/i.test(first) && first.includes(':')
  return isIpv4 || isIpv6 ? first : null
}

export type ConsentContext = {
  headers: Headers
  checkoutSessionId?: string
}

/**
 * Schreibt eine Zustimmung fest. Gibt zurueck, ob der Write eine Zeile
 * getroffen hat -- Aufrufer entscheiden, ob ein Fehlschlag den Vorgang
 * abbricht.
 */
export async function recordConsent(
  userId: string,
  kind: ConsentKind,
  context: ConsentContext
): Promise<boolean> {
  const admin = createAdminClient()

  return reportWrite(
    `consents: ${kind}`,
    await admin.from('consents').insert(
      {
        user_id: userId,
        kind,
        legal_version: LEGAL_VERSION,
        ip: parseIp(context.headers.get('x-forwarded-for')),
        user_agent: context.headers.get('user-agent'),
        checkout_session_id: context.checkoutSessionId ?? null,
      },
      { count: 'exact' }
    )
  )
}

/**
 * Verschickt den Zustimmungsnachweis nach bestaetigter E-Mail-Adresse --
 * garantiert hoechstens einmal pro Konto.
 *
 * Die Einmaligkeit haengt am Flag profiles.consent_email_sent, nicht an der
 * consents-Tabelle: consents ist ein append-only Rechtsnachweis und soll
 * nicht zum Zustellprotokoll umgewidmet werden. Das Flag folgt damit dem
 * Muster, das welcome_email_sent bereits vorgibt.
 *
 * Das Setzen ist zugleich der Anspruch: das Update greift nur, solange das
 * Flag false ist. Laufen zwei Anfragen parallel, trifft genau eine davon
 * eine Zeile und verschickt.
 */
export async function sendConsentReceiptOnce(
  userId: string,
  email: string | undefined
): Promise<void> {
  if (!email) {
    console.error('consent receipt: user has no email', userId)
    return
  }

  const admin = createAdminClient()

  const { error: claimError, count } = await admin
    .from('profiles')
    .update({ consent_email_sent: true }, { count: 'exact' })
    .eq('id', userId)
    .eq('consent_email_sent', false)

  if (claimError) {
    console.error('consent receipt: claim failed -', claimError.message)
    return
  }

  // Null Zeilen heisst: schon verschickt, oder es gibt keine Profilzeile.
  if (!count) return

  const { data: consent, error: consentError } = await admin
    .from('consents')
    .select('legal_version, accepted_at')
    .eq('user_id', userId)
    .eq('kind', 'signup')
    .order('accepted_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (consentError) {
    console.error('consent receipt: consent lookup failed -', consentError.message)
  }
  if (!consent) {
    console.error('consent receipt: no signup consent on record for user', userId)
  }

  const legalVersion = consent?.legal_version ?? LEGAL_VERSION
  const acceptedAt = new Date(consent?.accepted_at ?? Date.now()).toLocaleString('de-AT', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })

  try {
    await sendRegistrierungEmail(email, legalVersion, acceptedAt)
  } catch (mailError) {
    console.error('consent receipt: send failed -', mailError)
  }
}
