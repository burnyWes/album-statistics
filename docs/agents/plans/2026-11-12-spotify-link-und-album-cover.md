---
date: 2026-11-12T13:56:21.217344+00:00
git_commit: 07c6e4ed2f41d887d75cbadefb7073678c60a5f6
branch: main
story: ALS-005
topic: "Spotify-Link, Album-Cover, Lautsprecher-Icon und Umbenennung der Sicherungsseite"
tags: [plan, albums, settings, files, domain, ui]
status: ready
---

# PLAN: ALS-005 — Spotify-Link und Album-Cover

Ein Album bekommt optional einen Spotify-Link, der auf der Detailseite als Button zum
Spotify-Album führt, und optional ein Album-Cover, das in der Liste und auf der
Detailseite erscheint. Außerdem heißt die Sicherungsseite „Daten speichern / laden“,
und der „Gehört“-Button zeigt statt des Pfeils nach oben einen Lautsprecher mit
Schallwellen. Songs bzw. Tracks (`docs/notes.txt`) bleiben ausdrücklich außen vor.
Vorbild für den Link ist `WishLink` der Wunschlisten-App
(`../Wunschliste/src/wishlist/domain/WishLink.ts`,
`../Wunschliste/src/wishlist/infrastructure/ui/WishPage.svelte:179-185`).

## Akzeptanzkriterien

- Der Eintrag in den Einstellungen und die Überschrift `h1` der Sicherungsseite heißen
  „Daten speichern / laden“. Fokus und Rücksprung („Zurück zu den Einstellungen“ fokussiert
  den Eintrag) verhalten sich wie bisher.
- Der „gehört“-Button in jeder Albumzeile und der Button „Gehört“ in der unteren Leiste der
  Detailseite zeigen einen Lautsprecher mit Schallwellen. `ArrowUpIcon` gibt es nicht mehr.
- Das Formular „Album hinzufügen/bearbeiten“ hat nach „Bandname (optional)“ das Feld
  „Spotify-Link (optional)“ (`type="url"`, ohne Autokorrektur/Großschreibung):
  - Leer oder nur Leerzeichen bedeutet „kein Link“.
  - Angenommen werden nur http(s)-Adressen der Hosts `open.spotify.com` und
    `spotify.link`; fehlt das Schema, wird `https://` ergänzt
    (`open.spotify.com/album/x` → `https://open.spotify.com/album/x`).
  - Alles andere (`javascript:…`, `https://example.com`, `spotify:album:…`, `foo`) ergibt
    „Das ist kein Spotify-Link.“: sichtbar unter den Feldern, angesagt, Fokus im
    Link-Feld, nichts wird gespeichert.
  - Beim Bearbeiten ist das Feld mit dem gespeicherten Link vorbelegt.
- Hat ein Album einen Link, steht auf der Detailseite unter den Zahlen (vor „Gehört, …“)
  ein Link im Button-Stil „Auf Spotify öffnen“ mit Externer-Link-Icon,
  `target="_blank" rel="noopener"`. Ohne Link fehlt er.
- Das Formular hat nach dem Spotify-Link das Feld „Album-Cover (optional)“:
  - Ohne Cover: nur der Button „Cover wählen“. Er öffnet die Bildauswahl
    (`accept="image/*"`; auf Android Galerie oder Kamera).
  - Das gewählte Bild wird mittig quadratisch zugeschnitten, auf 256 × 256 Pixel
    verkleinert und als JPEG-Data-URL gehalten. Es erscheint als Vorschau
    (Alternativtext „Album-Cover“), angesagt wird „Cover gewählt.“
  - Mit Cover: Vorschau, „Cover ändern“ und „Cover entfernen“. „Cover wählen“ und
    „Cover ändern“ sind derselbe Button mit wechselnder Aufschrift, der Fokus bleibt
    nach der Wahl also darauf. Entfernen sagt „Cover entfernt.“ an und setzt den Fokus
    auf „Cover wählen“.
  - Solange das Bild verarbeitet wird, ist „Speichern“ gesperrt. Nach einer
    erfolgreichen Wahl verschwindet eine vorher angezeigte Fehlermeldung.
  - Ein unlesbares Bild ergibt „Dieses Bild konnte nicht gelesen werden.“ (sichtbar und
    angesagt); das bisherige Cover bleibt.
  - Transparente Bereiche (PNG) werden weiß, nicht schwarz.
  - Übernommen wird alles erst mit „Speichern“, „Zurück“ verwirft es.
- In der Albenliste steht links im Zeilen-Button ein Vorschaubild von 56 × 56 Pixeln, bei
  Alben ohne Cover ein gleich großer Platzhalter mit Schallplatten-Icon. Beides ist
  dekorativ (`alt=""` bzw. `aria-hidden`); die Ansage der Zeile bleibt unverändert.
