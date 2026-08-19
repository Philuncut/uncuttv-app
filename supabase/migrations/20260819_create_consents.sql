-- Zustimmungen der Nutzer zu Rechtstexten.
--
-- Append-only: eine Zustimmung ist Historie, kein Zustand. Aendert sich die
-- Fassung der AGB, kommt eine neue Zeile dazu -- die alte bleibt, sonst laesst
-- sich spaeter nicht mehr belegen, wer welcher Fassung wann zugestimmt hat.
--
-- Geschrieben wird ausschliesslich serverseitig mit der Service-Role. Es gibt
-- bewusst keine INSERT/UPDATE/DELETE-Policy: waere der Zeitstempel aus dem
-- Browser setzbar, waere er als Nachweis wertlos.

create table if not exists public.consents (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users (id) on delete cascade,
  kind                text not null,
  legal_version       text not null,
  accepted_at         timestamptz not null default now(),
  ip                  inet,
  user_agent          text,
  checkout_session_id text,
  constraint consents_kind_check check (kind in ('signup', 'withdrawal_waiver'))
);

comment on table  public.consents is 'Append-only Nachweis erteilter Zustimmungen. Writes nur via Service-Role.';
comment on column public.consents.kind is 'signup = AGB + Datenschutz; withdrawal_waiver = Erklaerungen nach AGB 7.3';
comment on column public.consents.legal_version is 'LEGAL_VERSION aus src/lib/legal.ts zum Zeitpunkt der Zustimmung';

create index if not exists consents_user_id_kind_idx
  on public.consents (user_id, kind, accepted_at desc);

-- Row Level Security -------------------------------------------------------

alter table public.consents enable row level security;

-- Nutzer duerfen ihre eigenen Zustimmungen lesen, sonst nichts.
-- Service-Role umgeht RLS und braucht keine Policy.
drop policy if exists "Users can read own consents" on public.consents;
create policy "Users can read own consents"
  on public.consents
  for select
  to authenticated
  using (auth.uid() = user_id);

-- Grants -------------------------------------------------------------------
-- Supabase vergibt auf neuen Tabellen in public per Default-Privileges volle
-- Rechte an anon und authenticated. Ohne das folgende REVOKE haetten beide
-- Rollen hier wieder INSERT/UPDATE/DELETE auf alle Spalten.

revoke all on table public.consents from anon;
revoke all on table public.consents from authenticated;

grant select on table public.consents to authenticated;
grant all    on table public.consents to service_role;
