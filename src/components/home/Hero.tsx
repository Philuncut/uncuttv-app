'use client'

const POSTER_GRADIENTS = [
  'linear-gradient(160deg, #1a0a0a 0%, #3d1010 30%, #0a0505 70%, #050505 100%)',
  'linear-gradient(200deg, #080815 0%, #10183d 30%, #050510 70%, #050505 100%)',
  'linear-gradient(140deg, #0a0a05 0%, #252510 30%, #0a0a05 70%, #050505 100%)',
  'linear-gradient(170deg, #0f050f 0%, #251025 30%, #100510 70%, #050505 100%)',
  'linear-gradient(150deg, #050f05 0%, #102510 30%, #050a05 70%, #050505 100%)',
  'linear-gradient(180deg, #0f0a05 0%, #251a0a 30%, #0f0805 70%, #050505 100%)',
  'linear-gradient(160deg, #1a0505 0%, #3d0a0a 40%, #0a0a0a 100%)',
  'linear-gradient(160deg, #050510 0%, #0a102a 40%, #0a0a0a 100%)',
]

// Duplicate for seamless infinite loop
const ALL_POSTERS = [...POSTER_GRADIENTS, ...POSTER_GRADIENTS]

const BG_COLS = [
  'linear-gradient(160deg, #1a0505 0%, #3d0a0a 40%, #0a0a0a 100%)',
  'linear-gradient(160deg, #050510 0%, #0a102a 40%, #0a0a0a 100%)',
  'linear-gradient(160deg, #0a0a05 0%, #1a1a05 40%, #0a0a0a 100%)',
  'linear-gradient(160deg, #100510 0%, #200a20 40%, #0a0a0a 100%)',
  'linear-gradient(160deg, #05100a 0%, #0a2015 40%, #0a0a0a 100%)',
]

export default function Hero() {
  return (
    <section style={{
      position: 'relative', minHeight: '100vh',
      display: 'flex', alignItems: 'stretch',
      padding: '0 48px 80px', overflow: 'hidden',
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
        position: 'relative', zIndex: 2, maxWidth: '680px',
        display: 'flex', flexDirection: 'column',
        justifyContent: 'space-between', paddingTop: '88px', width: '100%',
      }}>

        {/* Auto-scroll Carousel */}
        <div style={{ marginBottom: '28px' }}>
          <div style={{
            fontSize: '0.68rem', letterSpacing: '0.2em',
            textTransform: 'uppercase', color: 'var(--grey)', marginBottom: '12px',
          }}>
            Neu auf UncutTV
          </div>
          <div style={{
            overflow: 'hidden',
            maskImage: 'linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)',
            WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)',
          }}>
            <div className="carousel-track" style={{
              display: 'flex', gap: '10px', width: 'max-content',
            }}>
              {ALL_POSTERS.map((grad, i) => (
                <div key={i} style={{
                  flexShrink: 0, width: '180px',
                  transition: 'transform 0.3s ease',
                }}
                onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.06)')}
                onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
                >
                  <div style={{
                    width: '100%', aspectRatio: '2/3',
                    background: grad,
                    outline: '1px solid rgba(255,255,255,0.06)',
                    position: 'relative', overflow: 'hidden',
                  }}>
                    {/* 18+ badge */}
                    <div style={{
                      position: 'absolute', top: '8px', right: '8px',
                      background: 'rgba(229,9,20,0.9)', color: 'white',
                      fontSize: '0.6rem', fontWeight: 700,
                      padding: '2px 5px', letterSpacing: '0.06em',
                    }}>18+</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom content */}
        <div>
          {/* Eyebrow */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px',
          }}>
            <div style={{ width: '32px', height: '1px', background: 'var(--red)' }} />
            <span style={{
              fontSize: '0.72rem', letterSpacing: '0.22em',
              textTransform: 'uppercase', color: 'var(--red)', fontWeight: 500,
            }}>
              Indie Film Plattform
            </span>
          </div>

          {/* Title */}
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(5rem, 10vw, 9rem)',
            lineHeight: 0.9, letterSpacing: '0.02em', marginBottom: '8px',
            color: 'var(--warm-white)',
          }}>
            UNCUT<br />
            <span style={{ color: 'var(--red)' }}>TV</span>
          </h1>

          {/* Tagline */}
          <p style={{
            fontFamily: 'var(--font-body)', fontWeight: 300,
            fontSize: 'clamp(1rem, 1.8vw, 1.3rem)',
            color: 'var(--grey-light)', marginBottom: '32px',
            letterSpacing: '0.04em', lineHeight: 1.7,
          }}>
            Kino ohne Kompromisse. Unabhängig.<br />
            So wie Film sein sollte.
          </p>

          {/* CTA Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '48px' }}>
            <a href="/de/auth/register" className="btn-primary">Jetzt ansehen</a>
            <a href="#pricing" className="btn-secondary">Mehr erfahren</a>
          </div>

          {/* Price hint */}
          <div style={{
            display: 'flex', alignItems: 'baseline', gap: '8px',
            color: 'var(--grey)', fontSize: '0.82rem', letterSpacing: '0.06em',
          }}>
            <strong style={{ color: 'var(--warm-white)', fontSize: '1.1rem' }}>19,90€</strong>
            <span>/ Monat · Unbegrenzt · Keine Bindung</span>
          </div>
        </div>
      </div>

      {/* Scroll hint */}
      <div style={{
        position: 'absolute', bottom: '32px', right: '48px', zIndex: 2,
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
        color: 'var(--grey)', fontSize: '0.7rem', letterSpacing: '0.2em',
        textTransform: 'uppercase', writingMode: 'vertical-rl',
      }}>
        Entdecken
        <div style={{
          width: '1px', height: '64px',
          background: 'linear-gradient(to bottom, var(--grey), transparent)',
          animation: 'scrollline 2s ease-in-out infinite',
        }} />
      </div>
    </section>
  )
}
