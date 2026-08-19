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
