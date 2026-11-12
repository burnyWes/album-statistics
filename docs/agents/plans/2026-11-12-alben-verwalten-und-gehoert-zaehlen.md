---
date: 2026-11-12T10:47:53+00:00
git_commit: 3770a820d6914848f5831ea438a1a0d62ad21829
branch: main
story: ALS-002
topic: "Alben anlegen, bearbeiten, löschen und „gehört“ zählen"
tags: [plan, albums, domain, storage, ui]
status: ready
---

# PLAN: ALS-002 — Alben verwalten und „gehört“ zählen

Album-Statistics wird benutzbar: Alben anlegen, alphabetisch auflisten, bearbeiten und
löschen, jedes Hören per Tipp erfassen, Zähler für den laufenden Monat und insgesamt
anzeigen und einen Fehltipp zurücknehmen. Alles bleibt auf dem Gerät gespeichert.
Grundlage sind die Wünsche zur Alben-Seite und zur Seite „Album hinzufügen/bearbeiten“
in `docs/notes.txt` (Abschnitt TODO).

Folgestories (eigene Pläne): ALS-003 Album-Detailseite (schiebt sich zwischen Liste und
„Album bearbeiten“), ALS-004 Daten speichern und laden, später Songs samt Tracks.

## Akzeptanzkriterien

Mit `<Album>` ist im Folgenden „Albumname, Bandname“ gemeint, ohne Band nur
„Albumname“.

- `[+]` „Album hinzufügen“ ist bedienbar und öffnet die Seite „Album hinzufügen“ mit
  den Feldern „Albumname“ (Fokus) und „Bandname (optional)“; „Speichern“ steht in einer
  festen Leiste unten. Ist die Bildschirmtastatur offen, rutscht die Leiste in den
  Seitenfluss.
- Ohne Albumnamen steht „Bitte einen Albumnamen eingeben.“ unter den Feldern, wird
  angesagt, und der Fokus geht ins Feld Albumname.
- Gleicher Album- und Bandname (Groß- und Kleinschreibung sowie Randleerzeichen egal)
  wird mit „Dieses Album gibt es schon.“ abgelehnt; das bearbeitete Album selbst zählt
  nicht als Doppel.
- Nach dem Speichern geht es zurück zur Liste, angesagt wird „<Album> gespeichert.“,
  der Fokus liegt auf der Überschrift der Liste.
- „Zurück zu den Alben“ verwirft Eingaben ohne Rückfrage; Enter in einem Feld speichert.
- Die Überschrift lautet „Alben“ ohne Alben, sonst „Alben, <n>“.
- Die Liste ist sortiert nach `Intl.Collator('de', { sensitivity: 'base', numeric: true })`
  über den Albumnamen, bei gleichem Albumnamen nach Bandname, ein Album ohne Band
  zuerst. Artikel zählen mit.
- Eine Zeile zeigt oben `<Album>` und darunter `[Kalender] <diesen Monat>
  [Platte] <insgesamt>`. Beides zusammen ist ein Knopf, angesagt als
  „<Album>. Diesen Monat 3 Mal, insgesamt 14 Mal gehört.“ Er öffnet „Album bearbeiten“.
- „Album bearbeiten“ ist vorbefüllt und hat unten `[Speichern] [Löschen]`.
- „Löschen“ führt zur Seite „<Album> löschen?“ mit dem Hinweis auf die Zahl der
  verlorenen Hörzeitpunkte und unten `[Löschen] [Abbrechen]`. Nach dem Bestätigen geht
  es zur Liste mit der Ansage „<Album> gelöscht. Noch <n> Alben.“ (bzw. „Noch 1 Album.“,
  „Keine Alben mehr.“). „Abbrechen“ und „Zurück zum Album“ führen zu „Album bearbeiten“.
- Neben jeder Zeile steht `[↑]` „<Album> gehört“. Ein Tipp speichert den aktuellen
  Zeitpunkt, sagt „<Album> gehört. Diesen Monat 3, insgesamt 14.“ an, der Fokus bleibt
  auf dem Knopf.
- Danach steht unten „Rückgängig: <Album>“. Der Knopf nimmt genau dieses Hören zurück,
  sagt „<Album>: Hören zurückgenommen. Diesen Monat 2, insgesamt 13.“ an und
  verschwindet. Er verschwindet auch beim Wechsel der Seite oder des Bereichs. Ein
  weiteres Hören ersetzt ihn durch einen Rückgängig-Knopf für das neue Hören.
- „Diesen Monat“ ist der Kalendermonat in der Ortszeit des Geräts.
- Alben und Hörzeitpunkte überstehen einen Neustart (`localStorage`, Schlüssel
  `albums`, JSON mit `"version": 1`). Beim Start wird einmal
  `navigator.storage.persist()` angefragt.