- Auf der Detailseite steht das Cover mit 160 × 160 Pixeln zwischen Überschrift und Zahlen
  (Alternativtext „Album-Cover“). Ohne Cover erscheint dort nichts.
- Link und Cover bleiben nach einem Neuladen erhalten.
- Ist der Gerätespeicher voll, wird die Änderung **nicht** übernommen (auch nicht im
  angezeigten Zustand):
  - Formular und „Daten laden“ zeigen und sagen „Der Speicher ist voll. Es wurde nichts
    geändert.“; das Formular bleibt offen, der Fokus bleibt auf „Speichern“ bzw.
    „Daten laden“.
  - Beim „gehört“-Button (Liste und Detailseite) wird es nur angesagt.
- Gerätespeicher und Sicherungsdatei enthalten je Album `spotifyLink` und `cover`
  (`null`, wenn nicht gesetzt). Die Formatversion bleibt 1; Daten und Dateien ohne diese
  Felder bleiben gültig und werden als „kein Link, kein Cover“ gelesen. Ein ungültiger
  Link oder ein Cover, das keine JPEG-/PNG-Data-URL ist, macht eine Datei „nicht lesbar“.
- Beim Laden einer Datei übernimmt ein vorhandenes Album Link bzw. Cover aus der Datei nur,
  wenn es selbst keinen bzw. keines hat; Vorhandenes bleibt. Die Ansage lautet
  - „Daten geladen. 2 Alben neu, 3 Alben ergänzt.“ (Einzahl „1 Album“),
  - „Daten geladen. 2 Alben neu.“ bzw. „Daten geladen. 3 Alben ergänzt.“,
  - „Daten geladen. Es war nichts Neues dabei.“
  „Ergänzt“ zählt jedes vorhandene Album, das Hörzeitpunkte, Link oder Cover dazubekam.

## Wesentliche Entscheidungen und Abwägungen

1. **Nur Spotify-Adressen:** `open.spotify.com` und `spotify.link`, Schema wird ergänzt.
   - Warum: Die Aufschrift „Auf Spotify öffnen“ stimmt dann immer; Fehleingaben fallen auf.
   - Auswirkung: Value Object `spotifyLink.ts` in `albums/domain`, neuer Grund
     `spotifyLinkInvalid` in `InvalidAlbum`. Gespeichert wird die normalisierte `href`.
2. **Link-Button im Inhalt, nicht in der unteren Leiste:** wie in der Wunschliste.
   - Warum: Die Leiste bleibt den Aktionen vorbehalten und wird auf schmalen Handys nicht eng.
   - Auswirkung: `<a className="linkButton">` unter `.albumDetailStats`.
3. **Cover verkleinert im `localStorage`, direkt im Album:** 256 × 256 JPEG, mittig
   quadratisch zugeschnitten (Qualität 0.8, etwa 15–25 KB je Cover, Platz für grob 200 bis
   300 Cover in rund 5 MB).
   - Warum: bleibt synchron, die Sicherungsdatei trägt die Cover ohne Umbau. IndexedDB
     kann später folgen, falls der Platz nicht reicht.
   - Auswirkung: Das Verkleinern braucht Canvas und gehört deshalb hinter den neuen Port
     `CoverImageClient` (`albums/api`) mit Browser-Adapter und In-Memory-Fake. Die Domäne
     kennt nur den Typ `Cover` (Data-URL-String) und `isCover`.
4. **Volle Quota wird sichtbar statt verschluckt:** Heute fängt `store`
   (`localStorageAlbumsClient.ts:20-26`) jeden Schreibfehler still ab. Künftig wirft
   `writeAlbums` bei `QuotaExceededError` den Fehler `AlbumsStorageFull`. `useAlbums`
   schreibt schon heute zuerst und setzt erst danach den Zustand (`useAlbums.ts:34-37`);
   ein Wurf lässt den Zustand also unverändert.
   - Warum: Mit Covern wird die Grenze realistisch, und stiller Datenverlust ist nicht
     akzeptabel.
   - Auswirkung: Formular, „gehört“-Buttons und „Daten laden“ fangen `AlbumsStorageFull`.
     Löschen eines Albums, Löschen und Zurücknehmen eines Hörzeitpunkts verkleinern die
     Daten und können nicht an der Quota scheitern; sie bleiben unverändert. Andere
     Schreibfehler (kein Speicher verfügbar) bleiben wie bisher still.
