---
date: 2026-11-12T15:00:58.215056+00:00
git_commit: f0ae19d876b0e4136382bd5b7778a5bed3d27b70
branch: main
story: ALS-006
topic: "Albenliste per Button sortieren: A–Z, Monat, Gesamt"
tags: [plan, albums, domain, ui, storage]
status: done
---

# PLAN: ALS-006 — Albenliste sortieren

Über der Albenliste stehen drei Umschalt-Buttons. Mit ihnen wird die Liste alphabetisch,
nach Hören im laufenden Monat oder nach Hören insgesamt sortiert. Die Wahl bleibt auf dem
Gerät gespeichert.

## Akzeptanzkriterien

- Über der Albenliste, unter der Kopfzeile mit Überschrift und [+], steht eine Gruppe
  `role="group"` mit dem Namen „Sortierung“. Sie enthält drei Buttons, jeweils mit Icon
  und kurzem Text:
  - **A–Z**, mit dem neuen `AlphabeticalIcon`, Vorlesetext „Alphabetisch“
  - **Monat**, mit `CalendarIcon`, Vorlesetext „Diesen Monat am meisten gehört“
  - **Gesamt**, mit `RecordIcon`, Vorlesetext „Insgesamt am meisten gehört“
- Der gewählte Button hat `aria-pressed="true"` und ist rot gefüllt, so wie der aktive
  Navigations-Button. Die anderen beiden haben `aria-pressed="false"`, hellen
  Hintergrund und roten Rand.
- **A–Z** sortiert wie bisher (`byTitle`: Titel, dann Band, deutscher Collator).
- **Monat** sortiert absteigend nach `listeningsThisMonth` (laufender Kalendermonat),
  bei Gleichstand A–Z.
- **Gesamt** sortiert absteigend nach `listeningsInTotal`, bei Gleichstand A–Z.
- Ein Druck auf einen Sortier-Button lässt den Announcer melden:
  „Sortiert: \<Vorlesetext\>. Zuerst: \<albumName des ersten Albums\>.“
  Beispiel: „Sortiert: Insgesamt am meisten gehört. Zuerst: Kind of Blue, Miles Davis.“
  Das gilt auch, wenn der Button schon gewählt war.
- Nach „gehört“ in einer Zeile und nach „Rückgängig“ in der unteren Leiste wird die Liste
  sofort neu sortiert. Danach steht der Fokus auf dem 🔊-Button desselben Albums, auch
  wenn die Zeile ihre Position gewechselt hat.
- Ohne Alben wird die Sortier-Gruppe nicht angezeigt.
- Die Wahl überlebt ein Neuladen bzw. einen Neustart der App. Fehlt der gespeicherte
  Wert, ist er unbekannt oder ist der Speicher gesperrt, gilt A–Z. Schlägt das Schreiben
  fehl, wird der Fehler geschluckt.
- Die Datensicherung (Daten speichern / laden) bleibt unverändert. Die Sortierung ist
  eine Einstellung dieses Geräts.

## Wesentliche Entscheidungen und Abwägungen

1. **Namen und Icons: kurze Wörter und dieselben Icons wie in der Zeile.**
   - Warum: Das passt auf schmale Handys, und Kalender und Schallplatte stehen schon
     neben den Zahlen in der Zeile. Man sieht also sofort, nach welcher Zahl sortiert
     wird.
   - Auswirkung: Ein neues Icon `AlphabeticalIcon` kommt dazu (Vorbild Lucide
     „arrow-down-a-z“). Kalender und Schallplatte werden wiederverwendet.
2. **Sofort neu sortieren, Fokus nachführen.**
   - Warum: Entscheidung des Nutzers. Die Liste soll immer korrekt sortiert sein.
   - Auswirkung: `AlbumsArea` setzt `listenButtonFocusRequest` auch beim Hören aus der
     Liste, nicht mehr nur beim Rückgängig-Machen. Weil die Zeilen nach `album.id`
     geschlüsselt sind, bleibt `AlbumListRow` beim Verschieben erhalten, und der Effekt
     in `AlbumListRow.tsx:38` setzt den Fokus.
