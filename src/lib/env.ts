/**
 * Zentrale, typisierte Env-Zugriffe.
 *
 * Wird auch aus der Middleware (Edge Runtime) importiert. Deshalb hier
 * ausschliesslich statische `process.env.X`-Zugriffe und keine Node-APIs:
 * dynamischer Zugriff (`process.env[name]`) haengelt das Build-Time-Inlining
 * von Next.js aus und liefert in der Middleware `undefined`.
 */

/** Kanonische Produktionsdomain. uncuttv.at ist ein anderes Projekt (Shop). */
const SITE_URL_FALLBACK = 'https://uncuttv.app'

/** 'true'/'1' -> true, 'false'/'0' -> false, alles andere -> undefined (= nicht gesetzt). */
function parseFlag(raw: string | undefined): boolean | undefined {
  if (raw == null) return undefined
  switch (raw.trim().toLowerCase()) {
    case 'true':
    case '1':
      return true
    case 'false':
    case '0':
      return false
    default:
      return undefined
  }
}

/**
 * Maintenance-Modus: leitet alle oeffentlichen Routen auf /maintenance um und
 * setzt robots.txt auf `Disallow: /`.
 *
 * Reihenfolge: MAINTENANCE_MODE -> NEXT_PUBLIC_MAINTENANCE_MODE (Fallback fuer
 * den Uebergang, kann nach dem naechsten Deploy entfernt werden) -> true.
 *
 * Der Default ist bewusst "an": eine fehlende, leere oder unlesbare Variable
 * darf die Seite niemals versehentlich oeffentlich schalten.
 */
export function isMaintenanceMode(): boolean {
  return (
    parseFlag(process.env.MAINTENANCE_MODE) ??
    parseFlag(process.env.NEXT_PUBLIC_MAINTENANCE_MODE) ??
    true
  )
}

/** Kanonische Origin der Seite, garantiert ohne Slash am Ende. */
export function siteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim()
  const raw = configured && configured.length > 0 ? configured : SITE_URL_FALLBACK
  return raw.replace(/\/+$/, '')
}
