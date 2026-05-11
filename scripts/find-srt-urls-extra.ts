/**
 * Probe a hand-curated alias map for the films that the auto-prober missed.
 * Merges any 200 OK results into scripts/srt-urls.json.
 *
 * Run (from app/):
 *   npx tsx scripts/find-srt-urls-extra.ts
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

const BASE = 'http://204.168.140.150/subs/'

// title_substring (case-insensitive) → list of filename candidates
const ALIASES: { match: string; files: string[] }[] = [
  {
    match: 'Bouquet of Guts',
    files: ['agp1_ger.srt', 'agp1_eng.srt', 'agp1_de.srt', 'agp1_en.srt'],
  },
  {
    match: 'Bloodshock',
    files: ['agp2_ger.srt', 'agp2_eng.srt', 'agp2_de.srt', 'agp2_en.srt', 'agp_bloodshock_ger.srt'],
  },
  {
    match: 'Camp Massacre',
    files: [
      'camp_massacre_ger.srt',
      'camp_massacre_eng.srt',
      'camp_massacre_de.srt',
      'camp_massacre_en.srt',
      'backwood_ger.srt',
      'backwood_eng.srt',
    ],
  },
  {
    match: 'Fake News',
    files: ['fakenews_ger.srt', 'fakenews_eng.srt', 'fake_news_ger.srt', 'fake_news_eng.srt'],
  },
  {
    match: 'Welcome Home',
    files: [
      'neighbour_number_9_2_ger.srt',
      'neighbour_number_9_2_eng.srt',
      'neighbor_9_2_ger.srt',
      'neighbor_9_2_eng.srt',
    ],
  },
  // The plain "Neighbor Number. 9" film, NOT the Welcome Home one
  {
    match: 'Neighbor Number. 9',
    files: ['neighbour_number_9_ger.srt', 'neighbour_number_9_eng.srt'],
  },
  {
    match: 'La Petite Mort 2',
    files: [
      'La_Petite_Mort_2_Nasty_Tapes_UncutTV_Subs_en.srt',
      'La_Petite_Mort_2_Nasty_Tapes_UncutTV_Subs_ger.srt',
    ],
  },
  {
    match: 'Gorenography',
    files: ['gorenogrphy.srt', 'gorenography_ger.srt', 'gorenography_eng.srt'],
  },
  {
    match: 'Tale of 4 Seasons',
    files: [
      'a_tale_pf_4_seasons_ger.srt',
      'a_tale_pf_4_seasons_eng.srt',
      'a_tale_of_4_seasons_ger.srt',
      'a_tale_of_4_seasons_eng.srt',
    ],
  },
]

function classifyLang(filename: string): 'de' | 'en' | 'unknown' {
  const f = filename.toLowerCase()
  // Check for explicit language markers
  if (/(^|[_\-. ])(ger|germ|german|de)(\.|$)/.test(f)) return 'de'
  if (/(^|[_\-. ])(eng|english|en)(\.|$)/.test(f)) return 'en'
  return 'unknown'
}

async function head(url: string): Promise<boolean> {
  try {
    const r = await fetch(url, { method: 'HEAD' })
    return r.ok
  } catch {
    return false
  }
}

type Mapping = Record<
  string,
  { title: string; slug: string; de: string[]; en: string[]; bare?: string[] }
>

async function run() {
  const jsonPath = resolve(process.cwd(), 'scripts', 'srt-urls.json')
  if (!existsSync(jsonPath)) {
    console.error(`Expected ${jsonPath} from find-srt-urls.ts run; not found.`)
    process.exit(1)
  }
  const mapping: Mapping = JSON.parse(readFileSync(jsonPath, 'utf8'))

  const { data: films, error } = await supabase
    .from('films')
    .select('id, title, slug')
    .order('title', { ascending: true })

  if (error || !films) {
    console.error('Supabase error:', error?.message)
    process.exit(1)
  }

  let added = 0
  for (const alias of ALIASES) {
    const matchLower = alias.match.toLowerCase()
    const film = films.find((f) => f.title.toLowerCase().includes(matchLower))
    if (!film) {
      console.log(`✗ no film matches "${alias.match}"`)
      continue
    }
    console.log(`\n[${film.title}]`)
    let entry = mapping[film.id]
    if (!entry) {
      entry = { title: film.title, slug: film.slug, de: [], en: [], bare: [] }
      mapping[film.id] = entry
    }
    for (const filename of alias.files) {
      const url = BASE + encodeURI(filename)
      const ok = await head(url)
      if (!ok) {
        console.log(`  ✗ ${filename}`)
        continue
      }
      const lang = classifyLang(filename)
      console.log(`  ✓ ${filename}  → ${lang}`)
      if (lang === 'de' && !entry.de.includes(url)) {
        entry.de.push(url)
        added++
      } else if (lang === 'en' && !entry.en.includes(url)) {
        entry.en.push(url)
        added++
      } else if (lang === 'unknown') {
        entry.bare = entry.bare || []
        if (!entry.bare.includes(url)) entry.bare.push(url)
      }
    }
  }

  writeFileSync(jsonPath, JSON.stringify(mapping, null, 2))

  // Final summary across full mapping
  const all = Object.values(mapping)
  const withDe = all.filter((m) => m.de.length > 0).length
  const withEn = all.filter((m) => m.en.length > 0).length
  const withBoth = all.filter((m) => m.de.length > 0 && m.en.length > 0).length

  console.log(`\nAdded ${added} new URL(s) to ${jsonPath}\n`)
  console.log('========== FINAL MAPPING SUMMARY ==========')
  console.log(`Films with DE: ${withDe}`)
  console.log(`Films with EN: ${withEn}`)
  console.log(`Films with both: ${withBoth}`)
}

run().catch((err) => {
  console.error('Fatal:', err)
  process.exit(1)
})
