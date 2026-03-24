import { createClient } from '@/lib/supabase/server'
import { userHasVoucherForFilm } from '@/lib/vouchers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import FilmPlayer from './FilmPlayer'

const ACTIVE_STATUSES = ['active', 'trialing']

export default async function FilmSlugPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}) {
  const { locale, slug } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  console.log('[FilmSlugPage] user.id:', user?.id, 'user.email:', user?.email)

  if (!user) {
    console.log('[FilmSlugPage] redirect → login')
    redirect(`/${locale}/auth/login?redirect=/${locale}/films/${slug}`)
  }

  const { data: film, error: filmError } = await supabase
    .from('films')
    .select(
      'id, title, slug, mux_playback_id, poster_url, description, director, country, year'
    )
    .eq('slug', slug)
    .eq('is_published', true)
    .maybeSingle()

  console.log('[FilmSlugPage] slug:', JSON.stringify(slug))
  console.log('[FilmSlugPage] filmError:', JSON.stringify(filmError))
  console.log('[FilmSlugPage] film:', JSON.stringify(film))

  if (filmError || !film) {
    console.log('[FilmSlugPage] redirect → films (film not found, slug:', slug, 'error:', filmError?.message, ')')
    redirect(`/${locale}/films`)
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_status')
    .eq('id', user.id)
    .single()

  console.log('[FilmSlugPage] profile.subscription_status:', profile?.subscription_status)
  const hasSubscription = profile && ACTIVE_STATUSES.includes(profile.subscription_status)
  const hasVoucher = await userHasVoucherForFilm(user.id, film.id)

  if (!hasSubscription && !hasVoucher) {
    console.log('[FilmSlugPage] redirect → subscribe (hasSubscription:', hasSubscription, 'hasVoucher:', hasVoucher, ')')
    redirect(`/${locale}/subscribe`)
  }

  const metaLabels =
    locale === 'de'
      ? {
          description: 'Beschreibung',
          director: 'Regie',
          country: 'Land',
          year: 'Jahr',
        }
      : {
          description: 'Description',
          director: 'Director',
          country: 'Country',
          year: 'Year',
        }

  return (
    <main style={{
      minHeight: '100vh',
      background: 'var(--black)',
      padding: '24px 24px 48px',
      paddingTop: '100px',
    }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <Link
          href={`/${locale}/films`}
          style={{
            fontSize: '0.82rem',
            color: 'var(--grey)',
            textDecoration: 'none',
            letterSpacing: '0.06em',
            marginBottom: '24px',
            display: 'inline-block',
          }}
        >
          ← Zurück zu Filmen
        </Link>
        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: '2rem',
          letterSpacing: '0.04em',
          color: 'var(--warm-white)',
          marginBottom: '8px',
        }}>
          {film.title}
        </h1>
        {hasVoucher && !hasSubscription && (
          <p style={{ fontSize: '0.82rem', color: 'var(--grey)', marginBottom: '8px' }}>
            Zugang per Gutschein
          </p>
        )}
        <FilmPlayer
          playbackId={film.mux_playback_id}
          filmId={film.id}
          title={film.title}
        />
        <div style={{ marginTop: '28px', color: 'var(--grey)', fontSize: '0.9rem', lineHeight: 1.6 }}>
          {film.description && (
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '0.72rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--grey)', marginBottom: '6px' }}>
                {metaLabels.description}
              </div>
              <p style={{ margin: 0, color: 'var(--warm-white)', whiteSpace: 'pre-wrap' }}>
                {film.description}
              </p>
            </div>
          )}
          {(film.director || film.country || film.year != null) && (
            <dl style={{ margin: 0, display: 'grid', gap: '10px' }}>
              {film.director ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(80px, 120px) 1fr', gap: '12px', alignItems: 'start' }}>
                  <dt style={{ margin: 0, fontSize: '0.72rem', letterSpacing: '0.12em', textTransform: 'uppercase' }}>{metaLabels.director}</dt>
                  <dd style={{ margin: 0, color: 'var(--warm-white)' }}>{film.director}</dd>
                </div>
              ) : null}
              {film.country ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(80px, 120px) 1fr', gap: '12px', alignItems: 'start' }}>
                  <dt style={{ margin: 0, fontSize: '0.72rem', letterSpacing: '0.12em', textTransform: 'uppercase' }}>{metaLabels.country}</dt>
                  <dd style={{ margin: 0, color: 'var(--warm-white)' }}>{film.country}</dd>
                </div>
              ) : null}
              {film.year != null ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(80px, 120px) 1fr', gap: '12px', alignItems: 'start' }}>
                  <dt style={{ margin: 0, fontSize: '0.72rem', letterSpacing: '0.12em', textTransform: 'uppercase' }}>{metaLabels.year}</dt>
                  <dd style={{ margin: 0, color: 'var(--warm-white)' }}>{film.year}</dd>
                </div>
              ) : null}
            </dl>
          )}
        </div>
      </div>
    </main>
  )
}
