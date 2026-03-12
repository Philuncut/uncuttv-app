import type { Locale } from '@/i18n/config'

export function generateStaticParams() {
  return [{ locale: 'de' }, { locale: 'en' }]
}

export default function LocaleLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
