---
date: 2026-11-12T13:25:04+00:00
git_commit: c04191f63ab1fe93fb4304db36150c118351a6f7
branch: main
story: ALS-004
topic: "Daten speichern, teilen und laden"
tags: [plan, albums, settings, files, domain, ui]
status: ready
---

# PLAN: ALS-004 — Daten speichern und laden

Alben und Hörzeitpunkte lassen sich als Datei sichern — per Download oder über das
Android-Teilen-Menü — und auf demselben oder einem neuen Handy wieder laden. Beim Laden
wird die Datei mit den vorhandenen Alben zusammengeführt, ohne dass etwas verloren geht.
Grundlage: `docs/notes.txt` (Einstellungsseite: „Daten speichern/laden button — führt auf
neue Seite …“) und die Folgestory-Notiz in
`docs/agents/plans/2026-11-12-alben-verwalten-und-gehoert-zaehlen.md:19-20,84`.

`<Datum>` steht für das Ortsdatum des Geräts als `JJJJ-MM-TT`.

## Akzeptanzkriterien

- Die Einstellungen haben nach den Schaltern (und vor „App installieren“) den Eintrag
  „Daten speichern und laden“. Er öffnet eine eigene Seite ohne Navigationsleiste mit
  „Zurück zu den Einstellungen“, der Überschrift `h1` „Daten speichern und laden“
  (Fokus), einem Erklärtext und den Knöpfen „Daten speichern“, „Daten teilen“ (nur bei
  Unterstützung) und „Daten laden“.
- „Zurück zu den Einstellungen“ zeigt die Einstellungen mit dem Fokus auf dem Eintrag
  „Daten speichern und laden“. Beim Wechsel des Bereichs über die Navigation öffnen die
  Einstellungen wieder mit dem Fokus auf ihrer Überschrift.
- „Daten speichern“ lädt `album-statistics-<Datum>.json` herunter und sagt
  „Daten gespeichert als album-statistics-<Datum>.json.“ an. Inhalt ist das vorhandene
  Speicherformat `{ "version": 1, "albums": [...] }` mit allen Alben samt Hörzeitpunkten.
- „Daten teilen“ erscheint nur, wenn `navigator.canShare({ files })` die Datei annimmt.
  Es teilt denselben Inhalt als `album-statistics-<Datum>.txt` (`text/plain`) und sagt
  „Daten geteilt.“ an, bei Abbruch „Teilen abgebrochen.“, bei anderem Fehler
  „Teilen hat nicht geklappt.“
- „Daten laden“ öffnet die Dateiauswahl (`.json`, `.txt`) und führt die Datei ohne
  Rückfrage mit den Alben auf dem Gerät zusammen:
  - Gleich sind Alben mit gleichem Album- und Bandnamen nach der Regel der Doppelprüfung
    (Groß-/Kleinschreibung, Akzente und Randleerzeichen egal). Name und ID des Albums auf
    dem Gerät bleiben.
  - Je Hörzeitpunkt, verglichen nach Zeitwert, gilt die höhere Anzahl aus Gerät und
    Datei. Dieselbe Datei zweimal zu laden ändert nichts.
  - Alben, die es noch nicht gibt, kommen mit neuer ID hinzu; mehrfach in der Datei
    stehende gleiche Alben werden dabei ebenso verschmolzen.
- Nach dem Laden wird angesagt (Einzahl jeweils „1 Album“, „1 Mal Hören“):
  - „Daten geladen. 3 Alben neu, 2 Alben um 25 Mal Hören ergänzt.“
  - „Daten geladen. 3 Alben neu.“ bzw. „Daten geladen. 2 Alben um 25 Mal Hören ergänzt.“
  - „Daten geladen. Es war nichts Neues dabei.“
  Der Fokus liegt auf „Daten laden“; die Albenliste zeigt danach den neuen Stand, auch
  nach einem Neustart.
- Eine ungültige Datei (kein JSON, falsche Form, andere `version`, leerer Albumname,
  unlesbarer Zeitpunkt) ändert nichts. „Diese Datei enthält keine lesbaren Album-Daten.
  Es wurde nichts geändert.“ wird angesagt und steht unter den Knöpfen in `--failure`;
  der Text verschwindet bei der nächsten erfolgreichen Aktion.

## Wesentliche Entscheidungen und Abwägungen

1. **Nur Alben in der Datei, im vorhandenen Speicherformat.**
   - Warum: Kein zweites Format; die Farbeinstellungen sind in zwei Tipps neu gesetzt.
   - Auswirkung: Die Formprüfung wandert aus `localStorageAlbumsClient.ts:18-36` nach
     `albums/api/albumsFile.ts` und wird von Adapter und Datei genutzt.
