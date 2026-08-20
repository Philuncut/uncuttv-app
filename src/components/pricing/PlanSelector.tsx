'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'

/**
 * Der Jahrestarif ist ausgeblendet, weil AGB Paragraph 4 nur den Monatstarif
 * beschreibt. Auf true setzen, sobald die AGB ihn abdecken - Umschalter,
 * Jahrespreis und Ersparnis-Hinweis erscheinen dann wieder.
 *
 * Steht hier und nicht in den einbindenden Seiten: Startseite und /subscribe
 * teilen sich diese Komponente, der Schalter darf nur an einer Stelle
 * existieren.
 */
const SHOW_YEARLY_PLAN = false

/**
 * Tarifauswahl mit Preis, Leistungen und Checkout-Button.
 *
 * Wird an zwei Stellen eingebunden: auf der Startseite innerhalb des
 * Marketing-Abschnitts (PricingSection) und auf /subscribe als nackte
 * Konversionsseite fuer Rueckkehrer und Checkout-Abbrecher.
 */
export default function PlanSelector() {
  const t = useTranslations('pricing')
  const pathname = usePathname()
  const locale = pathname?.match(/^\/(de|en)(?:\/|$)/)?.[1] ?? 'de'

  const [plan, setPlan] = useState<'monthly' | 'yearly'>('monthly')
  const [isMobile, setIsMobile] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

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

  const isYearly = SHOW_YEARLY_PLAN && plan === 'yearly'
  const effectivePlan = isYearly ? 'yearly' : 'monthly'

  async function handleCheckout() {
    setError('')
    setLoading(true)

    const res = await fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan: effectivePlan }),
    }).catch(() => null)

    // Nicht eingeloggt: zur Anmeldung. Frueher ging jeder Fehlschlag pauschal
    // auf /auth/register -- auf /subscribe waere das falsch, dort hat der
    // Nutzer bereits ein Konto.
    if (res?.status === 401) {
      window.location.href = `/${locale}/auth/login`
      return
    }

    const body = res && res.ok ? await res.json().catch(() => null) : null

    if (!body?.url) {
      setLoading(false)
      setError(t('checkoutError'))
      return
    }

    window.location.href = body.url
  }

  return (
    <>
      {SHOW_YEARLY_PLAN && (
        <div
          style={{
            display: 'inline-flex',
            marginBottom: isMobile ? '32px' : '48px',
            border: '1px solid rgba(255,255,255,0.12)',
            overflow: 'hidden',
          }}
        >
          <button
            onClick={() => setPlan('monthly')}
            style={{
              padding: '10px 24px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.82rem',
              letterSpacing: '0.08em',
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
              padding: '10px 24px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.82rem',
              letterSpacing: '0.08em',
              background: isYearly ? 'var(--red)' : 'transparent',
              color: isYearly ? 'white' : 'var(--grey)',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            Jährlich
            <span
              style={{
                fontSize: '0.65rem',
                background: 'rgba(255,255,255,0.15)',
                padding: '2px 6px',
                letterSpacing: '0.06em',
              }}
            >
              -16%
            </span>
          </button>
        </div>
      )}

      <div
        style={{
          maxWidth: '480px',
          margin: '0 auto',
          background: 'var(--anthrazit2)',
          border: '1px solid rgba(var(--red-rgb),0.25)',
          padding: isMobile ? '32px 24px' : '56px 48px',
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '1px',
            background: 'linear-gradient(to right, transparent, var(--red), transparent)',
          }}
        />

        {/* Preis */}
        <div style={{ marginBottom: '24px' }}>
          <div
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: isMobile ? '3rem' : '4rem',
              letterSpacing: '0.02em',
              color: 'var(--warm-white)',
              lineHeight: 1,
            }}
          >
            <sup style={{ fontSize: '0.4em', color: 'var(--red)', verticalAlign: 'super' }}>€</sup>
            {isYearly ? '199,90' : '19,90'}
          </div>
          <div
            style={{
              fontSize: '0.8rem',
              color: 'var(--grey)',
              letterSpacing: '0.1em',
              marginTop: '6px',
            }}
          >
            {isYearly ? 'PRO JAHR · entspricht 16,66€/Monat' : 'PRO MONAT · 7 Tage kostenlos testen'}
          </div>
          {isYearly && (
            <div
              style={{
                marginTop: '8px',
                fontSize: '0.75rem',
                color: '#22c55e',
                letterSpacing: '0.06em',
              }}
            >
              Du sparst 38,90€ im Vergleich zum Monatsabo
            </div>
          )}
        </div>

        <div
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: isMobile ? '1.3rem' : '1.6rem',
            letterSpacing: '0.06em',
            color: 'var(--warm-white)',
            marginBottom: '24px',
          }}
        >
          {t('headline')}
        </div>

        <ul style={{ listStyle: 'none', marginBottom: '32px', textAlign: 'left' }}>
          {FEATURES.map((f) => (
            <li
              key={f}
              style={{
                padding: '10px 0',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                fontSize: '0.88rem',
                color: 'var(--grey-light)',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              <span style={{ color: 'var(--red)', flexShrink: 0 }}>—</span>
              {f}
            </li>
          ))}
        </ul>

        {error && (
          <p
            style={{
              fontSize: '0.8rem',
              color: 'var(--red)',
              lineHeight: 1.6,
              marginBottom: '16px',
            }}
          >
            {error}
          </p>
        )}

        <button
          onClick={handleCheckout}
          disabled={loading}
          className="btn-primary"
          style={{
            width: '100%',
            textAlign: 'center',
            display: 'block',
            cursor: loading ? 'default' : 'pointer',
            opacity: loading ? 0.6 : 1,
          }}
        >
          {loading ? t('checkoutLoading') : t('cta')}
        </button>

        <p
          style={{
            fontSize: '0.72rem',
            color: 'var(--grey)',
            letterSpacing: '0.08em',
            marginTop: '24px',
          }}
        >
          ⚠ {t('disclaimer')}
        </p>
      </div>
    </>
  )
}
