/**
 * Bereitet ein Label-Logo fuer die Logoleiste auf der Startseite auf.
 *
 * Die Leiste zeigt alle Logos einfarbig weiss. Sie erwartet deshalb Dateien,
 * bei denen die Deckung (Alphakanal) das Motiv beschreibt und sonst nichts:
 * eine deckende Flaeche hinter dem Logo erscheint sonst als weisser Block.
 * Dieses Skript rechnet die ueblichen Lieferformen darauf um.
 *
 *   node scripts/prepare-label-logo.mjs <quelle> <ziel> <modus>
 *
 * Modi:
 *   cut   Datei ist bereits freigestellt -- nur weiss einfaerben und beschneiden
 *   lum   helles Motiv auf dunklem Grund (z. B. weisse Schrift auf Schwarz):
 *         die Helligkeit wird zur Deckung
 *   inv   dunkles Motiv auf hellem Grund (z. B. schwarze Strichzeichnung auf
 *         Weiss): die umgekehrte Helligkeit wird zur Deckung
 *
 * Nicht umrechenbar sind Logos, deren Motiv mal heller und mal dunkler als
 * sein Untergrund ist -- etwa ein Schriftzug, der ueber eine zweifarbige
 * Flaeche laeuft. Dafuer braucht es eine einfarbige Fassung vom Label.
 *
 * sharp kommt als Abhaengigkeit von Next mit, es ist nichts zu installieren.
 */
import sharp from 'sharp'

const [src, dst, mode = 'cut'] = process.argv.slice(2)
if (!src || !dst) {
  console.error('Aufruf: node scripts/prepare-label-logo.mjs <quelle> <ziel> <cut|lum|inv>')
  process.exit(1)
}

// Streckung, damit der Untergrund wirklich auf null faellt und das Motiv
// wirklich deckt -- ohne sie bliebe ein Schleier stehen.
const LO = 0.10
const HI = 0.85

const { data, info } = await sharp(src).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
const { width, height, channels } = info
const out = Buffer.alloc(width * height * 4)

for (let i = 0, o = 0; i < data.length; i += channels, o += 4) {
  const a = data[i + 3] / 255
  let v = a
  if (mode !== 'cut') {
    const lum = (0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2]) / 255
    const raw = mode === 'inv' ? 1 - lum : lum
    v = Math.max(0, Math.min(1, (raw - LO) / (HI - LO))) * a
  }
  out[o] = out[o + 1] = out[o + 2] = 255
  out[o + 3] = Math.round(v * 255)
}

// Der Rand wird abgeschnitten: die Leiste setzt den Abstand zwischen den Logos
// selbst, mitgelieferter Leerraum wuerde ihn ungleichmaessig machen.
// Palette statt Vollfarbe: alle Bildpunkte sind weiss, es zaehlt nur die
// Deckung -- als Palette mit tRNS ist das ein Bruchteil so gross.
const info2 = await sharp(out, { raw: { width, height, channels: 4 } })
  .trim({ threshold: 3 })
  .png({ compressionLevel: 9, palette: true, colours: 256 })
  .toFile(dst)

console.log(`${dst}: ${info2.width}x${info2.height} (${(info2.size / 1024).toFixed(1)} kB)`)
