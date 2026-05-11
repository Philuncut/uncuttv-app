/**
 * Fetch the MUX master HLS manifest for a film and dump
 * all #EXT-X-MEDIA lines + first 1500 chars of raw content.
 *
 * Run (from app/):
 *   npx tsx scripts/dump-mux-manifest.ts "Fake News"
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

async function dump(label: string, url: string) {
  console.log(`\n--- ${label} ---`)
  console.log(url.length > 140 ? url.substring(0, 140) + '...' : url)
  try {
    const r = await fetch(url)
    console.log(`HTTP ${r.status} ${r.statusText}`)
    const text = await r.text()
    console.log(`Length: ${text.length} bytes`)

    const lines = text.split('\n')
    const mediaLines = lines.filter((l) => l.startsWith('#EXT-X-MEDIA'))
    console.log(`#EXT-X-MEDIA lines (${mediaLines.length}):`)
    mediaLines.forEach((l, i) => console.log(`  [${i}] ${l}`))

    const subLines = mediaLines.filter((l) => l.includes('TYPE=SUBTITLES'))
    console.log(`SUBTITLES tracks in manifest: ${subLines.length}`)
    subLines.forEach((l, i) => {
      const lang = (l.match(/LANGUAGE="([^"]+)"/) || [])[1] || ''
      const name = (l.match(/NAME="([^"]+)"/) || [])[1] || ''
      const uri = (l.match(/URI="([^"]+)"/) || [])[1] || ''
      console.log(`  sub[${i}] lang="${lang}" name="${name}"`)
      console.log(`         uri=${uri}`)
    })

    console.log(`\nFirst 1500 chars:`)
    console.log(text.substring(0, 1500))
  } catch (err: unknown) {
    console.log(`FETCH ERROR: ${err instanceof Error ? err.message : String(err)}`)
  }
}

async function run() {
  const query = process.argv[2] || 'Fake News'
  console.log(`Looking up film matching "${query}"...`)

  const { data: films, error } = await supabase
    .from('films')
    .select('id, title, slug, mux_playback_id, mux_asset_id')
    .ilike('title', `%${query}%`)
    .not('mux_playback_id', 'is', null)
    .limit(3)

  if (error) {
    console.error('Supabase error:', error.message)
    process.exit(1)
  }
  if (!films || films.length === 0) {
    console.error('No film found.')
    process.exit(1)
  }

  for (const film of films) {
    console.log('\n========================================')
    console.log(`FILM: ${film.title}`)
    console.log(`  id:               ${film.id}`)
    console.log(`  slug:             ${film.slug}`)
    console.log(`  mux_playback_id:  ${film.mux_playback_id}`)
    console.log(`  mux_asset_id:     ${film.mux_asset_id}`)

    const playbackId = film.mux_playback_id!

    // 1) Default signed token (video only)
    const tokenVideo = await mux.jwt.signPlaybackId(playbackId, {
      type: 'video',
      expiration: '1h',
    })
    await dump('SIGNED (type=video, default)', `https://stream.mux.com/${playbackId}.m3u8?token=${tokenVideo}`)

    // 2) Unsigned (will likely 403 — playback IDs are signed-only after migration)
    await dump('UNSIGNED (no token)', `https://stream.mux.com/${playbackId}.m3u8`)

    // 3) Variant: redundant_streams=true (if MUX is hiding subtitles by default)
    const tokenVideo2 = await mux.jwt.signPlaybackId(playbackId, {
      type: 'video',
      expiration: '1h',
    })
    await dump(
      'SIGNED + redundant_streams=true',
      `https://stream.mux.com/${playbackId}.m3u8?token=${tokenVideo2}&redundant_streams=true`
    )
  }
}

run().catch((err) => {
  console.error('Fatal:', err)
  process.exit(1)
})
