-- Zahlungsanfechtungen und eine davon unabhaengige Zugangssperre.
--
-- Hintergrund: SEPA-Lastschriften sind acht Wochen lang ohne Angabe von
-- Gruenden anfechtbar und werden in diesem Zeitraum automatisch anerkannt.
-- Das Geld ist dann zurueck beim Kunden -- Stripe aendert dabei aber NICHT
-- den Status des Abos. Es bleibt 'active', und ohne die folgenden Spalten
-- behielte der Kunde seinen Zugang.

-- 1) Zugangssperre auf subscriptions --------------------------------------
--
-- Bewusst NICHT ueber subscriptions.status geloest: dort steht der Wert von
-- Stripe, und das naechste customer.subscription.updated wuerde eine hier
-- gesetzte Sperre wieder ueberschreiben. Ein eigenes Feld ueberlebt das.

alter table public.subscriptions
  add column if not exists access_blocked_reason text,
  add column if not exists access_blocked_at timestamptz;

comment on column public.subscriptions.access_blocked_reason is
  'null = frei. Sonst der Grund, aus dem der Zugang gesperrt wurde, z. B. dispute.';

-- 2) Protokoll der Vorgaenge ----------------------------------------------
--
-- Damit spaeter nachvollziehbar bleibt, warum ein Zugang endete. Append-only
-- bis auf den Abschluss der Anfechtung, der die Zeile ergaenzt.

create table if not exists public.payment_disputes (
  id                     uuid primary key default gen_random_uuid(),
  user_id                uuid references auth.users (id) on delete set null,

  stripe_dispute_id      text not null unique,
  stripe_charge_id       text,
  stripe_subscription_id text,

  amount                 bigint not null,
  currency               text not null,
  reason                 text,
  status                 text not null,
  payment_method_type    text,

  created_at             timestamptz not null default now(),
  closed_at              timestamptz,
  outcome                text
);

comment on table public.payment_disputes is
  'Zahlungsanfechtungen aus Stripe. Writes nur via Service-Role.';
comment on column public.payment_disputes.outcome is
  'Ergebnis nach charge.dispute.closed: won, lost, warning_closed ...';

create index if not exists payment_disputes_user_idx
  on public.payment_disputes (user_id, created_at desc);

-- Row Level Security -------------------------------------------------------

alter table public.payment_disputes enable row level security;
-- Keine Policy: die Tabelle geht ausschliesslich das Backoffice etwas an.

-- Grants -------------------------------------------------------------------
-- Ohne REVOKE haetten anon und authenticated durch die Default-Privileges
-- vollen Zugriff. Bei access_blocked_reason waere das besonders heikel: ein
-- Nutzer koennte seine eigene Sperre aufheben.

revoke all on table public.payment_disputes from anon;
revoke all on table public.payment_disputes from authenticated;
grant all on table public.payment_disputes to service_role;

-- Hinweis zu subscriptions: die beiden neuen Spalten fallen unter die
-- bestehenden Grants dieser Tabelle. Pruefen, dass authenticated dort kein
-- UPDATE besitzt -- sonst hebt sich jeder seine Sperre selbst auf.
