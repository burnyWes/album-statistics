---
date: 2026-11-16T15:29:08.892579+00:00
git_commit: 5030a739f1095585f7046d29b228730757e3c7d2
branch: main
story: ALS-007
topic: "Optionale Spieldauer je Album und daraus berechnete Hördauer"
tags: [plan, albums, domain, ui, storage]
status: ready
---

# PLAN: ALS-007 — Spieldauer und Hördauer

Jedes Album bekommt ein optionales Feld „Spieldauer“. Daraus berechnet die App die
Hördauer: je Album als „Anzahl × Spieldauer“ für den laufenden Monat und insgesamt, auf
der Übersicht als Summe über alle Alben.

## Akzeptanzkriterien

- Das Formular (Hinzufügen und Bearbeiten) hat ein Textfeld „Spieldauer (optional)“
  mit der per `aria-describedby` verknüpften Beschreibung „Minuten oder
  Minuten:Sekunden, z. B. 42:33“. Die Feldreihenfolge ist:
  1. Albumname
  2. Bandname (optional)
  3. **Spieldauer (optional)**
  4. Spotify-Link (optional)
  5. Cover
- Gültige Eingaben (Leerzeichen am Rand werden ignoriert):
  - leer: keine Spieldauer
  - `M`, also eine oder mehrere Ziffern: M Minuten, zum Beispiel `42` oder `95`
  - `M:S` mit S ein- oder zweistellig von 0 bis 59: zum Beispiel `42:33`, `5:07`,
    `5:7`
  - Die Gesamtdauer muss größer als 0 sein. Es gibt keine Obergrenze.
- Ungültig sind unter anderem `0`, `0:00`, `42:75`, `42,5`, `1:20:33`, `-3`, `abc`
  und `42:`. Bei ungültiger Eingabe wird nicht gespeichert. Die Fehlerzeile zeigt und
  der Announcer sagt „Das ist keine gültige Spieldauer. Bitte Minuten oder
  Minuten:Sekunden eingeben, z. B. 42:33.“, und der Fokus springt ins Feld.
- Beim Bearbeiten steht die Spieldauer normalisiert im Feld: `42:33`, `5:07`, oder
  `42` bei 0 Sekunden. Wird das Feld geleert und gespeichert, ist die Spieldauer weg.
- Die Detailseite zeigt mit Spieldauer vor den Zählzeilen die Zeile
  „⏱ Spieldauer 0:42:33“. Ohne Spieldauer gibt es diese Zeile nicht.
- Mit Spieldauer zeigen Listenzeile und Detailseite die Hördauer als
  „Anzahl × Spieldauer“:
  - Listenzeile: `📅 3 × 2:07:39  ◎ 12 × 8:30:36`
  - Detailseite: `📅 Diesen Monat 3 × 2:07:39` und `◎ Insgesamt 12 × 8:30:36`
  - Ohne Spieldauer bleibt alles wie heute (`📅 3  ◎ 12`).
- Dauern werden immer als `S:MM:SS` angezeigt, Stunden ohne Obergrenze (`0:42:33`,
  `123:45:10`).
- Für den Screen-Reader werden Dauern ausgeschrieben, Teile mit 0 entfallen:
  - „2 Stunden, 7 Minuten, 39 Sekunden“
  - „42 Minuten, 33 Sekunden“
  - „1 Stunde, 1 Minute, 1 Sekunde“
  - eine Dauer von 0 als „0 Sekunden“
- Der Vorlesetext der Listenzeile (`albumRowLabel`) lautet mit Spieldauer:
  „Kind of Blue, Miles Davis. Diesen Monat 3 Mal, 2 Stunden, 7 Minuten, 39 Sekunden.
  Insgesamt 12 Mal, 8 Stunden, 30 Minuten, 36 Sekunden.“ Ohne Spieldauer bleibt er
  unverändert.
- Die Ansagen nach „gehört“, „Rückgängig“ und „Hören gelöscht“ (`bothCounts`) bleiben
  unverändert, also ohne Zeiten.
- Die Übersicht zeigt, sobald es mindestens ein Album gibt, unter der Kopfzeile
  „Alben, N [+]“ die Summenzeile `📅 3:20:15  ◎ 41:02:33`:
  - Summiert wird Anzahl × Spieldauer über alle Alben mit Spieldauer, einmal für den
    laufenden Monat und einmal insgesamt.
  - Die Zeile steht auch dann da, wenn keine Spieldauer bekannt ist (`0:00:00`).
  - Vorlesetext: „Hördauer diesen Monat 3 Stunden, 20 Minuten, 15 Sekunden, insgesamt
    41 Stunden, 2 Minuten, 33 Sekunden.“
