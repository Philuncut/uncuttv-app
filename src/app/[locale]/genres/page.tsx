import { headers } from 'next/headers'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { enrichFilmsWithWatchState, fetchUserWatchFilmStateMap } from '@/lib/watch-film-cards'
import { FilmRow, type FilmCardData } from '../films/FilmCatalog'

function groupFilmsByGenre(films: FilmCardData[], uncategorizedLabel: string) {
  const byGenre = new Map<string, FilmCardData[]>()
  const uncategorized: FilmCardData[] = []

  for (const film of films) {
    const gs = (film.genres ?? []).filter(Boolean)
    if (gs.length === 0) {
      uncategorized.push(film)
      continue
    }
    for (const g of gs) {
      const list = byGenre.get(g) ?? []
      list.push(film)
      byGenre.set(g, list)
    }
  }

  if (uncategorized.length > 0) {
    byGenre.set(uncategorizedLabel, uncategorized)
  }

  const sortedKeys = [...byGenre.keys()].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }))
  return { byGenre, sortedKeys }
}

function normalizeCountryArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.map(String).map((v) => v.trim()).filter(Boolean)
}

function isFilmAllowedForCountry(
  film: { allowed_in?: unknown; blocked_in?: unknown },
  country: string
): boolean {
  if (!country) return true
  const allowedIn = normalizeCountryArray(film.allowed_in)
  const blockedIn = normalizeCountryArray(film.blocked_in)

  if (allowedIn.length > 0) return allowedIn.includes(country)
  if (blockedIn.length > 0) return !blockedIn.includes(country)
  return true
}

export default async function GenresPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('filmsPage')

  const headersList = await headers()
  const country = headersList.get('x-vercel-ip-country') ?? ''

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const watchMap = user ? await fetchUserWatchFilmStateMap(supabase, user.id) : new Map()

  let query = supabase
    .from('films')
    .select('id, title, slug, poster_url, year, duration_minutes, genres, is_published, blocked_in, allowed_in')
    .eq('is_published', true)

  const { data: rows, error } = await query.order('title')

  if (error) {
    console.error('Genres page fetch error:', error)
    return (
      <main style={{ minHeight: '100vh', background: '#0A0A0A', padding: '48px', color: 'var(--warm-white)' }}>
        <p>Fehler beim Laden der Genres.</p>
      </main>
    )
  }

  const films: FilmCardData[] = enrichFilmsWithWatchState(
    (rows ?? [])
      .filter((row) => isFilmAllowedForCountry(row, country))
      .map((row) => ({
        id: row.id,
        title: row.title ?? '',
        slug: row.slug ?? '',
        poster_url: row.poster_url ?? null,
        year: row.year ?? null,
        duration_minutes: row.duration_minutes ?? null,
        genres: Array.isArray(row.genres) ? row.genres : [],
      })),
    watchMap
  )

  const { byGenre, sortedKeys } = groupFilmsByGenre(films, t('uncategorized'))

  return (
    <main style={{ background: '#0A0A0A', minHeight: '100vh', overflowX: 'hidden' }}>
      <div
        style={{
          paddingTop: 'clamp(88px, 12vw, 108px)',
          paddingBottom: '48px',
          maxWidth: '1400px',
          margin: '0 auto',
          paddingLeft: '24px',
          paddingRight: '24px',
        }}
      >
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(2rem, 4vw, 3rem)',
            letterSpacing: '0.06em',
            color: 'var(--warm-white)',
            marginBottom: 'clamp(28px, 4vw, 40px)',
          }}
        >
          {t('genresBrowseTitle')}
        </h1>
        {sortedKeys.map((key) => {
          const list = byGenre.get(key) ?? []
          return <FilmRow key={key} films={list} title={key} locale={locale} />
        })}
      </div>
    </main>
  )
}
