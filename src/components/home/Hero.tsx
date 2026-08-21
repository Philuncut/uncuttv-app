'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'

const carouselPosters = [
  'https://xmqxnwhszgsijmhdtrhg.supabase.co/storage/v1/object/public/posters/agp1.jpg',
  'https://xmqxnwhszgsijmhdtrhg.supabase.co/storage/v1/object/public/posters/backwood.jpg',
  'https://xmqxnwhszgsijmhdtrhg.supabase.co/storage/v1/object/public/posters/Blood_Feast_UncutTV_Artwork.jpg',
  'https://xmqxnwhszgsijmhdtrhg.supabase.co/storage/v1/object/public/posters/borndead2.jpg',
  'https://xmqxnwhszgsijmhdtrhg.supabase.co/storage/v1/object/public/posters/fakenews.jpg',
  // Kommt erst spaeter auf die Plattform. Wieder aufnehmen heisst: Kommentar weg.
  // Die Liste haengt nicht an der Datenbank, das Veroeffentlichungskennzeichen
  // des Datensatzes greift hier also nicht -- deshalb muss der Titel hier
  // eigens heraus.
  // 'https://xmqxnwhszgsijmhdtrhg.supabase.co/storage/v1/object/public/posters/Fist_of_Jesus_UncutTV_Artwork.jpg',
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
      overflow: isMobile ? 'hidden' : 'visible',
    }}>
      {/* Hintergrundbild: Kellerraum mit Roehrenfernseher.
          Waagrecht rechtsbuendig -- das Motiv sitzt in der rechten Bildhaelfte
          (Schirm bei x 66-80 %), links bleibt die ruhige dunkle Flaeche fuer den Text.

          Senkrecht: die Bildbox ist mit 1400 px hoeher als die Sektion und oben
          verankert. Der Schirm liegt bei 30-63 % der Bildhoehe, das Karussell
          endet 392 px unter der Sektionskante -- 0,30 x 1400 = 420 px, der
          Fernseher steht also knapp darunter frei, der Schriftzug darauf bei
          448-560 px. Bei 'inset: 0' waere die Box nur so hoch wie die Sektion
          und der Schirm liefe hinter die Poster. Der Ueberstand nach unten wird
          von der aeusseren Box abgeschnitten, weil die Sektion selbst
          overflow: visible hat und das Bild sonst in den Abschnitt darunter
          liefe. Unter 768 px wird die Box ueber .hero-bg ganz ausgeblendet, die
          Begruendung steht dort. */}
      <div className="hero-bg" style={{ position: 'absolute', inset: 0, zIndex: 0, overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0,
          height: '1400px',
        }}>
          <Image
            src="/hero-tv-room.webp"
            alt=""
            fill
            priority
            /* Die Box ist hoeher als breit, das Bild wird also auf die Hoehe
               skaliert: 1400 x 16/9 = 2488 px Darstellungsbreite, unabhaengig
               vom Fenster. Mit 100vw wuerde next/image eine viel zu kleine
               Fassung ausliefern. */
            sizes="(max-width: 767px) 100vw, 2488px"
            style={{
              objectFit: 'cover',
              objectPosition: 'right top',
            }}
          />
        </div>
      </div>

      {/* Verlauf und Schleier ueber dem Bild. Wirksam ab Tablet-Breite -- auf dem
          Handy laeuft der mobile Zweig ueber schwarzen Grund und aendert nichts,
          er bleibt nur stehen, falls das Bild dort einmal zurueckkehrt.
          Desktop: volles Schwarz bis 45 % Breite, danach weich auslaufend, damit
          rechts der Fernseher sichtbar bleibt.
          Mobil: deutlich staerker abgedunkelt -- dort liegt der Text zwangslaeufig
          ueber dem Motiv. */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 1,
        background: isMobile
          ? `
            linear-gradient(to top, rgba(10,10,10,1) 0%, transparent 55%),
            linear-gradient(to right, rgba(10,10,10,0.94) 0%, rgba(10,10,10,0.86) 50%, rgba(10,10,10,0.78) 100%),
            linear-gradient(rgba(10,10,10,0.45), rgba(10,10,10,0.45))
          `
          : `
            linear-gradient(to top, rgba(10,10,10,1) 0%, transparent 50%),
            linear-gradient(to right, rgba(10,10,10,1) 0%, rgba(10,10,10,1) 45%, rgba(10,10,10,0.7) 62%, rgba(10,10,10,0.25) 80%, rgba(10,10,10,0.1) 100%),
            linear-gradient(rgba(10,10,10,0.3), rgba(10,10,10,0.3))
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
                marginLeft: '-48px',
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
            fontSize: isMobile ? 'clamp(3.5rem, 23vw, 11rem)' : 'clamp(5rem, 26vw, 11rem)',
            lineHeight: 0.9, letterSpacing: '0.02em',
            marginBottom: isMobile ? '12px' : '8px',
            color: 'var(--warm-white)',
            // Ab Tablet-Breite bleibt die Zeile geschlossen. Darunter darf sie
            // umbrechen -- ohne Leerzeichen gaebe es sonst keine Bruchstelle und
            // das Wort liefe aus der Spalte.
            whiteSpace: isMobile ? 'normal' : 'nowrap',
          }}>
            UNCUT<wbr /><span style={{ color: 'var(--red)' }}>TV</span>
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
