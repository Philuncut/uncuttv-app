'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { createClient } from '@/lib/supabase/client'

const MuxPlayer = dynamic(() => import('@mux/mux-player-react'), { ssr: false })

const FILM = {
  id: '00000000-0000-0000-0000-000000000001',
  slug: 'the-last-frame',
  title: 'The Last Frame',
  director: 'Elena Vasquez',
  year: 2024,
  country: 'Spanien',
  duration_minutes: 97,
  genres: ['Drama', 'Thriller'],
  description: 'Ein Kameramann findet auf dem letzten Foto einer verstorbenen Fotografin ein Bild, das es nicht geben dürfte. Auf der Suche nach der Wahrheit gerät er in ein Netz aus Lügen, das tiefer reicht als er ahnt. Ein Film über Obsession, Schuld und die Frage, was wir wirklich sehen wollen.',
  cast: ['Marco Bellini', 'Sofia Reyes', 'Thomas Kraft'],
  mux_playback_id: 'k1jIylIzlb02vjWa00zxw00pYPnAw01MW6Zt701nm4o98s02o',
  poster: 'linear-gradient(160deg, #1a0505 0%, #3d1010 60%, #050505 100%)',
  blocked_in_de: false, // auf true setzen für beschlagnahmte Filme
}

const RELATED = [
  { id: '2', slug: 'neon-requiem', title: 'Neon Requiem', year: 2024, genres: ['Thriller'], poster: 'linear-gradient(200deg, #080815 0%, #10183d 60%, #050505 100%)' },
  { id: '3', slug: 'stille-wasser', title: 'Stille Wasser', year: 2023, genres: ['Drama'], poster: 'linear-gradient(140deg, #0a0a05 0%, #252510 60%, #050505 100%)' },
  { id: '5', slug: 'red-soil', title: 'Red Soil', year: 2023, genres: ['Drama'], poster: 'linear-gradient(150deg, #1a0505 0%, #3d0a0a 60%, #050505 100%)' },
  { id: '6', slug: 'the-weight', title: 'The Weight', year: 2024, genres: ['Drama'], poster: 'linear-gradient(180deg, #0f0a05 0%, #251a0a 60%, #050505 100%)' },
]

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
  const [playing, setPlaying] = useState(false)
  const [watchSeconds, setWatchSeconds] = useState(0)
  const [muxToken, setMuxToken] = useState<string | null>(null)
  const [tokenLoading, setTokenLoading] = useState(false)
  const [blocked, setBlocked] = useState(false)
  const playerRef = useRef<any>(null)
  const supabase = createClient()

  useEffect(() => {
    if (FILM.blocked_in_de) {
      getCountry().then(country => {
        if (country === 'DE') setBlocked(true)
      })
    }
  }, [])

  async function handlePlay() {
    if (blocked) return
    setTokenLoading(true)
    try {
      const res = await fetch(`/api/mux/token?playbackId=${FILM.mux_playback_id}`)
      const data = await res.json()
      if (data.token) {
        setMuxToken(data.token)
        setPlaying(true)
        window.scrollTo({ top: 72, behavior: 'smooth' })
      } else {
        console.error('Token error:', data.error)
      }
    } catch (e) {
      console.error('Failed to get token:', e)
    }
    setTokenLoading(false)
  }

  useEffect(() => {
    if (!playing) return
    const interval = setInterval(async () => {
      const player = playerRef.current
      if (!player) return
      const currentTime = Math.floor(player.currentTime || 0)
      const duration = Math.floor(player.duration || 0)
      const completed = duration > 0 && currentTime >= duration - 10
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { error } = await supabase.from('watchtime').upsert({
        user_id: user.id,
        film_id: FILM.id,
        seconds_watched: currentTime,
        last_position: currentTime,
        completed,
        watched_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id,film_id' })
      if (error) console.log('Supabase error:', error.message)
      setWatchSeconds(currentTime)
    }, 10000)
    return () => clearInterval(interval)
  }, [playing])

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
          {'← Zurück zur Bibliothek'}
        </Link>
      </nav>

      {/* Video Player */}
      <div style={{ paddingTop: '72px', background: '#000' }}>
        {blocked ? (
          <div style={{
            width: '100%', aspectRatio: '16/9', maxHeight: '70vh',
            background: '#0a0a0a',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            gap: '16px',
            border: '1px solid rgba(229,9,20,0.2)',
          }}>
            <div style={{ fontSize: '2rem' }}>🚫</div>
            <div style={{
              fontFamily: 'var(--font-display)', fontSize: '1.4rem',
              letterSpacing: '0.08em', color: 'var(--warm-white)',
            }}>
              IN DEUTSCHLAND NICHT VERFÜGBAR
            </div>
            <div style={{
              fontSize: '0.82rem', color: 'var(--grey)', maxWidth: '400px',
              textAlign: 'center', lineHeight: 1.6,
            }}>
              Dieser Film ist in Deutschland aufgrund gesetzlicher Bestimmungen nicht abrufbar.
            </div>
          </div>
        ) : !playing || !muxToken ? (
          <div style={{
            position: 'relative', width: '100%', aspectRatio: '16/9',
            background: FILM.poster, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            maxHeight: '70vh', overflow: 'hidden',
          }} onClick={handlePlay}>
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)' }} />
            <div style={{
              position: 'relative', zIndex: 1,
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px',
            }}>
              <div style={{
                width: '80px', height: '80px', borderRadius: '50%',
                background: 'var(--red)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 0 40px rgba(229,9,20,0.6)',
              }}>
                {tokenLoading
                  ? <span style={{ fontSize: '1rem' }}>⏳</span>
                  : <span style={{ fontSize: '2rem', marginLeft: '6px' }}>▶</span>
                }
              </div>
              <span style={{
                fontSize: '0.8rem', letterSpacing: '0.2em',
                color: 'rgba(240,236,228,0.7)', textTransform: 'uppercase',
              }}>
                {tokenLoading ? 'Wird geladen...' : 'Film abspielen'}
              </span>
            </div>
            <div style={{
              position: 'absolute', bottom: 0, left: 0, right: 0,
              padding: '48px 48px 32px',
              background: 'linear-gradient(to top, rgba(0,0,0,0.9), transparent)',
            }}>
              <h1 style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(2rem, 5vw, 4rem)',
                letterSpacing: '0.04em', color: 'var(--warm-white)',
              }}>
                {FILM.title.toUpperCase()}
              </h1>
            </div>
          </div>
        ) : (
          <div style={{ width: '100%', aspectRatio: '16/9', maxHeight: '70vh', background: '#000' }}>
            <MuxPlayer
              ref={playerRef}
              playbackId={FILM.mux_playback_id}
              tokens={{ playback: muxToken }}
              metadata={{ video_title: FILM.title }}
              autoPlay
              style={{ width: '100%', height: '100%' }}
            />
          </div>
        )}
      </div>

      {/* Film Info */}
      <div style={{ padding: '48px 48px 0', maxWidth: '900px' }}>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
          {FILM.genres.map(g => (
            <span key={g} style={{
              fontSize: '0.68rem', padding: '4px 12px',
              border: '1px solid rgba(229,9,20,0.4)',
              color: 'var(--grey-light)', letterSpacing: '0.1em',
              textTransform: 'uppercase',
            }}>{g}</span>
          ))}
          <span style={{
            fontSize: '0.68rem', padding: '4px 12px',
            border: '1px solid rgba(255,255,255,0.1)',
            color: 'var(--grey)', letterSpacing: '0.1em',
          }}>18+</span>
        </div>

        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(2.5rem, 5vw, 5rem)',
          letterSpacing: '0.04em', lineHeight: 0.95,
          color: 'var(--warm-white)', marginBottom: '16px',
        }}>
          {FILM.title.toUpperCase()}
        </h1>

        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          fontSize: '0.78rem', color: 'var(--grey)',
          marginBottom: '24px', letterSpacing: '0.05em', flexWrap: 'wrap',
        }}>
          <span>{FILM.director}</span>
          <span style={{ color: 'var(--red)', fontSize: '0.4rem' }}>●</span>
          <span>{FILM.year}</span>
          <span style={{ color: 'var(--red)', fontSize: '0.4rem' }}>●</span>
          <span>{FILM.country}</span>
          <span style={{ color: 'var(--red)', fontSize: '0.4rem' }}>●</span>
          <span>{FILM.duration_minutes} Min</span>
        </div>

        <p style={{
          fontSize: '0.95rem', color: 'rgba(240,236,228,0.8)',
          lineHeight: 1.8, marginBottom: '32px', maxWidth: '680px',
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
        }}>
          {FILM.description}
        </p>

        <div style={{ marginBottom: '48px' }}>
          <div style={{
            fontSize: '0.68rem', letterSpacing: '0.15em',
            color: 'var(--grey)', marginBottom: '10px', textTransform: 'uppercase',
          }}>Besetzung</div>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {FILM.cast.map(person => (
              <span key={person} style={{
                fontSize: '0.82rem', color: 'var(--grey-light)',
                padding: '6px 14px',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}>{person}</span>
            ))}
          </div>
        </div>

        {watchSeconds > 0 && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            marginBottom: '24px', fontSize: '0.75rem', color: 'var(--grey)',
          }}>
            <div style={{ flex: 1, height: '2px', background: 'rgba(255,255,255,0.1)', maxWidth: '200px' }}>
              <div style={{
                height: '100%',
                width: `${Math.min((watchSeconds / (FILM.duration_minutes * 60)) * 100, 100)}%`,
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
          <button
            onClick={handlePlay}
            className="btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '64px' }}
          >
            ▶ JETZT ANSEHEN
          </button>
        )}
      </div>

      <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', margin: '0 48px' }} />

      {/* Related Films */}
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
          {RELATED.map(film => (
            <Link key={film.id} href={`/de/films/${film.slug}`} style={{ textDecoration: 'none', flexShrink: 0 }}>
              <div style={{ width: '160px' }}>
                <div style={{
                  width: '160px', aspectRatio: '2/3',
                  background: film.poster,
                  border: '1px solid rgba(255,255,255,0.06)',
                  position: 'relative', overflow: 'hidden',
                }}>
                  <div style={{
                    position: 'absolute', top: '6px', right: '6px',
                    background: 'rgba(229,9,20,0.9)', color: 'white',
                    fontSize: '0.55rem', fontWeight: 700, padding: '2px 4px',
                  }}>18+</div>
                </div>
                <div style={{ marginTop: '8px' }}>
                  <div style={{
                    fontSize: '0.82rem', color: 'var(--grey-light)', fontWeight: 500,
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>{film.title}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--grey)', marginTop: '2px' }}>
                    {film.year} · {film.genres[0]}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

    </div>
  )
}