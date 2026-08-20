'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useParams } from 'next/navigation'

export default function ChangePasswordPage() {
  const router = useRouter()
  const params = useParams()
  const locale = (params?.locale as string) ?? 'de'
  const supabase = createClient()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const [loading, setLoading] = useState(false)

  const c =
    locale === 'de'
      ? {
          title: 'PASSWORT ÄNDERN',
          subtitle: 'Neues Passwort festlegen (min. 8 Zeichen).',
          newPw: 'Neues Passwort',
          confirmPw: 'Passwort bestätigen',
          submit: 'Speichern',
          mismatch: 'Passwörter stimmen nicht überein.',
          short: 'Mindestens 8 Zeichen.',
          generic: 'Passwort konnte nicht geändert werden.',
          success: 'Passwort gespeichert.',
          back: 'Zurück zu Filmen',
        }
      : {
          title: 'CHANGE PASSWORD',
          subtitle: 'Set a new password (min. 8 characters).',
          newPw: 'New password',
          confirmPw: 'Confirm password',
          submit: 'Save',
          mismatch: 'Passwords do not match.',
          short: 'At least 8 characters required.',
          generic: 'Could not update password.',
          success: 'Password saved.',
          back: 'Back to films',
        }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (password.length < 8) {
      setError(c.short)
      return
    }
    if (password !== confirm) {
      setError(c.mismatch)
      return
    }
    setLoading(true)
    const { error: err } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (err) {
      setError(c.generic)
      return
    }
    setDone(true)
    setTimeout(() => router.push(`/${locale}/films`), 2000)
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
        paddingTop: '100px',
      }}
    >
      <div style={{ width: '100%', maxWidth: '420px', position: 'relative', zIndex: 1 }}>
        <Link
          href={`/${locale}/films`}
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
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.5rem',
              letterSpacing: '0.06em',
              marginBottom: '8px',
              color: 'var(--warm-white)',
            }}
          >
            {c.title}
          </h1>
          <p style={{ fontSize: '0.82rem', color: 'var(--grey)', marginBottom: '24px' }}>{c.subtitle}</p>

          {done ? (
            <p style={{ color: 'var(--warm-white)', fontSize: '0.9rem' }}>{c.success}</p>
          ) : (
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
                  {c.newPw}
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: 'var(--warm-white)',
                    fontSize: '0.9rem',
                    outline: 'none',
                  }}
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
                  {c.confirmPw}
                </label>
                <input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: 'var(--warm-white)',
                    fontSize: '0.9rem',
                    outline: 'none',
                  }}
                />
              </div>
              {error && (
                <div
                  style={{
                    background: 'rgba(var(--red-rgb),0.1)',
                    border: '1px solid rgba(var(--red-rgb),0.3)',
                    padding: '12px 16px',
                    marginBottom: '16px',
                    fontSize: '0.82rem',
                    color: '#ff6b6b',
                  }}
                >
                  {error}
                </div>
              )}
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
            <Link href={`/${locale}/films`} style={{ color: 'var(--grey)', fontSize: '0.82rem' }}>
              {c.back}
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
