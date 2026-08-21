# Watchtime für die Ausschüttung

Stand 21.08.2026. Gilt zusätzlich zu `public.watchtime`, **nicht an dessen
Stelle**: jene Tabelle versorgt „Weiterschauen" und bleibt unverändert.

## Warum die bestehende Tabelle nicht abrechenbar ist

`public.watchtime` hält je `(user_id, film_id)` **eine** Zeile.
`seconds_watched` ist der Höchststand der erreichten Abspielposition
(`max(bisher, position)`). Daraus folgt dreierlei:

- **Keine Monatsgrenze.** Der Wert sagt nicht, *wann* gesehen wurde.
- **Mehrfachsichtungen zählen einmal.** Beim zweiten Ansehen läuft die
  Position wieder von 0 hoch, `max` steigt nie über den alten Wert — es
  entsteht keine neue Watchtime.
- **Vorspulen zählt voll.** Wer auf Minute 89 springt, hat 89 Minuten gebucht.

## Wie die drei Clients heute schreiben

| | Web | Android/Flutter | webOS |
|---|---|---|---|
| Schreibweg | `POST /api/watchtime` | **direkt in die Tabelle** | **direkt in die Tabelle** |
| Gesendeter Wert | Position (`currentTime`) | Position | Position |
| Intervall | ~12 s (`SYNC_INTERVAL_MS`), nur während `timeupdate` feuert | **keins** | 10 s, nur wenn `!paused && !seeking` |
| bei Pause | nichts | nichts | speichert |
| bei Sprung | nichts, erst der nächste Ping | nichts | speichert (`seeked`) |
| bei Ende | `onEnded` | einmal über `_onBack()` | speichert mit `completed` |
| beim Verlassen | **nichts** (kein `beforeunload`/`pagehide`) | der einzige Schreibvorgang | speichert |
| Sonstiges | einmalig bei 90 % | zusätzlich ein Schreibvorgang beim Laden mit der *Startposition* | nichts unter 5 s Position |

Drei Punkte daraus sind für die Abrechnung wesentlich:

1. **Zwei von drei Clients gehen an der API vorbei.** Android und webOS
   schreiben mit dem Anon-Key direkt in `public.watchtime`. Ein Ereignis, das
   nur in `/api/watchtime` entsteht, erfasst **ausschließlich Web-Zuschauer**.
2. **Android liefert genau einen Schreibvorgang je Sitzung**, beim Verlassen
   über `_onBack()`. Wird die App weggewischt oder das Gerät ausgeschaltet,
   wird gar nichts geschrieben.
3. **Android schreibt `seconds_watched` = Position ohne `max`.** Web und webOS
   bilden das Maximum, Android überschreibt. Zurückspulen und Verlassen senkt
   dort den gespeicherten Wert.

## Der Schreibweg ins Journal

`public.watchtime_events` ist ein Journal: nur anhängen. Geschrieben wird
ausschließlich serverseitig mit dem Service-Role-Client, RLS ist an und es
gibt **keine** Policy. Grund: wären Inserts vom Client erlaubt, könnte jeder
angemeldete Nutzer beliebige Sekunden auf einen Film buchen und damit
steuern, an wen ausgeschüttet wird.

Gebucht wird die **tatsächlich abgespielte Zeit seit dem letzten Ping**:

```
roh    = played_seconds  (falls der Client sie sendet)
       | position − position des letzten Ereignisses  (sonst)

decke  = min( seit dem letzten Ereignis verstrichene Uhrzeit , 60 s )

seconds = clamp(roh, 0, decke)
```

- **Negativ → 0.** Zurückspulen, Neustart, Sitzungsbeginn.
- **Deckel = verstrichene Uhrzeit.** Mehr als die Wanduhr kann niemand
  abgespielt haben. Das ersetzt die feste Regel „Intervall × 1,5" durch eine
  gemessene Größe — und kommt damit ohne Annahme darüber aus, mit welchem
  Intervall der jeweilige Client arbeitet (Web 12 s, webOS 10 s, Android gar
  keins). Vorspulen erzeugt so keine Watchtime, und ein Client kann sich auch
  mit `played_seconds` nichts erschwindeln.
- **Zusätzlicher Deckel 60 s je Buchung.** Greift im Normalbetrieb nie und
  begrenzt den Schaden, wenn Pings ausgefallen sind.

**Auch bei 0 Sekunden wird eine Zeile geschrieben.** Sie trägt die aktuelle
Position und ist der Anker für die Differenz des nächsten Pings. Ohne sie
würde nach einem Rücksprung gegen eine veraltete Position gerechnet.

### Der Anker liegt im Journal, nicht in `watchtime`

`watchtime.last_position` taugt als Bezugspunkt nicht: es ist ein Höchststand
und fällt beim Zurückspulen oder beim erneuten Ansehen nie zurück. Deshalb hat
`watchtime_events` eine Spalte `position_seconds` — eine bewusste Abweichung
von der ursprünglich vorgegebenen Spaltenliste, ohne die die serverseitige
Differenzbildung nicht möglich ist.

