import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import crypto from 'crypto'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Nicht eingeloggt' }, { status: 401 })
  }

  const apiKey = process.env.NEXT_PUBLIC_VERIFF_API_KEY!
  const secret = process.env.VERIFF_SECRET_KEY!

  const payload = {
    verification: {
      callback: `${process.env.NEXT_PUBLIC_APP_URL}/api/veriff/webhook`,
      person: { idNumber: user.id },
      vendorData: user.id,
      timestamp: new Date().toISOString(),
    }
  }

  const payloadStr = JSON.stringify(payload)
  const signature = crypto
    .createHmac('sha256', secret)
    .update(Buffer.from(payloadStr))
    .digest('hex')
    .toLowerCase()

  const response = await fetch('https://stationapi.veriff.com/v1/sessions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-AUTH-CLIENT': apiKey,
      'X-HMAC-SIGNATURE': signature,
    },
    body: payloadStr,
  })

  const data = await response.json()
  console.log('Veriff API response:', response.status, JSON.stringify(data))

  if (!response.ok) {
    return NextResponse.json({ error: 'Veriff Fehler', detail: data, status: response.status }, { status: 500 })
  }

  return NextResponse.json({ url: data.verification.url })
}
