'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import MuxPlayer from '@mux/mux-player-react'
import type MuxPlayerElement from '@mux/mux-player'

const SYNC_INTERVAL_MS = 12_000
const COMPLETE_RATIO = 0.9

interface FilmPlayerProps {
  playbackId: string
  filmId: string
  title: string
  /** From DB; used when media metadata duration is not ready yet */
  durationMinutes?: number | null
  /** Hero backdrop layout: tighter spacing for overlaid play control */
  variant?: 'default' | 'hero'
  playLabel?: string
  loadingLabel?: string
}

export default function FilmPlayer({
  playbackId,
  filmId,
  title,
  durationMinutes,
  variant = 'default',
  playLabel = 'Abspielen',
  loadingLabel = 'Wird geladen…',
}: FilmPlayerProps) {
  const [token, setToken] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const playerRef = useRef<MuxPlayerElement | null>(null)
  const lastPeriodicSyncRef = useRef(Date.now())
  const completedSentRef = useRef(false)
  const durationSecondsRef = useRef<number | null>(
    typeof durationMinutes === 'number' && durationMinutes > 0 ? Math.round(durationMinutes * 60) : null
  )

  useEffect(() => {
    if (typeof durationMinutes === 'number' && durationMinutes > 0) {
      durationSecondsRef.current = Math.round(durationMinutes * 60)
    }
  }, [durationMinutes])

  useEffect(() => {
    completedSentRef.current = false
    lastPeriodicSyncRef.current = Date.now()
  }, [filmId])

  useEffect(() => {
    if (token) {
      lastPeriodicSyncRef.current = Date.now()
    }
  }, [token])

  const syncWatchtime = useCallback(
    async (opts: { completed: boolean }) => {
      const el = playerRef.current
      if (!el || !token) return

      let mediaDur =
        Number.isFinite(el.duration) && el.duration > 0 ? Math.floor(el.duration) : null
      if (mediaDur == null && durationSecondsRef.current != null && durationSecondsRef.current > 0) {
        mediaDur = durationSecondsRef.current
      }

      const cur = Math.max(0, Math.floor(el.currentTime))
      const dur = mediaDur && mediaDur > 0 ? mediaDur : durationSecondsRef.current ?? 0

      let completed = opts.completed
      if (!completed && dur > 0 && cur >= dur * COMPLETE_RATIO) {
        completed = true
      }

      try {
        await fetch('/api/watchtime', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify({
            film_id: filmId,
            last_position: cur,
            duration_seconds: dur > 0 ? dur : undefined,
            completed,
          }),
        })
      } catch (e) {
        console.error('watchtime sync failed:', e)
      }
    },
    [filmId, token]
  )

  const handleTimeUpdate = useCallback(() => {
    const el = playerRef.current
    if (!el) return

    if (Number.isFinite(el.duration) && el.duration > 0) {
      durationSecondsRef.current = Math.floor(el.duration)
    }

    const cur = Math.floor(el.currentTime)
    const dur =
      durationSecondsRef.current && durationSecondsRef.current > 0
        ? durationSecondsRef.current
        : typeof durationMinutes === 'number' && durationMinutes > 0
          ? Math.round(durationMinutes * 60)
          : 0

    if (!completedSentRef.current && dur > 0 && cur >= dur * COMPLETE_RATIO) {
      completedSentRef.current = true
      void syncWatchtime({ completed: true })
    }

    const now = Date.now()
    if (now - lastPeriodicSyncRef.current >= SYNC_INTERVAL_MS) {
      lastPeriodicSyncRef.current = now
      void syncWatchtime({ completed: false })
    }
  }, [durationMinutes, syncWatchtime])

  const handleEnded = useCallback(() => {
    completedSentRef.current = true
    void syncWatchtime({ completed: true })
  }, [syncWatchtime])

  const handleLoadedMetadata = useCallback(() => {
    const el = playerRef.current
    if (el && Number.isFinite(el.duration) && el.duration > 0) {
      durationSecondsRef.current = Math.floor(el.duration)
    }
  }, [])

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
        ref={playerRef}
        streamType="on-demand"
        playbackId={playbackId}
        tokens={{ playback: token }}
        metadata={{ video_title: title }}
        style={{ aspectRatio: '16/9', width: '100%' }}
        primaryColor="#C8102E"
        onLoadedMetadata={handleLoadedMetadata}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
      />
    </div>
  )
}
