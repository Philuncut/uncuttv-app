'use client'

import Link from 'next/link'

export default function JugendschutzPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--black)' }}>

      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 500,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '20px 48px',
        background: 'rgba(10,10,10,0.95)', backdropFilter: 'blur(8px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <Link href="/de" style={{
          fontFamily: 'var(--font-display)', fontSize: '1.8rem',
          letterSpacing: '0.08em', color: 'var(--warm-white)', textDecoration: 'none',
        }}>
          UNCUT<span style={{ color: 'var(--red)' }}>TV</span>
        </Link>
        <Link href="/de" style={{
          fontSize: '0.82rem', color: 'var(--grey)',
          textDecoration: 'none', letterSpacing: '0.06em',
        }}>
          {'← Zurück'}
        </Link>
      </nav>

      <div style={{ padding: '120px 48px 80px', maxWidth: '720px', margin: '0 auto' }}>

        <h1 style={{
          fontFamily: 'var(--font-display)', fontSize: '2.5rem',
          letterSpacing: '0.06em', color: 'var(--warm-white)', marginBottom: '8px',
        }}>
          JUGENDSCHUTZ
        </h1>
        <p style={{ fontSize: '0.82rem', color: 'var(--grey)', marginBottom: '48px' }}>
          UncutTV ist ausschließlich für Erwachsene ab 18 Jahren
        </p>

        {/* 18+ Badge */}
        <div style={{
          border: '1px solid rgba(229,9,20,0.3)',
          background: 'rgba(229,9,20,0.04)',
          padding: '28px 32px', marginBottom: '16px',
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0,
            height: '3px', background: 'var(--red)',
            boxShadow: '0 0 20px rgba(229,9,20,0.8)',
          }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <span style={{
              background: 'var(--red)', color: 'white',
              fontSize: '1.2rem', fontWeight: 900, padding: '8px 14px',
              letterSpacing: '0.06em', flexShrink: 0,
            }}>18+</span>
            <p style={{ fontSize: '0.92rem', color: 'var(--grey-light)', lineHeight: 1.8, margin: 0 }}>
              UncutTV ist eine Streaming-Plattform für Independent-Horror und Extremkino.
              Alle Inhalte sind ausschließlich für Erwachsene ab 18 Jahren bestimmt.
              Der Zugang ist technisch durch eine verpflichtende Altersverifikation gesperrt.
            </p>
          </div>
        </div>

        <Section title="Altersverifikation">
          <p style={textStyle}>
            Jeder Nutzer muss vor der ersten Nutzung eine Altersverifikation über den
            zertifizierten Anbieter <strong style={{ color: 'var(--warm-white)' }}>Veriff</strong> durchlaufen.
            Dabei wird die Volljährigkeit (18+) anhand eines gültigen Lichtbildausweises überprüft.
            Ohne erfolgreiche Verifikation ist kein Zugang zu Inhalten möglich.
          </p>
          <p style={{ ...textStyle, marginTop: '12px' }}>
            Diese Maßnahme entspricht den Anforderungen des österreichischen Jugendschutzgesetzes
            sowie dem deutschen Jugendschutzgesetz (JuSchG) und dem Jugendmedienschutz-Staatsvertrag (JMStV).
          </p>
        </Section>

        <Section title="Technische Schutzmaßnahmen">
          <p style={textStyle}>Folgende Maßnahmen sind auf UncutTV aktiv:</p>
          <ul style={listStyle}>
            <li>Verpflichtende Altersverifikation via Veriff bei jeder Registrierung</li>
            <li>Kein Zugang ohne verifizierten Account</li>
            <li>Alle Videos werden nur über signierte, zeitlich begrenzte URLs ausgeliefert</li>
            <li>Kein öffentlich zugänglicher Inhalt ohne Login</li>
            <li>Geo-Blocking für Länder mit besonderen Lizenzeinschränkungen</li>
          </ul>
        </Section>

        <Section title="Für Eltern und Erziehungsberechtigte">
          <p style={textStyle}>
            UncutTV richtet sich nicht an Minderjährige. Solltest du als Erziehungsberechtigte/r
            dennoch Bedenken haben oder Fragen zur Altersverifikation, wende dich bitte direkt an uns:
          </p>
          <div style={{
            marginTop: '16px', padding: '16px 20px',
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.06)',
          }}>
            <p style={{ ...textStyle, margin: 0 }}>
              E-Mail:{' '}
              <a href="mailto:office@uncuttv.at" style={{ color: 'var(--red)', textDecoration: 'none' }}>
                office@uncuttv.at
              </a><br />
              UncutTV GmbH · Kalchgruben 4/11 · 6094 Axams · Österreich
            </p>
          </div>
        </Section>

        <Section title="Rechtsgrundlagen">
          <p style={textStyle}>
            UncutTV handelt in Übereinstimmung mit folgenden gesetzlichen Grundlagen:
          </p>
          <ul style={listStyle}>
            <li>Österreichisches Jugendschutzgesetz (JuSchG AT)</li>
            <li>Deutsches Jugendschutzgesetz (JuSchG DE)</li>
            <li>Jugendmedienschutz-Staatsvertrag (JMStV)</li>
            <li>EU-Richtlinie über audiovisuelle Mediendienste (AVMD-Richtlinie)</li>
          </ul>
        </Section>

        <div style={{
          marginTop: '48px', paddingTop: '32px',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', gap: '24px', flexWrap: 'wrap',
        }}>
          <Link href="/de/impressum" style={{ fontSize: '0.78rem', color: 'var(--grey)', textDecoration: 'none' }}>Impressum</Link>
          <Link href="/de/datenschutz" style={{ fontSize: '0.78rem', color: 'var(--grey)', textDecoration: 'none' }}>Datenschutz</Link>
          <Link href="/de/agb" style={{ fontSize: '0.78rem', color: 'var(--grey)', textDecoration: 'none' }}>AGB</Link>
        </div>

      </div>
    </div>
  )
}

const textStyle: React.CSSProperties = {
  fontSize: '0.88rem',
  color: 'var(--grey-light)',
  lineHeight: 1.8,
  margin: 0,
}

const listStyle: React.CSSProperties = {
  fontSize: '0.88rem',
  color: 'var(--grey-light)',
  lineHeight: 2,
  paddingLeft: '20px',
  margin: '8px 0 0 0',
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{
      border: '1px solid rgba(255,255,255,0.08)',
      background: 'rgba(255,255,255,0.02)',
      padding: '28px 32px', marginBottom: '16px',
    }}>
      <div style={{
        fontSize: '0.68rem', letterSpacing: '0.15em',
        color: 'var(--grey)', marginBottom: '16px', textTransform: 'uppercase',
      }}>{title}</div>
      {children}
    </div>
  )
}
