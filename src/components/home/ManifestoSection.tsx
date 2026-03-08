export default function ManifestoSection() {
  return (
    <section style={{
      padding: '120px 48px',
      background: 'var(--anthrazit)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse at 50% 50%, rgba(229,9,20,0.04) 0%, transparent 60%)',
      }} />
      <div style={{
        maxWidth: '800px', margin: '0 auto',
        textAlign: 'center', position: 'relative', zIndex: 1,
      }}>
        <blockquote style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(2rem, 4vw, 3.5rem)',
          lineHeight: 1.2, letterSpacing: '0.06em',
          color: 'var(--warm-white)', marginBottom: '32px',
        }}>
          DAS INDEPENDENT KINO HAT DIE MUTIGSTEN
          STIMMEN DER WELT —{' '}
          <span style={{ color: 'var(--red)' }}>
            SIE VERDIENEN EINE BÜHNE OHNE FILTER.
          </span>
        </blockquote>
        <div style={{
          fontSize: '0.78rem', letterSpacing: '0.18em',
          textTransform: 'uppercase', color: 'var(--grey)',
        }}>
          — Das UncutTV Manifest
        </div>
      </div>
    </section>
  )
}
