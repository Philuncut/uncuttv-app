'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'

const MIN_LENGTH = 8

export default function ChangePasswordSection() {
  const t = useTranslations('account')
  const supabase = createClient()

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setDone(false)

    if (password.length < MIN_LENGTH) {
      setError(t('passwordTooShort'))
      return
    }
    if (password !== confirm) {
      setError(t('passwordMismatch'))
      return
    }

    setSaving(true)
    const { error: updateError } = await supabase.auth.updateUser({ password })
    setSaving(false)

    if (updateError) {
      setError(t('passwordError'))
      return
    }

    setPassword('')
    setConfirm('')
    setDone(true)
  }

  return (
    <form onSubmit={handleSubmit}>
      <p style={{ fontSize: '0.86rem', color: 'var(--grey)', lineHeight: 1.8, margin: '0 0 18px 0' }}>
        {t('passwordIntro')}
      </p>

      <label style={labelStyle} htmlFor="new-password">
        {t('passwordNew')}
      </label>
      <input
        id="new-password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        minLength={MIN_LENGTH}
        required
        autoComplete="new-password"
        placeholder="••••••••"
        style={inputStyle}
      />

      <label style={{ ...labelStyle, marginTop: '14px' }} htmlFor="confirm-password">
        {t('passwordConfirm')}
      </label>
      <input
        id="confirm-password"
        type="password"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        minLength={MIN_LENGTH}
        required
        autoComplete="new-password"
        placeholder="••••••••"
        style={inputStyle}
      />

      {error && (
        <p style={{ fontSize: '0.82rem', color: 'var(--red)', lineHeight: 1.6, margin: '14px 0 0 0' }}>
          {error}
        </p>
      )}
      {done && (
        <p
          role="status"
          style={{ fontSize: '0.82rem', color: '#22c55e', lineHeight: 1.6, margin: '14px 0 0 0' }}
        >
          {t('passwordSuccess')}
        </p>
      )}

      <button
        type="submit"
        disabled={saving}
        className="btn-primary"
        style={{
          width: '100%',
          textAlign: 'center',
          display: 'block',
          marginTop: '18px',
          cursor: saving ? 'default' : 'pointer',
          opacity: saving ? 0.6 : 1,
        }}
      >
        {saving ? t('passwordSaving') : t('passwordSubmit')}
      </button>
    </form>
  )
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
