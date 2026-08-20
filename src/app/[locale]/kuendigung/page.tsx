'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { useTranslations } from 'next-intl'

/**
 * Kuendigungsbutton nach Paragraph 312k BGB.
 *
 * Drei Schritte in einer Route statt drei URLs: die Formulardaten sind
 * personenbezogen und haben in Query-Parametern nichts verloren. Der Wechsel
 * form -> review -> done passiert deshalb im State.
 *
 * Die Erklaerung wird bewusst NICHT automatisch an Stripe weitergereicht.
 * Diese Seite ist ohne Login erreichbar; eine automatische Verarbeitung
 * liesse Fremdkuendigungen ueber eine bekannte E-Mail-Adresse zu. Die
 * Bearbeitung erfolgt manuell.
 */

type CancellationType = 'ordinary' | 'extraordinary'
type Contract = 'monthly' | 'yearly'
type TerminationType = 'next_possible' | 'specific_date'

type FormState = {
  cancellationType: CancellationType
  reason: string
  contract: Contract
  firstName: string
  lastName: string
  email: string
  terminationType: TerminationType
  terminationDate: string
}

const EMPTY: FormState = {
  cancellationType: 'ordinary',
  reason: '',
  contract: 'monthly',
  firstName: '',
  lastName: '',
  email: '',
  terminationType: 'next_possible',
  terminationDate: '',
}

