---
date: 2026-11-12T09:12:52+00:00
git_commit: 1b0aa15ad9aef745a688ace0a50e39327c9b2e8c
branch: main
story: ALS-001
topic: "Grunddesign: rotes Farbschema, Navigation, Einstellungen, App-Icon, Installation und Updates"
tags: [plan, design, navigation, settings, pwa, shared-ui]
status: ready
---

# PLAN: ALS-001 — Grunddesign

Album-Statistics bekommt das Grunddesign des Mahlzeitenplaners in Rot: oben fixierte
Navigation mit „Alben“ und „Einstellungen“, eine Alben-Startseite, Einstellungen mit
„Farben invertieren“ und „App installieren“, ein Schallplatten-App-Icon und den Knopf
„Neue Version laden“. Grundlage sind die Wünsche in `docs/notes.txt` (Abschnitt TODO).

Folgestories (eigene Pläne): ALS-002 Alben verwalten und „gehört“ zählen, ALS-003
Album-Detailseite, ALS-004 Daten speichern und laden, später Songs.

## Akzeptanzkriterien

- Oben steht fixiert eine Navigation mit zwei Icon-Knöpfen: „Alben“ (Schallplatte) und
  „Einstellungen“ (Zahnrad). Der Screen-Reader sagt die Namen an, der aktive Bereich hat
  `aria-current="page"` und ist in der Akzentfarbe hinterlegt.
- Die App startet auf der Alben-Seite: Überschrift „Alben“, rechts ein grauer
  `[+]`-Knopf „Album hinzufügen“ mit `aria-disabled="true"`, der erreichbar bleibt und
  nichts tut, darunter „Noch keine Alben.“
- Beim Wechsel des Bereichs bekommt die Überschrift der neuen Seite den Fokus.
- Die Einstellungen haben den Schalter „Farben invertieren“. Er wechselt zwischen hellem
  Schema (weiß, hellrote Knöpfe) und dunklem Schema (schwarz, dunkelrote Knöpfe, weiße
  Schrift), färbt die Systemleiste mit und bleibt nach einem Neustart erhalten — ohne
  helles Aufblitzen beim Start.
- Schrift auf Hintergrund und auf Knöpfen erreicht in beiden Schemata mindestens 4,5 : 1,
  Linien und Häkchen mindestens 3 : 1.
- „App installieren“ erscheint in den Einstellungen nur, wenn der Browser die
  Installation anbietet. Nach dem Dialog wird das Ergebnis angesagt, der Eintrag
  verschwindet und der Fokus liegt auf der Überschrift „Einstellungen“.
- Liegt eine neue App-Version bereit, wird das angesagt und unten erscheint „Neue
  Version laden“; erst ein Tippen lädt sie.
- Das App-Icon zeigt eine schwarze Schallplatte mit weißem Etikett auf rotem Grund, als
  Favicon, als Android-Icons (192, 512, maskierbar) und als Apple-Touch-Icon.
- Checkbox- und Radiobutton-Stil (L-Form, Häkchen bei Auswahl) liegen im Stylesheet.
- Das bisherige blaue Design (`#1e3a8a`) ist vollständig ersetzt.

## Wesentliche Entscheidungen und Abwägungen

1. **Mehrere Stories statt eines Gesamtplans:** ALS-001 liefert nur das Grunddesign.
   - Warum: Kleine Schritte, die jeweils auf dem Handy nutzbar sind.
   - Auswirkung: Keine Albumdaten, keine Speicherung von Alben in diesem Plan.
2. **Navigation nur mit Alben und Einstellungen, nur Icons:** Songs kommt mit seiner
   eigenen Story.
   - Warum: Kein Knopf führt ins Leere.
   - Auswirkung: Die Bereiche sind eine Liste wie im Mahlzeitenplaner (`AREAS`).
