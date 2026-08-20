-- Kuendigungserklaerungen ueber den Kuendigungsbutton nach Paragraph 312k BGB.
--
-- Append-only wie consents: eine abgegebene Erklaerung ist ein Vorgang, kein
-- Zustand. Sie wird nie veraendert und nie geloescht -- im Streitfall ist der
-- Zeitstempel des Zugangs der entscheidende Wert.
--
-- Es gibt bewusst KEINE Policy, auch keine fuer SELECT: die Seite ist ohne
-- Login erreichbar, es gibt also keinen authentifizierten Nutzer, dem eine
-- Zeile zugeordnet werden koennte. Geschrieben und gelesen wird
-- ausschliesslich serverseitig mit der Service-Role.
--
-- Kein Bezug auf auth.users: wer kuendigt, muss nicht eingeloggt sein und die
-- angegebene Adresse muss keinem Konto entsprechen. Die Zuordnung passiert
-- manuell bei der Bearbeitung.

create table if not exists public.cancellations (
  id                uuid primary key default gen_random_uuid(),

  -- Art der Kuendigung
  cancellation_type text not null,
  reason            text,

  -- Bezeichnung des Vertrags
  contract          text not null,

  -- Erklaerende Person
  first_name        text not null,
  last_name         text not null,
  email             text not null,

  -- Gewuenschter Zeitpunkt der Beendigung
  termination_type  text not null,
  termination_date  date,

  -- Nachweis des Zugangs
  received_at       timestamptz not null default now(),
  ip                inet,
  user_agent        text,
  locale            text not null,

  constraint cancellations_type_check
    check (cancellation_type in ('ordinary', 'extraordinary')),
  constraint cancellations_contract_check
    check (contract in ('monthly', 'yearly')),
  constraint cancellations_termination_type_check
    check (termination_type in ('next_possible', 'specific_date')),

  -- Bei ausserordentlicher Kuendigung ist der Grund Pflicht.
  constraint cancellations_reason_required
    check (cancellation_type <> 'extraordinary'
           or (reason is not null and length(btrim(reason)) > 0)),

  -- Bei einem bestimmten Datum muss dieses gesetzt sein.
  constraint cancellations_date_required
    check (termination_type <> 'specific_date' or termination_date is not null)
);

comment on table public.cancellations is
  'Kuendigungserklaerungen nach Paragraph 312k BGB. Append-only, Writes nur via Service-Role.';
comment on column public.cancellations.received_at is
  'Datum und Uhrzeit des Zugangs -- nach Paragraph 312k Abs. 4 zu bestaetigen.';

create index if not exists cancellations_email_received_idx
  on public.cancellations (email, received_at desc);

-- Row Level Security -------------------------------------------------------

alter table public.cancellations enable row level security;
-- Keine Policy: damit erreicht ausser der Service-Role niemand die Tabelle.

-- Grants -------------------------------------------------------------------
-- Supabase vergibt auf neuen Tabellen in public per Default-Privileges volle
-- Rechte an anon und authenticated. Ohne das folgende REVOKE koennte jeder
-- Besucher fremde Kuendigungen lesen, aendern oder loeschen.

revoke all on table public.cancellations from anon;
revoke all on table public.cancellations from authenticated;

grant all on table public.cancellations to service_role;
