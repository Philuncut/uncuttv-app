# Einen Film auf die Plattform bringen

Ausgangslage: das Video liegt als Asset in MUX, sonst ist nichts vorbereitet.
Diese Anleitung führt von dort bis zum freigeschalteten Titel im Katalog.

Stand: geprüft gegen den Code und die Produktivdatenbank am 21.08.2026,
30 Filme in der Tabelle, davon 22 veröffentlicht.

---

## Vorweg: es gibt kein Adminwerkzeug

Es gibt **keine Adminmaske und kein Anlege-Skript**. Der Datensatz wird von
Hand angelegt — entweder im SQL-Editor von Supabase (empfohlen, weil
nachvollziehbar und kopierbar) oder über den Tabelleneditor.

Die Skripte unter `scripts/` sind Werkzeuge für Untertitel und einmalige
Umstellungen, keines legt einen Film an.

> Die Ordner `api/`, `upload/`, `components/` **im Projektwurzelverzeichnis**
> (nicht die unter `src/`) sehen nach einem Upload-Werkzeug aus, sind aber
> nicht verdrahtet: der App-Router liegt unter `src/app`, diese Dateien werden
> zu keiner Route. Nicht darauf verlassen.

---

## Schritt 1 — Die beiden MUX-Kennungen holen

Aus dem MUX-Dashboard beim Asset:

| Was | Wohin | Wichtig |
|---|---|---|
| Asset ID | `films.mux_asset_id` | wird nur für die Untertitel-Skripte gebraucht, nicht fürs Abspielen |
| Playback ID | `films.mux_playback_id` | **muss `signed` sein** |
| Playback ID des Trailers | `films.trailer_playback_id` | **muss `public` sein** |

Das ist der Fallstrick, der am meisten Zeit kostet: **Film und Trailer brauchen
gegenläufige Playback-Richtlinien.**

- Der Film wird über [api/mux/token](../src/app/api/mux/token/route.ts)
  mit einem JWT signiert ausgeliefert — dafür braucht es eine **signierte**
  Playback-ID. Woran man es merkt: der Player bleibt schwarz oder meldet einen
  Playback-Fehler, obwohl das Asset in MUX „ready" ist.
- Der Trailer wird in [TrailerHero.tsx](../src/app/[locale]/films/[slug]/TrailerHero.tsx)
  direkt als `https://stream.mux.com/<id>.m3u8` geladen, ohne Token — dafür
  braucht es eine **öffentliche** Playback-ID. Woran man es merkt: der Trailer
  bleibt schwarz, der Film läuft aber.

Hat ein Asset versehentlich eine öffentliche Playback-ID für den Film, legt man
in MUX eine neue signierte an und trägt diese ein. Als Vorlage für den Ablauf
dient [scripts/migrate-to-signed-playback.ts](../scripts/migrate-to-signed-playback.ts),
das genau diese Umstellung einmal für alle Filme gemacht hat.

Ebenfalls hier notieren: die **Laufzeit in vollen Minuten** (MUX zeigt sie beim
Asset an) für `duration_minutes`.

---

## Schritt 2 — Poster hochladen

**Wohin:** Supabase → Storage → Bucket **`posters`** (öffentlich).

**Format:** JPG. Alle 30 vorhandenen Poster sind JPG; PNG würde funktionieren,
ist bei Filmpostern aber unnötig groß.

**Seitenverhältnis: 2:3, verbindlich.** Die Karten im Katalog und im Karussell
setzen `aspectRatio: '2/3'` mit `object-fit: cover` — was nicht passt, wird
beschnitten, und zwar mittig. Woran man es merkt: Köpfe oder Schriftzüge sind
oben oder unten angeschnitten.

**Größe:** Der Bestand liegt bei **360 × 540 px, 80–140 kB**. Das ist für die
heutige Darstellung knapp ausreichend (Katalogkarte ~180 px breit, auf einem
Retina-Schirm also 360 px) und lässt keine Reserve. Für neue Titel besser
**1000 × 1500 px** und auf **unter 400 kB** gerechnet.

