---
date: 2026-11-12T12:52:05+00:00
git_commit: b6e0f27fa2aa2dda1d7a5c77acaa1f1b77472c56
branch: main
story: ALS-003
topic: "Album-Detailseite mit Hörverlauf und Löschen einzelner Hörzeitpunkte"
tags: [plan, albums, domain, ui]
status: done
---

# PLAN: ALS-003 — Album-Detailseite

Ein Tipp auf ein Album öffnet künftig eine Detailseite. Sie zeigt beide Zähler, das
letzte Hören und alle Hörzeitpunkte, erfasst ein weiteres Hören und führt zu
„Album bearbeiten“. Einzelne Hörzeitpunkte lassen sich nach Bestätigung löschen, sodass
auch später bemerkte Fehltipps korrigierbar sind. Grundlage: `docs/notes.txt` („Album
selbst klickbar, um auf Detailseite zu kommen“) und die Folgestory-Notiz in
`docs/agents/plans/2026-11-12-alben-verwalten-und-gehoert-zaehlen.md:19`.

Mit `<Album>` ist „Albumname, Bandname“ gemeint, ohne Band nur „Albumname“.
`<kurz>` steht für einen Zeitpunkt wie „Do., 12.11.2026, 14:20“, `<lang>` für
„Donnerstag, 12.11.2026, 14:20“.

## Akzeptanzkriterien

- Ein Tipp auf eine Albumzeile öffnet die Detailseite statt „Album bearbeiten“; der
  Fokus liegt auf der Überschrift `h1` `<Album>`.
- Die Detailseite zeigt „Zurück zu den Alben“, `[Kalender] Diesen Monat <n>`,
  `[Platte] Insgesamt <n>` und „Zuletzt gehört: `<kurz>`“ (fehlt ohne Hören), dann die
  Überschrift `h2` „Gehört, <n> Mal“ (ohne Hören „Gehört“ mit „Noch nicht gehört.“ darunter)
  und alle Hörzeitpunkte, neuestes zuerst. Unten in der festen Leiste stehen
  `[↑] Gehört` und `[Stift] Bearbeiten`.
- Zeitpunkte erscheinen in der Ortszeit des Geräts als `<kurz>` und werden als `<lang>`
  vorgelesen — in Listeneinträgen, „Zuletzt gehört“, Knöpfen und Ansagen. Überschriften
  zeigen auch sichtbar `<lang>`.
- „Gehört“ auf der Detailseite speichert den aktuellen Zeitpunkt, sagt
  „<Album> gehört. Diesen Monat <n>, insgesamt <n>.“ an, der Fokus bleibt auf dem Knopf,
  das neue Hören steht oben in der Liste. Es gibt dort kein Rückgängig.
- Jeder Hörzeitpunkt hat einen Eimer-Knopf „Hören vom `<lang>` löschen“. Er öffnet die
  Seite „Hören vom `<lang>` löschen?“ mit `<Album>` darunter und unten
  `[Löschen] [Abbrechen]`. „Abbrechen“ und „Zurück zum Album“ führen zur Detailseite.
- „Löschen“ entfernt genau diesen einen Eintrag (bei gleichen Zeitstempeln nur einen),
  führt zur Detailseite, sagt „Hören vom `<lang>` gelöscht. Diesen Monat <n>,
  insgesamt <n>.“ an, der Fokus liegt auf „Gehört, <n> Mal“ bzw. „Gehört“.
- „Bearbeiten“ öffnet „Album bearbeiten“. Dort heißt der obere Knopf „Zurück zum Album“
  und führt ohne Speichern zur Detailseite; „Speichern“ führt zur Detailseite, sagt
  „<Album> gespeichert.“ an, der Fokus liegt auf der Überschrift mit dem neuen Namen.
- „Album hinzufügen“ bleibt unverändert („Zurück zu den Alben“, nach dem Speichern zur
  Liste mit Fokus auf der Überschrift).
- Die Löschseite des Albums bleibt unverändert: „Abbrechen“ und „Zurück zum Album“
  führen zum Formular, Bestätigen zur Liste mit Fokus auf der Überschrift.
