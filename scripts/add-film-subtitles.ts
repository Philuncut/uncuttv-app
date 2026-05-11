/**
 * Manually add or override subtitle URLs for a single film in scripts/srt-urls.json.
 *
 * Run (from app/):
 *   npx tsx scripts/add-film-subtitles.ts --film "Gorenography" --de "http://..."
 *   npx tsx scripts/add-film-subtitles.ts --film "Some Film" --en "http://..." --de "http://..."
 *
 * Behavior:
 *   - Looks up the film in Supabase by exact title (case-insensitive ilike fallback).
 *   - For each provided language URL: HEADs the URL to verify it returns 200,
 *     then sets it as the FIRST entry in the corresponding language array.
 *   - If the URL was previously sitting in the "bare" array (unknown language),
 *     it is removed from there.
 *   - Writes the updated mapping back to scripts/srt-urls.json.
 *
 * This only updates the JSON. To push the change into Supabase, follow up with:
 *   npx tsx scripts/populate-srt-urls.ts
 */

import { config } from 'dotenv'
import { resolve } from 'path'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { createClient } from '@supabase/supabase-js'

config({ path: resolve(process.cwd(), '.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

type Mapping = Record<
  string,
  { title: string; slug: string; de: string[]; en: string[]; bare?: string[] }
>

function parseArgs() {
  const args = process.argv.slice(2)
  let film: string | null = null
  let de: string | null = null
  let en: string | null = null
  for (let i = 0; i < args.length; i++) {
    const a = args[i]
    if (a === '--film') film = args[++i]
    else if (a.startsWith('--film=')) film = a.substring(7)
    else if (a === '--de') de = args[++i]
    else if (a.startsWith('--de=')) de = a.substring(5)
    else if (a === '--en') en = args[++i]
    else if (a.startsWith('--en=')) en = a.substring(5)
  }
  return { film, de, en }
}

async function head(url: string): Promise<{ ok: boolean; status: number }> {
  try {
    const r = await fetch(url, { method: 'HEAD' })
    return { ok: r.ok, status: r.status }
  } catch {
    return { ok: false, status: 0 }
  }
}

async function run() {
  const { film: filmQuery, de: deUrl, en: enUrl } = parseArgs()
  if (!filmQuery) {
    console.error('Usage: --film "Title" [--de <url>] [--en <url>]')
    process.exit(1)
  }
  if (!deUrl && !enUrl) {
    console.error('Provide at least one of --de or --en')
    process.exit(1)
  }

  const jsonPath = resolve(process.cwd(), 'scripts', 'srt-urls.json')
  if (!existsSync(jsonPath)) {
    console.error(`Expected ${jsonPath} from earlier probe runs; not found.`)
    process.exit(1)
  }
  const mapping: Mapping = JSON.parse(readFileSync(jsonPath, 'utf8'))

  // Look up the film: try exact title, then ilike fallback, ensure exactly one match.
  const { data: exactMatch } = await supabase
    .from('films')
    .select('id, title, slug')
    .eq('title', filmQuery)
    .limit(2)

  let films = exactMatch || []
  if (films.length === 0) {
    const { data: ilikeMatch } = await supabase
      .from('films')
      .select('id, title, slug')
      .ilike('title', `%${filmQuery}%`)
      .limit(5)
    films = ilikeMatch || []
  }

  if (films.length === 0) {
    console.error(`No film matches "${filmQuery}".`)
    process.exit(1)
  }
  if (films.length > 1) {
    console.error(`Ambiguous: ${films.length} films match "${filmQuery}":`)
    films.forEach((f) => console.error(`  ${f.title} (${f.slug})`))
    console.error('Use the exact title.')
    process.exit(1)
  }
  const film = films[0]
  console.log(`Film: ${film.title} (${film.slug})  id=${film.id}`)

  let entry = mapping[film.id]
  if (!entry) {
    entry = { title: film.title, slug: film.slug, de: [], en: [], bare: [] }
    mapping[film.id] = entry
  }
  if (!Array.isArray(entry.de)) entry.de = []
  if (!Array.isArray(entry.en)) entry.en = []
  if (entry.bare && !Array.isArray(entry.bare)) entry.bare = []

  async function applyLang(lang: 'de' | 'en', url: string) {
    console.log(`\n[${lang}] HEAD ${url}`)
    const r = await head(url)
    console.log(`     status=${r.status}`)
    if (!r.ok) {
      console.error(`     ✗ URL not reachable. Skipping ${lang}.`)
      return
    }
    // Drop from bare if present (it had unknown language; we now know it).
    if (entry.bare && entry.bare.includes(url)) {
      entry.bare = entry.bare.filter((u) => u !== url)
      console.log(`     removed from bare`)
    }
    // Insert at the front of the language array (or move to front if already present).
    const arr = entry[lang]
    const filtered = arr.filter((u) => u !== url)
    entry[lang] = [url, ...filtered]
    console.log(`     ✓ now first in entry.${lang}`)
  }

  if (deUrl) await applyLang('de', deUrl)
  if (enUrl) await applyLang('en', enUrl)

  writeFileSync(jsonPath, JSON.stringify(mapping, null, 2))
  console.log(`\nWrote ${jsonPath}`)
  console.log('\nFinal entry for this film:')
  console.log(JSON.stringify(entry, null, 2))
  console.log('\nNext step: npx tsx scripts/populate-srt-urls.ts')
}

run().catch((err) => {
  console.error('Fatal:', err)
  process.exit(1)
})
