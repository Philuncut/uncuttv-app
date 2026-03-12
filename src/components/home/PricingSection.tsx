'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'

export default function PricingSection() {
  const t = useTranslations('pricing')
  const pathname = usePathname()
  const locale = (pathname?.match(/^\/(de|en)(?:\/|$)/)?.[1]) ?? 'de'
  const [plan, setPlan] = useState<'monthly' | 'yearly'>('monthly')
  const [isMobile, setIsMobile] = useState(false)

  const FEATURES = [
    t('features.streaming'),
    t('features.quality'),
    t('features.new'),
    t('features.devices'),
    t('features.cancel'),
    t('features.content'),
  ]

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  const isYearly = plan === 'yearly'

  async function handleCheckout() {
    const res = await fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan }),
    })
    const { url } = await res.json()
    if (url) window.location.href = url
    else window.location.href = `/${locale}/auth/register`
  }

  return (
    <section id="pricing" style={{
      padding: isMobile ? '48px 20px' : '100px 48px',
      textAlign: 'center',
    }}>
      <div style={{
        fontSize: '0.72rem', letterSpacing: '0.22em',
        textTransform: 'uppercase', color: 'var(--red)', marginBottom: '16px',
      }}>
        {t('eyebrow')}
      </div>

      <h2 style={{
        fontFamily: 'var(--font-display)',
        fontSize: isMobile ? 'clamp(2rem, 8vw, 3.5rem)' : 'clamp(3rem, 6vw, 6rem)',
        letterSpacing: '0.04em', marginBottom: '16px',
      }}>
        {t('title')}
      </h2>

      <p style={{
        fontFamily: 'var(--font-body)', fontWeight: 300,
        fontSize: '1rem', letterSpacing: '0.08em',
        color: 'var(--grey)', marginBottom: '32px',
      }}>
        {t('subtitle')}
      </p>

      {/* Toggle */}
      <div style={{
        display: 'inline-flex', marginBottom: isMobile ? '32px' : '48px',
        border: '1px solid rgba(255,255,255,0.12)',
        overflow: 'hidden',
      }}>
        <button
          onClick={() => setPlan('monthly')}
          style={{
            padding: '10px 24px', border: 'none', cursor: 'pointer',
            fontSize: '0.82rem', letterSpacing: '0.08em',
            background: !isYearly ? 'var(--red)' : 'transparent',
            color: !isYearly ? 'white' : 'var(--grey)',
            transition: 'all 0.2s',
          }}
        >
          Monatlich
        </button>
        <button
          onClick={() => setPlan('yearly')}
          style={{
            padding: '10px 24px', border: 'none', cursor: 'pointer',
            fontSize: '0.82rem', letterSpacing: '0.08em',
            background: isYearly ? 'var(--red)' : 'transparent',
            color: isYearly ? 'white' : 'var(--grey)',
            transition: 'all 0.2s',
            display: 'flex', alignItems: 'center', gap: '8px',
          }}
        >
          Jährlich
          <span style={{
            fontSize: '0.65rem', background: 'rgba(255,255,255,0.15)',
            padding: '2px 6px', letterSpacing: '0.06em',
          }}>
            -16%
          </span>
        </button>
      </div>

      <div style={{
        maxWidth: '480px', margin: '0 auto',
        background: 'var(--anthrazit2)',
        border: '1px solid rgba(229,9,20,0.25)',
        padding: isMobile ? '32px 24px' : '56px 48px',
        position: 'relative',
      }}>
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '1px',
          background: 'linear-gradient(to right, transparent, var(--red), transparent)',
        }} />

        {/* Price display */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{
            fontFamily: 'var(--font-display)',
            fontSize: isMobile ? '3rem' : '4rem',
            letterSpacing: '0.02em', color: 'var(--warm-white)',
            lineHeight: 1,
          }}>
            <sup style={{ fontSize: '0.4em', color: 'var(--red)', verticalAlign: 'super' }}>€</sup>
            {isYearly ? '199,90' : '19,90'}
          </div>
          <div style={{
            fontSize: '0.8rem', color: 'var(--grey)',
            letterSpacing: '0.1em', marginTop: '6px',
          }}>
            {isYearly ? 'PRO JAHR · entspricht 16,66€/Monat' : 'PRO MONAT · 7 Tage kostenlos testen'}
          </div>
          {isYearly && (
            <div style={{
              marginTop: '8px', fontSize: '0.75rem',
              color: '#22c55e', letterSpacing: '0.06em',
            }}>
              Du sparst 38,90€ im Vergleich zum Monatsabo
            </div>
          )}
        </div>

        <div style={{
          fontFamily: 'var(--font-display)', fontSize: isMobile ? '1.3rem' : '1.6rem',
          letterSpacing: '0.06em', color: 'var(--warm-white)', marginBottom: '24px',
        }}>
          {t('headline')}
        </div>

        <ul style={{ listStyle: 'none', marginBottom: '32px', textAlign: 'left' }}>
          {FEATURES.map((f) => (
            <li key={f} style={{
              padding: '10px 0',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
              fontSize: '0.88rem', color: 'var(--grey-light)',
              display: 'flex', alignItems: 'center', gap: '12px',
            }}>
              <span style={{ color: 'var(--red)', flexShrink: 0 }}>—</span>
              {f}
            </li>
          ))}
        </ul>

        <button
          onClick={handleCheckout}
          className="btn-primary"
          style={{ width: '100%', textAlign: 'center', display: 'block', cursor: 'pointer' }}
        >
          {t('cta')}
        </button>

        <p style={{
          fontSize: '0.72rem', color: 'var(--grey)',
          letterSpacing: '0.08em', marginTop: '24px',
        }}>
          ⚠ {t('disclaimer')}
        </p>
      </div>
    </section>
  )
}
