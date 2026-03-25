import type { SupabaseClient } from '@supabase/supabase-js'
import type { FilmCardData } from '@/app/[locale]/films/FilmCatalog'

export type UserWatchFilmState = {
  completed: boolean
  last_position: number | null
}

/** Latest watch row per film (by updated_at) for the user. */
export async function fetchUserWatchFilmStateMap(
  supabase: SupabaseClient,
  userId: string
): Promise<Map<string, UserWatchFilmState>> {
  const { data, error } = await supabase
    .from('watchtime')
    .select('film_id, completed, last_position, updated_at')
    .eq('user_id', userId)

  if (error || !data?.length) {
    return new Map()
  }

  const sorted = [...data].sort(
    (a, b) =>
      new Date(String((b as { updated_at?: string }).updated_at ?? 0)).getTime() -
      new Date(String((a as { updated_at?: string }).updated_at ?? 0)).getTime()
  )

  const map = new Map<string, UserWatchFilmState>()
  for (const row of sorted) {
    const fid = (row as { film_id: string }).film_id
    if (map.has(fid)) continue
    map.set(fid, {
      completed: !!(row as { completed?: boolean }).completed,
      last_position: (row as { last_position: number | null }).last_position ?? null,
    })
  }
  return map
}

/** Badge: completed OR last_position / total >= 85%. Progress bar: full green when completed. */
export function applyWatchStateToFilm(
  film: FilmCardData,
  state: UserWatchFilmState | undefined
): FilmCardData {
  if (!state) {
    return film
  }

  const totalSec =
    typeof film.duration_minutes === 'number' && film.duration_minutes > 0
      ? film.duration_minutes * 60
      : 0
  const lp = state.last_position ?? 0
  const ratio = totalSec > 0 ? lp / totalSec : 0
  const alreadyWatched = state.completed || (totalSec > 0 && ratio >= 0.85)
  const watchCompleted = state.completed

  return {
    ...film,
    alreadyWatched,
    watchCompleted,
    progressPercent:
      watchCompleted && typeof film.progressPercent === 'number'
        ? 100
        : film.progressPercent,
  }
}

export function enrichFilmsWithWatchState(
  films: FilmCardData[],
  watchMap: Map<string, UserWatchFilmState>
): FilmCardData[] {
  return films.map((f) => applyWatchStateToFilm(f, watchMap.get(f.id)))
}
