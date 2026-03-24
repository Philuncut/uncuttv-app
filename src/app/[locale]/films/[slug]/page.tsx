import type { CSSProperties } from 'react'
import { createClient } from '@/lib/supabase/server'
import { userHasVoucherForFilm } from '@/lib/vouchers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import FilmPlayer from './FilmPlayer'

const ACTIVE_STATUSES = ['active', 'trialing']

function joinCast(value: unknown): string {
  if (value == null) return ''
  if (Array.isArray(value)) return value.map(String).filter(Boolean).join(', ')
  if (typeof value === 'string') return value.trim()
  return ''
}

function joinGenres(genres: unknown): string {
  if (genres == null) return ''
  if (Array.isArray(genres)) return genres.map(String).filter(Boolean).join(', ')
  return String(genres)
}

export default async function FilmSlugPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}) {
  const { locale, slug } = await params
  setRequestLocale(locale)
  const t = await getTranslations('filmDetail')

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
      'id, title, original_title, slug, mux_playback_id, poster_url, backdrop_url, description, short_description, director, film_cast, country, year, duration_minutes, genres, language'
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

  const hasBackdrop = Boolean(film.backdrop_url && String(film.backdrop_url).trim())
  const castStr = joinCast(film.film_cast)
  const genresStr = joinGenres(film.genres)
  const showOriginalTitle =
    film.original_title &&
    String(film.original_title).trim() &&
    String(film.original_title).trim() !== film.title

  const linkStyle: CSSProperties = {
    fontSize: '0.82rem',
    color: hasBackdrop ? 'rgba(255,255,255,0.75)' : 'var(--grey)',
    textDecoration: 'none',
    letterSpacing: '0.06em',
    marginBottom: '20px',
    display: 'inline-block',
  }

  const metaItems: { label: string; value: string }[] = []
  if (film.director) metaItems.push({ label: t('director'), value: String(film.director) })
  if (castStr) metaItems.push({ label: t('cast'), value: castStr })
  if (film.country) metaItems.push({ label: t('country'), value: String(film.country) })
  if (film.year != null) metaItems.push({ label: t('year'), value: String(film.year) })
  if (film.duration_minutes != null) {
    metaItems.push({
      label: t('duration'),
      value: t('durationMinutes', { minutes: Number(film.duration_minutes) }),
    })
  }
  if (film.language) metaItems.push({ label: t('language'), value: String(film.language) })
  if (genresStr) metaItems.push({ label: t('genres'), value: genresStr })

  const contentBlock = (
    <>
      {film.short_description && String(film.short_description).trim() ? (
        <p
          style={{
            fontSize: 'clamp(1rem, 2.5vw, 1.15rem)',
            color: 'var(--grey)',
            lineHeight: 1.5,
            margin: '0 0 16px',
            fontStyle: 'italic',
          }}
        >
          {String(film.short_description).trim()}
        </p>
      ) : null}
      {film.description && String(film.description).trim() ? (
        <div style={{ marginBottom: '28px' }}>
          <h2
            style={{
              fontSize: '0.72rem',
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'var(--grey)',
              margin: '0 0 10px',
            }}
          >
            {t('descriptionHeading')}
          </h2>
          <p
            style={{
              margin: 0,
              color: 'var(--warm-white)',
              whiteSpace: 'pre-wrap',
              lineHeight: 1.75,
              fontSize: '0.95rem',
            }}
          >
            {String(film.description).trim()}
          </p>
        </div>
      ) : null}
      {metaItems.length > 0 ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 160px), 1fr))',
            gap: '18px',
          }}
        >
          {metaItems.map((item) => (
            <div key={item.label} style={{ minWidth: 0 }}>
              <div
                style={{
                  fontSize: '0.68rem',
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: 'var(--grey)',
                  marginBottom: '6px',
                }}
              >
                {item.label}
              </div>
              <div
                style={{
                  color: 'var(--warm-white)',
                  fontSize: '0.9rem',
                  lineHeight: 1.45,
                  wordBreak: 'break-word',
                }}
              >
                {item.value}
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </>
  )

  return (
    <main
      style={{
        minHeight: '100vh',
        background: 'var(--black)',
        paddingBottom: '48px',
      }}
    >
      {hasBackdrop ? (
        <section
          style={{
            position: 'relative',
            minHeight: 'min(72vh, 820px)',
            width: '100%',
          }}
        >
          <div
            aria-hidden
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage: `url(${film.backdrop_url})`,
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
                'linear-gradient(to top, rgba(10,10,10,0.97) 0%, rgba(10,10,10,0.55) 42%, rgba(10,10,10,0.25) 100%)',
            }}
          />
          <div
            style={{
              position: 'relative',
              zIndex: 1,
              paddingTop: 'clamp(88px, 14vw, 120px)',
              paddingBottom: 'clamp(32px, 6vw, 56px)',
              paddingLeft: 'clamp(16px, 4vw, 48px)',
              paddingRight: 'clamp(16px, 4vw, 48px)',
              maxWidth: '1100px',
              margin: '0 auto',
            }}
          >
            <Link href={`/${locale}/films`} style={linkStyle}>
              ← {t('backToFilms')}
            </Link>
            <h1
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(1.75rem, 5vw, 2.75rem)',
                letterSpacing: '0.04em',
                color: 'var(--warm-white)',
                margin: '0 0 8px',
                lineHeight: 1.15,
              }}
            >
              {film.title}
            </h1>
            {showOriginalTitle ? (
              <p
                style={{
                  fontSize: '0.95rem',
                  color: 'rgba(255,255,255,0.65)',
                  margin: '0 0 12px',
                }}
              >
                {t('originalTitle')}: {String(film.original_title).trim()}
              </p>
            ) : null}
            {hasVoucher && !hasSubscription ? (
              <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.7)', marginBottom: '12px' }}>
                {t('voucherAccess')}
              </p>
            ) : null}
            <FilmPlayer
              playbackId={film.mux_playback_id}
              filmId={film.id}
              title={film.title}
              variant="hero"
              playLabel={t('play')}
              loadingLabel={t('playerLoading')}
            />
          </div>
        </section>
      ) : (
        <div
          style={{
            paddingTop: 'clamp(88px, 12vw, 108px)',
            paddingLeft: 'clamp(16px, 4vw, 48px)',
            paddingRight: 'clamp(16px, 4vw, 48px)',
            maxWidth: '1100px',
            margin: '0 auto',
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr',
              gap: '28px',
              alignItems: 'start',
            }}
            className="film-detail-no-backdrop-grid"
          >
            <style
              dangerouslySetInnerHTML={{
                __html: `
              @media (min-width: 900px) {
                .film-detail-no-backdrop-grid { grid-template-columns: minmax(0, 1fr) minmax(200px, 280px) !important; }
              }
            `,
              }}
            />
            <div style={{ minWidth: 0 }}>
              <Link href={`/${locale}/films`} style={{ ...linkStyle, color: 'var(--grey)' }}>
                ← {t('backToFilms')}
              </Link>
              <h1
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'clamp(1.6rem, 4vw, 2.25rem)',
                  letterSpacing: '0.04em',
                  color: 'var(--warm-white)',
                  margin: '0 0 8px',
                  lineHeight: 1.2,
                }}
              >
                {film.title}
              </h1>
              {showOriginalTitle ? (
                <p style={{ fontSize: '0.92rem', color: 'var(--grey)', margin: '0 0 12px' }}>
                  {t('originalTitle')}: {String(film.original_title).trim()}
                </p>
              ) : null}
              {hasVoucher && !hasSubscription ? (
                <p style={{ fontSize: '0.82rem', color: 'var(--grey)', marginBottom: '12px' }}>
                  {t('voucherAccess')}
                </p>
              ) : null}
              <FilmPlayer
                playbackId={film.mux_playback_id}
                filmId={film.id}
                title={film.title}
                playLabel={t('play')}
                loadingLabel={t('playerLoading')}
              />
            </div>
            {film.poster_url ? (
              <div
                style={{
                  width: '100%',
                  maxWidth: '280px',
                  margin: '0 auto',
                  borderRadius: '10px',
                  overflow: 'hidden',
                  boxShadow: '0 16px 48px rgba(0,0,0,0.45)',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
              >
                <img
                  src={film.poster_url}
                  alt={film.title}
                  style={{ width: '100%', height: 'auto', display: 'block' }}
                />
              </div>
            ) : null}
          </div>
        </div>
      )}

      <div
        style={{
          maxWidth: '1100px',
          margin: '0 auto',
          padding: 'clamp(24px, 4vw, 40px) clamp(16px, 4vw, 48px) 0',
        }}
      >
        {contentBlock}
      </div>
    </main>
  )
}