5. **`null` statt fehlender Felder im Modell:** `NewAlbum` bekommt
   `spotifyLink: SpotifyLink | null` und `cover: Cover | null`.
   - Warum: `changeAlbum` mischt per Spread (`useAlbums.ts:54`); ein fehlendes Feld würde
     beim Entfernen das alte Cover stehen lassen, `null` überschreibt es sicher.
   - Auswirkung: Gelesen wird über einen eigenen Typ `StoredAlbum` mit optionalen
     Feldern, den `albumFromStored` für Speicher und Datei auf `null` normalisiert.
     Testdaten, die `Album`/`NewAlbum` bauen, brauchen die beiden Felder.
6. **Formatversion bleibt 1:** neue Felder sind beim Lesen optional.
   - Warum: keine Migration nötig, alte Sicherungen bleiben ladbar.
   - Auswirkung: Ältere App-Stände lesen neue Dateien weiterhin, ignorieren aber Link
     und Cover.
7. **Laden füllt Lücken, überschreibt nie:** `mergeAlbums` übernimmt Link/Cover nur,
   wo `null` steht.
   - Warum: gleiche Logik wie bei den Hörzeitpunkten.
   - Auswirkung: `AlbumsMerge.addedListenings` entfällt; `extendedAlbums` zählt jedes
     ergänzte Album. Die Ansage wird kürzer („3 Alben ergänzt“).

## Ausgangslage

```
AlbumFormPage ──AlbumDraft──> newAlbum() ──NewAlbum──> useAlbums.addAlbum/changeAlbum
                                                            │
                                                            v
                                localStorageAlbumsClient.writeAlbums()
                                                            │  albumsFileText()
                                                            v  { version: 1, albums }
                                                 localStorage["albums"]

AlbumsBackupPage ── albumsFromFileText() ──LoadedAlbum[]──> mergeAlbums()
```

- `album.ts:5-12`: `AlbumDraft`/`NewAlbum` = `{ title, artist }`, `Album` ergänzt `id`,
  `listenings`.
- `album.ts:35-44`: `newAlbum` prüft Titel und Doppelung.
- `albumsFile.ts:23-32`: `isStoredAlbum` prüft genau die vier Felder; Gerätespeicher
  und Datei teilen sich das Format.
- `albumMerge.ts:53-93`: Zusammenführen nach Titel/Band, nur Hörzeitpunkte;
  `albumMerge.ts:76` springt bei fehlenden neuen Hörzeitpunkten weiter.
- `albumAnnouncements.ts:113-126`: Ansage „… um N Mal Hören ergänzt“.
- `ArrowUpIcon` wird in `AlbumListRow.tsx:64` und `AlbumDetailPage.tsx:88` benutzt.
- „Daten speichern und laden“ steht in `App.tsx:99`, `AlbumsBackupPage.tsx:89`,
  `App.test.tsx:67,286`, `AlbumsBackupPage.test.tsx:85`, `e2e/backup.spec.ts:13`.

## Zielbild

Detailseite mit Cover und Link:

```
┌─────────────────────────────────┐
│ [Zurück zu den Alben]           │
│ # OK Computer, Radiohead        │
│ ┌──────────┐                    │
│ │  Cover   │  160 × 160         │
│ └──────────┘                    │
│ 📅 Diesen Monat 3               │
│ ◎  Insgesamt 14                 │
│ Zuletzt gehört: 10. Nov., 21:04 │
│ [↗ Auf Spotify öffnen]          │
│ ## Gehört, 14 Mal               │
│ ...                             │
├─────────────────────────────────┤
│ [🔊 Gehört]   [✎ Bearbeiten]    │
└─────────────────────────────────┘
```

Albenliste vorher:

```
┌───────────────────────────┐ ┌────┐
│ OK Computer, Radiohead    │ │ ↑  │
│ 📅 3  ◎ 14                │ └────┘
└───────────────────────────┘
```

Albenliste nachher:

```
┌──────────────────────────────────┐ ┌────┐
│ ┌────┐ OK Computer, Radiohead    │ │ 🔊 │
│ │img │ 📅 3  ◎ 14                │ └────┘
│ └────┘                           │
└──────────────────────────────────┘
┌──────────────────────────────────┐ ┌────┐
│ ┌────┐ Kid A, Radiohead          │ │ 🔊 │
│ │ ◎  │ 📅 0  ◎ 2                 │ └────┘
│ └────┘                           │
└──────────────────────────────────┘
```

Formular nachher (Album mit Cover bearbeiten):

