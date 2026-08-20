'use client'

import { useState } from 'react'
import { checkVoucherAction, redeemAndGoAction } from './actions'

export default function RedeemForm({ locale, userId }: { locale: string; userId: string }) {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<{
    filmTitle: string
    filmSlug: string
    filmId: string
    code: string
  } | null>(null)
  const [redeemLoading, setRedeemLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const res = await checkVoucherAction(code, userId)
      if (res.valid && res.filmTitle && res.filmSlug && res.filmId) {
        setResult({
          filmTitle: res.filmTitle,
          filmSlug: res.filmSlug,
          filmId: res.filmId,
          code,
        })
      } else {
        setError(res.error ?? 'Ungültiger Code.')
      }
    } catch {
      setError('Ein Fehler ist aufgetreten.')
    } finally {
      setLoading(false)
    }
  }

  async function handleJetztAnsehen() {
    if (!result) return
    setRedeemLoading(true)
    setError(null)
    try {
      const res = await redeemAndGoAction(
        result.code,
        userId,
        result.filmId,
        result.filmSlug,
        locale
      )
      if (res?.error) setError(res.error)
    } catch {
      // redirect() throws
    } finally {
      setRedeemLoading(false)
    }
  }

  return (
    <>
      {result ? (
        <div>
          <p style={{
            fontSize: '0.9rem',
            color: 'var(--grey-light)',
            marginBottom: '16px',
          }}>
            Code gültig. Du hast Zugang zu:
          </p>
          <p style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.25rem',
            color: 'var(--warm-white)',
            marginBottom: '24px',
          }}>
            {result.filmTitle}
          </p>
          {error && (
            <div style={{
              background: 'rgba(var(--red-rgb),0.1)',
              border: '1px solid rgba(var(--red-rgb),0.3)',
              padding: '12px 16px',
              marginBottom: '16px',
              fontSize: '0.82rem',
              color: '#ff6b6b',
            }}>
              {error}
            </div>
          )}
          <button
            type="button"
            onClick={handleJetztAnsehen}
            disabled={redeemLoading}
            className="btn-primary"
            style={{
              width: '100%',
              textAlign: 'center',
              padding: '14px 24px',
              opacity: redeemLoading ? 0.7 : 1,
            }}
          >
            {redeemLoading ? 'Wird eingelöst…' : 'Jetzt ansehen'}
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <label style={{
            display: 'block',
            fontSize: '0.72rem',
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: 'var(--grey)',
            marginBottom: '8px',
          }}>
            Gutscheincode
          </label>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="z.B. PROMO2024"
            autoComplete="off"
            style={{
              width: '100%',
              padding: '12px 16px',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: 'var(--warm-white)',
              fontSize: '0.9rem',
              outline: 'none',
              letterSpacing: '0.08em',
              marginBottom: '16px',
            }}
            onFocus={(e) => (e.target.style.borderColor = 'var(--red)')}
            onBlur={(e) => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
          />
          {error && (
            <div style={{
              background: 'rgba(var(--red-rgb),0.1)',
              border: '1px solid rgba(var(--red-rgb),0.3)',
              padding: '12px 16px',
              marginBottom: '16px',
              fontSize: '0.82rem',
              color: '#ff6b6b',
            }}>
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
            style={{
              width: '100%',
              textAlign: 'center',
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? 'Wird geprüft…' : 'Code prüfen'}
          </button>
        </form>
      )}
    </>
  )
}
