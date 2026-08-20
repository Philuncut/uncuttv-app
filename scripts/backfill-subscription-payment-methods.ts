/**
 * Zieht payment_settings.payment_method_types auf Bestandsabos nach.
 *
 * Abos, die vor der Erweiterung der Zahlungsarten entstanden sind, tragen nur
 * ['card'] -- Stripe Checkout uebertraegt die Liste der Session auf das
 * entstehende Abo. Wechselt so ein Kunde im Konto auf SEPA, wird die Methode
 * gespeichert und als Standard gesetzt, die naechste Verlaengerung scheitert
 * aber, weil sepa_debit in den payment_settings des Abos fehlt.
 *
 * Betroffen sind nur laufende Abos: 'active' und 'trialing'. Beendete oder
 * unbezahlte werden nicht angefasst -- sie werden nicht mehr eingezogen.
 *
 * Trockenlauf (aendert nichts, Standard):
 *   npx tsx scripts/backfill-subscription-payment-methods.ts
 *
 * Tatsaechlich schreiben:
 *   npx tsx scripts/backfill-subscription-payment-methods.ts --apply
 */

import { config } from 'dotenv'
import { resolve } from 'path'
import Stripe from 'stripe'

config({ path: resolve(process.cwd(), '.env.local') })

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-02-25.clover' })

/** Muss mit der Liste in src/app/api/stripe/checkout/route.ts uebereinstimmen. */
const TARGET_TYPES = ['card', 'paypal', 'klarna', 'sepa_debit'] as const

/** Nur laufende Abos -- beendete werden nicht mehr eingezogen. */
const STATUSES: Stripe.SubscriptionListParams.Status[] = ['active', 'trialing']

const APPLY = process.argv.includes('--apply')

function sameTypes(current: string[] | null | undefined): boolean {
  if (!current) return false
  if (current.length !== TARGET_TYPES.length) return false
  const sorted = [...current].sort().join(',')
  return sorted === [...TARGET_TYPES].sort().join(',')
}

async function main() {
  if (!process.env.STRIPE_SECRET_KEY) {
    console.error('STRIPE_SECRET_KEY fehlt in .env.local')
    process.exit(1)
  }

  const mode = APPLY ? 'SCHREIBEN' : 'TROCKENLAUF (aendert nichts)'
  const keyKind = process.env.STRIPE_SECRET_KEY.startsWith('sk_live') ? 'LIVE' : 'TEST'
  console.log(`Modus: ${mode} | Stripe-Schluessel: ${keyKind}`)
  console.log(`Zielliste: ${TARGET_TYPES.join(', ')}`)
  console.log('')

  let total = 0
  let alreadyFine = 0
  const needsUpdate: { id: string; status: string; current: string }[] = []

  for (const status of STATUSES) {
    for await (const sub of stripe.subscriptions.list({ status, limit: 100 })) {
      total += 1
      const current = sub.payment_settings?.payment_method_types ?? null

      if (sameTypes(current)) {
        alreadyFine += 1
        continue
      }

      needsUpdate.push({
        id: sub.id,
        status: sub.status,
        // null bedeutet: keine Einschraenkung am Abo, Stripe faellt auf die
        // Rechnungs- bzw. Kundeneinstellung zurueck.
        current: current ? current.join(', ') : '(keine Einschraenkung)',
      })
    }
  }

  console.log(`Geprueft:            ${total}`)
  console.log(`Bereits korrekt:     ${alreadyFine}`)
  console.log(`Anzupassen:          ${needsUpdate.length}`)
  console.log('')

  if (needsUpdate.length === 0) {
    console.log('Nichts zu tun.')
    return
  }

  for (const row of needsUpdate) {
    console.log(`  ${row.id}  ${row.status.padEnd(9)}  bisher: ${row.current}`)
  }
  console.log('')

  if (!APPLY) {
    console.log('Trockenlauf beendet. Zum Schreiben erneut mit --apply aufrufen.')
    return
  }

  let updated = 0
  let failed = 0

  for (const row of needsUpdate) {
    try {
      await stripe.subscriptions.update(row.id, {
        payment_settings: { payment_method_types: [...TARGET_TYPES] },
      })
      updated += 1
      console.log(`  aktualisiert: ${row.id}`)
    } catch (error) {
      failed += 1
      console.error(`  FEHLER bei ${row.id}:`, error instanceof Error ? error.message : error)
    }
  }

  console.log('')
  console.log(`Aktualisiert: ${updated} | Fehlgeschlagen: ${failed}`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
