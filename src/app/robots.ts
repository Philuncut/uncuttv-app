import type { MetadataRoute } from 'next'
import { isMaintenanceMode, siteUrl } from '@/lib/env'

export default function robots(): MetadataRoute.Robots {
  const base = siteUrl()

  // Maintenance: nichts freigeben. Die Route selbst laeuft am Redirect vorbei
  // (Bypass fuer *.txt in middleware.ts), damit Crawler dieses Disallow sehen.
  if (isMaintenanceMode()) {
    return {
      rules: [{ userAgent: '*', disallow: '/' }],
    }
  }

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/auth/',
          '/maintenance',
          '/de/films',
          '/en/films',
          '/de/neuheiten',
          '/en/neuheiten',
          '/de/genres',
          '/en/genres',
          '/de/account',
          '/en/account',
          '/de/welcome',
          '/en/welcome',
          '/de/redeem',
          '/en/redeem',
          '/de/payment-failed',
          '/en/payment-failed',
          '/de/geo-blocked',
          '/en/geo-blocked',
        ],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  }
}
