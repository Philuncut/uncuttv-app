import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { NextIntlClientProvider, hasLocale } from 'next-intl'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { locales, type Locale } from '@/i18n/config'
import { siteUrl } from '@/lib/env'
import Navbar from '@/components/layout/Navbar'
import deMessages from '@/messages/de.json'
import enMessages from '@/messages/en.json'

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

/**
 * Titel und Beschreibung je Sprache. Im Wurzel-Layout stehen sie fest auf
 * Deutsch -- das galt bis hierher auch fuer /en, samt Meta-Description und
 * Link-Vorschau. Was hier gesetzt wird, ueberschreibt das fuer alle Routen
 * unterhalb von /[locale]; `metadataBase` bleibt vom Wurzel-Layout.
 *
 * Bewusst `getTranslations({ locale })` mit ausdruecklicher Sprache: Metadaten
 * werden ausserhalb des Renderbaums erzeugt, der Request-Zustand aus
 * setRequestLocale traegt hier nicht zuverlaessig.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  if (!hasLocale(locales, locale)) notFound()

  const t = await getTranslations({ locale, namespace: 'meta' })
  const base = siteUrl()

  return {
    title: t('title'),
    description: t('description'),
    openGraph: {
      title: t('title'),
      description: t('description'),
      url: `${base}/${locale}`,
      siteName: 'UncutTV',
      locale: locale === 'de' ? 'de_AT' : 'en_US',
      images: [
        {
          url: `${base}/opengraph-image.svg`,
          width: 1200,
          height: 630,
          alt: t('ogImageAlt'),
        },
      ],
      type: 'website',
    },
  }
}

/**
 * Die Sprache muss an zwei Stellen ankommen, weil es zwei Wege gibt, an Texte
 * zu kommen:
 *
 * - Clientkomponenten lesen sie aus dem NextIntlClientProvider.
 * - Serverkomponenten mit getTranslations() lesen sie aus dem Request-Zustand,
 *   den src/i18n/request.ts ueber `requestLocale` abfragt. Gefuellt wird der
 *   entweder von next-intls eigener Middleware oder von setRequestLocale --
 *   und die Middleware dieses Projekts macht Supabase-Auth und Katalog-Gating,
 *   nicht next-intl. Ohne den Aufruf hier faellt jede Serverkomponente still
 *   auf routing.defaultLocale zurueck und rendert Deutsch, egal was in der URL
 *   steht. Genau das ist dem Filmemacher-Abschnitt passiert.
 *
 * next-intl sieht setRequestLocale in jedem Layout *und* jeder Seite vor, weil
 * Next Layout und Seite nebenlaeufig rendert und die Reihenfolge nicht
 * zugesichert ist. Der Aufruf hier ist das Netz fuer alles, was ihn nicht
 * selbst macht; die Seiten behalten ihren eigenen.
 */
export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  // Ohne Pruefung rendert /irgendwas die deutsche Seite unter fremder Adresse.
  if (!hasLocale(locales, locale)) notFound()
  setRequestLocale(locale)

  const messages = locale === 'en' ? enMessages : deMessages
  return (
    <NextIntlClientProvider locale={locale as Locale} messages={messages}>
      <Navbar />
      {children}
    </NextIntlClientProvider>
  )
}
