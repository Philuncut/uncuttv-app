import type { Metadata } from 'next'
import { siteUrl } from '@/lib/env'
import './globals.css'

const base = siteUrl()

export const metadata: Metadata = {
  metadataBase: new URL(base),
  title: 'UncutTV – Independent Film Streaming',
  description: 'Kino ohne Kompromisse. Unabhängig. So wie Film sein sollte.',
  keywords: ['independent film', 'indie kino', 'streaming', 'arthouse'],
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: '/apple-icon.svg',
  },
  openGraph: {
    title: 'UncutTV – Independent Film Streaming',
    description: 'Kino ohne Kompromisse. Unabhängig. So wie Film sein sollte.',
    url: base,
    siteName: 'UncutTV',
    images: [
      {
        url: `${base}/opengraph-image.svg`,
        width: 1200,
        height: 630,
        alt: 'UncutTV – Independent Film Streaming',
      },
    ],
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <head>
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
      </head>
      <body>{children}</body>
    </html>
  )
}