```
┌─────────────────────────────────┐
│ [Zurück zum Album]              │
│ # Album bearbeiten              │
│ Albumname                       │
│ [OK Computer                  ] │
│ Bandname (optional)             │
│ [Radiohead                    ] │
│ Spotify-Link (optional)         │
│ [open.spotify.com/album/…     ] │
│ Album-Cover (optional)          │
│ ┌──────┐                        │
│ │ img  │ [🖼 Cover ändern]      │
│ └──────┘ [🗑 Cover entfernen]   │
│ <Fehlermeldung>                 │
├─────────────────────────────────┤
│ [💾 Speichern]   [🗑 Löschen]   │
└─────────────────────────────────┘
```

Ohne Cover steht unter „Album-Cover (optional)“ nur `[🖼 Cover wählen]`.

Neuer Port:

```
AlbumFormPage ──File──> CoverImageClient.coverFromFile() ──Cover──> draft.cover
                              │
              ┌───────────────┴────────────────┐
   browserCoverImageClient            inMemoryCoverImageClient
   (createImageBitmap + Canvas)       (Tests: liefert festes Cover
                                       oder wirft UnreadableCoverImage)
```

## Abstraktionen und Wiederverwendung

- `src/albums/domain`
  - `spotifyLink.ts` (neu) — `SpotifyLink` (Typ), `parseSpotifyLink(raw)` liefert
    `{ valid: true; link: SpotifyLink | null } | { valid: false }`, `isSpotifyLink(value)`
    für das Lesen gespeicherter Daten (gültig, wenn `parseSpotifyLink(value)` genau
    `value` liefert). Schema-Erkennung wie in `WishLink.ts`.
  - `cover.ts` (neu) — `Cover` (Typ), `isCover(value)`:
    `/^data:image\/(jpeg|png);base64,[A-Za-z0-9+/]+={0,2}$/`.
  - `album.ts` — `AlbumDraft` um `spotifyLink: string` und `cover: Cover | null`,
    `NewAlbum` um `spotifyLink: SpotifyLink | null` und `cover: Cover | null`;
    `InvalidAlbumReason` um `spotifyLinkInvalid`; `newAlbum` prüft in der Reihenfolge
    Titel → Link → Doppelung.
  - `albumMerge.ts` — `LoadedAlbum` erbt die neuen Felder über `NewAlbum`;
    `mergeAlbums` füllt Lücken, `addedListenings` entfällt, `trimmedName` (`:49`) nimmt
    Link und Cover mit.
  - `albumAnnouncements.ts` — Meldungen `spotifyLinkInvalid`, `storageFullMessage`,
    `unreadableCoverMessage`, `coverChosenAnnouncement`, `coverRemovedAnnouncement`;
    `albumsLoadedAnnouncement` mit „N Alben ergänzt“.
- `src/albums/api`
  - `albumsClient.ts` — Klasse `AlbumsStorageFull`; `writeAlbums` darf sie werfen.
  - `localStorageAlbumsClient.ts` — `writeAlbums` erkennt Quota-Fehler
    (`DOMException` mit `name` `QuotaExceededError` oder der Konstante
    `FIREFOX_LEGACY_QUOTA_ERROR_NAME = 'NS_ERROR_DOM_QUOTA_REACHED'`) und wirft
    `AlbumsStorageFull`; `keepAside` bleibt still. Die Konstante bekommt den einzigen
    Warum-Kommentar mit dem MDN-Link aus den Verweisen.
  - `inMemoryAlbumsClient.ts` — Option `storageFull()` zum Umschalten, damit Tests den
    vollen Speicher nachstellen können.
  - `albumsFile.ts` — neuer Typ `StoredAlbum` (Felder `spotifyLink`/`cover` optional);
    `isStoredAlbum` wird zu `value is StoredAlbum` und akzeptiert fehlende/`null`/gültige
    Werte; `albumFromStored` normalisiert auf `null` und wird von
    `storedAlbumsFromText` und `albumsFromFileText` benutzt.
  - `coverImageClient.ts` (neu) — `interface CoverImageClient { coverFromFile(file: File):
    Promise<Cover> }`, Klasse `UnreadableCoverImage`.
  - `browserCoverImageClient.ts` (neu) — `createImageBitmap(file,
    { imageOrientation: 'from-image' })`, Canvas 256 × 256 zuerst weiß füllen (JPEG
    kennt keine Transparenz), dann mittigen quadratischen Ausschnitt zeichnen,
    `toDataURL('image/jpeg', 0.8)`; jeder Fehler wird zu `UnreadableCoverImage`.
  - `inMemoryCoverImageClient.ts` (neu) — liefert ein festes Test-Cover oder wirft bei
    Dateien mit dem Namen `unreadable…` `UnreadableCoverImage`.