> **Nicht das Original hochladen.** `carne-cover.jpg` liegt mit
> **3829 × 5493 px und 6 MB** im Bucket — das ist 45-mal so schwer wie die
> übrigen und wird bei jedem Katalogaufruf voll geladen. Woran man es merkt:
> der Katalog baut sich auf dem Handy spürbar langsam auf.

**Dateiname:** kleingeschrieben, **`<slug>.jpg`**, keine Leerzeichen, keine
Umlaute. Der Bestand ist hier uneinheitlich gewachsen (`agp1.jpg`,
`carne-cover.jpg`, `night of doom.jpg`) — die mit Leerzeichen stehen als
`night%20of%20doom.jpg` in der Datenbank und sind beim Kopieren eine
Fehlerquelle. Für neue Titel gilt die Regel oben.

Die fertige Adresse hat immer diese Form:

```
https://xmqxnwhszgsijmhdtrhg.supabase.co/storage/v1/object/public/posters/<dateiname>.jpg
```

---

## Schritt 3 — Datensatz anlegen

Supabase → SQL Editor. Der Titel wird **unveröffentlicht** angelegt
(`is_published` bleibt auf dem Vorgabewert `false`), damit er erst nach der
Kontrolle sichtbar wird.

```sql
insert into public.films (
  title, original_title, slug,
  short_description, description,
  short_description_en, description_en,
  director, film_cast, country, year, duration_minutes,
  genres, language, original_language,
  poster_url,
  mux_asset_id, mux_playback_id, trailer_playback_id,
  subtitle_languages, subtitle_urls,
  blocked_in, allowed_in
) values (
  'Der Filmtitel',
  'Original Title',
  'der-filmtitel',

  'Ein Satz, der auf der Karte steht.',
  'Der lange Text für die Detailseite. Mehrere Sätze, ohne Zeilenumbrüche.',
  null,   -- short_description_en, sobald die Übersetzung da ist
  null,   -- description_en

  'Vorname Nachname',
  array['Darsteller A', 'Darsteller B'],
  array['Deutschland'],
  2026,
  93,

  array['Gore', 'Horror'],
  'Deutsch',
  'de',

  'https://xmqxnwhszgsijmhdtrhg.supabase.co/storage/v1/object/public/posters/der-filmtitel.jpg',

  'MUX_ASSET_ID',
  'MUX_SIGNIERTE_PLAYBACK_ID',
  null,   -- trailer_playback_id (öffentlich!), null wenn kein Trailer

  '[]'::jsonb,    -- subtitle_languages, siehe Schritt 4
  '{}'::jsonb,    -- subtitle_urls, siehe Schritt 4

  '{}',   -- blocked_in: leer = weltweit verfügbar
  '{}'    -- allowed_in: leer = keine Einschränkung
);
```

`blocked_in` und `allowed_in` **müssen mitgegeben werden.** Beide Spalten sind
`NOT NULL` und haben keinen Vorgabewert (PostgREST führt sie als Pflichtfelder,
anders als `is_published` oder `age_rating`, die Vorgabewerte haben). Woran man
es merkt: `null value in column "blocked_in" violates not-null constraint`.

---

## Feldreferenz

### Pflicht

| Spalte | Typ | Inhalt |
|---|---|---|
| `title` | text | Anzeigetitel |
| `slug` | text | URL-Bestandteil, siehe unten |
| `blocked_in` | text[] | ISO-3166-Ländercodes, `'{}'` = keine Sperre |
| `allowed_in` | text[] | ISO-3166-Ländercodes, `'{}'` = keine Beschränkung |

`id`, `created_at`, `updated_at`, `is_published` (`false`), `is_featured`
(`false`) und `age_rating` (`'18+'`) haben Vorgabewerte und können wegbleiben.

### Zum Slug

