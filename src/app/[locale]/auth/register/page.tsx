'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useTranslations } from 'next-intl'

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 16px',
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.1)',
  color: 'var(--warm-white)',
  fontSize: '0.9rem',
  outline: 'none',
  letterSpacing: '0.04em',
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.72rem',
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: 'var(--grey)',
  marginBottom: '8px',
}

export default function RegisterPage() {
  const params = useParams()
  const locale = (params?.locale as string) ?? 'de'
  const t = useTranslations('auth')
  const tLegal = useTranslations('legal')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [consent, setConsent] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!consent) {
      setError(tLegal('consent.signupRequired'))
      return
    }
    if (password.length < 8) {
      setError(t('passwordTooShort'))
      return
    }
    if (password !== confirmPassword) {
      setError(t('passwordMismatch'))
      return
    }

    setLoading(true)

    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, consent, locale }),
    }).catch(() => null)

    setLoading(false)

    if (!res || !res.ok) {
      const body = res ? await res.json().catch(() => null) : null
      if (body?.error === 'consent_required') setError(tLegal('consent.signupRequired'))
      else if (body?.error === 'password_too_short') setError(t('passwordTooShort'))
      else setError(t('registerError'))
      return
    }

    setDone(true)
  }

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
      <div style={{ position: 'fixed', inset: 0, zIndex: 0 }} />

      <div style={{ width: '100%', maxWidth: '420px', position: 'relative', zIndex: 1 }}>
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
            marginBottom: '48px',
          }}
        >
          UNCUT<span style={{ color: 'var(--red)' }}>TV</span>
        </Link>

        <div
          style={{
            background: 'var(--anthrazit2)',
            border: '1px solid rgba(255,255,255,0.08)',
            padding: '48px 40px',
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

          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '2rem',
              letterSpacing: '0.06em',
              marginBottom: '8px',
              color: 'var(--warm-white)',
            }}
          >
            {done ? t('registerSuccessTitle') : t('registerTitle')}
          </h1>

          <p
            style={{
              fontSize: '0.82rem',
              color: 'var(--grey)',
              letterSpacing: '0.04em',
              marginBottom: '32px',
              lineHeight: 1.7,
            }}
          >
            {done ? t('registerSuccessText') : t('registerSubtitle')}
          </p>

          {!done && (
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>{t('email')}</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="deine@email.com"
                  style={inputStyle}
                  onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--red)')}
                  onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>{t('password')}</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  placeholder="••••••••"
                  style={inputStyle}
                  onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--red)')}
                  onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')}
                />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={labelStyle}>{t('confirmPassword')}</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={8}
                  placeholder="••••••••"
                  style={inputStyle}
                  onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--red)')}
                  onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')}
                />
              </div>

              {/* Bewusst nicht vorangekreuzt: eine vorbelegte Checkbox ist keine
                  Zustimmung. Der Wortlaut steht in messages/{de,en}.json. */}
              <label
                style={{
                  display: 'flex',
                  gap: '12px',
                  alignItems: 'flex-start',
                  marginBottom: '24px',
                  cursor: 'pointer',
                }}
              >
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  style={{
                    marginTop: '3px',
                    width: '16px',
                    height: '16px',
                    accentColor: 'var(--red)',
                    flexShrink: 0,
                    cursor: 'pointer',
                  }}
                />
                <span style={{ fontSize: '0.78rem', color: 'var(--grey)', lineHeight: 1.7 }}>
                  {tLegal.rich('consent.signup', {
                    agb: (chunks) => (
                      <Link
                        href={`/${locale}/agb`}
                        target="_blank"
                        style={{ color: 'var(--red)', textDecoration: 'none' }}
                      >
                        {chunks}
                      </Link>
                    ),
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
                </span>
              </label>

              {error && (
                <p
                  style={{
                    fontSize: '0.78rem',
                    color: 'var(--red)',
                    marginBottom: '16px',
                    lineHeight: 1.6,
                  }}
                >
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn-primary"
                style={{
                  width: '100%',
                  textAlign: 'center',
                  opacity: loading ? 0.6 : 1,
                  cursor: loading ? 'default' : 'pointer',
                }}
              >
                {loading ? t('loading') : t('register')}
              </button>
            </form>
          )}

          <div
            style={{
              marginTop: '24px',
              textAlign: 'center',
              fontSize: '0.82rem',
              color: 'var(--grey)',
            }}
          >
            {t('alreadyHaveAccount')}{' '}
            <Link
              href={`/${locale}/auth/login`}
              style={{ color: 'var(--red)', textDecoration: 'none' }}
            >
              {t('signIn')}
            </Link>
          </div>
        </div>

        <p
          style={{
            textAlign: 'center',
            marginTop: '24px',
            fontSize: '0.72rem',
            color: 'var(--grey)',
            letterSpacing: '0.06em',
          }}
        >
          {t('ageWarning')}
        </p>
      </div>
    </div>
  )
}
