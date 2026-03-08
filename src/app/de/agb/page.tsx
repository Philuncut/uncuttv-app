'use client'

import Link from 'next/link'

export default function AGBPage() {
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
          AGB
        </h1>
        <p style={{ fontSize: '0.82rem', color: 'var(--grey)', marginBottom: '4px' }}>
          Allgemeine Geschäftsbedingungen der UncutTV GmbH
        </p>
        <p style={{ fontSize: '0.78rem', color: 'var(--grey)', marginBottom: '48px' }}>
          Stand: 7. Juli 2025 · <span style={{ color: 'var(--red)' }}>Vorabversion – noch nicht rechtsverbindlich geprüft</span>
        </p>

        <Section title="1. Geltungsbereich">
          <p style={textStyle}>
            Diese Allgemeinen Geschäftsbedingungen gelten für die Nutzung der Streaming-Plattform
            UncutTV, betrieben von der UncutTV GmbH, Kalchgruben 4/11, 6094 Axams, Österreich
            (nachfolgend „UncutTV"). Mit der Registrierung und Nutzung der Plattform akzeptierst
            du diese AGB.
          </p>
        </Section>

        <Section title="2. Leistungsbeschreibung">
          <p style={textStyle}>
            UncutTV ist eine Streaming-Plattform für Independent-Film, spezialisiert auf Horror-
            und Extremkino. Das Angebot richtet sich ausschließlich an Personen ab 18 Jahren mit
            Wohnsitz im DACH-Raum (Deutschland, Österreich, Schweiz). UncutTV stellt Nutzern
            gegen Entgelt Zugang zu einem Filmkatalog zur Verfügung. Ein Anspruch auf bestimmte
            Inhalte oder deren dauerhafte Verfügbarkeit besteht nicht.
          </p>
        </Section>

        <Section title="3. Registrierung & Altersverifikation">
          <p style={textStyle}>
            Zur Nutzung von UncutTV ist eine Registrierung sowie eine erfolgreiche
            Altersverifikation (18+) erforderlich. Die Altersverifikation erfolgt über einen
            zertifizierten Drittanbieter. Ohne abgeschlossene Altersverifikation ist kein Zugang
            zu kostenpflichtigen Inhalten möglich. Du bist verpflichtet, bei der Registrierung
            wahrheitsgemäße Angaben zu machen.
          </p>
        </Section>

        <Section title="4. Abonnement & Preise">
          <p style={textStyle}>
            Die Nutzung von UncutTV erfolgt im Abonnement. Es gelten folgende Konditionen:
          </p>
          <ul style={listStyle}>
            <li>7 Tage kostenlose Testphase für Neukunden</li>
            <li>Nach Ablauf der Testphase: €19,90 pro Monat</li>
            <li>Monatlich kündbar, keine Mindestlaufzeit</li>
            <li>Automatische Verlängerung um jeweils einen Monat</li>
            <li>Alle Preise inkl. gesetzlicher MwSt.</li>
          </ul>
          <p style={{ ...textStyle, marginTop: '12px' }}>
            Preisänderungen werden mindestens 30 Tage im Voraus per E-Mail angekündigt.
          </p>
        </Section>

        <Section title="5. Zahlung">
          <p style={textStyle}>
            Die Zahlung erfolgt monatlich im Voraus per Kreditkarte oder SEPA-Lastschrift über
            unseren Zahlungsdienstleister Stripe. Bei fehlgeschlagener Zahlung behalten wir uns
            vor, den Zugang zur Plattform vorübergehend zu sperren. Stripe versucht die Zahlung
            in diesem Fall automatisch erneut.
          </p>
        </Section>

        <Section title="6. Kündigung">
          <p style={textStyle}>
            Das Abonnement kann jederzeit zum Ende des laufenden Abrechnungszeitraums gekündigt
            werden. Die Kündigung erfolgt über den Bereich „Mein Konto" auf der Plattform.
            Nach der Kündigung hast du bis zum Ende des bezahlten Zeitraums weiterhin Zugang
            zu allen Inhalten.
          </p>
        </Section>

        <Section title="7. Widerrufsrecht">
          <p style={textStyle}>
            Als Verbraucher steht dir grundsätzlich ein 14-tägiges Widerrufsrecht zu.
            Mit der Registrierung und dem Start der kostenlosen Testphase stimmst du zu,
            dass die Dienstleistung sofort beginnt. Das Widerrufsrecht erlischt mit Beginn
            der Dienstleistungserbringung, sofern du der vorzeitigen Ausführung ausdrücklich
            zugestimmt hast.
          </p>
          <p style={{ ...textStyle, marginTop: '12px' }}>
            Widerrufsadresse: UncutTV GmbH, Kalchgruben 4/11, 6094 Axams –{' '}
            <a href="mailto:office@uncuttv.at" style={{ color: 'var(--red)', textDecoration: 'none' }}>
              office@uncuttv.at
            </a>
          </p>
        </Section>

        <Section title="8. Nutzungsrechte">
          <p style={textStyle}>
            Mit dem aktiven Abonnement erhältst du ein nicht-übertragbares, nicht-exklusives
            Recht zur privaten Nutzung der Inhalte. Jegliche Aufzeichnung, Vervielfältigung,
            Weitergabe oder öffentliche Wiedergabe der Inhalte ist untersagt. Das Teilen von
            Zugangsdaten ist nicht gestattet.
          </p>
        </Section>

        <Section title="9. Jugendschutz & erlaubte Inhalte">
          <p style={textStyle}>
            UncutTV richtet sich ausschließlich an Erwachsene ab 18 Jahren. Das Angebot enthält
            Inhalte, die explizite Gewalt, Horror und extremes Kino umfassen können. Du bestätigst
            mit der Registrierung, volljährig zu sein und solche Inhalte legal konsumieren zu dürfen.
            Minderjährigen ist der Zugang strikt untersagt.
          </p>
        </Section>

        <Section title="10. Geo-Blocking">
          <p style={textStyle}>
            Einige Inhalte können aufgrund von Lizenzbestimmungen in bestimmten Ländern nicht
            verfügbar sein. UncutTV ist ein österreichischer Dienst und primär für den DACH-Markt
            ausgerichtet. Einzelne Titel können in Deutschland eingeschränkt sein.
          </p>
        </Section>

        <Section title="11. Haftungsbeschränkung">
          <p style={textStyle}>
            UncutTV übernimmt keine Haftung für die vorübergehende Nichtverfügbarkeit der
            Plattform aufgrund von Wartungsarbeiten oder technischen Störungen. Eine Haftung
            für mittelbare Schäden oder entgangenen Gewinn ist ausgeschlossen, soweit gesetzlich
            zulässig.
          </p>
        </Section>

        <Section title="12. Änderungen der AGB">
          <p style={textStyle}>
            UncutTV behält sich vor, diese AGB jederzeit zu ändern. Über wesentliche Änderungen
            wirst du per E-Mail informiert. Widersprichst du den neuen AGB nicht innerhalb von
            30 Tagen nach Bekanntgabe, gelten sie als akzeptiert.
          </p>
        </Section>

        <Section title="13. Anwendbares Recht & Gerichtsstand">
          <p style={textStyle}>
            Es gilt österreichisches Recht unter Ausschluss des UN-Kaufrechts. Gerichtsstand
            für Streitigkeiten mit Unternehmern ist Innsbruck, Österreich. Für Verbraucher
            gilt der gesetzliche Gerichtsstand.
          </p>
        </Section>

        <div style={{
          marginTop: '48px', paddingTop: '32px',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', gap: '24px', flexWrap: 'wrap',
        }}>
          <Link href="/de/impressum" style={{ fontSize: '0.78rem', color: 'var(--grey)', textDecoration: 'none' }}>
            Impressum
          </Link>
          <Link href="/de/datenschutz" style={{ fontSize: '0.78rem', color: 'var(--grey)', textDecoration: 'none' }}>
            Datenschutzerklärung
          </Link>
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