Kleinbuchstaben, Ziffern, Bindestriche. **Keine Umlaute, keine Punkte, keine
Leerzeichen.** Er ist der URL-Pfad (`/de/films/<slug>`) und wird für die
Detailseite exakt abgeglichen.

Im Bestand gibt es zwei Ausreißer, die man nicht nachahmen sollte:
`der-fluch-der-grete-müller` (Umlaut → prozentkodierte URL) und
`traces-of.snuff-1` (Punkt). Beide funktionieren, sind aber beim Verlinken und
Kopieren fehleranfällig.

Umlaute umschreiben: `ä → ae`, `ö → oe`, `ü → ue`, `ß → ss`.

### Praktisch immer zu füllen

| Spalte | Typ | Format | Anmerkung |
|---|---|---|---|
| `original_title` | text | | 30/30 gefüllt, oft gleich `title` |
| `short_description` | text | ein Satz | steht auf der Karte und beim Film des Monats |
| `description` | text | Fließtext | Detailseite; ohne harte Zeilenumbrüche |
| `director` | text | „Vorname Nachname" | |
| `film_cast` | text[] | `array['A','B']` | ein Name je Element |
| `country` | text[] | **deutsche Ländernamen**, nicht ISO | `array['Deutschland']` |
| `year` | integer | | |
| `duration_minutes` | integer | volle Minuten | |
| `genres` | text[] | siehe Liste unten | |
| `language` | text | Freitext | siehe Warnung unten |
| `original_language` | text | **ISO 639-1**, klein | `de`, `en`, `it`, `fr` |
| `poster_url` | text | volle öffentliche Adresse | |
| `mux_asset_id` | text | | |
| `mux_playback_id` | text | **signiert** | |

**Zu `country`:** Die Spalte hält deutsche Ländernamen (`Deutschland`, `USA`,
`Italien`), im Gegensatz zu `blocked_in`/`allowed_in`, die ISO-Codes halten.
Nicht verwechseln. Bei mehreren Ländern **je ein Element**:
`array['USA','Italien']` — im Bestand gibt es einen Satz, wo `'USA, Italien'`
in einem einzigen Element steht, das ist falsch und wird als ein Land angezeigt.

**Zu `language`:** Freitext und im Bestand uneinheitlich — `Deutsch`,
`Englisch`, `English`, `it`, `Italienisch`, und siebenmal `"Deutsch\r\nEnglish"`
mit einem echten Zeilenumbruch darin. Der Wert wird auf der Detailseite
**unverändert** als Zeile „Sprache" ausgegeben. Für neue Titel: ausgeschriebene
deutsche Sprachbezeichnung, mehrere durch Komma getrennt (`Deutsch, Englisch`).
Der Umbruch schlägt sonst in die Darstellung durch.

**Bereits verwendete Genres** (Häufigkeit im Bestand):

```
Gore (18) · Horror (13) · Kurzfilm (8) · Extreme-Horror (7) · Splatter (5)
Comedy (3) · Body-Horror (2) · Found Footage · Revenge-Thriller · Dokumentation
Underground · Anthology · Splatter-Trash · Slasher · Thriller
```

Die Genreseite gruppiert nach exakter Zeichenkette. Ein neuer Wert legt eine
neue Gruppe an — `Extreme Horror` und `Extreme-Horror` wären zwei Gruppen. Vor
dem Anlegen mit der Liste abgleichen.

### Optional / besonders

| Spalte | Anmerkung |
|---|---|
| `short_description_en`, `description_en` | 21/30 gefüllt. Fehlt der Wert, zeigt `/en` den deutschen Text. Kein Fehler, nur unübersetzt. |
| `trailer_playback_id` | **öffentliche** Playback-ID |
| `age_rating` | Vorgabe `'18+'`, wird **nirgends angezeigt**. Im Bestand steht Unsinniges darin (`Gore`, `Torture`, `Trash`) — offenbar als Etikett zweckentfremdet. Keine Zeit hineinstecken. |
| `filmmaker_id` | Fremdschlüssel auf `profiles.id`, 15/30 gefüllt, ohne sichtbare Wirkung |
| `backdrop_url` | **0/30 gefüllt** — wird selektiert, aber nirgends verwendet. Leer lassen. |
| `trailer_url` | Altlast, 1/30. Der Trailer läuft über `trailer_playback_id`. Leer lassen. |
| `subtitles` (text[]) | **Tote Spalte.** Wird im gesamten `src/`-Baum nicht gelesen. Nicht füllen, siehe Schritt 4. |
| `is_featured` | „Film des Monats". Siehe Warnung am Ende. |

