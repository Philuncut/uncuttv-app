'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import { createClient } from '@/lib/supabase/client'

const MuxPlayer = dynamic(() => import('@mux/mux-player-react'), { ssr: false })

type Film = {
  id: string
  slug: string
  title: string
  description: string
  short_description: string
  director: string
  film_cast: string[]
  year: number
  country: string[]
  duration_minutes: number
  genres: string[]
  language: string
  poster_url: string | null
  backdrop_url: string | null
  mux_playback_id: string
  age_rating: string | null
  blocked_in_de: boolean
}

type RelatedFilm = {
  id: string
  slug: string
  title: string
  year: number
  genres: string[]
  poster_url: string | null
  age_rating: string | null
}

const FALLBACK_GRADIENT = 'linear-gradient(160deg, #1a0505 0%, #3d0a0a 40%, #0a0a0a 100%)'

async function getCountry(): Promise<string> {
  try {
    const res = await fetch('https://ipapi.co/json/')
    const data = await res.json()
    return data.country_code || ''
  } catch {
    return ''
  }
}

export default function FilmDetailPage() {
  const params = useParams()
  const slug = params?.slug as string

  const [film, setFilm] = useState<Film | null>(null)
  const [related, setRelated] = useState<RelatedFilm[]>([])
  const [loading, setLoading] = useState(true)
  const [playing, setPlaying] = useState(false)
  const [blocked, setBlocked] = useState(false)
  const [watchSeconds, setWatchSeconds] = useState(0)
  const playerRef = useRef<any>(null)
  const supabase = createClient()

  useEffect(() => {
    async function loadFilm() {
      if (!slug) return

      const { data } = await supabase
        .from('films')
        .select('id, slug, title, description, short_description, director, film_cast, year, country, duration_minutes, genres, language, poster_url, backdrop_url, mux_playback_id, age_rating, blocked_in_de')
        .eq('slug', slug)
        .eq('is_published', true)
        .single()

      if (!data) {
        setLoading(false)
        return
      }

      setFilm(data)

      // Geo-block check
      if (data.blocked_in_de) {
        getCountry().then(country => {
          if (country === 'DE') setBlocked(true)
        })
      }

      // Related films – same genre, exclude current
      if (data.genres?.length > 0) {
        const { data: relatedData } = await supabase
          .from('films')
          .select('id, slug, title, year, genres, poster_url, age_rating')
          .eq('is_published', true)
          .neq('id', data.id)
          .overlaps('genres', data.genres)
          .limit(6)

        if (relatedData) setRelated(relatedData)
      }

      setLoading(false)
    }

    loadFilm()
  }, [slug])

  async function handlePlay() {
    if (!film || blocked) return
    setPlaying(true)
    window.scrollTo({ top: 72, behavior: 'smooth' })
  }

  useEffect(() => {
    if (!playing || !film) return
    const interval = setInterval(async () => {
      const player = playerRef.current
      if (!player) return
      const currentTime = Math.floor(player.currentTime || 0)
      const duration = Math.floor(player.duration || 0)
      const completed = duration > 0 && currentTime >= duration - 10
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      await supabase.from('watchtime').upsert({
        user_id: user.id,
        film_id: film.id,
        seconds_watched: currentTime,
        last_position: currentTime,
        completed,
        watched_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id,film_id' })
      setWatchSeconds(currentTime)
    }, 10000)
    return () => clearInterval(interval)
  }, [playing, film])

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--black)', color: 'var(--grey)', fontSize: '0.9rem', letterSpacing: '0.1em' }}>
        LADEN...
      </div>
    )
  }

  if (!film) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--black)', color: 'var(--grey)', gap: '16px' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', color: 'var(--warm-white)' }}>FILM NICHT GEFUNDEN</div>
        <Link href="/de/films" className="btn-primary">Zur Bibliothek</Link>
      </div>
    )
  }

  const posterBg = film.poster_url ? undefined : FALLBACK_GRADIENT
  const countryDisplay = Array.isArray(film.country) ? film.country[0] : film.country

  return (
    <div style={{ minHeight: '100vh', background: 'var(--black)' }}>

      {/* Navbar */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 500,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '20px 48px',
        background: 'rgba(10,10,10,0.95)', backdropFilter: 'blur(8px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <Link href="/de/films" style={{
          fontFamily: 'var(--font-display)', fontSize: '1.8rem',
          letterSpacing: '0.08em', color: 'var(--warm-white)', textDecoration: 'none',
        }}>
          UNCUT<span style={{ color: 'var(--red)' }}>TV</span>
        </Link>
        <Link href="/de/films" style={{
          fontSize: '0.82rem', color: 'var(--grey)',
          textDecoration: 'none', letterSpacing: '0.06em',
          display: 'flex', alignItems: 'center', gap: '8px',
        }}>
          ← Zurück zur Bibliothek
        </Link>
      </nav>

      {/* Video Player */}
      <div style={{ paddingTop: '72px', background: '#000' }}>
        {blocked ? (
          <div style={{
            width: '100%', aspectRatio: '16/9', maxHeight: '70vh',
            background: '#0a0a0a',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            gap: '16px', border: '1px solid rgba(229,9,20,0.2)',
          }}>
            <div style={{ fontSize: '2rem' }}>🚫</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', letterSpacing: '0.08em', color: 'var(--warm-white)' }}>
              IN DEUTSCHLAND NICHT VERFÜGBAR
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--grey)', maxWidth: '400px', textAlign: 'center', lineHeight: 1.6 }}>
              Dieser Film ist in Deutschland aufgrund gesetzlicher Bestimmungen nicht abrufbar.
            </div>
          </div>
        ) : !playing ? (
          <div style={{
            position: 'relative', width: '100%', aspectRatio: '16/9',
            background: posterBg, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            maxHeight: '70vh', overflow: 'hidden',
          }} onClick={handlePlay}>
            {film.backdrop_url && (
              <img src={film.backdrop_url} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
            )}
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)' }} />
            <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
              <div style={{
                width: '80px', height: '80px', borderRadius: '50%',
                background: 'var(--red)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 0 40px rgba(229,9,20,0.6)',
              }}>
                {false
                  ? <span style={{ fontSize: '1rem' }}>⏳</span>
                  : <span style={{ fontSize: '2rem', marginLeft: '6px' }}>▶</span>
                }
              </div>
              <span style={{ fontSize: '0.8rem', letterSpacing: '0.2em', color: 'rgba(240,236,228,0.7)', textTransform: 'uppercase' }}>
                {tokenLoading ? 'Wird geladen...' : 'Film abspielen'}
              </span>
            </div>
            <div style={{
              position: 'absolute', bottom: 0, left: 0, right: 0,
              padding: '48px 48px 32px',
              background: 'linear-gradient(to top, rgba(0,0,0,0.9), transparent)',
            }}>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem, 5vw, 4rem)', letterSpacing: '0.04em', color: 'var(--warm-white)' }}>
                {film.title.toUpperCase()}
              </h1>
            </div>
          </div>
        ) : (
          <div style={{ width: '100%', aspectRatio: '16/9', maxHeight: '70vh', background: '#000' }}>
            <MuxPlayer
              ref={playerRef}
              playbackId={film.mux_playback_id}
              metadata={{ video_title: film.title }}
              autoPlay
              style={{ width: '100%', height: '100%' }}
            />
          </div>
        )}
      </div>

      {/* Film Info */}
      <div style={{ padding: '48px 48px 0', maxWidth: '900px' }}>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
          {film.genres?.map(g => (
            <span key={g} style={{
              fontSize: '0.68rem', padding: '4px 12px',
              border: '1px solid rgba(229,9,20,0.4)',
              color: 'var(--grey-light)', letterSpacing: '0.1em', textTransform: 'uppercase',
            }}>{g}</span>
          ))}
          {film.age_rating && (
            <span style={{
              fontSize: '0.68rem', padding: '4px 12px',
              border: '1px solid rgba(255,255,255,0.1)',
              color: 'var(--grey)', letterSpacing: '0.1em',
            }}>{film.age_rating}</span>
          )}
        </div>

        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(2.5rem, 5vw, 5rem)',
          letterSpacing: '0.04em', lineHeight: 0.95,
          color: 'var(--warm-white)', marginBottom: '16px',
        }}>
          {film.title.toUpperCase()}
        </h1>

        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          fontSize: '0.78rem', color: 'var(--grey)',
          marginBottom: '24px', letterSpacing: '0.05em', flexWrap: 'wrap',
        }}>
          <span>{film.director}</span>
          <span style={{ color: 'var(--red)', fontSize: '0.4rem' }}>◆</span>
          <span>{film.year}</span>
          <span style={{ color: 'var(--red)', fontSize: '0.4rem' }}>◆</span>
          <span>{countryDisplay}</span>
          <span style={{ color: 'var(--red)', fontSize: '0.4rem' }}>◆</span>
          <span>{film.duration_minutes} Min</span>
        </div>

        <p style={{
          fontSize: '0.95rem', color: 'rgba(240,236,228,0.8)',
          lineHeight: 1.8, marginBottom: '32px', maxWidth: '680px',
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
        }}>
          {film.description}
        </p>

        {film.film_cast?.length > 0 && (
          <div style={{ marginBottom: '48px' }}>
            <div style={{ fontSize: '0.68rem', letterSpacing: '0.15em', color: 'var(--grey)', marginBottom: '10px', textTransform: 'uppercase' }}>
              Besetzung
            </div>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              {film.film_cast.map(person => (
                <span key={person} style={{
                  fontSize: '0.82rem', color: 'var(--grey-light)',
                  padding: '6px 14px',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}>{person}</span>
              ))}
            </div>
          </div>
        )}

        {watchSeconds > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px', fontSize: '0.75rem', color: 'var(--grey)' }}>
            <div style={{ flex: 1, height: '2px', background: 'rgba(255,255,255,0.1)', maxWidth: '200px' }}>
              <div style={{
                height: '100%',
                width: `${Math.min((watchSeconds / ((film.duration_minutes || 90) * 60)) * 100, 100)}%`,
                background: 'var(--red)',
              }} />
            </div>
            <span>{Math.floor(watchSeconds / 60)} Min gesehen</span>
            {watchSeconds >= 300 && (
              <span style={{ color: 'var(--red)', fontSize: '0.65rem', letterSpacing: '0.1em' }}>✓ ZÄHLT FÜR FILMEMACHER</span>
            )}
          </div>
        )}

        {!blocked && (
          <button onClick={handlePlay} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '64px' }}>
            ▶ JETZT ANSEHEN
          </button>
        )}
      </div>

      <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', margin: '0 48px' }} />

      {/* Related Films */}
      {related.length > 0 && (
        <div style={{ padding: '48px 0 80px' }}>
          <h2 style={{
            fontFamily: 'var(--font-display)', fontSize: '1.4rem',
            letterSpacing: '0.06em', color: 'var(--warm-white)',
            padding: '0 48px', marginBottom: '24px',
          }}>
            DAS KÖNNTE DIR AUCH GEFALLEN
          </h2>
          <div style={{
            display: 'flex', gap: '16px',
            overflowX: 'auto', padding: '8px 48px',
            scrollbarWidth: 'thin', scrollbarColor: 'var(--red) transparent',
          }}>
            {related.map(r => (
              <Link key={r.id} href={`/de/films/${r.slug}`} style={{ textDecoration: 'none', flexShrink: 0 }}>
                <div style={{ width: '160px' }}>
                  <div style={{
                    width: '160px', aspectRatio: '2/3',
                    background: r.poster_url ? undefined : FALLBACK_GRADIENT,
                    border: '1px solid rgba(255,255,255,0.06)',
                    position: 'relative', overflow: 'hidden',
                  }}>
                    {r.poster_url && (
                      <img src={r.poster_url} alt={r.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                    )}
                    {r.age_rating && (
                      <div style={{ position: 'absolute', top: '6px', right: '6px', background: 'rgba(229,9,20,0.9)', color: 'white', fontSize: '0.55rem', fontWeight: 700, padding: '2px 4px' }}>
                        {r.age_rating}
                      </div>
                    )}
                  </div>
                  <div style={{ marginTop: '8px' }}>
                    <div style={{ fontSize: '0.82rem', color: 'var(--grey-light)', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.title}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--grey)', marginTop: '2px' }}>{r.year} · {r.genres?.[0]}</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