2. **Zusammenführen statt Ersetzen.** Gleichheit über Album- und Bandnamen, je Zeitpunkt
   die höhere Anzahl.
   - Warum: Nichts geht verloren, mehrfaches Laden ist harmlos.
   - Auswirkung: Reine Domänenfunktion `mergeAlbums` in `albums/domain/albumMerge.ts`.
     Ein auf dem Gerät gelöschtes Hören aus einer älteren Sicherung kommt zurück; es
     lässt sich über den Eimer auf der Detailseite wieder löschen. Ein auf einem Gerät
     umbenanntes Album steht danach zweimal da.
3. **Keine Bestätigung vor dem Laden**, dafür eine Ansage mit neuen und ergänzten Alben.
   - Warum: Zusammenführen zerstört nichts.
4. **Download und Teilen; Teilen als `.txt`.**
   - Warum: Chrome lässt beim Teilen nur bestimmte Dateiarten zu, `application/json`
     wird mit „Permission denied“ abgelehnt, `text/plain` geht.
   - Auswirkung: Port `FileExportClient` in `src/shared/files/` mit Browser-Adapter und
     Fake. „Daten teilen“ wird nur bei `canShare` gezeigt (Muster „App installieren“).
5. **Lesen ohne Port.** Ein verstecktes `<input type="file">` liefert ein `File`, den Text
   holt `file.text()`.
   - Warum: Läuft in jsdom und lässt sich mit `userEvent.upload` und Playwrights
     `filechooser` prüfen.
6. **Alles oder nichts** bei ungültigen Dateien.
   - Warum: Keine halben Ergebnisse; nur diese App schreibt die Dateien.
   - Auswirkung: `albumsFromFileText` wirft `UnreadableAlbumsFile`. Die Formprüfung liegt
     im Api, die fachliche Prüfung (Name nicht leer, Zeitpunkt lesbar) als
     `isLoadableAlbum` in der Domäne.
7. **Unterseite der Einstellungen in `App.tsx`.** Die Seite `AlbumsBackupPage` liegt in
   `albums/ui`, weil `shared/ui` keine Alben kennen darf (`eslint.config.js:38-51`).
   - Auswirkung: `App` hält `settingsPage: { kind: 'overview'; focusedEntry: string |
     null } | { kind: 'backup' }`; `SettingsPage` bekommt die Prop `focusedEntry`.
     `AlbumsArea` hängt in den Einstellungen aus, daher liest `useAlbums` beim Rückweg
     zur Liste den neuen Stand ohne Zusatzaufwand (`useAlbums.ts:26`).

## Ausgangslage

```
App (src/App.tsx:94-108)
  ├─ Bereich albums   → AlbumsArea → useAlbums(albumsClient, clock)
  └─ Bereich settings → SettingsPage (shared/ui)
                          Einträge: toggle | action  (SettingsPage.tsx:4-12)
                          Fokus: Überschrift per useHeadingFocus(headingFocusRequest)

albums/api/localStorageAlbumsClient.ts
  Schlüssel "albums", { version: 1, albums: Album[] }
  isStoredAlbum / isStoredAlbums  (privat, Zeilen 18-36)
```

- `Album = { id, title, artist, listenings: readonly Listening[] }` (`album.ts:9-12`),
  `Listening` ist ein ISO-Zeitstempel.
- Gleichheit zweier Alben: `isSameAlbum` (`album.ts:28-33`, privat) über
  `Intl.Collator('de', { sensitivity: 'base', numeric: true })`.
- Zeitpunkte werden nach `Date.parse` verglichen (`listening.ts:37-39`).
- Vorlage für den Download: `Straight-Line-Navigation/src/main.ts:454-465`.

## Zielbild

```
App
  ├─ Bereich albums   → AlbumsArea                     (unverändert)
  └─ Bereich settings
       ├─ overview → SettingsPage  (+ focusedEntry)
       │               … [Daten speichern und laden] ──▶ backup
       └─ backup   → AlbumsBackupPage (albums/ui)
                        useAlbums(albumsClient, clock)   + mergeLoadedAlbums
                        fileExportClient                 download / canShare / share
                        <input type="file"> → file.text() → albumsFromFileText

albums/domain   albumMerge.ts (mergeAlbums, isLoadableAlbum), listening.ts (+ isListening),
                album.ts (isSameAlbum exportiert), albumAnnouncements.ts (+ Ansagen)
albums/api      albumsFile.ts (Format, Prüfung, Dateinamen), localStorageAlbumsClient.ts
shared/files    fileExportClient.ts, browserFileExportClient.ts, inMemoryFileExportClient.ts
```

