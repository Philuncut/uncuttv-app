'use client'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import LanguageSwitch from './LanguageSwitch'
import type { Locale } from '@/i18n/config'

export default function Navbar() {
  const [isMobile, setIsMobile] = useState(false)
  const pathname = usePathname()
  const locale: Locale = (pathname?.match(/^\/(de|en)(?:\/|$)/)?.[1] as Locale) ?? 'de'

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 500,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: isMobile ? '16px 20px' : '24px 48px',
      background: 'linear-gradient(to bottom, rgba(10,10,10,0.95) 0%, transparent 100%)',
      backdropFilter: 'blur(2px)',
    }}>
      <Link href={`/${locale}`} style={{
        fontFamily: 'var(--font-display)', fontSize: isMobile ? '1.5rem' : '2rem',
        letterSpacing: '0.08em', color: 'var(--warm-white)', textDecoration: 'none',
        display: 'flex', alignItems: 'center',
      }}>
        UNCUT<span style={{ color: 'var(--red)' }}>TV</span>
      </Link>

      {/* Nav links – nur Desktop */}
      {!isMobile && (
        <ul style={{ display: 'flex', gap: '36px', listStyle: 'none' }}>
          {['Filme', 'Neuheiten', 'Genres'].map((item) => (
            <li key={item}>
              <Link href="#" style={{
                color: 'var(--grey-light)', textDecoration: 'none',
                fontSize: '0.82rem', letterSpacing: '0.12em', textTransform: 'uppercase',
                transition: 'color 0.2s',
              }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--warm-white)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--grey-light)')}
              >
                {item}
              </Link>
            </li>
          ))}
        </ul>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <LanguageSwitch currentLocale={locale} />
        <Link href={`/${locale}/auth/login`} style={{
          color: 'var(--grey-light)', textDecoration: 'none',
          fontSize: '0.82rem', letterSpacing: '0.08em',
        }}>
          Anmelden
        </Link>
        {!isMobile && (
          <Link href={`/${locale}/auth/register`} className="btn-primary" style={{ padding: '10px 24px', fontSize: '0.82rem' }}>
            Jetzt starten
          </Link>
        )}
      </div>
    </nav>
  )
}
