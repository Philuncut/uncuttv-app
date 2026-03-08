import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendWillkommenEmail } from '@/lib/emails'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('age_verified, welcome_email_sent')
          .eq('id', user.id)
          .single()

        // Willkommen-Email nur einmalig senden
        if (!profile?.welcome_email_sent && user.email) {
          await sendWillkommenEmail(user.email)
          await supabase.from('profiles').update({
            welcome_email_sent: true,
          }).eq('id', user.id)
        }

        if (!profile?.age_verified) {
          return NextResponse.redirect(`${origin}/de/auth/verify-age`)
        }

        return NextResponse.redirect(`${origin}/de/films`)
      }
    }
  }

  return NextResponse.redirect(`${origin}/de/auth/login?error=auth_failed`)
}
