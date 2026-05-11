-- Trending films via distinct-user count over the last 7 days.
--
-- SECURITY DEFINER so anonymous viewers can read aggregates without
-- bypassing the row-level RLS that protects per-user watchtime rows.
-- Returns only aggregated columns (no user_id) so no PII leaks.
--
-- Replaces the older community_top_films view (kept in place for the
-- Android client until that's migrated separately).

CREATE OR REPLACE FUNCTION public.get_community_films()
RETURNS TABLE(film_id uuid, viewer_count bigint)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT
    w.film_id,
    COUNT(DISTINCT w.user_id) AS viewer_count
  FROM public.watchtime w
  WHERE w.updated_at > (NOW() - INTERVAL '7 days')
    AND w.seconds_watched >= 60          -- exclude accidental clicks
  GROUP BY w.film_id
  ORDER BY viewer_count DESC, MAX(w.updated_at) DESC
  LIMIT 10;
$$;

GRANT EXECUTE ON FUNCTION public.get_community_films() TO anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_community_films() FROM public;
