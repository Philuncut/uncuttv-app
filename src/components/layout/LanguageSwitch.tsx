'use client'

import { usePathname } from 'next/navigation'
import type { Locale } from '@/i18n/config'

const NEXT_LOCALE = 'NEXT_LOCALE'
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365 // 1 year

function setLocaleCookie(locale: Locale) {
  document.cookie = `${NEXT_LOCALE}=${locale}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`
}

export default function LanguageSwitch({ currentLocale }: { currentLocale: Locale }) {
  const pathname = usePathname()
  const otherLocale: Locale = currentLocale === 'de' ? 'en' : 'de'

  const handleSwitch = () => {
    setLocaleCookie(otherLocale)
    const newPath = pathname.replace(new RegExp(`^/${currentLocale}(/|$)`), `/${otherLocale}$1`)
    window.location.href = newPath || `/${otherLocale}`
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
      <button
        type="button"
        onClick={() => currentLocale !== 'de' && handleSwitch()}
        aria-pressed={currentLocale === 'de'}
        style={{
          padding: '4px 8px',
          fontSize: '0.75rem',
          fontWeight: currentLocale === 'de' ? 700 : 400,
          letterSpacing: '0.05em',
          color: currentLocale === 'de' ? 'var(--warm-white)' : 'var(--grey)',
          background: 'none',
          border: 'none',
          cursor: currentLocale === 'de' ? 'default' : 'pointer',
        }}
      >
        DE
      </button>
      <span style={{ color: 'var(--grey)', fontSize: '0.7rem' }}>|</span>
      <button
        type="button"
        onClick={() => currentLocale !== 'en' && handleSwitch()}
        aria-pressed={currentLocale === 'en'}
        style={{
          padding: '4px 8px',
          fontSize: '0.75rem',
          fontWeight: currentLocale === 'en' ? 700 : 400,
          letterSpacing: '0.05em',
          color: currentLocale === 'en' ? 'var(--warm-white)' : 'var(--grey)',
          background: 'none',
          border: 'none',
          cursor: currentLocale === 'en' ? 'default' : 'pointer',
        }}
      >
        EN
      </button>
    </div>
  )
}
