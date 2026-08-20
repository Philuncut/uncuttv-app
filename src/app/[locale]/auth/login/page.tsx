'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import {
  PRICING,
  SHOW_YEARLY_PLAN,
  YEARLY_PER_MONTH_CENTS,
  formatPrice,
} from '@/lib/pricing'

export default function LoginPage() {
  const params = useParams()
  const locale = (params?.locale as string) ?? 'de'
  const t = useTranslations('auth')
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Preise kommen aus src/lib/pricing.ts, nicht aus den Uebersetzungen: eine
  // Preisaenderung soll nicht zwei Sprachdateien anfassen muessen. Das
  // Monatsaequivalent des Jahresabos wird gerechnet, nicht getippt.
  //
  // Ist der Jahrestarif abgeschaltet, faellt die Zeile auf den Monatspreis
  // zurueck -- sonst bewirbt die Seite einen Tarif, den der Checkout nicht
  // anbietet. "Jederzeit kuendbar" haengt in beiden Varianten am Monatsabo:
  // das Jahresabo laeuft zwoelf Monate.
  const salesPriceLine = SHOW_YEARLY_PLAN
    ? t('sales.priceWithYearly', {
        yearlyPerMonth: formatPrice(YEARLY_PER_MONTH_CENTS, locale),
        monthly: formatPrice(PRICING.monthlyCents, locale),
      })
    : t('sales.priceMonthlyOnly', {
        monthly: formatPrice(PRICING.monthlyCents, locale),
      })

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(t('loginError'))
      setLoading(false)
      return
    }
    // Full navigation so Supabase session cookies are applied before the next request (client router.push can race middleware).
    window.location.assign(`/${locale}/films`)
  }

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--black)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      // Oben Platz fuer die feststehende Navigationsleiste, die sonst ueber
      // der Ueberschrift laege.
      padding: 'clamp(104px, 12vw, 144px) 24px 56px',
    }}>
      <div className="login-split">

        {/*
          Verkaufsflaeche fuer Neukunden. Auf dieser Seite landet seit dem
          Content-Gate in src/proxy.ts jeder, der /films, /neuheiten oder
          /genres ohne Konto aufruft -- also genau die Leute, die das Angebot
          noch nicht kennen. Der Zeiger "Noch kein Konto? Jetzt registrieren"
          im Formular bleibt fuer die, die schon wissen, was sie wollen.

          Bewusst ohne Rahmen und Hintergrund: freistehend auf dem schwarzen
          Grund liest es sich als Aussage der Seite, in einem Kasten als
          zweites Formular. Steht vor dem Anmeldekasten im Markup, damit die
          Reihenfolge auf schmalen Geraeten stimmt -- siehe .login-split.
        */}
        <div className="login-split__sell">
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(2.6rem, 5vw, 4.2rem)',
            lineHeight: 0.95, letterSpacing: '0.02em',
            color: 'var(--warm-white)',
            marginBottom: 'clamp(16px, 2vw, 24px)',
          }}>
            {t('sales.headline')}
          </h1>

          <p style={{
            fontFamily: 'var(--font-body)', fontWeight: 300,
            fontSize: 'clamp(1rem, 1.5vw, 1.25rem)',
            lineHeight: 1.7, letterSpacing: '0.03em',
            color: 'var(--grey-light)',
            maxWidth: '34ch',
            marginBottom: 'clamp(16px, 2vw, 24px)',
          }}>
            {t('sales.text')}
          </p>

          {/*
            Das Angebot in zwei Stufen statt in einem 109-Zeichen-Satz, der
            in jeder Spaltenbreite umbrach: die kostenlose Testphase traegt
            die Verkaufsaussage und steht gross, die Konditionen stehen als
            Kleingedrucktes darunter. Wer nur ueberfliegt, liest die erste
            Zeile; wer den Preis wissen will, findet ihn direkt darunter.
          */}
          <p style={{
            fontFamily: 'var(--font-body)', fontWeight: 500,
            fontSize: 'clamp(1.05rem, 1.4vw, 1.3rem)',
            lineHeight: 1.4, letterSpacing: '0.02em',
            color: 'var(--warm-white)',
            marginBottom: '8px',
          }}>
            {t('sales.trialLead', { trialDays: PRICING.trialDays })}
          </p>

          {/*
            Zahl und Waehrung haelt Intl.NumberFormat mit geschuetztem
            Leerzeichen zusammen ("16,67 €" bricht nie), den Gedankenstrich
            bindet ein geschuetztes Leerzeichen im Uebersetzungstext an das
            Wort davor -- er darf keine Zeile anfangen. text-wrap: balance
            verteilt den Rest gleichmaessig, statt ein Wort allein zu lassen.
          */}
          <p style={{
            fontFamily: 'var(--font-body)',
            fontSize: '0.8rem', lineHeight: 1.7, letterSpacing: '0.04em',
            color: 'var(--grey)',
            maxWidth: '52ch',
            textWrap: 'balance',
            marginBottom: 'clamp(24px, 3vw, 36px)',
          }}>
            {salesPriceLine}
          </p>

          <Link href={`/${locale}/auth/register`} className="btn-primary login-cta">
            {t('sales.cta', { trialDays: PRICING.trialDays })}
          </Link>
        </div>

        <div className="login-split__form">
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

            {/* h2, nicht h1: die Hauptaussage der Seite steht seit dem
                zweispaltigen Aufbau links im Verkaufsblock. */}
            <h2 style={{
              fontFamily: 'var(--font-display)', fontSize: '2rem',
              letterSpacing: '0.06em', marginBottom: '8px', color: 'var(--warm-white)',
            }}>
              {t('welcomeBack')}
            </h2>
            <p style={{
              fontSize: '0.82rem', color: 'var(--grey)',
              letterSpacing: '0.04em', marginBottom: '32px',
            }}>
              {t('signInSubtitle')}
            </p>

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

              <div style={{ marginTop: '-8px', marginBottom: '16px', textAlign: 'right' }}>
                <Link
                  href={`/${locale}/auth/forgot-password`}
                  style={{ color: 'var(--grey)', fontSize: '0.78rem', textDecoration: 'none' }}
                >
                  {t('forgotPassword')}
                </Link>
              </div>

              {error && (
                <div style={{
                  background: 'rgba(var(--red-rgb),0.1)', border: '1px solid rgba(var(--red-rgb),0.3)',
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
        </div>
      </div>

      <p style={{
        textAlign: 'center', marginTop: '40px', maxWidth: '520px',
        fontSize: '0.72rem', color: 'var(--grey)', letterSpacing: '0.06em',
      }}>
        {t('ageWarning')}
      </p>
    </div>
  )
}