3. **Farben, kein exaktes Invertieren:** hell Akzent `#f4a3a3`, Linie `#b91c1c`; dunkel
   Akzent `#7f1d1d`, Linie `#f87171`.
   - Warum: Rot soll auch im dunklen Schema rot bleiben.
   - Auswirkung: Die Systemleiste bekommt eine eigene Variable `--systemBar`
     (hell `#b91c1c`, dunkel `#7f1d1d`), statt wie im Mahlzeitenplaner `--accent` zu
     lesen. Ein Kontrasttest sichert alle Farbpaare.
4. **App-Icon rot mit schwarzer Platte:** In der Navigation dieselbe Platte als
   Strichzeichnung in Schriftfarbe.
   - Warum: Fällt auf dem Startbildschirm auf und passt in beide Schemata.
   - Auswirkung: Icon-Skript nach `Mahlzeitenplaner/scripts/generateIcons.mjs`, reines
     Node ohne weitere Pakete.
5. **Installation nur bei Angebot des Browsers:** Logik aus
   `Wunschliste/src/app/install/installOffer.svelte.ts` nach React übertragen.
   - Warum: Kein nutzloser Eintrag, etwa in der schon installierten App.
   - Auswirkung: Prüfung per Komponententest mit In-Memory-Fake und Adaptertest mit
     künstlichem Ereignis; Playwright kann das echte Angebot nicht auslösen.
6. **Updates per Knopf:** `registerType: 'prompt'` wie im Mahlzeitenplaner.
   - Warum: Kein Neuladen mitten in einer Eingabe (ab ALS-002 wichtig).
7. **Grunddesign komplett:** `[+]` sichtbar mit `aria-disabled`, Checkbox- und
   Radiobutton-Stil schon jetzt. Radiobuttons sehen aus wie Checkboxen.
   - Auswirkung: Diese beiden Stile werden erst mit ALS-002 sichtbar und prüfbar.
8. **Schichtung:** Kontextübergreifendes unter `src/shared/` (`appearance`, `install`,
   `appUpdate`, `ui`), Alben-Seite und Platten-Icon unter `src/albums/ui/`. Jede Technik
   (`localStorage`, Browser-Ereignisse, Service Worker) liegt hinter einer
   Client-Schnittstelle mit In-Memory-Fake, wie im Mahlzeitenplaner. `App.tsx` bekommt
   die Clients als Props, `main.tsx` verdrahtet die echten.

## Ausgangslage

```
index.html                 theme-color #1e3a8a, nur favicon.svg
vite.config.ts             registerType 'autoUpdate', Manifest blau, nur SVG-Icon
src/
  main.tsx                 rendert <App />
  App.tsx                  nur <h1>Album-Statistics</h1>
  App.test.tsx             prüft diese Überschrift + axe
  index.css                Variablen --surface, --ink, --accent (blau), .page
  albums/domain/album.ts   unberührt in dieser Story
public/favicon.svg         Platzhalter
e2e/app.spec.ts            prüft Überschrift "Album-Statistics"
eslint.config.js           Grenzen domain/api/ui; Node-Globals nur für e2e, *.config.ts, test
```

Vorlagen:

- `Mahlzeitenplaner/src/index.css` — Farbvariablen, Knöpfe, Navigation, Checkbox,
  `.announcer`, `.appUpdate`, `.visuallyHidden`
- `Mahlzeitenplaner/src/shared/ui/` — `NavigationBar.tsx`, `SettingsPage.tsx`,
  `SettingsIcon.tsx`, `Announcer.tsx`, `useAnnouncer.ts`, `announcement.ts`,
  `useHeadingFocus.ts`
- `Mahlzeitenplaner/src/shared/appearance/` — Port, `localStorage`-Adapter, Fake, Hook,
  Tests
- `Mahlzeitenplaner/src/shared/appUpdate/` — Port, Service-Worker-Adapter, Fake, Hook,
  `AppUpdateOffer.tsx`
- `Mahlzeitenplaner/index.html` — Inline-Skript gegen Aufblitzen,
  `apple-touch-icon`
- `Mahlzeitenplaner/scripts/generateIcons.mjs` — PNG-Erzeugung ohne Pakete
- `Wunschliste/src/app/install/installOffer.svelte.ts` — Zustände und Ereignisse der
  Installation

