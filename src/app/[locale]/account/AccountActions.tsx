'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface Props {
  locale: string
}

export default function AccountActions({ locale }: Props) {
  const router = useRouter()
  const supabase = createClient()

  const [showConfirm, setShowConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  const c = locale === 'de' ? {
    deleteAccount: 'Konto löschen',
    deleteWarning: 'Bist du sicher? Diese Aktion kann nicht rückgängig gemacht werden. Alle deine Daten werden dauerhaft gelöscht.',
    confirmDelete: 'Ja, Konto löschen',
    cancel: 'Abbrechen',
    error: 'Konto konnte nicht gelöscht werden.',
  } : {
    deleteAccount: 'Delete Account',
    deleteWarning: 'Are you sure? This action cannot be undone. All your data will be permanently deleted.',
    confirmDelete: 'Yes, Delete Account',
    cancel: 'Cancel',
    error: 'Could not delete account.',
  }

  async function handleDelete() {
    setDeleting(true)
    setError('')
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch('/api/account/delete', {
        method: 'POST',
        headers: session?.access_token
          ? { Authorization: `Bearer ${session.access_token}` }
          : {},
      })
      if (!res.ok) {
        setError(c.error)
        setDeleting(false)
        return
      }
      await supabase.auth.signOut()
      router.push(`/${locale}/auth/login`)
    } catch {
      setError(c.error)
      setDeleting(false)
    }
  }

  if (!showConfirm) {
    return (
      <button
        type="button"
        onClick={() => setShowConfirm(true)}
        style={{
          display: 'block',
          width: '100%',
          textAlign: 'left',
          padding: '14px 0',
          fontSize: '0.9rem',
          color: '#c0392b',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          transition: 'color 0.2s',
        }}
      >
        {c.deleteAccount}
      </button>
    )
  }

  return (
    <div style={{ padding: '20px 0' }}>
      <p style={{ fontSize: '0.85rem', color: 'var(--warm-white)', lineHeight: 1.6, marginBottom: '20px' }}>
        {c.deleteWarning}
      </p>
      {error && (
        <div style={{
          background: 'rgba(229,9,20,0.1)',
          border: '1px solid rgba(229,9,20,0.3)',
          padding: '10px 14px',
          marginBottom: '16px',
          fontSize: '0.82rem',
          color: '#ff6b6b',
        }}>
          {error}
        </div>
      )}
      <div style={{ display: 'flex', gap: '12px' }}>
        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting}
          style={{
            flex: 1, padding: '12px 16px', fontSize: '0.82rem', fontWeight: 600,
            letterSpacing: '0.08em', textTransform: 'uppercase',
            background: '#c0392b', color: '#fff', border: 'none',
            cursor: deleting ? 'default' : 'pointer',
            opacity: deleting ? 0.6 : 1, transition: 'background 0.2s',
          }}
        >
          {deleting ? '…' : c.confirmDelete}
        </button>
        <button
          type="button"
          onClick={() => { setShowConfirm(false); setError('') }}
          style={{
            flex: 1, padding: '12px 16px', fontSize: '0.82rem', fontWeight: 500,
            letterSpacing: '0.08em', textTransform: 'uppercase',
            background: 'rgba(255,255,255,0.06)', color: 'var(--grey-light)',
            border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer',
            transition: 'background 0.2s',
          }}
        >
          {c.cancel}
        </button>
      </div>
    </div>
  )
}
