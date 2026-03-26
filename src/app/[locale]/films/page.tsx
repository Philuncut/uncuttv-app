import { headers } from 'next/headers'
import Link from 'next/link'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import {
  applyWatchStateToFilm,
  enrichFilmsWithWatchState,
  fetchUserWatchFilmStateMap,
  type UserWatchFilmState,
} from '@/lib/watch-film-cards'
import FilmCatalog, { FilmRow, type FilmCardData } from './FilmCatalog'

function rowToCard(row: {
  id: string
  title: string | null
  slug: string | null
  poster_url: string | null
  year: number | null
  duration_minutes: number | null
  genres: unknown
}): FilmCardData {
  return {
    id: row.id,
    title: row.title ?? '',
    slug: row.slug ?? '',
    poster_url: row.poster_url ?? null,
    year: row.year ?? null,
    duration_minutes: row.duration_minutes ?? null,
    genres: Array.isArray(row.genres) ? row.genres : [],
  }
}

type ContinueWatchingFilmRow = {
  last_position: number | null
  completed?: boolean | null
  films:
    | {
        id: string
        title: string | null
        slug: string | null
        poster_url: string | null
        year: number | null
        duration_minutes: number | null
        genres: unknown
        is_published: boolean | null
        blocked_in?: unknown
        allowed_in?: unknown
      }
    | null
    | Array<{
        id: string
        title: string | null
        slug: string | null
        poster_url: string | null
        year: number | null
        duration_minutes: number | null
        genres: unknown
        is_published: boolean | null
        blocked_in?: unknown
        allowed_in?: unknown
      }>
}

function normalizeCountryArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.map(String).map((v) => v.trim()).filter(Boolean)
}

function isFilmAllowedForCountry(film: { allowed_in?: unknown; blocked_in?: unknown }, country: string): boolean {
  if (!country) return true

  const allowedIn = normalizeCountryArray(film.allowed_in)
  const blockedIn = normalizeCountryArray(film.blocked_in)

  // New logic:
  // - If allowed_in is not empty AND country is NOT in allowed_in → block
  // - If allowed_in is empty → fall back to blocked_in logic (country in blocked_in → block)
  // - If both are empty → allow
  if (allowedIn.length > 0) return allowedIn.includes(country)
  if (blockedIn.length > 0) return !blockedIn.includes(country)
  return true
}

function watchRowsToContinueCards(rows: ContinueWatchingFilmRow[], country: string): FilmCardData[] {
  const out: FilmCardData[] = []
  for (const row of rows) {
    const raw = row.films
    const f = Array.isArray(raw) ? raw[0] : raw
    if (!f || !f.is_published) continue
    if (!isFilmAllowedForCountry(f, country)) continue
    const card = rowToCard(f)
    const dm = f.duration_minutes
    const totalSeconds = typeof dm === 'number' && dm > 0 ? dm * 60 : 0
    const lp = row.last_position ?? 0
    const completed = Boolean(row.completed)
    const ratio = totalSeconds > 0 ? lp / totalSeconds : 0
    card.alreadyWatched = completed || (totalSeconds > 0 && ratio >= 0.85)
    card.watchCompleted = completed
    if (card.watchCompleted) {
      card.progressPercent = 100
    } else if (totalSeconds > 0 && lp >= 0) {
      card.progressPercent = Math.min(100, Math.max(0, ratio * 100))
    }
    out.push(card)
    if (out.length >= 6) break
  }
  return out
}

const CARD_SELECT =
  'id, title, slug, poster_url, year, duration_minutes, genres, is_published, blocked_in, allowed_in'

