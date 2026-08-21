import { createClient, type SupabaseClient } from '@supabase/supabase-js'

function getAdminClient(): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

/**
 * Schluessel statt Satz. Die Bibliothek laeuft auf dem Server und kennt die
 * Sprache des Aufrufers nicht -- frueher gab sie fertige deutsche Saetze
 * zurueck, die auf /en unuebersetzt durchschlugen. Die Zuordnung zum Text
 * passiert in der Oberflaeche unter messages.redeem.errors.
 */
export type VoucherErrorCode =
  | 'empty'
  | 'checkFailed'
  | 'unknown'
  | 'expired'
  | 'exhausted'
  | 'alreadyRedeemed'
  | 'invalidInput'
  | 'notFound'
  | 'redeemFailed'

export interface VoucherResult {
  valid: boolean
  filmId?: string
  filmTitle?: string
  filmSlug?: string
  errorCode?: VoucherErrorCode
}

export interface UserVoucher {
  id: string
  code: string
  film_id: string
  film_title?: string
  used_at: string
}

/**
 * Check if a voucher code is valid: not expired, not exceeded max_uses, not already used by this user.
 * Returns film info when valid.
 */
export async function checkVoucher(code: string, _userId: string): Promise<VoucherResult> {
  const supabase = getAdminClient()
  const trimmed = code.trim().toUpperCase()
  if (!trimmed) {
    return { valid: false, errorCode: 'empty' }
  }

  const { data: voucher, error: fetchError } = await supabase
    .from('vouchers')
    .select('id, code, film_id, used_by, expires_at, max_uses, times_used')
    .ilike('code', trimmed)
    .maybeSingle()

  if (fetchError) {
    console.error('Voucher fetch error:', fetchError)
    return { valid: false, errorCode: 'checkFailed' }
  }

  if (!voucher) {
    return { valid: false, errorCode: 'unknown' }
  }

  const now = new Date().toISOString()
  if (voucher.expires_at && voucher.expires_at < now) {
    return { valid: false, errorCode: 'expired' }
  }

  if (voucher.max_uses != null && voucher.times_used != null && voucher.times_used >= voucher.max_uses) {
    return { valid: false, errorCode: 'exhausted' }
  }

  if (voucher.used_by) {
    return { valid: false, errorCode: 'alreadyRedeemed' }
  }

  const { data: film } = await supabase
    .from('films')
    .select('id, title, slug')
    .eq('id', voucher.film_id)
    .single()

  return {
    valid: true,
    filmId: voucher.film_id,
    filmTitle: film?.title ?? undefined,
    filmSlug: film?.slug ?? undefined,
  }
}

/**
 * Redeem a voucher for a user and film. Marks the voucher as used.
 */
export async function redeemVoucher(
  code: string,
  userId: string,
  filmId: string
): Promise<{ success: boolean; errorCode?: VoucherErrorCode }> {
  const supabase = getAdminClient()
  const trimmed = code.trim().toUpperCase()
  if (!trimmed || !userId || !filmId) {
    return { success: false, errorCode: 'invalidInput' }
  }

  const { data: voucher, error: fetchError } = await supabase
    .from('vouchers')
    .select('id, film_id, used_by, max_uses, times_used')
    .ilike('code', trimmed)
    .eq('film_id', filmId)
    .maybeSingle()

  if (fetchError || !voucher) {
    return { success: false, errorCode: 'notFound' }
  }

  if (voucher.used_by) {
    return { success: false, errorCode: 'alreadyRedeemed' }
  }

  const now = new Date().toISOString()
  const updates: Record<string, unknown> = {
    used_by: userId,
    used_at: now,
  }
  if (voucher.max_uses != null && voucher.times_used != null) {
    updates.times_used = (voucher.times_used ?? 0) + 1
  }

  const { error: updateError } = await supabase
    .from('vouchers')
    .update(updates)
    .eq('id', voucher.id)

  if (updateError) {
    console.error('Voucher redeem error:', updateError)
    return { success: false, errorCode: 'redeemFailed' }
  }

  return { success: true }
}

/**
 * Return all vouchers redeemed by this user (valid for access).
 */
export async function getUserVouchers(userId: string): Promise<UserVoucher[]> {
  const supabase = getAdminClient()

  const { data: rows, error } = await supabase
    .from('vouchers')
    .select('id, code, film_id, used_at')
    .eq('used_by', userId)
    .order('used_at', { ascending: false })

  if (error) {
    console.error('getUserVouchers error:', error)
    return []
  }

  if (!rows?.length) return []

  const filmIds = [...new Set(rows.map((r) => r.film_id))]
  const { data: films } = await supabase
    .from('films')
    .select('id, title')
    .in('id', filmIds)

  const filmMap = new Map((films ?? []).map((f) => [f.id, f.title]))

  return rows.map((r) => ({
    id: r.id,
    code: r.code,
    film_id: r.film_id,
    film_title: filmMap.get(r.film_id),
    used_at: r.used_at,
  }))
}

/**
 * Check if user has a redeemed voucher for a specific film.
 */
export async function userHasVoucherForFilm(userId: string, filmId: string): Promise<boolean> {
  const supabase = getAdminClient()
  const { data, error } = await supabase
    .from('vouchers')
    .select('id')
    .eq('used_by', userId)
    .eq('film_id', filmId)
    .limit(1)
    .maybeSingle()

  return !error && !!data
}
