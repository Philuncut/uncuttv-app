'use client'
import Link from 'next/link'
import { useState, useEffect, useRef, useMemo } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import LanguageSwitch from './LanguageSwitch'
import type { Locale } from '@/i18n/config'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

export default function Navbar() {
  const t = useTranslations('nav')
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const [isMobile, setIsMobile] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [billingLoading, setBillingLoading] = useState(false)
  const [billingError, setBillingError] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)
  const mobileNavRef = useRef<HTMLDivElement>(null)
  const pathname = usePathname()
  const locale: Locale = (pathname?.match(/^\/(de|en)(?:\/|$)/)?.[1] as Locale) ?? 'de'

  const navLinks = useMemo(
    () => [
      { href: `/${locale}/films`, label: t('films') },
      { href: `/${locale}/neuheiten`, label: t('new') },
      { href: `/${locale}/genres`, label: t('genres') },
    ],
    [locale, t]
  )

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    setMobileNavOpen(false)
  }, [pathname])

  useEffect(() => {
    let cancelled = false
    async function syncAuth() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!cancelled) setUser(session?.user ?? null)
      const { data: { user: u } } = await supabase.auth.getUser()
      if (!cancelled && u) setUser(u)
    }
    void syncAuth()
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [supabase])

  // Close account dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [dropdownOpen])

  // Close mobile nav when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (mobileNavRef.current && !mobileNavRef.current.contains(e.target as Node)) {
        setMobileNavOpen(false)
      }
    }
    if (mobileNavOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [mobileNavOpen])

  async function handleSignOut() {
    setDropdownOpen(false)
    setMobileNavOpen(false)
    await supabase.auth.signOut()
    router.push(`/${locale}/auth/login`)
  }

  async function handleBilling() {
    setBillingError('')
    setBillingLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()

      if (!session?.access_token) {
        setDropdownOpen(false)
        setMobileNavOpen(false)
        router.push(`/${locale}/auth/login`)
        return
      }

      const res = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ locale }),
      }).catch(() => null)

      const data = res && res.ok ? await res.json().catch(() => null) : null

      // Das Menue bleibt im Fehlerfall offen, sonst waere die Meldung nicht
      // zu sehen. Ein Menuepunkt, der wortlos nichts tut, ist schlimmer als
      // eine Fehlermeldung.
      if (!data?.url) {
        setBillingError(t('billingError'))
        return
      }

      setDropdownOpen(false)
      setMobileNavOpen(false)
      window.location.href = data.url
    } finally {
      setBillingLoading(false)
    }
  }

  const displayName = user?.email ?? t('myAccount')
  const shortName = displayName.length > 22 ? displayName.slice(0, 20) + '…' : displayName

  const linkStyle: React.CSSProperties = {
    color: 'var(--grey-light)',
    textDecoration: 'none',
    fontSize: '0.82rem',
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    transition: 'color 0.2s',
  }

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0,
      zIndex: 1100,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: isMobile ? '16px 20px' : '24px 48px',
      background: 'linear-gradient(to bottom, rgba(10,10,10,0.95) 0%, transparent 100%)',
      backdropFilter: 'blur(2px)',
      overflow: 'visible',
      gap: '12px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0, minWidth: 0 }}>
        <Link href={user ? `/${locale}/films` : `/${locale}`} style={{
          fontFamily: 'var(--font-display)', fontSize: isMobile ? '1.5rem' : '2rem',
          letterSpacing: '0.08em', color: 'var(--warm-white)', textDecoration: 'none',
          display: 'flex', alignItems: 'center',
          flexShrink: 0,
        }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', flexWrap: 'nowrap', gap: '0' }}>
            UNCUT<span style={{ color: 'var(--red)' }}>TV</span>
            <span
              className="ml-2 shrink-0 rounded-sm bg-[#c0392b] px-3 py-1 text-[13px] font-bold tracking-[0.15em] text-white shadow-md"
              aria-label="Beta"
            >
              BETA
            </span>
          </span>
        </Link>

        {isMobile && (
          <div ref={mobileNavRef} style={{ position: 'relative', flexShrink: 0 }}>
            <button
              type="button"
              aria-expanded={mobileNavOpen}
              aria-label={t('openMenu')}
              onClick={() => {
                setMobileNavOpen((o) => !o)
                setDropdownOpen(false)
              }}
              style={{
                color: 'var(--grey-light)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '1.4rem',
                lineHeight: 1,
                padding: '6px 10px',
              }}
            >
              ☰
            </button>
            {mobileNavOpen && (
              <div style={{
                position: 'absolute', top: 'calc(100% + 8px)', left: 0,
                minWidth: '200px',
                background: 'rgba(18, 18, 22, 0.98)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '4px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
                overflow: 'hidden',
                zIndex: 1200,
              }}>
                {navLinks.map((item, i) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileNavOpen(false)}
                    style={{
                      display: 'block',
                      padding: '12px 18px',
                      fontSize: '0.82rem',
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      color: 'var(--grey-light)',
                      textDecoration: 'none',
                      borderBottom: i < navLinks.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none',
                    }}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {!isMobile && (
        <ul
          style={{
            display: 'flex',
            flex: 1,
            justifyContent: 'center',
            flexWrap: 'wrap',
            gap: '36px',
            listStyle: 'none',
            margin: '0 12px',
            minWidth: 0,
          }}
        >
          {navLinks.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                style={linkStyle}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--warm-white)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--grey-light)')}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexShrink: 0, position: 'relative', zIndex: 1, marginLeft: 'auto' }}>
        <LanguageSwitch currentLocale={locale} />

        {user ? (
          <div ref={dropdownRef} style={{ position: 'relative', zIndex: 2 }}>
            <button
              type="button"
              onClick={() => {
                setDropdownOpen((o) => !o)
                setMobileNavOpen(false)
              }}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                color: 'var(--grey-light)',
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: '0.82rem', letterSpacing: '0.08em',
                padding: '6px 0',
                maxWidth: isMobile ? '120px' : 'none',
              }}
            >
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{shortName}</span>
              <span style={{
                fontSize: '0.6rem',
                transition: 'transform 0.2s',
                transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                display: 'inline-block',
                flexShrink: 0,
              }}>▼</span>
            </button>

            {dropdownOpen && (
              <div style={{
                position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                minWidth: '200px',
                background: 'rgba(18, 18, 22, 0.98)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '4px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
                overflow: 'hidden',
                zIndex: 1200,
              }}>
                <DropdownLink
                  href={`/${locale}/account`}
                  onClick={() => setDropdownOpen(false)}
                >
                  {t('myAccount')}
                </DropdownLink>
                <DropdownLink
                  href={`/${locale}/auth/change-password`}
                  onClick={() => setDropdownOpen(false)}
                >
                  {t('changePassword')}
                </DropdownLink>
                <DropdownButton onClick={handleBilling} disabled={billingLoading}>
                  {billingLoading ? '…' : t('billing')}
                </DropdownButton>
                {billingError && (
                  <p
                    role="alert"
                    style={{
                      margin: 0,
                      padding: '4px 16px 10px',
                      fontSize: '0.72rem',
                      lineHeight: 1.5,
                      color: 'var(--red)',
                    }}
                  >
                    {billingError}
                  </p>
                )}
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', margin: '4px 0' }} />
                <DropdownButton onClick={handleSignOut}>
                  {t('signOut')}
                </DropdownButton>
              </div>
            )}
          </div>
        ) : (
          <>
            <Link href={`/${locale}/auth/login`} style={{ color: 'var(--grey-light)', textDecoration: 'none', fontSize: '0.82rem', letterSpacing: '0.08em' }}>
              {t('login')}
            </Link>
            {!isMobile && (
              <Link href={`/${locale}/auth/register`} className="btn-primary" style={{ padding: '10px 24px', fontSize: '0.82rem' }}>
                {t('start')}
              </Link>
            )}
          </>
        )}
      </div>
    </nav>
  )
}

function DropdownLink({ href, onClick, children }: { href: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      style={{
        display: 'block',
        padding: '11px 18px',
        fontSize: '0.82rem',
        letterSpacing: '0.06em',
        color: 'var(--grey-light)',
        textDecoration: 'none',
        transition: 'background 0.15s, color 0.15s',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
        e.currentTarget.style.color = 'var(--warm-white)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = 'transparent'
        e.currentTarget.style.color = 'var(--grey-light)'
      }}
    >
      {children}
    </Link>
  )
}

function DropdownButton({ onClick, disabled, children }: { onClick: () => void; disabled?: boolean; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        display: 'block', width: '100%', textAlign: 'left',
        padding: '11px 18px',
        fontSize: '0.82rem',
        letterSpacing: '0.06em',
        color: 'var(--grey-light)',
        background: 'none', border: 'none', cursor: disabled ? 'default' : 'pointer',
        transition: 'background 0.15s, color 0.15s',
        opacity: disabled ? 0.5 : 1,
      }}
      onMouseEnter={e => {
        if (!disabled) {
          e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
          e.currentTarget.style.color = 'var(--warm-white)'
        }
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = 'transparent'
        e.currentTarget.style.color = 'var(--grey-light)'
      }}
    >
      {children}
    </button>
  )
}