### Einstellungen — vorher

```
+--------------------------------------+
|   [ Platte ]       [ Zahnrad ]       |
+--------------------------------------+
| Einstellungen                        |
|--------------------------------------|
| Farben invertieren          [ ]      |
| Nur Buttons invertieren     [ ]      |
| [ App installieren ]                 |   <- nur bei Angebot
+--------------------------------------+
```

### Einstellungen — nachher

```
+--------------------------------------+
|   [ Platte ]       [ Zahnrad ]       |
+--------------------------------------+
| Einstellungen                        |
|--------------------------------------|
| Farben invertieren          [ ]      |
| Nur Buttons invertieren     [ ]      |
| [ Daten speichern und laden ]        |   <- neu, Fokus beim Zurückkehren
| [ App installieren ]                 |   <- nur bei Angebot
+--------------------------------------+
```

### Daten speichern und laden

```
+--------------------------------------+
| [Zurück zu den Einstellungen]        |
| Daten speichern und laden            |   <- h1, Fokus beim Öffnen
| Speichern legt eine Datei mit allen  |
| Alben und Hörzeitpunkten an. Laden   |
| führt eine solche Datei mit den      |
| Alben auf diesem Gerät zusammen.     |
|--------------------------------------|
| [ Daten speichern ]                  |
|--------------------------------------|
| [ Daten teilen ]                     |   <- nur bei canShare
|--------------------------------------|
| [ Daten laden ]                      |   <- öffnet die Dateiauswahl
|--------------------------------------|
| Diese Datei enthält keine lesbaren   |   <- nur nach ungültiger Datei,
| Album-Daten. Es wurde nichts         |      in --failure
| geändert.                            |
+--------------------------------------+
```

### Dateiinhalt

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

### Zusammenführen, Beispiel

```
Gerät:  Kind of Blue / Miles Davis   [A, A, B]
Datei:  kind of blue / MILES DAVIS   [A, C]
        The Wall / Pink Floyd        [D]
        THE WALL / Pink Floyd        [D, E]

Ergebnis:
        Kind of Blue / Miles Davis   [A, A, B, C]   (Gerätename, Geräte-ID)
        The Wall / Pink Floyd        [D, E]         (neue ID)
Ansage: Daten geladen. 1 Album neu, 1 Album um 1 Mal Hören ergänzt.
```

## Abstraktionen und Wiederverwendung

- `src/albums/domain/`
  - `album.ts` – `isSameAlbum` wird exportiert (sonst unverändert)
  - `listening.ts` (+ Test) – `isListening(text: string): boolean` –
    `!Number.isNaN(Date.parse(text))`
  - `albumMerge.ts` (+ Test) – neu
    - `LoadedAlbum` – `NewAlbum & { listenings: readonly Listening[] }`
    - `isLoadableAlbum(album: LoadedAlbum): boolean` – Name nach `trim()` nicht leer,
      alle Zeitpunkte `isListening`
    - `AlbumsMerge` – `{ albums: Album[]; addedAlbums: number; extendedAlbums: number;
      addedListenings: number }`
    - `mergeAlbums(present, loaded, createAlbumId): AlbumsMerge`
  - `albumAnnouncements.ts` (+ Test) – `albumsSavedAnnouncement(fileName)`,
    `albumsLoadedAnnouncement(merge)`, `unreadableAlbumsFileMessage`,
    `shareAnnouncement(outcome)` mit den Texten aus den *Akzeptanzkriterien*
- `src/albums/api/`
  - `albumsFile.ts` (+ Test) – neu
    - `ALBUMS_FORMAT_VERSION = 1`, `isAlbumsFileContent` (Formprüfung aus dem Adapter)
    - `albumsFileText(albums): string`
    - `storedAlbumsFromText(text): Album[] | null` – für den Adapter, ohne fachliche
      Prüfung (heutiges Verhalten)
    - `UnreadableAlbumsFile` (Fehlerklasse), `albumsFromFileText(text): LoadedAlbum[]`
    - `albumsDownloadFile(albums, today): ExportFile`, `albumsShareFile(albums, today):
      ExportFile`
  - `localStorageAlbumsClient.ts` – nutzt `albumsFile.ts`; Verhalten unverändert,
    bestehende Tests bleiben grün