---

## Schritt 4 — Untertitel

Das ist der verwickeltste Teil, weil **zwei Wege nebeneinander bestehen** und
beide gepflegt werden müssen.

### Der Web-Player: MUX-Text-Tracks + `subtitle_languages`

1. Die Text-Tracks am MUX-Asset anlegen (Dashboard oder API), mit korrektem
   Sprachcode.
2. Dieselben Codes als JSON-Array in `films.subtitle_languages` eintragen.

```sql
update public.films
set subtitle_languages = '["de","en"]'::jsonb,
    updated_at = now()
where slug = 'der-filmtitel';
```

So hängt es zusammen: Der Player baut das Untertitelmenü **aus
`subtitle_languages`** auf und schaltet dann den Text-Track um, dessen
`language` zum Code passt. Beides muss übereinstimmen.

- Steht ein Code in `subtitle_languages`, für den es **keinen** MUX-Track gibt:
  Der Menüpunkt erscheint, **tut aber nichts**. Kein Fehler, kein Hinweis.
- Gibt es einen MUX-Track, dessen Code **nicht** in `subtitle_languages` steht:
  Der Untertitel ist vorhanden, aber **nicht auswählbar**.

Beschriftet werden nur `de`, `en`, `es`, `fr`, `it` — andere Codes erscheinen
als Großbuchstaben (`PL`).

> **Der bekannte MUX-Fehler.** Bei etwa sieben Filmen liefert MUX im
> HLS-Manifest **nur den ersten Text-Track**, obwohl die API beide als „ready"
> meldet — die deutsche oder englische Spur fällt still weg. Woran man es
> merkt: der Menüpunkt ist da, die Auswahl bewirkt nichts, und in der
> Browserkonsole taucht die Spur gar nicht erst auf.
>
> Werkzeuge dafür:
> - [`scripts/audit-mux-subtitles.ts`](../scripts/audit-mux-subtitles.ts) —
>   nur lesend, listet die Tracks aller Assets in eine CSV
> - [`scripts/compare-api-vs-manifest.ts`](../scripts/compare-api-vs-manifest.ts) —
>   vergleicht, was die API meldet, mit dem, was wirklich im Manifest steht
> - [`scripts/dump-mux-tracks.ts`](../scripts/dump-mux-tracks.ts) — alle
>   Eigenschaften eines Tracks
> - [`scripts/recreate-de-track.ts`](../scripts/recreate-de-track.ts) — legt die
>   deutsche Spur neu an, was das Manifest manchmal auffrischt. Braucht die
>   SRT-Adresse als Parameter, weil MUX die ursprüngliche nicht herausgibt.

### Der TV-App-Player: `subtitle_urls`

Die webOS-App liest die Untertitel **nicht** über MUX, sondern als selbst
gehostete SRT-Dateien. Deshalb gibt es `films.subtitle_urls` — eine JSON-Zuordnung
Sprachcode → Adresse:

```sql
update public.films
set subtitle_urls = '{
      "de": "http://204.168.140.150/subs/der-filmtitel_de.srt",
      "en": "http://204.168.140.150/subs/der-filmtitel_en.srt"
    }'::jsonb,
    updated_at = now()
where slug = 'der-filmtitel';
```

Die SRT-Dateien müssen dafür auf `204.168.140.150/subs/` liegen und über HTTP
abrufbar sein.

