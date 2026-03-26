'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'

const carouselPosters = [
  'https://xmqxnwhszgsijmhdtrhg.supabase.co/storage/v1/object/public/posters/agp1.jpg',
  'https://xmqxnwhszgsijmhdtrhg.supabase.co/storage/v1/object/public/posters/backwood.jpg',
  'https://xmqxnwhszgsijmhdtrhg.supabase.co/storage/v1/object/public/posters/Blood_Feast_UncutTV_Artwork.jpg',
  'https://xmqxnwhszgsijmhdtrhg.supabase.co/storage/v1/object/public/posters/borndead2.jpg',
  'https://xmqxnwhszgsijmhdtrhg.supabase.co/storage/v1/object/public/posters/Caedes_UncutTV_Artwork.jpg',
  'https://xmqxnwhszgsijmhdtrhg.supabase.co/storage/v1/object/public/posters/fakenews.jpg',
  'https://xmqxnwhszgsijmhdtrhg.supabase.co/storage/v1/object/public/posters/Fist_of_Jesus_UncutTV_Artwork.jpg',
  'https://xmqxnwhszgsijmhdtrhg.supabase.co/storage/v1/object/public/posters/gorenography.jpg',
  'https://xmqxnwhszgsijmhdtrhg.supabase.co/storage/v1/object/public/posters/Headless_UncutTV_Artwork.jpg',
  'https://xmqxnwhszgsijmhdtrhg.supabase.co/storage/v1/object/public/posters/La_Petite_Mort_2_Nasty_Tapes_UncutTV_Artwork.jpg',
  'https://xmqxnwhszgsijmhdtrhg.supabase.co/storage/v1/object/public/posters/LPM.jpg',
  'https://xmqxnwhszgsijmhdtrhg.supabase.co/storage/v1/object/public/posters/nn9.jpg',
  'https://xmqxnwhszgsijmhdtrhg.supabase.co/storage/v1/object/public/posters/nn9_2.jpg',
  'https://xmqxnwhszgsijmhdtrhg.supabase.co/storage/v1/object/public/posters/RAW_UncutTV_Artwork.jpg',
  'https://xmqxnwhszgsijmhdtrhg.supabase.co/storage/v1/object/public/posters/slavedolls.jpg',
  'https://xmqxnwhszgsijmhdtrhg.supabase.co/storage/v1/object/public/posters/The_Woods_Turned_Red_UncutTV_Artwork.jpg',
  'https://xmqxnwhszgsijmhdtrhg.supabase.co/storage/v1/object/public/posters/traces%202.jpg',
]

const MOBILE_LOOP_POSTERS = [...carouselPosters, ...carouselPosters]

const BG_COLS = [
  'linear-gradient(160deg, #1a0505 0%, #3d0a0a 40%, #0a0a0a 100%)',
  'linear-gradient(160deg, #050510 0%, #0a102a 40%, #0a0a0a 100%)',
  'linear-gradient(160deg, #0a0a05 0%, #1a1a05 40%, #0a0a0a 100%)',
  'linear-gradient(160deg, #100510 0%, #200a20 40%, #0a0a0a 100%)',
  'linear-gradient(160deg, #05100a 0%, #0a2015 40%, #0a0a0a 100%)',
]

