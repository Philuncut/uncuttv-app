import type { CSSProperties } from 'react'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { userHasVoucherForFilm } from '@/lib/vouchers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import FilmPlayer from './FilmPlayer'
import FilmHero from './FilmHero'

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

  // New logic:
  // - If allowed_in is not empty AND country is NOT in allowed_in → block
  // - If allowed_in is empty → fall back to blocked_in logic (country in blocked_in → block)
  // - If both are empty → allow
  if (allowedIn.length > 0) return allowedIn.includes(country)
  if (blockedIn.length > 0) return !blockedIn.includes(country)
  return true
}

function joinCast(value: unknown): string {
  if (value == null) return ''
  if (Array.isArray(value)) return value.map(String).filter(Boolean).join(', ')
  if (typeof value === 'string') return value.trim()
  return ''
}


export default async function FilmSlugPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}) {
  const { locale, slug } = await params
  setRequestLocale(locale)
  const t = await getTranslations('filmDetail')

  const headersList = await headers()
  const country = headersList.get('x-vercel-ip-country') ?? ''

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
      'id, title, original_title, slug, mux_playback_id, trailer_playback_id, poster_url, backdrop_url, description, description_en, short_description, short_description_en, director, film_cast, country, year, duration_minutes, genres, language, original_language, subtitle_languages, allowed_in, blocked_in'
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

  const isGeoBlocked = Boolean(
    country && !isFilmAllowedForCountry(film as { allowed_in?: unknown; blocked_in?: unknown }, country)
  )
  const geoBlockedMessage = locale === 'de' ? 'In Ihrem Land nicht verfügbar' : 'Not available in your country'

  const { data: activeSubscriptions } = await supabase
    .from('subscriptions')
    .select('id')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .limit(1)

  const hasSubscription = Boolean(activeSubscriptions && activeSubscriptions.length > 0)
  const hasVoucher = await userHasVoucherForFilm(user.id, film.id)

  if (!hasSubscription && !hasVoucher) {
    console.log('[FilmSlugPage] redirect → subscribe (hasSubscription:', hasSubscription, 'hasVoucher:', hasVoucher, ')')
    redirect(`/${locale}/subscribe`)
  }

  // Fetch last watch position for resume
  const { data: watchtimeRow } = await supabase
    .from('watchtime')
    .select('last_position, completed')
    .eq('user_id', user.id)
    .eq('film_id', film.id)
    .maybeSingle()

  const startTime = watchtimeRow && !watchtimeRow.completed
    ? Math.max(0, Number(watchtimeRow.last_position) || 0)
    : 0

  const hasBackdrop = Boolean(film.backdrop_url && String(film.backdrop_url).trim())
  const hasTrailer = Boolean(film.trailer_playback_id && String(film.trailer_playback_id).trim())
  const localizedShortDescription =
    locale === 'en' && String(film.short_description_en ?? '').trim()
      ? String(film.short_description_en).trim()
      : String(film.short_description ?? '').trim()
  const localizedDescription =
    locale === 'en' && String(film.description_en ?? '').trim()
      ? String(film.description_en).trim()
      : String(film.description ?? '').trim()
  const castStr = joinCast(film.film_cast)
  const showOriginalTitle =
    film.original_title &&
    String(film.original_title).trim() &&
    String(film.original_title).trim() !== film.title

  const linkStyle: CSSProperties = {
    fontSize: '0.82rem',
    color: (hasBackdrop || hasTrailer) ? 'rgba(255,255,255,0.75)' : 'var(--grey)',
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
  const subLangs = Array.isArray(film.subtitle_languages) ? film.subtitle_languages : []
  if (subLangs.length > 0) {
    const subLabel = locale === 'de' ? 'Untertitel' : 'Subtitles'
    const subValue = subLangs.map((code: string) => {
      if (code === 'de') return 'Deutsch'
      if (code === 'en') return 'English'
      if (code === 'fr') return 'Français'
      if (code === 'es') return 'Español'
      if (code === 'it') return 'Italiano'
      return code.toUpperCase()
    }).join(', ')
    metaItems.push({ label: subLabel, value: subValue })
  }
  const genreList: string[] = Array.isArray(film.genres) ? film.genres.filter(Boolean) : []

  const contentBlock = (
    <>
      {localizedShortDescription ? (
        <p
          style={{
            fontSize: '1.1rem',
            color: 'rgba(255,255,255,0.55)',
            lineHeight: 1.5,
            margin: '0 0 16px',
            fontStyle: 'italic',
          }}
        >
          {localizedShortDescription}
        </p>
      ) : null}
      {localizedDescription ? (
        <div style={{ marginBottom: '28px' }}>
          <h2
            style={{
              fontSize: '0.72rem',
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: '#d40000',
              margin: '0 0 10px',
            }}
          >
            {t('descriptionHeading')}
          </h2>
          <p
            style={{
              margin: 0,
              color: 'rgba(255,255,255,0.85)',
              whiteSpace: 'pre-wrap',
              lineHeight: 1.85,
              fontSize: '1rem',
            }}
          >
            {localizedDescription}
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
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color: '#d40000',
                  marginBottom: '6px',
                }}
              >
                {item.label}
              </div>
              <div
                className={item.label === t('language') ? 'whitespace-pre-line' : undefined}
                style={{
                  color: 'rgba(255,255,255,0.9)',
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
      {genreList.length > 0 ? (
        <div style={{ marginTop: '24px' }}>
          <div
            style={{
              fontSize: '0.68rem',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'var(--grey)',
              marginBottom: '8px',
            }}
          >
            {t('genres')}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {genreList.map((g) => (
              <span
                key={g}
                style={{
                  background: 'rgba(212,0,0,0.15)',
                  border: '1px solid rgba(212,0,0,0.4)',
                  color: '#d40000',
                  fontSize: '0.75rem',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  padding: '3px 10px',
                  borderRadius: '2px',
                }}
              >
                {g}
              </span>
            ))}
          </div>
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
                'linear-gradient(to top, rgba(10,10,10,1) 0%, rgba(10,10,10,0.55) 42%, rgba(10,10,10,0.25) 100%)',
            }}
          />
          <div
            style={{
              position: 'relative',
              zIndex: 1,
              paddingTop: 'clamp(88px, 14vw, 120px)',
              paddingBottom: 0,
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
            {isGeoBlocked ? (
              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  aspectRatio: '16 / 9',
                  borderRadius: '10px',
                  overflow: 'hidden',
                  border: '1px solid rgba(255,255,255,0.1)',
                  background: '#0A0A0A',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                  color: 'var(--warm-white)',
                  fontSize: '0.95rem',
                  letterSpacing: '0.04em',
                  padding: '24px',
                }}
              >
                {geoBlockedMessage}
              </div>
            ) : (
              <FilmPlayer
                playbackId={film.mux_playback_id}
                filmId={film.id}
                title={film.title}
                locale={locale}
                durationMinutes={film.duration_minutes}
                originalLanguage={film.original_language ?? ''}
                subtitleLanguages={film.subtitle_languages ?? []}
                startTime={startTime}
                variant="hero"
                playLabel={t('play')}
                loadingLabel={t('playerLoading')}
              />
            )}
          </div>
        </section>
      ) : hasTrailer ? (
        <FilmHero
          trailerPlaybackId={String(film.trailer_playback_id)}
          filmPlayer={{
            playbackId: film.mux_playback_id,
            filmId: film.id,
            title: film.title,
            locale,
            durationMinutes: film.duration_minutes,
            originalLanguage: film.original_language ?? '',
            subtitleLanguages: film.subtitle_languages ?? [],
            startTime,
            playLabel: t('play'),
            loadingLabel: t('playerLoading'),
          }}
          isGeoBlocked={isGeoBlocked}
          geoBlockedContent={
            <div
              style={{
                position: 'relative',
                width: '100%',
                aspectRatio: '16 / 9',
                borderRadius: '10px',
                overflow: 'hidden',
                border: '1px solid rgba(255,255,255,0.1)',
                background: '#0A0A0A',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                color: 'var(--warm-white)',
                fontSize: '0.95rem',
                letterSpacing: '0.04em',
                padding: '24px',
              }}
            >
              {geoBlockedMessage}
            </div>
          }
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
        </FilmHero>
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
              {isGeoBlocked ? (
                <div
                  style={{
                    position: 'relative',
                    width: '100%',
                    aspectRatio: '16 / 9',
                    borderRadius: '10px',
                    overflow: 'hidden',
                    border: '1px solid rgba(255,255,255,0.1)',
                    background: '#0A0A0A',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textAlign: 'center',
                    color: 'var(--warm-white)',
                    fontSize: '0.95rem',
                    letterSpacing: '0.04em',
                    padding: '24px',
                  }}
                >
                  {geoBlockedMessage}
                </div>
              ) : (
                <FilmPlayer
                  playbackId={film.mux_playback_id}
                  filmId={film.id}
                  title={film.title}
                  locale={locale}
                  durationMinutes={film.duration_minutes}
                  originalLanguage={film.original_language ?? ''}
                  subtitleLanguages={film.subtitle_languages ?? []}
                  startTime={startTime}
                  playLabel={t('play')}
                  loadingLabel={t('playerLoading')}
                />
              )}
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
          padding: 'clamp(32px, 5vw, 52px) clamp(16px, 4vw, 48px) 0',
        }}
      >
        {contentBlock}
      </div>
    </main>
  )
}
