import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import FilmCatalog, { type FilmCardData } from '../films/FilmCatalog'

export default async function NeuheitenPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  await params
  const headersList = await headers()
  const country = headersList.get('x-vercel-ip-country') ?? ''

  const supabase = await createClient()
  let query = supabase
    .from('films')
    .select('id, title, slug, poster_url, year, duration_minutes, genres, is_published, blocked_in_de, created_at')
    .eq('is_published', true)

  if (country === 'DE') {
    query = query.or('blocked_in_de.eq.false,blocked_in_de.is.null')
  }

  const { data: rows, error } = await query.order('created_at', { ascending: false })

  if (error) {
    return (
      <main style={{ minHeight: '100vh', background: '#0A0A0A', padding: '48px', color: 'var(--warm-white)' }}>
        <p>Fehler beim Laden der Neuheiten.</p>
      </main>
    )
  }

  const films: FilmCardData[] = (rows ?? []).map((row) => ({
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
      <FilmCatalog films={films} title="Neuheiten" subtitle="Zuletzt hinzugefuegte Filme" />
    </main>
  )
}
