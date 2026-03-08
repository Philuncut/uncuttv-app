'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function RegisterPage() {
  const router = useRouter()
  const supabase = createClient()
  const [step, setStep] = useState<'register' | 'veriff'>('register')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Passwörter stimmen nicht überein.')
      return
    }
    if (password.length < 8) {
      setError('Passwort muss mindestens 8 Zeichen haben.')
      return
    }

    setLoading(true)

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setStep('veriff')
      setLoading(false)
    }
  }

  async function handleGoogleRegister() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
  }

  if (step === 'veriff') {
    return (
      <div style={{
        minHeight: '100vh', background: 'var(--black)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px',
      }}>
        <div style={{ width: '100%', maxWidth: '420px', textAlign: 'center' }}>
          <Link href="/de" style={{
            fontFamily: 'var(--font-display)', fontSize: '2.2rem',
            letterSpacing: '0.08em', color: 'var(--warm-white)',
            textDecoration: 'none', display: 'block', marginBottom: '48px',
          }}>
            UNCUT<span style={{ color: 'var(--red)' }}>TV</span>
          </Link>

          <div style={{
            background: 'var(--anthrazit2)',
            border: '1px solid rgba(255,255,255,0.08)',
            padding: '48px 40px', position: 'relative',
          }}>
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: '1px',
              background: 'linear-gradient(to right, transparent, var(--red), transparent)',
            }} />

            {/* Steps indicator */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '32px' }}>
              {['Konto', 'Alter', 'Zahlung'].map((s, i) => (
                <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{
                    width: '28px', height: '28px', borderRadius: '50%',
                    background: i === 0 ? 'var(--red)' : i === 1 ? 'var(--red)' : 'rgba(255,255,255,0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.7rem', fontWeight: 600, color: 'white',
                  }}>
                    {i === 0 ? '✓' : i + 1}
                  </div>
                  <span style={{ fontSize: '0.72rem', color: i <= 1 ? 'var(--warm-white)' : 'var(--grey)', letterSpacing: '0.1em' }}>{s}</span>
                  {i < 2 && <div style={{ width: '24px', height: '1px', background: 'rgba(255,255,255,0.15)' }} />}
                </div>
              ))}
            </div>

            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>✉️</div>

            <h2 style={{
              fontFamily: 'var(--font-display)', fontSize: '1.8rem',
              letterSpacing: '0.06em', marginBottom: '12px', color: 'var(--warm-white)',
            }}>
              EMAIL BESTÄTIGEN
            </h2>

            <p style={{
              fontSize: '0.85rem', color: 'var(--grey-light)',
              lineHeight: 1.7, marginBottom: '12px',
            }}>
              Wir haben eine Bestätigungs-Email an <strong style={{ color: 'var(--warm-white)' }}>{email}</strong> geschickt.
            </p>

            <p style={{
              fontSize: '0.78rem', color: 'var(--grey)',
              lineHeight: 1.6, marginBottom: '32px',
            }}>
              Klicke auf den Link in der Email – danach startet die Altersverifikation automatisch.
            </p>

            {error && (
              <div style={{
                background: 'rgba(229,9,20,0.1)', border: '1px solid rgba(229,9,20,0.3)',
                padding: '12px 16px', marginBottom: '16px',
                fontSize: '0.82rem', color: '#ff6b6b',
              }}>
                {error}
              </div>
            )}

            <p style={{ marginTop: '16px', fontSize: '0.72rem', color: 'var(--grey)' }}>
              Keine Email erhalten? Prüfe deinen Spam-Ordner.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--black)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px',
    }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>

        <Link href="/de" style={{
          fontFamily: 'var(--font-display)', fontSize: '2.2rem',
          letterSpacing: '0.08em', color: 'var(--warm-white)',
          textDecoration: 'none', display: 'block', textAlign: 'center', marginBottom: '48px',
        }}>
          UNCUT<span style={{ color: 'var(--red)' }}>TV</span>
        </Link>

        <div style={{
          background: 'var(--anthrazit2)',
          border: '1px solid rgba(255,255,255,0.08)',
          padding: '48px 40px', position: 'relative',
        }}>
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: '1px',
            background: 'linear-gradient(to right, transparent, var(--red), transparent)',
          }} />

          {/* Steps indicator */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '32px' }}>
            {['Konto', 'Alter', 'Zahlung'].map((s, i) => (
              <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  width: '28px', height: '28px', borderRadius: '50%',
                  background: i === 0 ? 'var(--red)' : 'rgba(255,255,255,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.7rem', fontWeight: 600, color: 'white',
                }}>
                  {i + 1}
                </div>
                <span style={{ fontSize: '0.72rem', color: i === 0 ? 'var(--warm-white)' : 'var(--grey)', letterSpacing: '0.1em' }}>{s}</span>
                {i < 2 && <div style={{ width: '24px', height: '1px', background: 'rgba(255,255,255,0.15)' }} />}
              </div>
            ))}
          </div>

          <h1 style={{
            fontFamily: 'var(--font-display)', fontSize: '2rem',
            letterSpacing: '0.06em', marginBottom: '8px', color: 'var(--warm-white)',
          }}>
            KONTO ERSTELLEN
          </h1>
          <p style={{ fontSize: '0.82rem', color: 'var(--grey)', marginBottom: '32px' }}>
            7 Tage kostenlos testen. Danach 19,90€/Monat.
          </p>

          {/* Google Button */}
          <button onClick={handleGoogleRegister} style={{
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
          }}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
              <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
              <path d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332z" fill="#FBBC05"/>
              <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 7.294C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
            </svg>
            Mit Google registrieren
          </button>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)' }} />
            <span style={{ fontSize: '0.72rem', color: 'var(--grey)', letterSpacing: '0.12em' }}>ODER</span>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)' }} />
          </div>

          <form onSubmit={handleRegister}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block', fontSize: '0.72rem', letterSpacing: '0.14em',
                textTransform: 'uppercase', color: 'var(--grey)', marginBottom: '8px',
              }}>Vollständiger Name</label>
              <input
                type="text" value={fullName} onChange={e => setFullName(e.target.value)}
                required placeholder="Max Mustermann"
                style={{
                  width: '100%', padding: '12px 16px',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: 'var(--warm-white)', fontSize: '0.9rem', outline: 'none',
                }}
                onFocus={e => e.target.style.borderColor = 'var(--red)'}
                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block', fontSize: '0.72rem', letterSpacing: '0.14em',
                textTransform: 'uppercase', color: 'var(--grey)', marginBottom: '8px',
              }}>E-Mail</label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                required placeholder="deine@email.com"
                style={{
                  width: '100%', padding: '12px 16px',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: 'var(--warm-white)', fontSize: '0.9rem', outline: 'none',
                }}
                onFocus={e => e.target.style.borderColor = 'var(--red)'}
                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block', fontSize: '0.72rem', letterSpacing: '0.14em',
                textTransform: 'uppercase', color: 'var(--grey)', marginBottom: '8px',
              }}>Passwort</label>
              <input
                type="password" value={password} onChange={e => setPassword(e.target.value)}
                required placeholder="Min. 8 Zeichen"
                style={{
                  width: '100%', padding: '12px 16px',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: 'var(--warm-white)', fontSize: '0.9rem', outline: 'none',
                }}
                onFocus={e => e.target.style.borderColor = 'var(--red)'}
                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block', fontSize: '0.72rem', letterSpacing: '0.14em',
                textTransform: 'uppercase', color: 'var(--grey)', marginBottom: '8px',
              }}>Passwort bestätigen</label>
              <input
                type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                required placeholder="••••••••"
                style={{
                  width: '100%', padding: '12px 16px',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: 'var(--warm-white)', fontSize: '0.9rem', outline: 'none',
                }}
                onFocus={e => e.target.style.borderColor = 'var(--red)'}
                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
              />
            </div>

            {error && (
              <div style={{
                background: 'rgba(229,9,20,0.1)', border: '1px solid rgba(229,9,20,0.3)',
                padding: '12px 16px', marginBottom: '16px',
                fontSize: '0.82rem', color: '#ff6b6b',
              }}>
                {error}
              </div>
            )}

            <p style={{ fontSize: '0.72rem', color: 'var(--grey)', marginBottom: '20px', lineHeight: 1.6 }}>
              Mit der Registrierung stimmst du unseren{' '}
              <Link href="/de/agb" style={{ color: 'var(--red)' }}>AGB</Link>{' '}
              und der{' '}
              <Link href="/de/datenschutz" style={{ color: 'var(--red)' }}>Datenschutzerklärung</Link>{' '}
              zu. Du bestätigst, 18 Jahre oder älter zu sein.
            </p>

            <button type="submit" disabled={loading} className="btn-primary" style={{
              width: '100%', textAlign: 'center', opacity: loading ? 0.7 : 1,
            }}>
              {loading ? 'Einen Moment...' : 'Weiter zur Altersverifikation →'}
            </button>
          </form>

          <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '0.82rem', color: 'var(--grey)' }}>
            Bereits ein Konto?{' '}
            <Link href="/de/auth/login" style={{ color: 'var(--red)', textDecoration: 'none' }}>
              Anmelden
            </Link>
          </div>
        </div>

        <p style={{
          textAlign: 'center', marginTop: '24px',
          fontSize: '0.72rem', color: 'var(--grey)', letterSpacing: '0.06em',
        }}>
          ⚠ Nur für Personen ab 18 Jahren · Altersverifikation erforderlich
        </p>
      </div>
    </div>
  )
}