Alternativ über die Skripte: [`add-film-subtitles.ts`](../scripts/add-film-subtitles.ts)
trägt geprüfte Adressen in `scripts/srt-urls.json` ein (es prüft per HEAD, ob
sie 200 liefern), [`populate-srt-urls.ts`](../scripts/populate-srt-urls.ts)
schreibt sie von dort in die Datenbank — mit `--dry-run` zum Vorschauen.

```bash
npx tsx scripts/add-film-subtitles.ts --film "Der Filmtitel" --de "http://204.168.140.150/subs/der-filmtitel_de.srt"
npx tsx scripts/populate-srt-urls.ts --dry-run
npx tsx scripts/populate-srt-urls.ts
```

### Die beiden Spalten laufen auseinander

Bei **7 von 30 Filmen** (23 %) stimmen sie nicht überein, und zwar durchweg in
dieselbe Richtung: `subtitle_urls` ist gefüllt, `subtitle_languages` ist leer.

```
re-flesh · slave-dolls-2 · la-petite-mort-2 · night-of-doom
satanic-suffering · backwood-the-camp-massacre · neghbor-number-9-2
```

Praktische Folge: Bei diesen sieben zeigt die **TV-App Untertitel, die Website
aber keine**. Der umgekehrte Fall kommt derzeit nicht vor. Wer Untertitel
anlegt, füllt **beide** Spalten mit denselben Sprachcodes.

Diese Abfrage zeigt, wo es auseinanderläuft:

```sql
select slug,
       coalesce(jsonb_array_length(subtitle_languages), 0) as web_menue,
       coalesce((select count(*) from jsonb_object_keys(subtitle_urls)), 0) as tv_dateien
from public.films
where coalesce(jsonb_array_length(subtitle_languages), 0)
   <> coalesce((select count(*) from jsonb_object_keys(subtitle_urls)), 0)
order by slug;
```

---

## Schritt 5 — Vor dem Freischalten prüfen

Der Datensatz ist noch unveröffentlicht und deshalb **nirgends sichtbar** — die
Detailseite leitet auf den Katalog um, solange `is_published = false`. Ein
Vorschauen im laufenden Betrieb ist damit nicht möglich; geprüft wird über die
Daten.

```sql
select slug, title,
       poster_url is not null                         as poster,
       mux_playback_id is not null                    as playback,
       coalesce(array_length(genres, 1), 0)           as genres,
       duration_minutes, year,
       description is not null                        as beschreibung,
       short_description is not null                  as kurztext,
       description_en is not null                     as beschreibung_en,
       coalesce(jsonb_array_length(subtitle_languages), 0) as web_untertitel,
       coalesce((select count(*) from jsonb_object_keys(subtitle_urls)), 0) as tv_untertitel,
       blocked_in, allowed_in
from public.films
where slug = 'der-filmtitel';
```

Von Hand nachsehen:

- **Poster** — die Adresse aus `poster_url` im Browser öffnen. Kommt 400 oder
  ein leeres Bild, stimmt der Dateiname nicht (häufigste Ursache: Leerzeichen
  oder Großbuchstaben).
- **Slug** — keine Umlaute, keine Punkte.
- **Genres** — jedes einzeln gegen die Liste oben.

---

## Schritt 6 — Freischalten

```sql
update public.films
set is_published = true,
    updated_at = now()
where slug = 'der-filmtitel';
```

Das genügt für **alles**: Katalog, Genres, Neuheiten, Detailseite und die
Playback-Freigabe hängen sämtlich an dieser einen Bedingung, gebündelt in
[`onlyPublished()`](../src/lib/films.ts). Ein Umlegen genügt auch, um einen
Titel wieder zurückzuziehen.

`updated_at` wird nicht automatisch nachgeführt — bei jeder Änderung
mitschreiben, sonst steht dort der Anlagezeitpunkt.

**Die Sitemap braucht keinen Schritt.** Sie führt ausschließlich statische
Seiten und keine Filme; es ist also nichts einzutragen und nichts zu entfernen.

---

## Schritt 7 — Nur wenn er ins Karussell der Startseite soll

