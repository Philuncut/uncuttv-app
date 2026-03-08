'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

const FEATURED_FILM = {
  id: '1',
  slug: 'the-last-frame',
  title: 'The Last Frame',
  director: 'Elena Vasquez',
  year: 2024,
  country: 'Spanien',
  duration_minutes: 97,
  genres: ['Drama', 'Thriller'],
  short_description: 'Ein Kameramann findet auf dem letzten Foto einer verstorbenen Fotografin ein Bild, das es nicht geben dürfte.',
  backdrop: 'linear-gradient(160deg, #1a0505 0%, #3d0a0a 40%, #0a0a0a 100%)',
}

const CONTINUE_WATCHING = [
  { id: '2', slug: 'neon-requiem', title: 'Neon Requiem', year: 2024, genres: ['Thriller'], poster: 'linear-gradient(200deg, #080815 0%, #10183d 60%, #050505 100%)', progress: 65 },
  { id: '3', slug: 'stille-wasser', title: 'Stille Wasser', year: 2023, genres: ['Drama'], poster: 'linear-gradient(140deg, #0a0a05 0%, #252510 60%, #050505 100%)', progress: 32 },
  { id: '4', slug: 'transit-zone', title: 'Transit Zone', year: 2024, genres: ['Dokumentation'], poster: 'linear-gradient(170deg, #0f050f 0%, #251025 60%, #050505 100%)', progress: 88 },
]

const CATEGORIES = [
  {
    title: 'Neu auf UncutTV',
    films: [
      { id: '1', slug: 'the-last-frame', title: 'The Last Frame', year: 2024, genres: ['Drama'], poster: 'linear-gradient(160deg, #1a0505 0%, #3d1010 60%, #050505 100%)' },
      { id: '2', slug: 'neon-requiem', title: 'Neon Requiem', year: 2024, genres: ['Thriller'], poster: 'linear-gradient(200deg, #080815 0%, #10183d 60%, #050505 100%)' },
      { id: '3', slug: 'stille-wasser', title: 'Stille Wasser', year: 2023, genres: ['Drama'], poster: 'linear-gradient(140deg, #0a0a05 0%, #252510 60%, #050505 100%)' },
      { id: '4', slug: 'transit-zone', title: 'Transit Zone', year: 2024, genres: ['Dokumentation'], poster: 'linear-gradient(170deg, #0f050f 0%, #251025 60%, #050505 100%)' },
      { id: '5', slug: 'red-soil', title: 'Red Soil', year: 2023, genres: ['Drama'], poster: 'linear-gradient(150deg, #1a0505 0%, #3d0a0a 60%, #050505 100%)' },
      { id: '6', slug: 'the-weight', title: 'The Weight', year: 2024, genres: ['Drama'], poster: 'linear-gradient(180deg, #0f0a05 0%, #251a0a 60%, #050505 100%)' },
    ]
  },
  {
    title: 'Drama',
    films: [
      { id: '3', slug: 'stille-wasser', title: 'Stille Wasser', year: 2023, genres: ['Drama'], poster: 'linear-gradient(140deg, #0a0a05 0%, #252510 60%, #050505 100%)' },
      { id: '5', slug: 'red-soil', title: 'Red Soil', year: 2023, genres: ['Drama'], poster: 'linear-gradient(150deg, #1a0505 0%, #3d0a0a 60%, #050505 100%)' },
      { id: '6', slug: 'the-weight', title: 'The Weight', year: 2024, genres: ['Drama'], poster: 'linear-gradient(180deg, #0f0a05 0%, #251a0a 60%, #050505 100%)' },
      { id: '1', slug: 'the-last-frame', title: 'The Last Frame', year: 2024, genres: ['Drama'], poster: 'linear-gradient(160deg, #1a0505 0%, #3d1010 60%, #050505 100%)' },
    ]
  },
  {
    title: 'Thriller',
    films: [
      { id: '2', slug: 'neon-requiem', title: 'Neon Requiem', year: 2024, genres: ['Thriller'], poster: 'linear-gradient(200deg, #080815 0%, #10183d 60%, #050505 100%)' },
      { id: '1', slug: 'the-last-frame', title: 'The Last Frame', year: 2024, genres: ['Thriller'], poster: 'linear-gradient(160deg, #1a0505 0%, #3d1010 60%, #050505 100%)' },
    ]
  },
  {
    title: 'Dokumentation',
    films: [
      { id: '4', slug: 'transit-zone', title: 'Transit Zone', year: 2024, genres: ['Dokumentation'], poster: 'linear-gradient(170deg, #0f050f 0%, #251025 60%, #050505 100%)' },
    ]
  },
]

const ALL_GENRES = ['Alle', 'Drama', 'Thriller', 'Dokumentation', 'Komödie', 'Horror', 'Sci-Fi']

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Guten Morgen'
  if (h < 18) return 'Guten Tag'
  return 'Guten Abend'
}

