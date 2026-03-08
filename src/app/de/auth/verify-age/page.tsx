'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function VerifyAgePage() {
  const router = useRouter()
  const supabase = createClient()
  const [status, setStatus] = useState<'pending' | 'approved' | 'checking'>('checking')

  useEffect(() => {
    async function checkVerification() {
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
      } else {
        setStatus('pending')
      }
    }

    checkVerification()

    // Poll every 3 seconds
    const interval = setInterval(checkVerification, 3000)
    return () => clearInterval(interval)
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

          {status === 'checking' && (
            <>
              <div style={{ fontSize: '3rem', marginBottom: '16px' }}>⏳</div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', letterSpacing: '0.06em', color: 'var(--warm-white)', marginBottom: '12px' }}>
                WIRD GEPRÜFT...
              </h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--grey-light)' }}>
                Einen Moment bitte.
              </p>
            </>
          )}

          {status === 'pending' && (
            <>
              <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🛡️</div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', letterSpacing: '0.06em', color: 'var(--warm-white)', marginBottom: '12px' }}>
                VERIFIKATION LÄUFT
              </h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--grey-light)', lineHeight: 1.7, marginBottom: '24px' }}>
                Deine Altersverifikation wird gerade verarbeitet.
                Das dauert normalerweise weniger als eine Minute.
              </p>
              <p style={{ fontSize: '0.78rem', color: 'var(--grey)' }}>
                Diese Seite aktualisiert sich automatisch...
              </p>
            </>
          )}

          {status === 'approved' && (
            <>
              <div style={{ fontSize: '3rem', marginBottom: '16px' }}>✅</div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', letterSpacing: '0.06em', color: 'var(--warm-white)', marginBottom: '12px' }}>
                VERIFIZIERT!
              </h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--grey-light)' }}>
                Du wirst weitergeleitet...
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
