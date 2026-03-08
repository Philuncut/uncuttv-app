'use client'

import Link from 'next/link'

export default function DatenschutzPage() {
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
          DATENSCHUTZ
        </h1>
        <p style={{ fontSize: '0.82rem', color: 'var(--grey)', marginBottom: '48px' }}>
          Stand: 7. Juli 2025
        </p>

        <Section title="1. Allgemeine Hinweise">
          <p style={textStyle}>
            Der Schutz deiner personenbezogenen Daten ist uns ein besonderes Anliegen. Wir verarbeiten
            deine Daten ausschließlich auf Grundlage der gesetzlichen Bestimmungen (DSGVO, DSG, TKG 2003).
            In dieser Datenschutzerklärung informieren wir dich über die wichtigsten Aspekte der
            Datenverarbeitung im Rahmen unserer Streaming-Plattform.
          </p>
        </Section>

        <Section title="2. Verantwortliche Stelle">
          <p style={textStyle}>
            Verantwortlich für die Datenverarbeitung auf dieser Website ist:
          </p>
          <div style={{ marginTop: '16px', padding: '16px 20px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <p style={{ ...textStyle, margin: 0, lineHeight: 2 }}>
              UncutTV GmbH<br />
              Kalchgruben 4/11<br />
              6094 Axams<br />
              E-Mail:{' '}
              <a href="mailto:office@uncuttv.at" style={{ color: 'var(--red)', textDecoration: 'none' }}>
                office@uncuttv.at
              </a>
            </p>
          </div>
        </Section>

        <Section title="3. Erhebung personenbezogener Daten">
          <p style={textStyle}>
            Bei der Nutzung unserer Streaming-Plattform erheben wir folgende personenbezogene Daten:
          </p>
          <ul style={listStyle}>
            <li><strong style={{ color: 'var(--warm-white)' }}>Registrierung:</strong> E-Mail-Adresse, Passwort (verschlüsselt)</li>
            <li><strong style={{ color: 'var(--warm-white)' }}>Altersverifikation:</strong> Ausweisdaten zur gesetzlich vorgeschriebenen Altersprüfung (18+)</li>
            <li><strong style={{ color: 'var(--warm-white)' }}>Zahlungsdaten:</strong> Kreditkarten- oder Bankdaten (werden ausschließlich über unseren Zahlungsdienstleister verarbeitet)</li>
            <li><strong style={{ color: 'var(--warm-white)' }}>Nutzungsdaten:</strong> Angesehene Inhalte, Wiedergabezeiten, Geräteinformationen</li>
            <li><strong style={{ color: 'var(--warm-white)' }}>Technische Daten:</strong> IP-Adresse, Browsertyp, Betriebssystem, Zugriffszeitpunkte</li>
          </ul>
          <p style={{ ...textStyle, marginTop: '12px' }}>
            Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung) und Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse)
          </p>
        </Section>

        <Section title="4. Altersverifikation (Veriff)">
          <p style={textStyle}>
            Zur gesetzlich vorgeschriebenen Altersverifikation (18+) setzen wir den Dienst Veriff ein.
            Dabei werden zur Überprüfung deiner Volljährigkeit Ausweisdaten und ein Lichtbild verarbeitet.
            Die Verarbeitung erfolgt ausschließlich zum Zweck der Altersverifizierung und wird nach
            erfolgreichem Abschluss nicht dauerhaft bei uns gespeichert.
          </p>
          <p style={{ ...textStyle, marginTop: '12px' }}>
            Anbieter: Veriff OÜ, Väike-Paala 2, 11415 Tallinn, Estland<br />
            Datenschutz: <a href="https://www.veriff.com/privacy-policy" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--red)', textDecoration: 'none' }}>www.veriff.com/privacy-policy</a>
          </p>
          <p style={{ ...textStyle, marginTop: '12px' }}>
            Rechtsgrundlage: Art. 6 Abs. 1 lit. c DSGVO (rechtliche Verpflichtung)
          </p>
        </Section>

        <Section title="5. Zahlungsabwicklung (Stripe)">
          <p style={textStyle}>
            Zahlungen werden über den Zahlungsdienstleister Stripe abgewickelt. Deine Zahlungsdaten
            (z. B. Kreditkartennummer) werden ausschließlich von Stripe verarbeitet und nicht auf
            unseren Servern gespeichert. Stripe ist PCI-DSS-zertifiziert.
          </p>
          <p style={{ ...textStyle, marginTop: '12px' }}>
            Anbieter: Stripe Payments Europe, Ltd., 1 Grand Canal Street Lower, Dublin 2, Irland<br />
            Datenschutz: <a href="https://stripe.com/de/privacy" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--red)', textDecoration: 'none' }}>stripe.com/de/privacy</a>
          </p>
          <p style={{ ...textStyle, marginTop: '12px' }}>
            Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung)
          </p>
        </Section>

        <Section title="6. Video-Streaming">
          <p style={textStyle}>
            Zur Auslieferung unserer Video-Inhalte nutzen wir einen professionellen Video-Infrastruktur-Anbieter.
            Dabei werden technische Daten wie IP-Adresse und Geräteinformationen zur Qualitätssicherung
            und Auslieferungsoptimierung verarbeitet. Videos sind ausschließlich für eingeloggte Nutzer
            mit aktivem Abonnement zugänglich und werden über signierte, zeitlich begrenzte URLs ausgeliefert.
          </p>
          <p style={{ ...textStyle, marginTop: '12px' }}>
            Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung)
          </p>
        </Section>

        <Section title="7. Hosting (Vercel & Supabase)">
          <p style={textStyle}>
            Unsere Plattform wird über Vercel (Vercel Inc., 340 Pine Street, Suite 900, San Francisco, CA 94104, USA)
            gehostet. Die Datenbank und Authentifizierung erfolgt über Supabase auf Servern in der EU
            (Frankfurt, eu-central-1). Mit beiden Anbietern bestehen Datenverarbeitungsverträge gemäß Art. 28 DSGVO.
          </p>
          <p style={{ ...textStyle, marginTop: '12px' }}>
            Rechtsgrundlage: Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse)
          </p>
        </Section>

        <Section title="8. Nutzungsdaten & Watchtime">
          <p style={textStyle}>
            Zur Abrechnung mit Filmemachern erfassen wir anonymisiert die Wiedergabedauer pro Film
            (Watchtime). Diese Daten werden ausschließlich intern für die Auszahlungsberechnung genutzt
            und nicht an Dritte weitergegeben.
          </p>
          <p style={{ ...textStyle, marginTop: '12px' }}>
            Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung)
          </p>
        </Section>

        <Section title="9. Cookies">
          <p style={textStyle}>
            Unsere Plattform verwendet technisch notwendige Cookies für die Authentifizierung und
            Sitzungsverwaltung. Diese Cookies sind für den Betrieb der Plattform zwingend erforderlich
            und können nicht deaktiviert werden.
          </p>
          <p style={{ ...textStyle, marginTop: '12px' }}>
            Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung) und Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse)
          </p>
        </Section>

        <Section title="10. Deine Rechte">
          <p style={{ ...textStyle, marginBottom: '12px' }}>
            Dir stehen gemäß DSGVO folgende Rechte zu:
          </p>
          <ul style={listStyle}>
            <li>Recht auf Auskunft (Art. 15 DSGVO)</li>
            <li>Recht auf Berichtigung (Art. 16 DSGVO)</li>
            <li>Recht auf Löschung (Art. 17 DSGVO)</li>
            <li>Recht auf Einschränkung der Verarbeitung (Art. 18 DSGVO)</li>
            <li>Recht auf Datenübertragbarkeit (Art. 20 DSGVO)</li>
            <li>Recht auf Widerspruch (Art. 21 DSGVO)</li>
            <li>Recht auf Widerruf einer Einwilligung (Art. 7 Abs. 3 DSGVO)</li>
          </ul>
          <p style={{ ...textStyle, marginTop: '12px' }}>
            Zur Ausübung deiner Rechte wende dich an:{' '}
            <a href="mailto:office@uncuttv.at" style={{ color: 'var(--red)', textDecoration: 'none' }}>
              office@uncuttv.at
            </a>
          </p>
        </Section>

        <Section title="11. Aufsichtsbehörde">
          <p style={textStyle}>
            Österreichische Datenschutzbehörde<br />
            Barichgasse 40–42, 1030 Wien<br />
            <a href="https://www.dsb.gv.at" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--red)', textDecoration: 'none' }}>
              www.dsb.gv.at
            </a>
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
          <Link href="/de/agb" style={{ fontSize: '0.78rem', color: 'var(--grey)', textDecoration: 'none' }}>
            AGB
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
