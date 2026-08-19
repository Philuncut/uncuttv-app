-- Merkt, ob der Zustimmungsnachweis nach der Adressbestaetigung schon
-- verschickt wurde.
--
-- Bewusst hier und nicht in consents: consents ist ein append-only
-- Rechtsnachweis, kein Zustellprotokoll. Das Flag folgt dem Muster von
-- profiles.welcome_email_sent.
--
-- Gesetzt wird es ausschliesslich serverseitig aus /auth/callback, und zwar
-- bedingt (`where consent_email_sent = false`), sodass parallele Anfragen
-- nicht zu zwei Mails fuehren.

alter table public.profiles
  add column if not exists consent_email_sent boolean not null default false;

comment on column public.profiles.consent_email_sent is
  'true, sobald der Zustimmungsnachweis nach bestaetigter Adresse verschickt wurde';

-- Hinweis zu den Grants: solange authenticated tabellenweites UPDATE auf
-- public.profiles besitzt, ist auch diese Spalte durch jeden eingeloggten
-- Nutzer schreibbar. Ein spaltenweises REVOKE greift dagegen nicht -- der
-- tabellenweite Grant muss zuerst entzogen und danach spaltenweise neu
-- vergeben werden (siehe separates Grant-Skript fuer profiles).
-- consent_email_sent gehoert dabei NICHT in die Liste der Spalten, die
-- authenticated zurueckbekommt.