- `src/albums/ui`
  - `SpeakerIcon.tsx` (neu, ersetzt `ArrowUpIcon.tsx`) — Strichstil wie die übrigen Icons:
    `<path d="M11 5 6 9H2v6h4l5 4V5z" />`, `<path d="M15.54 8.46a5 5 0 0 1 0 7.07" />`,
    `<path d="M19.07 4.93a10 10 0 0 1 0 14.14" />`.
  - `ExternalLinkIcon.tsx`, `ImageIcon.tsx` (neu) — gleicher Strichstil.
  - `AlbumCover.tsx` (neu) — `AlbumCoverThumbnail` (Bild oder Platzhalter, dekorativ) und
    `AlbumDetailCover` (Bild mit Alternativtext).
  - `CoverField.tsx` (neu) — Feld „Album-Cover (optional)“ mit verstecktem Datei-Input
    nach dem Muster von `AlbumsBackupPage.tsx:123-132`; ein Button „Cover wählen“/
    „Cover ändern“ mit Ref, damit der Fokus nach „Entfernen“ per Effekt darauf
    zurückkehrt.
  - `AlbumFormPage.tsx`, `AlbumDetailPage.tsx`, `AlbumListRow.tsx`, `AlbumsArea.tsx`,
    `AlbumsBackupPage.tsx`, `useAlbums.ts` — siehe Phasen.
- `src/App.tsx`, `src/main.tsx` — `coverImageClient` durchreichen.
- `src/index.css` — `.linkButton`, `.albumRowContent`, `.albumRowText`,
  `.albumCoverThumbnail`, `.albumCoverPlaceholder`, `.albumDetailCover`,
  `.coverField`. Farben nur über vorhandene Tokens (`--surface`, `--ink`,
  `--accentLine`), keine grauen Flächen, damit beide Invertierungsachsen stimmen.

## Logging und Beobachtbarkeit

Keine Änderungen. Die App protokolliert nichts; Rückmeldungen laufen über den Announcer.

## Umsetzung

### Phase 1: Umbenennung und Lautsprecher-Icon

Abhängigkeiten: keine

Die Sicherungsseite heißt „Daten speichern / laden“, und der „Gehört“-Button zeigt den
Lautsprecher.

**Aufgaben**:
- [ ] Tests zuerst: `App.test.tsx:67,286`, `AlbumsBackupPage.test.tsx:85` und
  `e2e/backup.spec.ts:13` erwarten „Daten speichern / laden“.
- [ ] `App.tsx:99` und `AlbumsBackupPage.tsx:89` umbenennen.
- [ ] `src/albums/ui/SpeakerIcon.tsx` anlegen (Pfade siehe oben, `className="buttonIcon"`,
  `aria-hidden`, `focusable="false"` wie `ArrowUpIcon`).
- [ ] `AlbumListRow.tsx` und `AlbumDetailPage.tsx` auf `SpeakerIcon` umstellen,
  `ArrowUpIcon.tsx` löschen.

**Automatisierte Verifikation**:
- [ ] `npm run test` grün, darunter die umbenannten Erwartungen.
- [ ] `grep -rn "ArrowUpIcon\|Daten speichern und laden" src e2e` findet nichts.
- [ ] `npm run lint` und `npm run build` laufen durch.
- [ ] `npx playwright test e2e/backup.spec.ts` grün.

**Manuelle Verifikation**:
- [ ] Auf dem Handy zeigen Albumzeile und Detailseite einen gut erkennbaren Lautsprecher
  mit Schallwellen, in beiden Farbschemata.

### Phase 2: Spotify-Link

Abhängigkeiten: Phase 1

Ein Album kann einen Spotify-Link tragen, der gespeichert, gesichert, geladen und auf der
Detailseite als Button angeboten wird.

**Aufgaben**:
- [ ] `spotifyLink.test.ts` zuerst, nach dem Vorbild `WishLink.test.ts`:
  - `''` und `'   '` → kein Link.
  - `' open.spotify.com/album/x '` → `https://open.spotify.com/album/x`.
  - `https://open.spotify.com/album/x?si=abc` bleibt samt Query erhalten.
  - `HTTPS://OPEN.SPOTIFY.COM/album/x` → Host kleingeschrieben.
  - `https://spotify.link/AbC` wird angenommen.
  - Abgelehnt: `javascript:alert(1)`, `spotify:album:x`, `ftp://open.spotify.com/x`,
    `https://example.com`, `https://open.spotify.com.evil.de/x`, `foo`, `https://`.
  - `isSpotifyLink` ist für normalisierte `href` wahr, für nicht normalisierte und
    fremde Adressen falsch.
- [ ] `spotifyLink.ts` umsetzen: Schema-Erkennung wie `WishLink.ts`, dann
  `url.protocol ∈ {http:, https:}` und `url.hostname ∈ {open.spotify.com, spotify.link}`.
