'use client'

import { useState } from 'react'
import MuxPlayer from '@mux/mux-player-react'

interface FilmPlayerProps {
  playbackId: string
  filmId: string
  title: string
  /** Hero backdrop layout: tighter spacing for overlaid play control */
  variant?: 'default' | 'hero'
  playLabel?: string
  loadingLabel?: string
}

export default function FilmPlayer({
  playbackId,
  filmId,
  title,
  variant = 'default',
  playLabel = 'Abspielen',
  loadingLabel = 'Wird geladen…',
}: FilmPlayerProps) {
  const [token, setToken] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handlePlay() {
    if (token) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/mux/token?playbackId=${encodeURIComponent(playbackId)}&filmId=${encodeURIComponent(filmId)}`)
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error ?? 'Kein Zugriff')
        return
      }
      const data = await res.json()
      setToken(data.token)
    } catch {
      setError('Fehler beim Laden')
    } finally {
      setLoading(false)
    }
  }

  if (error) {
    return (
      <div style={{
        padding: '24px',
        background: 'rgba(229,9,20,0.1)',
        border: '1px solid rgba(229,9,20,0.3)',
        color: '#ff6b6b',
        marginTop: '16px',
      }}>
        {error}
      </div>
    )
  }

  const btnMarginTop = variant === 'hero' ? 0 : 24
  const wrapMarginTop = variant === 'hero' ? 16 : 24

  if (!token) {
    return (
      <button
        type="button"
        onClick={handlePlay}
        disabled={loading}
        className="btn-primary"
        style={{
          marginTop: btnMarginTop,
          padding: '16px 32px',
          fontSize: '1rem',
          opacity: loading ? 0.7 : 1,
        }}
      >
        {loading ? loadingLabel : playLabel}
      </button>
    )
  }

  return (
    <div style={{ marginTop: wrapMarginTop, maxWidth: variant === 'hero' ? '100%' : '900px', width: '100%' }}>
      <MuxPlayer
        streamType="on-demand"
        playbackId={playbackId}
        tokens={{ playback: token }}
        metadata={{ video_title: title }}
        style={{ aspectRatio: '16/9', width: '100%' }}
        primaryColor="#C8102E"
      />
    </div>
  )
}
