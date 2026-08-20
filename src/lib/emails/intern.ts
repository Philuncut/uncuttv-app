import { siteUrl } from '@/lib/env'

const base = siteUrl()

/**
 * Interne Benachrichtigung ans Backoffice.
 *
 * Bewusst eine Vorlage fuer alle Vorgaenge, die jemand von Hand ansehen muss
 * -- Anfechtungen, widerrufene Mandate und was noch dazukommt. Der Inhalt
 * steckt in den Zeilen, nicht in fuenf fast gleichen Dateien.
 */
export function InternNotificationEmail({
  title,
  intro,
  rows,
}: {
  title: string
  intro: string
  rows: { label: string; value: string }[]
}) {
  const rowsHtml = rows
    .map(
      (row) => `
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.08);vertical-align:top;width:40%;">
            <span style="font-size:0.72rem;letter-spacing:0.12em;text-transform:uppercase;color:#6b7280;">${row.label}</span>
          </td>
          <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.08);vertical-align:top;">
            <span style="font-size:0.9rem;color:#f0ece4;word-break:break-all;">${row.value}</span>
          </td>
        </tr>`
    )
    .join('')

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
                  UNCUT<span style="color:#d52029;">TV</span>
                </span>
              </a>
            </td>
          </tr>
          <tr>
            <td style="background:#1a1a1a;border:1px solid rgba(255,255,255,0.08);padding:40px 40px 32px;">
              <div style="height:3px;background:#d52029;margin-bottom:32px;"></div>

              <h1 style="font-size:1.5rem;font-weight:900;letter-spacing:0.06em;color:#f0ece4;margin:0 0 16px 0;text-transform:uppercase;">
                ${title}
              </h1>

              <p style="font-size:0.92rem;color:#9ca3af;line-height:1.8;margin:0 0 24px 0;">
                ${intro}
              </p>

              <table width="100%" cellpadding="0" cellspacing="0">
                ${rowsHtml}
              </table>
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
