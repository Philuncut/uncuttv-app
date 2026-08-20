/**
 * Einzige Quelle fuer die Preise, die in der Oberflaeche stehen.
 *
 * Vorher standen die Betraege als Zeichenketten direkt im PlanSelector.
 * Sobald eine zweite Seite denselben Preis nennt, laufen die Zahlen bei der
 * naechsten Preisaenderung auseinander -- deshalb hier zentral, in Cent, und
 * jede Anzeige leitet sich davon ab.
 *
 * Die Betraege muessen zu den Stripe-Preisen hinter STRIPE_PRICE_ID und
 * STRIPE_YEARLY_PRICE_ID passen. Stripe ist die Wahrheit fuer das, was
 * abgebucht wird; diese Datei ist die Wahrheit fuer das, was draufsteht.
 * Preisaenderung heisst also: hier UND im Stripe-Dashboard.
 */
export const PRICING = {
  currency: 'EUR',
  /** Preis des Monatsabos in Cent. */
  monthlyCents: 1990,
  /**
   * Preis des Jahresabos in Cent.
   *
   * MUSS mit dem Stripe-Preis hinter STRIPE_YEARLY_PRICE_ID uebereinstimmen.
   * Weicht der Wert ab, bewirbt die Seite einen anderen Preis als abgebucht
   * wird -- und der Kunde sieht die Abweichung erst im Checkout. Stripe laesst
   * den Betrag eines Preisobjekts nicht nachtraeglich aendern: eine
   * Preisaenderung heisst dort neues Preisobjekt, neue ID in der Umgebung,
   * und hier derselbe neue Betrag.
   */
  yearlyCents: 20000,
  /** Kostenlose Testphase, gilt fuer beide Tarife (siehe Checkout-Route). */
  trialDays: 7,
} as const

/**
 * Schaltet den Jahrestarif in der gesamten Oberflaeche: Umschalter und
 * Jahrespreis im PlanSelector, Jahreszeile im Verkaufsblock der Anmeldeseite.
 *
 * ACHTUNG bei false: der Verkaufsblock faellt automatisch auf die reine
 * Monatszeile zurueck, damit die Seite keinen Tarif bewirbt, den niemand
 * buchen kann. Wer den Schalter umlegt, muss keine Texte nachziehen.
 *
 * Steht neben den Preisen und nicht in einer Komponente: Startseite,
 * /subscribe und die Anmeldeseite fragen denselben Schalter ab, er darf nur
 * an einer Stelle existieren.
 */
export const SHOW_YEARLY_PLAN = true

/**
 * Monatsaequivalent des Jahresabos, aufgerundet auf ganze Cent.
 *
 * Aufgerundet und nicht kaufmaennisch gerundet: das Monatsaequivalent darf
 * den tatsaechlichen Jahrespreis nicht unterbieten, sonst steht auf der Seite
 * ein Preis, der zwoelfmal genommen unter der Abbuchung liegt.
 */
export const YEARLY_PER_MONTH_CENTS = Math.ceil(PRICING.yearlyCents / 12)

/** Ersparnis des Jahresabos gegenueber zwoelf Monatszahlungen, in Cent. */
export const YEARLY_SAVINGS_CENTS = PRICING.monthlyCents * 12 - PRICING.yearlyCents

/**
 * Preis als Text in der Sprache des Nutzers: "19,90 €" auf Deutsch,
 * "€19.90" auf Englisch. Kein eigenes Format-Gebastel -- Komma, Punkt und
 * Position des Zeichens unterscheiden sich je Sprache.
 */
export function formatPrice(cents: number, locale: string): string {
  return new Intl.NumberFormat(numberLocale(locale), {
    style: 'currency',
    currency: PRICING.currency,
    minimumFractionDigits: 2,
  }).format(cents / 100)
}

/**
 * Nur die Zahl, ohne Waehrungszeichen: "19,90" bzw. "19.90". Fuer Stellen,
 * an denen das Eurozeichen eigenes Markup hat -- etwa die grosse Preiszahl im
 * PlanSelector, wo es als hochgestelltes <sup> daneben steht.
 */
export function formatAmount(cents: number, locale: string): string {
  return new Intl.NumberFormat(numberLocale(locale), {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100)
}

function numberLocale(locale: string): string {
  return locale === 'en' ? 'en-IE' : 'de-DE'
}
