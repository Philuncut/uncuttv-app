import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, reportWrite } from '@/lib/supabase/admin'
import { restoreAgeGatedSubscription } from '@/lib/subscriptions'
import crypto from 'crypto'

/** Laufzeitkonstanter Vergleich, damit die Signatur nicht per Timing erraten werden kann. */
function signaturesMatch(expected: string, received: string): boolean {
  const a = Buffer.from(expected, 'utf8')
  const b = Buffer.from(received, 'utf8')
  if (a.length !== b.length) return false
  return crypto.timingSafeEqual(a, b)
}

export async function POST(req: NextRequest) {
  const secret = process.env.VERIFF_SECRET_KEY!
  const body = await req.text()
  const signature = (req.headers.get('x-hmac-signature') || '').toLowerCase()

  const expectedSig = crypto
    .createHmac('sha256', secret)
    .update(Buffer.from(body))
    .digest('hex')
    .toLowerCase()

  // Ohne gueltige Signatur wird nichts verarbeitet: dieser Endpunkt setzt
  // age_verified und ist damit die Jugendschutz-Grenze der Anwendung.
  if (!signaturesMatch(expectedSig, signature)) {
    console.warn('Veriff webhook: signature mismatch, request rejected')
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  let event: any
  try {
    event = JSON.parse(body)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  // Version 1.0 format: event.verification
  // Version 2.0 format: event.data.verification
  const verification = event.verification || event.data?.verification
  if (!verification) {
    return NextResponse.json({ error: 'No verification data' }, { status: 400 })
  }

  const { status, vendorData } = verification

  if (!vendorData) {
    return NextResponse.json({ error: 'No user ID' }, { status: 400 })
  }

  // Jeder Status wird festgehalten, nicht nur approved: /auth/verify-age kann
  // sonst nicht zwischen "laeuft noch", "abgelehnt" und "neuer Versuch
  // noetig" unterscheiden. age_verified bleibt das Tor und wird nur bei
  // approved gesetzt.
  const record: Record<string, unknown> = {
    id: vendorData,
    age_verification_status: typeof status === 'string' ? status : null,
    age_verification_updated_at: new Date().toISOString(),
  }

  // Nur nach oben: einmal bestaetigtes Alter wird durch ein spaeteres
  // review- oder expired-Event nicht wieder entzogen. Ein Mensch wird nicht
  // wieder minderjaehrig -- ein Entzug waere eine bewusste Admin-Handlung.
  if (status === 'approved') {
    record.age_verified = true
  }

  const admin = createAdminClient()
  reportWrite(
    `Veriff webhook: profiles age_verification (${status})`,
    await admin.from('profiles').upsert(record, { count: 'exact' })
  )

  // Wurde das Abo wegen fehlender Verifikation zum Ende der Testphase
  // gekuendigt, wird das jetzt zurueckgenommen. Eine vom Nutzer selbst
  // ausgeloeste Kuendigung bleibt bestehen.
  if (status === 'approved') {
    await restoreAgeGatedSubscription(vendorData)
  }

  return NextResponse.json({ received: true })
}