- Unlesbare gespeicherte Daten führen zu einer leeren Liste; der Rohtext wird vorher
  unter `albums.unreadable` gesichert, sofern dort noch nichts liegt.

## Wesentliche Entscheidungen und Abwägungen

1. **Umfang ohne Detailseite:** Verwalten und Zählen jetzt, Detailseite mit ALS-003.
   - Warum: Danach ist die App auf dem Handy wirklich nutzbar.
   - Auswirkung: Ein Tipp auf das Album öffnet vorerst „Album bearbeiten“.
2. **Bandname optional, Tracks später:** Nur der Albumname ist Pflicht; das Formular
   hat keine Tracks.
   - Warum: Sampler und Soundtracks; Tracks gehören zur Songs-Story.
   - Auswirkung: `InvalidAlbumReason` verliert `artistMissing`; `artist` ist `''`, wenn
     keine Band angegeben ist.
3. **Hören als Zeitpunkte:** `listenings: readonly Listening[]` (ISO-Zeitstempel) am
   Album; die Zähler sind reine Funktionen mit `now` als Parameter.
   - Warum: Spätere Statistiken ohne Umbau, Monatswechsel ohne Sonderlogik.
   - Auswirkung: `App` bekommt die Prop `clock: () => Date`; `main.tsx` übergibt
     `() => new Date()`, Tests eine feste Zeit.
4. **Speicherung im `localStorage`:** Port `AlbumsClient` in `src/albums/api/` mit
   Adapter `localStorageAlbumsClient` und Fake `inMemoryAlbumsClient`, nach dem Muster
   von `src/shared/appearance/`. IDs vergibt der Client (`crypto.randomUUID()` bzw.
   Zähler im Fake).
   - Warum: Kleine Datenmenge, synchron, einfach zu testen; das Format dient ALS-004
     direkt als Dateiinhalt.
   - Auswirkung: `DeviceStorage` wandert von `shared/appearance/appearanceClient.ts`
     nach `shared/storage/deviceStorage.ts` und wird von beiden Adaptern genutzt.
5. **Doppel abgelehnt:** `newAlbum(draft, otherAlbums)` wirft
   `InvalidAlbum('alreadyListed')`; der Aufrufer übergibt beim Bearbeiten alle Alben
   außer dem bearbeiteten.
   - Warum: Die Regel gehört in die Domäne, nicht in die Oberfläche.
6. **Löschen mit Bestätigungsseite** nach dem Vorbild `DeleteMealPage.tsx`.
   - Warum: Mit dem Album gehen alle Hörzeitpunkte verloren.
7. **Feste Leiste unten:** `BottomBar`, `useOnScreenKeyboard`, `SaveIcon`, `TrashIcon`
   und die CSS-Regeln `.bottomBar…` aus dem Mahlzeitenplaner. Formular, Löschseite und
   Rückgängig-Leiste nutzen sie.
8. **Rückgängig statt Rückfrage:** Der Zustand `{ albumId, listening }` lebt in
   `AlbumsArea` und wird bei jedem Seitenwechsel verworfen. Weil `AlbumsArea` beim
   Bereichswechsel aushängt, verschwindet er dort von selbst; auch vor dem Löschen eines
   Albums ist er durch den Wechsel zu „Album bearbeiten“ schon weg.
9. **Icons:** `CalendarIcon` (aus dem Mahlzeitenplaner, für „diesen Monat“),
   `RecordIcon` (vorhanden, für „insgesamt“), neues `ArrowUpIcon` (gehört). Alle als
   Strich-SVG mit `aria-hidden`.
10. **Seitenwechsel im Bereich:** `AlbumsArea.tsx` mit den Seiten `list`, `form`,
    `delete` wie `MealsArea.tsx`; `AlbumsPage.tsx` wird zu `AlbumListPage.tsx`.
11. **Ansagetexte als reine Funktionen** in `src/albums/domain/albumAnnouncements.ts`,
    wie `meals/domain/announcements.ts` im Mahlzeitenplaner.

## Ausgangslage

```
src/
  main.tsx                    verdrahtet appearance-, install-, appUpdate-Client
  App.tsx                     AREAS albums/settings; rendert <AlbumsPage navigation>
  App.test.tsx                u. a. "offers adding an album only as unavailable"
  index.css                   .pageHeader, .addItemButton, .itemList, .listRow,
                              .rowButton, .iconButton, .buttonIcon, --failure
  albums/
    domain/album.ts           Album {id,title,artist}; newAlbum(title, artist)
                              wirft titleMissing und artistMissing
    domain/album.test.ts
    ui/AlbumsPage.tsx         Überschrift "Alben", [+] aria-disabled, "Noch keine Alben."
    ui/RecordIcon.tsx
  shared/
    appearance/appearanceClient.ts   DeviceStorage + AppearanceClient
    appearance/localStorageAppearanceClient.ts (+ Test)   Muster für den Adapter
    ui/useHeadingFocus.ts, Announcer, useAnnouncer, NavigationBar, SettingsPage
e2e/app.spec.ts, e2e/appearance.spec.ts
eslint.config.js              Grenzen domain / api / ui je Kontext (albums/api erlaubt)
```

