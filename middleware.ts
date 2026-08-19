import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { isMaintenanceMode } from './src/lib/env'
import { proxy } from './src/proxy'

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
  // Deckt auch /robots.txt und /sitemap.xml ab: Crawler sollen im Maintenance-
  // Modus das echte `Disallow: /` sehen und keinen Redirect.
  if (/\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml|json|webmanifest|woff2?)$/i.test(pathname)) {
    return true
  }
  return false
}

export async function middleware(request: NextRequest) {
  if (isMaintenanceMode()) {
    const pathname = request.nextUrl.pathname
    if (!isMaintenanceBypass(pathname)) {
      return NextResponse.redirect(new URL('/maintenance', request.url))
    }
  }
  return proxy(request)
}

export const config = {
  matcher: '/:path*',
}
