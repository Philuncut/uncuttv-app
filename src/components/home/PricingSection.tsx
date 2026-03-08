const FEATURES = [
  'Unbegrenztes Streaming aller Filme',
  'HD & 4K Streaming auf allen Geräten',
  'Neue Filme jeden Monat',
  'iOS, Android, Smart TV, Web',
  'Monatlich kündbar – keine Bindung',
  'Exklusiver Indie-Content aus aller Welt',
]

export default function PricingSection() {
  return (
    <section id="pricing" style={{
      padding: '100px 48px', textAlign: 'center',
    }}>
      <div style={{
        fontSize: '0.72rem', letterSpacing: '0.22em',
        textTransform: 'uppercase', color: 'var(--red)', marginBottom: '16px',
      }}>
        Mitgliedschaft
      </div>

      <h2 style={{
        fontFamily: 'var(--font-display)',
        fontSize: 'clamp(3rem, 6vw, 6rem)',
        letterSpacing: '0.04em', marginBottom: '16px',
      }}>
        EINFACH. FAIR. UNCUT.
      </h2>

      <p style={{
        fontFamily: 'var(--font-body)', fontWeight: 300,
        fontSize: '1rem', letterSpacing: '0.08em',
        color: 'var(--grey)', marginBottom: '64px',
      }}>
        Ein Abo. Alles drin. Jeden Monat kündbar.
      </p>

      <div style={{
        maxWidth: '480px', margin: '0 auto',
        background: 'var(--anthrazit2)',
        border: '1px solid rgba(229,9,20,0.25)',
        padding: '56px 48px', position: 'relative',
      }}>
        {/* Red top line */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '1px',
          background: 'linear-gradient(to right, transparent, var(--red), transparent)',
        }} />

        <div style={{
          fontFamily: 'var(--font-display)', fontSize: '2rem',
          letterSpacing: '0.06em', color: 'var(--warm-white)', marginBottom: '24px',
        }}>
          Bereit für echtes Kino?
        </div>

        <ul style={{ listStyle: 'none', marginBottom: '40px', textAlign: 'left' }}>
          {FEATURES.map((f) => (
            <li key={f} style={{
              padding: '12px 0',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
              fontSize: '0.88rem', color: 'var(--grey-light)',
              display: 'flex', alignItems: 'center', gap: '12px',
            }}>
              <span style={{ color: 'var(--red)', flexShrink: 0 }}>—</span>
              {f}
            </li>
          ))}
        </ul>

        <a href="/de/auth/register" className="btn-primary" style={{
          width: '100%', textAlign: 'center', display: 'block',
        }}>
          Jetzt 7 Tage kostenlos testen
        </a>

        <p style={{
          fontSize: '0.72rem', color: 'var(--grey)',
          letterSpacing: '0.08em', marginTop: '24px',
        }}>
          ⚠ UncutTV ist ausschließlich für Personen ab 18 Jahren. Altersverifikation erforderlich.
        </p>
      </div>
    </section>
  )
}