- `src/shared/files/` – neu
  - `fileExportClient.ts` – Port
    ```ts
    export type ExportFile = { name: string; mimeType: string; text: string }
    export type ShareOutcome = 'shared' | 'dismissed' | 'failed'

    export interface FileExportClient {
      download(file: ExportFile): void
      canShare(file: ExportFile): boolean
      share(file: ExportFile): Promise<ShareOutcome>
    }
    ```
  - `browserFileExportClient.ts` (+ Test) – Adapter
  - `inMemoryFileExportClient.ts` – Fake mit `downloadedFiles()`, `sharedFiles()`,
    einstellbarem `shareable` und `shareOutcome`
- `src/albums/ui/`
  - `useAlbums.ts` – `mergeLoadedAlbums(loaded): AlbumsMerge`
  - `AlbumsBackupPage.tsx` (+ Test `AlbumsBackupPage.test.tsx`) – neu
- `src/shared/ui/SettingsPage.tsx` – Prop `focusedEntry: string | null`
- `src/App.tsx`, `src/main.tsx`, `src/App.test.tsx`
- `e2e/backup.spec.ts` – neu

## Logging und Beobachtbarkeit

Keine Logs. Rückmeldungen laufen über den Ansagebereich (`role="status"`):

```
Daten gespeichert als album-statistics-2026-11-15.json.
Daten geteilt.
Teilen abgebrochen.
Teilen hat nicht geklappt.
Daten geladen. 3 Alben neu, 2 Alben um 25 Mal Hören ergänzt.
Daten geladen. 1 Album neu.
Daten geladen. Es war nichts Neues dabei.
Diese Datei enthält keine lesbaren Album-Daten. Es wurde nichts geändert.
```

## Umsetzung

### Phase 1: Daten speichern

Abhängigkeiten: keine

Aus den Einstellungen führt „Daten speichern und laden“ auf die neue Seite; „Daten
speichern“ lädt die Sicherungsdatei herunter.

**Aufgaben**:
- [x] `src/albums/api/albumsFile.test.ts` (zuerst), dann `albumsFile.ts`:
  - `writes all albums with version 1` – `JSON.parse(albumsFileText([kindOfBlue]))`
    ergibt `{ version: 1, albums: [kindOfBlue] }`
  - `reads stored albums back` / `reads nothing from unreadable text` /
    `reads nothing from another version` – `storedAlbumsFromText`
  - `names the download file after the local date` –
    `albumsDownloadFile([], new Date(2026, 0, 4, 23, 30))` hat Namen
    `album-statistics-2026-01-04.json`, `mimeType` `application/json`, Text wie
    `albumsFileText`
  ```ts
  function localDate(today: Date): string {
    const month = String(today.getMonth() + 1).padStart(2, '0')
    const day = String(today.getDate()).padStart(2, '0')
    return `${today.getFullYear()}-${month}-${day}`
  }
  ```
- [x] `src/albums/api/localStorageAlbumsClient.ts` – `isStoredAlbum`, `isStoredAlbums`,
  `parsed` und `STORAGE_VERSION` durch `storedAlbumsFromText` und
  `ALBUMS_FORMAT_VERSION` aus `albumsFile.ts` ersetzen; `writeAlbums` schreibt
  `albumsFileText(albums)`. `localStorageAlbumsClient.test.ts` bleibt unverändert grün
  (Import von `STORAGE_VERSION` dort ggf. auf `ALBUMS_FORMAT_VERSION` umstellen).
- [x] `src/shared/files/fileExportClient.ts` – Port wie unter *Abstraktionen*.
- [x] `src/shared/files/browserFileExportClient.test.ts` (zuerst), dann
  `browserFileExportClient.ts` mit Parameter
  `environment: FileExportEnvironment = { document, navigator, URL }` (`navigator` und
  `URL` als `Pick` der benötigten Teile). In Phase 1:
  - `downloads a file through a temporary link` – mit eigenem `URL`-Ersatz
    (`createObjectURL` liefert `'blob:backup'`, `revokeObjectURL` merkt sich den Aufruf)
    und einem Klick-Beobachter am `document`: geklickter Link hat `href` `blob:backup`
    und `download` = Dateiname, danach ist die Adresse freigegeben und der Link nicht
    mehr im Dokument.
  ```ts
  download(file) {
    const address = environment.URL.createObjectURL(
      new Blob([file.text], { type: file.mimeType }),
    )
    const link = environment.document.createElement('a')
    link.href = address
    link.download = file.name
    environment.document.body.append(link)
    link.click()
    link.remove()
    environment.URL.revokeObjectURL(address)
  }
  ```
  `canShare` liefert in Phase 1 `false`, `share` `'failed'` (Phase 3 füllt beides).