- „Zurück zu den Alben“ auf der Detailseite zeigt die Liste mit dem Fokus auf dem
  Zeilenknopf dieses Albums.
- Das Rückgängig-Angebot der Liste verschwindet weiterhin bei jedem Seitenwechsel.
- Das gespeicherte Format bleibt unverändert (`version: 1`).

## Wesentliche Entscheidungen und Abwägungen

1. **Detailseite mit Hörverlauf** statt Monatsstatistik.
   - Warum: Macht die gespeicherten Zeitstempel sichtbar, ohne Datenänderung.
   - Auswirkung: Nur neue reine Funktionen in `albums/domain`; eine Monatsstatistik kann
     später als eigene Story dazukommen.
2. **Einzelnes Hören löschen mit Bestätigungsseite** nach dem Vorbild
   `DeleteAlbumPage.tsx`.
   - Warum: Korrektur alter Fehltipps, ohne versehentliches Löschen.
   - Auswirkung: Neue Seite `{ kind: 'deleteListening'; id; listening }`;
     `withoutListening` (`listening.ts:11`) entfernt schon genau einen Eintrag.
3. **Kein Rückgängig auf der Detailseite.**
   - Warum: Die Leiste bleibt bei zwei Knöpfen; Korrektur über den Eimer.
   - Auswirkung: `AlbumsArea` hat für die Detailseite einen eigenen Hör-Handler, der
     `lastListening` nicht setzt.
4. **Zwei Zeitformate** in `albums/domain/listeningTime.ts` über
   `Intl.DateTimeFormat('de', …)`: kurz mit `weekday: 'short'`, lang mit
   `weekday: 'long'`, sonst `day/month: '2-digit'`, `year: 'numeric'`,
   `hour/minute: '2-digit'`. In Node 24 geprüft: „Do., 12.11.2026, 14:20“ bzw.
   „Donnerstag, 12.11.2026, 14:20“.
   - Warum: Kompakte Anzeige, eindeutige Aussprache. `Intl` ist kein Framework und
     steht schon in `album.ts:26`.
   - Auswirkung: UI-Baustein `ListeningTime` zeigt die kurze Form `aria-hidden` und die
     lange in `.visuallyHidden`.
5. **Sortierung nach Zeitwert** (`Date.parse`), nicht nach Text.
   - Warum: Robust gegenüber anders geschriebenen Zeitstempeln, etwa aus einer Datei von
     ALS-004.
6. **Fokusziel als Teil der Seite:** `{ kind: 'list'; focusedAlbum: AlbumId | null }` und
   `{ kind: 'detail'; id; focus: 'album' | 'listenings' }`.
   - Warum: Jede Seite hängt neu ein; das Ziel steht beim Seitenwechsel fest.
   - Auswirkung: `AlbumListPage` fokussiert die Überschrift nur noch, wenn
     `focusedAlbum` `null` ist. Grund: React führt Effekte der Kinder vor denen der
     Eltern aus — ein unbedingtes `useHeadingFocus()` in der Seite würde den
     Zeilenfokus sofort überschreiben.
7. **Detailseite ohne Navigationsleiste**, wie Formular und Löschseite.
   - Warum: Einheitlich für Unterseiten; „Zurück zu den Alben“ führt zurück.
8. **Icons:** `EditIcon` aus `Mahlzeitenplaner/src/meals/ui/EditIcon.tsx` nach
   `src/albums/ui/` übernehmen; `ArrowUpIcon` für „Gehört“, `TrashIcon` für den Eimer
   wiederverwenden.

## Ausgangslage

```
AlbumsArea (src/albums/ui/AlbumsArea.tsx:21-24)
  page list   → AlbumListPage (useHeadingFocus, AlbumListPage.tsx:33)
                  AlbumListRow [Name / Kalender n  Platte n] [↑]
                     │ Tipp auf die Zeile (AlbumsArea.tsx:152 → editAlbum)
                     ▼
  page form   → AlbumFormPage "Album bearbeiten", oben "Zurück zu den Alben"
                  Speichern → list (AlbumsArea.tsx:72-80)
                     │ Löschen
                     ▼
  page delete → DeleteAlbumPage   Abbrechen / "Zurück zum Album" → form
```