- Darunter steht „N Alben ohne Spieldauer“ bzw. „1 Album ohne Spieldauer“, nur wenn
  N > 0. Gezählt werden alle Alben ohne Spieldauer, ob gehört oder nicht.
- Ohne Alben gibt es weder Summenzeile noch Hinweis. Es bleibt „Noch keine Alben.“
- Die Spieldauer überlebt ein Neuladen.
- Sicherungsdatei:
  - Neues optionales Feld `playingTime` in ganzen Sekunden. Die Formatversion bleibt 1.
  - Dateien ohne das Feld oder mit `null` sind weiter lesbar und bedeuten „keine
    Spieldauer“. Ein Wert, der keine positive ganze Zahl ist, macht die Datei
    unlesbar, wie heute ein ungültiger Spotify-Link.
  - Beim Laden in einen vorhandenen Bestand bekommt ein Album ohne Spieldauer die
    Spieldauer aus der Datei und zählt als „ergänzt“. Eine vorhandene Spieldauer
    bleibt.
- Die Sortierung „Monat“ / „Gesamt“ bleibt nach Anzahl der Hörvorgänge.

## Wesentliche Entscheidungen und Abwägungen

1. **Eingabe `M` oder `M:S`, gespeichert in ganzen Sekunden.**
   - Warum: Das ist schnell, wenn man nur die Minuten kennt, und genau beim Abschreiben
     von Spotify. Mit ganzen Sekunden rechnet man exakt und ohne Rundungsfehler.
   - Auswirkung: `playingTime: PlayingTime | null` (Sekunden) auf `NewAlbum`/`Album`.
     Im Formularzustand `AlbumDraft` steht sie als Text.
2. **Feld zwischen Bandname und Spotify-Link.**
   - Warum: Entscheidung des Nutzers. Die Textangaben zum Album stehen beisammen.
3. **Anzeige immer `S:MM:SS`, gesprochen ausgeschrieben.**
   - Warum: einheitlich und vergleichbar. `0:42:33` ist eindeutig, `42:33` nicht.
   - Auswirkung: Die Ziffern sind `aria-hidden`, der gesprochene Text steht in
     `visuallyHidden`. Das ist dasselbe Muster wie in `ListeningTime.tsx`.
4. **Ohne Spieldauer nur die Anzahl, und die Summe zählt solche Alben nicht mit.**
   - Warum: Es wird nichts Falsches angezeigt. Der Hinweis „N Alben ohne Spieldauer“
     macht eine unvollständige Summe sichtbar und erinnert ans Nachtragen.
5. **Prüfung in `newAlbum` mit dem neuen Grund `playingTimeInvalid`.**
   - Warum: Das ist das bestehende Fehlermuster mit Meldung und Fokus, wie bei
     `spotifyLinkInvalid`.
6. **Sicherung abwärtskompatibel ohne Versionssprung, Zusammenführen ergänzt.**
   - Warum: Dasselbe Vorgehen hat bei Spotify-Link und Cover funktioniert.
     Alte Sicherungen bleiben ladbar.
7. **Ansagen und Sortierung bleiben unverändert.**
   - Warum: Entscheidung des Nutzers. Die Ansagen bleiben kurz, und eine Sortierung
     nach Hördauer gehört nicht zu diesem Plan.
8. **Drei kleine Domänenmodule statt einem großen.**
   - `playingTime.ts`: Parsen, Prüfen und Formularwert der Spieldauer.
   - `duration.ts`: Darstellung einer Dauer in Sekunden, als Uhrzeit-Form und als
     gesprochene Form.
   - `listeningDuration.ts`: Hördauer je Album und über alle Alben.
   - Warum: Das entspricht dem bestehenden Schnitt `listening.ts` / `listeningTime.ts`.
     Alles ist rein und ohne Framework testbar (Skill `architecture`).

## Ausgangslage

