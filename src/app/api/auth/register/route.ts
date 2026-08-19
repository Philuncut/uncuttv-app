import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { recordConsent } from '@/lib/consents'
import { siteUrl } from '@/lib/env'

const MIN_PASSWORD_LENGTH = 8

function isValidEmail(value: unknown): value is string {
  return typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

export async function POST(req: NextRequest) {
  const payload = await req.json().catch(() => null)

  if (!payload || typeof payload !== 'object') {
    return NextResponse.json({ error: 'invalid_request' }, { status: 400 })
  }

  const { email, password, consent, locale } = payload as {
    email?: unknown
    password?: unknown
    consent?: unknown
    locale?: unknown
  }

  // Die Checkbox wird auch serverseitig erzwungen: eine Zustimmung, die sich
  // durch Weglassen des Feldes umgehen laesst, ist keine.
  if (consent !== true) {
    return NextResponse.json({ error: 'consent_required' }, { status: 400 })
  }

  if (!isValidEmail(email)) {
    return NextResponse.json({ error: 'invalid_email' }, { status: 400 })
  }

  if (typeof password !== 'string' || password.length < MIN_PASSWORD_LENGTH) {
    return NextResponse.json({ error: 'password_too_short' }, { status: 400 })
  }

  const targetLocale = locale === 'en' ? 'en' : 'de'

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${siteUrl()}/auth/callback?locale=${targetLocale}`,
    },
  })

  if (error) {
    console.error('register: signUp failed -', error.message)
    return NextResponse.json({ error: 'signup_failed' }, { status: 400 })
  }

  const user = data.user
  if (!user) {
    console.error('register: signUp returned no user')
    return NextResponse.json({ error: 'signup_failed' }, { status: 500 })
  }

  // Ist die Adresse bereits registriert, liefert Supabase einen Platzhalter
  // mit leerem identities-Array. Nach aussen sieht das aus wie ein Erfolg --
  // sonst liesse sich ueber diesen Endpunkt herausfinden, wer Kunde ist.
  const alreadyRegistered = Array.isArray(user.identities) && user.identities.length === 0
  if (alreadyRegistered) {
    return NextResponse.json({ ok: true })
  }

  // Die Profilzeile legt der Trigger on_auth_user_created (handle_new_user)
  // beim Signup an -- hier wird sie deshalb nur geprueft, nicht geschrieben.
  //
  // Die Pruefung bleibt trotzdem: greift der Trigger nicht, laufen spaeter
  // saemtliche Updates auf null Zeilen, was PostgREST nicht als Fehler
  // meldet. Betroffen waere unter anderem consent_email_sent, an dem der
  // Versand des Zustimmungsnachweises haengt -- die Registrierung saehe nach
  // aussen erfolgreich aus, waehrend der Nachweis nie ankommt.
  const admin = createAdminClient()
  const { data: profileRow, error: profileError } = await admin
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .maybeSingle()

  if (profileError || !profileRow) {
    console.error(
      'register: profile row missing after signUp for user',
      user.id,
      profileError ? `- ${profileError.message}` : '- trigger did not fire'
    )
    return NextResponse.json({ error: 'profile_missing' }, { status: 500 })
  }

  const consentRecorded = await recordConsent(user.id, 'signup', { headers: req.headers })

  if (!consentRecorded) {
    // Das Konto existiert an dieser Stelle bereits. Ein fehlender Nachweis
    // darf nicht stillschweigend durchgehen -- ohne ihn ist nicht belegbar,
    // dass der Nutzer den AGB zugestimmt hat.
    console.error('register: consent not recorded for user', user.id)
    return NextResponse.json({ error: 'consent_not_recorded' }, { status: 500 })
  }

  // Hier geht bewusst keine Mail raus: den Aktivierungslink verschickt
  // Supabase, und der Zustimmungsnachweis folgt erst nach bestaetigter
  // Adresse aus /auth/callback. So bekommt der Nutzer eine Mail statt zwei,
  // und der Nachweis erreicht nur bestaetigte Postfaecher.
  return NextResponse.json({ ok: true })
}
