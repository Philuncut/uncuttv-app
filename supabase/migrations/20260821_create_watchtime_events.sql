-- Zeitlich aufgeloeste Watchtime fuer die monatliche Ausschuettung.
--
-- Die bestehende Tabelle public.watchtime bleibt unangetastet. Sie haelt je
-- (user_id, film_id) genau eine Zeile, seconds_watched ist der Hoechststand
-- der erreichten Abspielposition. Damit gibt es keine Monatsgrenze,
-- Mehrfachsichtungen zaehlen einmal und Vorspulen zaehlt voll -- fuer
-- "Weiterschauen" ist das richtig, fuer eine Abrechnung nicht.
--
-- Diese Tabelle ist ein Journal: nur anhaengen, nie aendern, nie loeschen.
-- Jede Zeile ist ein gebuchter Zeitraum mit Zeitstempel.

create table if not exists public.watchtime_events (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        not null,
  film_id     uuid        not null,
  seconds     integer     not null,
  occurred_at timestamptz not null default now(),

  -- ABWEICHUNG von der Vorgabe, mit Begruendung:
  -- Der zu buchende Wert ist die Differenz zur zuletzt bekannten Position.
  -- watchtime.last_position taugt dafuer nicht -- das ist ein Hoechststand und
  -- faellt beim Zurueckspulen oder beim erneuten Ansehen nie zurueck. Der
  -- Anker muss deshalb hier liegen: die Position, die dieser Ping gemeldet
  -- hat. Der naechste Ping bildet seine Differenz dagegen.
  -- Bleibt leer, wenn ein Client seine Abspieldauer selbst mitzaehlt und
  -- sendet -- dann wird keine Position gebraucht.
  position_seconds integer,

  constraint watchtime_events_seconds_nonneg check (seconds >= 0)
);

comment on table public.watchtime_events is
  'Journal der abgespielten Zeit fuer die Ausschuettung. Nur anhaengen. Wird ausschliesslich serverseitig mit dem Service-Role-Client geschrieben.';
comment on column public.watchtime_events.seconds is
  'Tatsaechlich abgespielte Sekunden seit dem vorigen Ping, serverseitig gedeckelt. 0 ist zulaessig und kommt vor (Sitzungsbeginn, Zurueckspulen, Vorspulen).';
comment on column public.watchtime_events.position_seconds is
  'Abspielposition zum Zeitpunkt dieses Pings. Anker fuer die Differenzbildung des naechsten Pings, kein Abrechnungswert.';

-- Vorgegebene Indizes
create index if not exists watchtime_events_occurred_at_idx
  on public.watchtime_events (occurred_at);

create index if not exists watchtime_events_film_occurred_idx
  on public.watchtime_events (film_id, occurred_at);

-- ERGAENZT, weil der Schreibweg ihn braucht: bei jedem Ping wird das letzte
-- Ereignis dieses Nutzers zu diesem Film gelesen, um die Differenz zu bilden.
-- Ohne diesen Index laeuft das mit wachsender Tabelle in einen Scan.
create index if not exists watchtime_events_user_film_occurred_idx
  on public.watchtime_events (user_id, film_id, occurred_at desc);

-- ── Zugriff ────────────────────────────────────────────────────────────────
--
-- RLS an, KEINE Policy. Damit kommen weder anon noch authenticated an die
-- Tabelle -- weder lesend noch schreibend. Der Service-Role-Client umgeht RLS
-- und ist der einzige Schreibweg.
--
-- Der Grund ist nicht Ordnungsliebe: waeren Inserts vom Client erlaubt,
-- koennte jeder angemeldete Nutzer beliebig viele Sekunden auf einen Film
-- seiner Wahl buchen und damit steuern, an wen ausgeschuettet wird.
--
-- Genau das ist bei public.watchtime heute der Fall -- die Android- und die
-- webOS-App schreiben dort direkt mit dem Anon-Key hinein. Fuer
-- "Weiterschauen" ist das hinnehmbar, fuer Geld nicht.

alter table public.watchtime_events enable row level security;

-- Zusaetzlich die Tabellenrechte entziehen. RLS ohne Policy wuerde schon
-- reichen; das hier ist die zweite Schranke, falls je versehentlich eine
-- Policy angelegt wird.
revoke all on public.watchtime_events from anon, authenticated;

grant select, insert on public.watchtime_events to service_role;

-- Bewusst KEINE Fremdschluessel auf auth.users oder public.films: das Journal
-- traegt die Abrechnungsgrundlage und muss ein geloeschtes Konto oder einen
-- zurueckgezogenen Film ueberdauern. Der Bezug wird beim Auswerten per join
-- hergestellt; Zeilen ohne Gegenstueck fallen dort auf, statt still zu
-- verschwinden.
