import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Abo-Status, die Zugang zu den Inhalten geben.
 *
 * `trialing` MUSS enthalten sein: waehrend der siebentaegigen Testphase
 * meldet Stripe genau diesen Status, und der Webhook uebernimmt ihn
 * unveraendert. Fehlt er, ist jeder Neukunde in seiner ersten Woche
 * ausgesperrt -- obwohl er eine gueltige Karte hinterlegt hat.
 *
 * Bewusst NICHT enthalten:
 *   past_due  - Zahlung offen. Dafuer gibt es /payment-failed und die Mail;
 *               ein offener Zugang waere eine Einladung, es dabei zu belassen.
 *   unpaid, canceled, incomplete, incomplete_expired, paused
 *
 * Diese Liste ist die einzige Stelle, an der die Regel steht. Sie lag frueher
 * als `.eq('status', 'active')` in sechs Dateien verstreut, vier davon falsch.
 *
 * Bewusst ohne schwere Importe (kein Stripe-SDK, kein Supabase-Client): das
 * Modul wird auch aus src/proxy.ts geladen, das in der Edge-Middleware laeuft.
 */
export const ACCESS_GRANTING_STATUSES = ['active', 'trialing'] as const

export type AccessGrantingStatus = (typeof ACCESS_GRANTING_STATUSES)[number]

/**
 * Zweite Bedingung neben dem Status: subscriptions.access_blocked_reason.
 *
 * Der Status allein reicht nicht. Wird eine Zahlung angefochten, holt sich der
 * Kunde das Geld zurueck -- Stripe laesst das Abo dabei aber auf 'active'.
 * Die Sperre steht deshalb in einem eigenen Feld, das kein spaeteres
 * customer.subscription.updated ueberschreibt.
 */
export async function hasSubscriptionAccess(
  supabase: SupabaseClient,
  userId: string
): Promise<boolean> {
  const { data } = await supabase
    .from('subscriptions')
    .select('id')
    .eq('user_id', userId)
    .in('status', ACCESS_GRANTING_STATUSES)
    .is('access_blocked_reason', null)
    .limit(1)

  return Boolean(data && data.length > 0)
}
