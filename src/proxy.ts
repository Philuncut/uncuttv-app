import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { ACCESS_GRANTING_STATUSES } from '@/lib/access'

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
    .in('status', ACCESS_GRANTING_STATUSES)
    .limit(1)

  let hasAccess = Boolean(activeSubscriptions && activeSubscriptions.length > 0)

  if (!hasAccess) {
    const { data: vouchers } = await supabase
      .from('vouchers')
      .select('id')
      .eq('used_by', user.id)
      .limit(1)

    hasAccess = Boolean(vouchers && vouchers.length > 0)
  }

  if (!hasAccess) {
    return NextResponse.redirect(new URL(`/${pathLocale}/subscribe`, request.url))
  }

  // Altersverifikation erst hier, nach Abo bzw. Voucher: bezahlt wird zuerst,
  // der Ausweis wird erst vor dem ersten Stream verlangt. Wer noch gar keinen
  // Zugang hat, soll auf /subscribe landen und nicht vorher durch Veriff.
  const { data: profile } = await supabase
    .from('profiles')
    .select('age_verified')
    .eq('id', user.id)
    .single()

  if (!profile?.age_verified) {
    return NextResponse.redirect(new URL(`/${pathLocale}/auth/verify-age`, request.url))
  }

  return supabaseResponse
}
