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

  const platformLinks = [
    { label: t('allFilms'), href: `${base}/films` },
    { label: t('newReleases'), href: `${base}/neuheiten` },
    { label: t('genres'), href: `${base}/genres` },
    { label: t('search'), href: `${base}/films` },
  ]

  const legalLinks = [
    { label: t('imprint'), href: `${base}/impressum` },
    { label: t('privacy'), href: `${base}/datenschutz` },
    { label: t('terms'), href: `${base}/agb` },
    { label: t('youthProtection'), href: `${base}/jugendschutz` },
  ]

  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  const linkStyle: React.CSSProperties = {
    color: '#999',
    textDecoration: 'none',
    fontSize: '0.85rem',
    transition: 'color 0.2s',
  }

  const socialButtonStyle: React.CSSProperties = {
    width: '40px',
    height: '40px',
    borderRadius: '999px',
    background: '#1a1a1a',
    border: '1px solid #c0392b',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    transition: 'all 0.2s ease',
  }

  return (
    <footer style={{
      background: 'var(--black)',
      borderTop: '1px solid rgba(255,255,255,0.06)',
      padding: isMobile ? '32px 20px 24px' : '48px 48px 24px',
    }}>
      {isMobile ? (
        <>
          <div style={{ marginBottom: '24px' }}>
            <Link href={base} style={{
              fontFamily: 'var(--font-display)', fontSize: '1.8rem',
              letterSpacing: '0.08em', color: 'var(--warm-white)',
              textDecoration: 'none', display: 'inline-flex', marginBottom: '10px',
            }}>
              UNCUT<span style={{ color: 'var(--red)' }}>TV</span>
            </Link>
            <p style={{ fontSize: '0.82rem', color: 'var(--grey)', lineHeight: 1.6 }}>
              {t('description')}
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '24px',
            marginBottom: '20px',
          }}>
            <div>
              <h4 style={{ fontSize: '0.72rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--grey)', marginBottom: '12px' }}>
                {t('platform')}
              </h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {platformLinks.map((item) => (
                  <li key={item.href + item.label} style={{ marginBottom: '8px' }}>
                    <Link
                      href={item.href}
                      style={linkStyle}
                      onMouseEnter={(e) => (e.currentTarget.style.color = '#fff')}
                      onMouseLeave={(e) => (e.currentTarget.style.color = '#999')}
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 style={{ fontSize: '0.72rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--grey)', marginBottom: '12px' }}>
                {t('legal')}
              </h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {legalLinks.map((item) => (
                  <li key={item.href + item.label} style={{ marginBottom: '8px' }}>
                    <Link
                      href={item.href}
                      style={linkStyle}
                      onMouseEnter={(e) => (e.currentTarget.style.color = '#fff')}
                      onMouseLeave={(e) => (e.currentTarget.style.color = '#999')}
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </>
      ) : (
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: '36px',
          marginBottom: '24px',
        }}>
          <div style={{ minWidth: '240px', maxWidth: '280px' }}>
            <Link href={base} style={{
              fontFamily: 'var(--font-display)', fontSize: '1.9rem',
              letterSpacing: '0.08em', color: 'var(--warm-white)',
              textDecoration: 'none', display: 'inline-flex', marginBottom: '10px',
            }}>
              UNCUT<span style={{ color: 'var(--red)' }}>TV</span>
            </Link>
            <p style={{ fontSize: '0.82rem', color: 'var(--grey)', lineHeight: 1.6 }}>
              {t('description')}
            </p>
          </div>

          <div>
            <h4 style={{ fontSize: '0.72rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--grey)', marginBottom: '12px' }}>
              {t('platform')}
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {platformLinks.map((item) => (
                <li key={item.href + item.label} style={{ marginBottom: '8px' }}>
                  <Link
                    href={item.href}
                    style={linkStyle}
                    onMouseEnter={(e) => (e.currentTarget.style.color = '#fff')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = '#999')}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 style={{ fontSize: '0.72rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--grey)', marginBottom: '12px' }}>
              {t('legal')}
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {legalLinks.map((item) => (
                <li key={item.href + item.label} style={{ marginBottom: '8px' }}>
                  <Link
                    href={item.href}
                    style={linkStyle}
                    onMouseEnter={(e) => (e.currentTarget.style.color = '#fff')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = '#999')}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <SocialIcons socialButtonStyle={socialButtonStyle} />
          </div>
        </div>
      )}

      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        marginBottom: '20px',
      }}>
        {isMobile && <SocialIcons socialButtonStyle={socialButtonStyle} />}
      </div>

      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.06)',
        flexWrap: 'wrap', gap: '12px',
      }}>
        <p style={{ fontSize: '0.75rem', color: 'var(--grey)', letterSpacing: '0.06em' }}>
          {t('copyright')}
        </p>
      </div>
    </footer>
  )
}

function SocialIcons({ socialButtonStyle }: { socialButtonStyle: React.CSSProperties }) {
  return (
    <>
      <a
        href="https://www.facebook.com/uncuthorror.TV"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Facebook"
        style={socialButtonStyle}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = '#e74c3c'
          e.currentTarget.style.boxShadow = '0 0 8px rgba(192,57,43,0.6)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = '#c0392b'
          e.currentTarget.style.boxShadow = 'none'
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.9 3.78-3.9 1.1 0 2.24.2 2.24.2v2.46H15.2c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.45 2.89h-2.33v6.99A10 10 0 0 0 22 12" />
        </svg>
      </a>

      <a
        href="https://www.instagram.com/uncut_tv_/"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Instagram"
        style={socialButtonStyle}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = '#e74c3c'
          e.currentTarget.style.boxShadow = '0 0 8px rgba(192,57,43,0.6)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = '#c0392b'
          e.currentTarget.style.boxShadow = 'none'
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M7.75 2h8.5A5.75 5.75 0 0 1 22 7.75v8.5A5.75 5.75 0 0 1 16.25 22h-8.5A5.75 5.75 0 0 1 2 16.25v-8.5A5.75 5.75 0 0 1 7.75 2m0 1.8A3.95 3.95 0 0 0 3.8 7.75v8.5a3.95 3.95 0 0 0 3.95 3.95h8.5a3.95 3.95 0 0 0 3.95-3.95v-8.5a3.95 3.95 0 0 0-3.95-3.95h-8.5M17.35 5.2a1.45 1.45 0 1 1 0 2.9 1.45 1.45 0 0 1 0-2.9M12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10m0 1.8a3.2 3.2 0 1 0 0 6.4 3.2 3.2 0 0 0 0-6.4" />
        </svg>
      </a>

      <a
        href="https://www.youtube.com/@uncut-tv"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="YouTube"
        style={socialButtonStyle}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = '#e74c3c'
          e.currentTarget.style.boxShadow = '0 0 8px rgba(192,57,43,0.6)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = '#c0392b'
          e.currentTarget.style.boxShadow = 'none'
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6a3 3 0 0 0-2.1 2.1C0 8.1 0 12 0 12s0 3.9.5 5.8a3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1c.5-1.9.5-5.8.5-5.8s0-3.9-.5-5.8M9.6 15.6V8.4l6.2 3.6-6.2 3.6" />
        </svg>
      </a>
    </>
  )
}
