import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import RedeemForm from './RedeemForm'

export default async function RedeemPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'redeem' })
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/${locale}/auth/login?redirect=/redeem`)
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--black)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
    }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>
        <a href={`/${locale}`} style={{
          fontFamily: 'var(--font-display)',
          fontSize: '2rem',
          letterSpacing: '0.08em',
          color: 'var(--warm-white)',
          textDecoration: 'none',
          display: 'block',
          textAlign: 'center',
          marginBottom: '48px',
        }}>
          UNCUT<span style={{ color: 'var(--red)' }}>TV</span>
        </a>

        <div style={{
          background: 'var(--anthrazit2)',
          border: '1px solid rgba(255,255,255,0.08)',
          padding: '48px 40px',
          position: 'relative',
        }}>
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '1px',
            background: 'linear-gradient(to right, transparent, var(--red), transparent)',
          }} />

          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.75rem',
            letterSpacing: '0.06em',
            marginBottom: '8px',
            color: 'var(--warm-white)',
          }}>
            {t('title')}
          </h1>
          <p style={{
            fontSize: '0.82rem',
            color: 'var(--grey)',
            letterSpacing: '0.04em',
            marginBottom: '32px',
          }}>
            {t('subtitle')}
          </p>

          <RedeemForm locale={locale} userId={user.id} />
        </div>
      </div>
    </div>
  )
}
