import Link from 'next/link'

const LINKS = {
  Plattform: ['Alle Filme', 'Neuheiten', 'Genres', 'Suche'],
  Entdecken: ['Neue Filme', 'Genres', 'Länder', 'FAQ'],
  Rechtliches: ['Impressum', 'Datenschutz', 'AGB', 'Jugendschutz'],
}

export default function Footer() {
  return (
    <footer style={{
      background: 'var(--black)',
      borderTop: '1px solid rgba(255,255,255,0.06)',
      padding: '64px 48px 40px',
    }}>
      <div style={{
        display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr',
        gap: '48px', marginBottom: '48px',
      }}>
        {/* Brand */}
        <div>
          <Link href="/de" style={{
            fontFamily: 'var(--font-display)', fontSize: '1.8rem',
            letterSpacing: '0.08em', color: 'var(--warm-white)',
            textDecoration: 'none', display: 'inline-flex', marginBottom: '16px',
          }}>
            UNCUT<span style={{ color: 'var(--red)' }}>TV</span>
          </Link>
          <p style={{
            fontSize: '0.82rem', color: 'var(--grey)', lineHeight: 1.7, maxWidth: '280px',
          }}>
            Die Streaming-Plattform für Independent-Film. Unabhängig. Ungefiltert. Fair.
          </p>
        </div>

        {/* Link columns */}
        {Object.entries(LINKS).map(([title, items]) => (
          <div key={title}>
            <h4 style={{
              fontSize: '0.72rem', letterSpacing: '0.18em',
              textTransform: 'uppercase', color: 'var(--grey)', marginBottom: '20px',
            }}>
              {title}
            </h4>
            <ul style={{ listStyle: 'none' }}>
              {items.map((item) => (
                <li key={item} style={{ marginBottom: '10px' }}>
                  <Link href="#" style={{
                    color: 'var(--grey-light)', textDecoration: 'none', fontSize: '0.85rem',
                  }}>
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Bottom bar */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        paddingTop: '32px', borderTop: '1px solid rgba(255,255,255,0.06)',
      }}>
        <p style={{ fontSize: '0.75rem', color: 'var(--grey)', letterSpacing: '0.06em' }}>
          © 2026 UncutTV GmbH · Alle Rechte vorbehalten
        </p>
        <span style={{
          background: 'var(--red)', color: 'white',
          fontSize: '0.7rem', fontWeight: 700, padding: '3px 8px', letterSpacing: '0.06em',
        }}>
          18+
        </span>
      </div>
    </footer>
  )
}
