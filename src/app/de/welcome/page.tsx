'use client'

import Link from 'next/link'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function WelcomePage() {
  const router = useRouter()

  useEffect(() => {
    // Auto-redirect nach 5 Sekunden
    const timer = setTimeout(() => router.push('/de/films'), 5000)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--black)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px',
    }}>
      <div style={{ width: '100%', maxWidth: '480px', textAlign: 'center' }}>

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
          padding: '56px 40px', position: 'relative',
        }}>
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: '1px',
            background: 'linear-gradient(to right, transparent, var(--red), transparent)',
          }} />

          <div style={{ fontSize: '4rem', marginBottom: '24px' }}>🎬</div>

          <h1 style={{
            fontFamily: 'var(--font-display)', fontSize: '2.5rem',
            letterSpacing: '0.06em', marginBottom: '16px', color: 'var(--warm-white)',
          }}>
            WILLKOMMEN BEI<br />
            <span style={{ color: 'var(--red)' }}>UNCUTTV!</span>
          </h1>

          <p style={{
            fontSize: '0.95rem', color: 'var(--grey-light)',
            lineHeight: 1.8, marginBottom: '40px',
          }}>
            Deine 7 Tage Testphase hat begonnen.<br />
            Kino ohne Kompromisse. Unabhängig.<br />
            So wie Film sein sollte.
          </p>

          <Link href="/de/films" className="btn-primary" style={{
            display: 'block', textAlign: 'center', fontSize: '1rem', padding: '18px',
          }}>
            Jetzt Filme entdecken →
          </Link>

          <p style={{ marginTop: '20px', fontSize: '0.75rem', color: 'var(--grey)' }}>
            Du wirst in 5 Sekunden automatisch weitergeleitet...
          </p>
        </div>
      </div>
    </div>
  )
}
