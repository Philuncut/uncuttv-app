'use client'

import { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import FilmCard, { type FilmCardData } from './FilmCard'

export type { FilmCardData } from './FilmCard'

function RowArrow({
  direction,
  visible,
  onClick,
}: {
  direction: 'left' | 'right'
  visible: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      aria-label={direction === 'left' ? 'Scroll left' : 'Scroll right'}
      onClick={onClick}
      className="film-row-arrow"
      style={{
        position: 'absolute',
        top: '50%',
        transform: 'translateY(-50%)',
        [direction === 'left' ? 'left' : 'right']: '-8px',
        zIndex: 5,
        width: '40px',
        height: '40px',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#d40000',
        color: '#fff',
        border: 'none',
        cursor: 'pointer',
        fontSize: '20px',
        lineHeight: 1,
        padding: 0,
        opacity: visible ? 1 : 0,
        pointerEvents: visible ? 'auto' : 'none',
        transition: 'all 0.2s ease',
        boxShadow: 'none',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = '#b30000'
        e.currentTarget.style.boxShadow = '0 0 12px rgba(212, 0, 0, 0.8)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = '#d40000'
        e.currentTarget.style.boxShadow = 'none'
      }}
    >
      {direction === 'left' ? '‹' : '›'}
    </button>
  )
}

export function FilmRow({
  films,
  title,
  locale,
  showArrows = true,
}: {
  films: FilmCardData[]
  title: string
  locale: string
  showArrows?: boolean
}) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)
  const [hovered, setHovered] = useState(false)

  const updateArrows = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 2)
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 2)
  }, [])

  useEffect(() => {
    updateArrows()
    const el = scrollRef.current
    if (!el) return
    el.addEventListener('scroll', updateArrows, { passive: true })
    window.addEventListener('resize', updateArrows)
    return () => {
      el.removeEventListener('scroll', updateArrows)
      window.removeEventListener('resize', updateArrows)
    }
  }, [updateArrows, films])

  function scroll(dir: 'left' | 'right') {
    const el = scrollRef.current
    if (!el) return
    const amount = el.clientWidth * 0.8
    el.scrollBy({ left: dir === 'left' ? -amount : amount, behavior: 'smooth' })
  }

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
      <div
        className="film-row-bleed"
        style={{
          position: 'relative',
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* Left arrow — hidden on mobile */}
        {showArrows && (
          <div className="film-row-arrow-wrap">
            <RowArrow direction="left" visible={hovered && canScrollLeft} onClick={() => scroll('left')} />
          </div>
        )}

        <div
          ref={scrollRef}
          className="films-row-scroll"
          style={{
            display: 'flex',
            gap: '16px',
            overflowX: 'auto',
            overflowY: 'hidden',
            paddingBottom: '12px',
            paddingLeft: '0',
            paddingRight: '0',
            WebkitOverflowScrolling: 'touch',
            scrollSnapType: 'x mandatory',
            scrollbarWidth: 'none',
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

        {/* Right arrow — hidden on mobile */}
        {showArrows && (
          <div className="film-row-arrow-wrap">
            <RowArrow direction="right" visible={hovered && canScrollRight} onClick={() => scroll('right')} />
          </div>
        )}
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

  // Genre scroll hint (mobile only)
  const genreScrollRef = useRef<HTMLDivElement>(null)
  const [genreAtEnd, setGenreAtEnd] = useState(false)

  useEffect(() => {
    const el = genreScrollRef.current
    if (!el) return
    const check = () => {
      setGenreAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 5)
    }
    check()
    el.addEventListener('scroll', check, { passive: true })
    window.addEventListener('resize', check)
    return () => {
      el.removeEventListener('scroll', check)
      window.removeEventListener('resize', check)
    }
  }, [allGenres])

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
          <div style={{ position: 'relative', marginBottom: '32px' }}>
            <div
              ref={genreScrollRef}
              className="genre-filter-container"
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '8px',
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
            {/* Mobile scroll hint: fade + arrow (hidden on desktop via className) */}
            <div
              className="genre-scroll-hint"
              style={{
                position: 'absolute',
                top: 0,
                right: 0,
                width: '60px',
                height: '100%',
                background: 'linear-gradient(to left, rgba(10,10,10,1) 0%, rgba(10,10,10,0) 100%)',
                pointerEvents: 'none',
                zIndex: 2,
                opacity: genreAtEnd ? 0 : 1,
                transition: 'opacity 0.3s ease',
              }}
            />
            <div
              className="genre-scroll-hint"
              style={{
                position: 'absolute',
                right: 0,
                top: '50%',
                transform: 'translateY(-50%)',
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                background: '#d40000',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontSize: '12px',
                lineHeight: 1,
                pointerEvents: 'none',
                zIndex: 3,
                opacity: genreAtEnd ? 0 : 1,
                transition: 'opacity 0.3s ease',
              }}
            >
              ›
            </div>
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