export default function Hero() {
  const t = useTranslations('hero')
  const pathname = usePathname()
  const locale = (pathname?.match(/^\/(de|en)(?:\/|$)/)?.[1]) ?? 'de'
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  return (
    <section style={{
      position: 'relative',
      minHeight: isMobile ? 'auto' : 'auto',
      display: 'flex', alignItems: 'stretch',
      padding: isMobile ? '0 20px 48px' : '0 48px 80px',
      overflow: 'hidden',
    }}>
      {/* Background film strip */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 0,
        display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)',
        gap: '2px', opacity: 0.35,
        transform: 'skewX(-2deg) scale(1.05)',
      }}>
        {BG_COLS.map((grad, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {[0, 1, 2].map((j) => (
              <div key={j} style={{
                flex: 1, background: BG_COLS[(i + j) % BG_COLS.length],
              }} />
            ))}
          </div>
        ))}
      </div>

      {/* Gradient overlay */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 1,
        background: `
          linear-gradient(to right, rgba(10,10,10,0.98) 35%, rgba(10,10,10,0.3) 70%, rgba(10,10,10,0.7) 100%),
          linear-gradient(to top, rgba(10,10,10,1) 0%, transparent 50%)
        `,
      }} />

      {/* Content */}
      <div style={{
        position: 'relative', zIndex: 2,
        maxWidth: isMobile ? '100%' : '680px',
        display: 'flex', flexDirection: 'column',
        justifyContent: 'flex-start',
        paddingTop: isMobile ? '72px' : '96px',
        width: '100%',
      }}>

        {/* Auto-scroll Carousel */}
        <div style={{ marginBottom: isMobile ? '20px' : '16px',}}>
          <div style={{
            fontSize: '0.68rem', letterSpacing: '0.2em',
            textTransform: 'uppercase', color: 'var(--grey)',
            marginBottom: '12px',
          }}>
            Neu auf UncutTV
          </div>
          {isMobile ? (
            // Mobile: keep existing overflow-hidden + animated track behavior.
            <div
              style={{
                overflow: 'hidden',
                maskImage:
                  'linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)',
                WebkitMaskImage:
                  'linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)',
              }}
            >
              <div
                className="carousel-track"
                style={{
                  display: 'flex',
                  gap: '8px',
                  width: 'max-content',
                }}
              >
                {MOBILE_LOOP_POSTERS.map((posterUrl, i) => (
                  <div
                    key={i}
                    style={{
                      flexShrink: 0,
                      width: '100px',
                      transition: 'transform 0.3s ease',
                    }}
                  >
                    <div
                      style={{
                        width: '100%',
                        aspectRatio: '2/3',
                        outline: '1px solid rgba(255,255,255,0.06)',
                        position: 'relative',
                        overflow: 'hidden',
                      }}
                    >
                      <img
                        src={posterUrl}
                        alt=""
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          display: 'block',
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            // Desktop: full-bleed scroller (break out of max-width parent)
            <div
              className="carousel-scroll-x"
              style={{
                width: '100vw',
                marginLeft: 'calc(50% - 50vw)',
                boxSizing: 'border-box',
                overflow: 'hidden',
                paddingLeft: '0',
                paddingRight: '0',
                WebkitOverflowScrolling: 'touch',
                maskImage:
                  'linear-gradient(to right, transparent 0%, black 2%, black 98%, transparent 100%)',
                WebkitMaskImage:
                  'linear-gradient(to right, transparent 0%, black 2%, black 98%, transparent 100%)',
              }}
            >
              <div
                className="carousel-track-desktop"
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  flexWrap: 'nowrap',
                  gap: '8px',
                  width: 'max-content',
                  minWidth: 'max-content',
                }}
              >
                {[...MOBILE_LOOP_POSTERS, ...MOBILE_LOOP_POSTERS].map((posterUrl, i) => (
                  <div
                    key={`${posterUrl}-${i}`}
                    style={{
                      flexShrink: 0,
                      width: '180px',
                      transition: 'transform 0.3s ease',
                    }}
                  >
                    <div
                      style={{
                        width: '100%',
                        aspectRatio: '2/3',
                        outline: '1px solid rgba(255,255,255,0.06)',
                        position: 'relative',
                        overflow: 'hidden',
                      }}
                    >
                      <img
                        src={posterUrl}
                        alt=""
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          display: 'block',
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Bottom content */}
        <div>
          {/* Eyebrow */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '12px',
            marginBottom: isMobile ? '12px' : '20px',
          }}>
            <div style={{ width: '32px', height: '1px', background: 'var(--red)' }} />
            <span style={{
              fontSize: '0.72rem', letterSpacing: '0.22em',
              textTransform: 'uppercase', color: 'var(--red)', fontWeight: 500,
            }}>
              {t('eyebrow')}
            </span>
          </div>

          {/* Title */}
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: isMobile ? 'clamp(4rem, 22vw, 6rem)' : 'clamp(5rem, 10vw, 9rem)',
            lineHeight: 0.9, letterSpacing: '0.02em',
            marginBottom: isMobile ? '12px' : '8px',
            color: 'var(--warm-white)',
          }}>
            UNCUT<br />
            <span style={{ color: 'var(--red)' }}>TV</span>
          </h1>

          {/* Tagline */}
          <p style={{
            fontFamily: 'var(--font-body)', fontWeight: 300,
            fontSize: isMobile ? '0.92rem' : 'clamp(1rem, 1.8vw, 1.3rem)',
            color: 'var(--grey-light)',
            marginBottom: isMobile ? '24px' : '32px',
            letterSpacing: '0.04em', lineHeight: 1.7,
          }}>
            {t('tagline')}<br />
            {t('tagline2')}
          </p>

          <div style={{
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            alignItems: isMobile ? 'flex-start' : 'center',
            gap: isMobile ? '12px' : '24px',
            marginBottom: isMobile ? '24px' : '48px',
          }}>
            <Link href={`/${locale}/auth/register`} className="btn-primary">{t('cta_primary')}</Link>
            <a href="#pricing" className="btn-secondary">{t('cta_secondary')}</a>
          </div>

          <div style={{
            display: 'flex', alignItems: 'baseline', gap: '8px',
            color: 'var(--grey)', fontSize: '0.82rem', letterSpacing: '0.06em',
          }}>
            <strong style={{ color: 'var(--warm-white)', fontSize: '1.1rem' }}>19,90€</strong>
            <span>{t('price_label')}</span>
          </div>
        </div>
      </div>

      {/* Scroll hint – nur Desktop */}
      {!isMobile && (
        <div style={{
          position: 'absolute', bottom: '32px', right: '48px', zIndex: 2,
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
          color: 'var(--grey)', fontSize: '0.7rem', letterSpacing: '0.2em',
          textTransform: 'uppercase', writingMode: 'vertical-rl',
        }}>
          {t('cta_secondary')}
          <div style={{
            width: '1px', height: '64px',
            background: 'linear-gradient(to bottom, var(--grey), transparent)',
            animation: 'scrollline 2s ease-in-out infinite',
          }} />
        </div>
      )}
    </section>
  )
}
