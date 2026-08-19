-- Ergebnis der Altersverifikation, wie Veriff es meldet.
--
-- age_verified bleibt das Tor (boolean, nur true bei approved). Diese Spalte
-- haelt zusaetzlich fest, WARUM jemand nicht durchkommt -- ohne sie kann
-- /auth/verify-age zwischen "laeuft noch", "abgelehnt" und "neuer Versuch
-- noetig" nicht unterscheiden, weil Veriff die Entscheidung asynchron per
-- Webhook liefert und nicht in der Rueckleitung.
--
-- Freitext statt Enum: Veriff kann Status ergaenzen (approved, declined,
-- resubmission_requested, review, expired, abandoned). Unbekannte Werte
-- landen in der UI im neutralen Fall statt einen Insert scheitern zu lassen.

alter table public.profiles
  add column if not exists age_verification_status text;

alter table public.profiles
  add column if not exists age_verification_updated_at timestamptz;

comment on column public.profiles.age_verification_status is
  'Letzter von Veriff gemeldeter Status. age_verified ist das eigentliche Tor.';

-- Grants: gehoert wie consent_email_sent NICHT in die Spaltenliste, die
-- authenticated nach dem REVOKE auf public.profiles zurueckbekommt --
-- sonst schaltet sich jeder eingeloggte Nutzer selbst frei.
