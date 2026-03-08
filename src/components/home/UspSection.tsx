const FEATURES = [
  { title: 'Weltweites Indie-Kino', desc: 'Unabhängige Filme aus aller Welt' },
  { title: 'HD & 4K Streaming', desc: 'Adaptives Bitrate-Streaming für jede Verbindung' },
  { title: 'Ab 18 Jahren', desc: 'Unzensierter, erwachsener Content ohne Beschränkungen' },
  { title: 'Alle Geräte', desc: 'Web, iOS, Android, Smart TV' },
]

export default function UspSection() {
  return (
    <>
      <div className="red-divider" />
      <section style={{
        padding: '100px 48px',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '80px',
        alignItems: 'center',
      }}>
        {/* Price visual */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(6rem, 12vw, 14rem)',
            lineHeight: 0.9,
            color: 'var(--warm-white)',
            letterSpacing: '-0.02em',
            userSelect: 'none',
            background: 'var(--anthrazit2)',
            border: '1px solid rgba(229,9,20,0.15)',
            padding: '48px 56px 40px',
            textAlign: 'center',
            position: 'relative',
          }}>
            <sup style={{ fontSize: '0.35em', color: 'var(--red)', verticalAlign: 'super' }}>€</sup>
            19,90
            <div style={{
              fontFamily: 'var(--font-body)', fontWeight: 300,
              fontSize: '0.85rem', letterSpacing: '0.18em',
              textTransform: 'uppercase', color: 'var(--grey)',
              marginTop: '12px', textAlign: 'center',
            }}>
              pro Monat
            </div>
          </div>
        </div>

        {/* Content */}
        <div>
          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(2.5rem, 4vw, 4rem)',
            letterSpacing: '0.04em', lineHeight: 1.05,
            marginBottom: '24px', color: 'var(--warm-white)',
          }}>
            Film wie er sein sollte.<br />KEIN KOMPROMISS.
          </h2>

          <p style={{
            fontSize: '1rem', lineHeight: 1.8,
            color: 'var(--grey-light)', marginBottom: '40px', maxWidth: '480px',
          }}>
            UncutTV ist die Streaming-Plattform für Independent-Film. Keine Mainstream-Produktionen,
            kein Studio-Diktat – nur echtes, unabhängiges Kino aus aller Welt.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {FEATURES.map((f) => (
              <div key={f.title} style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                <div style={{
                  width: '6px', height: '6px', borderRadius: '50%',
                  background: 'var(--red)', marginTop: '7px', flexShrink: 0,
                }} />
                <div style={{ fontSize: '0.88rem', color: 'var(--grey-light)', lineHeight: 1.6 }}>
                  <strong style={{ color: 'var(--warm-white)', fontWeight: 500 }}>{f.title}</strong>
                  {' – '}{f.desc}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      <div className="red-divider" />
    </>
  )
}