Vorlagen im Mahlzeitenplaner (`C:/MW/Projekte/privat/Mahlzeitenplaner/src/`):
`meals/ui/MealsArea.tsx`, `MealFormPage.tsx`, `DeleteMealPage.tsx`, `MealListRow.tsx`,
`MealListPage.tsx`, `useMeals.ts`, `meals/api/mealsClient.ts`, `inMemoryMealsClient.ts`,
`meals/domain/announcements.ts`, `shared/ui/BottomBar.tsx` (+ Test),
`useOnScreenKeyboard.ts`, `SaveIcon.tsx`, `TrashIcon.tsx`, `CalendarIcon.tsx`,
`index.css:411-480` (`.pageActions`, `.bottomBar…`).

## Zielbild

```
main.tsx
  └─ <App appearanceClient installOfferClient appUpdateClient
          albumsClient clock />
       └─ AlbumsArea (Bereich "albums")                    albums/ui
            ├─ useAlbums(albumsClient, clock)              Zustand + Schreiben
            ├─ page list   → AlbumListPage
            │                  AlbumListRow …  [↑]
            │                  BottomBar "Rückgängig: <Album>" (nur nach Hören)
            ├─ page form   → AlbumFormPage  (neu oder bearbeiten)
            └─ page delete → DeleteAlbumPage

albums/domain   album.ts, listening.ts, albumAnnouncements.ts   (reine Funktionen)
albums/api      albumsClient.ts (Port), localStorageAlbumsClient.ts, inMemoryAlbumsClient.ts
shared/storage  deviceStorage.ts, persistentStorage.ts
```

### Liste mit Alben, nach einem Hören

```
+--------------------------------------+
|   [ Platte ]       [ Zahnrad ]       |
+--------------------------------------+
| Alben, 3                         [+] |
|--------------------------------------|
| Greatest Hits                  [ ↑ ] |
| [Kalender] 0   [Platte] 2            |
|--------------------------------------|
| Kind of Blue, Miles Davis      [ ↑ ] |
| [Kalender] 3   [Platte] 14           |
|--------------------------------------|
| The Wall, Pink Floyd           [ ↑ ] |
| [Kalender] 1   [Platte] 1            |
+--------------------------------------+
|  [ Rückgängig: Kind of Blue, Miles   |   <- feste Leiste, nur nach einem Hören
|    Davis ]                           |
+--------------------------------------+
```

### Leere Liste

```
+--------------------------------------+
|   [ Platte ]       [ Zahnrad ]       |
+--------------------------------------+
| Alben                            [+] |   <- [+] jetzt bedienbar (nicht mehr grau)
|                                      |
| Noch keine Alben.                    |
+--------------------------------------+
```

Vorher war `[+]` grau mit `aria-disabled="true"`.

### Album hinzufügen

```
+--------------------------------------+
| [Zurück zu den Alben]                |
| Album hinzufügen                     |
|                                      |
| Albumname                            |
| [                              ]     |   <- Fokus
| Bandname (optional)                  |
| [                              ]     |
|                                      |
| Bitte einen Albumnamen eingeben.     |   <- nur im Fehlerfall, in --failure
+--------------------------------------+
| [        Diskette Speichern        ] |   <- feste Leiste
+--------------------------------------+
```

### Album bearbeiten

```
+--------------------------------------+
| [Zurück zu den Alben]                |
| Album bearbeiten                     |
| Albumname                            |
| [Kind of Blue                  ]     |
| Bandname (optional)                  |
| [Miles Davis                   ]     |
+--------------------------------------+
| [Diskette Speichern] [Eimer Löschen] |
+--------------------------------------+
```

### Löschen bestätigen

```
+--------------------------------------+
| [Zurück zum Album]                   |
| Kind of Blue, Miles Davis löschen?   |
| Damit gehen auch 14 Mal Hören        |
| verloren.                            |
+--------------------------------------+
| [   Löschen   ] [   Abbrechen   ]    |
+--------------------------------------+
```

Hinweistext je nach Zahl: 0 → „Es ist noch kein Hören erfasst.“, 1 → „Damit geht auch
1 Mal Hören verloren.“, n → „Damit gehen auch n Mal Hören verloren.“

### Gespeichertes Format

```json
{
  "version": 1,
  "albums": [
    {
      "id": "6f1c…",
      "title": "Kind of Blue",
      "artist": "Miles Davis",
      "listenings": ["2026-11-12T18:04:00.000Z"]
    }
  ]
}
```

