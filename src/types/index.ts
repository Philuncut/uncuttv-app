// Film
export interface Film {
  id: string
  title: string
  slug: string
  description: string
  director: string
  country: string
  year: number
  duration_minutes: number
  mux_asset_id: string
  mux_playback_id: string
  thumbnail_url: string
  genres: string[]
  language: string
  subtitle_languages: string[]
  is_published: boolean
  created_at: string
}

// User Profile
export interface Profile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  age_verified: boolean
  created_at: string
}

// Subscription
export interface Subscription {
  id: string
  user_id: string
  stripe_customer_id: string
  stripe_subscription_id: string
  status: 'active' | 'canceled' | 'past_due' | 'trialing'
  current_period_end: string
  created_at: string
}

// Watchtime
export interface Watchtime {
  id: string
  user_id: string
  film_id: string
  watched_seconds: number
  qualified: boolean
  session_date: string
}

// Payout calculation
export interface FilmPayout {
  film_id: string
  film_title: string
  director: string
  qualified_views: number
  watchtime_share: number   // Anteil in %
  payout_amount: number     // in EUR
}
