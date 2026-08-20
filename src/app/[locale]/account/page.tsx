import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { getDefaultPaymentMethod } from '@/lib/payment-methods'
import AccountActions from './AccountActions'
import PaymentMethodSection from './PaymentMethodSection'
import ChangePasswordSection from './ChangePasswordSection'
import CancelSubscriptionSection from './CancelSubscriptionSection'

/** Status, zu denen die Kontoseite einen Abo-Block zeigt. */
const SHOWN_STATUSES = ['trialing', 'active', 'past_due']

export default async function AccountPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'account' })

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/${locale}/auth/login`)
  }

  // Neueste Zeile ohne Statusfilter: past_due und gekuendigte Abos sollen
  // hier sichtbar sein, nicht als "kein Abo" verschwinden.
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('status, stripe_price_id, trial_end, current_period_end, cancel_at_period_end')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  // Steuert nur, welche Variante der Kuendigungsabschnitt zeigt. Ob eine
  // Kuendigung wirklich vom Altersgate stammt, entscheidet die Route anhand
  // der Stripe-Metadaten -- hier waere ein Stripe-Aufruf pro Seitenaufruf.
  const { data: profile } = await supabase
    .from('profiles')
    .select('age_verified, full_name')
    .eq('id', user.id)
    .maybeSingle()

  // Serverseitig bei Stripe geholt: der Browser bekommt nur Marke, letzte
  // vier Ziffern und Ablauf zu sehen, nie die Kunden- oder Methoden-ID.
  const currentPaymentMethod = await getDefaultPaymentMethod(user.id)

  const hasSubscription = Boolean(sub && SHOWN_STATUSES.includes(sub.status))
  const isYearly = sub?.stripe_price_id === process.env.STRIPE_YEARLY_PRICE_ID
  const canceling = Boolean(sub?.cancel_at_period_end)

  const formatDate = (value: string | null | undefined) =>
    value
      ? new Date(value).toLocaleDateString(locale === 'de' ? 'de-AT' : 'en-GB', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        })
      : null

  const trialEnd = formatDate(sub?.trial_end)
  const periodEnd = formatDate(sub?.current_period_end)

  // Waehrend der Testphase endet der Zugang mit trial_end, danach mit
  // current_period_end. Die beiden koennen auseinanderliegen, und
  // current_period_end fehlt bei manchen Abos ganz -- deshalb in beide
  // Richtungen ein Fallback statt einer festen Reihenfolge.
  const accessUntil =
    sub?.status === 'trialing'
      ? (sub?.trial_end ?? sub?.current_period_end ?? null)
      : (sub?.current_period_end ?? sub?.trial_end ?? null)
  const accessUntilLabel = formatDate(accessUntil)

  // Diese Seite wird pro Anfrage serverseitig gerendert; "jetzt" ist hier
  // genau richtig und liefert fuer alle Betrachter denselben Stand. Im
  // Client waere derselbe Ausdruck ein Hydrationsproblem -- deshalb steht er
  // hier und wird als Prop weitergereicht.
  // eslint-disable-next-line react-hooks/purity
  const accessExpired = Boolean(accessUntil && new Date(accessUntil).getTime() <= Date.now())

  // cancel_at_period_end hat Vorrang vor dem rohen Stripe-Status: ein
  // gekuendigtes Abo bleibt bis zum Periodenende trialing bzw. active, wuerde
  // hier also faelschlich als laufend erscheinen.
  const statusLabel = !sub
    ? ''
    : canceling
      ? t('statusCanceled')
      : sub.status === 'trialing'
        ? t('statusTrialing')
        : sub.status === 'active'
          ? t('statusActive')
          : sub.status === 'past_due'
            ? t('statusPastDue')
            : t('statusCanceled')

  return (
    <main style={{ minHeight: '100vh', background: 'var(--black)', padding: '110px 20px 64px' }}>
      <div style={{ maxWidth: '620px', margin: '0 auto' }}>
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(1.9rem, 6vw, 2.8rem)',
            letterSpacing: '0.05em',
            color: 'var(--warm-white)',
            margin: '0 0 8px 0',
          }}
        >
          {t('title')}
        </h1>
        <p style={{ fontSize: '0.86rem', color: 'var(--grey)', margin: '0 0 36px 0' }}>
          {user.email}
        </p>

        {/* 1) Abo-Status */}
        <Section title={t('sectionSubscription')}>
          {hasSubscription && sub ? (
            <>
              <Row label={t('planLabel')} value={isYearly ? t('planYearly') : t('planMonthly')} />
              <Row label={t('statusLabel')} value={statusLabel} highlight={sub.status === 'past_due'} />

              <div style={{ marginTop: '16px' }}>
                {/* Der gekuendigte Zweig ersetzt die Datumszeile, statt sie zu
                    unterdruecken -- ohne Datum bleibt sonst gar nichts stehen. */}
                {canceling ? (
                  <p style={noteStyle}>
                    {accessUntilLabel
                      ? t('canceledUntil', { date: accessUntilLabel })
                      : t('canceledNoDate')}
                  </p>
                ) : (
                  <>
                    {sub.status === 'trialing' && (
                      <p style={noteStyle}>
                        {trialEnd ? `${t('trialUntil', { date: trialEnd })} ` : ''}
                        {t('trialThenBilling')}
                      </p>
                    )}

                    {sub.status === 'active' && periodEnd && (
                      <p style={noteStyle}>{t('nextBilling', { date: periodEnd })}</p>
                    )}
                  </>
                )}

                {sub.status === 'past_due' && (
                  <p style={{ ...noteStyle, color: 'var(--red)', marginTop: '10px' }}>
                    {t('pastDueHint')}
                  </p>
                )}
              </div>
            </>
          ) : (
            <>
              <p style={{ ...noteStyle, marginBottom: '18px' }}>{t('noSubscription')}</p>
              <Link
                href={`/${locale}/subscribe`}
                className="btn-primary"
                style={{
                  display: 'block',
                  width: '100%',
                  textAlign: 'center',
                  textDecoration: 'none',
                }}
              >
                {t('subscribeCta')}
              </Link>
            </>
          )}
        </Section>

        {/* 2) Zahlungsmethode */}
        <Section title={t('sectionPayment')}>
          <PaymentMethodSection
            locale={locale}
            current={currentPaymentMethod}
            email={user.email ?? ''}
            name={profile?.full_name ?? null}
          />
        </Section>

        {/* 3) Passwort aendern */}
        <Section title={t('sectionPassword')}>
          <ChangePasswordSection />
        </Section>

        {/* 4) Abo kuendigen -- nur wenn es etwas zu kuendigen gibt */}
        {hasSubscription && (
          <Section title={t('sectionCancel')}>
            <CancelSubscriptionSection
              locale={locale}
              accessUntil={accessUntil}
              alreadyCanceled={canceling}
              ageVerified={Boolean(profile?.age_verified)}
              accessExpired={accessExpired}
            />
          </Section>
        )}

        {/* 5) Konto loeschen -- optisch abgesetzt am Seitenende */}
        <div
          style={{
            marginTop: '48px',
            paddingTop: '28px',
            borderTop: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <div
            style={{
              fontSize: '0.68rem',
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              color: 'var(--grey)',
              marginBottom: '14px',
            }}
          >
            {t('sectionDelete')}
          </div>
          <AccountActions locale={locale} />
        </div>

        <div style={{ marginTop: '32px', textAlign: 'center' }}>
          <Link
            href={`/${locale}/films`}
            style={{ color: 'var(--grey)', fontSize: '0.82rem', textDecoration: 'none' }}
          >
            {t('backToFilms')}
          </Link>
        </div>
      </div>
    </main>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section
      style={{
        background: 'var(--anthrazit2)',
        border: '1px solid rgba(255,255,255,0.08)',
        padding: '26px 24px',
        marginBottom: '16px',
        position: 'relative',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '1px',
          background: 'linear-gradient(to right, transparent, var(--red), transparent)',
        }}
      />
      <h2
        style={{
          fontSize: '0.68rem',
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
          color: 'var(--red)',
          margin: '0 0 16px 0',
        }}
      >
        {title}
      </h2>
      {children}
    </section>
  )
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        gap: '16px',
        padding: '10px 0',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <span style={{ fontSize: '0.8rem', color: 'var(--grey)' }}>{label}</span>
      <span
        style={{
          fontSize: '0.9rem',
          color: highlight ? 'var(--red)' : 'var(--warm-white)',
          textAlign: 'right',
        }}
      >
        {value}
      </span>
    </div>
  )
}

const noteStyle: React.CSSProperties = {
  fontSize: '0.86rem',
  color: 'var(--grey-light)',
  lineHeight: 1.8,
  margin: 0,
}