- [x] `src/shared/files/inMemoryFileExportClient.ts` – Fake: `download` merkt sich die
  Datei, `downloadedFiles()`; `canShare`/`share` folgen in Phase 3 (zunächst `false`
  bzw. `'failed'`).
- [x] `src/albums/domain/albumAnnouncements.test.ts` zuerst ergänzen, dann
  `albumsSavedAnnouncement(fileName)` → „Daten gespeichert als <fileName>.“
- [x] `src/shared/ui/SettingsPage.tsx` – Prop `focusedEntry: string | null`. Statt
  `useHeadingFocus` ein Effekt mit Abhängigkeit `headingFocusRequest`: liegt ein
  `action`-Knopf mit `entry.id === focusedEntry` vor, bekommt er den Fokus (Ref per
  Rückruf-Ref in einer `Map`), sonst die Überschrift.
- [x] `src/albums/ui/AlbumsBackupPage.tsx` – Props `albumsClient`, `clock`,
  `fileExportClient`, `announce`, `onBack`. Aufbau laut *Zielbild*: Knopf
  „Zurück zu den Einstellungen“, `h1` per `useHeadingFocus`, `<p>` mit Erklärtext,
  `<ul className="itemList">` mit `li.listRow` und `button.rowButton` „Daten speichern“.
  Speichern: `albumsDownloadFile(albums, clock())` an `fileExportClient.download`,
  `albumsSavedAnnouncement` ansagen. Alben über `useAlbums(albumsClient, clock)`.
- [x] `src/albums/ui/AlbumsBackupPage.test.tsx` (zuerst) – mit `inMemoryAlbumsClient`,
  `inMemoryFileExportClient`, fester Uhr `new Date(2026, 10, 15, 12, 0)` und
  gesammelten Ansagen:
  - `focuses the heading when opened`
  - `downloads all albums as a dated file` – Fake hat
    `album-statistics-2026-11-15.json` mit beiden Testalben, Ansage
  - `goes back to the settings` – `onBack` aufgerufen
  - `has no accessibility violations`
- [x] `src/App.tsx` – Prop `fileExportClient: FileExportClient`; Zustand
  `settingsPage` laut Entscheidung 7, Start `{ kind: 'overview', focusedEntry: null }`.
  Eintrag `{ kind: 'action', id: 'albumsBackup', label: 'Daten speichern und laden',
  onSelect: () => setSettingsPage({ kind: 'backup' }) }` nach den Schaltern, vor
  `installEntries`. `onBack` der Seite →
  `{ kind: 'overview', focusedEntry: 'albumsBackup' }`. `onSelectArea` setzt zusätzlich
  `{ kind: 'overview', focusedEntry: null }`.
- [x] `src/main.tsx` – `createBrowserFileExportClient()` übergeben.
- [x] `src/App.test.tsx` – `renderApp` mit `createInMemoryFileExportClient()`; zuerst
  neue Fälle:
  - `opens saving and loading data from the settings` – Überschrift
    „Daten speichern und laden“ fokussiert, keine Navigationsleiste
  - `returns to the settings entry for saving and loading data` – Fokus auf dem Knopf
    „Daten speichern und laden“
  - `opens the settings at their heading after switching the area` – Unterseite
    offen, über „Alben“ und zurück über „Einstellungen“: Überschrift „Einstellungen“
    fokussiert
  - `has no accessibility violations on saving and loading data`
- [x] `e2e/backup.spec.ts` – `downloads the albums as a file`: Album „Kind of Blue“ /
  „Miles Davis“ anlegen, „Einstellungen“, „Daten speichern und laden“,
  `page.waitForEvent('download')` beim Klick auf „Daten speichern“;
  `download.suggestedFilename()` passt auf `/^album-statistics-\d{4}-\d{2}-\d{2}\.json$/`,
  der gelesene Inhalt enthält das Album mit `version: 1`.

**Automatisierte Verifikation**:
- [x] `npm run test` grün, darunter `albumsFile.test.ts`,
  `localStorageAlbumsClient.test.ts`, `browserFileExportClient.test.ts`,
  `albumAnnouncements.test.ts`, `AlbumsBackupPage.test.tsx`, `App.test.tsx`,
  `domainLayerBoundary.test.ts`
- [x] `npm run lint` grün
- [x] `npm run build` grün
- [x] `npm run test:e2e` grün, darunter `backup.spec.ts`

