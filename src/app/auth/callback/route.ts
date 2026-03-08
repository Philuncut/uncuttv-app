import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // Check if user is age verified
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('age_verified')
          .eq('id', user.id)
          .single()

        if (!profile?.age_verified) {
          // Needs age verification
          return NextResponse.redirect(`${origin}/de/auth/verify-age`)
        }

        // Fully verified - go to films
        return NextResponse.redirect(`${origin}/de/films`)
      }
    }
  }

  return NextResponse.redirect(`${origin}/de/auth/login?error=auth_failed`)
}
