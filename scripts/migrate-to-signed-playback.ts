/**
 * One-time migration: convert all Mux public playback IDs to signed.
 *
 * For each film in Supabase:
 *   1. Create a new signed playback ID on the Mux asset
 *   2. Delete the old public playback ID from Mux
 *   3. Update mux_playback_id in Supabase with the new signed ID
 *
 * Run (from the app/ directory):
 *   npx tsx scripts/migrate-to-signed-playback.ts
 *
 * Requires in .env.local:
 *   MUX_TOKEN_ID, MUX_TOKEN_SECRET
 *   NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */

import { config } from 'dotenv'
import { resolve } from 'path'
import Mux from '@mux/mux-node'
import { createClient } from '@supabase/supabase-js'

// Load .env.local
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
  console.log('Fetching films from Supabase...')

  const { data: films, error } = await supabase
    .from('films')
    .select('id, title, mux_asset_id, mux_playback_id')
    .not('mux_asset_id', 'is', null)
    .not('mux_playback_id', 'is', null)

  if (error) {
    console.error('Failed to fetch films:', error.message)
    process.exit(1)
  }

  if (!films || films.length === 0) {
    console.log('No films found.')
    return
  }

  console.log(`Found ${films.length} film(s). Starting migration...\n`)

  for (const film of films) {
    const { id, title, mux_asset_id, mux_playback_id } = film
    console.log(`[${title}] asset: ${mux_asset_id} | current playback ID: ${mux_playback_id}`)

    try {
      // 1. Create new signed playback ID
      const created = await mux.video.assets.createPlaybackId(mux_asset_id, {
        policy: 'signed',
      })
      const newPlaybackId = created.id
      console.log(`  ✓ Created signed playback ID: ${newPlaybackId}`)

      // 2. Delete old public playback ID
      await mux.video.assets.deletePlaybackId(mux_asset_id, mux_playback_id)
      console.log(`  ✓ Deleted old public playback ID: ${mux_playback_id}`)

      // 3. Update Supabase
      const { error: updateError } = await supabase
        .from('films')
        .update({ mux_playback_id: newPlaybackId })
        .eq('id', id)

      if (updateError) {
        console.error(`  ✗ Failed to update Supabase for film ${id}:`, updateError.message)
        continue
      }

      console.log(`  ✓ Supabase updated → mux_playback_id: ${newPlaybackId}\n`)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      console.error(`  ✗ Error processing film "${title}":`, message, '\n')
    }
  }

  console.log('Migration complete.')
}

run()