- `Album = { id, title, artist, listenings: readonly Listening[] }` (`album.ts:9-12`),
  `Listening` ist ein ISO-Zeitstempel.
- `listening.ts` kennt `listeningAt`, `withListening`, `withoutListening`,
  `listeningsThisMonth`, `listeningsInTotal`.
- Rückgängig: `lastListening` in `AlbumsArea`, verworfen in `showPage`
  (`AlbumsArea.tsx:58-62`).

## Zielbild

```
list ──Tipp──▶ detail ──Bearbeiten──▶ form(edit) ──Löschen──▶ delete ──Löschen──▶ list
  ▲              │ ▲ ▲                   │                     │ Abbrechen/Zurück
  │              │ │ └─Zurück/Speichern──┘                     ▼
  └─Zurück───────┘ │                                          form(edit)
  (Fokus: Zeile)   │
                   └──Abbrechen/Zurück/Löschen── deleteListening ◀──Eimer── detail
```

```
AlbumsArea
  ├─ list            → AlbumListPage      (+ focusedAlbum)
  ├─ detail          → AlbumDetailPage    (neu; focus: album | listenings)
  │                       ListeningTime   (neu)
  ├─ form            → AlbumFormPage      (Zurück-Text je nach Modus)
  ├─ delete          → DeleteAlbumPage    (unverändert)
  └─ deleteListening → DeleteListeningPage (neu, Phase 2)
```

### Albumzeile in der Liste (unverändert, öffnet jetzt die Detailseite)

```
| Kind of Blue, Miles Davis      [ ↑ ] |
| [Kalender] 3   [Platte] 14           |
```

### Detailseite (Phase 1, ohne Eimer)

```
+--------------------------------------+
| [Zurück zu den Alben]                |
| Kind of Blue, Miles Davis            |   <- h1, Fokus beim Öffnen
|                                      |
| [Kalender] Diesen Monat 3            |
| [Platte]   Insgesamt 14              |
| Zuletzt gehört: Do., 12.11.2026,     |
| 14:20                                |
|                                      |
| Gehört, 14 Mal                       |   <- h2
| Do., 12.11.2026, 14:20               |
| So., 02.11.2026, 21:30               |
| Mi., 28.10.2026, 19:12               |
| ...                                  |
+--------------------------------------+
| [ ↑ Gehört ]     [ Stift Bearbeiten ]|   <- feste Leiste
+--------------------------------------+
```

### Detailseite ohne Hören

```
+--------------------------------------+
| [Zurück zu den Alben]                |
| Greatest Hits                        |
|                                      |
| [Kalender] Diesen Monat 0            |
| [Platte]   Insgesamt 0               |
|                                      |
| Gehört                               |
| Noch nicht gehört.                   |
+--------------------------------------+
| [ ↑ Gehört ]     [ Stift Bearbeiten ]|
+--------------------------------------+
```

### Detailseite mit Eimern (Phase 2)

```
| Gehört, 14 Mal                       |
| Do., 12.11.2026, 14:20     [Eimer]   |
| So., 02.11.2026, 21:30     [Eimer]   |
```

### Hören löschen (Phase 2)

```
+--------------------------------------+
| [Zurück zum Album]                   |
| Hören vom Donnerstag, 12.11.2026,    |   <- h1, Fokus
| 14:20 löschen?                       |
| Kind of Blue, Miles Davis            |
+--------------------------------------+
| [   Löschen   ] [   Abbrechen   ]    |
+--------------------------------------+
```

### Album bearbeiten — vorher

```
| [Zurück zu den Alben]                |
| Album bearbeiten                     |
```

### Album bearbeiten — nachher

```
| [Zurück zum Album]                   |
| Album bearbeiten                     |
```

## Abstraktionen und Wiederverwendung

