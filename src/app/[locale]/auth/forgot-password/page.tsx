'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useParams } from 'next/navigation'

export default function ForgotPasswordPage() {
  const params = useParams()
  const locale = (params?.locale as string) ?? 'de'
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [done, setDone] = useState(false)
  const [loading, setLoading] = useState(false)

  const c =
    locale === 'de'
      ? {
          title: 'PASSWORT ZURÜCKSETZEN',
          subtitle: 'Gib deine E-Mail-Adresse ein. Wir senden dir einen Link zum Zurücksetzen.',
          email: 'E-Mail',
          submit: 'Link senden',
          success: 'E-Mail versendet — bitte Postfach prüfen.',
          back: 'Zurück zur Anmeldung',
          ageWarning: '⚠ Nur für Personen ab 18 Jahren',
        }
      : {
          title: 'RESET PASSWORD',
          subtitle: 'Enter your email address. We will send you a reset link.',
          email: 'Email',
          submit: 'Send link',
          success: 'Email sent — please check your inbox.',
          back: 'Back to sign in',
          ageWarning: '⚠ For persons aged 18 and over only',
        }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const origin = window.location.origin
    const redirectTo = `${origin}/auth/callback?type=recovery&locale=${locale}`
    await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo })
    setLoading(false)
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
            {c.title}
          </h1>
          <p
            style={{
              fontSize: '0.82rem',
              color: 'var(--grey)',
              letterSpacing: '0.04em',
              marginBottom: '32px',
            }}
          >
            {c.subtitle}
          </p>

          {done ? (
            <p style={{ color: 'var(--warm-white)', fontSize: '0.9rem', lineHeight: 1.6 }}>{c.success}</p>
          ) : (
            <form onSubmit={handleSubmit}>
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
                  {c.email}
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="deine@email.com"
                  autoComplete="email"
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
                  onFocus={(e) => (e.target.style.borderColor = 'var(--red)')}
                  onBlur={(e) => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary"
                style={{ width: '100%', textAlign: 'center', opacity: loading ? 0.7 : 1 }}
              >
                {loading ? '…' : c.submit}
              </button>
            </form>
          )}

          <p style={{ marginTop: '24px', textAlign: 'center' }}>
            <Link href={`/${locale}/auth/login`} style={{ color: 'var(--grey)', fontSize: '0.82rem' }}>
              {c.back}
            </Link>
          </p>
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
          {c.ageWarning}
        </p>
      </div>
    </div>
  )
}
