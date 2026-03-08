'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'

const LINKS = {
  Plattform: [
    { label: 'Alle Filme', href: '/de/films' },
    { label: 'Neuheiten', href: '/de/films' },
    { label: 'Genres', href: '/de/films' },
    { label: 'Suche', href: '/de/films' },
  ],
  Entdecken: [
    { label: 'Neue Filme', href: '/de/films' },
    { label: 'Genres', href: '/de/films' },
    { label: 'Länder', href: '/de/films' },
    { label: 'FAQ', href: '/de/faq' },
  ],
  Rechtliches: [
    { label: 'Impressum', href: '/de/impressum' },
    { label: 'Datenschutz', href: '/de/datenschutz' },
    { label: 'AGB', href: '/de/agb' },
    { label: 'Jugendschutz', href: '/de/jugendschutz' },
  ],
}

export default function Footer() {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  return (
    <footer style={{
      background: 'var(--black)',
      borderTop: '1px solid rgba(255,255,255,0.06)',
      padding: isMobile ? '48px 20px 32px' : '64px 48px 40px',
    }}>
      {/* Brand */}
      <div style={{ marginBottom: '32px' }}>
        <Link href="/de" style={{
          fontFamily: 'var(--font-display)', fontSize: '1.8rem',
          letterSpacing: '0.08em', color: 'var(--warm-white)',
          textDecoration: 'none', display: 'inline-flex', marginBottom: '12px',
        }}>
          UNCUT<span style={{ color: 'var(--red)' }}>TV</span>
        </Link>
        <p style={{
          fontSize: '0.82rem', color: 'var(--grey)', lineHeight: 1.7,
          maxWidth: isMobile ? '100%' : '280px',
        }}>
          Die Streaming-Plattform für Independent-Film. Unabhängig. Ungefiltert. Fair.
        </p>
      </div>

      {/* Link columns */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr 1fr' : '1fr 1fr 1fr',
        gap: isMobile ? '32px 24px' : '48px',
        marginBottom: '40px',
      }}>
        {Object.entries(LINKS).map(([title, items]) => (
          <div key={title}>
            <h4 style={{
              fontSize: '0.72rem', letterSpacing: '0.18em',
              textTransform: 'uppercase', color: 'var(--grey)', marginBottom: '16px',
            }}>
              {title}
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {items.map((item) => (
                <li key={item.label} style={{ marginBottom: '10px' }}>
                  <Link href={item.href} style={{
                    color: 'var(--grey-light)', textDecoration: 'none', fontSize: '0.85rem',
                  }}>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Bottom bar */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        paddingTop: '24px', borderTop: '1px solid rgba(255,255,255,0.06)',
        flexWrap: 'wrap', gap: '12px',
      }}>
        <p style={{ fontSize: '0.75rem', color: 'var(--grey)', letterSpacing: '0.06em' }}>
          © 2026 UncutTV GmbH · Alle Rechte vorbehalten
        </p>
        <span style={{
          background: 'var(--red)', color: 'white',
          fontSize: '0.7rem', fontWeight: 700, padding: '3px 8px', letterSpacing: '0.06em',
        }}>
          18+
        </span>
      </div>
    </footer>
  )
}