## Abstraktionen und Wiederverwendung

- `src/albums/domain/`
  - `album.ts` (+ Test) – Fachmodell
    - `Album` – `{ id, title, artist, listenings }`
    - `NewAlbum` – `{ title, artist }`
    - `AlbumDraft` – rohe Formulareingabe `{ title, artist }`
    - `InvalidAlbumReason` – `'titleMissing' | 'alreadyListed'`
    - `newAlbum(draft, otherAlbums)` – trimmt, prüft Titel und Doppel
    - `byTitle(albums)` – sortiert laut Akzeptanzkriterium
    - `albumName(album)` – „Titel, Band“ bzw. „Titel“
  - `listening.ts` (+ Test) – Hören
    - `Listening` – ISO-Zeitstempel als `string`, als Typ in `album.ts` definiert
    - `listeningAt(moment: Date): Listening`
    - `withListening(album, listening)`, `withoutListening(album, listening)` – entfernt
      genau einen Eintrag mit diesem Zeitstempel
    - `listeningsThisMonth(album, now)`, `listeningsInTotal(album)`
  - `albumAnnouncements.ts` (+ Test) – alle Texte: `albumsHeading`,
    `albumRowLabel`, `albumFailureMessage`, `albumSavedAnnouncement`,
    `albumDeletedAnnouncement`, `deletionConsequence`, `listenedAnnouncement`,
    `listeningTakenBackAnnouncement`, `listenedButtonLabel`, `undoListeningLabel`
- `src/albums/api/`
  - `albumsClient.ts` – Port
    ```ts
    export interface AlbumsClient {
      readAlbums(): readonly Album[]
      writeAlbums(albums: readonly Album[]): void
      createAlbumId(): AlbumId
    }
    ```
  - `localStorageAlbumsClient.ts` (+ Test) – Adapter, `ALBUMS_KEY = 'albums'`,
    `UNREADABLE_ALBUMS_KEY = 'albums.unreadable'`, `STORAGE_VERSION = 1`
  - `inMemoryAlbumsClient.ts` – Fake mit `storedAlbums()`
- `src/albums/ui/`
  - `useAlbums.ts` – Hook: `albums` (sortiert), `addAlbum`, `changeAlbum`,
    `removeAlbum`, `listenTo(id): Listening`, `takeBackListening(id, listening)`
  - `AlbumsArea.tsx` (+ Test) – Seitenwechsel, Ansagen, Rückgängig-Zustand
  - `AlbumListPage.tsx` – ersetzt `AlbumsPage.tsx`
  - `AlbumListRow.tsx` – zweizeiliger Knopf und `[↑]`
  - `AlbumFormPage.tsx` – Formular für Neu und Bearbeiten
  - `DeleteAlbumPage.tsx` – Bestätigung
  - `CalendarIcon.tsx` (übernommen), `ArrowUpIcon.tsx` (neu), `RecordIcon.tsx`
    (unverändert; die kleinere Größe in der Zeile kommt aus `.albumStats .buttonIcon`)
- `src/shared/storage/`
  - `deviceStorage.ts` – `DeviceStorage` (aus `appearanceClient.ts` verschoben)
  - `persistentStorage.ts` – `requestPersistentStorage(storage = navigator.storage)`
- `src/shared/ui/` – `BottomBar.tsx` (+ Test), `useOnScreenKeyboard.ts`, `SaveIcon.tsx`,
  `TrashIcon.tsx` übernommen
- `src/App.tsx`, `src/main.tsx`, `src/App.test.tsx`, `src/index.css`
- `e2e/albums.spec.ts` – neu

## Logging und Beobachtbarkeit

Keine Logs. Rückmeldungen laufen über den Ansagebereich (`role="status"`):

```
Kind of Blue, Miles Davis gespeichert.
Bitte einen Albumnamen eingeben.
Dieses Album gibt es schon.
Kind of Blue, Miles Davis gehört. Diesen Monat 3, insgesamt 14.
Kind of Blue, Miles Davis: Hören zurückgenommen. Diesen Monat 2, insgesamt 13.
Kind of Blue, Miles Davis gelöscht. Noch 11 Alben.
Greatest Hits gelöscht. Keine Alben mehr.
```

## Umsetzung

### Phase 1: Alben anlegen und dauerhaft anzeigen

Abhängigkeiten: keine

`[+]` legt Alben an, die Liste zeigt sie sortiert, und sie überstehen einen Neustart.