## Zielbild

```
main.tsx
  └─ <App appearanceClient installOfferClient appUpdateClient />
       ├─ NavigationBar  [Platte: Alben] [Zahnrad: Einstellungen]   (sticky oben)
       ├─ AlbumsPage                       wenn Bereich "albums"
       │    Alben                     [+] (aria-disabled)
       │    Noch keine Alben.
       ├─ SettingsPage                     wenn Bereich "settings"
       │    Farben invertieren      [Schalter]
       │    [App installieren]      nur bei Angebot
       ├─ AppUpdateOffer                   nur bei neuer Version
       └─ Announcer (role="status")
```

### Alben-Seite (hell)

```
+--------------------------------------+
|   [ Platte ]       [ Zahnrad ]       |   <- Platte hellrot hinterlegt (aktiv)
+--------------------------------------+
| Alben                            [+] |   <- [+] grau
|                                      |
| Noch keine Alben.                    |
|                                      |
+--------------------------------------+
|                                      |   <- Ansagebereich
+--------------------------------------+
```

### Einstellungen (dunkel, mit Installationsangebot)

```
+--------------------------------------+   Hintergrund schwarz, Schrift weiß
|   [ Platte ]       [ Zahnrad ]       |   <- Zahnrad dunkelrot hinterlegt
+--------------------------------------+
| Einstellungen                        |
|--------------------------------------|
| Farben invertieren          [ an  ]  |
|--------------------------------------|
| [ App installieren ]                 |
|--------------------------------------|
```

### Mit wartender neuer Version

```
| ...                                  |
+--------------------------------------+
|        [ Neue Version laden ]        |
+--------------------------------------+
| Neue Version verfügbar. Der Knopf    |
| dafür steht ganz unten.              |
+--------------------------------------+
```

### Farbvariablen

```
Variable          hell       dunkel
--surface         #ffffff    #000000
--ink             #000000    #ffffff
--accent          #f4a3a3    #7f1d1d
--accentLine      #b91c1c    #f87171
--systemBar       #b91c1c    #7f1d1d
--checkMark       #b91c1c    #f87171
--divider         #d1d5db    #2e2a24
--fieldBorder     #4b5563    #b4aa9c
--disabled        #f3f4f6    #0c0b09
--disabledLine    #6b7280    #948d7f
--disabledInk     #4b5563    #b4aa9c
--failure         #991b1b    #66e4e4
```

`--divider` bis `--failure` stammen unverändert aus dem Mahlzeitenplaner.

## Abstraktionen und Wiederverwendung

- `src/`
  - `App.tsx` – Bereichswahl, Announcer, Appearance, Installationsangebot, Update
    - `App` – Props `appearanceClient`, `installOfferClient`, `appUpdateClient`
    - `AREAS` – `albums` (RecordIcon), `settings` (SettingsIcon)
  - `App.test.tsx` – neu geschrieben, In-Memory-Clients
  - `main.tsx` – verdrahtet die echten Clients
  - `index.css` – Grunddesign aus dem Mahlzeitenplaner, rote Variablen
  - `albums/ui/`
    - `AlbumsPage.tsx` – Überschrift, `[+]` mit `aria-disabled`, Leertext
    - `RecordIcon.tsx` – Platte als Strich-SVG, `currentColor`
  - `shared/ui/`
    - `NavigationBar.tsx` – übernommen
    - `SettingsPage.tsx` – übernommen, Eintragsarten `toggle` und `action`
    - `SettingsIcon.tsx`, `Announcer.tsx`, `useAnnouncer.ts`, `announcement.ts`
      (+ Test), `useHeadingFocus.ts` – übernommen
  - `shared/appearance/` – übernommen, `useAppearance` liest `--systemBar`
  - `shared/install/`
    - `installOfferClient.ts` – Port `InstallOfferClient`, Typ `InstallOutcome`
    - `browserInstallOfferClient.ts` (+ Test) – Adapter für `beforeinstallprompt`
      und `appinstalled`
    - `inMemoryInstallOfferClient.ts` – Fake mit `offer()` und `withdraw()`
    - `useInstallOffer.ts` – Hook: `available`, `install()`
    - `installAnnouncements.ts` (+ Test) – Ansagetexte je Ergebnis
  - `shared/appUpdate/` – übernommen
