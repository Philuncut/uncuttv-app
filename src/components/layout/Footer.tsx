'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'

export default function Footer() {
  const t = useTranslations('footer')
  const pathname = usePathname()
  const locale = (pathname?.match(/^\/(de|en)(?:\/|$)/)?.[1]) ?? 'de'
  const base = `/${locale}`

  const linkGroups = [
    [
      { label: t('allFilms'), href: `${base}/films` },
      { label: t('newReleases'), href: `${base}/films` },
      { label: t('genres'), href: `${base}/films` },
      { label: t('search'), href: `${base}/films` },
    ],
    [
      { label: t('newReleases'), href: `${base}/films` },
      { label: t('genres'), href: `${base}/films` },
      { label: t('genres'), href: `${base}/films` },
      { label: t('faq'), href: `${base}/faq` },
    ],
    [
      { label: t('imprint'), href: `${base}/impressum` },
      { label: t('privacy'), href: `${base}/datenschutz` },
      { label: t('terms'), href: `${base}/agb` },
      { label: t('youthProtection'), href: `${base}/jugendschutz` },
    ],
  ]
  const titles = [t('platform'), t('discover'), t('legal')]

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
        <Link href={base} style={{
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
          {t('description')}
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr 1fr' : '1fr 1fr 1fr',
        gap: isMobile ? '32px 24px' : '48px',
        marginBottom: '40px',
      }}>
        {linkGroups.map((items, i) => (
          <div key={i}>
            <h4 style={{
              fontSize: '0.72rem', letterSpacing: '0.18em',
              textTransform: 'uppercase', color: 'var(--grey)', marginBottom: '16px',
            }}>
              {titles[i]}
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {items.map((item) => (
                <li key={item.href + item.label} style={{ marginBottom: '10px' }}>
                  <Link href={item.href} style={{ color: 'var(--grey-light)', textDecoration: 'none', fontSize: '0.85rem' }}>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        paddingTop: '24px', borderTop: '1px solid rgba(255,255,255,0.06)',
        flexWrap: 'wrap', gap: '12px',
      }}>
        <p style={{ fontSize: '0.75rem', color: 'var(--grey)', letterSpacing: '0.06em' }}>
          {t('copyright')}
        </p>
        <span style={{
          background: 'var(--red)', color: 'white',
          fontSize: '0.7rem', fontWeight: 700, padding: '3px 8px', letterSpacing: '0.06em',
        }}>
          {t('ageBadge')}
        </span>
      </div>
    </footer>
  )
}
