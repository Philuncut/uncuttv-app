'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
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

interface SubtitleTrackInfo {
  index: number
  label: string
  active: boolean
}

interface FilmPlayerProps {
  playbackId: string
  filmId: string
  title: string
  locale: string
  durationMinutes?: number | null
  originalLanguage?: string
  /** ISO 639-1 codes from films.subtitle_languages in Supabase */
  subtitleLanguages?: string[]
  startTime?: number
  variant?: 'default' | 'hero'
  playLabel?: string
  loadingLabel?: string
  /** Called when the main film playback starts */
  onPlay?: () => void
}

// ── helpers to reach the media-tracks AudioTrackList on the mux-player element
type MuxAudioTrack = { id: string; label: string; language: string; kind: string; enabled: boolean }
type MuxAudioTrackList = EventTarget & { length: number; [i: number]: MuxAudioTrack }

function getAudioTracks(el: MuxPlayerElement): MuxAudioTrackList | null {
  const tracks = (el as unknown as { audioTracks?: MuxAudioTrackList }).audioTracks
  return tracks && typeof tracks.length === 'number' ? tracks : null
}

function getTextTracks(el: MuxPlayerElement): TextTrackList | null {
  const tt = (el as unknown as { textTracks?: TextTrackList }).textTracks
  return tt && typeof tt.length === 'number' ? tt : null
}

