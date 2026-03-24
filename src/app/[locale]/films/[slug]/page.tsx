import { createClient } from '@/lib/supabase/server'
import { userHasVoucherForFilm } from '@/lib/vouchers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import FilmPlayer from './FilmPlayer'

const ACTIVE_STATUSES = ['active', 'trialing']

export default async function FilmSlugPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}) {
  const { locale, slug } = await params
  const supabase = await createClient()
  const t = await getTranslations('film')

  const { data: { user } } = await supabase.auth.getUser()
  console.log('[FilmSlugPage] user.id:', user?.id, 'user.email:', user?.email)

  if (!user) {
    console.log('[FilmSlugPage] redirect → login')
    redirect(`/${locale}/auth/login?redirect=/${locale}/films/${slug}`)
  }

  const { data: film, error: filmError } = await supabase
    .from('films')
    .select('id, title, slug, mux_playback_id, poster_url, description, director, film_cast, production_year, country, genres, age_rating, blocked_in')
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

  const metaLabel: React.CSSProperties = {
    fontSize: '0.72rem',
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    color: 'var(--grey)',
    marginBottom: '2px',
  }
  const metaValue: React.CSSProperties = {
    fontSize: '0.92rem',
    color: 'var(--warm-white)',
  }

  const metaItems = [
    film.director     && { label: t('director'),   value: film.director },
    film.production_year && { label: t('year'),    value: String(film.production_year) },
    film.country      && { label: t('country'),    value: film.country },
    film.genres?.length && { label: t('genres'),   value: (film.genres as string[]).join(', ') },
    film.age_rating   && { label: t('ageRating'),  value: film.age_rating },
    film.film_cast?.length && { label: t('cast'),  value: (film.film_cast as string[]).join(', ') },
    film.blocked_in?.length && { label: t('blockedIn'), value: (film.blocked_in as string[]).join(', ') },
  ].filter(Boolean) as { label: string; value: string }[]

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
          ← {t('backToFilms')}
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
            {t('voucherAccess')}
          </p>
        )}

        <FilmPlayer
          playbackId={film.mux_playback_id}
          filmId={film.id}
          title={film.title}
        />

        {/* Film metadata */}
        <div style={{ marginTop: '40px' }}>

          {film.description && (
            <p style={{
              fontSize: '0.97rem',
              color: 'var(--warm-white)',
              lineHeight: '1.7',
              maxWidth: '680px',
              marginBottom: '32px',
            }}>
              {film.description}
            </p>
          )}

          {metaItems.length > 0 && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
              gap: '20px 32px',
              borderTop: '1px solid rgba(255,255,255,0.07)',
              paddingTop: '24px',
            }}>
              {metaItems.map(({ label, value }) => (
                <div key={label}>
                  <div style={metaLabel}>{label}</div>
                  <div style={metaValue}>{value}</div>
                </div>
              ))}
            </div>
          )}

        </div>

      </div>
    </main>
  )
}
