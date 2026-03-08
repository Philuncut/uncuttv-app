import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const locales = ['de', 'en']
const defaultLocale = 'de'

// Filme die in Deutschland gesperrt sind – wird serverseitig geprüft
// Die blocked_in_de Flag pro Film wird auf der Detailseite zusätzlich geprüft
const GEO_BLOCKED_COUNTRY = 'DE'

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // API Routes nie redirecten
  if (pathname.startsWith('/api/')) {
    return NextResponse.next()
  }

  // i18n redirect
  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  )
  if (!pathnameHasLocale) {
    const locale = request.headers.get('accept-language')?.startsWith('en') ? 'en' : defaultLocale
    return NextResponse.redirect(new URL(`/${locale}${pathname}`, request.url))
  }

  // Geo-Block: Deutschland kann keine Filme schauen
  const country = request.geo?.country
  if (country === GEO_BLOCKED_COUNTRY && pathname.includes('/films/')) {
    return NextResponse.redirect(new URL(`/${defaultLocale}/geo-blocked`, request.url))
  }

  // Auth session refresh
  let supabaseResponse = NextResponse.next({ request })
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // Nicht eingeloggt → Login
  if (!user && pathname.includes('/films')) {
    return NextResponse.redirect(new URL(`/${defaultLocale}/auth/login`, request.url))
  }

  // Eingeloggt aber Abo abgelaufen/fehlgeschlagen → Zahlung-Seite
  if (user && pathname.includes('/films')) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_status')
      .eq('id', user.id)
      .single()

    const status = profile?.subscription_status
    const activeStatuses = ['active', 'trialing']

    if (!status || !activeStatuses.includes(status)) {
      if (status === 'past_due') {
        return NextResponse.redirect(new URL(`/${defaultLocale}/payment-failed`, request.url))
      }
      return NextResponse.redirect(new URL(`/${defaultLocale}/subscribe`, request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webco)$).*)'],
}
