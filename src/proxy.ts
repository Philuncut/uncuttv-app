import { NextResponse, type NextRequest } from 'next/server'

/**
 * Minimal proxy: pass through all requests. No redirects.
 * Use this to confirm the site loads without redirect loops.
 */
export async function proxy(_request: NextRequest) {
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webco)$).*)'],
}
