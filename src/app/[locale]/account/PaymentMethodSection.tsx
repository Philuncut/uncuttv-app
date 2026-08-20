'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'

/**
 * Zahlungsmethode.
 *
 * Bewusst als eigene Komponente: der Button ins Stripe-Portal ist ein
 * Zwischenschritt. Sobald eingebettete Stripe Elements kommen, wird genau
 * diese Datei ersetzt -- die Kontoseite selbst bleibt unberuehrt.
 */
export default function PaymentMethodSection({ locale }: { locale: string }) {
  const t = useTranslations('account')
  const supabase = createClient()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function openPortal() {
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
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ locale }),
      }).catch(() => null)

      const body = res && res.ok ? await res.json().catch(() => null) : null

      if (!body?.url) {
        setError(t('paymentError'))
        setLoading(false)
        return
      }

      window.location.href = body.url
    } catch {
      setError(t('paymentError'))
      setLoading(false)
    }
  }

  return (
    <>
      <p style={{ fontSize: '0.86rem', color: 'var(--grey)', lineHeight: 1.8, margin: '0 0 18px 0' }}>
        {t('paymentIntro')}
      </p>

      {error && (
        <p style={{ fontSize: '0.82rem', color: 'var(--red)', lineHeight: 1.6, margin: '0 0 14px 0' }}>
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={openPortal}
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
        {loading ? t('paymentLoading') : t('paymentButton')}
      </button>
    </>
  )
}
