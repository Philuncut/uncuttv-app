/**
 * Verify that public.get_community_films() exists, is callable, returns
 * sane rows, and that the film IDs join to the films table.
 *
 * Run (from app/):
 *   npx tsx scripts/check-community-rpc.ts
 */

import { config } from 'dotenv'
import { resolve } from 'path'
import { createClient } from '@supabase/supabase-js'

config({ path: resolve(process.cwd(), '.env.local') })

// Test with the anon key first (mirrors what the webOS client uses), then
// retry with service role if anon is denied. The function should be callable
// by both via the GRANT statement in the migration.
const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY!

async function callRpc(label: string, key: string) {
  console.log(`\n--- ${label} ---`)
  const client = createClient(URL, key)
  const { data, error } = await client.rpc('get_community_films')
  if (error) {
    console.log(`  ✗ ${error.code || ''} ${error.message}`)
    return null
  }
  console.log(`  ✓ ${(data || []).length} rows`)
  ;(data || []).forEach((r: { film_id: string; viewer_count: number }, i: number) => {
    console.log(`    [${i}] film_id=${r.film_id} viewer_count=${r.viewer_count}`)
  })
  return data as { film_id: string; viewer_count: number }[] | null
}

async function run() {
  const fromAnon = await callRpc('rpc as anon (mirrors webOS client)', ANON)
  const fromService = await callRpc('rpc as service role (always allowed)', SERVICE)

  const rows = fromAnon ?? fromService
  if (!rows || rows.length === 0) {
    console.log('\nNo rows returned. This is expected if no user has accumulated >=60s of watchtime in the last 7 days.')
    console.log('Function is reachable as long as either call above showed ✓ 0 rows.')
    return
  }

  // Join check: every returned film_id should resolve to a published film.
  const service = createClient(URL, SERVICE)
  const ids = rows.map((r) => r.film_id)
  const { data: films, error: filmsError } = await service
    .from('films')
    .select('id, title, is_published')
    .in('id', ids)
  if (filmsError) {
    console.log(`\nfilms join ERROR: ${filmsError.message}`)
    return
  }
  const filmsMap = new Map<string, { id: string; title: string; is_published: boolean }>()
  for (const f of films || []) filmsMap.set(f.id, f)

  console.log('\n--- join with films table ---')
  rows.forEach((r, i) => {
    const f = filmsMap.get(r.film_id)
    if (!f) console.log(`  [${i}] ⚠ no film row for ${r.film_id}`)
    else console.log(`  [${i}] ${f.title}  viewers=${r.viewer_count}  published=${f.is_published}`)
  })

  const missing = rows.filter((r) => !filmsMap.has(r.film_id)).length
  const unpublished = rows.filter((r) => filmsMap.get(r.film_id)?.is_published === false).length
  console.log('\nSummary:')
  console.log(`  rpc rows:            ${rows.length}`)
  console.log(`  films missing:       ${missing}`)
  console.log(`  films unpublished:   ${unpublished}`)
  console.log(`  films usable in UI:  ${rows.length - missing - unpublished}`)
}

run().catch((err) => {
  console.error('Fatal:', err)
  process.exit(1)
})
