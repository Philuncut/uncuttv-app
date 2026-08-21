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
          Stand: 21. August 2026
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

          <h3 style={subheadStyle}>4.1 Testphase</h3>
          <ul style={listStyle}>
            <li>7 Tage kostenlose Testphase für Neukunden</li>
          </ul>

          <h3 style={subheadStyle}>4.2 Preise</h3>
          <ul style={listStyle}>
            <li>Nach Ablauf der Testphase: €19,90 pro Monat</li>
            <li>Jahresabo: €200,00 pro Jahr</li>
            <li>Alle Preise inkl. gesetzlicher MwSt.</li>
          </ul>

          <h3 style={subheadStyle}>4.3 Laufzeit und Verlängerung</h3>
          <ul style={listStyle}>
            <li>
              Monatsabo: monatlich kündbar, keine Mindestlaufzeit. Jahresabo: feste Laufzeit
              von zwölf Monaten, siehe Ziffer 4.5.
            </li>
            <li>
              Monatsabo: automatische Verlängerung um jeweils einen Monat. Jahresabo: siehe
              Ziffer 4.5.
            </li>
          </ul>

          <h3 style={subheadStyle}>4.4 Preisänderungen</h3>
          <p style={textStyle}>
            Preisänderungen werden mindestens 30 Tage im Voraus per E-Mail angekündigt.
          </p>

          <h3 style={subheadStyle}>4.5 Laufzeit und Kündigung des Jahresabos</h3>
          <p style={textStyle}>
            Das Jahresabo wird für eine feste Laufzeit von zwölf Monaten abgeschlossen. Das
            Entgelt von 200,00 € ist für die gesamte Laufzeit im Voraus zu entrichten. Eine
            ordentliche Kündigung während der Laufzeit ist ausgeschlossen.
          </p>
          <p style={{ ...textStyle, marginTop: '12px' }}>
            Du kannst das Jahresabo spätestens einen Monat vor Ablauf der zwölf Monate zum
            Laufzeitende kündigen. Kündigst du nicht, verlängert sich das Abonnement auf
            unbestimmte Zeit und kann von dir jederzeit mit einer Frist von einem Monat
            gekündigt werden. Nach der Verlängerung erfolgt die Abrechnung monatlich zum
            jeweils gültigen Monatspreis.
          </p>
          <p style={{ ...textStyle, marginTop: '12px' }}>
            Dein gesetzliches Rücktrittsrecht bleibt hiervon unberührt.
          </p>
        </Section>

        <Section title="5. Zahlung">
          <p style={textStyle}>
            Die Zahlung erfolgt im Voraus – beim Monatsabo monatlich, beim Jahresabo für die
            gesamte Laufzeit von zwölf Monaten – per Kreditkarte oder SEPA-Lastschrift über
            unseren Zahlungsdienstleister Stripe. Bei fehlgeschlagener Zahlung behalten wir uns
            vor, den Zugang zur Plattform vorübergehend zu sperren. Stripe versucht die Zahlung
            in diesem Fall automatisch erneut.
          </p>
        </Section>

        <Section title="6. Kündigung">
          <p style={textStyle}>
            Das Abonnement kann jederzeit zum Ende des laufenden Abrechnungszeitraums gekündigt
            werden. Für das Jahresabo gilt abweichend Ziffer 4.5. Die Kündigung erfolgt über den
            Bereich „Mein Konto" auf der Plattform.
            Nach der Kündigung hast du bis zum Ende des bezahlten Zeitraums weiterhin Zugang
            zu allen Inhalten.
          </p>
        </Section>

        <Section title="7. Rücktrittsrecht (Widerrufsrecht)">
          <h3 style={subheadStyle}>7.1 Rücktrittsrecht</h3>
          <p style={textStyle}>
            Du hast das Recht, binnen vierzehn Tagen ohne Angabe von Gründen von diesem
            Vertrag zurückzutreten. Die Rücktrittsfrist beträgt vierzehn Tage ab dem Tag
            des Vertragsabschlusses.
          </p>

          <h3 style={subheadStyle}>7.2 Ausübung des Rücktrittsrechts</h3>
          <p style={textStyle}>
            Um dein Rücktrittsrecht auszuüben, musst du uns mittels einer eindeutigen
            Erklärung über deinen Entschluss, von diesem Vertrag zurückzutreten, informieren.
            Die Erklärung kannst du per E-Mail oder Post an uns richten:
          </p>
          <p style={addressStyle}>
            UncutTV GmbH<br />
            Kalchgruben 4/11<br />
            6094 Axams<br />
            Österreich<br />
            E-Mail:{' '}
            <a href="mailto:office@uncuttv.at" style={{ color: 'var(--red)', textDecoration: 'none' }}>
              office@uncuttv.at
            </a>
          </p>
          <p style={{ ...textStyle, marginTop: '12px' }}>
            Du kannst dafür das unten stehende Muster-Rücktrittsformular verwenden, das jedoch
            nicht vorgeschrieben ist. Zur Wahrung der Rücktrittsfrist reicht es aus, dass du die
            Mitteilung über die Ausübung des Rücktrittsrechts vor Ablauf der Rücktrittsfrist
            absendest.
          </p>

          <h3 style={subheadStyle}>7.3 Vorzeitiges Erlöschen des Rücktrittsrechts</h3>
          <p style={textStyle}>
            Bei Verträgen über die Bereitstellung digitaler Inhalte und digitaler
            Dienstleistungen erlischt dein Rücktrittsrecht vorzeitig, wenn
          </p>
          <ul style={listStyle}>
            <li>
              du ausdrücklich verlangt hast, dass wir mit der Vertragserfüllung vor Ablauf
              der Rücktrittsfrist beginnen,
            </li>
            <li>du zur Kenntnis genommen hast, dass du dadurch dein Rücktrittsrecht verlierst, und</li>
            <li>wir mit der Vertragserfüllung begonnen haben.</li>
          </ul>
          <p style={{ ...textStyle, marginTop: '12px' }}>
            Beide Erklärungen holen wir im Bestellvorgang ausdrücklich von dir ein und
            bestätigen sie dir zusammen mit der Vertragsbestätigung.
          </p>

          <h3 style={subheadStyle}>7.4 Folgen des Rücktritts</h3>
          <p style={textStyle}>
            Wenn du von diesem Vertrag zurücktrittst, erstatten wir dir alle Zahlungen, die wir
            von dir erhalten haben, unverzüglich und spätestens binnen vierzehn Tagen ab dem Tag,
            an dem die Mitteilung über deinen Rücktritt bei uns eingegangen ist. Für die
            Rückzahlung verwenden wir dasselbe Zahlungsmittel, das du bei der ursprünglichen
            Transaktion eingesetzt hast, es sei denn, es wurde ausdrücklich etwas anderes
            vereinbart. In keinem Fall werden dir wegen der Rückzahlung Entgelte berechnet.
          </p>
          <p style={{ ...textStyle, marginTop: '12px' }}>
            Hast du verlangt, dass die Dienstleistung während der Rücktrittsfrist beginnen soll,
            so hast du uns einen angemessenen Betrag zu zahlen, der dem Anteil der bis zum
            Zeitpunkt deines Rücktritts bereits erbrachten Leistungen im Vergleich zum
            Gesamtumfang der vertraglich vereinbarten Leistungen entspricht.
          </p>

          <div style={formBoxStyle}>
            <div style={formTitleStyle}>Muster-Rücktrittsformular</div>
            <p style={{ ...textStyle, fontStyle: 'italic', marginBottom: '16px' }}>
              (Wenn du den Vertrag widerrufen willst, fülle bitte dieses Formular aus und sende
              es zurück.)
            </p>
            <p style={textStyle}>
              An: UncutTV GmbH, Kalchgruben 4/11, 6094 Axams, Österreich<br />
              E-Mail:{' '}
              <a href="mailto:office@uncuttv.at" style={{ color: 'var(--red)', textDecoration: 'none' }}>
                office@uncuttv.at
              </a>
            </p>
            <p style={{ ...textStyle, marginTop: '16px' }}>
              Hiermit trete ich / treten wir (*) von dem von mir / uns (*) abgeschlossenen
              Vertrag über die Erbringung der folgenden Dienstleistung zurück:
            </p>
            <div style={{ marginTop: '16px' }}>
              <div style={formFieldStyle}>Bestellt am (*) / erhalten am (*):</div>
              <div style={formFieldStyle}>Name des / der Verbraucher(s):</div>
              <div style={formFieldStyle}>Anschrift des / der Verbraucher(s):</div>
              <div style={formFieldStyle}>
                Unterschrift des / der Verbraucher(s) (nur bei Mitteilung auf Papier):
              </div>
              <div style={formFieldStyle}>Datum:</div>
            </div>
            <p style={{ ...textStyle, fontSize: '0.78rem', marginTop: '16px' }}>
              (*) Unzutreffendes streichen.
            </p>
          </div>
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

const subheadStyle: React.CSSProperties = {
  fontSize: '0.8rem',
  fontWeight: 700,
  letterSpacing: '0.06em',
  color: 'var(--warm-white)',
  margin: '24px 0 8px 0',
}

const addressStyle: React.CSSProperties = {
  fontSize: '0.88rem',
  color: 'var(--grey-light)',
  lineHeight: 1.8,
  margin: '12px 0 0 0',
  paddingLeft: '16px',
  borderLeft: '2px solid rgba(255,255,255,0.12)',
}

const formBoxStyle: React.CSSProperties = {
  marginTop: '28px',
  padding: '24px',
  border: '1px solid rgba(255,255,255,0.12)',
  background: 'rgba(255,255,255,0.03)',
}

const formTitleStyle: React.CSSProperties = {
  fontSize: '0.72rem',
  letterSpacing: '0.15em',
  textTransform: 'uppercase',
  color: 'var(--red)',
  marginBottom: '12px',
}

const formFieldStyle: React.CSSProperties = {
  fontSize: '0.88rem',
  color: 'var(--grey-light)',
  lineHeight: 1.8,
  paddingBottom: '6px',
  marginBottom: '14px',
  borderBottom: '1px solid rgba(255,255,255,0.14)',
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