**Manuelle Verifikation**:
- [ ] Auf dem Handy mit TalkBack: In den Einstellungen wird „Daten speichern und laden“
  angesagt, die Seite öffnet mit der Überschrift; „Daten speichern“ legt
  `album-statistics-<Datum>.json` im Ordner „Download“ ab (auch in der installierten
  App), die Ansage nennt den Dateinamen; „Zurück zu den Einstellungen“ landet auf dem
  Eintrag.

### Phase 2: Daten laden und zusammenführen

Abhängigkeiten: Phase 1

„Daten laden“ führt eine Sicherungsdatei mit den Alben auf dem Gerät zusammen oder
lehnt eine ungültige Datei ab, ohne etwas zu ändern.

**Aufgaben**:
- [x] `src/albums/domain/listening.test.ts` zuerst ergänzen, dann `isListening`:
  - `accepts a readable timestamp` – `'2026-11-12T18:04:00.000Z'` und
    `'2026-11-12T19:00:00+01:00'`
  - `rejects an unreadable timestamp` – `'gestern'`, `''`
- [x] `src/albums/domain/album.ts` – `isSameAlbum` exportieren.
- [x] `src/albums/domain/albumMerge.test.ts` (zuerst), dann `albumMerge.ts`. IDs im Test
  über einen Zähler `loaded-1`, `loaded-2`, …:
  - `adds albums that are not present yet` – neue ID, Titel und Band getrimmt,
    `addedAlbums` 1
  - `recognises a present album regardless of case, accents and blanks` – Name und ID
    des Geräts bleiben
  - `adds listenings missing on the device` – `extendedAlbums` 1, `addedListenings` 1
  - `keeps the higher count of equal listenings` – Gerät `[A, A, B]`, Datei `[A, C]`
    → `[A, A, B, C]`
  - `compares listenings by time, not by text` – `'2026-11-12T19:00:00+01:00'` in der
    Datei gilt als vorhanden, wenn das Gerät `'2026-11-12T18:00:00.000Z'` hat
  - `changes nothing when merging the same albums again` – Ergebnis gleich Eingabe,
    alle Zähler 0
  - `merges equal albums within the loaded albums` – Beispiel aus dem *Zielbild*
  - `keeps albums only present on the device`
  - `does not count listenings of new albums as additions` – `addedListenings` zählt nur
    Ergänzungen vorhandener Alben
  - `isLoadableAlbum rejects a blank title` / `… an unreadable listening` /
    `accepts an album without artist`
  ```ts
  function moment(listening: Listening): number {
    return Date.parse(listening)
  }

  function listeningsMissingIn(
    present: readonly Listening[],
    loaded: readonly Listening[],
  ): Listening[]
  ```
  `listeningsMissingIn` liefert je Zeitwert so viele Einträge aus `loaded`, wie sie die
  Anzahl in `present` übersteigen. Neue Alben werden zuerst in die Ergebnisliste
  aufgenommen und dann wie vorhandene behandelt, damit gleiche Alben innerhalb der
  Datei verschmelzen; gezählt werden sie nur in `addedAlbums`. `extendedAlbums` und
  `addedListenings` zählen nur Alben, die schon vor dem Laden auf dem Gerät waren.
- [x] `src/albums/domain/albumAnnouncements.test.ts` zuerst ergänzen, dann umsetzen:
  - `albumsLoadedAnnouncement(merge)` – alle Varianten aus den *Akzeptanzkriterien*,
    Einzahl „1 Album neu“, „1 Album um 1 Mal Hören ergänzt“
  - `unreadableAlbumsFileMessage` – Konstante mit dem Fehlertext
- [x] `src/albums/api/albumsFile.test.ts` zuerst ergänzen, dann
  `albumsFromFileText(text): LoadedAlbum[]`:
  - `reads albums from a saved file` – Rückgabe ohne `id`-Bedeutung, Titel, Band,
    Zeitpunkte erhalten
  - `rejects text that is no JSON`, `… another version`, `… albums of the wrong shape`,
    `… an album with a blank title`, `… an unreadable listening` – jeweils
    `UnreadableAlbumsFile`
  Ablauf: `JSON.parse` (Fehler → `UnreadableAlbumsFile`), `isAlbumsFileContent`,
  `every(isLoadableAlbum)`, dann `{ title, artist, listenings }` je Album.
- [x] `src/albums/ui/useAlbums.ts` – `mergeLoadedAlbums(loaded)` ruft
  `mergeAlbums(knownAlbums, loaded, client.createAlbumId)`, speichert `merge.albums`
  per `store` und liefert das `AlbumsMerge`.
