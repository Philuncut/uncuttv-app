'use client'

import { useCallback, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { loadStripe, type Appearance, type StripeElementLocale } from '@stripe/stripe-js'
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js'
import { createClient } from '@/lib/supabase/client'
import type { StoredPaymentMethod } from '@/lib/payment-methods'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

/**
 * Elements an das dunkle Design angeglichen. Die Werte spiegeln die
 * Design-Tokens aus globals.css -- Stripe rendert in einem iframe und kann
 * unsere CSS-Variablen nicht lesen, deshalb hier als Literale.
 */
const APPEARANCE: Appearance = {
  theme: 'night',
  variables: {
    colorPrimary: '#d52029',
    colorBackground: '#1c1c1c',
    colorText: '#f0ece4',
    colorTextSecondary: '#bbbbbb',
    colorTextPlaceholder: '#888888',
    colorDanger: '#d52029',
    fontFamily: "'DM Sans', Helvetica, Arial, sans-serif",
    fontSizeBase: '15px',
    borderRadius: '0px',
    spacingUnit: '4px',
  },
  rules: {
    '.Input': {
      backgroundColor: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.12)',
      boxShadow: 'none',
    },
    '.Input:focus': {
      border: '1px solid #d52029',
      boxShadow: 'none',
    },
    '.Label': {
      color: '#888888',
      fontSize: '12px',
      letterSpacing: '0.12em',
      textTransform: 'uppercase',
    },
    '.Tab': {
      backgroundColor: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.12)',
      boxShadow: 'none',
    },
    '.Tab--selected': {
      backgroundColor: 'rgba(213,32,41,0.10)',
      border: '1px solid #d52029',
      color: '#f0ece4',
    },
  },
}

export default function PaymentMethodSection({
  locale,
  current,
}: {
  locale: string
  current: StoredPaymentMethod | null
}) {
  const t = useTranslations('account')
  const supabase = createClient()

  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [preparing, setPreparing] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [portalLoading, setPortalLoading] = useState(false)

  const startChange = useCallback(async () => {
    setError('')
    setSuccess(false)
    setPreparing(true)

    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session?.access_token) {
      window.location.href = `/${locale}/auth/login`
      return
    }

    const res = await fetch('/api/stripe/setup-intent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
    }).catch(() => null)

    const body = res && res.ok ? await res.json().catch(() => null) : null

    setPreparing(false)

    if (!body?.clientSecret) {
      setError(res ? t('paymentSetupError') : t('paymentNetworkError'))
      return
    }

    setClientSecret(body.clientSecret)
  }, [locale, supabase, t])

  async function openPortal() {
    setError('')
    setPortalLoading(true)

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
      setPortalLoading(false)
      setError(t('paymentError'))
      return
    }

    window.location.href = body.url
  }

  const elementsOptions = useMemo(
    () =>
      clientSecret
        ? {
            clientSecret,
            appearance: APPEARANCE,
            locale: (locale === 'de' ? 'de' : 'en') as StripeElementLocale,
          }
        : null,
    [clientSecret, locale]
  )

  return (
    <>
      {/* Aktuelle Zahlungsmethode */}
      <div style={{ marginBottom: '20px' }}>
        <div
          style={{
            fontSize: '0.72rem',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'var(--grey)',
            marginBottom: '8px',
          }}
        >
          {t('paymentCurrent')}
        </div>

        {current ? (
          <div style={{ fontSize: '0.95rem', color: 'var(--warm-white)', lineHeight: 1.7 }}>
            {current.type === 'sepa_debit' ? (
              t('paymentSepa', { last4: current.last4 ?? '••••' })
            ) : (
              <>
                <span style={{ textTransform: 'capitalize' }}>{current.brand ?? 'Karte'}</span>
                {' •••• '}
                {current.last4 ?? '••••'}
                {current.expMonth && current.expYear && (
                  <span
                    style={{ display: 'block', fontSize: '0.8rem', color: 'var(--grey)', marginTop: '4px' }}
                  >
                    {t('paymentExpires', {
                      month: String(current.expMonth).padStart(2, '0'),
                      year: String(current.expYear),
                    })}
                  </span>
                )}
              </>
            )}
          </div>
        ) : (
          <p style={{ fontSize: '0.88rem', color: 'var(--grey-light)', margin: 0 }}>
            {t('paymentNone')}
          </p>
        )}
      </div>

      {success && (
        <p
          role="status"
          style={{ fontSize: '0.82rem', color: '#22c55e', lineHeight: 1.6, margin: '0 0 14px 0' }}
        >
          {t('paymentSuccess')}
        </p>
      )}

      {error && (
        <p style={{ fontSize: '0.82rem', color: 'var(--red)', lineHeight: 1.6, margin: '0 0 14px 0' }}>
          {error}
        </p>
      )}

      {/* Formular oder Auslöser */}
      {clientSecret && elementsOptions ? (
        <Elements stripe={stripePromise} options={elementsOptions}>
          <PaymentMethodForm
            onDone={() => {
              setClientSecret(null)
              setSuccess(true)
            }}
            onCancel={() => setClientSecret(null)}
            onError={setError}
          />
        </Elements>
      ) : (
        <button
          type="button"
          onClick={startChange}
          disabled={preparing}
          className="btn-primary"
          style={{
            width: '100%',
            textAlign: 'center',
            display: 'block',
            cursor: preparing ? 'default' : 'pointer',
            opacity: preparing ? 0.6 : 1,
          }}
        >
          {preparing ? t('paymentPreparing') : current ? t('paymentChange') : t('paymentAdd')}
        </button>
      )}

      {/* Rechnungshistorie bilden wir nicht selbst ab -- die bleibt im Portal. */}
      <button
        type="button"
        onClick={openPortal}
        disabled={portalLoading}
        style={{
          display: 'block',
          width: '100%',
          marginTop: '14px',
          padding: '4px',
          background: 'none',
          border: 'none',
          color: 'var(--grey)',
          fontSize: '0.8rem',
          textDecoration: 'underline',
          textUnderlineOffset: '3px',
          cursor: portalLoading ? 'default' : 'pointer',
        }}
      >
        {portalLoading ? t('paymentInvoicesLoading') : t('paymentInvoices')}
      </button>
    </>
  )
}

