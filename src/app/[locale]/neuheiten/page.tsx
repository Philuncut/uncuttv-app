import { headers } from 'next/headers'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import FilmCatalog, { type FilmCardData } from '../films/FilmCatalog'

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

export default async function NeuheitenPage({
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
  let query = supabase
    .from('films')
    .select('id, title, slug, poster_url, year, duration_minutes, genres, is_published, blocked_in, allowed_in, created_at')
    .eq('is_published', true)

  const { data: rows, error } = await query.order('created_at', { ascending: false })

  if (error) {
    console.error('Neuheiten fetch error:', error)
    return (
      <main style={{ minHeight: '100vh', background: '#0A0A0A', padding: '48px', color: 'var(--warm-white)' }}>
        <p>Fehler beim Laden der Neuheiten.</p>
      </main>
    )
  }

  const films: FilmCardData[] = (rows ?? [])
    .filter((row) => isFilmAllowedForCountry(row, country))
    .map((row) => ({
    id: row.id,
    title: row.title ?? '',
    slug: row.slug ?? '',
    poster_url: row.poster_url ?? null,
    year: row.year ?? null,
    duration_minutes: row.duration_minutes ?? null,
    genres: Array.isArray(row.genres) ? row.genres : [],
  }))

  return (
    <main style={{ background: '#0A0A0A', minHeight: '100vh' }}>
      <FilmCatalog films={films} title={t('newReleasesTitle')} showGenreFilter={false} />
    </main>
  )
}
