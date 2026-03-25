import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname
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

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (pathname.match(/^\/(de|en)\/auth\/login(?:\/|$)/)) {
    if (user) {
      return NextResponse.redirect(new URL(`/${pathLocale}/films`, request.url))
    }
    return supabaseResponse
  }

  if (!pathname.includes('/films')) {
    return supabaseResponse
  }

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

  const { data: vouchers } = await supabase
    .from('vouchers')
    .select('id')
    .eq('used_by', user.id)
    .limit(1)

  if (vouchers && vouchers.length > 0) {
    return supabaseResponse
  }

  return NextResponse.redirect(new URL(`/${pathLocale}/subscribe`, request.url))
}
