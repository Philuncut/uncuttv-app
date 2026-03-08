'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function PaymentFailedPage() {
  const [email, setEmail] = useState('')
  const supabase = createClient()

  useEffect(() => {
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user?.email) setEmail(user.email)
    }
    getUser()
  }, [])

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--black)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '48px 24px',
    }}>

      <Link href="/de/films" style={{
        fontFamily: 'var(--font-display)', fontSize: '2rem',
        letterSpacing: '0.08em', color: 'var(--warm-white)', textDecoration: 'none',
        marginBottom: '64px',
      }}>
        UNCUT<span style={{ color: 'var(--red)' }}>TV</span>
      </Link>

      <div style={{
        width: '100%', maxWidth: '480px',
        border: '1px solid rgba(229,9,20,0.3)',
        background: 'rgba(229,9,20,0.04)',
        padding: '48px 40px',
        boxShadow: '0 0 60px rgba(229,9,20,0.06)',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0,
          height: '3px', background: 'var(--red)',
          boxShadow: '0 0 20px rgba(229,9,20,0.8)',
        }} />

        <div style={{
          width: '56px', height: '56px', borderRadius: '50%',
          background: 'rgba(229,9,20,0.12)',
          border: '1px solid rgba(229,9,20,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.5rem', marginBottom: '24px',
        }}>
          ⚠
        </div>

        <h1 style={{
          fontFamily: 'var(--font-display)', fontSize: '2rem',
          letterSpacing: '0.06em', color: 'var(--warm-white)',
          marginBottom: '12px', lineHeight: 1,
        }}>
          ZAHLUNG FEHLGESCHLAGEN
        </h1>

        <p style={{
          fontSize: '0.88rem', color: 'var(--grey-light)',
          lineHeight: 1.7, marginBottom: '8px',
        }}>
          Deine Zahlung konnte nicht verarbeitet werden. Bitte aktualisiere deine Zahlungsmethode, um weiter auf UncutTV zuzugreifen.
        </p>

        {email && (
          <p style={{
            fontSize: '0.78rem', color: 'var(--grey)',
            marginBottom: '32px',
          }}>
            Wir haben eine Email an <span style={{ color: 'var(--warm-white)' }}>{email}</span> geschickt.
          </p>
        )}

        {!email && <div style={{ marginBottom: '32px' }} />}

        <div style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.06)',
          padding: '16px 20px', marginBottom: '32px',
          fontSize: '0.8rem', color: 'var(--grey)',
          lineHeight: 1.8,
        }}>
          <div style={{ color: 'var(--grey-light)', marginBottom: '8px', fontSize: '0.72rem', letterSpacing: '0.1em' }}>
            WAS PASSIERT JETZT?
          </div>
          <div>① Stripe versucht die Zahlung automatisch erneut</div>
          <div>② Du erhältst eine Email mit einem Link zur Kartenverwaltung</div>
          <div>③ Nach erfolgreicher Zahlung wird dein Zugang sofort wiederhergestellt</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          
            <a href="https://billing.stripe.com/p/login/test_00000000"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary"
            style={{ textAlign: 'center', display: 'block' }}
          >
            Zahlungsmethode aktualisieren
          </a>
          <Link
            href="/de/auth/login"
            style={{
              textAlign: 'center', padding: '12px',
              fontSize: '0.82rem', color: 'var(--grey)',
              textDecoration: 'none', letterSpacing: '0.06em',
              border: '1px solid rgba(255,255,255,0.08)',
              transition: 'color 0.2s',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--warm-white)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--grey)')}
          >
            Abmelden
          </Link>
        </div>
      </div>

      <p style={{
        marginTop: '32px', fontSize: '0.75rem', color: 'var(--grey)',
        textAlign: 'center',
      }}>
        Fragen? <a href="mailto:support@uncuttv.com" style={{ color: 'var(--red)', textDecoration: 'none' }}>support@uncuttv.com</a>
      </p>

    </div>
  )
}