```
AlbumsArea                                   src/albums/ui/AlbumsArea.tsx
 ├─ useAlbums  (addAlbum / changeAlbum: { ...album, ...newAlbum })   ui/useAlbums.ts:43-55
 ├─ AlbumListPage                            ui/AlbumListPage.tsx
 │    ├─ .pageHeader: h1 albumsHeading(n) [+]
 │    ├─ AlbumOrderButtons
 │    └─ AlbumListRow                        ui/AlbumListRow.tsx:53-59
 │         📅 listeningsThisMonth  ◎ listeningsInTotal   (aria-label = albumRowLabel)
 ├─ AlbumDetailPage                          ui/AlbumDetailPage.tsx:60-74
 │    📅 Diesen Monat n / ◎ Insgesamt n / Zuletzt gehört
 └─ AlbumFormPage                            ui/AlbumFormPage.tsx
      draftOf → AlbumDraft → newAlbum(draft, otherAlbums) → onSave(NewAlbum)
      Fehler: InvalidAlbum.reason → fieldsByReason → Fokus, albumFailureMessage

Domäne  src/albums/domain
  album.ts          NewAlbum { title, artist, spotifyLink, cover }, Album + { id, listenings }
  listening.ts      listeningsThisMonth(album, now), listeningsInTotal(album)
  albumMerge.ts     completedWith / hasChanged (ergänzt spotifyLink, cover, listenings)
  albumAnnouncements.ts  albumRowLabel, bothCounts, messagesByReason

Speicherung  src/albums/api/albumsFile.ts
  StoredAlbum (optionale Felder via isAbsentOr), albumFromStored, albumsFromFileText
```

Oberfläche heute:

```
 Alben, 12                                  [+]
 [A–Z] [Monat] [Gesamt]
 ─────────────────────────────────────────────
 [Cover] Kind of Blue, Miles Davis
         📅 3  ◎ 12                      [🔊]
```

```
 Kind of Blue, Miles Davis
 [Cover]
 📅 Diesen Monat 3
 ◎ Insgesamt 12
 Zuletzt gehört: Mo., 16.11.2026, 20:15
```

```
 Album bearbeiten
 Albumname               [Kind of Blue        ]
 Bandname (optional)     [Miles Davis         ]
 Spotify-Link (optional) [                    ]
 Cover                   [Cover wählen]
```

## Zielbild

Formular:

```
 Album bearbeiten
 Albumname               [Kind of Blue        ]
 Bandname (optional)     [Miles Davis         ]
 Spieldauer (optional)   [42:33  ]
   Minuten oder Minuten:Sekunden, z. B. 42:33
 Spotify-Link (optional) [                    ]
 Cover                   [Cover wählen]
```

Übersicht:

```
 Alben, 12                                  [+]
 📅 3:20:15  ◎ 41:02:33
 2 Alben ohne Spieldauer
 [A–Z] [Monat] [Gesamt]
 ─────────────────────────────────────────────
 [Cover] Kind of Blue, Miles Davis
         📅 3 × 2:07:39  ◎ 12 × 8:30:36  [🔊]
 ─────────────────────────────────────────────
 [Cover] Revolver, The Beatles
         📅 1  ◎ 4                       [🔊]     ← ohne Spieldauer
```

Detailseite mit Spieldauer:

```
 Kind of Blue, Miles Davis
 [Cover]
 ⏱ Spieldauer 0:42:33
 📅 Diesen Monat 3 × 2:07:39
 ◎ Insgesamt 12 × 8:30:36
 Zuletzt gehört: Mo., 16.11.2026, 20:15
```

Detailseite ohne Spieldauer: unverändert wie heute.

## Abstraktionen und Wiederverwendung

- `src/albums/domain`
  - `playingTime.ts` (neu)
    - `type PlayingTime = number` (ganze Sekunden, > 0)
    - `type ParsedPlayingTime = { valid: true; playingTime: PlayingTime | null } | { valid: false }`,
      nach dem Vorbild von `ParsedSpotifyLink`
    - `parsePlayingTime(raw: string): ParsedPlayingTime`
    - `isPlayingTime(value: unknown): value is PlayingTime`, also eine positive ganze
      Zahl (`Number.isSafeInteger(value) && value > 0`)
    - `playingTimeInput(playingTime: PlayingTime | null): string` liefert `''`, `'42'`
      oder `'42:33'` (Sekunden zweistellig)
  - `duration.ts` (neu)
    - `clockDuration(seconds: number): string` liefert `'2:07:39'`
    - `spokenDuration(seconds: number): string` liefert `'2 Stunden, 7 Minuten,
      39 Sekunden'`
  - `listeningDuration.ts` (neu)
    - `listeningDurationThisMonth(album: Album, now: Date): number | null`
    - `listeningDurationInTotal(album: Album): number | null` (`null` ohne Spieldauer)
    - `type ListeningDurations = { thisMonth: number; inTotal: number; albumsWithoutPlayingTime: number }`
    - `listeningDurationsOfAll(albums: readonly Album[], now: Date): ListeningDurations`
  - `album.ts`
    - `AlbumDraft` bekommt `playingTime: string`.
    - `NewAlbum` bekommt `playingTime: PlayingTime | null`.
    - `InvalidAlbumReason` bekommt `'playingTimeInvalid'`.
    - `newAlbum` prüft über `parsePlayingTime`.
  - `albumMerge.ts`: `completedWith` und `hasChanged` berücksichtigen `playingTime`.
  - `albumAnnouncements.ts`
    - `messagesByReason.playingTimeInvalid`
    - `albumRowLabel` mit Hördauer
    - `listeningDurationsLabel(durations)` für den Vorlesetext der Summenzeile
    - `albumsWithoutPlayingTimeHint(count)`
