import { siteUrl } from '@/lib/env'

const base = siteUrl()

export function PinResetEmail({ code }: { code: string }) {
  return `
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>PIN zurücksetzen – UncutTV</title>
</head>
<body style="margin:0;padding:0;background:#141414;font-family:'DM Sans',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#141414;padding:48px 24px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:560px;">

          <!-- Logo -->
          <tr>
            <td align="center" style="padding-bottom:40px;">
              <span style="font-size:2rem;font-weight:900;letter-spacing:0.08em;color:#f0ece4;">
                UNCUT<span style="color:#E50914;">TV</span>
              </span>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background:#1a1a1a;border:1px solid rgba(255,255,255,0.08);padding:40px 40px 32px;">

              <!-- Red top bar -->
              <div style="height:3px;background:#E50914;margin-bottom:32px;"></div>

              <h1 style="font-size:1.6rem;font-weight:900;letter-spacing:0.06em;color:#f0ece4;margin:0 0 16px 0;text-transform:uppercase;">
                PIN zurücksetzen
              </h1>

              <p style="font-size:0.92rem;color:#9ca3af;line-height:1.8;margin:0 0 32px 0;">
                Du hast einen Reset-Code für deinen Content-PIN angefordert.
              </p>

              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
                <tr>
                  <td align="center" style="border:2px solid #E50914;padding:24px 16px;background:rgba(229,9,20,0.06);">
                    <span style="font-family:ui-monospace,'Cascadia Code','Segoe UI Mono',monospace;font-size:36px;font-weight:700;letter-spacing:0.2em;color:#f0ece4;">
                      ${code}
                    </span>
                  </td>
                </tr>
              </table>

              <p style="font-size:0.92rem;color:#9ca3af;line-height:1.8;margin:0 0 24px 0;">
                Dieser Code ist 15 Minuten gültig. Bitte gib ihn in der UncutTV TV App ein.
              </p>

              <p style="font-size:0.82rem;color:#6b7280;line-height:1.8;margin:0;">
                Falls du keinen Reset angefordert hast, ignoriere diese E-Mail. Dein PIN wurde nicht verändert.
              </p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top:24px;">
              <p style="font-size:0.72rem;color:#4b5563;margin:0;line-height:1.8;">
                UncutTV GmbH · Kalchgruben 4/11 · 6094 Axams · Österreich · ATU81526957<br/>
                <a href="${base}/de/impressum" style="color:#4b5563;">Impressum</a> ·
                <a href="${base}/de/datenschutz" style="color:#4b5563;">Datenschutz</a> ·
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
