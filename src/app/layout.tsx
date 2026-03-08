import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'UncutTV – Independent Film Streaming',
  description: 'Kino ohne Kompromisse. Unabhängig. So wie Film sein sollte.',
  keywords: ['independent film', 'indie kino', 'streaming', 'arthouse'],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  )
}
