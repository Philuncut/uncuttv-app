'use client'

import Link from 'next/link'

export default function ImpressumPage() {
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
          IMPRESSUM
        </h1>
        <p style={{ fontSize: '0.82rem', color: 'var(--grey)', marginBottom: '48px' }}>
          Angaben gemäß § 5 ECG
        </p>

        <Section title="Unternehmensangaben">
          <Row label="Firma" value="UncutTV GmbH" />
          <Row label="Adresse" value="Kalchgruben 4/11, 6094 Axams, Österreich" />
          <Row label="E-Mail" value="office@uncuttv.at" link="mailto:office@uncuttv.at" />
          <Row label="Website" value="www.uncuttv.at" link="https://www.uncuttv.at" />
        </Section>

        <Section title="Unternehmensgegenstand">
          <p style={{ fontSize: '0.88rem', color: 'var(--grey-light)', lineHeight: 1.8 }}>
            Handel mit Filmen und verwandten Medienprodukten, Medien und Filmproduktion
          </p>
        </Section>

        <Section title="Registrierung">
          <Row label="Firmenbuchnummer" value="FN 643542 k" />
          <Row label="Firmenbuchgericht" value="Landesgericht Innsbruck" />
          <Row label="UID-Nummer" value="ATU 815 26 957" />
        </Section>

        <Section title="Geschäftsführung">
          <p style={{ fontSize: '0.88rem', color: 'var(--grey-light)', lineHeight: 1.8 }}>
            Florian Schütz und Philipp Gasser
          </p>
        </Section>

        <Section title="Mitgliedschaft">
          <p style={{ fontSize: '0.88rem', color: 'var(--grey-light)', lineHeight: 1.8 }}>
            Mitglied der WKÖ – Wirtschaftskammerorganisation<br />
            Fachgruppe: Filmproduktion, inkl. der Herstellung von Multimediaproduktionen
          </p>
        </Section>

        <Section title="Aufsichtsbehörde">
          <p style={{ fontSize: '0.88rem', color: 'var(--grey-light)', lineHeight: 1.8 }}>
            Bezirkshauptmannschaft Innsbruck-Land
          </p>
        </Section>

        <Section title="Verbraucherstreitbeilegung">
          <p style={{ fontSize: '0.88rem', color: 'var(--grey-light)', lineHeight: 1.8 }}>
            Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:{' '}
            <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer"
              style={{ color: 'var(--red)', textDecoration: 'none' }}>
              https://ec.europa.eu/consumers/odr
            </a>
            <br /><br />
            Wir sind nicht verpflichtet und nicht bereit, an einem Streitbeilegungsverfahren vor einer
            Verbraucherschlichtungsstelle teilzunehmen.
          </p>
        </Section>

        <div style={{
          marginTop: '48px', paddingTop: '32px',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', gap: '24px', flexWrap: 'wrap',
        }}>
          <Link href="/de/datenschutz" style={{ fontSize: '0.78rem', color: 'var(--grey)', textDecoration: 'none' }}>
            Datenschutzerklärung
          </Link>
          <Link href="/de/agb" style={{ fontSize: '0.78rem', color: 'var(--grey)', textDecoration: 'none' }}>
            AGB
          </Link>
        </div>

      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{
      border: '1px solid rgba(255,255,255,0.08)',
      background: 'rgba(255,255,255,0.02)',
      padding: '28px 32px', marginBottom: '16px',
      position: 'relative', overflow: 'hidden',
    }}>
      <div style={{
        fontSize: '0.68rem', letterSpacing: '0.15em',
        color: 'var(--grey)', marginBottom: '16px', textTransform: 'uppercase',
      }}>{title}</div>
      {children}
    </div>
  )
}

function Row({ label, value, link }: { label: string; value: string; link?: string }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.04)',
    }}>
      <span style={{ fontSize: '0.82rem', color: 'var(--grey)' }}>{label}</span>
      {link ? (
        <a href={link} style={{ fontSize: '0.88rem', color: 'var(--warm-white)', textDecoration: 'none' }}>
          {value}
        </a>
      ) : (
        <span style={{ fontSize: '0.88rem', color: 'var(--warm-white)' }}>{value}</span>
      )}
    </div>
  )
}