export default function CancellationPage() {
  const params = useParams()
  const locale = (params?.locale as string) ?? 'de'
  const t = useTranslations('cancellation')

  const [step, setStep] = useState<'form' | 'review' | 'done'>('form')
  const [form, setForm] = useState<FormState>(EMPTY)
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)
  const [receivedAt, setReceivedAt] = useState('')

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function handleReview(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!form.firstName.trim() || !form.lastName.trim() || !form.email.trim()) {
      setError(t('errorRequired'))
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setError(t('errorEmail'))
      return
    }
    if (form.cancellationType === 'extraordinary' && !form.reason.trim()) {
      setError(t('errorReason'))
      return
    }
    if (form.terminationType === 'specific_date') {
      if (!form.terminationDate) {
        setError(t('errorDate'))
        return
      }
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      if (new Date(form.terminationDate) < today) {
        setError(t('errorDatePast'))
        return
      }
    }

    setStep('review')
    window.scrollTo({ top: 0 })
  }

  async function handleSubmit() {
    setError('')
    setSending(true)

    const res = await fetch('/api/cancellation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, locale }),
    }).catch(() => null)

    const body = res && res.ok ? await res.json().catch(() => null) : null

    if (!body?.ok) {
      setSending(false)
      setError(t('errorSubmit'))
      return
    }

    setReceivedAt(body.receivedAt ?? new Date().toISOString())
    setSending(false)
    setStep('done')
    window.scrollTo({ top: 0 })
  }

  const dateFormat = locale === 'de' ? 'de-AT' : 'en-GB'

  const summary: { label: string; value: string }[] = [
    {
      label: t('labelType'),
      value: form.cancellationType === 'ordinary' ? t('typeOrdinary') : t('typeExtraordinary'),
    },
    ...(form.cancellationType === 'extraordinary'
      ? [{ label: t('labelReason'), value: form.reason.trim() }]
      : []),
    {
      label: t('labelContract'),
      value: form.contract === 'monthly' ? t('contractMonthly') : t('contractYearly'),
    },
    { label: t('labelName'), value: `${form.firstName.trim()} ${form.lastName.trim()}` },
    { label: t('labelEmail'), value: form.email.trim() },
    {
      label: t('labelTermination'),
      value:
        form.terminationType === 'next_possible'
          ? t('terminationNextPossible')
          : new Date(form.terminationDate).toLocaleDateString(dateFormat, {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
            }),
    },
  ]

  return (
    <main style={{ minHeight: '100vh', background: 'var(--black)', padding: '96px 20px 64px' }}>
      <div style={{ maxWidth: '640px', margin: '0 auto' }}>
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(1.9rem, 6vw, 2.8rem)',
            letterSpacing: '0.05em',
            color: 'var(--warm-white)',
            margin: '0 0 16px 0',
          }}
        >
          {step === 'form' ? t('title') : step === 'review' ? t('reviewTitle') : t('doneTitle')}
        </h1>

        <p style={introStyle}>
          {step === 'form' ? t('intro') : step === 'review' ? t('reviewIntro') : t('doneIntro')}
        </p>

        {/* ---------------- Schritt 1: Formular ---------------- */}
        {step === 'form' && (
          <form onSubmit={handleReview} style={cardStyle}>
            <fieldset style={fieldsetStyle}>
              <legend style={legendStyle}>{t('sectionType')}</legend>

              <RadioRow
                name="cancellationType"
                checked={form.cancellationType === 'ordinary'}
                onChange={() => set('cancellationType', 'ordinary')}
                label={t('typeOrdinary')}
                hint={t('typeOrdinaryHint')}
              />
              <RadioRow
                name="cancellationType"
                checked={form.cancellationType === 'extraordinary'}
                onChange={() => set('cancellationType', 'extraordinary')}
                label={t('typeExtraordinary')}
                hint={t('typeExtraordinaryHint')}
              />

              {form.cancellationType === 'extraordinary' && (
                <div style={{ marginTop: '16px' }}>
                  <label style={labelStyle} htmlFor="reason">
                    {t('reasonLabel')} *
                  </label>
                  <textarea
                    id="reason"
                    value={form.reason}
                    onChange={(e) => set('reason', e.target.value)}
                    placeholder={t('reasonPlaceholder')}
                    rows={4}
                    required
                    style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }}
                  />
                </div>
              )}
            </fieldset>

            <fieldset style={fieldsetStyle}>
              <legend style={legendStyle}>{t('sectionContract')}</legend>
              <label style={labelStyle} htmlFor="contract">
                {t('contractLabel')} *
              </label>
              <select
                id="contract"
                value={form.contract}
                onChange={(e) => set('contract', e.target.value as Contract)}
                style={inputStyle}
              >
                <option value="monthly">{t('contractMonthly')}</option>
                <option value="yearly">{t('contractYearly')}</option>
              </select>
            </fieldset>

            <fieldset style={fieldsetStyle}>
              <legend style={legendStyle}>{t('sectionPerson')}</legend>

              <label style={labelStyle} htmlFor="firstName">
                {t('firstNameLabel')} *
              </label>
              <input
                id="firstName"
                value={form.firstName}
                onChange={(e) => set('firstName', e.target.value)}
                required
                autoComplete="given-name"
                style={inputStyle}
              />

              <label style={{ ...labelStyle, marginTop: '14px' }} htmlFor="lastName">
                {t('lastNameLabel')} *
              </label>
              <input
                id="lastName"
                value={form.lastName}
                onChange={(e) => set('lastName', e.target.value)}
                required
                autoComplete="family-name"
                style={inputStyle}
              />

              <label style={{ ...labelStyle, marginTop: '14px' }} htmlFor="email">
                {t('emailLabel')} *
              </label>
              <input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => set('email', e.target.value)}
                required
                autoComplete="email"
                style={inputStyle}
              />
              <p style={hintStyle}>{t('emailHint')}</p>
            </fieldset>

            <fieldset style={fieldsetStyle}>
              <legend style={legendStyle}>{t('sectionTermination')}</legend>

              <RadioRow
                name="terminationType"
                checked={form.terminationType === 'next_possible'}
                onChange={() => set('terminationType', 'next_possible')}
                label={t('terminationNextPossible')}
              />
              <RadioRow
                name="terminationType"
                checked={form.terminationType === 'specific_date'}
                onChange={() => set('terminationType', 'specific_date')}
                label={t('terminationSpecific')}
              />

              {form.terminationType === 'specific_date' && (
                <div style={{ marginTop: '16px' }}>
                  <label style={labelStyle} htmlFor="terminationDate">
                    {t('terminationDateLabel')} *
                  </label>
                  <input
                    id="terminationDate"
                    type="date"
                    value={form.terminationDate}
                    onChange={(e) => set('terminationDate', e.target.value)}
                    required
                    style={{ ...inputStyle, colorScheme: 'dark' }}
                  />
                </div>
              )}
            </fieldset>

            {error && <p style={errorStyle}>{error}</p>}

            <button type="submit" className="btn-primary" style={buttonStyle}>
              {t('submit')}
            </button>
          </form>
        )}

        {/* ---------------- Schritt 2: Bestaetigungsseite ---------------- */}
        {step === 'review' && (
          <div style={cardStyle}>
            <SummaryList items={summary} />

            {error && <p style={errorStyle}>{error}</p>}

            <button
              type="button"
              onClick={handleSubmit}
              disabled={sending}
              className="btn-primary"
              style={{ ...buttonStyle, opacity: sending ? 0.6 : 1 }}
            >
              {sending ? t('sending') : t('confirmSubmit')}
            </button>

            <button
              type="button"
              onClick={() => {
                setError('')
                setStep('form')
              }}
              disabled={sending}
              style={secondaryButtonStyle}
            >
              {t('reviewBack')}
            </button>
          </div>
        )}

        {/* ---------------- Schritt 3: Abschluss ---------------- */}
        {step === 'done' && (
          <div style={cardStyle}>
            <div style={{ marginBottom: '20px' }}>
              <div style={legendStyle}>{t('doneSummaryTitle')}</div>
            </div>

            <SummaryList
              items={[
                ...summary,
                {
                  label: t('doneReceivedAt'),
                  value: new Date(receivedAt).toLocaleString(dateFormat, {
                    dateStyle: 'long',
                    timeStyle: 'short',
                  }),
                },
              ]}
            />

            {form.terminationType === 'next_possible' && (
              <p style={{ ...hintStyle, marginTop: '18px' }}>{t('doneNextPossibleNote')}</p>
            )}

            <button
              type="button"
              onClick={() => window.print()}
              className="btn-primary"
              style={buttonStyle}
            >
              {t('donePrint')}
            </button>
          </div>
        )}
      </div>
    </main>
  )
}