### Erneutes Ansehen

Das ist der Fall, den die heutige Logik verschluckt, und er löst sich durch den
Journalcharakter von selbst: gerechnet wird gegen die **Position des letzten
Ereignisses**, nicht gegen einen Höchststand.

Beispiel, 90-Minuten-Film, vor einer Woche zu Ende gesehen (letztes Ereignis:
Position 5400):

| Ping | Position | Differenz | gebucht |
|---|---|---|---|
| 1 | 12 | 12 − 5400 = −5388 | **0** — Sitzungsbeginn |
| 2 | 24 | 24 − 12 = 12 | **12** |
| 3 | 36 | 12 | **12** |
| … | | | |

Ab dem zweiten Ping zählt alles normal. **Verlust: höchstens ein Ping-Intervall
je Sitzung**, also 10–12 Sekunden. Bei einem 90-Minuten-Film sind das 0,2 %.

Setzt der Zuschauer dagegen fort (Position 5400 → 5412), ist die Differenz 12
und wird gebucht — kein Sonderfall nötig.

## Sollten die Clients ihre Abspieldauer selbst zählen?

**Ja, das wäre der genauere Weg.** Die Positionsdifferenz ist eine Näherung mit
drei bekannten Fehlern:

- Sie verliert den ersten Ping jeder Sitzung (siehe oben).
- Sie verliert alles nach dem letzten Ping vor dem Verlassen — im Web bis zu
  12 Sekunden, weil es dort kein `pagehide` gibt.
- Sie kann Abspielgeschwindigkeit ≠ 1 nicht abbilden.

Ein selbst mitgezählter Wert kennt diese Fehler nicht: der Client summiert die
Zeit zwischen `play` und `pause`/`ended` und schickt sie als `played_seconds`
mit. **Der Server nimmt sie bereits an** — der Deckel gegen die verstrichene
Uhrzeit bleibt trotzdem darauf, denn ein Client ist nicht vertrauenswürdig.

Aufwand je Client:

| Client | Aufwand | Was zu tun ist |
|---|---|---|
| **Web** | gering, ~30 Zeilen | Ein Akkumulator in `FilmPlayer.tsx`: `play`/`pause`/`ended` mitschreiben, Summe bei jedem Ping mitsenden und zurücksetzen. Dazu ein `pagehide`-Handler mit `navigator.sendBeacon`, damit der Rest beim Verlassen nicht verfällt. |
| **webOS** | gering, ~30 Zeilen | Dasselbe in `player.js`. Die Ereignisse (`play`, `pause`, `seeked`, `ended`) sind dort bereits alle verdrahtet, es fehlt nur die Summe. **Zusätzlich** muss der Aufruf von `supabase.from('watchtime')` auf `POST /api/watchtime` umgestellt werden. |
| **Android** | **erheblich** | Dort gibt es heute keine periodische Meldung, nur eine beim Verlassen. Es braucht einen Timer, die Bindung an den Player-Lifecycle (auch App im Hintergrund und Prozessende), und ebenfalls die Umstellung auf die API. |

**Der eigentliche Aufwand liegt nicht beim Zählen, sondern bei der Umstellung
auf die API.** Die brauchen Android und webOS ohnehin, sonst tragen sie
überhaupt nichts zur Ausschüttung bei. Dafür muss `/api/watchtime` zusätzlich
`Authorization: Bearer <token>` annehmen — genauso wie
[`api/mux/token`](../src/app/api/mux/token/route.ts) es für TV und Mobil
bereits tut. Das ist der Schritt, der zuerst gemacht gehört.

## Reihenfolge beim Einspielen

1. **Migration zuerst.** `supabase/migrations/20260821_create_watchtime_events.sql`
   im SQL-Editor ausführen.
2. Dann deployen.

Andersherum geht auch nichts kaputt: der Journaleintrag ist in `try/catch`
gefasst und wird nur protokolliert. Es entstehen dann bis zum Einspielen der
Migration schlicht keine Ereignisse.

## Zu erwartende Datenmenge

Ein Ping alle 10–12 Sekunden ergibt bei einem 90-Minuten-Film rund **450 Zeilen
je Sichtung**. 1000 Sichtungen im Monat sind rund 450 000 Zeilen. Das ist für
Postgres unproblematisch, wächst aber stetig. Wenn es stört: Ping-Intervall
erhöhen oder nach der Abrechnung monatlich in eine Summentabelle verdichten und
das Journal ab dann nur noch als Nachweis vorhalten.

## Auswertung

`supabase/queries/watchtime-monat.sql` — Summe und prozentualer Anteil je Film
für einen Monat, Monatsgrenzen in `Europe/Vienna`.
