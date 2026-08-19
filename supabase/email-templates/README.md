# Supabase Auth — E-Mail-Vorlagen

Vier gebrandete Vorlagen zum Einfügen in **Supabase Dashboard → Authentication →
Emails → Templates**. Sie werden bewusst **nicht** per API oder Migration
ausgerollt: Supabase pflegt sie ausschließlich im Dashboard bzw. in der
`config.toml` eines lokalen Setups.

## Zuordnung

| Datei | Dashboard-Slot | Verwendete Variablen |
|---|---|---|
| `confirm-signup.html` | Confirm signup | `{{ .ConfirmationURL }}` |
| `reset-password.html` | Reset password | `{{ .ConfirmationURL }}` |
| `magic-link.html` | Magic Link | `{{ .ConfirmationURL }}` |
| `change-email.html` | Change Email Address | `{{ .ConfirmationURL }}`, `{{ .Email }}`, `{{ .NewEmail }}` |

`{{ .Email }}` ist bei „Change Email Address" die **bisherige** Adresse,
`{{ .NewEmail }}` die neue. In den übrigen Vorlagen wird keine Adresse
ausgegeben — sie stünde ohnehin im Empfängerfeld.

## Betreffzeilen

Der Betreff wird im Dashboard separat gepflegt, nicht in der HTML-Datei:

| Slot | Vorschlag |
|---|---|
| Confirm signup | `E-Mail bestätigen / Confirm your email — UncutTV` |
| Reset password | `Passwort zurücksetzen / Reset your password — UncutTV` |
| Magic Link | `Dein Anmeldelink / Your sign-in link — UncutTV` |
| Change Email Address | `Neue E-Mail bestätigen / Confirm your new email — UncutTV` |

## Warum `{{ .ConfirmationURL }}` und nicht `{{ .TokenHash }}`

`{{ .ConfirmationURL }}` berücksichtigt das `emailRedirectTo`, das
`src/app/api/auth/register/route.ts` beim `signUp` mitgibt — inklusive des
`locale`-Parameters. Der Nutzer landet darüber auf `/auth/callback`, das sowohl
den `code`- als auch den `token_hash`-Zweig verarbeitet.

Die Alternative wäre, direkt auf die App zu verlinken:

```
{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=signup
```

Das spart einen Redirect über Supabase, umgeht aber `emailRedirectTo` — der
`locale`-Parameter fiele weg und jeder Nutzer landete auf Deutsch. Deshalb hier
nicht verwendet.

## Technische Randbedingungen

- Tabellen-Layout, `max-width: 600px`, ausschließlich Inline-CSS. Kein Flexbox,
  kein Grid, keine externen Stylesheets — beides wird von Outlook und einigen
  Webmailern nicht oder falsch gerendert.
- **Bebas Neue lädt in E-Mails nicht.** Webfonts scheiden ohne externes
  Stylesheet aus, deshalb steht die Schrift nur in der `font-family`-Kette und
  greift ausschließlich dort, wo sie lokal installiert ist. Real sehen fast
  alle Empfänger die Rückfallebene **Arial Black**. Die Überschriften sind
  deshalb durchgehend in Großbuchstaben gesetzt, damit die Rückfallebene
  gewollt aussieht und nicht nach kaputtem Font.
- `color-scheme: dark` ist gesetzt. Einige Clients (vor allem Gmail auf
  Android) invertieren dunkle Mails trotzdem eigenmächtig; das lässt sich nicht
  vollständig verhindern.
- Jeder Button hat den Link darunter zusätzlich als kopierbaren Text — nötig
  für Clients, die Buttons abschneiden, und für Weiterleitungen als Plaintext.

## Vor dem Aktivieren prüfen

1. **Site URL und Redirect URLs** in Supabase → Authentication → URL
   Configuration müssen `https://uncuttv.app` bzw. `https://uncuttv.app/auth/callback`
   enthalten, sonst zeigt `{{ .ConfirmationURL }}` auf die falsche Domain.
2. **Testmail an ein Gmail-, ein Outlook- und ein Apple-Mail-Konto** schicken.
   Die drei rendern dunkle Vorlagen am unterschiedlichsten.
3. Der Absender läuft über Supabase, nicht über Resend. Soll er auf
   `uncuttv.at` bzw. `uncuttv.app` lauten, muss in Supabase ein eigener
   SMTP-Absender hinterlegt sein.
