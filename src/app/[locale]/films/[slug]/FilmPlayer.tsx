'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import MuxPlayer from '@mux/mux-player-react'
import type MuxPlayerElement from '@mux/mux-player'

const SYNC_INTERVAL_MS = 12_000
const COMPLETE_RATIO = 0.9

const AUDIO_LANG_LABELS: Record<string, string> = {
  de: 'Deutsch',
  en: 'English',
  es: 'Español',
  fr: 'Français',
  it: 'Italiano',
}

interface FilmPlayerProps {
  playbackId: string
  filmId: string
  title: string
  /** e.g. de | en — used after playback ends to return to the films catalog */
  locale: string
  /** From DB; used when media metadata duration is not ready yet */
  durationMinutes?: number | null
  /** ISO 639-1 code from films.original_language — used to relabel the "Default" audio track */
  originalLanguage?: string
  /** Hero backdrop layout: tighter spacing for overlaid play control */
  variant?: 'default' | 'hero'
  playLabel?: string
  loadingLabel?: string
}

export default function FilmPlayer({
  playbackId,
  filmId,
  title,
  locale,
  durationMinutes,
  originalLanguage,
  variant = 'default',
  playLabel = 'Abspielen',
  loadingLabel = 'Wird geladen…',
}: FilmPlayerProps) {
  const router = useRouter()
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

  const handleEnded = useCallback(async () => {
    completedSentRef.current = true
    await syncWatchtime({ completed: true })
    setTimeout(() => {
      router.push(`/${locale}/films`)
    }, 1500)
  }, [syncWatchtime, router, locale])

  const handleLoadedMetadata = useCallback(() => {
    const el = playerRef.current
    if (!el) return

    if (Number.isFinite(el.duration) && el.duration > 0) {
      durationSecondsRef.current = Math.floor(el.duration)
    }
  }, [])

  // Rename "Default" audio track via media-tracks AudioTrackList event
  useEffect(() => {
    if (!token || !originalLanguage) return

    const label = AUDIO_LANG_LABELS[originalLanguage] ?? originalLanguage
    let cleanup: (() => void) | undefined

    const tryRename = (source: string) => {
      const el = playerRef.current
      if (!el) {
        console.log('[AudioTrack] no playerRef yet (%s)', source)
        return
      }

      // media-tracks exposes audioTracks on the mux-player element
      const tracks = (el as unknown as { audioTracks?: { length: number; [i: number]: { id: string; label: string; language: string; kind: string } } }).audioTracks
      console.log('[AudioTrack] %s — el.audioTracks:', source, tracks, 'length:', tracks?.length ?? 'N/A')

      // Also check the underlying <mux-video> element
      const mediaEl = (el as unknown as { media?: HTMLElement }).media
      const nativeTracks = (mediaEl as unknown as { audioTracks?: { length: number } } | undefined)?.audioTracks
      console.log('[AudioTrack] %s — mediaEl:', source, mediaEl?.tagName, 'mediaEl.audioTracks:', nativeTracks, 'length:', nativeTracks?.length ?? 'N/A')

      if (tracks && tracks.length > 0) {
        for (let i = 0; i < tracks.length; i++) {
          const t = tracks[i]
          console.log('[AudioTrack] track[%d] id=%s label=%s language=%s kind=%s', i, t.id, t.label, t.language, t.kind)
          if (t.label === 'Default' || t.label === '' || !t.label) {
            console.log('[AudioTrack] renaming track[%d] label "%s" → "%s"', i, t.label, label)
            try { t.label = label } catch (e) { console.warn('[AudioTrack] label write failed:', e) }
          }
        }
        return true
      }
      return false
    }

    // Attempt immediately (in case tracks are already present)
    const immediate = setTimeout(() => {
      if (tryRename('immediate')) return

      // Listen for addtrack events on the AudioTrackList
      const el = playerRef.current
      const tracks = (el as unknown as { audioTracks?: EventTarget & { length: number } })?.audioTracks
      if (tracks && typeof tracks.addEventListener === 'function') {
        const onAddTrack = () => {
          console.log('[AudioTrack] addtrack event fired, tracks.length:', tracks.length)
          tryRename('addtrack-event')
        }
        tracks.addEventListener('addtrack', onAddTrack)
        cleanup = () => tracks.removeEventListener('addtrack', onAddTrack)
      }

      // Fallback retries
      const t1 = setTimeout(() => { console.log('[AudioTrack] retry 500ms'); tryRename('retry-500') }, 500)
      const t2 = setTimeout(() => { console.log('[AudioTrack] retry 1500ms'); tryRename('retry-1500') }, 1500)
      const t3 = setTimeout(() => { console.log('[AudioTrack] retry 3000ms'); tryRename('retry-3000') }, 3000)
      const prevCleanup = cleanup
      cleanup = () => {
        prevCleanup?.()
        clearTimeout(t1)
        clearTimeout(t2)
        clearTimeout(t3)
      }
    }, 100)

    return () => {
      clearTimeout(immediate)
      cleanup?.()
    }
  }, [token, originalLanguage])

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
