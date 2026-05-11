/**
 * READ-ONLY audit of subtitle tracks on every MUX asset.
 *
 * - Pulls every film with a mux_asset_id from Supabase
 * - For each film, lists text tracks via Mux API
 * - Writes scripts/audit-mux-subtitles.csv with one row per film
 * - Prints a summary to stdout
 *
 * NO POST/PATCH/DELETE calls. Pure inspection.
 *
 * Run (from app/):
 *   npx tsx scripts/audit-mux-subtitles.ts
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
})

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

type TextTrackInfo = {
  id: string
  language_code: string
  name: string | null
  status: string
  text_type: string | null
  text_source: string | null
}

function csvEscape(v: unknown): string {
  if (v === null || v === undefined) return ''
  const s = String(v)
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return '"' + s.replace(/"/g, '""') + '"'
  }
  return s
}

async function run() {
  console.log('Fetching films from Supabase...')
  const { data: films, error } = await supabase
    .from('films')
    .select('id, title, slug, subtitles, mux_asset_id, mux_playback_id, is_published')
    .not('mux_asset_id', 'is', null)
    .order('title', { ascending: true })

  if (error) {
    console.error('Supabase error:', error.message)
    process.exit(1)
  }
  if (!films || films.length === 0) {
    console.log('No films with mux_asset_id found.')
    return
  }

  console.log(`Auditing ${films.length} film(s)...\n`)

  const rows: string[] = []
  rows.push(
    [
      'film_id',
      'title',
      'slug',
      'is_published',
      'mux_asset_id',
      'supabase_subtitles',
      'mux_text_track_count',
      'de_status',
      'de_track_id',
      'en_status',
      'en_track_id',
      'other_text_tracks',
      'asset_status',
      'error',
    ].join(',')
  )

  let totalDeMissing = 0
  let totalDeErrored = 0
  let totalEnMissing = 0
  let totalEnErrored = 0
  let totalNoTextTracks = 0
  let totalAssetErrors = 0

  for (let i = 0; i < films.length; i++) {
    const f = films[i]
    const prefix = `[${i + 1}/${films.length}] ${f.title}`
    let assetStatus = ''
    let textTracks: TextTrackInfo[] = []
    let errMsg = ''

    try {
      const asset = await mux.video.assets.retrieve(f.mux_asset_id!)
      assetStatus = asset.status || ''
      const tracks = asset.tracks || []
      textTracks = tracks
        .filter((t) => t.type === 'text')
        .map((t) => ({
          id: t.id || '',
          language_code: (t as { language_code?: string }).language_code || '',
          name: (t as { name?: string }).name || null,
          status: t.status || '',
          text_type: (t as { text_type?: string }).text_type || null,
          text_source: (t as { text_source?: string }).text_source || null,
        }))
    } catch (err: unknown) {
      errMsg = err instanceof Error ? err.message : String(err)
      totalAssetErrors++
    }

    const deTracks = textTracks.filter((t) => t.language_code.toLowerCase().startsWith('de'))
    const enTracks = textTracks.filter((t) => t.language_code.toLowerCase().startsWith('en'))
    const otherTracks = textTracks.filter(
      (t) => !t.language_code.toLowerCase().startsWith('de') && !t.language_code.toLowerCase().startsWith('en')
    )

    const dePrimary = deTracks[0]
    const enPrimary = enTracks[0]
    const deStatus = dePrimary ? dePrimary.status : 'MISSING'
    const enStatus = enPrimary ? enPrimary.status : 'MISSING'

    if (textTracks.length === 0 && !errMsg) totalNoTextTracks++
    if (deStatus === 'MISSING') totalDeMissing++
    else if (deStatus !== 'ready') totalDeErrored++
    if (enStatus === 'MISSING') totalEnMissing++
    else if (enStatus !== 'ready') totalEnErrored++

    const flag =
      errMsg
        ? '⚠️ ERR'
        : textTracks.length === 0
        ? '✗ no text tracks'
        : deStatus === 'MISSING'
        ? '✗ no DE'
        : deStatus !== 'ready'
        ? `✗ DE ${deStatus}`
        : enStatus === 'MISSING'
        ? '~ no EN'
        : enStatus !== 'ready'
        ? `~ EN ${enStatus}`
        : '✓'

    console.log(
      `${prefix}\n  asset=${f.mux_asset_id} status=${assetStatus || '?'} text=${textTracks.length} de=${deStatus} en=${enStatus} ${flag}${
        errMsg ? '  ERR=' + errMsg : ''
      }`
    )

    rows.push(
      [
        f.id,
        f.title,
        f.slug,
        f.is_published,
        f.mux_asset_id,
        Array.isArray(f.subtitles) ? f.subtitles.join('|') : '',
        textTracks.length,
        deStatus,
        dePrimary?.id || '',
        enStatus,
        enPrimary?.id || '',
        otherTracks.map((t) => `${t.language_code}:${t.status}`).join('|'),
        assetStatus,
        errMsg,
      ]
        .map(csvEscape)
        .join(',')
    )
  }

  const csvPath = resolve(process.cwd(), 'scripts', 'audit-mux-subtitles.csv')
  writeFileSync(csvPath, rows.join('\n') + '\n', 'utf8')

  console.log('\n========== SUMMARY ==========')
  console.log(`Total films audited:        ${films.length}`)
  console.log(`Asset retrieval errors:     ${totalAssetErrors}`)
  console.log(`Films with 0 text tracks:   ${totalNoTextTracks}`)
  console.log(`German MISSING:             ${totalDeMissing}`)
  console.log(`German not "ready":         ${totalDeErrored}`)
  console.log(`English MISSING:            ${totalEnMissing}`)
  console.log(`English not "ready":        ${totalEnErrored}`)
  console.log(`\nCSV written to: ${csvPath}`)
}

run().catch((err) => {
  console.error('Fatal:', err)
  process.exit(1)
})
