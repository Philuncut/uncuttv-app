import { getTranslations } from 'next-intl/server'
import LabelMarqueeDrag from './LabelMarqueeDrag'

/**
 * Durchlaufende Logoleiste der Labels, deren Filme im Katalog sind.
 *
 * === Neues Logo ergaenzen ===
 * 1. Rohdatei nach  assets/label-logos-original/  legen (liegt ausserhalb von
 *    public/, wird also nicht ausgeliefert -- das ist nur das Archiv).
 * 2. Aufbereiten:
 *      node scripts/prepare-label-logo.mjs <quelle> public/labels/<name>.png <modus>
 *    Welcher Modus, siehe unten. Das Skript schneidet den Rand ab und
 *    verkleinert die Datei.
 * 3. Unten in LABELS eine Zeile ergaenzen. Das ist die einzige Stelle im Code,
 *    an der Logos stehen -- es gibt keine verstreuten Importe.
 *
 * === Was die Leiste von einer Datei erwartet ===
 * SVG oder PNG mit Alphakanal. Ein transparenter Hintergrund allein genuegt
 * aber nicht: die Leiste faerbt jedes Logo weiss (siehe .label-marquee-logo
 * in globals.css), es zaehlt also nur die Deckung. Traegt ein Logo seine
 * Zeichnung im Farbton -- ein Schriftzug auf einer deckenden Karte, ein
 * Monogramm auf einer Platte --, dann bleibt beim Einfaerben nur die weisse
 * Flaeche uebrig. Daran ist von den ersten fuenf Lieferungen die Haelfte
 * zunaechst gescheitert, obwohl alle fuenf sauber freigestellt waren.
 * Ein JPG kann es entsprechend grundsaetzlich nicht sein.
 *
 * Dagegen hilft eines von beiden:
 * - Das Skript rechnet den Ton in Deckung um: lum (helles Motiv auf dunklem
 *   Grund), inv (dunkles auf hellem), split:<x> (Motiv laeuft ueber einen
 *   Hell-Dunkel-Knick und wechselt dort die Polaritaet -- die Knickspalte
 *   findet --fold). cut nimmt eine schon passende Datei unveraendert.
 * - Oder das Logo laeuft ungefaerbt mit: keepTone in LABELS, Modus keep im
 *   Skript. Das taugt nur, wenn es von sich aus hell und nahezu einfarbig
 *   ist, sonst faellt es aus der Leiste heraus.
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
  /**
   * Weissfuellung ueberspringen: das Logo behaelt seine Tonwerte. Nur fuer
   * Logos, die ihre Zeichnung im Ton tragen statt im Alphakanal -- die
   * wuerden weiss gefuellt zur Flaeche. Die Datei muss dafuer selbst schon
   * schwarzweiss sein (Modus gray im Aufbereitungsskript), farbig faellt
   * sie aus der Leiste heraus.
   */
  keepTone?: boolean
}

const LABELS: Label[] = [
  { name: 'Unearthed Films', file: 'unearthed.png' },
  // Gestapelt: Zeichnung ueber Schriftzug, beides auf 160 px Breite. Auf
  // Einheitshoehe waere die Schrift darunter nicht mehr zu lesen.
  { name: 'RW Films', file: 'renewiesnerfilms.png', scale: 1.25 },
  // Eigenproduktionen. Steht bewusst mitten in der Reihe, nicht vorne.
  { name: 'UncutTV', file: 'uncuttv.png' },
  { name: 'Illusions Unltd. Films', file: 'illusions.png' },
  // Traegt seine Zeichnung im Ton, nicht in der Deckung: weiss gefaerbt
  // bliebe nur das Sechseck uebrig. Von sich aus weiss-grau, laeuft also
  // ungefaerbt mit. Kompakt gebaut, deshalb etwas mehr Hoehe.
  { name: 'New Films Order', file: 'new_films_order.png', keepTone: true, scale: 1.15 },
  // Gezeichnetes Emblem. Weiss gefuellt zerfaellt es: der Kopf wird zur
  // Flaeche und die weiss gewordenen Spritzer laufen in die Schrift.
  // Deshalb entsaettigt statt gefuellt (Modus gray) -- der Schriftzug bleibt
  // hell und lesbar, der Kopf tritt als dunkle Form zurueck.
  { name: 'Garden of Gore', file: 'gardenofgore.png', keepTone: true },
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
 * mindestens so viele Logos hat -- bei vier Labels also viermal.
 */
const MIN_ITEMS_PER_RUN = 16

/**
 * Sekunden, die ein Logo fuer die volle Bandbreite braucht. Kleiner =
 * schneller. Mit der verdoppelten Logohoehe ist ein Durchlauf doppelt so
 * breit geworden -- bei der alten Zahl liefe das Band jetzt doppelt so
 * schnell, und ruhig soll es bleiben. Der mobile Zweig in globals.css zieht
 * seinen Faktor entsprechend nach, damit dort das Tempo gleich bleibt.
 */
const SECONDS_PER_LOGO = 12

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
        // jedes Label achtmal.
        const isOriginal = runIndex === 0 && i < LABELS.length
        return (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={i}
            className={'label-marquee-logo' + (label.keepTone ? ' label-marquee-logo--as-is' : '')}
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

      {/* Die Huelle ist eine Clientkomponente -- sie macht das Band mit dem
          Finger verschiebbar. Die Durchlaeufe gehen als children hinein und
          bleiben damit serverseitig gerendert: Logoliste, Bilder und
          Uebersetzung landen nicht im Bundle. */}
      <LabelMarqueeDrag>
        <div
          className="label-marquee-track"
          /* Dauer aus der Anzahl, damit das Band unabhaengig von der Zahl der
             Logos gleich schnell laeuft. Die Bewegung selbst macht CSS. */
          style={{ ['--marquee-duration' as string]: `${run.length * SECONDS_PER_LOGO}s` }}
        >
          {renderRun(0)}
          {renderRun(1)}
        </div>
      </LabelMarqueeDrag>
    </section>
  )
}
