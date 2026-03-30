'use client'

import { useState, type ReactNode } from 'react'
import TrailerHero from './TrailerHero'
import FilmPlayer from './FilmPlayer'

interface FilmHeroProps {
  trailerPlaybackId: string
  filmPlayer: {
    playbackId: string
    filmId: string
    title: string
    locale: string
    durationMinutes?: number | null
    originalLanguage?: string
    subtitleLanguages?: string[]
    startTime?: number
    playLabel?: string
    loadingLabel?: string
  }
  /** Server-rendered content (title, back link, etc.) placed above the player */
  children: ReactNode
  isGeoBlocked?: boolean
  geoBlockedContent?: ReactNode
}

export default function FilmHero({
  trailerPlaybackId,
  filmPlayer,
  children,
  isGeoBlocked,
  geoBlockedContent,
}: FilmHeroProps) {
  const [isPlaying, setIsPlaying] = useState(false)

  return (
    <section
      style={{
        position: 'relative',
        minHeight: 'min(72vh, 820px)',
        width: '100%',
        overflow: 'hidden',
      }}
    >
      <TrailerHero trailerPlaybackId={trailerPlaybackId} paused={isPlaying} />
      {/* Gradient overlay */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 0,
          background:
            'linear-gradient(to top, rgba(10,10,10,1) 0%, rgba(10,10,10,0.55) 42%, rgba(10,10,10,0.25) 100%)',
        }}
      />
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          paddingTop: 'clamp(88px, 14vw, 120px)',
          paddingBottom: 0,
          paddingLeft: 'clamp(16px, 4vw, 48px)',
          paddingRight: 'clamp(16px, 4vw, 48px)',
          maxWidth: '1100px',
          margin: '0 auto',
        }}
      >
        {children}
        {isGeoBlocked ? (
          geoBlockedContent
        ) : (
          <FilmPlayer
            {...filmPlayer}
            variant="hero"
            onPlay={() => setIsPlaying(true)}
          />
        )}
      </div>
    </section>
  )
}