- `scripts/generateIcons.mjs` – zeichnet die Platte, schreibt PNGs
- `public/` – `favicon.svg`, `icon-192.png`, `icon-512.png`, `icon-maskable-512.png`,
  `apple-touch-icon.png`
- `test/colorContrast.test.ts` – liest `src/index.css`, prüft Farbpaare
- `test/appIcons.test.ts` – prüft Existenz und Pixelmaße der Icons laut Manifest

Nicht übernommen, weil in ALS-001 ungenutzt: `ManagementHeader` (der `[+]` hat hier eine
Sonderrolle; das Herauslösen geschieht mit ALS-002), Eintragsart `page` der
Einstellungen (kommt mit ALS-004), Auth, Firestore, Spinner, Vorschlagslisten.

## Logging und Beobachtbarkeit

Keine Logs. Nutzersichtbare Rückmeldungen laufen über den Ansagebereich
(`role="status"`):

```
Neue Version verfügbar. Der Knopf dafür steht ganz unten.
Album-Statistics wird installiert und erscheint auf dem Startbildschirm.
Installation abgebrochen. Über das Browsermenü und „App installieren“ geht es jederzeit.
```

## Umsetzung

### Phase 1: Rotes Grunddesign mit Navigation und Alben-Seite

Abhängigkeiten: keine

Die App zeigt Navigation, Alben-Seite und eine Einstellungen-Seite ohne Einträge im
roten hellen Schema.

**Aufgaben**:
- [ ] `src/index.css` – Grunddesign aus `Mahlzeitenplaner/src/index.css` übernehmen:
  Variablen (nur helles Schema, Werte laut Tabelle), `html`/`body`, `.page`,
  `.pageBelowNavigation`, `.navigationBar` samt `button[aria-current='page']`, Knöpfe
  inklusive `button:disabled, button[aria-disabled='true']`, `:focus-visible`,
  `h1:focus-visible`, `.field`, Eingabefelder, `.pageHeader`, `.addItemButton`,
  `.itemList`, `.announcer`, `.iconButton`, `.buttonIcon`, `.visuallyHidden`, `h2`.
  Klassen mit Mahlzeiten-Bezug umbenennen: `.mealRow` → `.listRow`,
  `.mealNameButton` → `.rowButton`.
- [ ] `src/index.css` – Checkbox- und Radiobutton-Stil als allgemeine Regel
  `input[type='checkbox']:not([role='switch']), input[type='radio']` (L-Form aus
  `index.css:311-350` des Mahlzeitenplaners, Häkchen in `--checkMark`) und `label`
  daneben mit `.choice` (Flex, `gap: 0.75rem`, `min-height: 44px`).
- [ ] `src/index.css` – Schalter `.settingsToggle` übernehmen; der Schalter selbst
  (`role="switch"`) behält das Browser-Aussehen wie im Mahlzeitenplaner.
- [ ] `src/shared/ui/announcement.ts` und `announcement.test.ts`, `Announcer.tsx`,
  `useAnnouncer.ts`, `useHeadingFocus.ts`, `NavigationBar.tsx`, `SettingsIcon.tsx`
  unverändert aus dem Mahlzeitenplaner übernehmen.
- [ ] `src/shared/ui/SettingsPage.tsx` – übernehmen, `SettingsEntry` zunächst nur mit
  Art `toggle`; `className="mealRow"` → `listRow`.
- [ ] `src/albums/ui/RecordIcon.tsx` – Strich-SVG im Stil von `SettingsIcon`
  (`viewBox="0 0 24 24"`, `stroke="currentColor"`, `aria-hidden`):
  ```tsx
  <circle cx="12" cy="12" r="10" />
  <circle cx="12" cy="12" r="6.5" />
  <circle cx="12" cy="12" r="2.5" />
  ```
