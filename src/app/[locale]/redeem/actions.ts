'use server'

import { redirect } from 'next/navigation'
import { checkVoucher, redeemVoucher } from '@/lib/vouchers'

export async function checkVoucherAction(code: string, userId: string) {
  return checkVoucher(code.trim(), userId)
}

export async function redeemAndGoAction(
  code: string,
  userId: string,
  filmId: string,
  filmSlug: string,
  locale: string
) {
  const result = await redeemVoucher(code.trim(), userId, filmId)
  if (!result.success) {
    return { error: result.error }
  }
  redirect(`/${locale}/films/${filmSlug}`)
}