**Aufgaben**:
- [x] `src/albums/domain/album.test.ts` zuerst anpassen, dann `album.ts`:
  - `keeps title and artist without surrounding blanks`
  - `accepts an album without artist` – `artist` ist `''`
  - `rejects an album without title` – `InvalidAlbum('titleMissing')`
  - `rejects an album already listed regardless of case and blanks` –
    `{ title: ' kind of blue', artist: 'MILES DAVIS ' }` gegen vorhandenes
    „Kind of Blue / Miles Davis“ → `InvalidAlbum('alreadyListed')`
  - `accepts the same title by another artist` und `… without artist`
  - `byTitle sorts by German collation with numbers in order` – „Ägypten“ vor „Bach“,
    „abba“ und „ABBA“ nebeneinander, „Vol. 2“ vor „Vol. 10“, „The Wall“ unter T
  - `byTitle orders equal titles by artist, without artist first`
  - `albumName joins title and artist` / `… shows only the title without artist`
  - Test `rejects an album without artist` entfällt.
  ```ts
  export type AlbumDraft = { title: string; artist: string }
  export type NewAlbum = { title: string; artist: string }
  export type Album = NewAlbum & { id: AlbumId; listenings: readonly Listening[] }

  export function newAlbum(
    draft: AlbumDraft,
    otherAlbums: readonly NewAlbum[],
  ): NewAlbum
  ```
  `Listening` (`export type Listening = string`) steht in `album.ts`, damit
  `album.ts` und `listening.ts` sich nicht gegenseitig importieren; die Funktionen in
  `listening.ts` folgen in Phase 3.
- [x] `src/albums/domain/albumAnnouncements.ts` (+ Test, zuerst):
  `albumsHeading(count)` („Alben“ / „Alben, 3“), `albumFailureMessage(error)`
  (Text je `InvalidAlbumReason`, `null` bei fremden Fehlern),
  `albumSavedAnnouncement(album)`.
- [x] `src/shared/storage/deviceStorage.ts` – `DeviceStorage` hierher verschieben;
  `appearanceClient.ts`, `localStorageAppearanceClient.ts` und dessen Test importieren
  von dort.
- [x] `src/albums/api/albumsClient.ts` – Port wie unter *Abstraktionen*.
- [x] `src/albums/api/localStorageAlbumsClient.test.ts` (zuerst) – mit eigenem
  `DeviceStorage` aus einem `Map`, Muster wie `localStorageAppearanceClient.test.ts`:
  - `reads no albums from empty storage`
  - `writes and reads albums with version 1` – geschriebenes JSON hat `version: 1`
  - `keeps unreadable data aside and starts empty` – Rohtext `'{kaputt'` landet unter
    `albums.unreadable`, `readAlbums()` liefert `[]`
  - `keeps data of an unknown version aside` – `{"version":2,…}`
  - `does not overwrite data already kept aside`
  - `starts empty when storage is blocked` und `ignores writes when storage is blocked`
  - `creates distinct album ids`
- [x] `src/albums/api/localStorageAlbumsClient.ts` – Adapter. Lesen prüft die Form
  (`version === 1`, `albums` ist Array, jedes Album hat `id`, `title`, `artist` als
  String und `listenings` als String-Array); Fehler von `localStorage` werden wie im
  Appearance-Adapter verschluckt. Parameter `storage: DeviceStorage | null` und
  `createId: () => string = () => crypto.randomUUID()`.
- [x] `src/albums/api/inMemoryAlbumsClient.ts` – Fake mit Anfangsalben, Zähler-IDs
  (`album-1`, …) und `storedAlbums()`.
- [x] `src/shared/storage/persistentStorage.ts` –
  `requestPersistentStorage(storage: Pick<StorageManager, 'persist'> | undefined =
  navigator.storage)` ruft `persist()` auf, falls vorhanden, und verschluckt eine
  Ablehnung; kein Test (reine Klebe).
- [x] `src/shared/ui/` – `BottomBar.tsx` samt `BottomBar.test.tsx`,
  `useOnScreenKeyboard.ts`, `SaveIcon.tsx` aus dem Mahlzeitenplaner übernehmen.
- [x] `src/index.css` – `--bottomBarHeight`, `.pageActions`, `.bottomBar`,
  `.bottomBarInFlow`, `.bottomBarContent`, `.bottomBarContent button` und die beiden
  `:has(.bottomBar…)`-Regeln aus `Mahlzeitenplaner/src/index.css:20,411-480`.
- [x] `src/albums/ui/useAlbums.ts` – Hook nach `useMeals.ts`, aber ohne Beobachter:
  Zustand aus `client.readAlbums()`, jede Änderung schreibt per
  `client.writeAlbums()`; liefert `albums` sortiert per `byTitle`. In Phase 1:
  `addAlbum(newAlbum): Album`.
- [x] `src/albums/ui/AlbumListPage.tsx` – aus `AlbumsPage.tsx` (umbenennen):
  Überschrift `albumsHeading`, `[+]` ohne `aria-disabled` mit `onClick={onAddAlbum}`,
  Leertext oder `<ul className="itemList">` mit `AlbumListRow`.
