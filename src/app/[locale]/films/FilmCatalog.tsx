'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { useTranslations } from 'next-intl'

export interface FilmCardData {
  id: string
  title: string
  slug: string
  poster_url: string | null
  year: number | null
  duration_minutes: number | null
  genres: string[]
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

export function FilmCard({ film, locale }: { film: FilmCardData; locale: string }) {
  const alreadyWatchedLabel = locale === 'en' ? 'Already Watched' : 'Bereits gesehen'
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
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'
          e.currentTarget.style.transform = 'translateY(0)'
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
          <div
            style={{
              position: 'absolute',
              ...(film.alreadyWatched
                ? { top: '8px', right: '8px' }
                : { bottom: '8px', right: '8px' }),
              zIndex: 3,
              background: 'rgba(0,0,0,0.8)',
              color: 'var(--warm-white)',
              fontSize: '0.72rem',
              padding: '4px 8px',
              letterSpacing: '0.04em',
            }}
          >
            {formatDuration(film.duration_minutes)}
          </div>
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

export function FilmRow({
  films,
  title,
  locale,
}: {
  films: FilmCardData[]
  title: string
  locale: string
}) {
  if (films.length === 0) return null

  return (
    <section style={{ marginBottom: 'clamp(32px, 5vw, 48px)' }}>
      <h2
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(1.1rem, 2.5vw, 1.35rem)',
          letterSpacing: '0.08em',
          color: 'var(--warm-white)',
          marginBottom: '16px',
        }}
      >
        {title}
      </h2>
      {/* Full-bleed horizontal scroll: escape max-width + padded parents (desktop) */}
      <div
        style={{
          width: '100vw',
          marginLeft: 'calc(50% - 50vw)',
          boxSizing: 'border-box',
        }}
      >
        <div
          className="films-row-scroll"
          style={{
            display: 'flex',
            gap: '16px',
            overflowX: 'auto',
            overflowY: 'hidden',
            paddingBottom: '12px',
            paddingLeft: 'max(16px, env(safe-area-inset-left, 0px))',
            paddingRight: 'max(16px, env(safe-area-inset-right, 0px))',
            WebkitOverflowScrolling: 'touch',
            scrollSnapType: 'x mandatory',
          }}
        >
          {films.map((film) => (
            <div
              key={film.id}
              style={{
                flexShrink: 0,
                width: 'clamp(150px, 22vw, 240px)',
                scrollSnapAlign: 'start',
              }}
            >
              <FilmCard film={film} locale={locale} />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default function FilmCatalog({
  films,
  title = 'Filme',
  subtitle,
  topPadding = 100,
  showGenreFilter = true,
}: {
  films: FilmCardData[]
  title?: string
  subtitle?: string
  /** Padding below fixed navbar; set 0 when parent provides spacing */
  topPadding?: number
  /** When false, only the grid (no genre chip row) */
  showGenreFilter?: boolean
}) {
  const t = useTranslations('filmsPage')
  const pathname = usePathname()
  const locale = (pathname?.match(/^\/(de|en)(?:\/|$)/)?.[1]) ?? 'de'
  const [genreFilter, setGenreFilter] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null
    return sessionStorage.getItem('selectedGenre') || null
  })

  // Restore scroll position on back-navigation
  useEffect(() => {
    const shouldRestore = sessionStorage.getItem('filmeScrollBack')
    if (shouldRestore) {
      sessionStorage.removeItem('filmeScrollBack')
      const y = Number(sessionStorage.getItem('filmeScrollY')) || 0
      if (y > 0) {
        requestAnimationFrame(() => window.scrollTo(0, y))
      }
    }
  }, [])

  const allGenres = useMemo(() => {
    const set = new Set<string>()
    films.forEach((f) => (f.genres ?? []).forEach((g) => set.add(g)))
    return Array.from(set).sort()
  }, [films])

  const handleGenreChange = useCallback((genre: string | null) => {
    setGenreFilter(genre)
    if (genre) {
      sessionStorage.setItem('selectedGenre', genre)
    } else {
      sessionStorage.removeItem('selectedGenre')
    }
  }, [])

  const filteredFilms = useMemo(() => {
    if (!genreFilter) return films
    return films.filter((f) => (f.genres ?? []).includes(genreFilter))
  }, [films, genreFilter])

  return (
    <div style={{ paddingTop: `${topPadding}px`, paddingBottom: '48px', minHeight: '100vh' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 24px' }}>
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(2rem, 4vw, 3rem)',
            letterSpacing: '0.06em',
            color: 'var(--warm-white)',
            marginBottom: '8px',
          }}
        >
          {genreFilter ?? title}
        </h1>
        {subtitle && !genreFilter && (
          <p style={{ color: 'var(--grey)', fontSize: '0.9rem', marginBottom: '20px' }}>{subtitle}</p>
        )}

        {showGenreFilter && allGenres.length > 0 && (
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '8px',
              marginBottom: '32px',
            }}
          >
            <button
              type="button"
              onClick={() => handleGenreChange(null)}
              style={{
                padding: '8px 16px',
                fontSize: '0.78rem',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                background: genreFilter === null ? '#C8102E' : 'rgba(255,255,255,0.08)',
                color: genreFilter === null ? 'white' : 'var(--grey-light)',
                border: '1px solid rgba(255,255,255,0.12)',
                cursor: 'pointer',
                transition: 'background 0.2s, color 0.2s',
              }}
            >
              {t('filterAll')}
            </button>
            {allGenres.map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => handleGenreChange(g)}
                style={{
                  padding: '8px 16px',
                  fontSize: '0.78rem',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  background: genreFilter === g ? '#C8102E' : 'rgba(255,255,255,0.08)',
                  color: genreFilter === g ? 'white' : 'var(--grey-light)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  cursor: 'pointer',
                  transition: 'background 0.2s, color 0.2s',
                }}
              >
                {g}
              </button>
            ))}
          </div>
        )}

        {filteredFilms.length === 0 ? (
          <p style={{ color: 'var(--grey)', fontSize: '0.9rem' }}>{t('emptyCategory')}</p>
        ) : (
          <div className="films-grid">
            {filteredFilms.map((film) => (
              <FilmCard key={film.id} film={film} locale={locale} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