- `src/albums/domain/`
  - `listening.ts` (+ Test)
    - `listeningsNewestFirst(album): Listening[]` – absteigend nach `Date.parse`, neue
      Liste
    - `lastListening(album): Listening | null`
  - `listeningTime.ts` (+ Test) – neu
    - `shortListeningTime(listening): string` – „Do., 12.11.2026, 14:20“
    - `spokenListeningTime(listening): string` – „Donnerstag, 12.11.2026, 14:20“
  - `albumAnnouncements.ts` (+ Test)
    - `listeningsHeading(album)` – „Gehört“ / „Gehört, 1 Mal“ / „Gehört, 14 Mal“
    - `deleteListeningLabel(listening)` – „Hören vom `<lang>` löschen“ (Phase 2)
    - `deleteListeningQuestion(listening)` – „Hören vom `<lang>` löschen?“ (Phase 2)
    - `listeningDeletedAnnouncement(album, listening, now)` – `album` ist der Stand
      nach dem Löschen (Phase 2)
    - vorhandene `listenedAnnouncement`, `albumSavedAnnouncement`, `bothCounts`
      wiederverwenden
- `src/albums/ui/`
  - `AlbumDetailPage.tsx` – neu
  - `ListeningTime.tsx` – neu, `<kurz>` sichtbar, `<lang>` vorgelesen
  - `DeleteListeningPage.tsx` – neu (Phase 2)
  - `EditIcon.tsx` – übernommen
  - `AlbumsArea.tsx`, `AlbumListPage.tsx`, `AlbumListRow.tsx`, `AlbumFormPage.tsx` –
    angepasst
  - `useAlbums.ts` – unverändert; `listenTo` und `takeBackListening` decken beide
    Phasen ab
- `src/index.css` – `.albumDetailStats`, `.listeningList`
- `e2e/albums.spec.ts` – angepasst und ergänzt

## Logging und Beobachtbarkeit

Keine Logs. Neue Ansagen im Ansagebereich (`role="status"`):

```
Kind of Blue, Miles Davis gehört. Diesen Monat 4, insgesamt 15.
Kind of Blue, Miles Davis gespeichert.
Hören vom Donnerstag, 12.11.2026, 14:20 gelöscht. Diesen Monat 3, insgesamt 14.
```

## Umsetzung

### Phase 1: Detailseite mit Hörverlauf und Navigation

Abhängigkeiten: keine

Ein Tipp auf ein Album öffnet die Detailseite mit Zählern und Hörverlauf; von dort wird
gehört und bearbeitet, und der Rückweg landet auf der Zeile des Albums.

**Aufgaben**:
- [x] `src/albums/domain/listening.test.ts` zuerst ergänzen, dann `listening.ts`
  (Zeiten per `listeningAt(new Date(2026, 10, …))`, Ortszeit):
  - `lists listenings newest first` – Eingabe ungeordnet
  - `orders listenings by time, not by text` – `'2026-11-12T19:00:00+01:00'`
    (= 18:00 UTC) steht hinter `'2026-11-12T18:30:00.000Z'`, obwohl der Text größer ist
  - `keeps the album listenings untouched when sorting`
  - `finds the last listening` / `has no last listening without listenings`
- [x] `src/albums/domain/listeningTime.test.ts` (zuerst), dann `listeningTime.ts`:
  - `formats a listening short with weekday in local time` –
    `listeningAt(new Date(2026, 10, 12, 14, 20))` → „Do., 12.11.2026, 14:20“
  - `pads day, month, hour and minute` – 4. Januar 2026, 09:05 → „So., 04.01.2026, 09:05“
  - `formats a listening for reading aloud with the full weekday` →
    „Donnerstag, 12.11.2026, 14:20“
  ```ts
  const timeParts = {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  } as const
  const shortFormat = new Intl.DateTimeFormat('de', { ...timeParts, weekday: 'short' })
  const spokenFormat = new Intl.DateTimeFormat('de', { ...timeParts, weekday: 'long' })
  ```
- [x] `src/albums/domain/albumAnnouncements.test.ts` zuerst ergänzen, dann
  `listeningsHeading(album)` (0 / 1 / n).
- [x] `src/albums/ui/ListeningTime.tsx` – `<span aria-hidden="true">{short}</span>` und
  `<span className="visuallyHidden">{spoken}</span>`.
