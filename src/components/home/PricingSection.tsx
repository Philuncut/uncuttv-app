'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import PlanSelector from '@/components/pricing/PlanSelector'

/**
 * Marketing-Rahmen auf der Startseite. Die Tarifauswahl selbst steckt in
 * PlanSelector und wird mit /subscribe geteilt -- hier kommt nur der Text
 * drumherum dazu.
 */
export default function PricingSection() {
  const t = useTranslations('pricing')
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  return (
    <section
      id="pricing"
      style={{
        padding: isMobile ? '48px 20px' : '100px 48px',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          fontSize: '0.72rem',
          letterSpacing: '0.22em',
          textTransform: 'uppercase',
          color: 'var(--red)',
          marginBottom: '16px',
        }}
      >
        {t('eyebrow')}
      </div>

      <h2
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: isMobile ? 'clamp(2rem, 8vw, 3.5rem)' : 'clamp(3rem, 6vw, 6rem)',
          letterSpacing: '0.04em',
          marginBottom: '16px',
        }}
      >
        {t('title')}
      </h2>

      <p
        style={{
          fontFamily: 'var(--font-body)',
          fontWeight: 300,
          fontSize: '1rem',
          letterSpacing: '0.08em',
          color: 'var(--grey)',
          marginBottom: isMobile ? '32px' : '48px',
        }}
      >
        {t('subtitle')}
      </p>

      <PlanSelector />
    </section>
  )
}
