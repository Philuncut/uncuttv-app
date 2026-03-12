import { NextIntlClientProvider } from 'next-intl'
import type { Locale } from '@/i18n/config'

export function generateStaticParams() {
  return [{ locale: 'de' }, { locale: 'en' }]
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const messages = (await import(`@/messages/${locale}.json`)).default
  return (
    <NextIntlClientProvider locale={locale as Locale} messages={messages}>
      {children}
    </NextIntlClientProvider>
  )
}