Das Poster-Karussell im Hero der Startseite ist **nicht mit der Datenbank
verbunden.** Es ist eine feste Liste von Poster-Adressen im Code:

**[`src/components/home/Hero.tsx`](../src/components/home/Hero.tsx), Konstante
`carouselPosters`, ganz oben in der Datei.**

```ts
const carouselPosters = [
  'https://xmqxnwhszgsijmhdtrhg.supabase.co/storage/v1/object/public/posters/agp1.jpg',
  …
  // neue Zeile hier
]
```

> **`is_published` greift hier nicht.** Was in dieser Liste steht, erscheint auf
> der Startseite — auch wenn der Film unveröffentlicht ist, auch wenn er nie
> veröffentlicht war. Das ist genau der Fall, der bei „A Fist of Jesus"
> aufgetreten ist: der Titel lief im Karussell, obwohl er noch nicht auf die
> Plattform sollte.
>
> **Diese Liste muss von Hand gepflegt werden — in beide Richtungen.** Wird ein
> Titel zurückgezogen, gehört er auch hier heraus, sonst bleibt sein Poster auf
> der Startseite. Statt zu löschen besser auskommentieren, dann ist die
> Rückkehr eine Zeile.

Die Länge der Liste spielt keine Rolle: das Band wiederholt sie paarweise und
bleibt bei jeder Anzahl nahtlos.

Das erfordert eine Codeänderung, also Commit und Deploy — anders als alle
übrigen Schritte, die sofort wirken.

---

## Was leicht schiefgeht — Kurzliste

| Symptom | Ursache |
|---|---|
| Player schwarz, Asset in MUX „ready" | Playback-ID ist öffentlich statt signiert |
| Trailer schwarz, Film läuft | Trailer-Playback-ID ist signiert statt öffentlich |
| Untertitelmenü da, Auswahl bewirkt nichts | Code in `subtitle_languages` ohne passenden MUX-Track — oder der MUX-Manifest-Fehler |
| Untertitel in der TV-App, nicht auf der Website | nur `subtitle_urls` gefüllt, `subtitle_languages` leer |
| Untertitel auf der Website, nicht in der TV-App | umgekehrt |
| Film taucht nach dem Freischalten nicht auf | Cache der Seite; sonst `is_published` prüfen |
| Poster oben/unten angeschnitten | nicht 2:3 |
| Katalog lädt langsam | Poster im Originalformat hochgeladen (siehe `carne-cover.jpg`, 6 MB) |
| Poster lädt nicht | Leerzeichen oder Großbuchstaben im Dateinamen |
| Genre erscheint als eigene Gruppe | Schreibweise weicht ab (`Extreme Horror` ≠ `Extreme-Horror`) |
| Insert scheitert mit not-null | `blocked_in` oder `allowed_in` weggelassen |
| Ein Film verschwindet vom „Film des Monats" | `is_featured` ist bei mehreren gesetzt; die Abfrage nimmt mit `limit(1)` nur einen. Vor dem Setzen den alten zurücksetzen — derzeit steht es bei `the-woods-turned-red`. |
| Titel im Karussell, obwohl zurückgezogen | Hero-Liste nicht gepflegt (Schritt 7) |

---

## Kurzfassung zum Abarbeiten

1. MUX: Asset-ID, **signierte** Playback-ID, ggf. **öffentliche**
   Trailer-Playback-ID, Laufzeit in Minuten
2. MUX: Text-Tracks für die Untertitel anlegen
3. Poster 2:3, 1000 × 1500, `<slug>.jpg`, in den Bucket `posters`
4. SRT-Dateien nach `204.168.140.150/subs/`
5. `insert` aus Schritt 3 ausführen
6. `subtitle_languages` **und** `subtitle_urls` setzen
7. Prüfabfrage aus Schritt 5, Poster-Adresse im Browser öffnen
8. `is_published = true`
9. Nur bei Bedarf: Zeile in `carouselPosters` in `Hero.tsx`, committen, deployen
