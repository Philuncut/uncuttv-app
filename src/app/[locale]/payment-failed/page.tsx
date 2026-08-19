'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'

/**
 * Zielort nach einer gescheiterten Zahlung. Der Nutzer soll hier drei Dinge
 * erfahren: was passiert ist, was das fuer seinen Zugang bedeutet und was er
 * konkret tun kann. Die wichtigste Handlung ist die Zahlungsmethode zu
 * aktualisieren -- deshalb steht der Stripe-Portal-Button oben.
 */
export default function PaymentFailedPage() {
  const params = useParams()
  const locale = (params?.locale as string) ?? 'de'
  const t = useTranslations('paymentFailed')
  const supabase = createClient()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function openBillingPortal() {
    setError('')
    setLoading(true)
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session?.access_token) {
        window.location.href = `/${locale}/auth/login`
        return
      }

      const res = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}` },
      }).catch(() => null)

      const body = res && res.ok ? await res.json().catch(() => null) : null

      if (!body?.url) {
        setError(t('portalError'))
        setLoading(false)
        return
      }

      window.location.href = body.url
    } catch {
      setError(t('portalError'))
      setLoading(false)
    }
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        background: 'var(--black)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '96px 20px 64px',
      }}
    >
      <div style={{ width: '100%', maxWidth: '540px' }}>
        <div
          style={{
            background: 'var(--anthrazit2)',
            border: '1px solid rgba(255,255,255,0.08)',
            padding: '44px 40px',
            position: 'relative',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '3px',
              background: 'var(--red)',
            }}
          />

          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.9rem',
              letterSpacing: '0.06em',
              color: 'var(--warm-white)',
              margin: '0 0 14px 0',
            }}
          >
            {t('title')}
          </h1>

          <p
            style={{
              fontSize: '0.92rem',
              color: 'var(--grey-light)',
              lineHeight: 1.8,
              marginBottom: '10px',
            }}
          >
            {t('lead')}
          </p>

          <p
            style={{
              fontSize: '0.86rem',
              color: 'var(--grey)',
              lineHeight: 1.8,
              marginBottom: '26px',
            }}
          >
            {t('accessNote')}
          </p>

          {/* Haeufige Ursachen */}
          <div
            style={{
              border: '1px solid rgba(255,255,255,0.12)',
              background: 'rgba(255,255,255,0.03)',
              padding: '20px 22px',
              marginBottom: '28px',
            }}
          >
            <div
              style={{
                fontSize: '0.68rem',
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                color: 'var(--red)',
                marginBottom: '14px',
              }}
            >
              {t('reasonsTitle')}
            </div>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {[t('reason1'), t('reason2'), t('reason3'), t('reason4')].map((reason) => (
                <li
                  key={reason}
                  style={{
                    display: 'flex',
                    gap: '10px',
                    fontSize: '0.84rem',
                    color: 'var(--grey-light)',
                    lineHeight: 1.7,
                    padding: '5px 0',
                  }}
                >
                  <span style={{ color: 'var(--red)', flexShrink: 0 }}>—</span>
                  <span>{reason}</span>
                </li>
              ))}
            </ul>
          </div>

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
            onClick={openBillingPortal}
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
            {loading ? t('portalLoading') : t('updatePayment')}
          </button>

          <Link
            href={`/${locale}/subscribe`}
            style={{
              display: 'block',
              textAlign: 'center',
              marginTop: '16px',
              fontSize: '0.84rem',
              color: 'var(--grey-light)',
              textDecoration: 'none',
              padding: '12px',
              border: '1px solid rgba(255,255,255,0.12)',
            }}
          >
            {t('backToCheckout')}
          </Link>

          <p
            style={{
              fontSize: '0.78rem',
              color: 'var(--grey)',
              lineHeight: 1.8,
              margin: '22px 0 0 0',
            }}
          >
            {t.rich('needHelp', {
              support: (chunks) => (
                <a
                  href="mailto:support@uncuttv.at"
                  style={{ color: 'var(--red)', textDecoration: 'none' }}
                >
                  {chunks}
                </a>
              ),
            })}
          </p>
        </div>
      </div>
    </main>
  )
}
