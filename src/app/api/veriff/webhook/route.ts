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

  if (signature !== expectedSig) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  const event = JSON.parse(body)
  const { status, vendorData } = event.verification

  // vendorData = user.id
  if (!vendorData) {
    return NextResponse.json({ error: 'No user ID' }, { status: 400 })
  }

  const supabase = await createClient()

  if (status === 'approved') {
    // Mark user as age-verified in profiles table
    await supabase
      .from('profiles')
      .upsert({
        id: vendorData,
        age_verified: true,
      })
  }

  return NextResponse.json({ received: true })
}