- [x] `src/albums/ui/AlbumsBackupPage.tsx` – Knopf „Daten laden“ und
  `<input type="file" accept=".json,.txt,application/json,text/plain"
  className="visuallyHidden" tabIndex={-1} aria-hidden="true"
  aria-label="Datei mit Album-Daten">` (Ref; das Label nur für Lint- und axe-Regeln,
  bedient wird über den Knopf). Der Knopf ruft
  `fileInput.current?.click()`. `onChange`: erste Datei per `await file.text()` lesen,
  `albumsFromFileText`, `mergeLoadedAlbums`, `albumsLoadedAnnouncement` ansagen; bei
  `UnreadableAlbumsFile` die Meldung setzen (`<p className="failure">` unter der Liste)
  und ansagen. Danach `input.value = ''` (dieselbe Datei lässt sich erneut wählen) und
  Fokus auf „Daten laden“. Eine erfolgreiche Aktion (Speichern, Laden) leert die
  Meldung.
- [x] `src/albums/ui/AlbumsBackupPage.test.tsx` zuerst ergänzen; Upload per
  `userEvent.upload(fileInput, new File([text], 'album-statistics-2026-11-15.json',
  { type: 'application/json' }))`, `fileInput` über
  `document.querySelector('input[type="file"]')`:
  - `opens the file selection from loading data` – Klick auf „Daten laden“ löst einen
    Klick auf das Dateifeld aus
  - `merges a loaded file and announces what was added` – Fake gespeichert, Ansage,
    Fokus auf „Daten laden“
  - `announces that a loaded file brought nothing new`
  - `loads a shared text file` – `.txt` mit `text/plain`
  - `rejects an unreadable file and keeps the albums` – Fake unverändert, Meldung
    sichtbar und angesagt
  - `clears the failure after a successful load`
  - `has no accessibility violations` – mit sichtbarer Fehlermeldung
- [x] `src/App.test.tsx` – `shows loaded albums in the album list` – Datei laden, zurück,
  „Alben“: Überschrift „Alben, n“ und neue Zeile sichtbar.
- [x] `e2e/backup.spec.ts` – `brings saved albums back after loading the file`: Album
  anlegen, einmal `[↑]`, Datei herunterladen (`download.path()`),
  `page.evaluate(() => localStorage.clear())`, neu laden, „Noch keine Alben.“, in den
  Einstellungen „Daten speichern und laden“, `page.waitForEvent('filechooser')` beim
  Klick auf „Daten laden“, `fileChooser.setFiles(path)`; Ansage enthält „1 Album neu“;
  unter „Alben“ nennt die Zeile „insgesamt 1 Mal gehört“; nach Neuladen weiterhin.

**Automatisierte Verifikation**:
- [x] `npm run test` grün, darunter `listening.test.ts`, `albumMerge.test.ts`,
  `albumAnnouncements.test.ts`, `albumsFile.test.ts`, `AlbumsBackupPage.test.tsx`,
  `App.test.tsx`
- [x] `npm run lint`, `npm run build`, `npm run test:e2e` grün

**Manuelle Verifikation**:
- [ ] Auf dem Handy mit TalkBack: „Daten laden“ öffnet die Android-Dateiauswahl, die
  zuvor gespeicherte Datei aus „Download“ lässt sich wählen, die Ansage nennt neue und
  ergänzte Alben, der Fokus liegt danach auf „Daten laden“; eine beliebige andere Datei
  (etwa ein Foto) wird mit dem Fehlertext abgelehnt und die Alben bleiben unverändert.
- [ ] Umzug: auf einem zweiten Gerät oder in einem anderen Browser die Datei laden; die
  Alben und Zähler stimmen mit dem ersten Gerät überein.

### Phase 3: Daten teilen

Abhängigkeiten: Phase 1

„Daten teilen“ gibt die Sicherung über das Android-Teilen-Menü weiter, sofern der
Browser die Datei teilen kann.

**Aufgaben**:
- [x] `src/albums/api/albumsFile.test.ts` zuerst ergänzen, dann `albumsShareFile` –
  `album-statistics-<Datum>.txt`, `mimeType` `text/plain`, gleicher Text wie der
  Download.
- [x] `src/shared/files/browserFileExportClient.test.ts` zuerst ergänzen, dann umsetzen
  (eigener `navigator`-Ersatz mit `canShare` und `share`):
  - `can share a file the browser accepts` – `canShare` erhält `{ files: [File] }` mit
    Name und Typ der Datei
  - `cannot share without the share api` – `navigator` ohne `canShare`
  - `reports a shared file`, `reports a dismissed share` (`share` wirft
    `DOMException` mit Name `AbortError`), `reports a failed share` (anderer Fehler)
  ```ts
  function asFile(file: ExportFile): File {
    return new File([file.text], file.name, { type: file.mimeType })
  }
  ```
