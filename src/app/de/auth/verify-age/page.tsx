'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function VerifyAgePage() {
  const router = useRouter()
  const supabase = createClient()
  const [status, setStatus] = useState<'checking' | 'pending' | 'approved' | 'starting' | 'error'>('checking')
  const [errorDetail, setErrorDetail] = useState('')

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/de/auth/login'); return }

      const { data: profile } = await supabase
        .from('profiles')
        .select('age_verified')
        .eq('id', user.id)
        .single()

      if (profile?.age_verified) {
        setStatus('approved')
        setTimeout(() => router.push('/de/subscribe'), 1500)
        return
      }

      const params = new URLSearchParams(window.location.search)
      if (params.get('status') === 'submitted') {
        setStatus('pending')
        const interval = setInterval(async () => {
          const { data: p } = await supabase
            .from('profiles')
            .select('age_verified')
            .eq('id', user.id)
            .single()
          if (p?.age_verified) {
            clearInterval(interval)
            setStatus('approved')
            setTimeout(() => router.push('/de/subscribe'), 1500)
          }
        }, 3000)
        return
      }

      // Auto-start Veriff session
      setStatus('starting')
      try {
        const res = await fetch('/api/veriff/create-session', { method: 'POST' })
        const data = await res.json()
        console.log('Veriff response:', res.status, data)
        if (data.url) {
          window.location.href = data.url
        } else {
          setErrorDetail(`Status: ${res.status} – ${JSON.stringify(data)}`)
          setStatus('error')
        }
      } catch (e: any) {
        setErrorDetail(e?.message || 'Unbekannter Fehler')
        setStatus('error')
      }
    }

    init()
  }, [])

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

          {(status === 'checking' || status === 'starting') && (
            <>
              <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🛡️</div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', letterSpacing: '0.06em', color: 'var(--warm-white)', marginBottom: '12px' }}>
                ALTERSVERIFIKATION
              </h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--grey-light)', lineHeight: 1.7, marginBottom: '8px' }}>
                Du wirst zu unserem Verifikationspartner weitergeleitet...
              </p>
              <p style={{ fontSize: '0.75rem', color: 'var(--grey)' }}>Einen Moment bitte.</p>
            </>
          )}

          {status === 'pending' && (
            <>
              <div style={{ fontSize: '3rem', marginBottom: '16px' }}>⏳</div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', letterSpacing: '0.06em', color: 'var(--warm-white)', marginBottom: '12px' }}>
                VERIFIKATION LÄUFT
              </h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--grey-light)', lineHeight: 1.7, marginBottom: '24px' }}>
                Deine Altersverifikation wird gerade verarbeitet. Das dauert normalerweise weniger als eine Minute.
              </p>
              <p style={{ fontSize: '0.78rem', color: 'var(--grey)' }}>Diese Seite aktualisiert sich automatisch...</p>
            </>
          )}

          {status === 'approved' && (
            <>
              <div style={{ fontSize: '3rem', marginBottom: '16px' }}>✅</div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', letterSpacing: '0.06em', color: 'var(--warm-white)', marginBottom: '12px' }}>
                VERIFIZIERT!
              </h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--grey-light)' }}>Du wirst weitergeleitet...</p>
            </>
          )}

          {status === 'error' && (
            <>
              <div style={{ fontSize: '3rem', marginBottom: '16px' }}>⚠️</div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', letterSpacing: '0.06em', color: 'var(--warm-white)', marginBottom: '12px' }}>
                FEHLER
              </h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--grey-light)', marginBottom: '12px' }}>
                Verifikation konnte nicht gestartet werden.
              </p>
              {errorDetail && (
                <p style={{ fontSize: '0.72rem', color: 'var(--grey)', marginBottom: '24px', wordBreak: 'break-all' }}>
                  {errorDetail}
                </p>
              )}
              <button
                onClick={() => window.location.reload()}
                className="btn-primary"
                style={{ width: '100%', cursor: 'pointer' }}
              >
                Nochmal versuchen
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
