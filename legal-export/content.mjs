/**
 * 1:1 extrahiert aus:
 * - src/app/de/agb/page.tsx
 * - src/app/de/datenschutz/page.tsx
 *
 * Keine dynamischen Variablen – alle Werte sind statisch im Quellcode.
 */

export const AGB = {
  title: 'AGB',
  subtitle: 'Allgemeine Geschäftsbedingungen der UncutTV GmbH',
  stand: 'Stand: 21. August 2026',
  sections: [
    {
      title: '1. Geltungsbereich',
      blocks: [
        {
          type: 'p',
          text: 'Diese Allgemeinen Geschäftsbedingungen gelten für die Nutzung der Streaming-Plattform UncutTV, betrieben von der UncutTV GmbH, Kalchgruben 4/11, 6094 Axams, Österreich (nachfolgend „UncutTV"). Mit der Registrierung und Nutzung der Plattform akzeptierst du diese AGB.',
        },
      ],
    },
    {
      title: '2. Leistungsbeschreibung',
      blocks: [
        {
          type: 'p',
          text: 'UncutTV ist eine Streaming-Plattform für Independent-Film, spezialisiert auf Horror- und Extremkino. Das Angebot richtet sich ausschließlich an Personen ab 18 Jahren mit Wohnsitz im DACH-Raum (Deutschland, Österreich, Schweiz). UncutTV stellt Nutzern gegen Entgelt Zugang zu einem Filmkatalog zur Verfügung. Ein Anspruch auf bestimmte Inhalte oder deren dauerhafte Verfügbarkeit besteht nicht.',
        },
      ],
    },
    {
      title: '3. Registrierung & Altersverifikation',
      blocks: [
        {
          type: 'p',
          text: 'Zur Nutzung von UncutTV ist eine Registrierung sowie eine erfolgreiche Altersverifikation (18+) erforderlich. Die Altersverifikation erfolgt über einen zertifizierten Drittanbieter. Ohne abgeschlossene Altersverifikation ist kein Zugang zu kostenpflichtigen Inhalten möglich. Du bist verpflichtet, bei der Registrierung wahrheitsgemäße Angaben zu machen.',
        },
      ],
    },
    {
      title: '4. Abonnement & Preise',
      blocks: [
        {
          type: 'p',
          text: 'Die Nutzung von UncutTV erfolgt im Abonnement. Es gelten folgende Konditionen:',
        },
        { type: 'h3', text: '4.1 Testphase' },
        {
          type: 'ul',
          items: ['7 Tage kostenlose Testphase für Neukunden'],
        },
        { type: 'h3', text: '4.2 Preise' },
        {
          type: 'ul',
          items: [
            'Nach Ablauf der Testphase: €19,90 pro Monat',
            'Jahresabo: €200,00 pro Jahr',
            'Alle Preise inkl. gesetzlicher MwSt.',
          ],
        },
        { type: 'h3', text: '4.3 Laufzeit und Verlängerung' },
        {
          type: 'ul',
          items: [
            'Monatsabo: monatlich kündbar, keine Mindestlaufzeit. Jahresabo: feste Laufzeit von zwölf Monaten, siehe Ziffer 4.5.',
            'Monatsabo: automatische Verlängerung um jeweils einen Monat. Jahresabo: siehe Ziffer 4.5.',
          ],
        },
        { type: 'h3', text: '4.4 Preisänderungen' },
        {
          type: 'p',
          text: 'Preisänderungen werden mindestens 30 Tage im Voraus per E-Mail angekündigt.',
        },
        { type: 'h3', text: '4.5 Laufzeit und Kündigung des Jahresabos' },
        {
          type: 'p',
          text: 'Das Jahresabo wird für eine feste Laufzeit von zwölf Monaten abgeschlossen. Das Entgelt von 200,00 € ist für die gesamte Laufzeit im Voraus zu entrichten. Eine ordentliche Kündigung während der Laufzeit ist ausgeschlossen.',
        },
        {
          type: 'p',
          text: 'Du kannst das Jahresabo spätestens einen Monat vor Ablauf der zwölf Monate zum Laufzeitende kündigen. Kündigst du nicht, verlängert sich das Abonnement auf unbestimmte Zeit und kann von dir jederzeit mit einer Frist von einem Monat gekündigt werden. Nach der Verlängerung erfolgt die Abrechnung monatlich zum jeweils gültigen Monatspreis.',
        },
        {
          type: 'p',
          text: 'Dein gesetzliches Rücktrittsrecht bleibt hiervon unberührt.',
        },
      ],
    },
    {
      title: '5. Zahlung',
      blocks: [
        {
          type: 'p',
          text: 'Die Zahlung erfolgt im Voraus – beim Monatsabo monatlich, beim Jahresabo für die gesamte Laufzeit von zwölf Monaten – per Kreditkarte oder SEPA-Lastschrift über unseren Zahlungsdienstleister Stripe. Bei fehlgeschlagener Zahlung behalten wir uns vor, den Zugang zur Plattform vorübergehend zu sperren. Stripe versucht die Zahlung in diesem Fall automatisch erneut.',
        },
      ],
    },
    {
      title: '6. Kündigung',
      blocks: [
        {
          type: 'p',
          text: 'Das Abonnement kann jederzeit zum Ende des laufenden Abrechnungszeitraums gekündigt werden. Für das Jahresabo gilt abweichend Ziffer 4.5. Die Kündigung erfolgt über den Bereich „Mein Konto" auf der Plattform. Nach der Kündigung hast du bis zum Ende des bezahlten Zeitraums weiterhin Zugang zu allen Inhalten.',
        },
      ],
    },
    {
      title: '7. Rücktrittsrecht (Widerrufsrecht)',
      blocks: [
        { type: 'h3', text: '7.1 Rücktrittsrecht' },
        {
          type: 'p',
          text: 'Du hast das Recht, binnen vierzehn Tagen ohne Angabe von Gründen von diesem Vertrag zurückzutreten. Die Rücktrittsfrist beträgt vierzehn Tage ab dem Tag des Vertragsabschlusses.',
        },
        { type: 'h3', text: '7.2 Ausübung des Rücktrittsrechts' },
        {
          type: 'p',
          text: 'Um dein Rücktrittsrecht auszuüben, musst du uns mittels einer eindeutigen Erklärung über deinen Entschluss, von diesem Vertrag zurückzutreten, informieren. Die Erklärung kannst du per E-Mail oder Post an uns richten:',
        },
        {
          type: 'box',
          lines: [
            'UncutTV GmbH',
            'Kalchgruben 4/11',
            '6094 Axams',
            'Österreich',
            'E-Mail: office@uncuttv.at',
          ],
        },
        {
          type: 'p',
          text: 'Du kannst dafür das unten stehende Muster-Rücktrittsformular verwenden, das jedoch nicht vorgeschrieben ist. Zur Wahrung der Rücktrittsfrist reicht es aus, dass du die Mitteilung über die Ausübung des Rücktrittsrechts vor Ablauf der Rücktrittsfrist absendest.',
        },
        { type: 'h3', text: '7.3 Vorzeitiges Erlöschen des Rücktrittsrechts' },
        {
          type: 'p',
          text: 'Bei Verträgen über die Bereitstellung digitaler Inhalte und digitaler Dienstleistungen erlischt dein Rücktrittsrecht vorzeitig, wenn',
        },
        {
          type: 'ul',
          items: [
            'du ausdrücklich verlangt hast, dass wir mit der Vertragserfüllung vor Ablauf der Rücktrittsfrist beginnen,',
            'du zur Kenntnis genommen hast, dass du dadurch dein Rücktrittsrecht verlierst, und',
            'wir mit der Vertragserfüllung begonnen haben.',
          ],
        },
        {
          type: 'p',
          text: 'Beide Erklärungen holen wir im Bestellvorgang ausdrücklich von dir ein und bestätigen sie dir zusammen mit der Vertragsbestätigung.',
        },
        { type: 'h3', text: '7.4 Folgen des Rücktritts' },
        {
          type: 'p',
          text: 'Wenn du von diesem Vertrag zurücktrittst, erstatten wir dir alle Zahlungen, die wir von dir erhalten haben, unverzüglich und spätestens binnen vierzehn Tagen ab dem Tag, an dem die Mitteilung über deinen Rücktritt bei uns eingegangen ist. Für die Rückzahlung verwenden wir dasselbe Zahlungsmittel, das du bei der ursprünglichen Transaktion eingesetzt hast, es sei denn, es wurde ausdrücklich etwas anderes vereinbart. In keinem Fall werden dir wegen der Rückzahlung Entgelte berechnet.',
        },
        {
          type: 'p',
          text: 'Hast du verlangt, dass die Dienstleistung während der Rücktrittsfrist beginnen soll, so hast du uns einen angemessenen Betrag zu zahlen, der dem Anteil der bis zum Zeitpunkt deines Rücktritts bereits erbrachten Leistungen im Vergleich zum Gesamtumfang der vertraglich vereinbarten Leistungen entspricht.',
        },
        {
          type: 'box',
          lines: [
            'Muster-Rücktrittsformular',
            '',
            '(Wenn du den Vertrag widerrufen willst, fülle bitte dieses Formular aus und sende es zurück.)',
            '',
            'An: UncutTV GmbH, Kalchgruben 4/11, 6094 Axams, Österreich',
            'E-Mail: office@uncuttv.at',
            '',
            'Hiermit trete ich / treten wir (*) von dem von mir / uns (*) abgeschlossenen Vertrag über die Erbringung der folgenden Dienstleistung zurück:',
            '',
            'Bestellt am (*) / erhalten am (*):',
            'Name des / der Verbraucher(s):',
            'Anschrift des / der Verbraucher(s):',
            'Unterschrift des / der Verbraucher(s) (nur bei Mitteilung auf Papier):',
            'Datum:',
            '',
            '(*) Unzutreffendes streichen.',
          ],
        },
      ],
    },
    {
      title: '8. Nutzungsrechte',
      blocks: [
        {
          type: 'p',
          text: 'Mit dem aktiven Abonnement erhältst du ein nicht-übertragbares, nicht-exklusives Recht zur privaten Nutzung der Inhalte. Jegliche Aufzeichnung, Vervielfältigung, Weitergabe oder öffentliche Wiedergabe der Inhalte ist untersagt. Das Teilen von Zugangsdaten ist nicht gestattet.',
        },
      ],
    },
    {
      title: '9. Jugendschutz & erlaubte Inhalte',
      blocks: [
        {
          type: 'p',
          text: 'UncutTV richtet sich ausschließlich an Erwachsene ab 18 Jahren. Das Angebot enthält Inhalte, die explizite Gewalt, Horror und extremes Kino umfassen können. Du bestätigst mit der Registrierung, volljährig zu sein und solche Inhalte legal konsumieren zu dürfen. Minderjährigen ist der Zugang strikt untersagt.',
        },
      ],
    },
    {
      title: '10. Geo-Blocking',
      blocks: [
        {
          type: 'p',
          text: 'Einige Inhalte können aufgrund von Lizenzbestimmungen in bestimmten Ländern nicht verfügbar sein. UncutTV ist ein österreichischer Dienst und primär für den DACH-Markt ausgerichtet. Einzelne Titel können in Deutschland eingeschränkt sein.',
        },
      ],
    },
    {
      title: '11. Haftungsbeschränkung',
      blocks: [
        {
          type: 'p',
          text: 'UncutTV übernimmt keine Haftung für die vorübergehende Nichtverfügbarkeit der Plattform aufgrund von Wartungsarbeiten oder technischen Störungen. Eine Haftung für mittelbare Schäden oder entgangenen Gewinn ist ausgeschlossen, soweit gesetzlich zulässig.',
        },
      ],
    },
    {
      title: '12. Änderungen der AGB',
      blocks: [
        {
          type: 'p',
          text: 'UncutTV behält sich vor, diese AGB jederzeit zu ändern. Über wesentliche Änderungen wirst du per E-Mail informiert. Widersprichst du den neuen AGB nicht innerhalb von 30 Tagen nach Bekanntgabe, gelten sie als akzeptiert.',
        },
      ],
    },
    {
      title: '13. Anwendbares Recht & Gerichtsstand',
      blocks: [
        {
          type: 'p',
          text: 'Es gilt österreichisches Recht unter Ausschluss des UN-Kaufrechts. Gerichtsstand für Streitigkeiten mit Unternehmern ist Innsbruck, Österreich. Für Verbraucher gilt der gesetzliche Gerichtsstand.',
        },
      ],
    },
  ],
}

