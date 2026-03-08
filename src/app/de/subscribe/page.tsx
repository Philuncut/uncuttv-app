'use client'

import { useState } from 'react'
import Link from 'next/link'

const FEATURES = [
  'Unbegrenztes Streaming aller Filme',
  'HD & 4K auf allen Geräten',
  'Neue Filme jeden Monat',
  'iOS, Android, Smart TV, Web',
  'Monatlich kündbar – keine Bindung',
]

export default function SubscribePage() {
  const [plan, setPlan] = useState<'monthly' | 'yearly'>('monthly')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const isYearly = plan === 'yearly'

  async function handleSubscribe() {
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      })
      const data = await res.json()

      if (data.error) {
        setError(data.error)
        setLoading(false)
        return
      }

      window.location.href = data.url
    } catch {
      setError('Etwas ist schiefgelaufen. Bitte versuche es erneut.')
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--black)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px',
    }}>
      <div style={{ width: '100%', maxWidth: '480px' }}>

        <Link href="/de" style={{
          fontFamily: 'var(--font-display)', fontSize: '2.2rem',
          letterSpacing: '0.08em', color: 'var(--warm-white)',
          textDecoration: 'none', display: 'block', textAlign: 'center', marginBottom: '48px',
        }}>
          UNCUT<span style={{ color: 'var(--red)' }}>TV</span>
        </Link>

        {/* Steps */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '40px' }}>
          {['Konto', 'Alter', 'Zahlung'].map((s, i) => (
            <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '28px', height: '28px', borderRadius: '50%',
                background: 'var(--red)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.7rem', fontWeight: 600, color: 'white',
              }}>
                {i < 2 ? '✓' : '3'}
              </div>
              <span style={{ fontSize: '0.72rem', color: 'var(--warm-white)', letterSpacing: '0.1em' }}>{s}</span>
              {i < 2 && <div style={{ width: '24px', height: '1px', background: 'var(--red)' }} />}
            </div>
          ))}
        </div>

        <div style={{
          background: 'var(--anthrazit2)',
          border: '1px solid rgba(255,255,255,0.08)',
          padding: '48px 40px', position: 'relative',
        }}>
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: '1px',
            background: 'linear-gradient(to right, transparent, var(--red), transparent)',
          }} />

          <h1 style={{
            fontFamily: 'var(--font-display)', fontSize: '2rem',
            letterSpacing: '0.06em', marginBottom: '8px', color: 'var(--warm-white)',
          }}>
            FAST GESCHAFFT!
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--grey)', marginBottom: '28px', lineHeight: 1.6 }}>
            Wähle dein Abo und starte sofort.
          </p>

          {/* Toggle */}
          <div style={{
            display: 'flex', marginBottom: '24px',
            border: '1px solid rgba(255,255,255,0.12)', overflow: 'hidden',
          }}>
            <button onClick={() => setPlan('monthly')} style={{
              flex: 1, padding: '12px', border: 'none', cursor: 'pointer',
              fontSize: '0.82rem', letterSpacing: '0.08em',
              background: !isYearly ? 'var(--red)' : 'transparent',
              color: !isYearly ? 'white' : 'var(--grey)',
              transition: 'all 0.2s',
            }}>
              Monatlich
            </button>
            <button onClick={() => setPlan('yearly')} style={{
              flex: 1, padding: '12px', border: 'none', cursor: 'pointer',
              fontSize: '0.82rem', letterSpacing: '0.08em',
              background: isYearly ? 'var(--red)' : 'transparent',
              color: isYearly ? 'white' : 'var(--grey)',
              transition: 'all 0.2s',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            }}>
              Jährlich
              <span style={{
                fontSize: '0.65rem', background: 'rgba(255,255,255,0.15)',
                padding: '2px 6px', letterSpacing: '0.06em',
              }}>-16%</span>
            </button>
          </div>

          {/* Features */}
          <ul style={{ listStyle: 'none', marginBottom: '24px' }}>
            {FEATURES.map((f) => (
              <li key={f} style={{
                padding: '10px 0',
                borderBottom: '1px solid rgba(255,255,255,0.05)',
                fontSize: '0.85rem', color: 'var(--grey-light)',
                display: 'flex', alignItems: 'center', gap: '10px',
              }}>
                <span style={{ color: 'var(--red)', fontWeight: 700 }}>✓</span>
                {f}
              </li>
            ))}
            <li style={{
              padding: '10px 0',
              fontSize: '0.85rem', color: 'var(--grey-light)',
              display: 'flex', alignItems: 'center', gap: '10px',
            }}>
              <span style={{ color: 'var(--red)', fontWeight: 700 }}>✓</span>
              {isYearly ? 'Jahresabo – 2 Monate gratis' : '7 Tage kostenlos testen'}
            </li>
          </ul>

          {/* Price */}
          <div style={{
            background: 'rgba(229,9,20,0.08)', border: '1px solid rgba(229,9,20,0.2)',
            padding: '16px 20px', marginBottom: '8px',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--grey-light)' }}>
              {isYearly ? 'Jahrespreis' : 'Nach der Testphase'}
            </span>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', color: 'var(--warm-white)' }}>
              {isYearly ? '199,90€' : '19,90€'}{' '}
              <span style={{ fontSize: '0.9rem', color: 'var(--grey)' }}>
                {isYearly ? '/ Jahr' : '/ Monat'}
              </span>
            </span>
          </div>

          {isYearly && (
            <p style={{ fontSize: '0.75rem', color: '#22c55e', marginBottom: '16px', textAlign: 'right' }}>
              Du sparst 38,90€ gegenüber dem Monatsabo
            </p>
          )}

          {error && (
            <div style={{
              background: 'rgba(229,9,20,0.1)', border: '1px solid rgba(229,9,20,0.3)',
              padding: '12px 16px', marginBottom: '16px',
              fontSize: '0.82rem', color: '#ff6b6b',
            }}>
              {error}
            </div>
          )}

          <button onClick={handleSubscribe} disabled={loading} className="btn-primary" style={{
            width: '100%', textAlign: 'center', opacity: loading ? 0.7 : 1,
            fontSize: '1rem', padding: '18px', marginTop: '8px',
          }}>
            {loading ? 'Wird weitergeleitet...' : isYearly ? 'Jahresabo starten →' : '7 Tage kostenlos starten →'}
          </button>

          <p style={{
            textAlign: 'center', marginTop: '16px',
            fontSize: '0.72rem', color: 'var(--grey)', lineHeight: 1.6,
          }}>
            Keine Kreditkarte? Kein Problem – du kannst auch mit anderen Zahlungsmethoden bezahlen.
            Jederzeit kündbar. Keine versteckten Kosten.
          </p>
        </div>
      </div>
    </div>
  )
}