- [ ] `album.test.ts` erweitern: `newAlbum` übernimmt den normalisierten Link, liefert
  `null` für leer, wirft `InvalidAlbum('spotifyLinkInvalid')` für ungültig; ein fehlender
  Titel geht einem ungültigen Link vor.
- [ ] `album.ts`: Typen und `newAlbum` erweitern (zunächst nur `spotifyLink`; `cover`
  folgt in Phase 3). Alle Testdaten und `draftOf` (`AlbumFormPage.tsx:23`) anpassen.
- [ ] `albumsFile.test.ts` zuerst: Datei/Speicher ohne `spotifyLink` → `null`; gültiger
  Link wird gelesen; ungültiger Link → `UnreadableAlbumsFile` bzw. Speicher wird
  beiseitegelegt; `albumsFileText` schreibt `spotifyLink`.
- [ ] `albumsFile.ts`: `isStoredAlbum` und Normalisierung umsetzen; `albumsFromFileText`
  reicht `spotifyLink` in `LoadedAlbum` durch.
- [ ] `albumMerge.test.ts` zuerst: neues Album übernimmt den Link; vorhandenes Album ohne
  Link bekommt ihn **ohne neue Hörzeitpunkte** und zählt als ergänzt; vorhandener Link
  bleibt; ein Album, das Hören und Link bekommt, zählt einmal. Die bestehenden
  Erwartungen auf `addedListenings` (`albumMerge.test.ts:76,95,106,118,145,167`)
  entfallen bzw. werden auf `extendedAlbums` umgestellt.
- [ ] `albumMerge.ts` umbauen: das frühe `continue` (`:76`) entfällt; erst Hörzeitpunkte
  ergänzen und Lücken bei Link/Cover füllen, dann vergleichen, ob sich das Album
  geändert hat, und nur dann ersetzen und zählen.
- [ ] `albumAnnouncements.test.ts` zuerst: Meldung „Das ist kein Spotify-Link.“; Ansagen
  „Daten geladen. 2 Alben neu, 3 Alben ergänzt.“, „Daten geladen. 1 Album ergänzt.“,
  „Daten geladen. Es war nichts Neues dabei.“ Den Testhelfer
  (`albumAnnouncements.test.ts:211-242`), der `addedListenings` baut, anpassen.
- [ ] `albumAnnouncements.ts` umsetzen.
- [ ] `AlbumsBackupPage.test.tsx:134` von „… 1 Album um 1 Mal Hören ergänzt.“ auf
  „… 1 Album ergänzt.“ umstellen; `e2e/backup.spec.ts` auf alte Formulierungen prüfen.
- [ ] `AlbumsArea.test.tsx` zuerst:
  - Album mit Link anlegen → Detailseite hat den Link „Auf Spotify öffnen“ mit `href`
    `https://open.spotify.com/album/x`, `target="_blank"` und `rel="noopener"`.
  - Ohne Link gibt es ihn nicht.
  - Ungültiger Link: Meldung sichtbar und angesagt, Fokus im Link-Feld, nichts gespeichert.
  - Bearbeiten zeigt den gespeicherten Link vorbelegt; Leeren entfernt ihn.
- [ ] `AlbumFormPage.tsx`: Feld `albumSpotifyLink` mit Label „Spotify-Link (optional)“,
  `type="url"`, `autoCapitalize="off"`, `autoCorrect="off"`, `autoComplete="off"`,
  `aria-describedby="albumFailure"`. Den Fokus nach einem Fehler über eine benannte
  Zuordnung Grund → Feld setzen (`titleMissing`/`alreadyListed` → Titel,
  `spotifyLinkInvalid` → Link).
- [ ] `ExternalLinkIcon.tsx` anlegen; `AlbumDetailPage.tsx`: nach `.albumDetailStats`
  `<a className="linkButton" href={album.spotifyLink} target="_blank" rel="noopener">`.
- [ ] `index.css`: `.linkButton` mit derselben Optik wie Buttons (Farben, Rahmen, Höhe
  ≥ 44px, Icon-Abstand), sodass er beide Invertierungen mitmacht.
- [ ] `e2e/albums.spec.ts`: Album mit Link anlegen, neu laden, Detailseite hat den Link mit
  der normalisierten Adresse.
- [ ] `e2e/backup.spec.ts`: im Rundlauf-Test einen Link mitgeben und nach dem Laden auf
  der Detailseite prüfen.

**Automatisierte Verifikation**:
- [ ] `npx vitest run src/albums` grün, inklusive der neuen Fälle oben.
- [ ] `npm run test`, `npm run lint`, `npm run build` laufen durch.
- [ ] `npx playwright test` grün.