- [x] `src/albums/ui/AlbumListRow.tsx` – zunächst einzeilig: `li.listRow` mit
  `button.rowButton`, Text `albumName(album)`. `onOpenAlbum` folgt in Phase 2.
- [x] `src/albums/ui/AlbumFormPage.tsx` – nach `MealFormPage.tsx`: `<form>` mit
  `onSubmit` (verhindert das Neuladen), „Zurück zu den Alben“, Überschrift
  „Album hinzufügen“, Felder `albumTitle` („Albumname“, Fokus beim Öffnen) und
  `albumArtist` („Bandname (optional)“), `<p id="albumFailure" className="failure">`,
  beide Felder mit `aria-describedby="albumFailure"`; `BottomBar` mit
  `<button type="submit"><SaveIcon />Speichern</button>`. Bei `InvalidAlbum` Meldung
  setzen, ansagen, Fokus ins Feld Albumname. Props: `otherAlbums: readonly NewAlbum[]`,
  `onSave(newAlbum: NewAlbum)`, `onBack`, `announce`; das Formular ruft
  `newAlbum(draft, otherAlbums)` selbst auf, wie `MealFormPage` `createMeal`.
- [x] `src/albums/ui/AlbumsArea.tsx` – Seiten `{ kind: 'list' } | { kind: 'form' }`;
  übergibt dem Formular alle Alben als `otherAlbums`; `onSave` ruft `addAlbum`, sagt
  `albumSavedAnnouncement` an und zeigt die Liste.
- [x] `src/albums/ui/AlbumsArea.test.tsx` (zuerst) – mit `inMemoryAlbumsClient`, fester
  Uhr und einer `announce`-Funktion, die die Ansagen in einem Array sammelt:
  - `opens the form with the focus in the album name`
  - `adds an album and announces it` – Liste zeigt es, Fake hat es gespeichert,
    Überschrift „Alben, 1“ fokussiert
  - `adds an album without artist`
  - `rejects a missing album name`
  - `rejects an album already listed`
  - `saves with the enter key`
  - `goes back without saving`
  - `lists albums alphabetically`
  - `has no accessibility violations` – Liste und Formular
- [x] `src/App.tsx` – Props `albumsClient: AlbumsClient` und `clock: () => Date`;
  rendert `<AlbumsArea albumsClient clock announce navigation />`.
- [x] `src/main.tsx` – `createLocalStorageAlbumsClient()`, `() => new Date()`,
  `void requestPersistentStorage()`.
- [x] `src/App.test.tsx` – `renderApp` mit `createInMemoryAlbumsClient()` und fester
  Uhr; Test `offers adding an album only as unavailable` ersetzen durch
  `opens adding an album from the albums page`.
- [x] `e2e/albums.spec.ts` – Album „Kind of Blue“ / „Miles Davis“ anlegen, Seite neu
  laden, Zeile „Kind of Blue, Miles Davis“ ist noch da.

**Automatisierte Verifikation**:
- [x] `npm run test` grün, darunter `album.test.ts`, `albumAnnouncements.test.ts`,
  `localStorageAlbumsClient.test.ts`, `BottomBar.test.tsx`, `AlbumsArea.test.tsx`,
  `App.test.tsx`, `domainLayerBoundary.test.ts`
- [x] `npm run lint` grün
- [x] `npm run build` grün
- [x] `npm run test:e2e` grün, darunter `albums.spec.ts`
- [x] `grep -rn "aria-disabled" src/albums` findet nichts

**Manuelle Verifikation**:
- [ ] Auf dem Handy mit TalkBack: `[+]` wird ohne „nicht verfügbar“ angesagt; im
  Formular liegt der Fokus im Albumnamen; die Leiste mit „Speichern“ steht bei offener
  Tastatur unter den Feldern und sonst fest unten; nach dem Speichern wird
  „<Album> gespeichert.“ angesagt; nach App-Neustart ist das Album noch da.

### Phase 2: Alben bearbeiten und löschen

Abhängigkeiten: Phase 1

Ein Tipp auf das Album öffnet „Album bearbeiten“; von dort lässt es sich ändern oder
nach Bestätigung löschen.

**Aufgaben**:
- [ ] `src/albums/domain/albumAnnouncements.test.ts` zuerst ergänzen, dann umsetzen:
  `albumDeletedAnnouncement(album, remainingCount)` (n Alben / 1 Album / keine mehr),
  `deletionConsequence(album)` (0 / 1 / n, Texte laut *Zielbild*).
- [ ] `src/albums/ui/useAlbums.ts` – `changeAlbum(id, newAlbum)` (behält `listenings`)
  und `removeAlbum(id)`.
