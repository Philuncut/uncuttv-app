import { siteUrl } from '@/lib/env'

const base = siteUrl()

/**
 * Bestaetigt dem Nutzer in Textform, welchen Rechtstexten er in welcher
 * Fassung zugestimmt hat. Der Aktivierungslink kommt separat von Supabase --
 * diese Mail ist der Zustimmungsnachweis, nicht die Adressbestaetigung.
 */
export function RegistrierungEmail({
  email,
  legalVersion,
  acceptedAt,
}: {
  email: string
  legalVersion: string
  acceptedAt: string
}) {
  return `
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Deine Registrierung bei UncutTV</title>
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

              <div style="height:3px;background:#E50914;margin-bottom:32px;"></div>

              <h1 style="font-size:1.6rem;font-weight:900;letter-spacing:0.06em;color:#f0ece4;margin:0 0 16px 0;text-transform:uppercase;">
                Deine Registrierung
              </h1>

              <p style="font-size:0.92rem;color:#9ca3af;line-height:1.8;margin:0 0 24px 0;">
                Dein Konto f&uuml;r <strong style="color:#f0ece4;">${email}</strong> wurde angelegt.
                Bitte best&auml;tige deine E-Mail-Adresse &uuml;ber den Link, den wir dir in einer
                separaten Nachricht geschickt haben.
              </p>

              <!-- Zustimmungsnachweis -->
              <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid rgba(255,255,255,0.12);background:rgba(255,255,255,0.03);margin-bottom:32px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <div style="font-size:0.7rem;letter-spacing:0.15em;text-transform:uppercase;color:#E50914;margin-bottom:12px;">
                      Deine Zustimmung
                    </div>
                    <p style="font-size:0.86rem;color:#9ca3af;line-height:1.8;margin:0 0 12px 0;">
                      Du hast bei der Registrierung den
                      <a href="${base}/de/agb" style="color:#f0ece4;">Allgemeinen Gesch&auml;ftsbedingungen</a>
                      und der
                      <a href="${base}/de/datenschutz" style="color:#f0ece4;">Datenschutzerkl&auml;rung</a>
                      zugestimmt.
                    </p>
                    <p style="font-size:0.8rem;color:#6b7280;line-height:1.8;margin:0;">
                      Fassung: ${legalVersion}<br/>
                      Zeitpunkt: ${acceptedAt}
                    </p>
                  </td>
                </tr>
              </table>

              <p style="font-size:0.78rem;color:#6b7280;line-height:1.8;margin:0;">
                Diese Email wurde an <span style="color:#f0ece4;">${email}</span> gesendet.<br/>
                Du hast dich nicht registriert? Dann ignoriere diese Nachricht einfach.<br/>
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
