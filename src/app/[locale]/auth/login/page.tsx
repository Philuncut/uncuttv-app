'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useParams } from 'next/navigation'
import { useTranslations } from 'next-intl'

export default function LoginPage() {
  const router = useRouter()
  const params = useParams()
  const locale = (params?.locale as string) ?? 'de'
  const t = useTranslations('auth')
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(t('loginError'))
      setLoading(false)
    } else {
      router.push(`/${locale}/films`)
    }
  }

  async function handleGoogleLogin() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
  }

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--black)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px',
    }}>
      <div style={{ position: 'fixed', inset: 0, zIndex: 0 }} />

      <div style={{ width: '100%', maxWidth: '420px', position: 'relative', zIndex: 1 }}>

        <Link href={`/${locale}`} style={{
          fontFamily: 'var(--font-display)', fontSize: '2.2rem',
          letterSpacing: '0.08em', color: 'var(--warm-white)',
          textDecoration: 'none', display: 'block', textAlign: 'center', marginBottom: '48px',
        }}>
          UNCUT<span style={{ color: 'var(--red)' }}>TV</span>
        </Link>

        <div style={{
          background: 'var(--anthrazit2)',
          border: '1px solid rgba(255,255,255,0.08)',
          padding: '48px 40px',
          position: 'relative',
        }}>
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: '1px',
            background: 'linear-gradient(to right, transparent, var(--red), transparent)',
          }} />

          <h1 style={{
            fontFamily: 'var(--font-display)', fontSize: '2rem',
            letterSpacing: '0.06em', marginBottom: '8px', color: 'var(--warm-white)',
          }}>
            {t('welcomeBack')}
          </h1>
          <p style={{
            fontSize: '0.82rem', color: 'var(--grey)',
            letterSpacing: '0.04em', marginBottom: '32px',
          }}>
            {t('signInSubtitle')}
          </p>

          <button onClick={handleGoogleLogin} style={{
            width: '100%', padding: '14px',
            background: 'transparent',
            border: '1px solid rgba(255,255,255,0.15)',
            color: 'var(--warm-white)',
            fontSize: '0.88rem', letterSpacing: '0.06em',
            cursor: 'pointer', marginBottom: '24px',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
            transition: 'border-color 0.2s, background 0.2s',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.35)'
            e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'
            e.currentTarget.style.background = 'transparent'
          }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
              <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
              <path d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332z" fill="#FBBC05"/>
              <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 7.294C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
            </svg>
            {t('signInWithGoogle')}
          </button>

          <div style={{
            display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px',
          }}>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)' }} />
            <span style={{ fontSize: '0.72rem', color: 'var(--grey)', letterSpacing: '0.12em' }}>{t('or')}</span>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)' }} />
          </div>

          <form onSubmit={handleEmailLogin}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block', fontSize: '0.72rem', letterSpacing: '0.14em',
                textTransform: 'uppercase', color: 'var(--grey)', marginBottom: '8px',
              }}>{t('email')}</label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                required placeholder="deine@email.com"
                style={{
                  width: '100%', padding: '12px 16px',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: 'var(--warm-white)', fontSize: '0.9rem',
                  outline: 'none', letterSpacing: '0.04em',
                }}
                onFocus={e => e.target.style.borderColor = 'var(--red)'}
                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block', fontSize: '0.72rem', letterSpacing: '0.14em',
                textTransform: 'uppercase', color: 'var(--grey)', marginBottom: '8px',
              }}>{t('password')}</label>
              <input
                type="password" value={password} onChange={e => setPassword(e.target.value)}
                required placeholder="••••••••"
                style={{
                  width: '100%', padding: '12px 16px',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: 'var(--warm-white)', fontSize: '0.9rem',
                  outline: 'none',
                }}
                onFocus={e => e.target.style.borderColor = 'var(--red)'}
                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
              />
            </div>

            {error && (
              <div style={{
                background: 'rgba(229,9,20,0.1)', border: '1px solid rgba(229,9,20,0.3)',
                padding: '12px 16px', marginBottom: '16px',
                fontSize: '0.82rem', color: '#ff6b6b', letterSpacing: '0.04em',
              }}>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary" style={{
              width: '100%', textAlign: 'center', opacity: loading ? 0.7 : 1,
            }}>
              {loading ? t('loading') : t('signIn')}
            </button>
          </form>

          <div style={{
            marginTop: '24px', textAlign: 'center',
            fontSize: '0.82rem', color: 'var(--grey)',
          }}>
            {t('noAccount')}{' '}
            <Link href={`/${locale}/auth/register`} style={{ color: 'var(--red)', textDecoration: 'none' }}>
              {t('registerNow')}
            </Link>
          </div>
        </div>

        <p style={{
          textAlign: 'center', marginTop: '24px',
          fontSize: '0.72rem', color: 'var(--grey)', letterSpacing: '0.06em',
        }}>
          {t('ageWarning')}
        </p>
      </div>
    </div>
  )
}