**Manuelle Verifikation**:
- [ ] Auf dem Android-Handy einen über „Teilen → Link kopieren“ aus der Spotify-App
  kopierten Album-Link einfügen und speichern. „Auf Spotify öffnen“ öffnet das Album in
  der Spotify-App.
- [ ] Der Link-Button sieht in allen vier Farbkombinationen aus wie ein normaler Button.

### Phase 3: Album-Cover

Abhängigkeiten: Phase 2

Ein Album kann ein Cover tragen, das in Liste und Detailseite erscheint, gesichert und
geladen wird. Eine volle Quota wird sichtbar.

**Aufgaben**:
- [ ] `cover.test.ts` zuerst: `isCover` wahr für `data:image/jpeg;base64,…` und
  `data:image/png;base64,…`; falsch für `data:image/svg+xml;…`, `data:text/html;…`,
  `https://…`, `''`, kaputtes Base64 und Nicht-Strings.
- [ ] `cover.ts` umsetzen.
- [ ] `album.ts`: `cover` in `AlbumDraft`/`NewAlbum`, `newAlbum` übernimmt es
  unverändert; Testdaten anpassen.
- [ ] `albumsFile.test.ts` / `albumsFile.ts`: wie beim Link: fehlend → `null`, gültig
  wird gelesen und geschrieben, ungültig → nicht lesbar.
- [ ] `albumMerge.test.ts` / `albumMerge.ts`: Cover füllt Lücke und zählt als ergänzt;
  vorhandenes Cover bleibt.
- [ ] `localStorageAlbumsClient.test.ts` zuerst: Speicher-Fake, dessen `setItem` eine
  `DOMException('…', 'QuotaExceededError')` wirft → `writeAlbums` wirft
  `AlbumsStorageFull`; ein anderer Fehler bleibt still; `null`-Speicher bleibt still.
- [ ] `albumsClient.ts` (`AlbumsStorageFull`) und `localStorageAlbumsClient.ts`
  umsetzen; `inMemoryAlbumsClient.ts` bekommt `storageFull()`.
- [ ] `useAlbums.ts`: Reihenfolge Schreiben → Zustand besteht schon; per Test absichern,
  dass bei geworfenem `AlbumsStorageFull` der Zustand unverändert bleibt und der Fehler
  zum Aufrufer durchläuft.
- [ ] `albumAnnouncements.test.ts` / `.ts`: „Der Speicher ist voll. Es wurde nichts
  geändert.“, „Dieses Bild konnte nicht gelesen werden.“, „Cover gewählt.“,
  „Cover entfernt.“
- [ ] `coverImageClient.ts`, `inMemoryCoverImageClient.ts`,
  `browserCoverImageClient.ts` anlegen; `main.tsx` erzeugt den Browser-Adapter,
  `App.tsx` → `AlbumsArea` → `AlbumFormPage` reichen ihn durch; `App.test.tsx` und
  `AlbumsArea.test.tsx` nutzen den In-Memory-Fake.
- [ ] `AlbumsArea.test.tsx` zuerst:
  - Cover wählen (über `userEvent.upload` auf das Datei-Input; Test-Dateien mit
    `{ type: 'image/png' }`, weil user-event 14 nach `accept` filtert) → Vorschau mit
    Alternativtext „Album-Cover“, Ansage „Cover gewählt.“, Buttons „Cover ändern“ und
    „Cover entfernen“; der Fokus liegt auf „Cover ändern“.
  - Während der Fake das Bild noch nicht geliefert hat, ist „Speichern“ gesperrt.
  - Eine zuvor angezeigte Fehlermeldung verschwindet nach erfolgreicher Coverwahl.
  - Speichern → Detailseite zeigt das Bild „Album-Cover“ mit dem Test-Cover; die
    Listenzeile zeigt das Vorschaubild, und ihr zugänglicher Name ist unverändert.
  - Album ohne Cover → Platzhalter in der Liste, kein Bild auf der Detailseite.
  - Cover entfernen → Ansage „Cover entfernt.“, Fokus auf „Cover wählen“; nach Speichern
    hat das Album kein Cover mehr.
  - Unlesbares Bild → Meldung sichtbar und angesagt, bisheriges Cover bleibt.
  - „Zurück“ nach Coverwahl → Album unverändert.
  - Voller Speicher beim Speichern → Meldung sichtbar und angesagt, Formular bleibt
    offen, Fokus auf „Speichern“, Liste unverändert.
  - Voller Speicher beim „gehört“-Button in Liste und Detailseite → nur Ansage, Zähler
    unverändert, keine Rückgängig-Möglichkeit.
- [ ] `AlbumsBackupPage.test.tsx` zuerst: voller Speicher beim Laden → Meldung sichtbar und
  angesagt, Alben unverändert.