- [ ] `src/albums/ui/AlbumsPage.tsx` – Props `navigation: ReactNode`; Überschrift
  „Alben“ mit `useHeadingFocus`, Knopf `+` mit `aria-label="Album hinzufügen"`,
  `aria-disabled="true"`, Klasse `addItemButton`, ohne `onClick`; Text
  „Noch keine Alben.“
- [ ] `src/App.tsx` – `AREAS` mit `albums` („Alben“, `RecordIcon`) und `settings`
  („Einstellungen“, `SettingsIcon`), Zustand `activeArea` (Start `albums`),
  `useAnnouncer`, `<Announcer>` am Ende. Einstellungen zunächst mit leerer Liste.
- [ ] `src/App.test.tsx` neu schreiben (zuerst, test-getrieben):
  - `starts on the albums page` – Überschrift „Alben“, „Noch keine Alben.“
  - `offers adding an album only as unavailable` – Knopf „Album hinzufügen“ hat
    `aria-disabled="true"`; Klick ändert nichts
  - `marks the active area in the navigation` – „Alben“ hat `aria-current="page"`,
    „Einstellungen“ nicht
  - `switches to the settings and focuses their heading`
  - `has no accessibility violations` – auf Alben- und Einstellungen-Seite
- [ ] `index.html` – `theme-color` auf `#b91c1c`, `<meta name="color-scheme"
  content="light" />`.
- [ ] `test/colorContrast.test.ts` (zuerst, test-getrieben) – liest `src/index.css`,
  zieht die Variablen aus `:root` (und ab Phase 2 aus
  `:root[data-inverted-colors='true']`) und prüft per WCAG-Formel:
  `--ink`/`--surface` ≥ 4,5; `--ink`/`--accent` ≥ 4,5; `--disabledInk`/`--disabled`
  ≥ 4,5; `--failure`/`--surface` ≥ 4,5; `--accentLine`/`--surface` ≥ 3;
  `--checkMark`/`--surface` ≥ 3. Die Berechnung liegt als Funktion
  `contrastRatio(foreground, background)` in `test/colorContrast.ts` und hat einen
  eigenen Fall: `#000000` zu `#ffffff` ergibt 21.
- [ ] `e2e/app.spec.ts` – ersetzen: App öffnet auf „Alben“; Tippen auf
  „Einstellungen“ zeigt die Überschrift „Einstellungen“.

**Automatisierte Verifikation**:
- [ ] `npm run test` grün, darunter `App.test.tsx`, `announcement.test.ts`,
  `colorContrast.test.ts`, `domainLayerBoundary.test.ts`
- [ ] `npm run lint` grün
- [ ] `npm run build` grün
- [ ] `npm run test:e2e` grün
- [ ] `grep -rn "1e3a8a" src index.html` findet nichts (das Manifest in
  `vite.config.ts` folgt in Phase 3)

**Manuelle Verifikation**:
- [ ] Im Browser (`npm run dev`): Navigation bleibt beim Scrollen oben, aktiver
  Bereich hellrot hinterlegt, `[+]` grau.
- [ ] Mit TalkBack: Navigationsknöpfe werden als „Alben“ und „Einstellungen“
  angesagt, `[+]` als „Album hinzufügen, nicht verfügbar“; nach dem Wechsel liegt der
  Fokus auf der Überschrift.

### Phase 2: Farben invertieren

Abhängigkeiten: Phase 1

Der Schalter „Farben invertieren“ schaltet das dunkle rote Schema und bleibt erhalten.

**Aufgaben**:
- [ ] `src/shared/appearance/` – `appearanceClient.ts`,
  `localStorageAppearanceClient.ts` (+ Test), `inMemoryAppearanceClient.ts`,
  `useAppearance.ts` (+ Test) aus dem Mahlzeitenplaner übernehmen.
- [ ] `useAppearance.ts` – `applyAccentToTheSystemBar` wird zu
  `applySystemBarColor` und liest `--systemBar` statt `--accent`. Test
  `useAppearance.test.tsx` zuerst anpassen: Palette mit `--systemBar` hell
  `#b91c1c`, dunkel `#7f1d1d`.
