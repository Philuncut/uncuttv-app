import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { proxy } from './src/proxy'

function isMaintenanceBypass(pathname: string): boolean {
  if (pathname === '/favicon.ico') return true
  if (pathname.startsWith('/maintenance')) return true
  if (pathname.startsWith('/_next/')) return true
  if (pathname.startsWith('/api/')) return true
  if (/\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml|json|webmanifest|woff2?)$/i.test(pathname)) {
    return true
  }
  return false
}

export async function middleware(request: NextRequest) {
  if (process.env.NEXT_PUBLIC_MAINTENANCE_MODE === 'true') {
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
