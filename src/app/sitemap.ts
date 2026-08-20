import type { MetadataRoute } from 'next'
import { locales } from '@/i18n/config'
import { isMaintenanceMode, siteUrl } from '@/lib/env'

type ChangeFrequency = NonNullable<MetadataRoute.Sitemap[number]['changeFrequency']>

/**
 * Nur oeffentlich erreichbare Seiten. Bewusst nicht enthalten:
 * /films, /neuheiten, /genres (Login- bzw. Subscription-Gate in src/proxy.ts),
 * /account, /welcome, /redeem, /payment-failed,
 * /geo-blocked (personalisiert bzw. transaktional) und /auth/* (Formulare).
 */
const PUBLIC_PATHS: { path: string; changeFrequency: ChangeFrequency; priority: number }[] = [
  { path: '', changeFrequency: 'daily', priority: 1 },
  { path: '/subscribe', changeFrequency: 'monthly', priority: 0.8 },
  { path: '/faq', changeFrequency: 'monthly', priority: 0.5 },
  // Paragraph 312k BGB verlangt leichte Auffindbarkeit -- gehoert deshalb in
  // die Sitemap, auch wenn die Seite kein Marketingziel ist.
  { path: '/kuendigung', changeFrequency: 'yearly', priority: 0.4 },
  { path: '/agb', changeFrequency: 'yearly', priority: 0.3 },
  { path: '/datenschutz', changeFrequency: 'yearly', priority: 0.3 },
  { path: '/impressum', changeFrequency: 'yearly', priority: 0.3 },
  { path: '/jugendschutz', changeFrequency: 'yearly', priority: 0.3 },
]

export default function sitemap(): MetadataRoute.Sitemap {
  // Im Maintenance-Modus leitet jede dieser URLs auf /maintenance um — eine
  // Sitemap voller Redirects waere schlechter als gar keine.
  if (isMaintenanceMode()) return []

  const base = siteUrl()
  const lastModified = new Date()

  return PUBLIC_PATHS.flatMap(({ path, changeFrequency, priority }) =>
    locales.map((locale) => ({
      url: `${base}/${locale}${path}`,
      lastModified,
      changeFrequency,
      priority,
      alternates: {
        languages: Object.fromEntries(locales.map((l) => [l, `${base}/${l}${path}`])),
      },
    }))
  )
}
