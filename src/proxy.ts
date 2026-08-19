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

  const { data: activeSubscriptions } = await supabase
    .from('subscriptions')
    .select('id')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .limit(1)

  const hasSubscription = Boolean(activeSubscriptions && activeSubscriptions.length > 0)
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