- [ ] `src/index.css` – Block `:root[data-inverted-colors='true']` mit
  `color-scheme: dark` und den dunklen Werten laut Tabelle.
- [ ] `index.html` – Inline-Skript aus `Mahlzeitenplaner/index.html` übernehmen, das
  `data-inverted-colors` vor dem ersten Zeichnen aus `localStorage` setzt.
- [ ] `src/App.tsx` – Prop `appearanceClient`, `useAppearance`, Einstellungseintrag
  `{ kind: 'toggle', id: 'invertedColors', label: 'Farben invertieren', … }`.
- [ ] `src/main.tsx` – `createLocalStorageAppearanceClient()` übergeben.
- [ ] `src/App.test.tsx` – zuerst: `inverts the colours from the settings`
  (Schalter an → `data-inverted-colors="true"`, Fake hat `true` gespeichert);
  `starts with remembered inverted colours` (Fake mit `true` → Schalter an).
- [ ] `test/colorContrast.test.ts` – dieselben Paare auch für das dunkle Schema.
- [ ] `e2e/appearance.spec.ts` – nach `Mahlzeitenplaner/e2e/appearance.spec.ts`
  ohne Anmeldung: Schalter einschalten, neu laden, `data-inverted-colors="true"` und
  Schalter weiterhin an.

**Automatisierte Verifikation**:
- [ ] `npm run test` grün, darunter `localStorageAppearanceClient.test.ts`,
  `useAppearance.test.tsx`, `colorContrast.test.ts` mit beiden Schemata
- [ ] `npm run lint` und `npm run build` grün
- [ ] `npm run test:e2e` grün, darunter `appearance.spec.ts`

**Manuelle Verifikation**:
- [ ] Auf dem Handy: Schalter umlegen → schwarzer Hintergrund, dunkelrote Knöpfe mit
  weißem Rand, Systemleiste dunkelrot; App schließen und öffnen → dunkel ohne helles
  Aufblitzen.

### Phase 3: Schallplatten-Icon

Abhängigkeiten: Phase 1

Favicon, Android- und Apple-Icons zeigen die schwarze Platte auf Rot; das Manifest ist
rot.

**Aufgaben**:
- [ ] `test/appIcons.test.ts` (zuerst) – liest die Manifest-Icons aus der
  Vite-Konfiguration (Icon-Liste als exportierte Konstante `manifestIcons` aus
  `vite.config.ts`) und prüft für jede PNG-Datei in `public/`: existiert, PNG-Signatur,
  Breite und Höhe aus dem IHDR-Block passen zu `sizes`; dazu
  `public/apple-touch-icon.png` mit 180 × 180.
- [ ] `scripts/generateIcons.mjs` – aus dem Mahlzeitenplaner übernehmen
  (Leinwand, Supersampling, Abrunden, PNG-Kodierung), Zeichnung ersetzen durch
  `renderRecordIcon({ size, cornerRadiusRatio, contentScale })`:
  - Hintergrund `#b91c1c`, abgerundet (`cornerRadiusRatio` 0,22, maskierbar und
    Apple 0)
  - Platte `#000000`, Radius 0,40 der Kantenlänge
  - zwei Rillenringe `#3f3f46`, Radien 0,33 und 0,26, Strichstärke 0,012
  - Etikett `#ffffff`, Radius 0,13
  - Loch `#b91c1c`, Radius 0,025
  - `contentScale` 0,8 für das maskierbare Icon
  - Neue Hilfsfunktion `paintCircle(canvas, center, radius, color)` und
    `paintRing(canvas, center, radius, thickness, color)`; Rechteck- und
    Polylinien-Funktionen entfallen, soweit ungenutzt.
- [ ] `package.json` – Skript `"icons": "node scripts/generateIcons.mjs"`; einmal
  ausführen und die vier PNGs nach `public/` schreiben.
