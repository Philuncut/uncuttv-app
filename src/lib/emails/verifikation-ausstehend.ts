import { siteUrl } from '@/lib/env'

const base = siteUrl()

/**
 * Warnung an Nutzer, deren Testphase endet, die aber noch nicht
 * altersverifiziert sind. Bewusst NICHT das Template testphase-endet: das
 * verspricht eine automatische Verlaengerung fuer 19,90 Euro -- fuer diese
 * Empfaenger waere das schlicht falsch, ihr Zugang endet stattdessen.
 */
export function VerifikationAusstehendEmail({
  email,
  endDate,
}: {
  email: string
  endDate: string
}) {
  return `
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Altersverifikation fehlt noch</title>
</head>
<body style="margin:0;padding:0;background:#141414;font-family:'DM Sans',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#141414;padding:48px 24px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:560px;">

          <!-- Logo -->
          <tr>
            <td align="center" style="padding-bottom:40px;">
              <a href="${base}" style="text-decoration:none;">
                <span style="font-size:2rem;font-weight:900;letter-spacing:0.08em;color:#f0ece4;">
                  UNCUT<span style="color:#E50914;">TV</span>
                </span>
              </a>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background:#1a1a1a;border:1px solid rgba(255,255,255,0.08);padding:40px 40px 32px;">

              <div style="height:3px;background:#E50914;margin-bottom:32px;"></div>

              <h1 style="font-size:1.6rem;font-weight:900;letter-spacing:0.06em;color:#f0ece4;margin:0 0 16px 0;text-transform:uppercase;">
                Deine Verifikation fehlt noch
              </h1>

              <p style="font-size:0.92rem;color:#9ca3af;line-height:1.8;margin:0 0 24px 0;">
                Deine Testphase endet am <strong style="color:#f0ece4;">${endDate}</strong>. Uns fehlt
                bis jetzt deine Altersverifikation &ndash; und ohne sie d&uuml;rfen wir dir die Inhalte
                nicht weiter zeig&shy;en.
              </p>

              <!-- Konsequenz -->
              <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid rgba(255,255,255,0.12);background:rgba(255,255,255,0.03);margin-bottom:28px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <div style="font-size:0.7rem;letter-spacing:0.15em;text-transform:uppercase;color:#E50914;margin-bottom:12px;">
                      Was passiert am ${endDate}
                    </div>
                    <p style="font-size:0.86rem;color:#9ca3af;line-height:1.8;margin:0 0 10px 0;">
                      <strong style="color:#f0ece4;">Ohne Verifikation:</strong> Dein Abo endet mit der
                      Testphase. Es wird <strong style="color:#f0ece4;">nichts abgebucht</strong>.
                    </p>
                    <p style="font-size:0.86rem;color:#9ca3af;line-height:1.8;margin:0;">
                      <strong style="color:#f0ece4;">Mit Verifikation:</strong> Alles l&auml;uft normal
                      weiter, dein Abo verl&auml;ngert sich f&uuml;r &euro;19,90 pro Monat. Jederzeit
                      k&uuml;ndbar.
                    </p>
                  </td>
                </tr>
              </table>

              <p style="font-size:0.92rem;color:#9ca3af;line-height:1.8;margin:0 0 28px 0;">
                Die Verifikation dauert rund zwei Minuten. Du brauchst einen Lichtbildausweis und eine
                Kamera.
              </p>

              <!-- CTA -->
              <table cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
                <tr>
                  <td style="background:#E50914;padding:14px 32px;">
                    <a href="${base}/de/auth/verify-age" style="color:#f0ece4;text-decoration:none;font-size:0.88rem;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;">
                      Jetzt verifizieren &rarr;
                    </a>
                  </td>
                </tr>
              </table>

              <p style="font-size:0.78rem;color:#6b7280;line-height:1.8;margin:0;">
                Diese Email wurde an <span style="color:#f0ece4;">${email}</span> gesendet.<br/>
                Fragen? <a href="mailto:support@uncuttv.at" style="color:#E50914;text-decoration:none;">support@uncuttv.at</a>
              </p>

            </td>
          </tr>

          <!-- Footer -->
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
