import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { locales, defaultLocale } from '@/i18n/config'

// Filme die in Deutschland gesperrt sind – wird serverseitig geprüft
// Die blocked_in_de Flag pro Film wird auf der Detailseite zusätzlich geprüft
const GEO_BLOCKED_COUNTRY = 'DE'

const DACH_COUNTRIES = ['AT', 'DE', 'CH']

function getLocaleFromRequest(request: NextRequest): string {
  const cookieLocale = request.cookies.get('NEXT_LOCALE')?.value
  if (cookieLocale === 'de' || cookieLocale === 'en') return cookieLocale

  const country = request.headers.get('x-vercel-ip-country') ?? ''
  if (DACH_COUNTRIES.includes(country)) return 'de'
  return 'en'
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // API Routes nie redirecten
  if (pathname.startsWith('/api/')) {
    return NextResponse.next()
  }

  // i18n redirect: keine Locale im Pfad → Locale ermitteln und redirecten
  const pathnameHasLocale = (locales as readonly string[]).some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  )
  if (!pathnameHasLocale) {
    const locale = getLocaleFromRequest(request)
    return NextResponse.redirect(new URL(`/${locale}${pathname === '/' ? '' : pathname}`, request.url))
  }

  // Aktuelle Locale aus Pfad (z. B. /de/ oder /en/)
  const pathLocale = (pathname.match(/^\/(de|en)(?:\/|$)/)?.[1]) ?? defaultLocale

  // Geo-Block: Deutschland kann keine Filme schauen
  const country = request.headers.get('x-vercel-ip-country') ?? (request as any).geo?.country
  if (country === GEO_BLOCKED_COUNTRY && pathname.includes('/films/')) {
    return NextResponse.redirect(new URL(`/${pathLocale}/geo-blocked`, request.url))
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
    return NextResponse.redirect(new URL(`/${pathLocale}/auth/login`, request.url))
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
        return NextResponse.redirect(new URL(`/${pathLocale}/payment-failed`, request.url))
      }
      return NextResponse.redirect(new URL(`/${pathLocale}/subscribe`, request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webco)$).*)'],
}