- [ ] `public/favicon.svg` – dieselbe Zeichnung als SVG (`viewBox="0 0 512 512"`,
  `rx="113"`, Kreise wie oben), `role="img"`, `aria-label="Album-Statistics"`.
- [ ] `vite.config.ts` – `manifestIcons` mit 192, 512 und maskierbar 512 (PNG),
  `includeAssets: ['favicon.svg', 'apple-touch-icon.png']`, `theme_color: '#b91c1c'`.
- [ ] `index.html` – `<link rel="apple-touch-icon" href="/apple-touch-icon.png" />`,
  `<meta name="apple-mobile-web-app-status-bar-style" content="default" />`.
- [ ] `eslint.config.js` – Node-Globals zusätzlich für `scripts/**/*.mjs`.
- [ ] `README.md` – Befehlstabelle um `npm run icons` ergänzen („App-Icons aus dem
  Icon-Skript neu erzeugen“).

**Automatisierte Verifikation**:
- [ ] `npm run test` grün, darunter `appIcons.test.ts`
- [ ] `npm run lint` und `npm run build` grün
- [ ] `grep -r "1e3a8a" .` außerhalb von `node_modules` und `dist` findet nichts

**Manuelle Verifikation**:
- [ ] Nach dem Deployment auf dem Android-Handy: Browser-Tab zeigt die Platte;
  installiert zeigt der Startbildschirm die schwarze Platte mit weißem Etikett auf
  rotem Grund, auch in runder Icon-Maske nicht abgeschnitten.

### Phase 4: App installieren

Abhängigkeiten: Phase 2 (Einstellungen mit Einträgen)

In den Einstellungen erscheint „App installieren“, sobald der Browser es anbietet.

**Aufgaben**:
- [ ] `src/shared/install/installOfferClient.ts` – Port:
  ```ts
  export type InstallOutcome = 'accepted' | 'dismissed'

  export interface InstallOfferClient {
    observeOffer(onOfferChanged: (available: boolean) => void): () => void
    install(): Promise<InstallOutcome>
  }
  ```
- [ ] `src/shared/install/browserInstallOfferClient.ts` – Adapter nach
  `installOffer.svelte.ts`: merkt sich `beforeinstallprompt`, meldet `true`; bei `appinstalled` vergisst er das Angebot
  und meldet `false`; `install()` ruft `prompt()` auf, wartet auf `userChoice`,
  vergisst das Angebot und meldet `false`. Typ `BeforeInstallPromptEvent` mit
  Warum-Kommentar und MDN-Link wie in der Wunschliste. Parameter
  `browser: EventTarget = globalThis`.
- [ ] `src/shared/install/browserInstallOfferClient.test.ts` (zuerst) – mit eigenem
  `EventTarget` und künstlichem Ereignis: meldet das Angebot; `install()` liefert
  `accepted` bzw. `dismissed` aus `userChoice` und meldet danach `false`;
  `appinstalled` zieht das Angebot zurück; nach Abmelden keine Meldungen mehr.
- [ ] `src/shared/install/inMemoryInstallOfferClient.ts` – Fake mit `offer()`,
  `withdraw()` und einstellbarem Ergebnis von `install()`.
- [ ] `src/shared/install/installAnnouncements.ts` (+ Test, zuerst) –
  `installOutcomeAnnouncement(outcome)` mit den Texten aus *Logging und
  Beobachtbarkeit*.
- [ ] `src/shared/install/useInstallOffer.ts` – Hook: `available: boolean`,
  `install(): Promise<InstallOutcome>`.
- [ ] `src/shared/ui/SettingsPage.tsx` – Eintragsart
  `{ kind: 'action'; id; label; onSelect: () => void }`, gerendert als Knopf mit Klasse
  `rowButton`. Weil der gedrückte Knopf nach der Installation verschwindet, nimmt
  `SettingsPage` die Prop `headingFocusRequest: number` und fokussiert die Überschrift
  bei jeder Änderung dieses Werts; `App` erhöht ihn nach dem Ergebnis.
- [ ] `src/App.tsx` – Prop `installOfferClient`; Eintrag „App installieren“ nur bei
  `available`; nach `install()` Ergebnis ansagen und Fokus auf die Überschrift.
