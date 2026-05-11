/**
 * For every film with mux_asset_id, compare:
 *   - what assets/{id}/tracks API reports as text tracks
 *   - what the HLS master manifest actually contains as #EXT-X-MEDIA TYPE=SUBTITLES
 *
 * Goal: find the pattern that distinguishes films where DE shows up in
 * the manifest from films where it's silently missing.
 *
 * Run (from app/):
 *   npx tsx scripts/compare-api-vs-manifest.ts
 */

import { config } from 'dotenv'
import { resolve } from 'path'
import { writeFileSync } from 'fs'
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

async function getManifestSubs(playbackId: string) {
  const token = await mux.jwt.signPlaybackId(playbackId, { type: 'video', expiration: '1h' })
  const r = await fetch(`https://stream.mux.com/${playbackId}.m3u8?token=${token}`)
  if (!r.ok) return { ok: false, langs: [] as string[], err: `HTTP ${r.status}` }
  const text = await r.text()
  const langs: string[] = []
  for (const line of text.split('\n')) {
    if (line.startsWith('#EXT-X-MEDIA') && line.includes('TYPE=SUBTITLES')) {
      const lang = (line.match(/LANGUAGE="([^"]+)"/) || [])[1] || ''
      if (lang) langs.push(lang)
    }
  }
  return { ok: true, langs, err: '' }
}

async function run() {
  const { data: films, error } = await supabase
    .from('films')
    .select('id, title, slug, mux_asset_id, mux_playback_id, created_at')
    .not('mux_asset_id', 'is', null)
    .not('mux_playback_id', 'is', null)
    .order('title', { ascending: true })

  if (error || !films) {
    console.error('Supabase error:', error?.message)
    process.exit(1)
  }

  type Row = {
    title: string
    slug: string
    asset_id: string
    api_tracks: string
    manifest_tracks: string
    de_in_api: boolean
    de_in_manifest: boolean
    en_in_api: boolean
    en_in_manifest: boolean
    discrepancy: string
  }
  const rows: Row[] = []

  for (let i = 0; i < films.length; i++) {
    const f = films[i]
    process.stdout.write(`[${i + 1}/${films.length}] ${f.title}... `)
    try {
      const asset = await mux.video.assets.retrieve(f.mux_asset_id!)
      const apiText = (asset.tracks || [])
        .filter((t) => t.type === 'text')
        .map((t) => {
          const tt = t as { language_code?: string; status?: string }
          return `${tt.language_code || '?'}:${tt.status || '?'}`
        })
      const apiLangsReady = (asset.tracks || [])
        .filter((t) => t.type === 'text')
        .filter((t) => (t as { status?: string }).status === 'ready')
        .map((t) => ((t as { language_code?: string }).language_code || '').toLowerCase())

      const m = await getManifestSubs(f.mux_playback_id!)
      const manifestText = m.ok ? m.langs.join(',') : `ERR:${m.err}`
      const manifestLangs = m.langs.map((l) => l.toLowerCase())

      const deInApi = apiLangsReady.some((l) => l.startsWith('de'))
      const deInManifest = manifestLangs.some((l) => l.startsWith('de'))
      const enInApi = apiLangsReady.some((l) => l.startsWith('en'))
      const enInManifest = manifestLangs.some((l) => l.startsWith('en'))

      let disc = ''
      if (deInApi && !deInManifest) disc += 'DE_HIDDEN '
      if (enInApi && !enInManifest) disc += 'EN_HIDDEN '
      if (!deInApi && deInManifest) disc += 'DE_PHANTOM '
      if (!enInApi && enInManifest) disc += 'EN_PHANTOM '
      if (!disc) disc = 'OK'

      const flag = disc === 'OK' ? '✓' : '⚠ ' + disc.trim()
      console.log(`api=[${apiText.join(',')}] manifest=[${manifestText}] ${flag}`)

      rows.push({
        title: f.title,
        slug: f.slug,
        asset_id: f.mux_asset_id!,
        api_tracks: apiText.join('|'),
        manifest_tracks: manifestText,
        de_in_api: deInApi,
        de_in_manifest: deInManifest,
        en_in_api: enInApi,
        en_in_manifest: enInManifest,
        discrepancy: disc.trim(),
      })
    } catch (err: unknown) {
      console.log(`ERR ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  // CSV
  const csv = [
    'title,slug,asset_id,api_tracks,manifest_tracks,de_in_api,de_in_manifest,en_in_api,en_in_manifest,discrepancy',
    ...rows.map((r) =>
      [
        JSON.stringify(r.title),
        r.slug,
        r.asset_id,
        r.api_tracks,
        r.manifest_tracks,
        r.de_in_api,
        r.de_in_manifest,
        r.en_in_api,
        r.en_in_manifest,
        r.discrepancy,
      ].join(',')
    ),
  ].join('\n')
  const csvPath = resolve(process.cwd(), 'scripts', 'compare-api-vs-manifest.csv')
  writeFileSync(csvPath, csv + '\n')

  // Summary
  const matches = rows.filter((r) => r.discrepancy === 'OK').length
  const deHidden = rows.filter((r) => r.discrepancy.includes('DE_HIDDEN')).length
  const enHidden = rows.filter((r) => r.discrepancy.includes('EN_HIDDEN')).length
  console.log('\n========== SUMMARY ==========')
  console.log(`Films audited:          ${rows.length}`)
  console.log(`API matches manifest:   ${matches}`)
  console.log(`DE hidden from manifest: ${deHidden}`)
  console.log(`EN hidden from manifest: ${enHidden}`)
  console.log(`\nCSV: ${csvPath}`)

  console.log('\n--- Films where API & manifest both have DE+EN (control group) ---')
  rows.filter((r) => r.de_in_api && r.de_in_manifest && r.en_in_api && r.en_in_manifest).forEach((r) => console.log(`  ${r.title}`))

  console.log('\n--- Films where DE is in API but missing from manifest ---')
  rows.filter((r) => r.discrepancy.includes('DE_HIDDEN')).forEach((r) => console.log(`  ${r.title}`))

  console.log('\n--- Films where EN is in API but missing from manifest ---')
  rows.filter((r) => r.discrepancy.includes('EN_HIDDEN')).forEach((r) => console.log(`  ${r.title}`))
}

run().catch((err) => {
  console.error('Fatal:', err)
  process.exit(1)
})
