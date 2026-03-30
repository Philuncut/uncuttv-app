'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'

export interface FilmCardData {
  id: string
  title: string
  slug: string
  poster_url: string | null
  year: number | null
  duration_minutes: number | null
  genres: string[]
  trailer_playback_id?: string | null
  /** 0–100: optional progress for Continue Watching row */
  progressPercent?: number
  /** completed OR last_position ≥ 85% of duration */
  alreadyWatched?: boolean
  /** DB completed — drives full green progress bar when a bar is shown */
  watchCompleted?: boolean
}

function formatDuration(min: number | null): string {
  if (min == null) return '–'
  const h = Math.floor(min / 60)
  const m = min % 60
  return h > 0 ? `${h}h ${m}min` : `${m} min`
}

export default function FilmCard({ film, locale }: { film: FilmCardData; locale: string }) {
  const alreadyWatchedLabel = locale === 'en' ? 'Already Watched' : 'Bereits gesehen'
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [videoSrc, setVideoSrc] = useState<string | null>(null)
  const [showVideo, setShowVideo] = useState(false)

  const clearHoverTimeout = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current)
      hoverTimeoutRef.current = null
    }
  }

  const stopTrailer = () => {
    setShowVideo(false)
    setVideoSrc(null)
  }

  useEffect(() => {
    return () => {
      clearHoverTimeout()
    }
  }, [])

  const handlePosterMouseEnter = () => {
    if (!film.trailer_playback_id) return
    clearHoverTimeout()
    hoverTimeoutRef.current = setTimeout(async () => {
      try {
        const playbackId = encodeURIComponent(film.trailer_playback_id as string)
        const res = await fetch(`/api/mux/token?playbackId=${playbackId}`)
        if (!res.ok) return
        const data = (await res.json()) as { token?: string }
        if (!data?.token) return
        setVideoSrc(`https://stream.mux.com/${film.trailer_playback_id}.m3u8?token=${data.token}`)
        setShowVideo(true)
      } catch {
        // Ignore trailer hover fetch failures and keep poster visible.
      }
    }, 500)
  }

  const handlePosterMouseLeave = () => {
    clearHoverTimeout()
    stopTrailer()
  }

  return (
    <Link
      href={`/${locale}/films/${film.slug}`}
      style={{ textDecoration: 'none', color: 'inherit' }}
      onClick={() => {
        sessionStorage.setItem('filmeScrollY', String(window.scrollY))
        sessionStorage.setItem('filmeScrollBack', '1')
      }}
    >
      <article
        style={{
          background: 'var(--anthrazit2)',
          border: '1px solid rgba(255,255,255,0.06)',
          overflow: 'hidden',
          transition: 'border-color 0.2s, transform 0.2s',
          cursor: 'pointer',
          height: '100%',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = 'rgba(200,16,46,0.5)'
          e.currentTarget.style.transform = 'translateY(-2px)'
          handlePosterMouseEnter()
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'
          e.currentTarget.style.transform = 'translateY(0)'
          handlePosterMouseLeave()
        }}
      >
        <div
          style={{
            aspectRatio: '2/3',
            background: 'var(--anthrazit)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {film.poster_url ? (
            <img
              src={film.poster_url}
              alt=""
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
              loading="lazy"
            />
          ) : (
            <div
              style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--grey)',
                fontSize: '0.82rem',
                letterSpacing: '0.1em',
              }}
            >
              No poster
            </div>
          )}
          <video
            src={videoSrc ?? undefined}
            muted
            autoPlay
            loop
            playsInline
            controls={false}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              zIndex: 2,
              opacity: showVideo && videoSrc ? 1 : 0,
              transition: 'opacity 0.3s ease',
              pointerEvents: 'none',
            }}
          />
          {!!film.alreadyWatched && (
            <div
              role="status"
              aria-label={alreadyWatchedLabel}
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                zIndex: 2,
                background: '#c0392b',
                paddingTop: '4px',
                paddingBottom: '4px',
                paddingLeft: '8px',
                paddingRight: '8px',
                textAlign: 'center',
                fontSize: '0.75rem',
                lineHeight: 1.25,
                fontWeight: 700,
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                color: '#fff',
              }}
            >
              {alreadyWatchedLabel}
            </div>
          )}
        </div>
        <div style={{ padding: '16px' }}>
          <h2
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.25rem',
              letterSpacing: '0.04em',
              color: 'var(--warm-white)',
              marginBottom: '6px',
              lineHeight: 1.2,
            }}
          >
            {film.title}
          </h2>
          <p
            style={{
              fontSize: '0.78rem',
              color: 'var(--grey)',
              marginBottom: '8px',
            }}
          >
            {film.year ?? '–'} · {formatDuration(film.duration_minutes)}
          </p>
          {Array.isArray(film.genres) && film.genres.length > 0 && (
            <p
              style={{
                fontSize: '0.72rem',
                color: 'var(--grey-light)',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
              }}
            >
              {film.genres.join(' · ')}
            </p>
          )}
          {typeof film.progressPercent === 'number' &&
            film.progressPercent > 0 &&
            film.progressPercent <= 100 && (
              <div
                role="progressbar"
                aria-valuenow={Math.round(film.watchCompleted ? 100 : film.progressPercent)}
                aria-valuemin={0}
                aria-valuemax={100}
                style={{
                  marginTop: '12px',
                  height: '4px',
                  borderRadius: '2px',
                  background: 'rgba(255,255,255,0.12)',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${film.watchCompleted ? 100 : film.progressPercent}%`,
                    height: '100%',
                    background: film.watchCompleted ? '#22c55e' : 'var(--red)',
                    borderRadius: '2px',
                    transition: 'width 0.2s ease, background 0.2s ease',
                  }}
                />
              </div>
            )}
        </div>
      </article>
    </Link>
  )
}
