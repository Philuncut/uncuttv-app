'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface Props {
  locale: string
  /**
   * Laeuft ein Abo, das noch nicht gekuendigt ist?
   *
   * Dann bleibt der Knopf gesperrt. Die Route weist die Loeschung ohnehin
   * mit 409 ab -- hier steht die Sperre, damit der Nutzer den Grund sieht,
   * bevor er klickt, statt danach eine Fehlermeldung zu bekommen.
   */
  subscriptionActive?: boolean
}

export default function AccountActions({ locale, subscriptionActive = false }: Props) {
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
    blocked: 'Solange dein Abo läuft, kannst du dein Konto nicht löschen. Kündige es zuerst im Abschnitt darüber — du behältst den Zugang bis zum Ende des bezahlten Zeitraums, danach lässt sich das Konto löschen. Wenn du die Löschung deiner Daten unabhängig davon verlangen möchtest, schreib uns an office@uncuttv.at.',
    errorSubscription: 'Dein Abo läuft noch. Bitte kündige es zuerst, dann kannst du das Konto löschen.',
    errorPastDue: 'Für dein Abo steht eine Zahlung offen. Bitte begleiche sie oder kündige das Abo, dann kannst du das Konto löschen.',
    errorCheck: 'Der Abo-Status lässt sich gerade nicht prüfen. Bitte versuche es später noch einmal.',
  } : {
    deleteAccount: 'Delete Account',
    deleteWarning: 'Are you sure? This action cannot be undone. All your data will be permanently deleted.',
    confirmDelete: 'Yes, Delete Account',
    cancel: 'Cancel',
    error: 'Could not delete account.',
    blocked: 'You cannot delete your account while your subscription is running. Cancel it in the section above first — you keep access until the end of the paid period, after that the account can be deleted. If you want to request deletion of your data regardless, write to us at office@uncuttv.at.',
    errorSubscription: 'Your subscription is still running. Please cancel it first, then you can delete the account.',
    errorPastDue: 'A payment is outstanding on your subscription. Please settle it or cancel the subscription, then you can delete the account.',
    errorCheck: 'The subscription status cannot be checked right now. Please try again later.',
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
        // 409 und 503 haben eigene Gruende -- eine pauschale Meldung
        // liesse den Nutzer raten, was zu tun ist. Innerhalb von 409 wird
        // noch einmal unterschieden: offene Zahlung heisst zahlen ODER
        // kuendigen, laufendes Abo heisst nur kuendigen.
        const body = await res.json().catch(() => null)
        setError(
          res.status === 409
            ? body?.error === 'subscription_past_due'
              ? c.errorPastDue
              : c.errorSubscription
            : res.status === 503
              ? c.errorCheck
              : c.error
        )
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

  // Laeuft ein Abo, wird der Knopf erst gar nicht angeboten. Der Grund
  // steht stattdessen da -- ein gesperrter Knopf ohne Erklaerung laesst den
  // Nutzer raten, warum er nicht darf.
  if (subscriptionActive) {
    return (
      <p
        style={{
          padding: '14px 0',
          fontSize: '0.85rem',
          lineHeight: 1.6,
          color: 'var(--grey)',
        }}
      >
        {c.blocked}
      </p>
    )
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
          background: 'rgba(var(--red-rgb),0.1)',
          border: '1px solid rgba(var(--red-rgb),0.3)',
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
