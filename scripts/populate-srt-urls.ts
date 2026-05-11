/**
 * Read scripts/srt-urls.json and write the verified DE/EN URLs into
 * films.subtitle_urls (JSONB).
 *
 * Prerequisites:
 *   - Run supabase/migrations/20260407_add_subtitle_urls.sql in the
 *     Supabase SQL editor first.
 *   - Run scripts/find-srt-urls.ts and scripts/find-srt-urls-extra.ts to
 *     produce scripts/srt-urls.json.
 *
 * Behavior:
 *   - For each film with at least one URL (de or en), writes:
 *       { "de": "<first de url>", "en": "<first en url>" }
 *     Missing languages are simply omitted.
 *   - Films with no URLs are left unchanged.
 *   - Use --dry-run to preview without writing.
 *
 * Run (from app/):
 *   npx tsx scripts/populate-srt-urls.ts --dry-run
 *   npx tsx scripts/populate-srt-urls.ts
 */

import { config } from 'dotenv'
import { resolve } from 'path'
import { readFileSync } from 'fs'
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

async function run() {
  const dryRun = process.argv.includes('--dry-run')
  const jsonPath = resolve(process.cwd(), 'scripts', 'srt-urls.json')
  const mapping: Mapping = JSON.parse(readFileSync(jsonPath, 'utf8'))

  const updates: { id: string; title: string; subtitle_urls: Record<string, string> }[] = []
  for (const [filmId, m] of Object.entries(mapping)) {
    const sub: Record<string, string> = {}
    if (m.de.length > 0) sub.de = m.de[0]
    if (m.en.length > 0) sub.en = m.en[0]
    if (Object.keys(sub).length === 0) continue
    updates.push({ id: filmId, title: m.title, subtitle_urls: sub })
  }

  console.log(`Films with at least one verified SRT URL: ${updates.length}`)
  for (const u of updates) {
    console.log(`  ${u.title}`)
    if (u.subtitle_urls.de) console.log(`    de: ${u.subtitle_urls.de}`)
    if (u.subtitle_urls.en) console.log(`    en: ${u.subtitle_urls.en}`)
  }

  if (dryRun) {
    console.log('\n--dry-run: no writes performed.')
    return
  }

  console.log('\nWriting to Supabase...')
  let ok = 0
  let fail = 0
  for (const u of updates) {
    const { error } = await supabase
      .from('films')
      .update({ subtitle_urls: u.subtitle_urls })
      .eq('id', u.id)
    if (error) {
      console.log(`  ✗ ${u.title}: ${error.message}`)
      fail++
    } else {
      console.log(`  ✓ ${u.title}`)
      ok++
    }
  }
  console.log(`\nDone: ${ok} updated, ${fail} failed.`)
  if (fail > 0 && updates.length > 0) {
    console.log('\nIf failures mention "column does not exist", run the migration first:')
    console.log('  https://supabase.com/dashboard/project/xmqxnwhszgsijmhdtrhg/sql/new')
    console.log('  Paste: supabase/migrations/20260407_add_subtitle_urls.sql')
  }
}

run().catch((err) => {
  console.error('Fatal:', err)
  process.exit(1)
})