export const DATENSCHUTZ = {
  title: 'DATENSCHUTZ',
  stand: 'Stand: 22. August 2026',
  sections: [
    {
      title: '1. Allgemeine Hinweise',
      blocks: [
        {
          type: 'p',
          text: 'Der Schutz deiner personenbezogenen Daten ist uns ein besonderes Anliegen. Wir verarbeiten deine Daten ausschließlich auf Grundlage der gesetzlichen Bestimmungen (DSGVO, DSG, TKG 2003). In dieser Datenschutzerklärung informieren wir dich über die wichtigsten Aspekte der Datenverarbeitung im Rahmen unserer Streaming-Plattform.',
        },
      ],
    },
    {
      title: '2. Verantwortliche Stelle',
      blocks: [
        {
          type: 'p',
          text: 'Verantwortlich für die Datenverarbeitung auf dieser Website ist:',
        },
        {
          type: 'box',
          lines: [
            'UncutTV GmbH',
            'Kalchgruben 4/11',
            '6094 Axams',
            'E-Mail: office@uncuttv.at',
          ],
        },
      ],
    },
    {
      title: '3. Erhebung personenbezogener Daten',
      blocks: [
        {
          type: 'p',
          text: 'Bei der Nutzung unserer Streaming-Plattform erheben wir folgende personenbezogene Daten:',
        },
        {
          type: 'ul',
          items: [
            'Registrierung: E-Mail-Adresse, Passwort (verschlüsselt)',
            'Altersverifikation: Ausweisdaten zur gesetzlich vorgeschriebenen Altersprüfung (18+)',
            'Zahlungsdaten: Kreditkarten- oder Bankdaten (werden ausschließlich über unseren Zahlungsdienstleister verarbeitet)',
            'Nutzungsdaten: Angesehene Inhalte, Wiedergabezeiten, Geräteinformationen',
            'Technische Daten: IP-Adresse, Browsertyp, Betriebssystem, Zugriffszeitpunkte',
          ],
        },
        {
          type: 'p',
          text: 'Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung) und Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse)',
        },
      ],
    },
    {
      title: '4. Altersverifikation (Veriff)',
      blocks: [
        {
          type: 'p',
          text: 'Zur gesetzlich vorgeschriebenen Altersverifikation (18+) setzen wir den Dienst Veriff ein. Dabei werden zur Überprüfung deiner Volljährigkeit Ausweisdaten und ein Lichtbild verarbeitet. Die Verarbeitung erfolgt ausschließlich zum Zweck der Altersverifizierung und wird nach erfolgreichem Abschluss nicht dauerhaft bei uns gespeichert.',
        },
        {
          type: 'p',
          text: 'Anbieter: Veriff OÜ, Väike-Paala 2, 11415 Tallinn, Estland',
        },
        {
          type: 'p',
          text: 'Datenschutz: www.veriff.com/privacy-policy',
        },
        {
          type: 'p',
          text: 'Rechtsgrundlage: Art. 6 Abs. 1 lit. c DSGVO (rechtliche Verpflichtung)',
        },
      ],
    },
    {
      title: '5. Zahlungsabwicklung (Stripe)',
      blocks: [
        {
          type: 'p',
          text: 'Zahlungen werden über den Zahlungsdienstleister Stripe abgewickelt. Deine Zahlungsdaten (z. B. Kreditkartennummer) werden ausschließlich von Stripe verarbeitet und nicht auf unseren Servern gespeichert. Stripe ist PCI-DSS-zertifiziert.',
        },
        {
          type: 'p',
          text: 'Anbieter: Stripe Payments Europe, Ltd., 1 Grand Canal Street Lower, Dublin 2, Irland',
        },
        {
          type: 'p',
          text: 'Datenschutz: stripe.com/de/privacy',
        },
        {
          type: 'p',
          text: 'Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung)',
        },
      ],
    },
    {
      title: '6. Video-Streaming',
      blocks: [
        {
          type: 'p',
          text: 'Zur Auslieferung unserer Video-Inhalte nutzen wir einen professionellen Video-Infrastruktur-Anbieter. Dabei werden technische Daten wie IP-Adresse und Geräteinformationen zur Qualitätssicherung und Auslieferungsoptimierung verarbeitet. Videos sind ausschließlich für eingeloggte Nutzer mit aktivem Abonnement zugänglich und werden über signierte, zeitlich begrenzte URLs ausgeliefert.',
        },
        {
          type: 'p',
          text: 'Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung)',
        },
      ],
    },
    {
      title: '7. Hosting (Vercel & Supabase)',
      blocks: [
        {
          type: 'p',
          text: 'Unsere Plattform wird über Vercel (Vercel Inc., 340 Pine Street, Suite 900, San Francisco, CA 94104, USA) gehostet. Die Datenbank und Authentifizierung erfolgt über Supabase auf Servern in der EU (Frankfurt, eu-central-1). Mit beiden Anbietern bestehen Datenverarbeitungsverträge gemäß Art. 28 DSGVO.',
        },
        {
          type: 'p',
          text: 'Rechtsgrundlage: Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse)',
        },
      ],
    },
    {
      title: '8. Nutzungsdaten & Watchtime',
      blocks: [
        {
          type: 'p',
          text: 'Wir speichern die Wiedergabedauer und die zuletzt erreichte Abspielposition je Film. Diese Angaben sind mit deinem Nutzerkonto verknüpft.',
        },
        {
          type: 'p',
          text: 'Sie dienen zwei Zwecken: der Funktion „Weiterschauen", damit du einen Film dort fortsetzen kannst, wo du ihn verlassen hast, und der Abrechnung mit den Rechteinhabern, deren Filme im Katalog stehen.',
        },
        {
          type: 'p',
          text: 'An Rechteinhaber geben wir ausschließlich je Film summierte Werte weiter. Nutzerbezogene Daten werden dabei nicht übermittelt.',
        },
        {
          type: 'p',
          text: 'Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung)',
        },
      ],
    },
    {
      title: '9. Cookies',
      blocks: [
        {
          type: 'p',
          text: 'Unsere Plattform verwendet technisch notwendige Cookies für die Authentifizierung und Sitzungsverwaltung. Diese Cookies sind für den Betrieb der Plattform zwingend erforderlich und können nicht deaktiviert werden.',
        },
        {
          type: 'p',
          text: 'Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung) und Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse)',
        },
      ],
    },
    {
      title: '10. Deine Rechte',
      blocks: [
        {
          type: 'p',
          text: 'Dir stehen gemäß DSGVO folgende Rechte zu:',
        },
        {
          type: 'ul',
          items: [
            'Recht auf Auskunft (Art. 15 DSGVO)',
            'Recht auf Berichtigung (Art. 16 DSGVO)',
            'Recht auf Löschung (Art. 17 DSGVO)',
            'Recht auf Einschränkung der Verarbeitung (Art. 18 DSGVO)',
            'Recht auf Datenübertragbarkeit (Art. 20 DSGVO)',
            'Recht auf Widerspruch (Art. 21 DSGVO)',
            'Recht auf Widerruf einer Einwilligung (Art. 7 Abs. 3 DSGVO)',
          ],
        },
        {
          type: 'p',
          text: 'Zur Ausübung deiner Rechte wende dich an: office@uncuttv.at',
        },
      ],
    },
    {
      title: '11. Aufsichtsbehörde',
      blocks: [
        {
          type: 'box',
          lines: [
            'Österreichische Datenschutzbehörde',
            'Barichgasse 40–42, 1030 Wien',
            'www.dsb.gv.at',
          ],
        },
      ],
    },
  ],
}
