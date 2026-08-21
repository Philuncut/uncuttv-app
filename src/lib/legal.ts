/**
 * Fassung der Rechtstexte (AGB, Datenschutzerklaerung, Ruecktrittsbelehrung)
 * UND des Zustimmungswortlauts unter legal.consent.* in den Message-Dateien.
 *
 * Bei jeder inhaltlichen Aenderung an einem dieser Texte hochzaehlen -- an
 * dieser einen Stelle. Jede gespeicherte Zustimmung traegt den Wert, der zum
 * Zeitpunkt der Zustimmung galt. Damit laesst sich beantworten, wer welcher
 * Fassung zugestimmt hat und wen man nach einer Aenderung erneut fragen muss.
 *
 * Aendert sich der angezeigte Text ohne Erhoehung, verweisen bestehende
 * Zeilen in consents auf einen Wortlaut, den es so nie gab.
 *
 * Format: ISO-Datum der Fassung. Nicht identisch mit dem "Stand:" auf /agb --
 * dieser Wert deckt auch Datenschutzerklaerung und Checkbox-Wortlaut ab, die
 * sich unabhaengig von den AGB aendern koennen.
 *
 * 2026-08-20: finaler Wortlaut der Registrierungs-Checkbox (vorher Platzhalter)
 * 2026-08-21: AGB Ziffer 4.5 (Laufzeit und Kuendigung des Jahresabos) ergaenzt,
 *             Paragraph 4 in 4.1 bis 4.5 gegliedert, Jahrespreis in 4.2 aufgenommen,
 *             Paragraph 5 und 6 tarifabhaengig gefasst, Paragraph 7 im PDF-Export auf
 *             die Fassung der Website angeglichen
 * 2026-08-22: Datenschutzerklaerung Abschnitt 8 richtiggestellt -- die
 *             Wiedergabedauer wird nicht anonymisiert, sondern mit dem
 *             Nutzerkonto verknuepft gespeichert; im selben Zug ergaenzt,
 *             was bei einer Kontoloeschung mit den Eintraegen geschieht.
 *             Zwei Aenderungen am selben Tag, die Fassungskennung kann sie
 *             nicht unterscheiden -- unkritisch, weil zwischen beiden keine
 *             Zustimmung gespeichert wurde (geprueft: alle Zeilen in
 *             consents tragen 2026-08-20).
 */
export const LEGAL_VERSION = '2026-08-22'

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