- `src/albums/api/albumsFile.ts`: `StoredAlbum` mit optionalem `playingTime`,
  Prüfung über `isAbsentOr(value.playingTime, isPlayingTime)`, `albumFromStored` und
  `albumsFromFileText` reichen das Feld durch.
- `src/albums/ui`
  - `StopwatchIcon.tsx` (neu): Rahmen wie `CalendarIcon.tsx`, Pfade nach Lucide
    „timer“ (ISC).
  - `Duration.tsx` (neu): `<Duration seconds={…} />` rendert
    `<span aria-hidden="true">{clockDuration}</span><span className="visuallyHidden">{spokenDuration}</span>`.
  - `ListeningCount.tsx` (neu): `<ListeningCount count={3} duration={7659 | null} />`
    rendert `3` oder `3 × <Duration/>`. Wird von Listenzeile und Detailseite genutzt.
  - `ListeningDurationsSummary.tsx` (neu): Summenzeile und Hinweis auf der Übersicht.
  - `AlbumFormPage.tsx`, `AlbumDetailPage.tsx`, `AlbumListRow.tsx`,
    `AlbumListPage.tsx`: Einbindung.
- `src/index.css`: `.listeningDurations` übernimmt den Stil von `.albumStats` (Flex,
  Icon 1.25rem), dazu ein Abstand nach unten vor der Sortiergruppe.
- Testfixtures: Jedes `Album`- oder `NewAlbum`-Literal bekommt `playingTime: null`.
  `tsc` zeigt alle Stellen an, derzeit in `App.test.tsx`, `albumsFile.test.ts`,
  `localStorageAlbumsClient.test.ts`, `album.test.ts`, `albumAnnouncements.test.ts`,
  `albumMerge.test.ts`, `albumOrder.test.ts`, `listening.test.ts`,
  `AlbumsArea.test.tsx` und `AlbumsBackupPage.test.tsx`.

## Logging und Beobachtbarkeit

Keine Änderungen.

## Umsetzung

### Phase 1: Spieldauer erfassen, speichern und anzeigen

Abhängigkeiten: keine

Die Spieldauer lässt sich eintragen, ändern und entfernen. Sie wird gespeichert,
gesichert und beim Laden ergänzt, und die Detailseite zeigt sie an.

**Aufgaben**:

- [x] `src/albums/domain/duration.test.ts` zuerst (fehlschlagend), dann `duration.ts`:
  - `clockDuration`:
    - `0` → `0:00:00`
    - `59` → `0:00:59`
    - `2553` → `0:42:33`
    - `7659` → `2:07:39`
    - `445510` → `123:45:10`
  - `spokenDuration`:
    - `7659` → `2 Stunden, 7 Minuten, 39 Sekunden`
    - `2553` → `42 Minuten, 33 Sekunden`
    - `3661` → `1 Stunde, 1 Minute, 1 Sekunde`
    - `3600` → `1 Stunde`
    - `0` → `0 Sekunden`
  ```ts
  function durationParts(seconds: number) {
    return {
      hours: Math.floor(seconds / 3600),
      minutes: Math.floor((seconds % 3600) / 60),
      seconds: seconds % 60,
    }
  }
  ```