3. **Umschalt-Buttons mit `aria-pressed` statt Radiogruppe.**
   - Warum: Das entspricht „3 Buttons“ und der Navigationsleiste, und es braucht keine
     eigene Pfeiltasten- oder Roving-Tabindex-Logik.
   - Auswirkung: Jeder Button ist ein eigener Tab- bzw. Wisch-Stopp. Der Stil für den
     gedrückten Button wird von `aria-current='page'` übernommen.
4. **Ansage beim Umschalten.**
   - Warum: Die neue Reihenfolge erführe man sonst nur durch Wischen durch die Liste.
   - Auswirkung: neue Texte in `albumAnnouncements.ts`.
5. **Sortierung als reine Domänenfunktion, nur auf der Listenseite angewendet.**
   - Warum: Das ist eine fachliche Regel und gehört deshalb nicht in eine Komponente
     (Skill `architecture`, TypeScript-Ausformung).
   - Auswirkung: `useAlbums` liefert weiterhin `byTitle`. Formular (`otherAlbums`),
     Zusammenführen und Detailseite bleiben unberührt.
6. **Wahl auf dem Gerät merken, über einen eigenen Port im Kontext `albums`.**
   - Warum: Man soll nicht bei jedem Öffnen neu wählen müssen. Vorbild ist
     `AppearanceClient`.
   - Auswirkung: Port `AlbumOrderClient` mit `localStorage`-Adapter und In-Memory-Fake,
     verdrahtet über `main.tsx` → `App` → `AlbumsArea`.

## Ausgangslage

```
main.tsx
  └─ App(albumsClient, …)                         src/App.tsx
       └─ AlbumsArea                              src/albums/ui/AlbumsArea.tsx
            ├─ useAlbums → albums: byTitle(…)     src/albums/ui/useAlbums.ts:79
            ├─ listenTo(album)                    AlbumsArea.tsx:115  (kein Fokus-Request)
            ├─ takeBackListening(album, …)        AlbumsArea.tsx:132  (setzt Fokus-Request)
            └─ AlbumListPage(albums, …)           src/albums/ui/AlbumListPage.tsx
                 ├─ pageHeader: h1 „Alben, N“ [+]
                 └─ ul.itemList → AlbumListRow    src/albums/ui/AlbumListRow.tsx
                        📅 listeningsThisMonth   ◎ listeningsInTotal   [🔊]
```

Oberfläche heute:

```
 Alben, 12                                  [+]
 ─────────────────────────────────────────────
 [Cover] Abbey Road, The Beatles
         📅 3  ◎ 14                      [🔊]
 ─────────────────────────────────────────────
 [Cover] Kind of Blue, Miles Davis
         📅 0  ◎ 2                       [🔊]
```

- `byTitle` / `compareByTitle`: `src/albums/domain/album.ts:66-77`. `compareByTitle` ist
  noch nicht exportiert.
- `listeningsThisMonth`, `listeningsInTotal`: `src/albums/domain/listening.ts:34-41`.
- Muster für eine gemerkte Geräte-Einstellung: `src/shared/appearance/appearanceClient.ts`,
  `localStorageAppearanceClient.ts` (schluckt Lese- und Schreibfehler),
  `inMemoryAppearanceClient.ts`, `src/shared/storage/deviceStorage.ts`.
- Vorhandene Schlüssel in `localStorage`: `albums`, `albums.unreadable`,
  `invertedColors`, `invertedButtons`.

## Zielbild

Oberfläche nachher:

```
 Alben, 12                                  [+]
┌────────────┐┌────────────┐┌────────────┐
│ ↓AZ  A–Z   ││ 📅  Monat  ││ ◎  Gesamt  │      Gruppe „Sortierung“
└────────────┘└────────────┘└────────────┘
 ─────────────────────────────────────────────
 [Cover] Abbey Road, The Beatles
         📅 3  ◎ 14                      [🔊]
```

Gewählt ist „Gesamt“: Dieser Button ist rot gefüllt, A–Z und Monat sind hell mit rotem
Rand.

Ablauf beim Hören, wenn „Gesamt“ gewählt ist:

