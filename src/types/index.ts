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
  poster_url: string
  genres: string[]
  language: string
  subtitle_languages: string[]
  is_published: boolean
  created_at: string
}

/**
 * public.profiles -- Spalten exakt wie in der Datenbank.
 *
 * Es gibt KEINE email-Spalte: die Adresse liegt in auth.users und ist nur
 * ueber die Admin-API erreichbar (getUserEmail in lib/supabase/admin.ts).
 * Der frueher hier deklarierte email-Eintrag hat genau den Fehler
 * verursacht, den er haette verhindern sollen -- vier Webhook-Zweige haben
 * eine Spalte selektiert, die es nie gab.
 *
 * Beim Ergaenzen einer Spalte: die Rolle authenticated darf auf profiles nur
 * full_name, avatar_url, content_pin_hash und content_pin_set_at schreiben.
 * Alles andere wird serverseitig ueber die Service-Role gesetzt.
 */
export interface Profile {
  id: string
  full_name: string | null
  avatar_url: string | null
  age_verified: boolean
  age_verified_at: string | null
  subscription_status: string | null
  stripe_customer_id: string | null
  created_at: string
  updated_at: string | null
  welcome_email_sent: boolean
  content_pin_hash: string | null
  content_pin_set_at: string | null
  consent_email_sent: boolean
  age_verification_status: string | null
  age_verification_updated_at: string | null
}

/**
 * public.subscriptions -- gespiegelt aus den Stripe-Webhooks, abgeglichen
 * gegen das reale Schema.
 *
 * Auf stripe_subscription_id liegt ein eindeutiger Index
 * (subscriptions_stripe_subscription_id_key). Der Upsert im Stripe-Webhook
 * setzt darauf mit onConflict auf -- faellt der Index weg, scheitert er mit
 * "no unique or exclusion constraint matching the ON CONFLICT specification".
 */
export interface Subscription {
  id: string
  user_id: string
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  stripe_price_id: string | null
  status: 'active' | 'canceled' | 'past_due' | 'trialing' | 'incomplete' | 'unpaid'
  /** Gekuendigt zum Periodenende. Nicht aus status ableitbar -- das bleibt bis dahin active. */
  cancel_at_period_end: boolean
  trial_start: string | null
  trial_end: string | null
  current_period_start: string | null
  current_period_end: string | null
  canceled_at: string | null
  created_at: string
  updated_at: string | null
}

/**
 * public.consents -- append-only Nachweis erteilter Zustimmungen.
 * Writes ausschliesslich ueber die Service-Role.
 */
export interface Consent {
  id: string
  user_id: string
  kind: 'signup' | 'withdrawal_waiver'
  legal_version: string
  accepted_at: string
  ip: string | null
  user_agent: string | null
  checkout_session_id: string | null
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
