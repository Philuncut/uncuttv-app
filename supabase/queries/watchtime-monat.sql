-- Ausschuettungsgrundlage: abgespielte Zeit je Film in einem Monat.
--
-- Den Monat unten in `monat` setzen -- irgendein Tag darin genuegt, es wird
-- auf den Monatsanfang gerundet. Die Grenzen werden in Europe/Vienna
-- gebildet, nicht in UTC: sonst faellt der erste Abend des Monats in den
-- Vormonat und der letzte Abend fehlt.
--
-- Zeilen mit seconds = 0 (Sitzungsbeginn, Zurueckspulen, Vorspulen) stoeren
-- die Summe nicht, sie tragen null bei.

with monat as (
  select date '2026-08-01' as tag          -- <<< hier den Monat setzen
),
grenzen as (
  select
    (date_trunc('month', tag))::timestamp                        at time zone 'Europe/Vienna' as von,
    (date_trunc('month', tag) + interval '1 month')::timestamp   at time zone 'Europe/Vienna' as bis
  from monat
),
je_film as (
  select
    e.film_id,
    sum(e.seconds)::bigint          as sekunden,
    count(*) filter (where e.seconds > 0) as gebuchte_pings,
    count(distinct e.user_id)       as zuschauer
  from public.watchtime_events e
  cross join grenzen g
  where e.occurred_at >= g.von
    and e.occurred_at <  g.bis
  group by e.film_id
)
select
  coalesce(f.title, '<Film geloescht: ' || j.film_id::text || '>') as titel,
  f.slug,
  j.sekunden,
  round(j.sekunden / 3600.0, 2)                                   as stunden,
  round(100.0 * j.sekunden / nullif(sum(j.sekunden) over (), 0), 4) as anteil_prozent,
  j.zuschauer,
  j.gebuchte_pings
from je_film j
left join public.films f on f.id = j.film_id
order by j.sekunden desc;


-- ── Gegenprobe: Summe und Zeitraum ─────────────────────────────────────────
-- Sollte dieselbe Gesamtsumme ergeben wie die Spalte `sekunden` oben.
--
-- with monat as (select date '2026-08-01' as tag),
-- grenzen as (
--   select (date_trunc('month', tag))::timestamp                      at time zone 'Europe/Vienna' as von,
--          (date_trunc('month', tag) + interval '1 month')::timestamp at time zone 'Europe/Vienna' as bis
--   from monat
-- )
-- select g.von, g.bis,
--        count(*)                                as ereignisse,
--        sum(e.seconds)                          as sekunden_gesamt,
--        round(sum(e.seconds) / 3600.0, 2)       as stunden_gesamt,
--        count(distinct e.user_id)               as zuschauer,
--        count(distinct e.film_id)               as filme
-- from public.watchtime_events e cross join grenzen g
-- where e.occurred_at >= g.von and e.occurred_at < g.bis
-- group by g.von, g.bis;
