/**
 * Attempt to apply the subtitle_urls migration via Supabase's PostgREST.
 * This relies on a SQL-exec RPC being installed in the project. If not,
 * the script reports the error and you must run the SQL manually in the
 * Supabase dashboard SQL editor.
 */
import { config } from 'dotenv'
import { resolve } from 'path'
import { readFileSync } from 'fs'
config({ path: resolve(process.cwd(), '.env.local') })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
const MIGRATION = 'supabase/migrations/20260407_add_subtitle_urls.sql'

async function tryRpc(name: string, body: object) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${name}`, {
    method: 'POST',
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })
  return { status: r.status, body: await r.text() }
}

async function run() {
  const sql = readFileSync(MIGRATION, 'utf8')
  console.log('SQL to apply:\n' + sql)

  for (const [name, body] of [
    ['exec_sql', { sql }],
    ['exec', { sql }],
    ['execute_sql', { query: sql }],
  ] as const) {
    console.log(`\nTrying RPC: ${name}`)
    const res = await tryRpc(name, body)
    console.log(`  status=${res.status}  body=${res.body.substring(0, 200)}`)
    if (res.status >= 200 && res.status < 300) {
      console.log('  ✓ Migration applied via RPC.')
      return
    }
  }

  console.log('\n✗ No SQL-exec RPC available on this project.')
  console.log('Apply the migration manually:')
  console.log('  1. Open https://supabase.com/dashboard/project/' +
    SUPABASE_URL.replace('https://', '').split('.')[0] + '/sql/new')
  console.log('  2. Paste the contents of ' + MIGRATION)
  console.log('  3. Click Run')
  console.log('Then re-run the populate script.')
}

run().catch((err) => {
  console.error('Fatal:', err)
  process.exit(1)
})
