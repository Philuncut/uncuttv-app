export function AboGekuendigtEmail({ email, endDate }: { email: string; endDate: string }) {
  return `
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Abo gekündigt – UncutTV</title>
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

              <!-- Grey top bar -->
              <div style="height:3px;background:rgba(255,255,255,0.15);margin-bottom:32px;"></div>

              <h1 style="font-size:1.6rem;font-weight:900;letter-spacing:0.06em;color:#f0ece4;margin:0 0 16px 0;text-transform:uppercase;">
                Abo gekündigt
              </h1>

              <p style="font-size:0.92rem;color:#9ca3af;line-height:1.8;margin:0 0 24px 0;">
                Deine Kündigung wurde erfolgreich verarbeitet. Du hast weiterhin vollen Zugang zu allen UncutTV-Inhalten bis zum Ende deiner bezahlten Laufzeit.
              </p>

              <!-- End Date Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);margin-bottom:32px;">
                <tr>
                  <td style="padding:16px 20px;">
                    <p style="font-size:0.72rem;letter-spacing:0.1em;color:#9ca3af;margin:0 0 8px 0;text-transform:uppercase;">Zugang bis</p>
                    <p style="font-size:1.2rem;font-weight:700;color:#f0ece4;margin:0;">${endDate}</p>
                  </td>
                </tr>
              </table>

              <p style="font-size:0.92rem;color:#9ca3af;line-height:1.8;margin:0 0 32px 0;">
                Du kannst dein Abo jederzeit reaktivieren – dein Konto bleibt erhalten.
              </p>

              <!-- CTA Button -->
              <table cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
                <tr>
                  <td style="background:#E50914;padding:14px 32px;">
                    <a href="https://uncuttv.vercel.app/de/subscribe" style="color:#f0ece4;text-decoration:none;font-size:0.88rem;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;">
                      Abo reaktivieren →
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
                UncutTV GmbH · Kalchgruben 4/11 · 6094 Axams · Österreich<br/>
                <a href="https://uncuttv.vercel.app/de/impressum" style="color:#4b5563;">Impressum</a> ·
                <a href="https://uncuttv.vercel.app/de/datenschutz" style="color:#4b5563;">Datenschutz</a> ·
                <a href="https://uncuttv.vercel.app/de/agb" style="color:#4b5563;">AGB</a>
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
