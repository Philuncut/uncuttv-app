'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useTranslations } from 'next-intl'

export default function RegisterPage() {
  const params = useParams()
  const locale = (params?.locale as string) ?? 'de'
  const t = useTranslations('auth')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  function handleSubmit(e: React.FormEvent) {
    // Registration is intentionally disabled ("coming soon").
    e.preventDefault()
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
            {t('registerTitle')}
          </h1>

          <p
            style={{
              fontSize: '0.82rem',
              color: 'var(--grey)',
              letterSpacing: '0.04em',
              marginBottom: '32px',
            }}
          >
            {t('registerSubtitle')}
          </p>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '16px' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.72rem',
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color: 'var(--grey)',
                  marginBottom: '8px',
                }}
              >
                {t('email')}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="deine@email.com"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: 'var(--warm-white)',
                  fontSize: '0.9rem',
                  outline: 'none',
                  letterSpacing: '0.04em',
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--red)')}
                onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')}
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.72rem',
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color: 'var(--grey)',
                  marginBottom: '8px',
                }}
              >
                {t('password')}
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: 'var(--warm-white)',
                  fontSize: '0.9rem',
                  outline: 'none',
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--red)')}
                onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')}
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.72rem',
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color: 'var(--grey)',
                  marginBottom: '8px',
                }}
              >
                {t('confirmPassword')}
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder="••••••••"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: 'var(--warm-white)',
                  fontSize: '0.9rem',
                  outline: 'none',
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--red)')}
                onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')}
              />
            </div>

            <button
              type="submit"
              disabled
              className="btn-primary"
              style={{
                width: '100%',
                textAlign: 'center',
                opacity: 0.7,
              }}
            >
              {t('comingSoon')}
            </button>
          </form>

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