export default function FilmPlayer({
  playbackId,
  filmId,
  title,
  locale,
  durationMinutes,
  originalLanguage,
  subtitleLanguages = [],
  startTime,
  variant = 'default',
  playLabel,
  loadingLabel,
  onPlay,
}: FilmPlayerProps) {
  const tDetail = useTranslations('filmDetail')
  const router = useRouter()
  const [token, setToken] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [tracks, setTracks] = useState<AudioTrackInfo[]>([])
  const [subtitles, setSubtitles] = useState<SubtitleTrackInfo[]>([])
  const [switcherOpen, setSwitcherOpen] = useState(false)
  const [subSwitcherOpen, setSubSwitcherOpen] = useState(false)
  const [controlsVisible, setControlsVisible] = useState(false)
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const switcherRef = useRef<HTMLDivElement>(null)
  const subSwitcherRef = useRef<HTMLDivElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)

  const playerRef = useRef<MuxPlayerElement | null>(null)
  const lastPeriodicSyncRef = useRef(Date.now())
  const completedSentRef = useRef(false)

  // ── Selbst mitgezaehlte Abspieldauer ──
  // Die Positionsdifferenz taugt als Abrechnungsgrundlage nur naeherungsweise:
  // sie verliert den ersten Ping jeder Sitzung und kann Pufferpausen nicht von
  // Wiedergabe unterscheiden. Hier laeuft stattdessen eine Uhr, die nur waehrend
  // wirklicher Wiedergabe laeuft. Der Server deckelt den Wert trotzdem gegen die
  // verstrichene Uhrzeit -- ein Client gilt nicht als vertrauenswuerdig.
  const playedMsRef = useRef(0)
  const playingSinceRef = useRef<number | null>(null)
  const localeAppliedRef = useRef(false)
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

  const playedFlush = useCallback(() => {
    if (playingSinceRef.current != null) {
      const now = Date.now()
      playedMsRef.current += now - playingSinceRef.current
      playingSinceRef.current = now
    }
  }, [])

  const playedStart = useCallback(() => {
    if (playingSinceRef.current == null) playingSinceRef.current = Date.now()
  }, [])

  const playedStop = useCallback(() => {
    playedFlush()
    playingSinceRef.current = null
  }, [playedFlush])

  /**
   * Nimmt die vollen Sekunden heraus und laesst den Rest stehen, damit ueber
   * viele Pings hinweg nichts abgeschnitten wird.
   */
  const playedTake = useCallback(() => {
    playedFlush()
    const secs = Math.floor(playedMsRef.current / 1000)
    playedMsRef.current -= secs * 1000
    return secs
  }, [playedFlush])

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
            played_seconds: playedTake(),
          }),
        })
      } catch (e) {
        console.error('watchtime sync failed:', e)
      }
    },
    [filmId, token, playedTake]
  )

  /**
   * Beim Verlassen der Seite bleibt fuer fetch keine Zeit mehr -- der Browser
   * bricht laufende Anfragen ab. sendBeacon uebergibt die Nachricht dem Browser
   * und laesst ihn sie nach dem Entladen zustellen.
   *
   * Ohne das verfielen die bis zu 12 Sekunden seit dem letzten Ping, und zwar
   * bei jedem Abbruch -- also gerade bei den Zuschauern, die einen Film nicht
   * zu Ende sehen.
   */
  const beaconWatchtime = useCallback(() => {
    const el = playerRef.current
    if (!el || !token) return
    playedStop()
    const played = playedTake()
    const cur = Math.max(0, Math.floor(el.currentTime))
    if (played <= 0 && cur <= 0) return
    try {
      const payload = JSON.stringify({
        film_id: filmId,
        last_position: cur,
        duration_seconds: durationSecondsRef.current ?? undefined,
        completed: false,
        played_seconds: played,
      })
      navigator.sendBeacon?.(
        '/api/watchtime',
        new Blob([payload], { type: 'application/json' })
      )
    } catch {
      // Beim Entladen ist nichts mehr zu retten -- still bleiben.
    }
  }, [filmId, token, playedStop, playedTake])

  useEffect(() => {
    if (!token) return
    // pagehide statt beforeunload: beforeunload feuert auf iOS und bei
    // Seitenwechseln im Bfcache nicht zuverlaessig.
    const onHide = () => beaconWatchtime()
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') beaconWatchtime()
    }
    window.addEventListener('pagehide', onHide)
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      window.removeEventListener('pagehide', onHide)
      document.removeEventListener('visibilitychange', onVisibility)
      // Auch beim Wechsel auf eine andere Seite innerhalb der App: React
      // raeumt hier auf, ohne dass pagehide feuert.
      beaconWatchtime()
    }
  }, [token, beaconWatchtime])

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
    playedStop()
    await syncWatchtime({ completed: true })
    setTimeout(() => {
      router.push(`/${locale}/films`)
    }, 1500)
  }, [syncWatchtime, playedStop, router, locale])

  const handleSeeked = useCallback(() => {
    const el = playerRef.current
    if (el && !el.paused) playedStart()
  }, [playedStart])

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

      // Auto-select track matching current locale (only on first discovery)
      if (list.length > 1 && !localeAppliedRef.current) {
        let targetIdx = -1
        for (let i = 0; i < infos.length; i++) {
          const raw = list[i].language
          const resolved = raw && raw !== 'und' ? raw : (i === 0 && originalLanguage ? originalLanguage : '')
          if (resolved === locale) { targetIdx = i; break }
        }
        if (targetIdx >= 0) {
          for (let i = 0; i < list.length; i++) {
            list[i].enabled = i === targetIdx
          }
          for (const info of infos) {
            info.enabled = info.index === targetIdx
          }
          localeAppliedRef.current = true
        }
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
  }, [token, originalLanguage, locale])

  // ── Build subtitle list from DB data + disable HLS tracks on load ──
  const [activeSubLang, setActiveSubLang] = useState<string | null>(null)

  useEffect(() => {
    if (!token) return

    // Build subtitle options from DB column (always complete)
    if (subtitleLanguages.length > 0) {
      setSubtitles(
        subtitleLanguages.map((lang, i) => ({
          index: i,
          label: LANG_LABELS[lang] ?? lang.toUpperCase(),
          active: false,
        }))
      )
    }

    // Disable all HLS subtitle/caption tracks on load
    function disableAllSubs() {
      const el = playerRef.current
      if (!el) return
      const tt = getTextTracks(el)
      if (!tt) return
      for (let i = 0; i < tt.length; i++) {
        if (tt[i].kind === 'subtitles' || tt[i].kind === 'captions') {
          tt[i].mode = 'disabled'
        }
      }
    }

    const t0 = setTimeout(disableAllSubs, 300)
    const t1 = setTimeout(disableAllSubs, 1000)
    const t2 = setTimeout(disableAllSubs, 3000)

    // Also disable newly added tracks
    let cleanupFn: (() => void) | undefined
    const t3 = setTimeout(() => {
      const el = playerRef.current
      const tt = el ? getTextTracks(el) : null
      if (tt) {
        const onAdd = (e: Event) => {
          const track = (e as TrackEvent).track
          if (track && (track.kind === 'subtitles' || track.kind === 'captions')) {
            track.mode = 'disabled'
          }
        }
        tt.addEventListener('addtrack', onAdd)
        cleanupFn = () => tt.removeEventListener('addtrack', onAdd)
      }
    }, 200)

    return () => {
      clearTimeout(t0)
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
      cleanupFn?.()
    }
  }, [token, subtitleLanguages])

  // ── Switch subtitle track by language code ──
  function switchSubtitle(lang: string | null) {
    const el = playerRef.current
    if (!el) return
    const tt = getTextTracks(el)
    if (!tt) return

    // Disable all, then enable the matching one
    for (let i = 0; i < tt.length; i++) {
      if (tt[i].kind === 'subtitles' || tt[i].kind === 'captions') {
        tt[i].mode = (lang && tt[i].language === lang) ? 'showing' : 'disabled'
      }
    }

    setActiveSubLang(lang)
    setSubtitles(prev => prev.map(s => ({
      ...s,
      active: lang ? subtitleLanguages[s.index] === lang : false,
    })))
    setSubSwitcherOpen(false)
  }

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

  // ── Close dropdowns on outside click ──
  useEffect(() => {
    if (!switcherOpen && !subSwitcherOpen) return
    function onDown(e: MouseEvent) {
      if (switcherOpen && switcherRef.current && !switcherRef.current.contains(e.target as Node)) {
        setSwitcherOpen(false)
      }
      if (subSwitcherOpen && subSwitcherRef.current && !subSwitcherRef.current.contains(e.target as Node)) {
        setSubSwitcherOpen(false)
      }
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [switcherOpen, subSwitcherOpen])

  // ── Auto-hide controls after 3s of no mouse movement ──
  useEffect(() => {
    if (!token) return
    const wrapEl = wrapRef.current
    if (!wrapEl) return

    function show() {
      setControlsVisible(true)
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current)
      hideTimerRef.current = setTimeout(() => {
        setControlsVisible(false)
      }, 3000)
    }

    function hide() {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current)
      setControlsVisible(false)
    }

    wrapEl.addEventListener('mousemove', show)
    wrapEl.addEventListener('mouseenter', show)
    wrapEl.addEventListener('mouseleave', hide)

    return () => {
      wrapEl.removeEventListener('mousemove', show)
      wrapEl.removeEventListener('mouseenter', show)
      wrapEl.removeEventListener('mouseleave', hide)
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current)
    }
  }, [token])

  async function handlePlay() {
    if (token) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/mux/token?playbackId=${encodeURIComponent(playbackId)}&filmId=${encodeURIComponent(filmId)}`)
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error ?? tDetail('noAccess'))
        return
      }
      const data = await res.json()
      setToken(data.token)
      onPlay?.()
    } catch {
      setError(tDetail('playerError'))
    } finally {
      setLoading(false)
    }
  }

  if (error) {
    return (
      <div style={{
        padding: '24px',
        background: 'rgba(var(--red-rgb),0.1)',
        border: '1px solid rgba(var(--red-rgb),0.3)',
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
        {loading ? (loadingLabel ?? tDetail('playerLoading')) : (playLabel ?? tDetail('play'))}
      </button>
    )
  }

  const activeTrack = tracks.find(t => t.enabled)
  const showAudioSwitcher = tracks.length > 1
  const activeSub = activeSubLang !== null
  const showSubSwitcher = subtitleLanguages.length > 0
  const anyOverlayOpen = switcherOpen || subSwitcherOpen

  return (
    <div
      ref={wrapRef}
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
        startTime={startTime && startTime > 0 ? startTime : undefined}
        defaultHiddenCaptions
        style={{ aspectRatio: '16/9', width: '100%' }}
        accentColor="#d40000"
        onLoadedMetadata={handleLoadedMetadata}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
        /* Die Uhr laeuft nur waehrend wirklicher Wiedergabe. 'playing' deckt
           auch den Wiederanlauf nach Puffern und nach einem Sprung ab. */
        onPlay={playedStart}
        onPlaying={playedStart}
        onPause={playedStop}
        onWaiting={playedStop}
        onSeeking={playedStop}
        onSeeked={handleSeeked}
      />

      {/* ── Custom control overlays (bottom-right) ── */}
      <div style={{
        position: 'absolute',
        bottom: '52px',
        right: '12px',
        zIndex: 10,
        display: 'flex',
        gap: '6px',
        opacity: (controlsVisible || anyOverlayOpen) ? 1 : 0,
        pointerEvents: (controlsVisible || anyOverlayOpen) ? 'auto' : 'none',
        transition: 'opacity 0.3s ease',
      }}>
        {/* ── Subtitle switcher ── */}
        {showSubSwitcher && (
          <div ref={subSwitcherRef} style={{ position: 'relative' }}>
            <button
              type="button"
              onClick={() => { setSubSwitcherOpen(o => !o); setSwitcherOpen(false) }}
              className="sub-switcher-btn"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                background: subSwitcherOpen ? '#b30000' : '#d40000',
                color: '#fff',
                border: 'none',
                borderRadius: '2px',
                padding: '6px 10px',
                fontSize: '0.75rem',
                fontWeight: 600,
                letterSpacing: '0.06em',
                cursor: 'pointer',
                lineHeight: 1,
                transition: 'all 0.2s ease',
              }}
            >
              CC{activeSubLang ? ` · ${activeSubLang.toUpperCase()}` : ''}
            </button>

            {subSwitcherOpen && (
              <div style={{
                position: 'absolute',
                bottom: 'calc(100% + 4px)',
                right: 0,
                minWidth: '150px',
                background: 'rgba(0,0,0,0.92)',
                border: '1px solid rgba(255,255,255,0.1)',
                overflow: 'hidden',
              }}>
                {/* Off option */}
                <button
                  type="button"
                  onClick={() => switchSubtitle(null)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    width: '100%',
                    textAlign: 'left',
                    padding: '8px 14px',
                    fontSize: '0.8rem',
                    fontWeight: !activeSub ? 600 : 400,
                    color: '#fff',
                    background: !activeSub ? 'rgba(255,255,255,0.08)' : 'none',
                    border: 'none',
                    cursor: 'pointer',
                    letterSpacing: '0.04em',
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = !activeSub ? 'rgba(255,255,255,0.08)' : 'none' }}
                >
                  <span style={{ width: '14px', textAlign: 'center' }}>{!activeSub ? '✓' : ''}</span>
                  Off
                </button>
                {subtitles.map((s, i) => (
                  <button
                    key={s.index}
                    type="button"
                    onClick={() => switchSubtitle(subtitleLanguages[i])}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      width: '100%',
                      textAlign: 'left',
                      padding: '8px 14px',
                      fontSize: '0.8rem',
                      fontWeight: s.active ? 600 : 400,
                      color: '#fff',
                      background: s.active ? 'rgba(255,255,255,0.08)' : 'none',
                      border: 'none',
                      cursor: 'pointer',
                      letterSpacing: '0.04em',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)' }}
                    onMouseLeave={e => { e.currentTarget.style.background = s.active ? 'rgba(255,255,255,0.08)' : 'none' }}
                  >
                    <span style={{ width: '14px', textAlign: 'center' }}>{s.active ? '✓' : ''}</span>
                    {s.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Audio track switcher ── */}
        {showAudioSwitcher && (
          <div ref={switcherRef} style={{ position: 'relative' }}>
            <button
              type="button"
              onClick={() => { setSwitcherOpen(o => !o); setSubSwitcherOpen(false) }}
              className="audio-switcher-btn"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                background: switcherOpen ? '#b30000' : '#d40000',
                color: '#fff',
                border: 'none',
                borderRadius: '2px',
                padding: '6px 10px',
                fontSize: '0.75rem',
                fontWeight: 600,
                letterSpacing: '0.06em',
                cursor: 'pointer',
                lineHeight: 1,
                transition: 'background 0.15s',
              }}
            >
              <span style={{ fontSize: '0.85rem' }}>🔊</span>
              {activeTrack?.shortLabel ?? '—'}
            </button>

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
      </div>

      {/* Hide MUX built-in audio + captions menus */}
      <style>{`
        .film-player-wrap mux-player {
          --audio-track-menu-button: none;
          --captions-button: none;
          --captions-menu-button: none;
          --media-primary-color: #ffffff;
          --media-secondary-color: rgba(0,0,0,0.6);
          --media-accent-color: #d40000;
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
        media-captions-button,
        media-captions-menu-button,
        media-captions-menu {
          display: none !important;
        }
        .audio-switcher-btn:hover {
          background: #b30000 !important;
        }
        .sub-switcher-btn:hover {
          background: #b30000 !important;
          box-shadow: 0 0 12px rgba(212, 0, 0, 0.8);
        }
      `}</style>
    </div>
  )
}