- [ ] `src/main.tsx` – `createBrowserInstallOfferClient()` übergeben.
- [ ] `src/App.test.tsx` – zuerst: `offers installing only while the browser offers
  it`; `announces an accepted installation and focuses the settings heading`;
  `announces a dismissed installation`.

**Automatisierte Verifikation**:
- [ ] `npm run test` grün, darunter `browserInstallOfferClient.test.ts`,
  `installAnnouncements.test.ts`, die neuen Fälle in `App.test.tsx`
- [ ] `npm run lint`, `npm run build`, `npm run test:e2e` grün

**Manuelle Verifikation**:
- [ ] Nach dem Deployment in Chrome auf Android (App noch nicht installiert):
  Einstellungen zeigen „App installieren“, Tippen öffnet den Installationsdialog,
  TalkBack sagt das Ergebnis an, der Eintrag verschwindet; in der installierten App
  fehlt der Eintrag.

### Phase 5: Neue Version laden

Abhängigkeiten: Phase 1

Neue Versionen werden angesagt und erst per Knopf geladen.

**Aufgaben**:
- [ ] `src/shared/appUpdate/` – `appUpdateClient.ts`, `inMemoryAppUpdateClient.ts`,
  `serviceWorkerAppUpdateClient.ts`, `useAppUpdate.ts`, `AppUpdateOffer.tsx` aus dem
  Mahlzeitenplaner übernehmen.
- [ ] `vite.config.ts` – `registerType: 'prompt'`, `injectRegister: null`.
- [ ] `src/index.css` – `.appUpdate` übernehmen.
- [ ] `src/App.tsx` – Prop `appUpdateClient`, `useAppUpdate(appUpdateClient,
  announce)`, `<AppUpdateOffer>` vor dem `<Announcer>`.
- [ ] `src/main.tsx` – `createServiceWorkerAppUpdateClient()` übergeben.
- [ ] `src/App.test.tsx` – zuerst: `offers a waiting update and announces it`;
  `installs the update on request` (Fake gibt Funktion frei, Klick ruft sie auf).
- [ ] `docs/notes.txt` – erledigte Einträge „Design-Farbe = rot“ und „App-Icons =
  stilisierte Schallplatte“ auf `x` setzen und nach DONE verschieben; sonst nichts
  ändern.

**Automatisierte Verifikation**:
- [ ] `npm run test` grün, darunter die neuen Fälle in `App.test.tsx`
- [ ] `npm run lint`, `npm run build`, `npm run test:e2e` grün
- [ ] `dist/` enthält nach dem Build `sw.js`, und `dist/index.html` bindet kein
  `registerSW.js` mehr ein

**Manuelle Verifikation**:
- [ ] Nach zwei aufeinanderfolgenden Deployments auf dem Handy: App öffnen, TalkBack
  sagt „Neue Version verfügbar …“, unten steht „Neue Version laden“, Tippen lädt die
  neue Version.

## Notizen zur Umsetzung

Hier während der Umsetzung Rückmeldungen, Probleme und Entscheidungen festhalten.

## Verweise

- `docs/notes.txt` – Wünsche zum Grunddesign
- `C:/MW/Projekte/privat/Mahlzeitenplaner/src/index.css`,
  `src/shared/ui/`, `src/shared/appearance/`, `src/shared/appUpdate/`, `index.html`,
  `scripts/generateIcons.mjs`, `e2e/appearance.spec.ts`
- `C:/MW/Projekte/privat/Wunschliste/src/app/install/installOffer.svelte.ts`,
  `InstallSettings.svelte`
- MDN, BeforeInstallPromptEvent:
  <https://developer.mozilla.org/en-US/docs/Web/API/BeforeInstallPromptEvent>
- WCAG 2.2, Kontrast (Minimum) 1.4.3 und Nicht-Text-Kontrast 1.4.11
- vite-plugin-pwa, Prompt for update: <https://vite-pwa-org.netlify.app/guide/prompt-for-update>