- [x] `src/albums/ui/EditIcon.tsx` – aus dem Mahlzeitenplaner übernehmen.
- [x] `src/albums/ui/AlbumDetailPage.tsx` – Props `album`, `now`,
  `focus: 'album' | 'listenings'`, `onBack`, `onListen`, `onEdit`. Aufbau laut
  *Zielbild*: Knopf „Zurück zu den Alben“, `h1` (`tabIndex={-1}`) mit `albumName`,
  `<div className="albumDetailStats">` mit zwei Absätzen
  (`CalendarIcon` „Diesen Monat n“, `RecordIcon` „Insgesamt n“), „Zuletzt gehört: “ mit
  `ListeningTime` nur bei `lastListening(album) !== null`, `h2` (`tabIndex={-1}`) mit
  `listeningsHeading`, dann „Noch nicht gehört.“ oder
  `<ul className="itemList listeningList">` mit einem `li` je Eintrag aus
  `listeningsNewestFirst` (Schlüssel `${position}-${listening}`, weil gleiche
  Zeitstempel möglich sind). `BottomBar` mit
  `<button type="button"><ArrowUpIcon />Gehört</button>` und
  `<button type="button"><EditIcon />Bearbeiten</button>`. Ein Effekt beim Einhängen
  fokussiert je nach `focus` die `h1` oder die `h2`.
- [x] `src/albums/ui/AlbumListPage.tsx` – Prop `focusedAlbum: AlbumId | null`;
  `useHeadingFocus` ersetzen durch einen Effekt beim Einhängen, der die Überschrift nur
  bei `focusedAlbum === null` fokussiert (Grund: Entscheidung 6); an `AlbumListRow`
  `focusOnMount={album.id === focusedAlbum}` durchreichen.
- [x] `src/albums/ui/AlbumListRow.tsx` – Prop `focusOnMount: boolean`; Ref am
  `rowButton`, Effekt beim Einhängen fokussiert ihn, wenn `focusOnMount`.
- [x] `src/albums/ui/AlbumFormPage.tsx` – Text des Zurück-Knopfs: „Zurück zu den Alben“
  ohne `editedAlbum`, sonst „Zurück zum Album“.
- [x] `src/albums/ui/AlbumsArea.tsx`:
  ```ts
  type AlbumsPage =
    | { kind: 'list'; focusedAlbum: AlbumId | null }
    | { kind: 'detail'; id: AlbumId; focus: 'album' | 'listenings' }
    | { kind: 'form'; id: AlbumId | null }
    | { kind: 'delete'; id: AlbumId }
  ```
  - `showList()` setzt `focusedAlbum: null`; `onOpenAlbum` zeigt
    `{ kind: 'detail', id, focus: 'album' }`.
  - Detailseite: `onBack` → `{ kind: 'list', focusedAlbum: id }`; `onEdit` → Formular;
    `onListen` ruft `albums.listenTo(id)` und sagt `listenedAnnouncement` an, ohne
    `lastListening` zu setzen.
  - Formular im Bearbeiten: `onBack` und Speichern führen zu
    `{ kind: 'detail', id, focus: 'album' }`; Speichern sagt wie bisher
    `albumSavedAnnouncement` an. Hinzufügen bleibt bei der Liste.
  - `addressedAlbum` für alle Seiten mit `id` ermitteln; fehlt das Album, wird die Liste
    gezeigt (wie heute).
- [x] `src/index.css` – `.albumDetailStats p` (Flex, `align-items: center`,
  `gap: 0.5rem`, `margin: 0.25rem 0`) und `.albumDetailStats .buttonIcon` (1.25rem wie
  `.albumStats .buttonIcon`); `.listeningList li` mit `min-height: 44px`,
  `align-items: center`.
