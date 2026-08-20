import { siteUrl } from '@/lib/env'

const base = siteUrl()

export type CancellationSummary = {
  /** Beschriftete Zeilen der Erklaerung, bereits in der Sprache des Nutzers. */
  rows: { label: string; value: string }[]
  receivedAt: string
  effective: string
  /** Hinweis, dass der genaue Termin gesondert bestaetigt wird. */
  effectiveNote?: string
}

function rowsToHtml(rows: { label: string; value: string }[]) {
  return rows
    .map(
      (row) => `
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.08);vertical-align:top;width:42%;">
            <span style="font-size:0.72rem;letter-spacing:0.12em;text-transform:uppercase;color:#6b7280;">${row.label}</span>
          </td>
          <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.08);vertical-align:top;">
            <span style="font-size:0.9rem;color:#f0ece4;">${row.value}</span>
          </td>
        </tr>`
    )
    .join('')
}

function shell(title: string, body: string) {
  return `
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#141414;font-family:'DM Sans',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#141414;padding:48px 24px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:560px;">
          <tr>
            <td align="center" style="padding-bottom:40px;">
              <a href="${base}" style="text-decoration:none;">
                <span style="font-size:2rem;font-weight:900;letter-spacing:0.08em;color:#f0ece4;">
                  UNCUT<span style="color:#E50914;">TV</span>
                </span>
              </a>
            </td>
          </tr>
          <tr>
            <td style="background:#1a1a1a;border:1px solid rgba(255,255,255,0.08);padding:40px 40px 32px;">
              <div style="height:3px;background:#E50914;margin-bottom:32px;"></div>
              ${body}
            </td>
          </tr>
          <tr>
            <td align="center" style="padding-top:24px;">
              <p style="font-size:0.72rem;color:#4b5563;margin:0;line-height:1.8;">
                UncutTV GmbH &middot; Kalchgruben 4/11 &middot; 6094 Axams &middot; &Ouml;sterreich<br/>
                <a href="${base}/de/impressum" style="color:#4b5563;">Impressum</a> &middot;
                <a href="${base}/de/datenschutz" style="color:#4b5563;">Datenschutz</a> &middot;
                <a href="${base}/de/agb" style="color:#4b5563;">AGB</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `
}

/**
 * Bestaetigung an die kuendigende Person.
 *
 * Paragraph 312k Abs. 4 BGB verlangt in Textform: den Inhalt der
 * Kuendigungserklaerung, Datum und Uhrzeit des Zugangs sowie den Zeitpunkt,
 * zu dem das Vertragsverhaeltnis beendet wird.
 */
export function KuendigungBestaetigungEmail(summary: CancellationSummary) {
  return shell(
    'Bestätigung deiner Kündigung',
    `
      <h1 style="font-size:1.6rem;font-weight:900;letter-spacing:0.06em;color:#f0ece4;margin:0 0 16px 0;text-transform:uppercase;">
        Bestätigung deiner Kündigung
      </h1>

      <p style="font-size:0.92rem;color:#9ca3af;line-height:1.8;margin:0 0 24px 0;">
        Deine Kündigungserklärung ist bei uns eingegangen. Nachfolgend findest du
        ihren Inhalt sowie Datum und Uhrzeit des Zugangs. Bewahre diese E-Mail als
        Nachweis auf.
      </p>

      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
        ${rowsToHtml(summary.rows)}
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.08);vertical-align:top;width:42%;">
            <span style="font-size:0.72rem;letter-spacing:0.12em;text-transform:uppercase;color:#6b7280;">Zugang am</span>
          </td>
          <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.08);vertical-align:top;">
            <span style="font-size:0.9rem;color:#f0ece4;">${summary.receivedAt}</span>
          </td>
        </tr>
        <tr>
          <td style="padding:10px 0;vertical-align:top;width:42%;">
            <span style="font-size:0.72rem;letter-spacing:0.12em;text-transform:uppercase;color:#E50914;">Beendigung zum</span>
          </td>
          <td style="padding:10px 0;vertical-align:top;">
            <span style="font-size:0.9rem;color:#f0ece4;">${summary.effective}</span>
          </td>
        </tr>
      </table>

      ${
        summary.effectiveNote
          ? `<p style="font-size:0.84rem;color:#9ca3af;line-height:1.8;margin:0 0 24px 0;">${summary.effectiveNote}</p>`
          : ''
      }

      <p style="font-size:0.78rem;color:#6b7280;line-height:1.8;margin:0;">
        Fragen zu dieser Kündigung?
        <a href="mailto:office@uncuttv.at" style="color:#E50914;text-decoration:none;">office@uncuttv.at</a>
      </p>
    `
  )
}

/** Interne Benachrichtigung -- die Kuendigung wird manuell in Stripe ausgefuehrt. */
export function KuendigungInternEmail(
  summary: CancellationSummary & { locale: string; ip: string | null }
) {
  return shell(
    'Neue Kündigung eingegangen',
    `
      <h1 style="font-size:1.6rem;font-weight:900;letter-spacing:0.06em;color:#f0ece4;margin:0 0 16px 0;text-transform:uppercase;">
        Neue Kündigung
      </h1>

      <p style="font-size:0.92rem;color:#9ca3af;line-height:1.8;margin:0 0 24px 0;">
        Über den Kündigungsbutton ist eine Erklärung eingegangen. Sie wurde
        <strong style="color:#f0ece4;">nicht</strong> automatisch in Stripe ausgeführt &ndash;
        bitte Identität prüfen und das Abo manuell beenden.
      </p>

      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
        ${rowsToHtml([
          ...summary.rows,
          { label: 'Zugang am', value: summary.receivedAt },
          { label: 'Beendigung zum', value: summary.effective },
          { label: 'Sprache', value: summary.locale },
          { label: 'IP-Adresse', value: summary.ip ?? '—' },
        ])}
      </table>
    `
  )
}
