'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import MuxPlayer from '@mux/mux-player-react'
import type MuxPlayerElement from '@mux/mux-player'

const SYNC_INTERVAL_MS = 12_000
const COMPLETE_RATIO = 0.9

const LANG_LABELS: Record<string, string> = {
  de: 'Deutsch',
  en: 'English',
  es: 'Español',
  fr: 'Français',
  it: 'Italiano',
}

const LANG_SHORT: Record<string, string> = {
  de: 'DE',
  en: 'EN',
  es: 'ES',
  fr: 'FR',
  it: 'IT',
}

interface AudioTrackInfo {
  index: number
  label: string
  shortLabel: string
  enabled: boolean
}

interface FilmPlayerProps {
  playbackId: string
  filmId: string
  title: string
  locale: string
  durationMinutes?: number | null
  originalLanguage?: string
  variant?: 'default' | 'hero'
  playLabel?: string
  loadingLabel?: string
}

// ── helpers to reach the media-tracks AudioTrackList on the mux-player element
type MuxAudioTrack = { id: string; label: string; language: string; kind: string; enabled: boolean }
type MuxAudioTrackList = EventTarget & { length: number; [i: number]: MuxAudioTrack }

function getAudioTracks(el: MuxPlayerElement): MuxAudioTrackList | null {
  const tracks = (el as unknown as { audioTracks?: MuxAudioTrackList }).audioTracks
  return tracks && typeof tracks.length === 'number' ? tracks : null
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
  const [tracks, setTracks] = useState<AudioTrackInfo[]>([])
  const [switcherOpen, setSwitcherOpen] = useState(false)
  const switcherRef = useRef<HTMLDivElement>(null)

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

  // ── Discover audio tracks from the mux-player element ──
  useEffect(() => {
    if (!token) return

    function readTracks() {
      const el = playerRef.current
      if (!el) return
      const list = getAudioTracks(el)
      if (!list || list.length === 0) return

      const infos: AudioTrackInfo[] = []
      for (let i = 0; i < list.length; i++) {
        const t = list[i]
        const lang = t.language && t.language !== 'und' ? t.language : (i === 0 && originalLanguage ? originalLanguage : '')
        infos.push({
          index: i,
          label: LANG_LABELS[lang] ?? (t.label || `Track ${i + 1}`),
          shortLabel: LANG_SHORT[lang] ?? (lang.toUpperCase() || `${i + 1}`),
          enabled: t.enabled,
        })
      }
      setTracks(infos)
    }

    // Try immediately, then listen for addtrack
    const t0 = setTimeout(() => {
      readTracks()
      const el = playerRef.current
      if (!el) return
      const list = getAudioTracks(el)
      if (list && typeof list.addEventListener === 'function') {
        list.addEventListener('addtrack', readTracks)
        list.addEventListener('change', readTracks)
      }
    }, 200)

    // Fallback retries for slow HLS manifests
    const t1 = setTimeout(readTracks, 1000)
    const t2 = setTimeout(readTracks, 3000)

    return () => {
      clearTimeout(t0)
      clearTimeout(t1)
      clearTimeout(t2)
      const el = playerRef.current
      if (!el) return
      const list = getAudioTracks(el)
      if (list && typeof list.removeEventListener === 'function') {
        list.removeEventListener('addtrack', readTracks)
        list.removeEventListener('change', readTracks)
      }
    }
  }, [token, originalLanguage])

  // ── Switch audio track ──
  function switchTrack(index: number) {
    const el = playerRef.current
    if (!el) return
    const list = getAudioTracks(el)
    if (!list) return

    for (let i = 0; i < list.length; i++) {
      list[i].enabled = i === index
    }

    setTracks(prev => prev.map(t => ({ ...t, enabled: t.index === index })))
    setSwitcherOpen(false)
  }

  // ── Close switcher on outside click ──
  useEffect(() => {
    if (!switcherOpen) return
    function onDown(e: MouseEvent) {
      if (switcherRef.current && !switcherRef.current.contains(e.target as Node)) {
        setSwitcherOpen(false)
      }
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [switcherOpen])

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

  const activeTrack = tracks.find(t => t.enabled)
  const showSwitcher = tracks.length > 1

  return (
    <div
      className="film-player-wrap"
      style={{
        marginTop: wrapMarginTop,
        maxWidth: variant === 'hero' ? '100%' : '900px',
        width: '100%',
        position: 'relative',
      }}
    >
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

      {/* ── Custom audio track switcher ── */}
      {showSwitcher && (
        <div
          ref={switcherRef}
          className="audio-switcher"
          data-open={switcherOpen || undefined}
          style={{
            position: 'absolute',
            bottom: '52px',
            right: '12px',
            zIndex: 10,
          }}
        >
          {/* Trigger */}
          <button
            type="button"
            onClick={() => setSwitcherOpen(o => !o)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              background: 'rgba(0,0,0,0.75)',
              color: '#fff',
              border: 'none',
              padding: '6px 10px',
              fontSize: '0.75rem',
              fontWeight: 600,
              letterSpacing: '0.06em',
              cursor: 'pointer',
              lineHeight: 1,
            }}
          >
            <span style={{ fontSize: '0.85rem' }}>🔊</span>
            {activeTrack?.shortLabel ?? '—'}
          </button>

          {/* Dropdown */}
          {switcherOpen && (
            <div style={{
              position: 'absolute',
              bottom: 'calc(100% + 4px)',
              right: 0,
              minWidth: '140px',
              background: 'rgba(0,0,0,0.9)',
              border: '1px solid rgba(255,255,255,0.1)',
              overflow: 'hidden',
            }}>
              {tracks.map(t => (
                <button
                  key={t.index}
                  type="button"
                  onClick={() => switchTrack(t.index)}
                  style={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'left',
                    padding: '8px 14px',
                    fontSize: '0.8rem',
                    fontWeight: t.enabled ? 600 : 400,
                    color: t.enabled ? '#c0392b' : '#fff',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    letterSpacing: '0.04em',
                  }}
                  onMouseEnter={e => { if (!t.enabled) e.currentTarget.style.background = 'rgba(255,255,255,0.08)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'none' }}
                >
                  {t.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Show switcher only on hover / focus-within + hide MUX built-in audio menu */}
      <style>{`
        .film-player-wrap .audio-switcher {
          opacity: 0;
          transition: opacity 0.2s ease;
          pointer-events: none;
        }
        .film-player-wrap:hover .audio-switcher,
        .film-player-wrap:focus-within .audio-switcher,
        .film-player-wrap .audio-switcher[data-open="true"] {
          opacity: 1;
          pointer-events: auto;
        }
        .film-player-wrap mux-player {
          --audio-track-menu-button: none;
        }
        mux-player::part(audio-track) {
          display: none !important;
        }
        media-audio-track-menu-button {
          display: none !important;
        }
        media-audio-track-menu {
          display: none !important;
        }
      `}</style>
    </div>
  )
}
