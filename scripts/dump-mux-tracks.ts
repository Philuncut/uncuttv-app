/**
 * Dump full MUX track details for a film, including all properties.
 * Used to find why a "ready" track isn't appearing in the HLS manifest.
 *
 * Run (from app/):
 *   npx tsx scripts/dump-mux-tracks.ts "Fake News"
 */

import { config } from 'dotenv'
import { resolve } from 'path'
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

async function run() {
  const query = process.argv[2] || 'Fake News'
  const { data: films } = await supabase
    .from('films')
    .select('id, title, slug, mux_asset_id')
    .ilike('title', `%${query}%`)
    .not('mux_asset_id', 'is', null)
    .limit(3)

  if (!films || films.length === 0) {
    console.error('No film found.')
    process.exit(1)
  }

  for (const film of films) {
    console.log('\n========================================')
    console.log(`FILM: ${film.title}`)
    console.log(`  asset_id: ${film.mux_asset_id}`)
    const asset = await mux.video.assets.retrieve(film.mux_asset_id!)
    console.log(`  status: ${asset.status}`)
    console.log(`  duration: ${asset.duration}`)
    const tracks = asset.tracks || []
    console.log(`\nALL TRACKS (${tracks.length}):`)
    tracks.forEach((t, i) => {
      console.log(`\n  --- track[${i}] ---`)
      console.log(JSON.stringify(t, null, 2).split('\n').map((l) => '  ' + l).join('\n'))
    })
  }
}

run().catch((err) => {
  console.error('Fatal:', err)
  process.exit(1)
})
