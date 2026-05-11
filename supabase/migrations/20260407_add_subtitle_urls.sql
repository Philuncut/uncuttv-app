-- Add a JSONB column for self-hosted subtitle URLs.
--
-- Shape: { "de": "http://...srt", "en": "http://...srt" }
--
-- Background: MUX serves only the first text track per asset in HLS for
-- ~7 of our films (de or en silently dropped from the manifest even though
-- the API reports both as ready). We bypass MUX text tracks entirely and
-- host SRT files on 204.168.140.150/subs/. The webOS player reads URLs
-- from this column instead of relying on hls.subtitleTracks.

ALTER TABLE public.films
  ADD COLUMN IF NOT EXISTS subtitle_urls JSONB;

COMMENT ON COLUMN public.films.subtitle_urls IS
  'Self-hosted subtitle URLs by language code, e.g. {"de":"http://204.168.140.150/subs/foo_ger.srt","en":"http://...srt"}';
