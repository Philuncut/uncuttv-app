/**
 * Probe http://204.168.140.150/subs/ for plausible SRT filenames per film.
 *
 * For each film, generates many filename variants based on title/slug
 * transformations and the suffix patterns we already saw in the local
 * subs folder. HEADs each candidate. Records every URL that returns 200.
 *
 * Output:
 *   scripts/srt-urls.json   — { film_id: { de: [urls], en: [urls] } }
 *   scripts/srt-urls.csv    — flat row per film for spreadsheet review
 *
 * Run (from app/):
 *   npx tsx scripts/find-srt-urls.ts
 */

import { config } from 'dotenv'
import { resolve } from 'path'
import { writeFileSync } from 'fs'
import { createClient } from '@supabase/supabase-js'

config({ path: resolve(process.cwd(), '.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const BASE = 'http://204.168.140.150/subs/'
const CONCURRENCY = 12

// Suffixes we observed in the local subs folder, in rough frequency order
const DE_SUFFIXES = ['de', 'ger', 'germ', 'German', 'german']
const EN_SUFFIXES = ['en', 'eng', 'english', 'English']
// Separators between base name and language suffix
const SEPS = ['_', '-', ' ']
// Optional infix tags we saw in the wild
const INSERT_TAGS = ['', '_UncutTV_Subs', '-UncutTV-Subs']
// Only .srt — none of the local files are .vtt
const EXTS = ['srt']

function makeBaseVariants(title: string, slug: string): string[] {
  const out = new Set<string>()
  // Raw title and slug
  out.add(title)
  out.add(slug)
  const titleNoPunct = title.replace(/[:.,!?']/g, '').replace(/\s+/g, ' ').trim()
  out.add(titleNoPunct)
  const tokens = titleNoPunct.split(/\s+/).filter(Boolean)
  // Underscore / hyphen / no-separator joins
  out.add(tokens.join('_'))
  out.add(tokens.join('-'))
  out.add(tokens.join('_').toLowerCase())
  out.add(tokens.join('-').toLowerCase())
  out.add(tokens.join('').toLowerCase())
  // Slug variants
  out.add(slug.replace(/-/g, '_'))
  out.add(slug.replace(/-/g, ''))
  // Drop colon parts e.g. "Backwood: The Camp Massacre" → "Camp Massacre"
  if (title.includes(':')) {
    const after = title.split(':').slice(1).join(':').trim()
    if (after) {
      const t2 = after.replace(/[:.,!?']/g, '').split(/\s+/).filter(Boolean)
      out.add(t2.join('_').toLowerCase())
      out.add(t2.join('-').toLowerCase())
      out.add(t2.join(' '))
    }
  }
  return Array.from(out).filter((s) => s.length > 0)
}

function makeCandidates(title: string, slug: string, lang: 'de' | 'en'): string[] {
  const bases = makeBaseVariants(title, slug)
  const suffixes = lang === 'de' ? DE_SUFFIXES : EN_SUFFIXES
  const out = new Set<string>()
  for (const base of bases) {
    for (const tag of INSERT_TAGS) {
      for (const sep of SEPS) {
        for (const sfx of suffixes) {
          for (const ext of EXTS) {
            out.add(`${base}${tag}${sep}${sfx}.${ext}`)
          }
        }
      }
    }
  }
  return Array.from(out)
}

// Bare-name candidates (no language suffix) — only used as a separate
// "ambiguous" probe; reported in its own column so it never gets confused
// with a language-specific match.
function makeBareCandidates(title: string, slug: string): string[] {
  const bases = makeBaseVariants(title, slug)
  const out = new Set<string>()
  for (const base of bases) for (const ext of EXTS) out.add(`${base}.${ext}`)
  return Array.from(out)
}

async function head(url: string): Promise<boolean> {
  try {
    const r = await fetch(url, { method: 'HEAD' })
    return r.ok
  } catch {
    return false
  }
}

async function probeMany(filenames: string[]): Promise<string[]> {
  const found: string[] = []
  let i = 0
  async function worker() {
    while (i < filenames.length) {
      const idx = i++
      const fn = filenames[idx]
      const url = BASE + encodeURI(fn)
      if (await head(url)) found.push(url)
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker))
  return found
}

async function run() {
  console.log('Fetching films from Supabase...')
  const { data: films, error } = await supabase
    .from('films')
    .select('id, title, slug')
    .order('title', { ascending: true })

  if (error || !films) {
    console.error('Supabase error:', error?.message)
    process.exit(1)
  }
  console.log(`Probing SRT URLs for ${films.length} films...\n`)

  const mapping: Record<
    string,
    { title: string; slug: string; de: string[]; en: string[]; bare: string[] }
  > = {}

  for (let n = 0; n < films.length; n++) {
    const f = films[n]
    const deCands = makeCandidates(f.title, f.slug, 'de')
    const enCands = makeCandidates(f.title, f.slug, 'en')
    const bareCands = makeBareCandidates(f.title, f.slug)
    const [de, en, bare] = await Promise.all([
      probeMany(deCands),
      probeMany(enCands),
      probeMany(bareCands),
    ])
    mapping[f.id] = { title: f.title, slug: f.slug, de, en, bare }
    const fmt = (arr: string[]) =>
      arr.length === 0 ? '—' : arr.length + 'x ' + arr.map((u) => u.substring(BASE.length)).join(', ')
    console.log(`[${n + 1}/${films.length}] ${f.title}`)
    console.log(`        de: ${fmt(de)}`)
    console.log(`        en: ${fmt(en)}`)
    if (bare.length > 0) console.log(`     bare: ${fmt(bare)}`)
  }

  // Write JSON
  const jsonPath = resolve(process.cwd(), 'scripts', 'srt-urls.json')
  writeFileSync(jsonPath, JSON.stringify(mapping, null, 2))

  // Write CSV
  const csvLines = ['film_id,title,slug,de_count,de_first_url,en_count,en_first_url']
  for (const id of Object.keys(mapping)) {
    const m = mapping[id]
    csvLines.push(
      [
        id,
        JSON.stringify(m.title),
        m.slug,
        m.de.length,
        m.de[0] || '',
        m.en.length,
        m.en[0] || '',
      ].join(',')
    )
  }
  const csvPath = resolve(process.cwd(), 'scripts', 'srt-urls.csv')
  writeFileSync(csvPath, csvLines.join('\n') + '\n')

  // Summary
  const filmsWithDe = Object.values(mapping).filter((m) => m.de.length > 0).length
  const filmsWithEn = Object.values(mapping).filter((m) => m.en.length > 0).length
  const filmsWithBoth = Object.values(mapping).filter((m) => m.de.length > 0 && m.en.length > 0).length
  const filmsWithNeither = Object.values(mapping).filter((m) => m.de.length === 0 && m.en.length === 0).length

  console.log('\n========== SUMMARY ==========')
  console.log(`Films probed:           ${films.length}`)
  console.log(`Films with DE found:    ${filmsWithDe}`)
  console.log(`Films with EN found:    ${filmsWithEn}`)
  console.log(`Films with both:        ${filmsWithBoth}`)
  console.log(`Films with neither:     ${filmsWithNeither}`)
  console.log(`\nJSON: ${jsonPath}`)
  console.log(`CSV:  ${csvPath}`)
}

run().catch((err) => {
  console.error('Fatal:', err)
  process.exit(1)
})
