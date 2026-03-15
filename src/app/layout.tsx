import type { Metadata } from 'next'
import './globals.css'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://uncuttv.app'

export const metadata: Metadata = {
  title: 'UncutTV – Independent Film Streaming',
  description: 'Kino ohne Kompromisse. Unabhängig. So wie Film sein sollte.',
  keywords: ['independent film', 'indie kino', 'streaming', 'arthouse'],
  icons: {
    icon: '/icon.svg',
    apple: '/apple-icon.svg',
  },
  openGraph: {
    title: 'UncutTV – Independent Film Streaming',
    description: 'Kino ohne Kompromisse. Unabhängig. So wie Film sein sollte.',
    url: siteUrl,
    siteName: 'UncutTV',
    images: [
      {
        url: `${siteUrl}/opengraph-image.svg`,
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
      <body>{children}</body>
    </html>
  )
}
