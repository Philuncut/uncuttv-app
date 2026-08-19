'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'

/** Wie lange nach der Rueckkehr von Veriff auf die Entscheidung gewartet wird. */
const POLL_INTERVAL_MS = 5000
const POLL_TIMEOUT_MS = 5 * 60 * 1000

type View = 'intro' | 'pending' | 'declined' | 'resubmission' | 'approved'

/** Veriff-Status auf die vier Ansichten abbilden. Unbekanntes gilt als laufend. */
function viewFor(status: string | null, returnedFromVeriff: boolean): View {
  switch (status) {
    case 'approved':
      return 'approved'
    case 'declined':
      return 'declined'
    case 'resubmission_requested':
      return 'resubmission'
    case 'expired':
    case 'abandoned':
      return 'intro'
    case 'review':
      return 'pending'
    default:
      return returnedFromVeriff ? 'pending' : 'intro'
  }
}

export default function VerifyAge({
  locale,
  initialStatus,
  returnedFromVeriff,
}: {
  locale: string
  initialStatus: string | null
  returnedFromVeriff: boolean
}) {
  const t = useTranslations('verifyAge')

  const [view, setView] = useState<View>(() => viewFor(initialStatus, returnedFromVeriff))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const startVerification = useCallback(async () => {
    setError('')
    setLoading(true)

    const res = await fetch('/api/veriff/create-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ locale }),
    }).catch(() => null)

    const body = res && res.ok ? await res.json().catch(() => null) : null

    if (!body?.url) {
      setLoading(false)
      setError(t('startError'))
      return
    }

    window.location.href = body.url
  }, [locale, t])

  // Im Wartezustand nachfragen: Veriff entscheidet asynchron per Webhook,
  // die Seite erfaehrt davon sonst nichts.
  useEffect(() => {
    if (view !== 'pending') return

    const startedAt = Date.now()
    let cancelled = false

    const timer = setInterval(async () => {
      if (Date.now() - startedAt > POLL_TIMEOUT_MS) {
        clearInterval(timer)
        return
      }

      const res = await fetch('/api/veriff/status').catch(() => null)
      if (!res || !res.ok || cancelled) return

      const body = await res.json().catch(() => null)
      if (!body || cancelled) return

      if (body.ageVerified) {
        setView('approved')
        clearInterval(timer)
        return
      }

      const next = viewFor(body.status ?? null, true)
      if (next !== 'pending') {
        setView(next)
        clearInterval(timer)
      }
    }, POLL_INTERVAL_MS)

    return () => {
      cancelled = true
      clearInterval(timer)
    }
  }, [view])

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--black)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
    >
      <div style={{ width: '100%', maxWidth: '520px' }}>
        <Link
          href={`/${locale}`}
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '2.2rem',
            letterSpacing: '0.08em',
            color: 'var(--warm-white)',
            textDecoration: 'none',
            display: 'block',
            textAlign: 'center',
            marginBottom: '40px',
          }}
        >
          UNCUT<span style={{ color: 'var(--red)' }}>TV</span>
        </Link>

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
              height: '1px',
              background: 'linear-gradient(to right, transparent, var(--red), transparent)',
            }}
          />

          {view === 'intro' && (
            <>
              <h1 style={headingStyle}>{t('title')}</h1>
              <p style={leadStyle}>{t('subtitle')}</p>

              <div style={boxStyle}>
                <div style={boxLabelStyle}>{t('whatYouNeed')}</div>
                <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                  {[t('need1'), t('need2'), t('need3')].map((item) => (
                    <li key={item} style={listItemStyle}>
                      <span style={{ color: 'var(--red)', flexShrink: 0 }}>—</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <p style={bodyStyle}>{t('howItWorks')}</p>
              <p style={{ ...bodyStyle, fontSize: '0.78rem', marginTop: '10px' }}>
                {t.rich('privacyNote', {
                  privacy: (chunks) => (
                    <Link
                      href={`/${locale}/datenschutz`}
                      target="_blank"
                      style={{ color: 'var(--red)', textDecoration: 'none' }}
                    >
                      {chunks}
                    </Link>
                  ),
                })}
              </p>

              {error && <p style={errorStyle}>{error}</p>}

              <button
                onClick={startVerification}
                disabled={loading}
                className="btn-primary"
                style={{
                  width: '100%',
                  textAlign: 'center',
                  marginTop: '28px',
                  opacity: loading ? 0.6 : 1,
                  cursor: loading ? 'default' : 'pointer',
                }}
              >
                {loading ? t('starting') : t('start')}
              </button>
            </>
          )}

          {view === 'pending' && (
            <>
              <h1 style={headingStyle}>{t('pendingTitle')}</h1>
              <p style={leadStyle}>{t('pendingText')}</p>
              <p style={bodyStyle}>{t('pendingHint')}</p>
            </>
          )}

          {view === 'approved' && (
            <>
              <h1 style={headingStyle}>{t('approvedTitle')}</h1>
              <p style={leadStyle}>{t('approvedText')}</p>
              <Link
                href={`/${locale}/films`}
                className="btn-primary"
                style={{
                  display: 'block',
                  width: '100%',
                  textAlign: 'center',
                  marginTop: '28px',
                  textDecoration: 'none',
                }}
              >
                {t('toFilms')}
              </Link>
            </>
          )}

          {(view === 'declined' || view === 'resubmission') && (
            <>
              <h1 style={headingStyle}>
                {view === 'declined' ? t('declinedTitle') : t('resubmissionTitle')}
              </h1>
              <p style={leadStyle}>
                {view === 'declined' ? t('declinedText') : t('resubmissionText')}
              </p>

              {error && <p style={errorStyle}>{error}</p>}

              <button
                onClick={startVerification}
                disabled={loading}
                className="btn-primary"
                style={{
                  width: '100%',
                  textAlign: 'center',
                  marginTop: '24px',
                  opacity: loading ? 0.6 : 1,
                  cursor: loading ? 'default' : 'pointer',
                }}
              >
                {loading ? t('starting') : t('retry')}
              </button>

              <p style={{ ...bodyStyle, fontSize: '0.78rem', marginTop: '20px' }}>
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
            </>
          )}
        </div>
      </div>
    </div>
  )
}

const headingStyle: React.CSSProperties = {
  fontFamily: 'var(--font-display)',
  fontSize: '1.9rem',
  letterSpacing: '0.06em',
  marginBottom: '12px',
  color: 'var(--warm-white)',
}

const leadStyle: React.CSSProperties = {
  fontSize: '0.9rem',
  color: 'var(--grey-light)',
  lineHeight: 1.8,
  marginBottom: '24px',
}

const bodyStyle: React.CSSProperties = {
  fontSize: '0.84rem',
  color: 'var(--grey)',
  lineHeight: 1.8,
  margin: 0,
}

const boxStyle: React.CSSProperties = {
  border: '1px solid rgba(255,255,255,0.12)',
  background: 'rgba(255,255,255,0.03)',
  padding: '20px 22px',
  marginBottom: '24px',
}

const boxLabelStyle: React.CSSProperties = {
  fontSize: '0.68rem',
  letterSpacing: '0.15em',
  textTransform: 'uppercase',
  color: 'var(--red)',
  marginBottom: '14px',
}

const listItemStyle: React.CSSProperties = {
  display: 'flex',
  gap: '10px',
  fontSize: '0.84rem',
  color: 'var(--grey-light)',
  lineHeight: 1.7,
  padding: '5px 0',
}

const errorStyle: React.CSSProperties = {
  fontSize: '0.8rem',
  color: 'var(--red)',
  lineHeight: 1.6,
  marginTop: '20px',
  marginBottom: 0,
}
