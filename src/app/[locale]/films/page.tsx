import Link from 'next/link'
import { headers } from 'next/headers'
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
  trailer_playback_id: string | null
  year: number | null
  duration_minutes: number | null
  genres: unknown
}): FilmCardData {
  return {
    id: row.id,
    title: row.title ?? '',
    slug: row.slug ?? '',
    poster_url: row.poster_url ?? null,
    trailer_playback_id: row.trailer_playback_id ?? null,
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
        trailer_playback_id: string | null
        year: number | null
        duration_minutes: number | null
        genres: unknown
        is_published: boolean | null
      }
    | null
    | Array<{
        id: string
        title: string | null
        slug: string | null
        poster_url: string | null
        trailer_playback_id: string | null
        year: number | null
        duration_minutes: number | null
        genres: unknown
        is_published: boolean | null
      }>
}

function watchRowsToContinueCards(rows: ContinueWatchingFilmRow[]): FilmCardData[] {
  const out: FilmCardData[] = []
  for (const row of rows) {
    const raw = row.films
    const f = Array.isArray(raw) ? raw[0] : raw
    if (!f || !f.is_published) continue
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
  'id, title, slug, poster_url, trailer_playback_id, year, duration_minutes, genres, is_published, blocked_in, allowed_in'

function normalizeCountryArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.map(String).map((v) => v.trim()).filter(Boolean)
}

function isFilmAllowedForCountry(film: { allowed_in?: unknown; blocked_in?: unknown }, country: string): boolean {
  if (!country) return true
  const allowedIn = normalizeCountryArray(film.allowed_in)
  const blockedIn = normalizeCountryArray(film.blocked_in)
  if (allowedIn.length > 0) return allowedIn.includes(country)
  if (blockedIn.length > 0) return !blockedIn.includes(country)
  return true
}

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
          trailer_playback_id,
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
      continueFilms = watchRowsToContinueCards(cwRows as ContinueWatchingFilmRow[]).map((c) =>
        applyWatchStateToFilm(c, watchMap.get(c.id))
      )
    }
  }

  // Featured (Movie of the Month)
  let featuredQuery = supabase
    .from('films')
    .select(
      'id, title, slug, poster_url, backdrop_url, short_description, short_description_en, genres, is_published, blocked_in, allowed_in, is_featured'
    )
    .eq('is_published', true)
    .eq('is_featured', true)
    .limit(1)
  const { data: featuredRow } = await featuredQuery.maybeSingle()

  const featuredShortDescription =
    locale === 'en' && String(featuredRow?.short_description_en ?? '').trim()
      ? String(featuredRow?.short_description_en).trim()
      : String(featuredRow?.short_description ?? '').trim()

  const featured = featuredRow
    ? {
        id: featuredRow.id,
        title: featuredRow.title ?? '',
        slug: featuredRow.slug ?? '',
        poster_url: featuredRow.poster_url as string | null,
        backdrop_url: featuredRow.backdrop_url as string | null,
        short_description: featuredShortDescription || null,
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
    .limit(6)

  if (newErr) console.error('Films new row fetch error:', newErr)

  const newFilms: FilmCardData[] = enrichFilmsWithWatchState(
    (newRows ?? [])
      .map((row) => rowToCard(row)),
    watchMap
  )

  // Trending: sum seconds_watched per film_id, top by total watchtime; geo filter; limit 10
  let trendingFilms: FilmCardData[] = []
  try {
    const admin = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    type WtRow = { film_id: string; seconds_watched?: number; watched_seconds?: number }
    let wtRows: WtRow[] | null = null
    let wtErr = null as { message: string } | null
    const wtPrimary = await admin.from('watchtime').select('film_id, seconds_watched')
    if (wtPrimary.error) {
      const wtLegacy = await admin.from('watchtime').select('film_id, watched_seconds')
      wtRows = (wtLegacy.data ?? null) as WtRow[] | null
      wtErr = wtLegacy.error
    } else {
      wtRows = (wtPrimary.data ?? null) as WtRow[] | null
    }

    if (!wtErr && wtRows?.length) {
      const sums = new Map<string, number>()
      for (const row of wtRows) {
        const fid = row.film_id as string
        const sec = Number(
          row.seconds_watched ?? (row as { watched_seconds?: number }).watched_seconds ?? 0
        )
        sums.set(fid, (sums.get(fid) ?? 0) + sec)
      }
      const sortedByWatch = [...sums.entries()].sort((a, b) => b[1] - a[1])
      const candidateIds = sortedByWatch.map(([id]) => id).slice(0, 80)

      if (candidateIds.length) {
        const { data: tr } = await supabase
          .from('films')
          .select(CARD_SELECT)
          .eq('is_published', true)
          .in('id', candidateIds)
        const orderMap = new Map(candidateIds.map((id, i) => [id, i]))
        const allowedRows = (tr ?? [])
          .filter((row) => isFilmAllowedForCountry(row, country))
          .sort((a, b) => (orderMap.get(a.id) ?? 99) - (orderMap.get(b.id) ?? 99))
          .slice(0, 10)
        trendingFilms = enrichFilmsWithWatchState(
          allowedRows.map((row) => rowToCard(row)),
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
            overflow: 'hidden',
          }}
        >
          {/* Blurred poster background */}
          <div
            aria-hidden
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage: `url(${featured.poster_url?.trim() || bgImage})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              filter: 'blur(18px) brightness(0.35)',
              transform: 'scale(1.08)',
            }}
          />
          {/* Left-to-right gradient */}
          <div
            aria-hidden
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: 1,
              pointerEvents: 'none',
              background: 'linear-gradient(to right, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.55) 60%, rgba(0,0,0,0.05) 100%)',
            }}
          />
          {/* Bottom fade */}
          <div
            aria-hidden
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: 1,
              pointerEvents: 'none',
              background: 'linear-gradient(to top, rgba(10,10,10,1.0) 0%, rgba(10,10,10,0.0) 35%)',
            }}
          />
          <div
            style={{
              position: 'relative',
              zIndex: 2,
              paddingTop: 'clamp(88px, 14vw, 120px)',
              paddingBottom: 'clamp(40px, 8vw, 64px)',
              paddingLeft: 'clamp(16px, 4vw, 48px)',
              paddingRight: 'clamp(16px, 4vw, 48px)',
              maxWidth: '1100px',
              margin: '0 auto',
            }}
          >
            {/* Eyebrow */}
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ display: 'inline-block', width: '24px', height: '1px', background: '#d40000', marginRight: '10px' }} />
              <span style={{ fontSize: '0.68rem', letterSpacing: '0.22em', textTransform: 'uppercase', color: '#d40000' }}>
                {locale === 'en' ? 'Movie of the Month' : 'Film des Monats'}
              </span>
            </div>
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
