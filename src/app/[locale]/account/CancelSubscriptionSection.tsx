'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'

/**
 * Kuendigung aus dem eingeloggten Konto.
 *
 * Hier ist die automatische Ausfuehrung ueber die Stripe-API richtig: der
 * Nutzer ist angemeldet und damit identifiziert. Die oeffentliche Seite
 * /kuendigung bleibt daneben bestehen -- Paragraph 312k BGB verlangt einen
 * Weg ohne Login, und dort ist die Identitaet ungeprueft, weshalb sie
 * bewusst nicht automatisch ausfuehrt.
 */
export default function CancelSubscriptionSection({
  locale,
  accessUntil,
  alreadyCanceled,
  ageVerified,
  accessExpired,
}: {
  locale: string
  /** ISO-Datum, bis zu dem der Zugang bestehen bleibt. Null, wenn unbekannt. */
  accessUntil: string | null
  alreadyCanceled: boolean
  /** Steuert nur die Anzeige -- die verbindliche Pruefung macht die Route. */
  ageVerified: boolean
  /** Serverseitig ermittelt: Date.now() beim Rendern liefe zwischen Server und Client auseinander. */
  accessExpired: boolean
}) {
  const t = useTranslations('account')
  const router = useRouter()
  const supabase = createClient()

  const [confirming, setConfirming] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const [reactivated, setReactivated] = useState(false)

  const formattedUntil = accessUntil
    ? new Date(accessUntil).toLocaleDateString(locale === 'de' ? 'de-AT' : 'en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    : null

  async function handleReactivate() {
    setError('')
    setSaving(true)

    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session?.access_token) {
      window.location.href = `/${locale}/auth/login`
      return
    }

    const res = await fetch('/api/stripe/reactivate-subscription', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
    }).catch(() => null)

    const body = res && res.ok ? await res.json().catch(() => null) : null

    setSaving(false)

    if (!body?.ok) {
      setError(t('reactivateError'))
      return
    }

    setReactivated(true)
    router.refresh()
  }

  // --- Gekuendigt: entweder zuruecknehmen, verifizieren oder neu abschliessen
  if ((alreadyCanceled || done) && !reactivated) {
    // Kuendigung stammt vom Altersgate: die darf hier nicht aufgehoben werden,
    // sonst haette jemand ohne Verifikation wieder Zugang.
    if (!ageVerified) {
      return (
        <>
          <p style={noteStyle}>{t('reactivateAgeGate')}</p>
          <Link
            href={`/${locale}/auth/verify-age`}
            className="btn-primary"
            style={{
              display: 'block',
              width: '100%',
              textAlign: 'center',
              textDecoration: 'none',
              marginTop: '18px',
            }}
          >
            {t('reactivateAgeGateCta')}
          </Link>
        </>
      )
    }

    // Zeitpunkt verstrichen: es gibt nichts mehr zurueckzunehmen.
    if (accessExpired || !formattedUntil) {
      return (
        <>
          <p style={noteStyle}>{t('canceledExpired')}</p>
          <Link
            href={`/${locale}/subscribe`}
            className="btn-primary"
            style={{
              display: 'block',
              width: '100%',
              textAlign: 'center',
              textDecoration: 'none',
              marginTop: '18px',
            }}
          >
            {t('canceledExpiredCta')}
          </Link>
        </>
      )
    }

    return (
      <>
        <p style={{ ...noteStyle, color: 'var(--warm-white)', marginBottom: '8px' }}>
          {t('reactivateTitle', { date: formattedUntil })}
        </p>
        <p style={noteStyle}>{t('reactivateIntro')}</p>

        {error && (
          <p style={{ fontSize: '0.82rem', color: 'var(--red)', lineHeight: 1.6, margin: '14px 0 0 0' }}>
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={handleReactivate}
          disabled={saving}
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
          {saving ? t('reactivateSaving') : t('reactivateButton')}
        </button>
      </>
    )
  }

  if (reactivated) {
    return (
      <p role="status" style={{ ...noteStyle, color: '#22c55e' }}>
        {t('reactivateSuccess')}
      </p>
    )
  }

  async function handleCancel() {
    setError('')
    setSaving(true)

    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session?.access_token) {
      window.location.href = `/${locale}/auth/login`
      return
    }

    const res = await fetch('/api/stripe/cancel-subscription', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
    }).catch(() => null)

    const body = res && res.ok ? await res.json().catch(() => null) : null

    setSaving(false)

    if (!body?.ok) {
      setError(t('cancelError'))
      return
    }

    setConfirming(false)
    setDone(true)
    // Der Abo-Status weiter oben wird serverseitig gerendert und muss neu
    // geladen werden, damit er die Kuendigung zeigt.
    router.refresh()
  }

  return (
    <>
      <p style={{ fontSize: '0.86rem', color: 'var(--grey)', lineHeight: 1.8, margin: '0 0 18px 0' }}>
        {t('cancelIntro')}
      </p>

      {error && (
        <p style={{ fontSize: '0.82rem', color: 'var(--red)', lineHeight: 1.6, margin: '0 0 14px 0' }}>
          {error}
        </p>
      )}

      {!confirming ? (
        <button type="button" onClick={() => setConfirming(true)} style={dangerButtonStyle}>
          {t('cancelButton')}
        </button>
      ) : (
        <div
          style={{
            border: '1px solid rgba(var(--red-rgb),0.4)',
            background: 'rgba(var(--red-rgb),0.06)',
            padding: '20px 22px',
          }}
        >
          <div
            style={{
              fontSize: '0.68rem',
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              color: 'var(--red)',
              marginBottom: '10px',
            }}
          >
            {t('cancelConfirmTitle')}
          </div>

          <p
            style={{
              fontSize: '0.88rem',
              color: 'var(--warm-white)',
              lineHeight: 1.8,
              margin: '0 0 18px 0',
            }}
          >
            {formattedUntil
              ? t('cancelConfirmText', { date: formattedUntil })
              : t('cancelConfirmTextNoDate')}
          </p>

          <button
            type="button"
            onClick={handleCancel}
            disabled={saving}
            style={{ ...dangerButtonStyle, opacity: saving ? 0.6 : 1 }}
          >
            {saving ? t('cancelSaving') : t('cancelConfirmYes')}
          </button>

          <button
            type="button"
            onClick={() => setConfirming(false)}
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
            {t('cancelConfirmNo')}
          </button>
        </div>
      )}
    </>
  )
}

const dangerButtonStyle: React.CSSProperties = {
  width: '100%',
  padding: '13px',
  background: 'transparent',
  border: '1px solid var(--red)',
  color: 'var(--red)',
  fontSize: '0.84rem',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  cursor: 'pointer',
}

const noteStyle: React.CSSProperties = {
  fontSize: '0.86rem',
  color: 'var(--grey-light)',
  lineHeight: 1.8,
  margin: 0,
}
