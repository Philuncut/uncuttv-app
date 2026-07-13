import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

function isMaintenanceBypass(pathname: string): boolean {
  if (pathname === '/favicon.ico') return true
  if (pathname.startsWith('/maintenance')) return true
  if (pathname.startsWith('/_next/')) return true
  if (pathname.startsWith('/api/')) return true
  if (pathname === '/auth/callback' || pathname.startsWith('/auth/callback/')) return true
  if (/^\/(de|en)\/auth\/forgot-password(?:\/|$)/.test(pathname)) return true
  if (/^\/(de|en)\/auth\/change-password(?:\/|$)/.test(pathname)) return true
  if (/^\/(de|en)\/auth\/login(?:\/|$)/.test(pathname)) return true
  if (/^\/(de|en)\/auth\/verify-age(?:\/|$)/.test(pathname)) return true
  if (/\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml|json|webmanifest|woff2?)$/i.test(pathname)) {
    return true
  }
  return false
}

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const pathLocale = (pathname.match(/^\/(de|en)(?:\/|$)/)?.[1]) ?? 'de'

  if (process.env.NEXT_PUBLIC_MAINTENANCE_MODE === 'true' && !isMaintenanceBypass(pathname)) {
    return NextResponse.redirect(new URL('/maintenance', request.url))
  }

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