- [x] `src/albums/domain/playingTime.test.ts` zuerst, dann `playingTime.ts`:
  - `parsePlayingTime`:
    - `''` und `'  '` → `{ valid: true, playingTime: null }`
    - `'42'` → 2520
    - `' 42:33 '` → 2553
    - `'5:7'` und `'5:07'` → 307
    - `'95'` → 5700
    - `'0:30'` → 30
    - ungültig: `'0'`, `'0:00'`, `'42:60'`, `'42:75'`, `'42,5'`, `'1:20:33'`,
      `'-3'`, `'abc'`, `'42:'`, `':33'`, `'42:333'`
  - Regulärer Ausdruck: `/^(\d+)(?::(\d{1,2}))?$/`. Dazu kommen die Prüfungen
    Sekunden ≤ 59 und Summe > 0.
  - `isPlayingTime`:
    - wahr für `2553`
    - falsch für `0`, `-1`, `2.5`, `'2553'`, `null`, `NaN`
  - `playingTimeInput`:
    - `null` → `''`
    - `2520` → `'42'`
    - `2553` → `'42:33'`
    - `307` → `'5:07'`
- [x] `src/albums/domain/album.test.ts` erweitern, dann `album.ts`:
  - `AlbumDraft.playingTime: string`
  - `NewAlbum.playingTime: PlayingTime | null`
  - `InvalidAlbumReason` um `'playingTimeInvalid'` ergänzen.
  - In `newAlbum` nach der Prüfung des Spotify-Links:
    `const playingTime = parsePlayingTime(draft.playingTime)`, bei `!valid` wird
    `InvalidAlbum('playingTimeInvalid')` geworfen. Das Ergebnis enthält
    `playingTime: playingTime.playingTime`.
  - Fälle:
    - `'42:33'` ergibt 2553.
    - Leer ergibt `null`.
    - `'42:75'` wirft `playingTimeInvalid`.
- [x] `albumAnnouncements.test.ts` und `albumAnnouncements.ts`: neuer Eintrag
  `playingTimeInvalid: 'Das ist keine gültige Spieldauer. Bitte Minuten oder Minuten:Sekunden eingeben, z. B. 42:33.'`.
- [x] `albumMerge.test.ts` zuerst, dann `albumMerge.ts`:
  - `completedWith` übernimmt `playingTime: album.playingTime ?? loaded.playingTime`.
  - `hasChanged` vergleicht zusätzlich `playingTime`.
  - Fälle:
    - Fehlende Spieldauer wird ergänzt und zählt als `extendedAlbums`.
    - Eine vorhandene Spieldauer bleibt, auch wenn die Datei eine andere enthält.
    - Ein neues Album übernimmt die Spieldauer aus der Datei.
- [x] `albumsFile.test.ts` zuerst, dann `albumsFile.ts`:
  - `StoredAlbum = Omit<Album, 'spotifyLink' | 'cover' | 'playingTime'> & { …; playingTime?: number | null }`
  - `isStoredAlbum` prüft `isAbsentOr(value.playingTime, isPlayingTime)`.
  - `albumFromStored` setzt `playingTime: stored.playingTime ?? null`.
  - `albumsFromFileText` reicht `playingTime` im Destructuring durch.
  - Fälle:
    - Hin- und Rückweg mit `playingTime: 2553`.
    - Eine Datei ohne Feld ergibt `null`.
    - `playingTime: 0`, `-5`, `2.5` und `'42'` machen die Datei unlesbar.
- [x] Alle Testfixtures um `playingTime: null` ergänzen (siehe Liste oben), bis
  `tsc -b` durchläuft.
- [x] `src/albums/ui/AlbumFormPage.tsx`:
  - `draftOf` setzt `playingTime: ''` bzw. `playingTimeInput(album.playingTime)`.
  - Neue Ref `playingTimeField`, `fieldsByReason.playingTimeInvalid: playingTimeField`.
  - Neues Feld zwischen „Bandname“ und „Spotify-Link“:
    ```tsx
    <p className="field">
      <label htmlFor="albumPlayingTime">Spieldauer (optional)</label>
      <input
        id="albumPlayingTime"
        ref={playingTimeField}
        autoComplete="off"
        value={draft.playingTime}
        aria-describedby="albumPlayingTimeHint albumFailure"
        onChange={(event) => change({ playingTime: event.target.value })}
      />
      <span id="albumPlayingTimeHint" className="fieldHint">
        Minuten oder Minuten:Sekunden, z. B. 42:33
      </span>
    </p>
    ```
    Ein `inputMode` wird bewusst nicht gesetzt. Die Zifferntastatur von Android
    (`numeric`/`decimal`) bietet keinen Doppelpunkt.