- [ ] `src/albums/ui/AlbumFormPage.tsx` – Prop `editedAlbum: Album | null`: Felder
  vorbefüllen, Überschrift „Album bearbeiten“, in der Leiste zusätzlich
  `<button type="button"><TrashIcon />Löschen</button>` mit `onDelete`. Das Prüfen auf
  Doppel bekommt von `AlbumsArea` als `otherAlbums` alle Alben außer dem bearbeiteten.
- [ ] `src/shared/ui/TrashIcon.tsx` – aus dem Mahlzeitenplaner übernehmen.
- [ ] `src/albums/ui/DeleteAlbumPage.tsx` – nach `DeleteMealPage.tsx`: „Zurück zum
  Album“, Überschrift „<Album> löschen?“, `deletionConsequence`, `BottomBar` mit
  „Löschen“ und „Abbrechen“.
- [ ] `src/albums/ui/AlbumListRow.tsx` – `onOpenAlbum` am `rowButton`.
- [ ] `src/albums/ui/AlbumsArea.tsx` – Seiten `{ kind: 'form'; id: AlbumId | null }`
  und `{ kind: 'delete'; id: AlbumId }`; Speichern im Bearbeiten ruft `changeAlbum`;
  Löschen ruft `removeAlbum`, sagt `albumDeletedAnnouncement` an, zeigt die Liste.
- [ ] `src/albums/ui/AlbumsArea.test.tsx` zuerst ergänzen:
  - `opens an album for editing with its values`
  - `renames an album and keeps its listenings`
  - `allows saving an album unchanged` (kein Doppel mit sich selbst)
  - `rejects renaming to another listed album`
  - `asks before deleting and names the lost listenings`
  - `deletes an album and announces the remaining count`
  - `cancels deleting back to editing`
  - `offers no deleting while adding`
  - `has no accessibility violations` – Bearbeiten und Löschseite
- [ ] `e2e/albums.spec.ts` – zweiter Test: anlegen, öffnen, umbenennen, löschen
  bestätigen, „Noch keine Alben.“ sichtbar, nach Neuladen weiterhin leer.

**Automatisierte Verifikation**:
- [ ] `npm run test` grün, darunter die neuen Fälle in `albumAnnouncements.test.ts`
  und `AlbumsArea.test.tsx`
- [ ] `npm run lint`, `npm run build`, `npm run test:e2e` grün

**Manuelle Verifikation**:
- [ ] Auf dem Handy mit TalkBack: Tipp auf ein Album öffnet „Album bearbeiten“ mit
  vorbefüllten Feldern; „Löschen“ führt zur Rückfrage mit Anzahl; nach dem Löschen wird
  die Restzahl angesagt und der Fokus liegt auf der Überschrift.

### Phase 3: „Gehört“ zählen mit Rückgängig

Abhängigkeiten: Phase 1 (Phase 2 nur für den Test „Rückgängig verschwindet beim
Seitenwechsel“)

Jede Zeile zählt Hören per `[↑]`, zeigt Monat und insgesamt, und ein Fehltipp lässt
sich unten zurücknehmen.

**Aufgaben**:
- [ ] `src/albums/domain/listening.test.ts` (zuerst), dann `listening.ts`. Zeiten mit
  `new Date(2026, 10, 15, 12, 0)` (Ortszeit), damit die Tests unabhängig von der
  Zeitzone der Maschine sind:
  - `records a listening as ISO timestamp`
  - `counts listenings of the current calendar month` – 1. November 00:00 zählt,
    31. Oktober 23:59 nicht, November des Vorjahrs nicht
  - `counts all listenings in total`
  - `adds a listening` / `removes exactly the given listening` – bei zwei gleichen
    Zeitstempeln wird nur einer entfernt
- [ ] `src/albums/domain/albumAnnouncements.ts` (+ Test, zuerst):
  `albumRowLabel(album, now)` („<Album>. Diesen Monat 3 Mal, insgesamt 14 Mal
  gehört.“), `listenedButtonLabel(album)` („<Album> gehört“),
  `listenedAnnouncement(album, now)`, `listeningTakenBackAnnouncement(album, now)`,
  `undoListeningLabel(album)` („Rückgängig: <Album>“).
- [ ] `src/albums/ui/useAlbums.ts` – `listenTo(id): Listening` (mit `clock()`) und
  `takeBackListening(id, listening)`.
- [ ] `src/albums/ui/CalendarIcon.tsx` aus `Mahlzeitenplaner/src/shared/ui/` übernehmen
  (nur Alben nutzen ihn, daher unter `albums/ui`); `ArrowUpIcon.tsx` neu im Stil von
  `SettingsIcon` (`<path d="M12 19V5" /><path d="m5 12 7-7 7 7" />`).
