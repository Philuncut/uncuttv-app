import { getTranslations, setRequestLocale } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { enrichFilmsWithWatchState, fetchUserWatchFilmStateMap } from '@/lib/watch-film-cards'
import FilmCatalog, { type FilmCardData } from '../films/FilmCatalog'

export default async function NeuheitenPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('filmsPage')

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const watchMap = user ? await fetchUserWatchFilmStateMap(supabase, user.id) : new Map()

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

  const films: FilmCardData[] = enrichFilmsWithWatchState(
    (rows ?? [])
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

  return (
    <main style={{ background: '#0A0A0A', minHeight: '100vh' }}>
      <FilmCatalog films={films} title={t('newReleasesTitle')} showGenreFilter={false} />
    </main>
  )
}
