import type { NextRequest } from 'next/server'
import {
  createClient as createServiceClient,
  type SupabaseClient,
  type User,
} from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'

/**
 * Service-Role-Client. Umgeht RLS -- nur serverseitig verwenden und jede
 * Abfrage ausdruecklich auf den aufgeloesten Nutzer einschraenken.
 */
export function serviceClient(): SupabaseClient {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

/**
 * Loest den Nutzer einer Anfrage auf -- aus der Cookie-Sitzung (Web) oder aus
 * einem Bearer-Token (Fire TV, Google Play, webOS).
 *
 * Das Verfahren stammt aus api/mux/token und liegt jetzt hier, damit es im
 * Projekt nur einmal existiert.
 *
 * === Woher die Nutzer-ID kommt, und woher nicht ===
 * Ausschliesslich aus dem geprueften Token beziehungsweise der geprueften
 * Sitzung. `admin.auth.getUser(token)` laesst Supabase die Signatur des JWT
 * gegen das Projektgeheimnis pruefen und gibt die ID aus dem Token zurueck --
 * ein selbst zusammengebautes oder abgelaufenes Token faellt dort durch.
 *
 * Eine Nutzer-ID aus dem Anfragekoerper darf NIE verwendet werden. Der Koerper
 * ist unbeglaubigt: wer ihn schreibt, koennte eine fremde ID eintragen und in
 * deren Namen Watchtime buchen -- also die Ausschuettung steuern. Deshalb
 * nimmt /api/watchtime kein user_id-Feld entgegen und wird auch keines
 * bekommen.
 */
export async function resolveRequestUser(
  request: NextRequest,
  tag: string
): Promise<{ user: User | null; admin: SupabaseClient }> {
  const admin = serviceClient()

  const header = request.headers.get('Authorization')
  const bearer = header?.startsWith('Bearer ') ? header.slice(7) : null

  if (bearer) {
    const { data, error } = await admin.auth.getUser(bearer)
    if (error || !data.user) {
      console.error(`[${tag}] Bearer auth failed:`, error?.message)
      return { user: null, admin }
    }
    return { user: data.user, admin }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return { user, admin }
}