- [ ] `src/albums/ui/AlbumListRow.tsx` – zweizeiliger `rowButton` mit
  `aria-label={albumRowLabel(album, now)}`: oben `albumName`, darunter
  `<span className="albumStats">` mit `CalendarIcon`, Monatszahl, `RecordIcon`,
  Gesamtzahl; daneben `button.iconButton` mit `ArrowUpIcon` und
  `aria-label={listenedButtonLabel(album)}`.
- [ ] `src/index.css` – `.albumStats` (Flex, `gap: 0.5rem`, `align-items: center`),
  `.albumStats .buttonIcon` (`width`/`height` 1.25rem), `.rowButton` mit `display: flex; flex-direction: column;
  align-items: flex-start`.
- [ ] `src/albums/ui/AlbumListPage.tsx` – Prop `undoListening: { label; onUndo } | null`;
  wenn gesetzt, `BottomBar` mit dem Knopf.
- [ ] `src/albums/ui/AlbumsArea.tsx` – Zustand `lastListening: { albumId; listening } |
  null`; nach `listenTo` setzen und ansagen; „Rückgängig“ ruft `takeBackListening`,
  sagt an, setzt `null`; jeder Seitenwechsel setzt `null`. Nach dem Rückgängigmachen
  geht der Fokus auf den `[↑]`-Knopf desselben Albums, weil der gedrückte Knopf
  verschwindet: `AlbumsArea` hält `listenButtonFocusRequest: { albumId; request } |
  null`, `AlbumListPage` reicht ihn durch, und `AlbumListRow` fokussiert seinen
  `[↑]`-Knopf per `useEffect`, wenn die `albumId` passt und `request` sich ändert.
- [ ] `src/albums/ui/AlbumsArea.test.tsx` zuerst ergänzen (feste Uhr):
  - `counts a listening and announces both counts` – Fokus bleibt auf `[↑]`
  - `shows this month and total in the row label` – Album mit Hören aus Vormonat
  - `takes back the last listening` – Zähler wieder alt, Ansage, Knopf weg, Fokus auf
    `[↑]`
  - `offers taking back only the latest listening` – zweites Hören bei anderem Album
  - `drops the undo offer when leaving the list`
  - `keeps listenings after reopening` – neuer Render mit demselben Fake
  - `has no accessibility violations` – Liste mit Rückgängig-Leiste
- [ ] `src/App.test.tsx` – `drops the undo offer when switching the area`.
- [ ] `e2e/albums.spec.ts` – dritter Test: Album anlegen, zweimal `[↑]`, einmal
  „Rückgängig“, neu laden, Zeile nennt „insgesamt 1 Mal gehört“.

**Automatisierte Verifikation**:
- [ ] `npm run test` grün, darunter `listening.test.ts`, `albumAnnouncements.test.ts`,
  `AlbumsArea.test.tsx`, `App.test.tsx`
- [ ] `npm run lint`, `npm run build`, `npm run test:e2e` grün
- [ ] `test/colorContrast.test.ts` weiterhin grün (keine neuen Farben)

**Manuelle Verifikation**:
- [ ] Auf dem Handy mit TalkBack: `[↑]` wird als „<Album> gehört“ angesagt; nach dem
  Tipp kommen beide Zähler in der Ansage, die Zeile zeigt Kalender und Platte mit den
  neuen Zahlen; unten erscheint „Rückgängig: <Album>“ und nimmt das Hören zurück; nach
  dem Wechsel zu den Einstellungen und zurück ist die Leiste weg.
- [ ] In beiden Farbschemata: Icons in der Zeile gut sichtbar, die Leiste unten
  verdeckt beim Scrollen keine letzte Zeile.

## Notizen zur Umsetzung

Hier während der Umsetzung Rückmeldungen, Probleme und Entscheidungen festhalten.

## Verweise

- `docs/notes.txt` – Wünsche zur Alben-Seite und zum Formular
- `docs/agents/plans/2026-11-12-grunddesign.md` – ALS-001, Folgestories
- `C:/MW/Projekte/privat/Mahlzeitenplaner/src/meals/ui/MealsArea.tsx`,
  `MealFormPage.tsx`, `DeleteMealPage.tsx`, `MealListRow.tsx`, `MealListPage.tsx`,
  `useMeals.ts`, `meals/api/mealsClient.ts`, `inMemoryMealsClient.ts`,
  `meals/domain/announcements.ts`
- `C:/MW/Projekte/privat/Mahlzeitenplaner/src/shared/ui/BottomBar.tsx` (+ Test),
  `useOnScreenKeyboard.ts`, `SaveIcon.tsx`, `TrashIcon.tsx`, `CalendarIcon.tsx`,
  `src/index.css:411-480`
- MDN, `StorageManager.persist()`:
  <https://developer.mozilla.org/en-US/docs/Web/API/StorageManager/persist>
- MDN, `Intl.Collator`:
  <https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/Collator>
