-- Merkt, ob ein Abo zum Ende der laufenden Periode gekuendigt ist.
--
-- Stripe fuehrt diesen Zustand als cancel_at_period_end auf der Subscription.
-- Er ist nicht aus `status` ableitbar: ein gekuendigtes Abo bleibt bis zum
-- Periodenende `active` bzw. `trialing`. Ohne die Spalte kann die Kontoseite
-- "Gekuendigt, Zugang noch bis ..." nicht anzeigen und die Kuendigen-Schaltflaeche
-- nicht ausblenden.
--
-- Geschrieben vom Stripe-Webhook (customer.subscription.created/updated) sowie
-- unmittelbar von /api/stripe/cancel-subscription, damit die neu geladene
-- Kontoseite nicht auf das Stripe-Ereignis warten muss.

alter table public.subscriptions
  add column if not exists cancel_at_period_end boolean not null default false;

comment on column public.subscriptions.cancel_at_period_end is
  'true, wenn das Abo zum Ende der laufenden Periode endet. Spiegelt Stripe.';
