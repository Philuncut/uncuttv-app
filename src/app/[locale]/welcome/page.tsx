'use client'

import Link from 'next/link'
import { useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { PRICING } from '@/lib/pricing'

/** Wartezeit bis zur automatischen Weiterleitung. Steht im Text und im Timer. */
const REDIRECT_SECONDS = 5

export default function WelcomePage() {
  const router = useRouter()
  const params = useParams()
  const locale = (params?.locale as string) ?? 'de'
  const t = useTranslations('welcome')
  // Die beiden Zeilen darunter stehen wortgleich im Hero -- derselbe Schluessel
  // statt einer zweiten Fassung, die auseinanderlaufen kann.
  const tHero = useTranslations('hero')

  useEffect(() => {
    const timer = setTimeout(() => router.push(`/${locale}/films`), REDIRECT_SECONDS * 1000)
    return () => clearTimeout(timer)
  }, [locale, router])

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--black)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px',
    }}>
      <div style={{ width: '100%', maxWidth: '480px', textAlign: 'center' }}>

        <Link href={`/${locale}`} style={{
          fontFamily: 'var(--font-display)', fontSize: '2.2rem',
          letterSpacing: '0.08em', color: 'var(--warm-white)',
          textDecoration: 'none', display: 'block', marginBottom: '48px',
        }}>
          UNCUT<span style={{ color: 'var(--red)' }}>TV</span>
        </Link>

        <div style={{
          background: 'var(--anthrazit2)',
          border: '1px solid rgba(255,255,255,0.08)',
          padding: '56px 40px', position: 'relative',
        }}>
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: '1px',
            background: 'linear-gradient(to right, transparent, var(--red), transparent)',
          }} />

          <div style={{ fontSize: '4rem', marginBottom: '24px' }}>🎬</div>

          <h1 style={{
            fontFamily: 'var(--font-display)', fontSize: '2.5rem',
            letterSpacing: '0.06em', marginBottom: '16px', color: 'var(--warm-white)',
          }}>
            {t('title')}<br />
            <span style={{ color: 'var(--red)' }}>UNCUTTV!</span>
          </h1>

          <p style={{
            fontSize: '0.95rem', color: 'var(--grey-light)',
            lineHeight: 1.8, marginBottom: '40px',
          }}>
            {t('trialStarted', { days: PRICING.trialDays })}<br />
            {tHero('tagline')}<br />
            {tHero('tagline2')}
          </p>

          <Link href={`/${locale}/films`} className="btn-primary" style={{
            display: 'block', textAlign: 'center', fontSize: '1rem', padding: '18px',
          }}>
            {t('cta')} →
          </Link>

          <p style={{ marginTop: '20px', fontSize: '0.75rem', color: 'var(--grey)' }}>
            {t('redirectHint', { seconds: REDIRECT_SECONDS })}
          </p>
        </div>
      </div>
    </div>
  )
}
