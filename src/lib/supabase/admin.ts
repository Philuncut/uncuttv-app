import { createClient, type SupabaseClient } from '@supabase/supabase-js'

/**
 * Supabase-Client mit Service-Role-Key. Umgeht RLS und darf deshalb
 * ausschliesslich serverseitig laufen: Route Handler, Server Actions,
 * Webhooks. Niemals aus einer Client-Komponente importieren.
 *
 * Notwendig ueberall dort, wo kein Nutzer-Cookie existiert -- ein Webhook
 * kommt von Stripe bzw. Veriff, nicht aus dem Browser, und der Cookie-Client
 * traefe unter RLS null Zeilen.
 */
let cached: SupabaseClient | null = null

export function createAdminClient(): SupabaseClient {
  if (typeof window !== 'undefined') {
    throw new Error('createAdminClient darf nicht im Browser verwendet werden')
  }

  if (cached) return cached

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceRoleKey) {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_URL und SUPABASE_SERVICE_ROLE_KEY muessen gesetzt sein'
    )
  }

  cached = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  return cached
}

/**
 * Liefert die E-Mail-Adresse eines Nutzers aus auth.users.
 *
 * Die Tabelle public.profiles hat KEINE email-Spalte -- die Adresse liegt
 * ausschliesslich in auth.users und ist nur ueber die Admin-API erreichbar.
 * Fuer Kontomails ist das ohnehin die massgebliche Quelle: Stripes
 * customer.email ist eine Kopie vom Zeitpunkt der Anlage und kann abweichen.
 */
export async function getUserEmail(userId: string): Promise<string | null> {
  const admin = createAdminClient()
  const { data, error } = await admin.auth.admin.getUserById(userId)

  if (error) {
    console.error(`getUserEmail: lookup failed for ${userId} -`, error.message)
    return null
  }

  return data.user?.email ?? null
}

export type WriteResult = {
  error: { message: string } | null
  count: number | null
}

/**
 * Prueft das Ergebnis eines Writes und meldet beide Fehlerarten.
 *
 * Ein Update, das null Zeilen trifft, ist in PostgREST kein Fehler -- `error`
 * bleibt null. Genau dieser Fall blieb bisher unsichtbar, als die Webhooks
 * noch mit dem Anon-Key gegen RLS schrieben. Aufrufer muessen den Writes
 * daher `{ count: 'exact' }` mitgeben.
 */
export function reportWrite(context: string, result: WriteResult): boolean {
  if (result.error) {
    console.error(`${context}: write failed - ${result.error.message}`)
    return false
  }
  if (result.count === 0) {
    console.error(`${context}: write affected 0 rows`)
    return false
  }
  return true
}