```
  Abbey Road   ◎ 14                Abbey Road   ◎ 14
  Let It Be    ◎ 9       [🔊] →    Revolver     ◎ 10  [🔊] ← Fokus
  Revolver     ◎ 9  [🔊]← Fokus    Let It Be    ◎ 9
```

Struktur:

```
main.tsx ── createLocalStorageAlbumOrderClient()
  └─ App(albumOrderClient)
       └─ AlbumsArea(albumOrderClient)
            ├─ useAlbumOrder(albumOrderClient) → { order, changeOrder }
            ├─ inOrder(albums.albums, order, now)          domain/albumOrder.ts
            └─ AlbumListPage(albums, order, onChangeOrder)
                 └─ AlbumOrderButtons                       ui/AlbumOrderButtons.tsx
```

## Abstraktionen und Wiederverwendung

- `src/albums/domain`
  - `album.ts`: `compareByTitle` wird exportiert, damit es bei Gleichstand genutzt
    werden kann.
  - `albumOrder.ts` (neu)
    - `ALBUM_ORDERS = ['alphabetical', 'thisMonth', 'inTotal'] as const`
    - `type AlbumOrder = (typeof ALBUM_ORDERS)[number]`
    - `DEFAULT_ALBUM_ORDER: AlbumOrder = 'alphabetical'`
    - `isAlbumOrder(text: string): text is AlbumOrder`
    - `inOrder(albums: readonly Album[], order: AlbumOrder, now: Date): Album[]`
  - `albumOrder.test.ts` (neu)
  - `albumAnnouncements.ts`
    - `albumOrderLabel(order: AlbumOrder): string`, als
      `Record<AlbumOrder, string>`
    - `albumOrderChangedAnnouncement(order: AlbumOrder, firstAlbum: NamedAlbum): string`
  - `albumAnnouncements.test.ts`: Tests für beide Funktionen.
- `src/albums/api`
  - `albumOrderClient.ts` (neu): `interface AlbumOrderClient { readAlbumOrder(): AlbumOrder; writeAlbumOrder(order: AlbumOrder): void }`
  - `localStorageAlbumOrderClient.ts` (neu): Schlüssel `ALBUM_ORDER_KEY = 'albumOrder'`,
    nutzt `deviceStorage()` und `isAlbumOrder`, schluckt Fehler wie Appearance.
  - `localStorageAlbumOrderClient.test.ts` (neu): Integrationstest des Adapters.
  - `inMemoryAlbumOrderClient.ts` (neu): Fake mit `storedAlbumOrder()`.
- `src/albums/ui`
  - `AlphabeticalIcon.tsx` (neu): gleicher SVG-Rahmen wie `CalendarIcon`
    (`className="buttonIcon"`, `aria-hidden`, `focusable="false"`).
  - `AlbumOrderButtons.tsx` (neu): Gruppe mit drei Buttons. Icon und kurzer Text je
    Ordnung stehen hier, der Vorlesetext kommt aus `albumOrderLabel`.
  - `AlbumListPage.tsx`: neue Props `order` und `onChangeOrder`, zeigt die Gruppe bei
    `albums.length > 0`.
  - `AlbumsArea.tsx`: sortiert mit `inOrder`, setzt den Fokus-Request auch beim Hören und
    meldet den Wechsel der Sortierung.
  - `useAlbumOrder.ts` (neu, Phase 2): liest und schreibt über den Port.
- `src/index.css`: Stil für `.albumOrder`.
- `src/App.tsx`, `src/main.tsx`, `src/App.test.tsx`: neuer Client wird durchgereicht.

## Logging und Beobachtbarkeit

Keine Änderungen. Für den Nutzer sichtbar ist nur die neue Ansage über den Announcer.

## Umsetzung

### Phase 1: Sortieren per Button

Abhängigkeiten: keine

Die drei Buttons sortieren die Liste, der Wechsel wird angesagt, und nach Hören bzw.
Rückgängig führt der Fokus der verschobenen Zeile nach. Die Wahl gilt in dieser Phase
nur, solange die App läuft (`useState` in `AlbumsArea`, Start mit A–Z).

**Aufgaben**:

