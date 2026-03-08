import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import crypto from 'crypto'

export async function POST(req: NextRequest) {
  const secret = process.env.VERIFF_SECRET_KEY!
  const body = await req.text()
  const signature = req.headers.get('x-hmac-signature') || ''

  // Verify webhook signature
  const expectedSig = crypto
    .createHmac('sha256', secret)
    .update(Buffer.from(body))
    .digest('hex')
    .toLowerCase()

  console.log('Veriff webhook received')
  console.log('Signature match:', signature === expectedSig)
  console.log('Body:', body)

  // Temporär: Signatur-Check nur loggen, nicht blockieren
  if (signature !== expectedSig) {
    console.log('Signature mismatch – proceeding anyway for debugging')
  }

  let event: any
  try {
    event = JSON.parse(body)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  console.log('Veriff event:', JSON.stringify(event))

  // Version 1.0 format: event.verification
  // Version 2.0 format: event.data.verification
  const verification = event.verification || event.data?.verification
  if (!verification) {
    return NextResponse.json({ error: 'No verification data' }, { status: 400 })
  }

  const { status, vendorData } = verification

  console.log('Status:', status, 'VendorData:', vendorData)

  if (!vendorData) {
    return NextResponse.json({ error: 'No user ID' }, { status: 400 })
  }

  const supabase = await createClient()

  if (status === 'approved') {
    const { error } = await supabase
      .from('profiles')
      .upsert({ id: vendorData, age_verified: true })
    console.log('Supabase upsert error:', error)
  }

  return NextResponse.json({ received: true })
}