- [x] `src/albums/ui/AlbumsArea.test.tsx` zuerst anpassen:
  - Hilfsfunktion `editAlbum(name)` = `openAlbum(name)` + Klick auf „Bearbeiten“; alle
    Tests, die heute über `openAlbum` ins Formular gehen (Zeilen 234–357), nutzen sie.
  - `renames an album and keeps its listenings` – erwartet jetzt die fokussierte
    Überschrift „Kind of Blue (Legacy Edition), Miles Davis“ statt der Liste.
  - Neu:
    - `opens the album details with the focus on its name`
    - `shows both counts and the last listening` – mit `listenings` aus Oktober und
      November, `ListeningTime` liefert sichtbaren und vorgelesenen Text
    - `lists all listenings newest first`
    - `shows that an album was not listened to yet` – „Gehört“, „Noch nicht gehört.“,
      kein „Zuletzt gehört“
    - `counts a listening from the details` – Ansage, Fokus bleibt auf „Gehört“, neuer
      Eintrag oben, Überschrift „Gehört, 1 Mal“, kein Rückgängig-Knopf
    - `goes back to the list with the focus on the album`
    - `goes back from editing to the details without saving`
    - `saves an edited album back to the details`
    - `keeps the way back to the albums while adding` – Hinzufügen zeigt weiterhin
      „Zurück zu den Alben“
    - `has no accessibility violations on the details` – mit und ohne Hören
- [x] `src/App.test.tsx` – unverändert grün (Rückgängig beim Bereichswechsel).
- [x] `e2e/albums.spec.ts`:
  - `renames and deletes an album for good` – nach `albumButton(…).click()` auf
    „Bearbeiten“ klicken; nach dem Speichern steht die Detailseite, dort erneut
    „Bearbeiten“, dann „Löschen“.
  - Neu `shows listenings on the album details after a reload` – Album anlegen, in der
    Liste einmal `[↑]`, neu laden, Album öffnen, Überschrift „Gehört, 1 Mal“ sichtbar.

**Automatisierte Verifikation**:
- [x] `npm run test` grün, darunter `listening.test.ts`, `listeningTime.test.ts`,
  `albumAnnouncements.test.ts`, `AlbumsArea.test.tsx`, `App.test.tsx`,
  `domainLayerBoundary.test.ts`, `colorContrast.test.ts`
- [x] `npm run lint` grün
- [x] `npm run build` grün
- [x] `npm run test:e2e` grün, darunter `albums.spec.ts`

**Manuelle Verifikation**:
- [x] Auf dem Handy mit TalkBack: Tipp auf ein Album öffnet die Detailseite und sagt
  den Albumnamen an; die Zeitpunkte werden mit ausgeschriebenem Wochentag vorgelesen;
  „Gehört“ sagt beide Zähler an und der Fokus bleibt; „Bearbeiten“ → „Zurück zum Album“
  und „Speichern“ landen auf der Detailseite; „Zurück zu den Alben“ landet auf der
  Zeile des Albums.
- [x] In beiden Farbschemata: Icons und Zeitpunkte gut lesbar, die feste Leiste verdeckt
  beim Scrollen keinen letzten Eintrag.

### Phase 2: Einzelnes Hören löschen

Abhängigkeiten: Phase 1

Jeder Hörzeitpunkt lässt sich über einen Eimer nach Bestätigung löschen.

**Aufgaben**:
- [x] `src/albums/domain/albumAnnouncements.test.ts` zuerst ergänzen, dann umsetzen:
  `deleteListeningLabel`, `deleteListeningQuestion`,
  `listeningDeletedAnnouncement(album, listening, now)` – Texte laut
  *Akzeptanzkriterien*, Zähler über `bothCounts`.
- [x] `src/albums/ui/AlbumDetailPage.tsx` – Prop `onDeleteListening(listening)`; jede
  Listenzeile bekommt die Klasse `listRow` und rechts
  `<button type="button" className="iconButton" aria-label={deleteListeningLabel(…)}>`
  mit `TrashIcon`.
- [x] `src/albums/ui/DeleteListeningPage.tsx` – nach `DeleteAlbumPage.tsx`: „Zurück zum
  Album“, `h1` per `useHeadingFocus` mit `deleteListeningQuestion`, `<p>` mit
  `albumName`, `BottomBar` mit „Löschen“ und „Abbrechen“. Props `album`, `listening`,
  `onDelete`, `onCancel`.
