import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, reportWrite } from '@/lib/supabase/admin'
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

  if (status === 'approved') {
    const admin = createAdminClient()
    const result = await admin
      .from('profiles')
      .upsert({ id: vendorData, age_verified: true }, { count: 'exact' })
    reportWrite('Veriff webhook: profiles.age_verified', result)
  }

  return NextResponse.json({ received: true })
}
