import { getTranslations } from 'next-intl/server'

/**
 * Durchlaufende Logoleiste der Labels, deren Filme im Katalog sind.
 *
 * === Neues Logo ergaenzen ===
 * 1. Rohdatei nach  assets/label-logos-original/  legen (liegt ausserhalb von
 *    public/, wird also nicht ausgeliefert -- das ist nur das Archiv).
 * 2. Aufbereiten:
 *      node scripts/prepare-label-logo.mjs <quelle> public/labels/<name>.png <modus>
 *    Modus: cut (schon freigestellt) | lum (helles Motiv auf dunklem Grund) |
 *    inv (dunkles Motiv auf hellem Grund). Das Skript faerbt weiss, schneidet
 *    den Rand ab und verkleinert die Datei.
 * 3. Unten in LABELS eine Zeile ergaenzen. Das ist die einzige Stelle im Code,
 *    an der Logos stehen -- es gibt keine verstreuten Importe.
 *
 * === Was die Leiste von einer Datei erwartet ===
 * SVG oder PNG, in beiden Faellen freigestellt: die Deckung muss das Motiv
 * beschreiben und sonst nichts. Die Leiste faerbt jedes Logo weiss (siehe
 * .label-marquee-logo in globals.css), eine deckende Flaeche hinter dem Logo
 * wird dabei zum weissen Block und die Schrift darin verschwindet. Genau
 * daran sind zwei der ersten fuenf Lieferungen gescheitert. Ein JPG kann es
 * deshalb grundsaetzlich nicht sein.
 *
 * Nicht umrechenbar sind Logos, deren Motiv mal heller und mal dunkler als
 * sein Untergrund ist -- ein Schriftzug etwa, der ueber eine zweifarbige
 * Flaeche laeuft. Dafuer braucht es eine einfarbige Fassung vom Label.
 *
 * Hoehe der Datei: egal, die Leiste setzt die Darstellungshoehe und rechnet
 * die Breite aus dem Seitenverhaeltnis. 150 bis 250 px Motivhoehe reichen.
 *
 * Serverkomponente wie FilmmakersSection: kein Zustand, kein Breakpoint in
 * JavaScript, die Bewegung macht allein CSS. Fuer diesen Abschnitt geht damit
 * kein Javascript an den Browser.
 */

interface Label {
  /** Erscheint als Alternativtext -- der Name, nicht "Logo von ..." */
  name: string
  /** Dateiname in public/labels/ */
  file: string
  /**
   * Feinabgleich der Hoehe, 1 = wie alle anderen. Nur dort vom Standard
   * abweichen, wo ein Logo neben den uebrigen sonst zu klein oder zu wuchtig
   * wirkt -- gestapelte Logos brauchen mehr Hoehe als einzeilige Schriftzuege,
   * weil ihre Schrift sich die Hoehe mit dem Bildzeichen teilt.
   */
  scale?: number
}

const LABELS: Label[] = [
  { name: 'Unearthed Films', file: 'unearthed.png' },
  // Gestapelt: Zeichnung ueber Schriftzug, beides auf 160 px Breite. Auf
  // Einheitshoehe waere die Schrift darunter nicht mehr zu lesen.
  { name: 'RW Films', file: 'renewiesnerfilms.png', scale: 1.25 },

  // Noch nicht aufgenommen -- die gelieferten Dateien sind Werbebilder, keine
  // Logos, und lassen sich nicht in eine einfarbige Fassung umrechnen. Beide
  // liegen unter assets/label-logos-original/. Sobald es weisse, freigestellte
  // Fassungen gibt, hier eintragen:
  // { name: 'Illusions Unltd. Films', file: 'illusions.png' },
  // { name: 'New Films Order', file: 'new_films_order.png' },
]

/**
 * Das Band besteht aus zwei gleichen Durchlaeufen und wandert um genau die
 * halbe Spurbreite -- in dem Moment steht Durchlauf zwei exakt dort, wo
 * Durchlauf eins begonnen hat, und die Wiederholung ist nahtlos.
 *
 * Damit rechts nichts fehlt, muss ein Durchlauf mindestens so breit sein wie
 * das Fenster. Das kann die Anzahl der Logos allein nicht sichern: Hoehe und
 * Abstand sind durch clamp() nach oben gedeckelt, ein Durchlauf hoert also ab
 * etwa 1470 px Fensterbreite auf mitzuwachsen, waehrend das Fenster weiter
 * waechst. Auf einem grossen Schirm liefe die Leiste sonst leer. Jeder
 * Durchlauf hat deshalb min-width: 100vw (siehe .label-marquee-run) und
 * verteilt ueberschuessigen Platz mit space-around -- das ist die einzige
 * Verteilung, bei der der Abstand ueber die Nahtstelle hinweg derselbe bleibt
 * wie innerhalb des Durchlaufs.
 *
 * MIN_ITEMS_PER_RUN regelt daneben nur noch die Dichte: mit zwei Labels stuenden
 * sonst zwei Logos allein auf der ganzen Breite und es saehe leer aus statt
 * nach einem Band. Ein Durchlauf enthaelt die Liste deshalb so oft, bis er
 * mindestens so viele Logos hat -- bei zwei Labels also achtmal.
 */
const MIN_ITEMS_PER_RUN = 16

/** Sekunden, die ein Logo fuer die volle Bandbreite braucht. Kleiner = schneller. */
const SECONDS_PER_LOGO = 6

export default async function LabelMarquee() {
  const t = await getTranslations('labels')

  if (LABELS.length === 0) return null

  const repeats = Math.max(1, Math.ceil(MIN_ITEMS_PER_RUN / LABELS.length))
  const run = Array.from({ length: repeats }, () => LABELS).flat()

  // Beide Durchlaeufe sind Zeichen fuer Zeichen gleich -- nur deshalb geht die
  // Verschiebung um die halbe Spurbreite ohne Sprung auf.
  const renderRun = (runIndex: number) => (
    <div className="label-marquee-run" key={runIndex}>
      {run.map((label, i) => {
        // Nur der erste Satz im ersten Durchlauf traegt den Namen. Alle
        // Wiederholungen sind fuer Vorlesewerkzeuge stumm, sonst haette man
        // jedes Label sechzehnmal.
        const isOriginal = runIndex === 0 && i < LABELS.length
        return (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={i}
            className="label-marquee-logo"
            src={`/labels/${label.file}`}
            alt={isOriginal ? label.name : ''}
            aria-hidden={isOriginal ? undefined : true}
            style={label.scale ? { height: `calc(var(--label-height) * ${label.scale})` } : undefined}
            loading="lazy"
            decoding="async"
            draggable={false}
          />
        )
      })}
    </div>
  )

  return (
    <section className="label-marquee-section" aria-label={t('aria')}>
      <div className="label-marquee-eyebrow">
        <span>{t('eyebrow')}</span>
      </div>

      <div className="label-marquee">
        <div
          className="label-marquee-track"
          /* Dauer aus der Anzahl, damit das Band unabhaengig von der Zahl der
             Logos gleich schnell laeuft. Die Bewegung selbst macht CSS. */
          style={{ ['--marquee-duration' as string]: `${run.length * SECONDS_PER_LOGO}s` }}
        >
          {renderRun(0)}
          {renderRun(1)}
        </div>
      </div>
    </section>
  )
}