- [x] `src/albums/domain/albumOrder.test.ts` zuerst schreiben (fehlschlagend). Fälle:
  - `alphabetical` liefert dieselbe Reihenfolge wie `byTitle`.
  - `thisMonth` sortiert absteigend nach Hören im Monat von `now`. Hören aus dem
    Vormonat und aus demselben Monat des Vorjahres zählen nicht.
  - `thisMonth` mit Gleichstand (auch 0 : 0) ordnet nach A–Z, dann nach Band.
  - `inTotal` sortiert absteigend nach Gesamtzahl, bei Gleichstand A–Z.
  - Die Eingabeliste wird nicht verändert.
  - `isAlbumOrder` akzeptiert die drei Werte und lehnt `''`, `'byTitle'` und `'INTOTAL'`
    ab.
- [x] `compareByTitle` in `src/albums/domain/album.ts` exportieren.
- [x] `src/albums/domain/albumOrder.ts` umsetzen:
  ```ts
  export const ALBUM_ORDERS = ['alphabetical', 'thisMonth', 'inTotal'] as const
  export type AlbumOrder = (typeof ALBUM_ORDERS)[number]
  export const DEFAULT_ALBUM_ORDER: AlbumOrder = 'alphabetical'

  export function isAlbumOrder(text: string): text is AlbumOrder {
    return (ALBUM_ORDERS as readonly string[]).includes(text)
  }

  function mostListenedFirst(count: (album: Album) => number) {
    return (one: Album, other: Album) =>
      count(other) - count(one) || compareByTitle(one, other)
  }

  export function inOrder(albums: readonly Album[], order: AlbumOrder, now: Date): Album[] {
    switch (order) {
      case 'alphabetical':
        return byTitle(albums)
      case 'thisMonth':
        return [...albums].sort(mostListenedFirst((album) => listeningsThisMonth(album, now)))
      case 'inTotal':
        return [...albums].sort(mostListenedFirst(listeningsInTotal))
    }
  }
  ```
  `listening.ts` importiert schon aus `album.ts`. `albumOrder.ts` importiert beide, es
  entsteht also kein Zyklus.
- [x] In `src/albums/domain/albumAnnouncements.test.ts` zuerst die Tests, dann in
  `albumAnnouncements.ts` die Funktionen:
  ```ts
  const labelsByAlbumOrder: Record<AlbumOrder, string> = {
    alphabetical: 'Alphabetisch',
    thisMonth: 'Diesen Monat am meisten gehört',
    inTotal: 'Insgesamt am meisten gehört',
  }
  export function albumOrderLabel(order: AlbumOrder): string
  export function albumOrderChangedAnnouncement(order: AlbumOrder, firstAlbum: NamedAlbum): string
  // → "Sortiert: Insgesamt am meisten gehört. Zuerst: Kind of Blue, Miles Davis."
  ```
- [x] `src/albums/ui/AlphabeticalIcon.tsx` anlegen: SVG nach Lucide „arrow-down-a-z“
  (ISC-Lizenz, wie die übrigen Icons), Rahmen wie `CalendarIcon.tsx`.
- [x] `src/albums/ui/AlbumOrderButtons.tsx` anlegen:
  ```tsx
  const buttonsByOrder: Record<AlbumOrder, { icon: ReactNode; text: string }> = {
    alphabetical: { icon: <AlphabeticalIcon />, text: 'A–Z' },
    thisMonth: { icon: <CalendarIcon />, text: 'Monat' },
    inTotal: { icon: <RecordIcon />, text: 'Gesamt' },
  }
  // <div role="group" aria-label="Sortierung" className="albumOrder">
  //   ALBUM_ORDERS.map → <button type="button" aria-pressed={order === shown}
  //                       aria-label={albumOrderLabel(shown)} onClick={() => onChangeOrder(shown)}>
  //                        {icon}<span>{text}</span></button>
  ```
- [x] `AlbumListPage.tsx`: Props `order: AlbumOrder` und
  `onChangeOrder: (order: AlbumOrder) => void`. `<AlbumOrderButtons>` steht zwischen
  `.pageHeader` und `ul.itemList`, nur im Zweig `albums.length > 0`.
