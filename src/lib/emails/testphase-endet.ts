export function TestphaseEndetEmail({ email, endDate }: { email: string; endDate: string }) {
  return `
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Deine Testphase endet bald – UncutTV</title>
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
              <div style="height:3px;background:#E50914;box-shadow:0 0 20px rgba(229,9,20,0.5);margin-bottom:32px;"></div>

              <h1 style="font-size:1.6rem;font-weight:900;letter-spacing:0.06em;color:#f0ece4;margin:0 0 16px 0;text-transform:uppercase;">
                Deine Testphase endet bald
              </h1>

              <p style="font-size:0.92rem;color:#9ca3af;line-height:1.8;margin:0 0 24px 0;">
                Deine 7-tägige kostenlose Testphase bei UncutTV endet am <strong style="color:#f0ece4;">${endDate}</strong>. Danach wird dein Abo automatisch für <strong style="color:#f0ece4;">€19,90/Monat</strong> verlängert.
              </p>

              <!-- Info Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);margin-bottom:32px;">
                <tr>
                  <td style="padding:16px 20px;">
                    <p style="font-size:0.72rem;letter-spacing:0.1em;color:#9ca3af;margin:0 0 10px 0;text-transform:uppercase;">Dein Abo</p>
                    <p style="font-size:0.82rem;color:#6b7280;line-height:2;margin:0;">
                      ✓ Unbegrenzter Zugang zu allen Filmen<br/>
                      ✓ Monatlich kündbar, keine Mindestlaufzeit<br/>
                      ✓ Kündigung jederzeit über „Mein Konto"
                    </p>
                  </td>
                </tr>
              </table>

              <p style="font-size:0.92rem;color:#9ca3af;line-height:1.8;margin:0 0 32px 0;">
                Möchtest du nicht weiter dabei sein? Kündige einfach vor dem <strong style="color:#f0ece4;">${endDate}</strong> in deinem Konto – es entstehen keine Kosten.
              </p>

              <table cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
                <tr>
                  <td style="background:#E50914;padding:14px 32px;">
                    <a href="https://uncuttv.vercel.app/de/films" style="color:#f0ece4;text-decoration:none;font-size:0.88rem;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;">
                      Weiter Filme schauen →
                    </a>
                  </td>
                </tr>
              </table>

              <table cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
                <tr>
                  <td style="border:1px solid rgba(255,255,255,0.08);padding:12px 24px;">
                    <a href="https://uncuttv.vercel.app/de/account" style="color:#9ca3af;text-decoration:none;font-size:0.82rem;letter-spacing:0.06em;">
                      Abo verwalten / kündigen
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
