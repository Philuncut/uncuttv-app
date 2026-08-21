/**
 * Bereitet ein Label-Logo fuer die Logoleiste auf der Startseite auf.
 *
 *   node scripts/prepare-label-logo.mjs <quelle> <ziel> <modus>
 *
 * Die Leiste zeigt Logos standardmaessig einfarbig weiss. Sie braucht dafuer
 * Dateien, bei denen die Deckung (Alphakanal) das Motiv beschreibt und sonst
 * nichts. Ein transparenter Hintergrund allein genuegt nicht: liegt das Motiv
 * als Farbe oder Ton auf einer deckenden Flaeche -- ein Schriftzug auf einer
 * Karte, ein Monogramm auf einer Platte --, dann faellt beim Einfaerben die
 * Binnenzeichnung weg und uebrig bleibt die weisse Flaeche. Dieses Skript
 * rechnet die ueblichen Lieferformen darauf um.
 *
 * Modi:
 *   cut         Motiv liegt bereits im Alphakanal -- nur weiss einfaerben
 *   lum         helles Motiv auf dunklem Grund (weisse Schrift auf Schwarz):
 *               die Helligkeit wird zur Deckung
 *   inv         dunkles Motiv auf hellem Grund (schwarze Zeichnung auf Weiss):
 *               die umgekehrte Helligkeit wird zur Deckung
 *   split:<x>   Motiv laeuft ueber einen Hell-Dunkel-Knick bei Spalte <x> und
 *               wechselt dort die Polaritaet. Beide Seiten werden getrennt
 *               gegen ihren eigenen Flaechenton gerechnet. Den Knick findet
 *               man als groessten Sprung im Spaltenmittel -- siehe --fold.
 *   keep        nichts einfaerben, nur beschneiden und neu komprimieren. Fuer
 *               Logos, die schon hell und nahezu einfarbig sind und in der
 *               Leiste ohne Weissfaerbung laufen (keepColor in LABELS).
 *
 * --fold        misst nur und gibt die Knickspalte aus, schreibt keine Datei
 *
 * Beschnitten wird immer: die Leiste setzt den Abstand zwischen den Logos
 * selbst, mitgelieferter Leerraum macht ihn ungleichmaessig.
 *
 * sharp kommt als Abhaengigkeit von Next mit, es ist nichts zu installieren.
 */
import sharp from 'sharp'

const argv = process.argv.slice(2)
const foldOnly = argv.includes('--fold')
const [src, dst, mode = 'cut'] = argv.filter((a) => a !== '--fold')

if (!src || (!dst && !foldOnly)) {
  console.error('Aufruf: node scripts/prepare-label-logo.mjs <quelle> <ziel> <cut|lum|inv|split:x|keep>')
  console.error('        node scripts/prepare-label-logo.mjs <quelle> --fold')
  process.exit(1)
}

const { data, info } = await sharp(src).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
const { width, height, channels } = info

const lumAt = (i) => (0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2]) / 255

/** Spaltenmittel der Helligkeit ueber die deckenden Bildpunkte */
function columnMeans() {
  const col = new Array(width).fill(null)
  for (let x = 0; x < width; x++) {
    let s = 0, n = 0
    for (let y = 0; y < height; y++) {
      const i = (y * width + x) * channels
      if (data[i + 3] > 200) { s += lumAt(i); n++ }
    }
    if (n > 20) col[x] = s / n
  }
  return col
}

if (foldOnly) {
  const col = columnMeans()
  let best = 0, bx = -1
  for (let x = 1; x < width; x++) {
    if (col[x] == null || col[x - 1] == null) continue
    const d = Math.abs(col[x] - col[x - 1])
    if (d > best) { best = d; bx = x }
  }
  console.log(`Knick bei x=${bx} (Sprung ${best.toFixed(3)}) -- Aufruf mit  split:${bx}`)
  process.exit(0)
}

// Streckung: unter LO gilt als Flaeche, ueber HI als volles Motiv. Ohne sie
// bliebe der Grund als Schleier stehen und das Motiv deckte nie ganz.
const LO = 0.10, HI = 0.85
// Beim Knick wird gegen den jeweiligen Flaechenton gerechnet, die Schwellen
// sind deshalb Abstaende davon und entsprechend kleiner.
const SPLIT_LO = 0.05, SPLIT_HI = 0.30
const SPLIT_SKIP = 2 // Spalten direkt am Knick auslassen, dort mischt die Kante

let split = null
if (mode.startsWith('split:')) {
  const fold = parseInt(mode.slice(6), 10)
  if (!Number.isFinite(fold)) { console.error('split: braucht eine Spaltennummer'); process.exit(1) }
  const col = columnMeans()
  const mean = (from, to) => {
    const v = col.slice(from, to).filter((c) => c != null)
    return v.reduce((p, c) => p + c, 0) / v.length
  }
  split = { fold, left: mean(0, fold - SPLIT_SKIP), right: mean(fold + SPLIT_SKIP, width) }
  console.log(`  Knick x=${fold}, Flaechenton links ${split.left.toFixed(3)}, rechts ${split.right.toFixed(3)}`)
}

const out = Buffer.alloc(width * height * 4)
for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
  const i = (y * width + x) * channels, o = (y * width + x) * 4
  const a = data[i + 3] / 255

  if (mode === 'keep') {
    out[o] = data[i]; out[o + 1] = data[i + 1]; out[o + 2] = data[i + 2]; out[o + 3] = data[i + 3]
    continue
  }

  let v = a
  if (split) {
    // Auf der dunklen Seite ist das Motiv heller als seine Flaeche, auf der
    // hellen dunkler -- der Abstand vom Flaechenton zeigt in beiden Faellen
    // in dieselbe Richtung.
    const raw = Math.abs(x - split.fold) <= SPLIT_SKIP ? 0
      : x < split.fold ? lumAt(i) - split.left : split.right - lumAt(i)
    v = Math.max(0, Math.min(1, (raw - SPLIT_LO) / (SPLIT_HI - SPLIT_LO))) * a
  } else if (mode !== 'cut') {
    const raw = mode === 'inv' ? 1 - lumAt(i) : lumAt(i)
    v = Math.max(0, Math.min(1, (raw - LO) / (HI - LO))) * a
  }
  out[o] = out[o + 1] = out[o + 2] = 255
  out[o + 3] = Math.round(v * 255)
}

// Palette statt Vollfarbe: bei den weissen Fassungen zaehlt nur die Deckung,
// als Palette mit tRNS ist das ein Bruchteil so gross.
const res = await sharp(out, { raw: { width, height, channels: 4 } })
  .trim({ threshold: 3 })
  .png({ compressionLevel: 9, palette: true, colours: 256 })
  .toFile(dst)

console.log(`${dst}: ${res.width}x${res.height} (${(res.size / 1024).toFixed(1)} kB)`)
