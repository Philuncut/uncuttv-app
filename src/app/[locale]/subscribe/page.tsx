'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import PlanSelector from '@/components/pricing/PlanSelector'

/**
 * Nackte Konversionsseite. Hierher kommt, wer eingeloggt ist aber weder Abo
 * noch Voucher hat (Content-Gate in src/proxy.ts) und wer den Stripe-Checkout
 * abbricht (cancel_url). Beide Gruppen kennen das Angebot bereits -- deshalb
 * kein Marketing-Text, nur die Auswahl.
 */
export default function SubscribePage() {
  const params = useParams()
  const locale = (params?.locale as string) ?? 'de'
  const t = useTranslations('subscribe')

  return (
    <main
      style={{
        minHeight: '100vh',
        background: 'var(--black)',
        padding: '96px 20px 64px',
        textAlign: 'center',
      }}
    >
      <div style={{ maxWidth: '560px', margin: '0 auto' }}>
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(2rem, 7vw, 3.2rem)',
            letterSpacing: '0.05em',
            color: 'var(--warm-white)',
            marginBottom: '12px',
          }}
        >
          {t('title')}
        </h1>

        <p
          style={{
            fontFamily: 'var(--font-body)',
            fontWeight: 300,
            fontSize: '0.95rem',
            lineHeight: 1.8,
            letterSpacing: '0.04em',
            color: 'var(--grey)',
            marginBottom: '40px',
          }}
        >
          {t('subtitle')}
        </p>

        <PlanSelector />

        <p
          style={{
            fontSize: '0.78rem',
            color: 'var(--grey)',
            lineHeight: 1.8,
            marginTop: '32px',
          }}
        >
          {t.rich('voucherHint', {
            redeem: (chunks) => (
              <Link
                href={`/${locale}/redeem`}
                style={{ color: 'var(--red)', textDecoration: 'none' }}
              >
                {chunks}
              </Link>
            ),
          })}
        </p>
      </div>
    </main>
  )
}