function RadioRow({
  name,
  checked,
  onChange,
  label,
  hint,
}: {
  name: string
  checked: boolean
  onChange: () => void
  label: string
  hint?: string
}) {
  return (
    <label
      style={{
        display: 'flex',
        gap: '12px',
        alignItems: 'flex-start',
        padding: '10px 0',
        cursor: 'pointer',
      }}
    >
      <input
        type="radio"
        name={name}
        checked={checked}
        onChange={onChange}
        style={{
          marginTop: '4px',
          width: '16px',
          height: '16px',
          accentColor: 'var(--red)',
          flexShrink: 0,
          cursor: 'pointer',
        }}
      />
      <span>
        <span style={{ fontSize: '0.9rem', color: 'var(--warm-white)' }}>{label}</span>
        {hint && (
          <span style={{ display: 'block', fontSize: '0.78rem', color: 'var(--grey)', marginTop: '2px' }}>
            {hint}
          </span>
        )}
      </span>
    </label>
  )
}

function SummaryList({ items }: { items: { label: string; value: string }[] }) {
  return (
    <dl style={{ margin: 0 }}>
      {items.map((item) => (
        <div
          key={item.label}
          style={{
            padding: '12px 0',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <dt
            style={{
              fontSize: '0.68rem',
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'var(--grey)',
              marginBottom: '4px',
            }}
          >
            {item.label}
          </dt>
          <dd
            style={{
              margin: 0,
              fontSize: '0.92rem',
              color: 'var(--warm-white)',
              lineHeight: 1.6,
              whiteSpace: 'pre-wrap',
            }}
          >
            {item.value}
          </dd>
        </div>
      ))}
    </dl>
  )
}

const introStyle: React.CSSProperties = {
  fontSize: '0.9rem',
  color: 'var(--grey-light)',
  lineHeight: 1.8,
  marginBottom: '32px',
}

const cardStyle: React.CSSProperties = {
  background: 'var(--anthrazit2)',
  border: '1px solid rgba(255,255,255,0.08)',
  padding: '32px 28px',
}

const fieldsetStyle: React.CSSProperties = {
  border: 'none',
  padding: 0,
  margin: '0 0 28px 0',
}

const legendStyle: React.CSSProperties = {
  fontSize: '0.68rem',
  letterSpacing: '0.15em',
  textTransform: 'uppercase',
  color: 'var(--red)',
  padding: 0,
  marginBottom: '10px',
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.72rem',
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: 'var(--grey)',
  marginBottom: '6px',
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 14px',
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.12)',
  color: 'var(--warm-white)',
  fontSize: '0.9rem',
  outline: 'none',
}

const hintStyle: React.CSSProperties = {
  fontSize: '0.76rem',
  color: 'var(--grey)',
  lineHeight: 1.6,
  margin: '6px 0 0 0',
}

const errorStyle: React.CSSProperties = {
  fontSize: '0.82rem',
  color: 'var(--red)',
  lineHeight: 1.6,
  margin: '0 0 16px 0',
}

const buttonStyle: React.CSSProperties = {
  width: '100%',
  textAlign: 'center',
  display: 'block',
  cursor: 'pointer',
  marginTop: '8px',
}

const secondaryButtonStyle: React.CSSProperties = {
  width: '100%',
  marginTop: '12px',
  padding: '12px',
  background: 'transparent',
  border: '1px solid rgba(255,255,255,0.12)',
  color: 'var(--grey-light)',
  fontSize: '0.84rem',
  cursor: 'pointer',
}