- [x] `src/index.css`: `.fieldHint` als kleinere Zeile unter dem Feld
  (`display: block; font-size: 0.875rem; margin-top: 0.25rem`). Der Kontrast muss den
  vorhandenen Test `test/colorContrast.test.ts` bestehen, deshalb dieselbe Textfarbe
  wie der Fließtext.
- [x] `src/albums/ui/StopwatchIcon.tsx` und `src/albums/ui/Duration.tsx` anlegen.
- [x] `AlbumDetailPage.tsx`: In `.albumDetailStats` vor „Diesen Monat“, nur bei
  `album.playingTime !== null`:
  ```tsx
  <p><StopwatchIcon />Spieldauer <Duration seconds={album.playingTime} /></p>
  ```
- [x] `AlbumsArea.test.tsx` erweitern (zuerst die Tests):
  - Das Formular hat das Feld „Spieldauer (optional)“ zwischen Bandname und
    Spotify-Link. Die Beschreibung ist per Accessible Description verknüpft
    (`toHaveAccessibleDescription(/Minuten oder Minuten:Sekunden/)`).
  - Ein Album mit Spieldauer `42:33` hinzufügen: Die Detailseite zeigt
    „Spieldauer 0:42:33“, der versteckte Text „42 Minuten, 33 Sekunden“ ist vorhanden.
  - `42:75` wird abgelehnt: Die Meldung erscheint und wird angesagt, der Fokus liegt im
    Feld „Spieldauer (optional)“, und es wurde nichts gespeichert.
  - Beim Bearbeiten eines Albums mit 2520 Sekunden steht `42` im Feld. Leeren und
    Speichern entfernt die Zeile „Spieldauer“ von der Detailseite.
  - Ein Album ohne Spieldauer hat auf der Detailseite keine Zeile „Spieldauer“.
  - Die Prüfung mit `accessibilityViolations` läuft ohne Befund im Formular und auf der
    Detailseite mit Spieldauer.
- [x] `AlbumsBackupPage.test.tsx`: Das Laden einer Datei mit `playingTime` ergänzt ein
  vorhandenes Album ohne Spieldauer, und die Meldung nennt es als „ergänzt“.
- [x] `e2e/albums.spec.ts`: neuer Test `keeps a playing time after a reload`. Er legt
  ein Album mit `42:33` an, lädt neu, öffnet das Album und erwartet den Text
  `Spieldauer 0:42:33`.

**Automatisierte Verifikation**:

- [x] `npm run test` läuft grün, darunter `duration.test.ts`, `playingTime.test.ts`,
  `album.test.ts`, `albumMerge.test.ts`, `albumsFile.test.ts` und
  `AlbumsArea.test.tsx`.
- [x] `npm run lint` läuft durch. Das schließt die Import-Grenze für `domain/` ein.
- [x] `npm run build` läuft durch (`tsc -b` einschließlich `e2e/`).
- [x] `npx playwright test e2e/albums.spec.ts` läuft grün.

**Manuelle Verifikation**:

- [ ] Auf dem Handy mit TalkBack: Das Feld wird als „Spieldauer (optional)“ mit dem
  Hinweis angesagt. Die Tastatur bietet einen Doppelpunkt.
- [ ] Eine ungültige Eingabe ergibt Meldung, Ansage und Fokus im Feld.

### Phase 2: Hördauer je Album

Abhängigkeiten: Phase 1

Listenzeile und Detailseite zeigen „Anzahl × Hördauer“, und der Vorlesetext der Zeile
nennt die Hördauer.

**Aufgaben**:

- [x] `src/albums/domain/listeningDuration.test.ts` zuerst, dann `listeningDuration.ts`
  (nur die Funktionen je Album):
  ```ts
  export function listeningDurationThisMonth(album: Album, now: Date): number | null {
    return album.playingTime === null
      ? null
      : listeningsThisMonth(album, now) * album.playingTime
  }
  export function listeningDurationInTotal(album: Album): number | null
  ```
  - Fälle:
    - 3 Hörvorgänge im November und 1 im Oktober bei 2553 Sekunden und
      `now` = November: Monat 7659, insgesamt 10212.
    - Ohne Spieldauer: beide `null`.
    - Ohne Hörvorgänge, aber mit Spieldauer: beide 0.
