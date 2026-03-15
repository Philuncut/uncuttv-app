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

  if (!user) {
    redirect(`/${locale}/auth/login?redirect=/${locale}/films/${slug}`)
  }

  const { data: film, error: filmError } = await supabase
    .from('films')
    .select('id, title, slug, mux_playback_id, thumbnail_url')
    .eq('slug', slug)
    .eq('is_published', true)
    .maybeSingle()

  if (filmError || !film) {
    redirect(`/${locale}/films`)
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_status')
    .eq('id', user.id)
    .single()

  const hasSubscription = profile && ACTIVE_STATUSES.includes(profile.subscription_status)
  const hasVoucher = await userHasVoucherForFilm(user.id, film.id)

  if (!hasSubscription && !hasVoucher) {
    redirect(`/${locale}/subscribe`)
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
      </div>
    </main>
  )
}
