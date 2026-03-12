import { NextIntlClientProvider } from 'next-intl'
import type { Locale } from '@/i18n/config'
import deMessages from '@/messages/de.json'
import enMessages from '@/messages/en.json'

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
  const messages = locale === 'en' ? enMessages : deMessages
  return (
    <NextIntlClientProvider locale={locale as Locale} messages={messages}>
      {children}
    </NextIntlClientProvider>
  )
}