- [x] `albumAnnouncements.test.ts` zuerst, dann `albumRowLabel`:
  - Mit Spieldauer: `${albumName}. Diesen Monat ${n} Mal, ${spokenDuration(m)}. Insgesamt ${t} Mal, ${spokenDuration(g)}.`
  - Ohne Spieldauer: genau der heutige Text. Ein Test sichert das ab.
  - Mit Spieldauer und 0 Hörvorgängen: „Diesen Monat 0 Mal, 0 Sekunden.“
- [x] `src/albums/ui/ListeningCount.tsx` anlegen:
  ```tsx
  export function ListeningCount({ count, duration }: { count: number; duration: number | null }) {
    if (duration === null) return <>{count}</>
    return <>{count} × <Duration seconds={duration} /></>
  }
  ```
  Das Zeichen `×` ist U+00D7. Im Vorlesetext der Zeile spielt es keine Rolle, denn
  `albumRowLabel` ersetzt den Inhalt. Auf der Detailseite liest der Screen-Reader
  „mal“, das ist gewollt.
- [x] `AlbumListRow.tsx`: In `.albumStats` werden die nackten Zahlen ersetzt durch
  `<ListeningCount count={listeningsThisMonth(album, now)} duration={listeningDurationThisMonth(album, now)} />`
  und entsprechend für insgesamt.
- [x] `AlbumDetailPage.tsx`: „Diesen Monat …“ und „Insgesamt …“ mit `ListeningCount`.
- [x] `src/index.css`: `.albumStats` bekommt `flex-wrap: wrap`, damit
  `📅 3 × 2:07:39  ◎ 12 × 8:30:36` auf schmalen Handys umbrechen darf statt
  überzulaufen.
- [x] `AlbumsArea.test.tsx` erweitern (zuerst die Tests):
  - Die Zeile eines Albums mit Spieldauer zeigt `3 × 2:07:39` und `4 × 2:50:12`
    (Fixture mit 3 Hörvorgängen im November und 1 im Oktober, 2553 Sekunden). Ihr
    Name enthält „Diesen Monat 3 Mal, 2 Stunden, 7 Minuten, 39 Sekunden“.
  - Die Zeile eines Albums ohne Spieldauer zeigt wie bisher nur die Zahlen. Der
    bestehende Test `shows this month and total in the row` bleibt unverändert grün.
  - Die Detailseite zeigt „Diesen Monat 3 × 2:07:39“ und „Insgesamt 4 × 2:50:12“.
  - Nach „gehört“ aus der Liste ändert sich die Zeile auf `4 × 2:50:12` bzw.
    `5 × 3:32:45`, und die Ansage bleibt „… gehört. Diesen Monat 4, insgesamt 5.“
  - Die Prüfung mit `accessibilityViolations` läuft ohne Befund auf der Liste mit
    Spieldauer.

**Automatisierte Verifikation**:

- [x] `npm run test` läuft grün, darunter `listeningDuration.test.ts`,
  `albumAnnouncements.test.ts` und `AlbumsArea.test.tsx`.
- [x] `npm run lint` läuft durch.
- [x] `npm run build` läuft durch.

**Manuelle Verifikation**:

- [ ] Bei ca. 360 px Breite bricht eine Zeile mit großen Werten (z. B.
  `📅 12 × 14:11:00  ◎ 140 × 165:30:20`) sauber um. Das gilt auch mit invertierten
  Farben.
- [ ] Mit TalkBack wird die Zeile mit ausgeschriebener Hördauer vorgelesen.

### Phase 3: Hördauer-Summe auf der Übersicht

Abhängigkeiten: Phase 2

Unter der Überschrift stehen die Summen für den Monat und insgesamt, dazu der Hinweis
auf Alben ohne Spieldauer.

**Aufgaben**:

- [x] `listeningDuration.test.ts` zuerst, dann `listeningDurationsOfAll`:
  - Die Summe über alle Alben mit Spieldauer, Alben ohne Spieldauer werden gezählt.
  - Fälle:
    - Zwei Alben mit Spieldauer und eines ohne (gehört): Die Summen enthalten nur die
      ersten beiden, `albumsWithoutPlayingTime` ist 1.
    - Ein ungehörtes Album ohne Spieldauer zählt ebenfalls zu
      `albumsWithoutPlayingTime`.
    - Eine leere Liste ergibt `{ thisMonth: 0, inTotal: 0, albumsWithoutPlayingTime: 0 }`.
