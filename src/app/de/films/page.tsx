'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

type Film = {
  id: string
  title: string
  slug: string
  short_description: string
  director: string
  year: number
  country: string[]
  duration_minutes: number
  genres: string[]
  poster_url: string | null
  backdrop_url: string | null
  is_featured: boolean
  age_rating: string | null
}

type WatchEntry = {
  film_id: string
  last_position: number
  seconds_watched: number
  film: Film
}

const FALLBACK_GRADIENT = 'linear-gradient(160deg, #1a0505 0%, #3d0a0a 40%, #0a0a0a 100%)'

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Guten Morgen'
  if (h < 18) return 'Guten Tag'
  return 'Guten Abend'
}

function FilmCard({ film }: { film: Film }) {
  const [hovered, setHovered] = useState(false)
  return (
    <Link href={`/de/films/${film.slug}`} style={{ textDecoration: 'none', flexShrink: 0 }}>
      <div
        style={{ width: '160px', cursor: 'pointer' }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <div style={{
          width: '160px', aspectRatio: '2/3',
          background: film.poster_url ? undefined : FALLBACK_GRADIENT,
          outline: hovered ? '2px solid var(--red)' : '1px solid rgba(255,255,255,0.06)',
          transition: 'all 0.2s',
          transform: hovered ? 'scale(1.04)' : 'scale(1)',
          position: 'relative', overflow: 'hidden',
        }}>
          {film.poster_url && (
            <img
              src={film.poster_url}
              alt={film.title}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
          )}
          {film.age_rating && (
            <div style={{
              position: 'absolute', top: '6px', right: '6px',
              background: 'rgba(229,9,20,0.9)', color: 'white',
              fontSize: '0.55rem', fontWeight: 700, padding: '2px 4px',
            }}>{film.age_rating}</div>
          )}
          {hovered && (
            <div style={{
              position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <div style={{
                width: '40px', height: '40px', borderRadius: '50%',
                background: 'var(--red)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <span style={{ fontSize: '1rem', marginLeft: '3px' }}>▶</span>
              </div>
            </div>
          )}
        </div>
        <div style={{ marginTop: '8px' }}>
          <div style={{
            fontSize: '0.82rem', color: hovered ? 'var(--warm-white)' : 'var(--grey-light)',
            fontWeight: 500, transition: 'color 0.2s',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>{film.title}</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--grey)', marginTop: '2px' }}>
            {film.year} · {film.genres?.[0]}
          </div>
        </div>
      </div>
    </Link>
  )
}

function ContinueCard({ entry }: { entry: WatchEntry }) {
  const [hovered, setHovered] = useState(false)
  const film = entry.film
  const totalSeconds = (film.duration_minutes || 90) * 60
  const progress = Math.min(Math.round((entry.last_position / totalSeconds) * 100), 99)

  return (
    <Link href={`/de/films/${film.slug}`} style={{ textDecoration: 'none', flexShrink: 0 }}>
      <div
        style={{ width: '240px', cursor: 'pointer' }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <div style={{
          width: '240px', aspectRatio: '16/9',
          background: film.backdrop_url ? undefined : FALLBACK_GRADIENT,
          outline: hovered ? '2px solid var(--red)' : '1px solid rgba(255,255,255,0.06)',
          transition: 'all 0.2s',
          transform: hovered ? 'scale(1.03)' : 'scale(1)',
          position: 'relative', overflow: 'hidden',
        }}>
          {film.backdrop_url && (
            <img src={film.backdrop_url} alt={film.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          )}
          {hovered && (
            <div style={{
              position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <div style={{
                width: '40px', height: '40px', borderRadius: '50%',
                background: 'var(--red)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <span style={{ fontSize: '1rem', marginLeft: '3px' }}>▶</span>
              </div>
            </div>
          )}
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '3px', background: 'rgba(255,255,255,0.2)' }}>
            <div style={{ height: '100%', width: `${progress}%`, background: 'var(--red)' }} />
          </div>
        </div>
        <div style={{ marginTop: '8px' }}>
          <div style={{
            fontSize: '0.82rem', color: hovered ? 'var(--warm-white)' : 'var(--grey-light)',
            fontWeight: 500, transition: 'color 0.2s',
          }}>{film.title}</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--grey)', marginTop: '2px' }}>
            {progress}% gesehen
          </div>
        </div>
      </div>
    </Link>
  )
}

export default function FilmsPage() {
  const [search, setSearch] = useState('')
  const [activeGenre, setActiveGenre] = useState('Alle')
  const [userName, setUserName] = useState('')
  const [films, setFilms] = useState<Film[]>([])
  const [featuredFilm, setFeaturedFilm] = useState<Film | null>(null)
  const [continueWatching, setContinueWatching] = useState<WatchEntry[]>([])
  const [allGenres, setAllGenres] = useState<string[]>(['Alle'])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const name = user.user_metadata?.full_name || user.email?.split('@')[0] || ''
        setUserName(name.split(' ')[0])

        const { data: watchData } = await supabase
          .from('watchtime')
          .select('film_id, last_position, seconds_watched')
          .eq('user_id', user.id)
          .eq('completed', false)
          .gt('last_position', 0)
          .order('updated_at', { ascending: false })
          .limit(6)

        if (watchData && watchData.length > 0) {
          const filmIds = watchData.map((w: any) => w.film_id)
          const { data: watchFilms } = await supabase
            .from('films')
            .select('id, title, slug, director, year, country, duration_minutes, genres, poster_url, backdrop_url, is_featured, age_rating, short_description')
            .in('id', filmIds)
            .eq('is_published', true)

          if (watchFilms) {
            const entries = watchData.map((w: any) => ({
              ...w,
              film: watchFilms.find((f: any) => f.id === w.film_id),
            })).filter((e: any) => e.film)
            setContinueWatching(entries)
          }
        }
      }

      const { data: filmsData } = await supabase
        .from('films')
        .select('id, title, slug, short_description, director, year, country, duration_minutes, genres, poster_url, backdrop_url, is_featured, age_rating')
        .eq('is_published', true)
        .order('created_at', { ascending: false })

      if (filmsData) {
        setFilms(filmsData)
        const featured = filmsData.find((f: Film) => f.is_featured) || filmsData[0]
        setFeaturedFilm(featured || null)
        const genreSet = new Set<string>()
        filmsData.forEach((f: Film) => f.genres?.forEach((g: string) => genreSet.add(g)))
        setAllGenres(['Alle', ...Array.from(genreSet)])
      }

      setLoading(false)
    }

    loadData()
  }, [])

  const categories = activeGenre === 'Alle'
    ? allGenres
        .filter(g => g !== 'Alle')
        .map(genre => ({
          title: genre,
          films: films.filter(f =>
            f.genres?.includes(genre) &&
            (search === '' || f.title.toLowerCase().includes(search.toLowerCase()))
          ),
        }))
        .filter(cat => cat.films.length > 0)
    : [{
        title: activeGenre,
        films: films.filter(f =>
          f.genres?.includes(activeGenre) &&
          (search === '' || f.title.toLowerCase().includes(search.toLowerCase()))
        ),
      }].filter(cat => cat.films.length > 0)

  const searchResults = search !== ''
    ? films.filter(f => f.title.toLowerCase().includes(search.toLowerCase()))
    : []

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

        <div style={{ position: 'relative', flex: 1, maxWidth: '360px', margin: '0 48px' }}>
          <span style={{
            position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)',
            color: 'var(--grey)', fontSize: '0.9rem',
          }}>🔍</span>
          <input
            type="text" placeholder="Filme suchen..."
            value={search} onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%', padding: '10px 16px 10px 36px',
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: 'var(--warm-white)', fontSize: '0.88rem', outline: 'none',
            }}
            onFocus={e => e.target.style.borderColor = 'var(--red)'}
            onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
          />
        </div>

        <Link href="/de/account" style={{
          color: 'var(--grey-light)', fontSize: '0.82rem',
          letterSpacing: '0.06em', textDecoration: 'none',
        }}>
          Mein Konto
        </Link>
      </nav>

      {loading ? (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          height: '100vh', color: 'var(--grey)', fontSize: '0.9rem', letterSpacing: '0.1em',
        }}>
          LADEN...
        </div>
      ) : (
        <>
          <div style={{ padding: '92px 48px 0' }}>
            <div style={{ marginBottom: '32px' }}>
              <h2 style={{
                fontFamily: 'var(--font-display)', fontSize: '1.8rem',
                letterSpacing: '0.06em', color: 'var(--warm-white)', marginBottom: '4px',
              }}>
                {getGreeting()}{userName ? `, ${userName}` : ''}.
              </h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--grey)' }}>
                Schön, dass du wieder da bist. Wo warst du stehengeblieben?
              </p>
            </div>

            {continueWatching.length > 0 && (
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{
                  fontFamily: 'var(--font-display)', fontSize: '1.2rem',
                  letterSpacing: '0.06em', color: 'var(--warm-white)', marginBottom: '16px',
                }}>
                  WEITERSCHAUEN
                </h3>
                <div style={{
                  display: 'flex', gap: '16px', overflowX: 'auto',
                  scrollbarWidth: 'thin', scrollbarColor: 'var(--red) transparent',
                  paddingBottom: '8px',
                }}>
                  {continueWatching.map(entry => (
                    <ContinueCard key={entry.film_id} entry={entry} />
                  ))}
                </div>
              </div>
            )}
          </div>

          {featuredFilm && (
            <div style={{
              position: 'relative', margin: '16px 48px', overflow: 'hidden',
              border: '1px solid rgba(229,9,20,0.25)',
              boxShadow: '0 0 60px rgba(229,9,20,0.08), inset 0 0 60px rgba(0,0,0,0.4)',
            }}>
              <div style={{ position: 'absolute', inset: 0, background: featuredFilm.backdrop_url ? undefined : FALLBACK_GRADIENT }}>
                {featuredFilm.backdrop_url && (
                  <img src={featuredFilm.backdrop_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                )}
              </div>
              <div style={{
                position: 'absolute', inset: 0,
                background: 'linear-gradient(105deg, rgba(10,10,10,0.98) 0%, rgba(10,10,10,0.85) 45%, rgba(10,10,10,0.3) 100%)',
              }} />
              <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '3px', background: 'var(--red)', boxShadow: '0 0 20px rgba(229,9,20,0.8)' }} />

              <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: '36px', padding: '32px 40px' }}>
                <div style={{ flexShrink: 0 }}>
                  <div style={{
                    width: '130px', aspectRatio: '2/3',
                    background: featuredFilm.poster_url ? undefined : 'linear-gradient(160deg, #2a0808 0%, #4d1515 40%, #0d0d0d 100%)',
                    border: '1px solid rgba(229,9,20,0.4)', position: 'relative', overflow: 'hidden',
                    boxShadow: '4px 4px 24px rgba(0,0,0,0.8)',
                  }}>
                    {featuredFilm.poster_url && (
                      <img src={featuredFilm.poster_url} alt={featuredFilm.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                    )}
                    {featuredFilm.age_rating && (
                      <div style={{ position: 'absolute', top: '8px', right: '8px', background: '#E50914', color: 'white', fontSize: '0.5rem', fontWeight: 800, padding: '2px 5px' }}>
                        {featuredFilm.age_rating}
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
                    <span style={{ fontSize: '0.62rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'var(--red)', fontWeight: 700 }}>★ Film des Monats</span>
                    <span style={{ width: '32px', height: '1px', background: 'rgba(229,9,20,0.4)' }} />
                    {featuredFilm.genres?.map(g => (
                      <span key={g} style={{ fontSize: '0.58rem', padding: '2px 8px', border: '1px solid rgba(255,255,255,0.15)', color: 'var(--grey)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{g}</span>
                    ))}
                  </div>

                  <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2.4rem, 4.5vw, 5rem)', letterSpacing: '0.03em', lineHeight: 0.92, color: 'var(--warm-white)', marginBottom: '14px' }}>
                    {featuredFilm.title.toUpperCase()}
                  </h1>

                  {featuredFilm.short_description && (
                    <p style={{ fontSize: '0.88rem', color: 'rgba(240,236,228,0.75)', lineHeight: 1.65, marginBottom: '10px', maxWidth: '460px', fontFamily: 'var(--font-serif)', fontStyle: 'italic' }}>
                      „{featuredFilm.short_description}"
                    </p>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.73rem', color: 'var(--grey)', marginBottom: '22px', letterSpacing: '0.05em' }}>
                    <span>{featuredFilm.director}</span>
                    <span style={{ color: 'var(--red)', fontSize: '0.5rem' }}>◆</span>
                    <span>{featuredFilm.year}</span>
                    <span style={{ color: 'var(--red)', fontSize: '0.5rem' }}>◆</span>
                    <span>{Array.isArray(featuredFilm.country) ? featuredFilm.country[0] : featuredFilm.country}</span>
                    <span style={{ color: 'var(--red)', fontSize: '0.5rem' }}>◆</span>
                    <span>{featuredFilm.duration_minutes} Min</span>
                  </div>

                  <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                    <Link href={`/de/films/${featuredFilm.slug}`} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem', padding: '12px 28px', letterSpacing: '0.1em' }}>
                      ▶ JETZT ANSEHEN
                    </Link>
                    <Link href={`/de/films/${featuredFilm.slug}`} style={{ fontSize: '0.78rem', color: 'rgba(240,236,228,0.5)', textDecoration: 'none', letterSpacing: '0.1em', borderBottom: '1px solid rgba(240,236,228,0.2)', paddingBottom: '2px' }}>
                      MEHR INFO
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div style={{ padding: '24px 48px 0', display: 'flex', gap: '8px', overflowX: 'auto', scrollbarWidth: 'none' }}>
            {allGenres.map(genre => (
              <button key={genre} onClick={() => setActiveGenre(genre)} style={{
                padding: '8px 20px', flexShrink: 0,
                background: activeGenre === genre ? 'var(--red)' : 'rgba(255,255,255,0.06)',
                border: activeGenre === genre ? 'none' : '1px solid rgba(255,255,255,0.1)',
                color: 'var(--warm-white)', fontSize: '0.82rem', letterSpacing: '0.08em', cursor: 'pointer', transition: 'all 0.2s',
              }}>
                {genre}
              </button>
            ))}
          </div>

          <div style={{ padding: '16px 0 64px' }}>
            {search !== '' ? (
              searchResults.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '80px', color: 'var(--grey)' }}>
                  Keine Filme gefunden für „{search}"
                </div>
              ) : (
                <div style={{ marginBottom: '24px' }}>
                  <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', letterSpacing: '0.06em', color: 'var(--warm-white)', padding: '0 48px', marginBottom: '20px' }}>
                    SUCHERGEBNISSE
                  </h2>
                  <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', padding: '8px 48px' }}>
                    {searchResults.map(film => <FilmCard key={film.id} film={film} />)}
                  </div>
                </div>
              )
            ) : (
              categories.map(category => (
                <div key={category.title} style={{ marginBottom: '24px' }}>
                  <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', letterSpacing: '0.06em', color: 'var(--warm-white)', padding: '0 48px', marginBottom: '20px' }}>
                    {category.title.toUpperCase()}
                  </h2>
                  <div style={{ display: 'flex', gap: '16px', overflowX: 'auto', padding: '8px 48px', scrollbarWidth: 'thin', scrollbarColor: 'var(--red) transparent' }}>
                    {category.films.map(film => <FilmCard key={film.id} film={film} />)}
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  )
}
