import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { getUserVouchers } from '@/lib/vouchers'

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  if (!pathname.includes('/films')) {
    return NextResponse.next()
  }

  const pathLocale = (pathname.match(/^\/(de|en)(?:\/|$)/)?.[1]) ?? 'de'
  let supabaseResponse = NextResponse.next({ request })
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.redirect(new URL(`/${pathLocale}/auth/login`, request.url))
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_status')
    .eq('id', user.id)
    .single()

  const activeStatuses = ['active', 'trialing']
  const hasSubscription = profile && activeStatuses.includes(profile.subscription_status)
  if (hasSubscription) {
    return supabaseResponse
  }

  const vouchers = await getUserVouchers(user.id)
  if (vouchers.length > 0) {
    return supabaseResponse
  }

  return NextResponse.redirect(new URL(`/${pathLocale}/subscribe`, request.url))
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webco)$).*)'],
}