- [x] `AlbumsArea.tsx`:
  - `const [order, setOrder] = useState<AlbumOrder>(DEFAULT_ALBUM_ORDER)`
  - `const listedAlbums = inOrder(albums.albums, order, clock())` wird an
    `AlbumListPage` übergeben.
  - `changeOrder(wanted)`: `setOrder(wanted)` und
    `announce(albumOrderChangedAnnouncement(wanted, inOrder(albums.albums, wanted, clock())[0]))`.
    Die Gruppe ist nur bei mindestens einem Album sichtbar, das erste Album gibt es also
    immer.
  - Das Erhöhen des Fokus-Requests aus `takeBackListening` wird in eine Funktion
    `requestListenButtonFocus(albumId)` ausgelagert. `listenTo` ruft sie auf, wenn ein
    Hören erfasst wurde.
- [x] `src/index.css`: neue Regeln
  ```css
  .albumOrder { display: flex; gap: 0.25rem; margin-bottom: 1rem; }
  .albumOrder button { flex: 1; display: flex; align-items: center; justify-content: center; gap: 0.5rem; padding: 0.5rem; }
  ```
  `.albumOrder button[aria-pressed='false']` wird in die vorhandene Regel
  `.navigationBar button, .rowButton` aufgenommen (heller Hintergrund, Rand
  `--accentLine`). Der gedrückte Button behält den Grundstil von `button` (rot gefüllt,
  Rand `--ink`), wie `aria-current='page'`.
- [x] `src/albums/ui/AlbumsArea.test.tsx` erweitern (zuerst die Tests):
  - Ohne Alben gibt es keine Gruppe „Sortierung“.
  - Mit Alben ist „Alphabetisch“ gedrückt, die anderen beiden nicht.
  - „Insgesamt am meisten gehört“ ordnet die Zeilen nach Gesamtzahl, setzt
    `aria-pressed` und erzeugt die Ansage „Sortiert: Insgesamt am meisten gehört.
    Zuerst: …“.
  - „Diesen Monat am meisten gehört“ ordnet nach den Hörzahlen im Monat von `now`
    (2026-11). Ein Album, das nur im Oktober gehört wurde, steht hinter einem, das im
    November gehört wurde.
  - Bei „Gesamt“ springt ein Album nach „gehört“ nach oben, und der Fokus liegt auf
    seinem „… gehört“-Button.
  - Nach „Rückgängig“ springt es zurück, und der Fokus liegt wieder auf seinem
    „… gehört“-Button.
  - Die Prüfung mit `accessibilityViolations` läuft ohne Befund, wenn die Gruppe
    sichtbar ist.
- [x] `e2e/albums.spec.ts`: Zwei Alben anlegen, das zweite (alphabetisch hintere) als
  gehört markieren, „Insgesamt am meisten gehört“ drücken. Es steht dann zuerst, und der
  Button hat `aria-pressed="true"`.

**Automatisierte Verifikation**:

- [x] `npm run test` läuft grün, darunter `albumOrder.test.ts`,
  `albumAnnouncements.test.ts` und `AlbumsArea.test.tsx`.
- [x] `npm run lint` läuft durch. Das schließt die Import-Grenze für `domain/` ein.
- [x] `npm run build` läuft durch (`tsc -b` einschließlich `e2e/`).
- [x] `npx playwright test e2e/albums.spec.ts` läuft grün.

**Manuelle Verifikation**:

- [x] Auf dem Handy mit TalkBack: Die Gruppe wird als „Sortierung“ angesagt, jeder
  Button mit Vorlesetext und Zustand „gedrückt“/„nicht gedrückt“. Nach dem Umschalten
  kommt die Ansage „Sortiert: …. Zuerst: …“.
- [x] Bei „Gesamt“ ein Album hören, das dadurch nach oben springt: Der TalkBack-Fokus
  bleibt auf seinem 🔊-Button.
- [x] Die drei Buttons passen bei ca. 360 px Breite nebeneinander, ohne Umbruch. Das gilt
  auch mit invertierten Farben bzw. invertierten Buttons.

### Phase 2: Sortierung merken

Abhängigkeiten: Phase 1

Die gewählte Sortierung wird auf dem Gerät gespeichert und beim Start gelesen.

**Aufgaben**:

