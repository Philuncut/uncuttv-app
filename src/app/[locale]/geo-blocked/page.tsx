'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'

export default function GeoBlockedPage() {
  const params = useParams()
  const locale = (params?.locale as string) ?? 'de'

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--black)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '48px 24px',
    }}>

      <Link href={`/${locale}`} style={{
        fontFamily: 'var(--font-display)', fontSize: '2rem',
        letterSpacing: '0.08em', color: 'var(--warm-white)', textDecoration: 'none',
        marginBottom: '64px',
      }}>
        UNCUT<span style={{ color: 'var(--red)' }}>TV</span>
      </Link>

      <div style={{
        width: '100%', maxWidth: '480px',
        border: '1px solid rgba(255,255,255,0.08)',
        background: 'rgba(255,255,255,0.02)',
        padding: '48px 40px',
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
          🚫
        </div>

        <h1 style={{
          fontFamily: 'var(--font-display)', fontSize: '2rem',
          letterSpacing: '0.06em', color: 'var(--warm-white)',
          marginBottom: '12px', lineHeight: 1,
        }}>
          NICHT VERFÜGBAR
        </h1>

        <p style={{
          fontSize: '0.88rem', color: 'var(--grey-light)',
          lineHeight: 1.7, marginBottom: '32px',
        }}>
          Dieser Inhalt ist in Deutschland aufgrund von Lizenzbestimmungen leider nicht verfügbar.
        </p>

        <div style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.06)',
          padding: '16px 20px', marginBottom: '32px',
          fontSize: '0.8rem', color: 'var(--grey)',
          lineHeight: 1.8,
        }}>
          <div style={{ color: 'var(--grey-light)', marginBottom: '8px', fontSize: '0.72rem', letterSpacing: '0.1em' }}>
            WARUM WIRD MIR DAS ANGEZEIGT?
          </div>
          <div>UncutTV ist ein österreichischer Dienst.</div>
          <div>Einige Titel unterliegen länderspezifischen Freigaben.</div>
          <div>Wir arbeiten daran, mehr Inhalte für Deutschland freizugeben.</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Link
            href={`/${locale}/films`}
            className="btn-primary"
            style={{ textAlign: 'center', display: 'block' }}
          >
            Zur Filmübersicht
          </Link>
          <Link
            href={`/${locale}/account`}
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
            Mein Konto
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
