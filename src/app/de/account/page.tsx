'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useRouter, usePathname } from 'next/navigation'

export default function AccountPage() {
  const pathname = usePathname()
  const locale = (pathname?.match(/^\/(de|en)(?:\/|$)/)?.[1]) ?? 'de'
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [hoverPayment, setHoverPayment] = useState(false)
  const [hoverCancel, setHoverCancel] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push(`/${locale}/auth/login`); return }
      setUser(user)
      const { data: profile } = await supabase
        .from('profiles')
        .select('*, subscriptions(*)')
        .eq('id', user.id)
        .single()
      setProfile(profile)
      setLoading(false)
    }
    load()
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push(`/${locale}/auth/login`)
  }

  async function handleBillingPortal() {
    const { data: { session } } = await supabase.auth.getSession()
    const res = await fetch('/api/stripe/portal', {
      method: 'POST',
      headers: { Authorization: `Bearer ${session?.access_token}` },
    })
    const { url, error } = await res.json()
    if (url) window.location.href = url
    else alert('Fehler beim Öffnen des Portals: ' + (error || 'Unbekannter Fehler'))
  }

  function getStatusLabel(status: string) {
    switch (status) {
      case 'active': return { label: 'Aktiv', color: '#22c55e' }
      case 'trialing': return { label: '7 Tage Gratis', color: '#f0ece4' }
      case 'past_due': return { label: 'Zahlung fehlgeschlagen', color: '#E50914' }
      case 'canceled': return { label: 'Gekündigt', color: '#6b7280' }
      default: return { label: 'Kein Abo', color: '#6b7280' }
    }
  }

  function getPlanLabel(priceId: string) {
    if (priceId === process.env.NEXT_PUBLIC_STRIPE_YEARLY_PRICE_ID) {
      return '199,90€ / Jahr'
    }
    return '19,90€ / Monat'
  }

  const sub = profile?.subscriptions?.[0]
  const statusInfo = getStatusLabel(profile?.subscription_status)
  const hasNoSubscription = !profile?.subscription_status || profile?.subscription_status === 'canceled'

  if (loading) return (
    <div style={{
      minHeight: '100vh', background: 'var(--black)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: 'var(--grey)',
    }}>
      Laden...
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: 'var(--black)' }}>

      {/* Navbar */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 500,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '20px 48px',
        background: 'rgba(10,10,10,0.95)', backdropFilter: 'blur(8px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <Link href={`/${locale}/films`} style={{
          fontFamily: 'var(--font-display)', fontSize: '1.8rem',
          letterSpacing: '0.08em', color: 'var(--warm-white)', textDecoration: 'none',
        }}>
          UNCUT<span style={{ color: 'var(--red)' }}>TV</span>
        </Link>
        <Link href={`/${locale}/films`} style={{
          fontSize: '0.82rem', color: 'var(--grey)',
          textDecoration: 'none', letterSpacing: '0.06em',
        }}>
          {'← Zurück zur Bibliothek'}
        </Link>
      </nav>

      <div style={{ padding: '120px 48px 80px', maxWidth: '680px', margin: '0 auto' }}>

        <h1 style={{
          fontFamily: 'var(--font-display)', fontSize: '2.5rem',
          letterSpacing: '0.06em', color: 'var(--warm-white)', marginBottom: '8px',
        }}>
          MEIN KONTO
        </h1>
        <p style={{ fontSize: '0.85rem', color: 'var(--grey)', marginBottom: '48px' }}>
          Verwalte dein Abo und deine Daten
        </p>

        {/* Profil Card */}
        <div style={{
          border: '1px solid rgba(255,255,255,0.08)',
          background: 'rgba(255,255,255,0.02)',
          padding: '28px 32px', marginBottom: '16px',
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0,
            height: '2px', background: 'rgba(255,255,255,0.06)',
          }} />
          <div style={{
            fontSize: '0.68rem', letterSpacing: '0.15em',
            color: 'var(--grey)', marginBottom: '16px', textTransform: 'uppercase',
          }}>Profil</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.82rem', color: 'var(--grey)' }}>Email</span>
              <span style={{ fontSize: '0.88rem', color: 'var(--warm-white)' }}>{user?.email}</span>
            </div>
            {user?.user_metadata?.full_name && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.82rem', color: 'var(--grey)' }}>Name</span>
                <span style={{ fontSize: '0.88rem', color: 'var(--warm-white)' }}>{user.user_metadata.full_name}</span>
              </div>
            )}
          </div>
        </div>

        {/* Zugangsdaten Card */}
        <div style={{
          border: '1px solid rgba(255,255,255,0.08)',
          background: 'rgba(255,255,255,0.02)',
          padding: '28px 32px', marginBottom: '16px',
        }}>
          <div style={{
            fontSize: '0.68rem', letterSpacing: '0.15em',
            color: 'var(--grey)', marginBottom: '16px', textTransform: 'uppercase',
          }}>Zugangsdaten</div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button
              onClick={async () => {
                const newEmail = prompt('Neue Email-Adresse:')
                if (!newEmail) return
                const { error } = await supabase.auth.updateUser({ email: newEmail })
                if (error) alert('Fehler: ' + error.message)
                else alert('Bestätigungsmail wurde an ' + newEmail + ' gesendet.')
              }}
              style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '14px 16px', border: '1px solid rgba(255,255,255,0.08)',
                background: 'transparent', color: 'var(--warm-white)', fontSize: '0.85rem',
                letterSpacing: '0.04em', cursor: 'pointer', transition: 'border-color 0.2s',
              }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)')}
            >
              <span>Email-Adresse ändern</span>
              <span style={{ color: 'var(--grey)', fontSize: '0.75rem' }}>→</span>
            </button>

            <button
              onClick={async () => {
                if (!confirm('Soll ein Passwort-Reset-Link an ' + user?.email + ' gesendet werden?')) return
                const { error } = await supabase.auth.resetPasswordForEmail(user?.email, {
                  redirectTo: window.location.origin + `/${locale}/auth/login`,
                })
                if (error) alert('Fehler: ' + error.message)
                else alert('Passwort-Reset-Link wurde gesendet!')
              }}
              style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '14px 16px', border: '1px solid rgba(255,255,255,0.08)',
                background: 'transparent', color: 'var(--warm-white)', fontSize: '0.85rem',
                letterSpacing: '0.04em', cursor: 'pointer', transition: 'border-color 0.2s',
              }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)')}
            >
              <span>Passwort ändern</span>
              <span style={{ color: 'var(--grey)', fontSize: '0.75rem' }}>→</span>
            </button>
          </div>
        </div>

        {/* Abo Card */}
        <div style={{
          border: '1px solid rgba(255,255,255,0.08)',
          background: 'rgba(255,255,255,0.02)',
          padding: '28px 32px', marginBottom: '16px',
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0,
            height: '2px', background: 'var(--red)',
            boxShadow: '0 0 12px rgba(229,9,20,0.5)',
          }} />
          <div style={{
            fontSize: '0.68rem', letterSpacing: '0.15em',
            color: 'var(--grey)', marginBottom: '16px', textTransform: 'uppercase',
          }}>Mitgliedschaft</div>

          {hasNoSubscription ? (
            <div>
              <p style={{ fontSize: '0.88rem', color: 'var(--grey)', marginBottom: '20px', lineHeight: 1.6 }}>
                Du hast derzeit kein aktives Abo.
              </p>
              <Link href={`/${locale}/subscribe`} style={{
                display: 'inline-block', background: 'var(--red)',
                color: 'white', padding: '12px 24px', textDecoration: 'none',
                fontSize: '0.85rem', letterSpacing: '0.1em', fontWeight: 700,
              }}>
                JETZT ABONNIEREN →
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.82rem', color: 'var(--grey)' }}>Status</span>
                <span style={{
                  fontSize: '0.78rem', padding: '3px 10px',
                  background: `${statusInfo.color}18`,
                  border: `1px solid ${statusInfo.color}40`,
                  color: statusInfo.color, letterSpacing: '0.08em',
                }}>{statusInfo.label}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.82rem', color: 'var(--grey)' }}>Plan</span>
                <span style={{ fontSize: '0.88rem', color: 'var(--warm-white)' }}>
                  {sub?.stripe_price_id ? getPlanLabel(sub.stripe_price_id) : '19,90€ / Monat'}
                </span>
              </div>

              {sub?.current_period_end && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.82rem', color: 'var(--grey)' }}>
                    {profile?.subscription_status === 'canceled' ? 'Endet am' : 'Nächste Abbuchung'}
                  </span>
                  <span style={{ fontSize: '0.88rem', color: 'var(--warm-white)' }}>
                    {new Date(sub.current_period_end).toLocaleDateString('de-AT', {
                      day: '2-digit', month: '2-digit', year: 'numeric'
                    })}
                  </span>
                </div>
              )}

              {sub?.trial_end && profile?.subscription_status === 'trialing' && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.82rem', color: 'var(--grey)' }}>Testphase endet</span>
                  <span style={{ fontSize: '0.88rem', color: '#f0ece4' }}>
                    {new Date(sub.trial_end).toLocaleDateString('de-AT', {
                      day: '2-digit', month: '2-digit', year: 'numeric'
                    })}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Aktionen Card – nur wenn Abo vorhanden */}
        {!hasNoSubscription && (
          <div style={{
            border: '1px solid rgba(255,255,255,0.08)',
            background: 'rgba(255,255,255,0.02)',
            padding: '28px 32px', marginBottom: '32px',
          }}>
            <div style={{
              fontSize: '0.68rem', letterSpacing: '0.15em',
              color: 'var(--grey)', marginBottom: '16px', textTransform: 'uppercase',
            }}>Aktionen</div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                onClick={handleBillingPortal}
                style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '14px 16px',
                  border: `1px solid ${hoverPayment ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.08)'}`,
                  background: 'transparent', color: 'var(--warm-white)',
                  fontSize: '0.85rem', letterSpacing: '0.04em', cursor: 'pointer',
                  transition: 'border-color 0.2s',
                }}
                onMouseEnter={() => setHoverPayment(true)}
                onMouseLeave={() => setHoverPayment(false)}
              >
                <span>Zahlungsmethode verwalten</span>
                <span style={{ color: 'var(--grey)', fontSize: '0.75rem' }}>→</span>
              </button>

              {profile?.subscription_status !== 'canceled' && (
                <button
                  onClick={async () => {
                    if (confirm('Möchtest du dein Abo wirklich kündigen? Du hast bis zum Ende der Laufzeit weiter Zugang.')) {
                      await handleBillingPortal()
                    }
                  }}
                  style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '14px 16px',
                    border: `1px solid ${hoverCancel ? 'rgba(229,9,20,0.5)' : 'rgba(229,9,20,0.2)'}`,
                    background: 'transparent',
                    color: hoverCancel ? 'var(--red)' : 'rgba(229,9,20,0.7)',
                    fontSize: '0.85rem', letterSpacing: '0.04em', cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={() => setHoverCancel(true)}
                  onMouseLeave={() => setHoverCancel(false)}
                >
                  <span>Abo kündigen</span>
                  <span style={{ fontSize: '0.75rem' }}>→</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Abmelden */}
        <button
          onClick={handleLogout}
          style={{
            width: '100%', padding: '14px',
            background: 'transparent',
            border: '1px solid rgba(255,255,255,0.08)',
            color: 'var(--grey)', fontSize: '0.82rem',
            letterSpacing: '0.1em', cursor: 'pointer',
            transition: 'color 0.2s',
            marginTop: hasNoSubscription ? '16px' : '0',
          }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--warm-white)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--grey)')}
        >
          ABMELDEN
        </button>

      </div>
    </div>
  )
}
