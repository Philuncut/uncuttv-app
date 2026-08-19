import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Kleiner Status-Endpunkt fuer /auth/verify-age. Veriff entscheidet
 * asynchron per Webhook, die Seite muss also nachfragen koennen, waehrend
 * der Nutzer wartet.
 */
export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Nicht eingeloggt' }, { status: 401 })
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('age_verified, age_verification_status')
    .eq('id', user.id)
    .single()

  if (error) {
    console.error('veriff/status: profile lookup failed -', error.message)
    return NextResponse.json({ error: 'lookup_failed' }, { status: 500 })
  }

  return NextResponse.json({
    ageVerified: Boolean(profile?.age_verified),
    status: profile?.age_verification_status ?? null,
  })
}
