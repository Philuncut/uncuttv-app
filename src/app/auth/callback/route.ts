import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type')

  const supabase = await createClient()

  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash, type: type as any })
    if (error) {
      return NextResponse.redirect(`${origin}/de/auth/login?error=auth_failed`)
    }
  } else if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) {
      return NextResponse.redirect(`${origin}/de/auth/login?error=auth_failed`)
    }
  } else {
    return NextResponse.redirect(`${origin}/de/auth/login?error=auth_failed`)
  }

  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('age_verified')
      .eq('id', user.id)
      .single()

    if (!profile?.age_verified) {
      return NextResponse.redirect(`${origin}/de/auth/verify-age`)
    }

    return NextResponse.redirect(`${origin}/de/films`)
  }

  return NextResponse.redirect(`${origin}/de/auth/login?error=auth_failed`)
}