export default async function FilmsPage({
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

  const watchMap: Map<string, UserWatchFilmState> = user
    ? await fetchUserWatchFilmStateMap(supabase, user.id)
    : new Map()

  let continueFilms: FilmCardData[] = []
  if (user) {
    const continueSelect = `
        last_position,
        completed,
        updated_at,
        films (
          id,
          title,
          slug,
          poster_url,
          year,
          duration_minutes,
          genres,
          is_published,
          blocked_in,
          allowed_in
        )
      `
    const continueBase = () =>
      supabase
        .from('watchtime')
        .select(continueSelect)
        .eq('user_id', user.id)
        .eq('completed', false)
        .order('updated_at', { ascending: false })
        .limit(24)

    let { data: cwRows, error: cwErr } = await continueBase().gt('seconds_watched', 0)
    if (cwErr) {
      const legacy = await continueBase().gt('watched_seconds', 0)
      cwRows = legacy.data
      cwErr = legacy.error
    }
    if (cwErr) {
      console.error('Continue watching fetch error:', cwErr)
    } else if (cwRows?.length) {
      continueFilms = watchRowsToContinueCards(cwRows as ContinueWatchingFilmRow[], country).map((c) =>
        applyWatchStateToFilm(c, watchMap.get(c.id))
      )
    }
  }

  // Featured (Movie of the Month)
  let featuredQuery = supabase
    .from('films')
    .select(
      'id, title, slug, poster_url, backdrop_url, short_description, genres, is_published, blocked_in, allowed_in, is_featured'
    )
    .eq('is_published', true)
    .eq('is_featured', true)
    .limit(1)
  const { data: featuredRow } = await featuredQuery.maybeSingle()

  const featured =
    featuredRow && isFilmAllowedForCountry(featuredRow, country)
      ? {
          id: featuredRow.id,
          title: featuredRow.title ?? '',
          slug: featuredRow.slug ?? '',
          poster_url: featuredRow.poster_url as string | null,
          backdrop_url: featuredRow.backdrop_url as string | null,
          short_description: featuredRow.short_description as string | null,
          genres: Array.isArray(featuredRow.genres) ? featuredRow.genres : [],
        }
      : null

  // New (last 6 by created_at)
  let newQuery = supabase
    .from('films')
    .select(`${CARD_SELECT}, created_at`)
    .eq('is_published', true)
  const { data: newRows, error: newErr } = await newQuery
    .order('created_at', { ascending: false })
    .limit(country ? 30 : 6)

  if (newErr) console.error('Films new row fetch error:', newErr)

  const newFilms: FilmCardData[] = enrichFilmsWithWatchState(
    (newRows ?? [])
      .filter((row) => isFilmAllowedForCountry(row, country))
      .slice(0, 6)
      .map((row) => rowToCard(row)),
    watchMap
  )

  // Trending: sum watchtime per film
  let trendingFilms: FilmCardData[] = []
  try {
    const admin = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    const { data: wtRows, error: wtErr } = await admin
      .from('watchtime')
      .select('film_id, watched_seconds')

    if (!wtErr && wtRows?.length) {
      const sums = new Map<string, number>()
      for (const row of wtRows) {
        const fid = row.film_id as string
        const sec = Number((row as { watched_seconds?: number }).watched_seconds ?? 0)
        sums.set(fid, (sums.get(fid) ?? 0) + sec)
      }
      const topIds = [...sums.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, country ? 18 : 6)
        .map(([id]) => id)

      if (topIds.length) {
        const { data: tr } = await supabase
          .from('films')
          .select(CARD_SELECT)
          .eq('is_published', true)
          .in('id', topIds)
        const orderMap = new Map(topIds.map((id, i) => [id, i]))
        trendingFilms = enrichFilmsWithWatchState(
          (tr ?? [])
            .filter((row) => isFilmAllowedForCountry(row, country))
            .sort((a, b) => (orderMap.get(a.id) ?? 99) - (orderMap.get(b.id) ?? 99))
            .map((row) => rowToCard(row)),
          watchMap
        )
      }
    }
  } catch (e) {
    console.error('Trending watchtime error:', e)
  }

  // All films (catalog grid)
  let allQuery = supabase.from('films').select(CARD_SELECT).eq('is_published', true)
  const { data: rows, error } = await allQuery.order('title')

  if (error) {
    console.error('Films fetch error:', error)
    return (
      <main style={{ minHeight: '100vh', background: '#0A0A0A', padding: '48px', color: 'var(--warm-white)' }}>
        <p>Fehler beim Laden der Filme.</p>
      </main>
    )
  }

  const allFilms: FilmCardData[] = enrichFilmsWithWatchState(
    (rows ?? [])
      .filter((row) => isFilmAllowedForCountry(row, country))
      .map((row) => rowToCard(row)),
    watchMap
  )

  const bgImage =
    featured && (featured.backdrop_url?.trim() || featured.poster_url?.trim())
      ? featured.backdrop_url?.trim() || featured.poster_url
      : null

  return (
    <main style={{ background: '#0A0A0A', minHeight: '100vh', overflowX: 'hidden' }}>
      {featured && bgImage ? (
        <section
          style={{
            position: 'relative',
            minHeight: 'min(56vh, 560px)',
            width: '100%',
          }}
        >
          <div
            aria-hidden
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage: `url(${bgImage})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
          <div
            aria-hidden
            style={{
              position: 'absolute',
              inset: 0,
              background:
                'linear-gradient(to top, #0A0A0A 0%, rgba(10,10,10,0.88) 38%, rgba(10,10,10,0.35) 100%)',
            }}
          />
          <div
            style={{
              position: 'relative',
              zIndex: 1,
              paddingTop: 'clamp(88px, 14vw, 120px)',
              paddingBottom: 'clamp(40px, 8vw, 64px)',
              paddingLeft: 'clamp(16px, 4vw, 48px)',
              paddingRight: 'clamp(16px, 4vw, 48px)',
              maxWidth: '1100px',
              margin: '0 auto',
            }}
          >
            <h1
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(1.75rem, 5vw, 2.75rem)',
                letterSpacing: '0.04em',
                color: 'var(--warm-white)',
                margin: '0 0 12px',
                lineHeight: 1.15,
                maxWidth: '720px',
              }}
            >
              {featured.title}
            </h1>
            {featured.short_description && String(featured.short_description).trim() ? (
              <p
                style={{
                  fontSize: 'clamp(0.95rem, 2vw, 1.1rem)',
                  color: 'rgba(255,255,255,0.82)',
                  lineHeight: 1.55,
                  margin: '0 0 14px',
                  maxWidth: '640px',
                }}
              >
                {String(featured.short_description).trim()}
              </p>
            ) : null}
            {featured.genres.length > 0 ? (
              <p
                style={{
                  fontSize: '0.78rem',
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: 'rgba(255,255,255,0.55)',
                  margin: '0 0 24px',
                }}
              >
                {featured.genres.join(' · ')}
              </p>
            ) : (
              <div style={{ marginBottom: '24px' }} />
            )}
            <Link
              href={`/${locale}/films/${featured.slug}`}
              className="btn-primary"
              style={{
                display: 'inline-block',
                padding: '16px 36px',
                fontSize: '0.95rem',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                textDecoration: 'none',
              }}
            >
              {t('featuredWatchNow')}
            </Link>
          </div>
        </section>
      ) : null}

      <div
        style={{
          maxWidth: '1400px',
          margin: '0 auto',
          padding: '0 24px',
          paddingTop: featured && bgImage ? 'clamp(24px, 5vw, 40px)' : 'clamp(88px, 12vw, 108px)',
          paddingBottom: '8px',
        }}
      >
        {continueFilms.length > 0 ? (
          <FilmRow films={continueFilms} title={t('sectionContinueWatching')} locale={locale} />
        ) : null}
        <FilmRow films={newFilms} title={t('sectionNew')} locale={locale} />
        <FilmRow films={trendingFilms} title={t('sectionTrending')} locale={locale} />
      </div>

      <FilmCatalog films={allFilms} title={t('sectionAll')} topPadding={0} />
    </main>
  )
}