- [ ] `CoverField.tsx`, `ImageIcon.tsx`, `AlbumCover.tsx` umsetzen; `AlbumFormPage.tsx`
  bindet `CoverField` nach dem Link-Feld ein, sperrt „Speichern“, solange das Cover
  verarbeitet wird, und verwirft ein spät eintreffendes Ergebnis nach dem Verlassen der
  Seite. `AlbumsStorageFull` aus `onSave` wird gefangen: Meldung sichtbar und angesagt,
  Fokus bleibt auf „Speichern“ (eigener Zweig neben `albumFailureMessage`, kein Feld-
  Fokus).
- [ ] `AlbumsArea.tsx`: `listenTo`/`listenFromDetails` fangen `AlbumsStorageFull` und
  sagen die Meldung an; `saveAlbum` wechselt die Seite nur nach erfolgreichem Speichern.
- [ ] `AlbumsBackupPage.tsx`: `AlbumsStorageFull` beim Laden wie `UnreadableAlbumsFile`
  behandeln, nur mit eigener Meldung.
- [ ] `AlbumListRow.tsx`: Zeilen-Button bekommt `.albumRowContent` mit
  `AlbumCoverThumbnail` links und `.albumRowText` (Name, Zahlen) rechts.
- [ ] `AlbumDetailPage.tsx`: `AlbumDetailCover` zwischen `h1` und `.albumDetailStats`.
- [ ] `index.css`: Vorschaubild 56 × 56 und Detailbild 160 × 160 mit `object-fit: cover`
  und Rahmen in `--accentLine`; Platzhalter mit `--surface`-Hintergrund und dem
  `RecordIcon` in `--ink`; `.coverField` mit Vorschau (96 × 96) und untereinander
  stehenden Buttons.
- [ ] `e2e/albums.spec.ts`: Cover über `setInputFiles('public/icon-192.png')` wählen,
  speichern, neu laden. Liste und Detailseite zeigen ein Bild, dessen `src` mit
  `data:image/jpeg;base64,` beginnt und dessen `naturalWidth` 256 ist. Das Bild hat
  transparente Ecken; per Canvas im Browser prüfen, dass das Eckpixel weiß ist.
- [ ] `e2e/backup.spec.ts`: Rundlauf mit Cover; nach dem Laden hat die Detailseite das
  Cover.

**Automatisierte Verifikation**:
- [ ] `npx vitest run src/albums` grün, inklusive der neuen Fälle oben.
- [ ] `npm run test`, `npm run lint`, `npm run build` laufen durch.
- [ ] `npx playwright test` grün, inklusive des Browser-Adapters über das E2E-Cover.

**Manuelle Verifikation**:
- [ ] Auf dem Android-Handy per „Cover wählen“ einmal ein Foto mit der Kamera aufnehmen und
  einmal ein Bild aus der Galerie wählen. Das Bild ist richtig herum gedreht, mittig
  quadratisch und in Liste und Detailseite scharf genug.
- [ ] Ein Hochkant-Foto wird mittig zugeschnitten, nicht verzerrt.
- [ ] Mit TalkBack: Die Listenzeile wird wie bisher angesagt, das Bild nicht zusätzlich.
  Auf der Detailseite wird „Album-Cover“ angesagt, im Formular „Cover gewählt.“ bzw.
  „Cover entfernt.“
- [ ] Platzhalter und Bildrahmen stimmen in allen vier Farbkombinationen.
- [ ] Eine Sicherung mit Covern auf dem Handy teilen und auf einem frischen Stand laden.
  Die Cover sind wieder da.

## Notizen zur Umsetzung

- Vor dem E2E-Test zur Transparenz prüfen, ob `public/icon-192.png` wirklich
  transparente Ecken hat; sonst ein kleines transparentes PNG als Testdatei unter
  `e2e/fixtures/` ablegen.

## Verweise

- `docs/agents/plans/2026-11-12-daten-speichern-und-laden.md` (ALS-004: Dateiformat,
  Zusammenführen, Ansagen)
- `../Wunschliste/src/wishlist/domain/WishLink.ts` und `WishLink.test.ts`
- `../Wunschliste/src/wishlist/infrastructure/ui/WishPage.svelte:179-185` (Link-Button)
- `../Wunschliste/src/wishlist/infrastructure/ui/WishForm.svelte:158-168` (Link-Feld)
- MDN `createImageBitmap` (`imageOrientation`):
  https://developer.mozilla.org/en-US/docs/Web/API/Window/createImageBitmap
- MDN `QuotaExceededError`:
  https://developer.mozilla.org/en-US/docs/Web/API/DOMException#quotaexceedederror
