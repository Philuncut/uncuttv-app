import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ACCESS_GRANTING_STATUSES } from '@/lib/access'
import AccountActions from './AccountActions'

export default async function AccountPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/${locale}/auth/login`)
  }

  // Eine Abfrage statt zwei hintereinander: dieselbe Semantik, aber die
  // Regel steht in ACCESS_GRANTING_STATUSES statt hier als Sonderfall.
  const { data: activeSub } = await supabase
    .from('subscriptions')
    .select('status, stripe_price_id, current_period_end, trial_end')
    .eq('user_id', user.id)
    .in('status', ACCESS_GRANTING_STATUSES)
    .limit(1)
    .maybeSingle()

  const isTrialing = activeSub?.status === 'trialing'
  const periodEnd = activeSub?.current_period_end
    ? new Date(activeSub.current_period_end)
    : activeSub?.trial_end
      ? new Date(activeSub.trial_end)
      : null

  const formatDate = (d: Date) =>
    locale === 'de'
      ? d.toLocaleDateString('de-AT', { day: '2-digit', month: '2-digit', year: 'numeric' })
      : d.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })

  const c = locale === 'de' ? {
    title: 'MEIN KONTO',
    changePassword: 'Passwort ändern',
    subscription: 'Abonnement',
    monthly: 'Monatsabo',
    price: '19,90\u00a0€ / Monat',
    trial: 'Kostenlose Testphase',
    renewsOn: 'Verlängert sich am',
    trialEnds: 'Testphase endet am',
    noSub: 'Kein aktives Abonnement',
    subscribe: 'Jetzt abonnieren',
    back: 'Zurück zu Filmen',
  } : {
    title: 'MY ACCOUNT',
    changePassword: 'Change Password',
    subscription: 'Subscription',
    monthly: 'Monthly Plan',
    price: '€19.90 / month',
    trial: 'Free Trial',
    renewsOn: 'Renews on',
    trialEnds: 'Trial ends on',
    noSub: 'No active subscription',
    subscribe: 'Subscribe now',
    back: 'Back to films',
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--black)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        paddingTop: '100px',
      }}
    >
      <div style={{ width: '100%', maxWidth: '420px', position: 'relative', zIndex: 1 }}>
        <Link
          href={`/${locale}/films`}
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '2.2rem',
            letterSpacing: '0.08em',
            color: 'var(--warm-white)',
            textDecoration: 'none',
            display: 'block',
            textAlign: 'center',
            marginBottom: '48px',
          }}
        >
          UNCUT<span style={{ color: 'var(--red)' }}>TV</span>
        </Link>

        <div
          style={{
            background: 'var(--anthrazit2)',
            border: '1px solid rgba(255,255,255,0.08)',
            padding: '48px 40px',
          }}
        >
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.5rem',
              letterSpacing: '0.06em',
              marginBottom: '32px',
              color: 'var(--warm-white)',
            }}
          >
            {c.title}
          </h1>

          {/* Subscription Status */}
          <div style={{ padding: '14px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div
              style={{
                fontSize: '0.68rem',
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: '#d40000',
                marginBottom: '8px',
              }}
            >
              {c.subscription}
            </div>
            {activeSub ? (
              <div>
                <div style={{ fontSize: '0.95rem', color: 'var(--warm-white)', marginBottom: '4px' }}>
                  {isTrialing ? c.trial : c.monthly} — {c.price}
                </div>
                {periodEnd && (
                  <div style={{ fontSize: '0.82rem', color: 'var(--grey)' }}>
                    {isTrialing ? c.trialEnds : c.renewsOn} {formatDate(periodEnd)}
                  </div>
                )}
              </div>
            ) : (
              <div>
                <div style={{ fontSize: '0.9rem', color: 'var(--grey)', marginBottom: '10px' }}>
                  {c.noSub}
                </div>
                <Link
                  href={`/${locale}/subscribe`}
                  style={{
                    display: 'inline-block',
                    padding: '10px 20px',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    background: '#d40000',
                    color: '#fff',
                    textDecoration: 'none',
                    transition: 'background 0.2s',
                  }}
                >
                  {c.subscribe}
                </Link>
              </div>
            )}
          </div>

          {/* Change Password */}
          <Link
            href={`/${locale}/auth/change-password`}
            style={{
              display: 'block',
              padding: '14px 0',
              fontSize: '0.9rem',
              color: 'var(--warm-white)',
              textDecoration: 'none',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
              transition: 'color 0.2s',
            }}
          >
            {c.changePassword}
          </Link>

          {/* Delete Account (client component) */}
          <AccountActions locale={locale} />

          <p style={{ marginTop: '28px', textAlign: 'center' }}>
            <Link href={`/${locale}/films`} style={{ color: 'var(--grey)', fontSize: '0.82rem' }}>
              {c.back}
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