function PaymentMethodForm({
  onDone,
  onCancel,
  onError,
}: {
  onDone: () => void
  onCancel: () => void
  onError: (message: string) => void
}) {
  const t = useTranslations('account')
  const stripe = useStripe()
  const elements = useElements()
  const router = useRouter()
  const supabase = createClient()

  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!stripe || !elements) return

    onError('')
    setSaving(true)

    // redirect: 'if_required' laesst 3D-Secure in Stripes eigenem Dialog
    // laufen, ohne die Seite zu verlassen.
    const { error: stripeError, setupIntent } = await stripe.confirmSetup({
      elements,
      redirect: 'if_required',
    })

    if (stripeError) {
      setSaving(false)
      if (stripeError.type === 'card_error') onError(t('paymentDeclined'))
      else if (stripeError.type === 'validation_error') onError(stripeError.message ?? t('paymentDeclined'))
      else onError(t('paymentAuthFailed'))
      return
    }

    const paymentMethodId =
      typeof setupIntent?.payment_method === 'string'
        ? setupIntent.payment_method
        : (setupIntent?.payment_method?.id ?? null)

    if (setupIntent?.status !== 'succeeded' || !paymentMethodId) {
      setSaving(false)
      onError(t('paymentAuthFailed'))
      return
    }

    const {
      data: { session },
    } = await supabase.auth.getSession()

    const res = await fetch('/api/stripe/payment-method', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session?.access_token ?? ''}`,
      },
      body: JSON.stringify({ paymentMethodId }),
    }).catch(() => null)

    const body = res && res.ok ? await res.json().catch(() => null) : null

    setSaving(false)

    // Die Methode liegt jetzt bei Stripe, ist aber nicht als Standard gesetzt.
    // Das darf nicht als Erfolg durchgehen: sonst glaubt der Kunde, die neue
    // Karte greife, und die naechste Abbuchung laeuft ueber die alte.
    if (!body?.ok) {
      onError(t('paymentSaveError'))
      return
    }

    onDone()
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement options={{ layout: 'tabs' }} />

      <button
        type="submit"
        disabled={!stripe || saving}
        className="btn-primary"
        style={{
          width: '100%',
          textAlign: 'center',
          display: 'block',
          marginTop: '18px',
          cursor: saving ? 'default' : 'pointer',
          opacity: saving ? 0.6 : 1,
        }}
      >
        {saving ? t('paymentSaving') : t('paymentSave')}
      </button>

      <button
        type="button"
        onClick={onCancel}
        disabled={saving}
        style={{
          width: '100%',
          marginTop: '10px',
          padding: '12px',
          background: 'transparent',
          border: '1px solid rgba(255,255,255,0.12)',
          color: 'var(--grey-light)',
          fontSize: '0.84rem',
          cursor: 'pointer',
        }}
      >
        {t('paymentCancel')}
      </button>
    </form>
  )
}