- [x] `albumAnnouncements.test.ts` zuerst, dann:
  - `listeningDurationsLabel(durations)` liefert
    `Hördauer diesen Monat ${spokenDuration(thisMonth)}, insgesamt ${spokenDuration(inTotal)}.`
  - `albumsWithoutPlayingTimeHint(count)` liefert `'1 Album ohne Spieldauer'` oder
    `'${count} Alben ohne Spieldauer'`. Für 0 wird diese Funktion nicht aufgerufen.
- [x] `src/albums/ui/ListeningDurationsSummary.tsx` anlegen:
  ```tsx
  <div className="listeningDurations">
    <p>
      <span aria-hidden="true" className="albumStats">
        <CalendarIcon />{clockDuration(d.thisMonth)}<RecordIcon />{clockDuration(d.inTotal)}
      </span>
      <span className="visuallyHidden">{listeningDurationsLabel(d)}</span>
    </p>
    {d.albumsWithoutPlayingTime > 0 && (
      <p>{albumsWithoutPlayingTimeHint(d.albumsWithoutPlayingTime)}</p>
    )}
  </div>
  ```
- [x] `AlbumListPage.tsx`: Im Zweig `albums.length > 0` steht
  `<ListeningDurationsSummary durations={listeningDurationsOfAll(albums, now)} />` vor
  `AlbumOrderButtons`.
- [x] `src/index.css`: Regel `.listeningDurations` (Abstand nach unten 1rem, die
  Absätze ohne Außenabstand).
- [x] `AlbumsArea.test.tsx` erweitern (zuerst die Tests):
  - Ohne Alben gibt es weder Summe noch Hinweis.
  - Bei zwei Alben mit Spieldauer und einem ohne zeigt die Übersicht die richtigen
    Summen als `S:MM:SS`, den Vorlesetext „Hördauer diesen Monat …, insgesamt …“ und
    „1 Album ohne Spieldauer“.
  - Haben alle Alben eine Spieldauer, gibt es keinen Hinweis.
  - Hat kein Album eine Spieldauer, zeigt die Übersicht `0:00:00` zweimal und
    „N Alben ohne Spieldauer“.
  - Nach „gehört“ steigen beide Summen um die Spieldauer.
  - Die Prüfung mit `accessibilityViolations` läuft ohne Befund auf der Liste mit
    Summe und Hinweis.
- [x] `e2e/albums.spec.ts`: Zwei Alben anlegen, eines mit `40` und eines ohne
  Spieldauer. Das erste zweimal hören und neu laden. Erwartet werden der Text
  `1:20:00` in der Summenzeile und „1 Album ohne Spieldauer“.

**Automatisierte Verifikation**:

- [x] `npm run test` läuft grün.
- [x] `npm run lint` läuft durch.
- [x] `npm run build` läuft durch.
- [x] `npx playwright test` läuft komplett grün.

**Manuelle Verifikation**:

- [ ] Auf dem Handy: Die Summenzeile steht unter „Alben, N“ und über den
  Sortier-Buttons. Sie wird mit TalkBack als „Hördauer diesen Monat …, insgesamt …“
  vorgelesen.
- [ ] Nach dem Nachtragen der letzten fehlenden Spieldauer verschwindet der Hinweis.

## Notizen zur Umsetzung

- Alle drei Phasen wurden in einem Zug umgesetzt und gepusht, damit der Nutzer die
  manuellen Prüfungen gemeinsam auf dem Handy machen kann.
- `ListeningCount` umschließt „Anzahl × Dauer“ mit `span.listeningCount`
  (`white-space: nowrap`). So bricht `.albumStats` nur zwischen den beiden Werten um,
  nie mitten in „3 × 2:07:39“. Ohne Spieldauer bleibt es bei der nackten Zahl, damit
  die bisherigen Tests und das Markup unverändert bleiben.
- Die beiden Summen in `ListeningDurationsSummary` tragen die Klasse `sum`, damit
  Komponenten- und e2e-Tests sie gezielt lesen können.

## Verweise

- Vorgängerpläne:
  - `docs/agents/plans/2026-11-12-spotify-link-und-album-cover.md` (Muster für ein
    optionales Feld samt Sicherung und Zusammenführen)
  - `docs/agents/plans/2026-11-12-alben-sortieren.md`
- Muster für gesprochene und sichtbare Zeit: `src/albums/ui/ListeningTime.tsx`
- Lucide-Icon „timer“: https://lucide.dev/icons/timer