function FilmCard({ film }: { film: typeof CATEGORIES[0]['films'][0] }) {
  const [hovered, setHovered] = useState(false)
  return (
    <Link href={`/de/films/${film.slug}`} style={{ textDecoration: 'none', flexShrink: 0 }}>
      <div style={{ width: '160px', cursor: 'pointer' }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <div style={{
          width: '160px', aspectRatio: '2/3',
          background: film.poster,
          outline: hovered ? '2px solid var(--red)' : '1px solid rgba(255,255,255,0.06)',
          transition: 'all 0.2s',
          transform: hovered ? 'scale(1.04)' : 'scale(1)',
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', top: '6px', right: '6px',
            background: 'rgba(229,9,20,0.9)', color: 'white',
            fontSize: '0.55rem', fontWeight: 700, padding: '2px 4px',
          }}>18+</div>
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
            {film.year} · {film.genres[0]}
          </div>
        </div>
      </div>
    </Link>
  )
}

function ContinueCard({ film }: { film: typeof CONTINUE_WATCHING[0] }) {
  const [hovered, setHovered] = useState(false)
  return (
    <Link href={`/de/films/${film.slug}`} style={{ textDecoration: 'none', flexShrink: 0 }}>
      <div style={{ width: '240px', cursor: 'pointer' }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <div style={{
          width: '240px', aspectRatio: '16/9',
          background: film.poster,
          outline: hovered ? '2px solid var(--red)' : '1px solid rgba(255,255,255,0.06)',
          transition: 'all 0.2s',
          transform: hovered ? 'scale(1.03)' : 'scale(1)',
          position: 'relative', overflow: 'hidden',
        }}>
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
            <div style={{ height: '100%', width: `${film.progress}%`, background: 'var(--red)' }} />
          </div>
        </div>
        <div style={{ marginTop: '8px' }}>
          <div style={{
            fontSize: '0.82rem', color: hovered ? 'var(--warm-white)' : 'var(--grey-light)',
            fontWeight: 500, transition: 'color 0.2s',
          }}>{film.title}</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--grey)', marginTop: '2px' }}>
            {film.progress}% gesehen
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
  const supabase = createClient()

  useEffect(() => {
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const name = user.user_metadata?.full_name || user.email?.split('@')[0] || ''
        setUserName(name.split(' ')[0])
      }
    }
    getUser()
  }, [])

  const filteredCategories = CATEGORIES.map(cat => ({
    ...cat,
    films: cat.films.filter(f =>
      (search === '' || f.title.toLowerCase().includes(search.toLowerCase())) &&
      (activeGenre === 'Alle' || f.genres.includes(activeGenre))
    )
  })).filter(cat => cat.films.length > 0)

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

      {/* Greeting + Continue Watching */}
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
            {CONTINUE_WATCHING.map(film => (
              <ContinueCard key={film.id} film={film} />
            ))}
          </div>
        </div>
      </div>

      {/* Featured Film – Cinematic Banner */}
      <div style={{
        position: 'relative',
        margin: '16px 48px',
        overflow: 'hidden',
        border: '1px solid rgba(229,9,20,0.25)',
        boxShadow: '0 0 60px rgba(229,9,20,0.08), inset 0 0 60px rgba(0,0,0,0.4)',
      }}>
        {/* Background */}
        <div style={{ position: 'absolute', inset: 0, background: FEATURED_FILM.backdrop }} />
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(105deg, rgba(10,10,10,0.98) 0%, rgba(10,10,10,0.85) 45%, rgba(10,10,10,0.3) 100%)',
        }} />

        {/* Red left accent bar */}
        <div style={{
          position: 'absolute', left: 0, top: 0, bottom: 0,
          width: '3px', background: 'var(--red)',
          boxShadow: '0 0 20px rgba(229,9,20,0.8)',
        }} />

        {/* Content */}
        <div style={{
          position: 'relative', zIndex: 1,
          display: 'flex', alignItems: 'center', gap: '36px',
          padding: '32px 40px',
        }}>

          {/* Poster */}
          <div style={{ flexShrink: 0, position: 'relative' }}>
            <div style={{
              width: '130px', aspectRatio: '2/3',
              background: 'linear-gradient(160deg, #2a0808 0%, #4d1515 40%, #0d0d0d 100%)',
              border: '1px solid rgba(229,9,20,0.4)',
              position: 'relative', overflow: 'hidden',
              boxShadow: '4px 4px 24px rgba(0,0,0,0.8), 0 0 20px rgba(229,9,20,0.12)',
            }}>
              <div style={{
                position: 'absolute', top: '8px', right: '8px',
                background: '#E50914', color: 'white',
                fontSize: '0.5rem', fontWeight: 800, padding: '2px 5px',
                letterSpacing: '0.05em',
              }}>18+</div>
              {/* Fake film grain texture overlay */}
              <div style={{
                position: 'absolute', inset: 0,
                background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px)',
              }} />
              <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0,
                padding: '24px 8px 10px',
                background: 'linear-gradient(to top, rgba(0,0,0,1), transparent)',
                textAlign: 'center',
              }}>
                <div style={{ fontSize: '0.58rem', color: 'rgba(240,236,228,0.6)', letterSpacing: '0.12em' }}>
                  {FEATURED_FILM.genres[0].toUpperCase()}
                </div>
              </div>
            </div>
            {/* Shadow below poster */}
            <div style={{
              position: 'absolute', bottom: '-8px', left: '10%', right: '10%',
              height: '8px',
              background: 'rgba(229,9,20,0.15)',
              filter: 'blur(8px)',
            }} />
          </div>

          {/* Info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px',
            }}>
              <span style={{
                fontSize: '0.62rem', letterSpacing: '0.25em',
                textTransform: 'uppercase', color: 'var(--red)', fontWeight: 700,
              }}>★ Film des Monats</span>
              <span style={{ width: '32px', height: '1px', background: 'rgba(229,9,20,0.4)' }} />
              {FEATURED_FILM.genres.map(g => (
                <span key={g} style={{
                  fontSize: '0.58rem', padding: '2px 8px',
                  border: '1px solid rgba(255,255,255,0.15)',
                  color: 'var(--grey)', letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                }}>{g}</span>
              ))}
            </div>

            <h1 style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(2.4rem, 4.5vw, 5rem)',
              letterSpacing: '0.03em', lineHeight: 0.92,
              color: 'var(--warm-white)', marginBottom: '14px',
              textShadow: '0 2px 20px rgba(0,0,0,0.5)',
            }}>
              {FEATURED_FILM.title.toUpperCase()}
            </h1>

            <p style={{
              fontSize: '0.88rem', color: 'rgba(240,236,228,0.75)',
              lineHeight: 1.65, marginBottom: '10px', maxWidth: '460px',
              fontFamily: 'var(--font-serif)',
              fontStyle: 'italic',
            }}>
              „{FEATURED_FILM.short_description}"
            </p>

            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              fontSize: '0.73rem', color: 'var(--grey)', marginBottom: '22px',
              letterSpacing: '0.05em',
            }}>
              <span>{FEATURED_FILM.director}</span>
              <span style={{ color: 'var(--red)', fontSize: '0.5rem' }}>●</span>
              <span>{FEATURED_FILM.year}</span>
              <span style={{ color: 'var(--red)', fontSize: '0.5rem' }}>●</span>
              <span>{FEATURED_FILM.country}</span>
              <span style={{ color: 'var(--red)', fontSize: '0.5rem' }}>●</span>
              <span>{FEATURED_FILM.duration_minutes} Min</span>
            </div>

            <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
              <Link href={`/de/films/${FEATURED_FILM.slug}`} className="btn-primary" style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                fontSize: '0.85rem', padding: '12px 28px',
                letterSpacing: '0.1em',
              }}>
                ▶ JETZT ANSEHEN
              </Link>
              <Link href={`/de/films/${FEATURED_FILM.slug}`} style={{
                fontSize: '0.78rem', color: 'rgba(240,236,228,0.5)',
                textDecoration: 'none', letterSpacing: '0.1em',
                borderBottom: '1px solid rgba(240,236,228,0.2)',
                paddingBottom: '2px', transition: 'color 0.2s',
              }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--warm-white)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(240,236,228,0.5)')}
              >
                MEHR INFO
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Genre Filter */}
      <div style={{
        padding: '24px 48px 0',
        display: 'flex', gap: '8px', overflowX: 'auto', scrollbarWidth: 'none',
      }}>
        {ALL_GENRES.map(genre => (
          <button key={genre} onClick={() => setActiveGenre(genre)} style={{
            padding: '8px 20px', flexShrink: 0,
            background: activeGenre === genre ? 'var(--red)' : 'rgba(255,255,255,0.06)',
            border: activeGenre === genre ? 'none' : '1px solid rgba(255,255,255,0.1)',
            color: 'var(--warm-white)', fontSize: '0.82rem',
            letterSpacing: '0.08em', cursor: 'pointer', transition: 'all 0.2s',
          }}>
            {genre}
          </button>
        ))}
      </div>

      {/* Film Categories */}
      <div style={{ padding: '16px 0 64px' }}>
        {filteredCategories.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px', color: 'var(--grey)' }}>
            Keine Filme gefunden für „{search}"
          </div>
        ) : (
          filteredCategories.map(category => (
            <div key={category.title} style={{ marginBottom: '24px' }}>
              <h2 style={{
                fontFamily: 'var(--font-display)', fontSize: '1.4rem',
                letterSpacing: '0.06em', color: 'var(--warm-white)',
                padding: '0 48px', marginBottom: '20px',
              }}>
                {category.title.toUpperCase()}
              </h2>
              <div style={{
                display: 'flex', gap: '16px',
                overflowX: 'auto', padding: '8px 48px',
                scrollbarWidth: 'thin', scrollbarColor: 'var(--red) transparent',
              }}>
                {category.films.map(film => (
                  <FilmCard key={film.id} film={film} />
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}