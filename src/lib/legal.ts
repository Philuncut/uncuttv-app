/**
 * Fassung der Rechtstexte (AGB, Datenschutzerklaerung, Ruecktrittsbelehrung).
 *
 * Bei jeder inhaltlichen Aenderung an einem dieser Texte hochzaehlen -- an
 * dieser einen Stelle. Jede gespeicherte Zustimmung traegt den Wert, der zum
 * Zeitpunkt der Zustimmung galt. Damit laesst sich beantworten, wer welcher
 * Fassung zugestimmt hat und wen man nach einer Aenderung erneut fragen muss.
 *
 * Format: ISO-Datum der Fassung, passend zum "Stand:" auf /agb.
 */
export const LEGAL_VERSION = '2026-08-19'

/**
 * signup           - AGB + Datenschutzerklaerung, bei der Registrierung
 * withdrawal_waiver - die beiden Erklaerungen nach AGB 7.3, im Checkout
 *
 * Muss mit consents_kind_check in der Migration uebereinstimmen.
 */
export const CONSENT_KINDS = ['signup', 'withdrawal_waiver'] as const

export type ConsentKind = (typeof CONSENT_KINDS)[number]

/**
 * Der Wortlaut der Zustimmungen steht NICHT hier, sondern in
 * src/messages/{de,en}.json unter `legal.consent.*`. Diese Datei haelt nur
 * die Fassungskennung und die Typen -- der Anwaltstext wird ausschliesslich
 * in den Message-Dateien gepflegt.
 */