- [x] `src/albums/ui/AlbumsArea.tsx` – Seite
  `{ kind: 'deleteListening'; id: AlbumId; listening: Listening }`. Eimer zeigt sie;
  „Abbrechen“ und „Zurück zum Album“ → `{ kind: 'detail', id, focus: 'album' }`;
  „Löschen“ ruft `albums.takeBackListening(id, listening)`, zeigt
  `{ kind: 'detail', id, focus: 'listenings' }` und sagt
  `listeningDeletedAnnouncement(withoutListening(album, listening), listening, clock())`
  an.
- [x] `src/albums/ui/AlbumsArea.test.tsx` zuerst ergänzen:
  - `asks before deleting a listening` – Überschrift „Hören vom Donnerstag, … löschen?“
    fokussiert, Albumname sichtbar
  - `deletes a listening and announces both counts` – Fake gespeichert, Fokus auf
    „Gehört, n Mal“
  - `deletes only one of equal listenings` – mit `listenedKindOfBlue` (14 gleiche
    Zeitstempel) → „Gehört, 13 Mal“
  - `focuses the plain listenings heading after deleting the last listening` –
    Überschrift „Gehört“ fokussiert, „Noch nicht gehört.“
  - `cancels deleting a listening back to the details` und
    `goes back from deleting a listening to the details`
  - `has no accessibility violations while asking before deleting a listening` und auf
    der Detailseite mit Eimern
- [x] `e2e/albums.spec.ts` – neu `deletes a single listening for good`: Album anlegen,
  in der Liste zweimal `[↑]`, Album öffnen, ersten Eimer, „Löschen“, neu laden, Zeile
  nennt „insgesamt 1 Mal gehört“.

**Automatisierte Verifikation**:
- [x] `npm run test` grün, darunter die neuen Fälle in `albumAnnouncements.test.ts` und
  `AlbumsArea.test.tsx`
- [x] `npm run lint`, `npm run build`, `npm run test:e2e` grün

**Manuelle Verifikation**:
- [x] Auf dem Handy mit TalkBack: der Eimer wird als „Hören vom Donnerstag, … löschen“
  angesagt; die Rückfrage nennt Zeitpunkt und Album; nach dem Löschen kommen beide
  Zähler in der Ansage und der Fokus liegt auf „Gehört, n Mal“; „Abbrechen“ führt zur
  Detailseite zurück.

## Notizen zur Umsetzung

Hier während der Umsetzung Rückmeldungen, Probleme und Entscheidungen festhalten.

- Phase 1: Der 2.11.2026 ist ein Montag. Der Entwurf im *Zielbild* zeigt dort „So.“; der
  Test `lists all listenings newest first` erwartet richtig „Mo., 02.11.2026, 21:30“.
- Phase 1: `.albumDetailStats p` bekommt zusätzlich `flex-wrap: wrap`, damit
  „Zuletzt gehört: <kurz>“ auf schmalen Geräten umbrechen kann.
- Nachtrag nach der Abnahme (Wunsch des Nutzers): Die Hörzeitpunkte stehen unter
  `h3`-Überschriften je Monat („November 2026“), nur für Monate mit Hören. Domäne:
  `listeningMonthsNewestFirst` (`listening.ts`) und `listeningMonthName`
  (`listeningTime.ts`); UI: `ListeningMonthSection.tsx`, je Monat eine eigene Liste mit
  `aria-labelledby` auf die Monatsüberschrift.

## Verweise

- `docs/notes.txt` – „Album selbst klickbar, um auf Detailseite zu kommen“
- `docs/agents/plans/2026-11-12-alben-verwalten-und-gehoert-zaehlen.md` – ALS-002,
  Folgestory ALS-003
- `src/albums/ui/DeleteAlbumPage.tsx` – Vorlage für die Löschseite
- `C:/MW/Projekte/privat/Mahlzeitenplaner/src/meals/ui/EditIcon.tsx`
- MDN, `Intl.DateTimeFormat`:
  <https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/DateTimeFormat>
- React, Reihenfolge der Effekte (Kinder vor Eltern):
  <https://react.dev/reference/react/useEffect>
