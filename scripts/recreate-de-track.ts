/**
 * Recreate the German subtitle track on a MUX asset.
 *
 * Hypothesis: MUX has both EN and DE text tracks marked "ready" via the API,
 * but only EN appears in the HLS master manifest. Re-POSTing the German
 * track may force MUX to refresh the manifest and include it.
 *
 * NOTE: The MUX API does NOT expose the original SRT URL of an ingested
 * track. To recreate, you must provide a URL via --url=<srt_url>.
 *
 * Usage (from app/):
 *
 *   # Dry run — inspect, no API writes:
 *   npx tsx scripts/recreate-de-track.ts "Slave Dolls"
 *
 *   # Execute — requires SRT URL:
 *   npx tsx scripts/recreate-de-track.ts "Slave Dolls" --execute --url="http://204.168.140.150/subs/foo_de.srt"
 */

import { config } from 'dotenv'
import { resolve } from 'path'
import Mux from '@mux/mux-node'
import { createClient } from '@supabase/supabase-js'

config({ path: resolve(process.cwd(), '.env.local') })

const mux = new Mux({
  tokenId: process.env.MUX_TOKEN_ID!,
  tokenSecret: process.env.MUX_TOKEN_SECRET!,
  jwtPrivateKey: Buffer.from(process.env.MUX_SIGNING_PRIVATE_KEY!, 'base64').toString('utf8'),
  jwtSigningKey: process.env.MUX_SIGNING_KEY_ID!,
})

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function parseArgs() {
  const args = process.argv.slice(2)
  const positional: string[] = []
  let execute = false
  let url: string | null = null
  let lang: 'de' | 'en' = 'de'
  for (const a of args) {
    if (a === '--execute') execute = true
    else if (a.startsWith('--url=')) url = a.substring(6).replace(/^["']|["']$/g, '')
    else if (a.startsWith('--lang=')) {
      const v = a.substring(7).toLowerCase()
      if (v === 'en' || v === 'de') lang = v
      else { console.error('--lang must be "en" or "de"'); process.exit(1) }
    }
    else if (!a.startsWith('--')) positional.push(a)
  }
  return { query: positional[0] || 'Slave Dolls', execute, url, lang }
}

const LANG_NAME: Record<'de' | 'en', string> = { de: 'Deutsch', en: 'English' }

function sleep(ms: number) {
  return new Promise((res) => setTimeout(res, ms))
}

async function fetchManifestSubtitleTracks(playbackId: string): Promise<{ lang: string; name: string }[]> {
  const token = await mux.jwt.signPlaybackId(playbackId, { type: 'video', expiration: '1h' })
  const url = `https://stream.mux.com/${playbackId}.m3u8?token=${token}`
  const r = await fetch(url)
  if (!r.ok) throw new Error(`manifest HTTP ${r.status}`)
  const text = await r.text()
  const subs: { lang: string; name: string }[] = []
  for (const line of text.split('\n')) {
    if (line.startsWith('#EXT-X-MEDIA') && line.includes('TYPE=SUBTITLES')) {
      const lang = (line.match(/LANGUAGE="([^"]+)"/) || [])[1] || ''
      const name = (line.match(/NAME="([^"]+)"/) || [])[1] || ''
      subs.push({ lang, name })
    }
  }
  return subs
}

async function run() {
  const { query, execute, url: newUrl, lang } = parseArgs()
  const TARGET_LANG = lang
  const TARGET_NAME = LANG_NAME[lang]
  console.log(`Query: "${query}"  lang=${TARGET_LANG}  execute=${execute}  url=${newUrl || '(not provided)'}\n`)

  // Try exact slug match first, then exact title, then ilike fallback
  let films: { id: string; title: string; slug: string; mux_asset_id: string | null; mux_playback_id: string | null }[] | null = null
  let error: { message: string } | null = null
  for (const filter of [
    (q: typeof supabase) => q.from('films').select('id, title, slug, mux_asset_id, mux_playback_id').eq('slug', query),
    (q: typeof supabase) => q.from('films').select('id, title, slug, mux_asset_id, mux_playback_id').eq('title', query),
    (q: typeof supabase) => q.from('films').select('id, title, slug, mux_asset_id, mux_playback_id').ilike('title', `%${query}%`),
  ]) {
    const res = await filter(supabase).not('mux_asset_id', 'is', null).limit(5)
    if (res.error) { error = res.error; break }
    if (res.data && res.data.length > 0) { films = res.data; break }
  }

  if (error) {
    console.error('Supabase error:', error.message)
    process.exit(1)
  }
  if (!films || films.length === 0) {
    console.error(`No film matches "${query}".`)
    process.exit(1)
  }
  if (films.length > 1) {
    console.log(`Found ${films.length} matching films:`)
    films.forEach((f, i) => console.log(`  [${i}] ${f.title} (${f.slug})`))
    console.log('\nRefine the query so exactly one film matches before continuing.')
    process.exit(1)
  }

  const film = films[0]
  console.log(`FILM: ${film.title}`)
  console.log(`  id:               ${film.id}`)
  console.log(`  slug:             ${film.slug}`)
  console.log(`  mux_asset_id:     ${film.mux_asset_id}`)
  console.log(`  mux_playback_id:  ${film.mux_playback_id}\n`)

  // 1. List current text tracks via API
  console.log('STEP 1: Fetch current track list from MUX API...')
  const asset = await mux.video.assets.retrieve(film.mux_asset_id!)
  const textTracks = (asset.tracks || []).filter((t) => t.type === 'text')
  console.log(`  Asset status: ${asset.status}`)
  console.log(`  Text tracks: ${textTracks.length}`)
  textTracks.forEach((t, i) => {
    const tt = t as { language_code?: string; name?: string; status?: string; text_type?: string }
    console.log(`    [${i}] id=${t.id} lang=${tt.language_code} name="${tt.name}" status=${tt.status} text_type=${tt.text_type}`)
  })

  const targetTrack = textTracks.find(
    (t) => ((t as { language_code?: string }).language_code || '').toLowerCase().startsWith(TARGET_LANG)
  )
  if (!targetTrack) {
    console.log(`\n  ✗ No ${TARGET_LANG.toUpperCase()} track found in API. Nothing to recreate.`)
    process.exit(1)
  }
  const targetAny = targetTrack as { id?: string; language_code?: string; name?: string; status?: string }
  console.log(`\n  → Found ${TARGET_LANG.toUpperCase()} track: id=${targetAny.id} status=${targetAny.status} name="${targetAny.name}"`)

  // 2. Check current manifest state
  console.log('\nSTEP 2: Fetch current HLS master manifest and check subtitle tracks...')
  const beforeSubs = await fetchManifestSubtitleTracks(film.mux_playback_id!)
  console.log(`  Manifest subtitle tracks: ${beforeSubs.length}`)
  beforeSubs.forEach((s, i) => console.log(`    [${i}] lang="${s.lang}" name="${s.name}"`))
  const targetInManifestBefore = beforeSubs.some((s) => s.lang.toLowerCase().startsWith(TARGET_LANG))
  console.log(`  ${TARGET_LANG.toUpperCase()} in manifest before: ${targetInManifestBefore ? 'YES' : 'NO'}`)

  if (targetInManifestBefore) {
    console.log(`\n  ⚠ ${TARGET_LANG.toUpperCase()} track is already in the manifest. No recreation needed.`)
    process.exit(0)
  }

  // 3. Plan
  console.log('\nSTEP 3: Recreation plan')
  console.log(`  a. DELETE track ${targetAny.id}`)
  console.log(`  b. Sleep 10s`)
  console.log(`  c. POST new text track:`)
  console.log(`       type=text  text_type=subtitles  language_code=${TARGET_LANG}  name="${TARGET_NAME}"`)
  console.log(`       url=${newUrl || '(REQUIRED — pass via --url=<srt_url>)'}`)
  console.log(`  d. Sleep 30s`)
  console.log(`  e. Re-fetch manifest, check if ${TARGET_LANG.toUpperCase()} subtitles now appear`)

  if (!execute) {
    console.log('\n=== DRY RUN — no API writes performed. ===')
    console.log('To actually run, re-invoke with:')
    console.log(`  npx tsx scripts/recreate-de-track.ts "${query}" --execute --url="<srt_url>"`)
    console.log('\n⚠ IMPORTANT: The MUX API does not expose the original URL of an ingested')
    console.log('   track. You MUST provide the correct SRT URL via --url=. If the URL is')
    console.log('   wrong, MUX will create an "errored" track and you will need to delete it')
    console.log('   manually.')
    process.exit(0)
  }

  if (!newUrl) {
    console.log('\n✗ --execute requires --url=<srt_url>. Aborting (no API writes performed).')
    process.exit(1)
  }

  // 4. Execute
  console.log('\n=== EXECUTING ===')
  console.log(`\n[delete] DELETE asset ${film.mux_asset_id} track ${targetAny.id}`)
  await mux.video.assets.deleteTrack(film.mux_asset_id!, targetAny.id!)
  console.log('  ✓ Deleted')

  console.log('\n[wait] Sleeping 10s...')
  await sleep(10000)

  console.log(`\n[create] POST new track url=${newUrl}`)
  const created = await mux.video.assets.createTrack(film.mux_asset_id!, {
    type: 'text',
    text_type: 'subtitles',
    language_code: TARGET_LANG,
    name: TARGET_NAME,
    url: newUrl,
    closed_captions: false,
  })
  console.log(`  ✓ Created track id=${created.id} status=${created.status}`)

  console.log('\n[wait] Sleeping 30s for MUX to process...')
  await sleep(30000)

  // 5. Verify
  console.log('\n[verify] Re-fetch asset to check track status...')
  const after = await mux.video.assets.retrieve(film.mux_asset_id!)
  const newTrack = (after.tracks || []).find(
    (t) => t.id === created.id
  ) as { id?: string; status?: string; language_code?: string } | undefined
  console.log(`  New track now: id=${newTrack?.id} status=${newTrack?.status}`)

  console.log('\n[verify] Re-fetch HLS master manifest...')
  const afterSubs = await fetchManifestSubtitleTracks(film.mux_playback_id!)
  console.log(`  Manifest subtitle tracks: ${afterSubs.length}`)
  afterSubs.forEach((s, i) => console.log(`    [${i}] lang="${s.lang}" name="${s.name}"`))
  const targetInManifestAfter = afterSubs.some((s) => s.lang.toLowerCase().startsWith(TARGET_LANG))
  // Also check whether the OTHER language is still present (sanity check —
  // we want to make sure recreating EN didn't kick DE out, or vice versa)
  const otherLang: 'de' | 'en' = TARGET_LANG === 'en' ? 'de' : 'en'
  const otherInManifestBefore = beforeSubs.some((s) => s.lang.toLowerCase().startsWith(otherLang))
  const otherInManifestAfter = afterSubs.some((s) => s.lang.toLowerCase().startsWith(otherLang))

  console.log('\n=== RESULT ===')
  console.log(`  ${TARGET_LANG.toUpperCase()} in manifest:  before=${targetInManifestBefore ? 'YES' : 'NO'}  after=${targetInManifestAfter ? 'YES' : 'NO'}`)
  console.log(`  ${otherLang.toUpperCase()} in manifest:  before=${otherInManifestBefore ? 'YES' : 'NO'}  after=${otherInManifestAfter ? 'YES' : 'NO'}`)
  if (targetInManifestAfter) {
    console.log(`  ✓ SUCCESS: ${TARGET_LANG.toUpperCase()} subtitle track now appears in the HLS manifest.`)
  } else {
    console.log(`  ✗ FAILURE: ${TARGET_LANG.toUpperCase()} track still not in HLS manifest after recreation.`)
    console.log(`  New track status: ${newTrack?.status}`)
    if (newTrack?.status === 'errored') {
      console.log('  Track is errored — SRT URL unreachable or format rejected.')
      console.log(`  Cleanup: mux.video.assets.deleteTrack("${film.mux_asset_id}", "${created.id}")`)
    } else if (newTrack?.status === 'ready') {
      console.log('  Track is "ready" via API but still missing from manifest.')
      console.log('  Stale-cache hypothesis disproved. Path forward: MUX support ticket or self-hosted SRTs.')
    }
  }
  if (otherInManifestBefore && !otherInManifestAfter) {
    console.log(`\n  ⚠ WARNING: ${otherLang.toUpperCase()} was in the manifest before but is GONE after the operation.`)
    console.log(`  This means MUX serves only one text track per asset and our action displaced the other one.`)
  }
}

run().catch((err) => {
  console.error('Fatal:', err)
  process.exit(1)
})
