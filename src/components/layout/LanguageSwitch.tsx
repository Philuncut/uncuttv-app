'use client'

import { usePathname, useRouter } from 'next/navigation'
import type { Locale } from '@/i18n/config'

const NEXT_LOCALE = 'NEXT_LOCALE'

function setLocaleCookie(locale: Locale) {
  document.cookie = `${NEXT_LOCALE}=${locale}; path=/`
}

export default function LanguageSwitch({ currentLocale }: { currentLocale: Locale }) {
  const pathname = usePathname()
  const router = useRouter()

  const switchToLocale = (nextLocale: Locale) => {
    setLocaleCookie(nextLocale)
    const currentPath = pathname || '/'
    const hasLocalePrefix = /^\/(de|en)(\/|$)/.test(currentPath)
    const newPath = hasLocalePrefix
      ? currentPath.replace(/^\/(de|en)(\/|$)/, `/${nextLocale}$2`)
      : `/${nextLocale}${currentPath === '/' ? '' : currentPath}`
    router.push(newPath || `/${nextLocale}`)
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
      <button
        type="button"
        onClick={() => currentLocale !== 'de' && switchToLocale('de')}
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
        onClick={() => currentLocale !== 'en' && switchToLocale('en')}
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
