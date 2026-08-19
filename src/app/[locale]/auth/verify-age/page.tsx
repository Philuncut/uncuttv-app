import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import VerifyAge from './VerifyAge'

export default async function VerifyAgePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ status?: string }>
}) {
  const { locale } = await params
  const { status: returnedFromVeriff } = await searchParams

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/${locale}/auth/login`)
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('age_verified, age_verification_status')
    .eq('id', user.id)
    .single()

  // Schon verifiziert: hier gibt es nichts zu tun.
  if (profile?.age_verified) {
    redirect(`/${locale}/films`)
  }

  return (
    <VerifyAge
      locale={locale}
      initialStatus={profile?.age_verification_status ?? null}
      // Veriff leitet nach dem Upload mit ?status=submitted zurueck. Die
      // Entscheidung selbst kommt erst per Webhook, also starten wir in
      // diesem Fall direkt im Wartezustand.
      returnedFromVeriff={returnedFromVeriff === 'submitted'}
    />
  )
}
