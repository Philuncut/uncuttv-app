import { createAdminClient, reportWrite } from '@/lib/supabase/admin'
import { LEGAL_VERSION, type ConsentKind } from '@/lib/legal'

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