- [x] `src/albums/api/albumOrderClient.ts`:
  ```ts
  export interface AlbumOrderClient {
    readAlbumOrder(): AlbumOrder
    writeAlbumOrder(order: AlbumOrder): void
  }
  ```
- [x] `src/albums/api/localStorageAlbumOrderClient.test.ts` zuerst schreiben, nach dem
  Muster von `localStorageAppearanceClient.test.ts` (`storageHolding`,
  `throwingStorage`). Fälle:
  - Liest einen gespeicherten gültigen Wert.
  - Liefert `DEFAULT_ALBUM_ORDER`, wenn nichts gespeichert ist, der Wert unbekannt ist,
    der Speicher `null` ist oder `getItem` wirft.
  - Schreibt den Wert unter `ALBUM_ORDER_KEY`.
  - Ein Schreibfehler wird geschluckt.
- [x] `src/albums/api/localStorageAlbumOrderClient.ts`:
  `createLocalStorageAlbumOrderClient(storage: DeviceStorage | null = deviceStorage())`
  mit `ALBUM_ORDER_KEY = 'albumOrder'`. Gelesene Werte werden über `isAlbumOrder`
  geprüft.
- [x] `src/albums/api/inMemoryAlbumOrderClient.ts`:
  `createInMemoryAlbumOrderClient(order = DEFAULT_ALBUM_ORDER)` mit zusätzlichem
  `storedAlbumOrder()`.
- [x] `src/albums/ui/useAlbumOrder.ts`: Startwert über `useState(() => client.readAlbumOrder())`.
  `changeOrder(wanted)` schreibt über den Client und setzt dann den State, wie
  `useAppearance.change`.
- [x] `AlbumsArea.tsx`: Neue Prop `albumOrderClient`, `useState` wird durch
  `useAlbumOrder` ersetzt.
- [x] `src/App.tsx`: Neue Prop `albumOrderClient: AlbumOrderClient`, wird an `AlbumsArea`
  weitergereicht.
- [x] `src/main.tsx`: `const albumOrderClient = createLocalStorageAlbumOrderClient()` und
  an `App` übergeben.
- [x] `src/App.test.tsx` (`renderApp`) und `AlbumsArea.test.tsx` (`renderArea`):
  `createInMemoryAlbumOrderClient()` übergeben.
- [x] `AlbumsArea.test.tsx` erweitern (zuerst die Tests):
  - Ist im Client `inTotal` gespeichert, startet die Liste nach Gesamtzahl sortiert,
    und dieser Button ist gedrückt.
  - Nach einem Druck auf „Diesen Monat am meisten gehört“ liefert
    `storedAlbumOrder()` den Wert `thisMonth`.
- [x] `e2e/albums.spec.ts`: „Insgesamt am meisten gehört“ wählen und die Seite neu laden.
  Der Button ist dann weiter gedrückt, und die Reihenfolge bleibt.

**Automatisierte Verifikation**:

- [x] `npm run test` läuft grün, darunter `localStorageAlbumOrderClient.test.ts`.
- [x] `npm run lint` läuft durch.
- [x] `npm run build` läuft durch.
- [x] `npx playwright test` läuft komplett grün.

**Manuelle Verifikation**:

- [x] Auf dem Handy in der installierten App „Monat“ wählen, die App schließen und neu
  öffnen. „Monat“ ist weiter gewählt.

## Notizen zur Umsetzung

- Beide Phasen wurden in einem Zug umgesetzt und gepusht, damit der Nutzer die manuellen
  Prüfungen beider Phasen gemeinsam auf dem Handy machen kann.

## Verweise

- Vorgängerpläne: `docs/agents/plans/2026-11-12-alben-verwalten-und-gehoert-zaehlen.md`,
  `docs/agents/plans/2026-11-12-spotify-link-und-album-cover.md`
- Muster für eine gemerkte Geräte-Einstellung: `src/shared/appearance/`
- Lucide-Icon „arrow-down-a-z“: https://lucide.dev/icons/arrow-down-a-z
- WAI-ARIA, Umschalt-Buttons (`aria-pressed`): https://www.w3.org/WAI/ARIA/apg/patterns/button/
