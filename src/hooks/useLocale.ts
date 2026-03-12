'use client'

import { useParams } from 'next/navigation'
import type { Locale } from '@/i18n/config'

export function useLocale(): Locale {
  const params = useParams()
  const locale = params?.locale as string | undefined
  return (locale === 'de' || locale === 'en' ? locale : 'de') as Locale
}
