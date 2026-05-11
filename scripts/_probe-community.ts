import { config } from 'dotenv'
import { resolve } from 'path'
config({ path: resolve(process.cwd(), '.env.local') })
async function run() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const r = await fetch(`${url}/rest/v1/community_top_films?select=*&limit=20`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  })
  console.log('GET community_top_films:', r.status)
  console.log((await r.text()).substring(0, 1500))
  const r2 = await fetch(`${url}/rest/v1/watchtime?select=film_id,user_id,updated_at,seconds_watched,last_position&limit=10&order=updated_at.desc`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  })
  console.log('\nGET watchtime sample:', r2.status)
  console.log((await r2.text()).substring(0, 2000))
  // Total row count
  const r3 = await fetch(`${url}/rest/v1/watchtime?select=count`, {
    headers: { apikey: key, Authorization: `Bearer ${key}`, Prefer: 'count=exact' },
  })
  console.log('\nwatchtime count headers:', r3.headers.get('content-range'))
}
run().catch(console.error)