- [x] `src/shared/files/inMemoryFileExportClient.ts` – Optionen
  `{ shareable = false, shareOutcome = 'shared' }`; `share` merkt sich die Datei,
  `sharedFiles()`.
- [x] `src/albums/domain/albumAnnouncements.test.ts` zuerst ergänzen, dann
  `shareAnnouncement(outcome)` – „Daten geteilt.“, „Teilen abgebrochen.“,
  „Teilen hat nicht geklappt.“ Der Typ der Ergebnisse wird in der Domäne als
  `'shared' | 'dismissed' | 'failed'` benannt (`ShareResult`), weil die Domäne
  `shared/files` nicht importieren darf; `ShareOutcome` ist strukturell gleich.
- [x] `src/albums/ui/AlbumsBackupPage.tsx` – zwischen „Daten speichern“ und „Daten laden“
  der Knopf „Daten teilen“, nur wenn `fileExportClient.canShare(albumsShareFile(albums,
  clock()))`; Klick: `await share`, Ansage per `shareAnnouncement`.
- [x] `src/albums/ui/AlbumsBackupPage.test.tsx` zuerst ergänzen:
  - `offers sharing only when the browser can share the file`
  - `shares the albums as a dated text file and announces it` – Fake hat
    `album-statistics-2026-11-15.txt`
  - `announces a dismissed share` und `announces a failed share`
  - `has no accessibility violations` – mit „Daten teilen“

**Automatisierte Verifikation**:
- [x] `npm run test` grün, darunter `albumsFile.test.ts`,
  `browserFileExportClient.test.ts`, `albumAnnouncements.test.ts`,
  `AlbumsBackupPage.test.tsx`
- [x] `npm run lint`, `npm run build`, `npm run test:e2e` grün

**Manuelle Verifikation**:
- [ ] In Chrome auf Android: „Daten teilen“ ist sichtbar und öffnet das Teilen-Menü;
  „In Drive speichern“ oder Gmail erhält `album-statistics-<Datum>.txt`; TalkBack sagt
  „Daten geteilt.“ an, nach Zurück-Wischen im Menü „Teilen abgebrochen.“; die geteilte
  Datei lässt sich über „Daten laden“ wieder laden.

## Notizen zur Umsetzung

Hier während der Umsetzung Rückmeldungen, Probleme und Entscheidungen festhalten.

- Alle drei Phasen in einem Zug umgesetzt (Wunsch des Nutzers); manuelle Prüfungen
  stehen noch aus.
- `browserFileExportClient.test.ts` läuft im Projekt `unit` (Node). Statt eines
  Klick-Beobachters am echten `document` nutzt er einen kleinen Dokument-Ersatz, der
  geklickte Links samt `href`, `download` und Einhängezustand festhält.
- Ein erfolgreiches Teilen leert die Fehlermeldung ebenfalls; Abbruch und Fehler beim
  Teilen lassen sie stehen.
- `App` setzt nach „App installieren“ die Einstellungen auf die Übersicht ohne
  Fokusziel zurück, damit der Fokus wie bisher auf der Überschrift landet.

## Verweise

- `docs/notes.txt` – Wunsch „Daten speichern/laden button“ in den Einstellungen
- `docs/agents/plans/2026-11-12-alben-verwalten-und-gehoert-zaehlen.md` – Speicherformat,
  Folgestory ALS-004
- `docs/agents/plans/2026-11-12-album-detailseite.md` – Entscheidung 5 (Zeitwert statt
  Text), Fokusziel als Teil der Seite
- `C:/MW/Projekte/privat/Straight-Line-Navigation/src/main.ts:454-465` – Download per
  `Blob` und `<a download>`
- web.dev, Web Share API (zulässige Dateiarten, `canShare`):
  <https://web.dev/articles/web-share>
- Stack Overflow, `application/json` beim Teilen abgelehnt, `text/plain` geht:
  <https://stackoverflow.com/questions/70243790/web-share-api-permission-denied-on-certain-file-type>
- MDN, `Navigator.canShare()`:
  <https://developer.mozilla.org/en-US/docs/Web/API/Navigator/canShare>
- MDN, `Blob.text()` / `File`:
  <https://developer.mozilla.org/en-US/docs/Web/API/Blob/text>
- Playwright, Downloads und Dateiauswahl:
  <https://playwright.dev/docs/downloads>, <https://playwright.dev/docs/input#upload-files>
