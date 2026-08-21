/**
 * Jeder Zugriff auf die films-Tabelle, der einem Nutzer etwas zeigt oder
 * etwas freigibt, muss auf veroeffentlichte Filme eingeschraenkt sein.
 *
 * Die Bedingung stand bisher an sieben Stellen einzeln ausgeschrieben, an zwei
 * weiteren fehlte sie -- ein noch nicht veroeffentlichter Film war dadurch
 * ueber die Playback-Schnittstelle und ueber die Gutscheinpruefung weiterhin
 * erreichbar. Hier steht sie einmal, und ein grep nach onlyPublished zeigt
 * vollstaendig, welche Zugriffe unter die Regel fallen.
 *
 * Warum die Abfrage hineingereicht wird, statt dass der Helfer sie aufbaut:
 * supabase-js liest den Spaltenstring auf Typebene aus, um die Zeilenform
 * abzuleiten. Kommt er als Variable statt als Literal, faellt die Ableitung
 * auf GenericStringError zurueck; wird er durch einen eigenen Typparameter
 * gereicht, laeuft die Typpruefung aus dem Speicher. select() bleibt deshalb
 * bei den Aufrufern, hier kommt nur die Bedingung dazu -- der Abfragetyp geht
 * unveraendert wieder hinaus.
 *
 * Bewusst nicht darueber laufen:
 * - getUserVouchers in lib/vouchers.ts. Das ist die eigene Einloesehistorie
 *   eines Nutzers; wird ein Film spaeter zurueckgezogen, soll sein Gutschein
 *   nicht ohne Titel dastehen. Die Begruendung steht dort noch einmal.
 * - Die Weiterschauen-Reihe in films/page.tsx. Die Filme kommen dort als
 *   verbundene Zeilen aus watchtime; gefiltert wird nach dem Laden in
 *   Javascript, mit derselben Bedingung.
 */
export function onlyPublished<Query>(query: Query): Query {
  return (query as unknown as { eq(column: string, value: unknown): Query }).eq(
    'is_published',
    true
  )
}
