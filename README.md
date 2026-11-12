# Album-Statistics

Private Anwendung für Statistiken zu Alben — eine PWA mit React und Vite, ausgeliefert
über GitHub Pages.

## Arbeitsweise

Die Dauerregeln stehen in [CLAUDE.md](CLAUDE.md), die projektspezifischen Angaben in
[.claude/projekt.md](.claude/projekt.md). Offene Punkte und Bugs stehen in
[docs/notes.txt](docs/notes.txt).

## Ablauf

```
/rpi-research <Frage>       Bestehendes verstehen        -> docs/agents/research/
/rpi-plan <Vorhaben>        Plan erstellen               -> docs/agents/plans/
/rpi-implement <Plan>       Plan Phase für Phase umsetzen
/commit                     Format, Lint, Tests, Architektur, Secrets -> Commit
```

`/grill-me <Vorhaben>` nimmt einen Entwurf vorab auseinander.

## Befehle

| Befehl              | Zweck                                         |
|---------------------|-----------------------------------------------|
| `npm run dev`       | Entwicklungsserver                            |
| `npm run test`      | Unit- und Komponententests (Vitest)           |
| `npm run test:e2e`  | Build und End-to-End-Tests (Playwright)       |
| `npm run lint`      | ESLint samt Schicht- und Kontextgrenzen       |
| `npm run format`    | Prettier                                      |
| `npm run build`     | Typprüfung und Produktions-Build nach `dist/` |
| `npm run icons`     | App-Icons aus dem Icon-Skript neu erzeugen    |

Vor dem ersten E2E-Lauf einmalig `npx playwright install chromium`.

## Aufbau

`src/<kontext>/{domain,api,ui}` je fachlichem Kontext, dazu `src/shared/` für
Kontextübergreifendes. `domain` kennt weder React noch Adapter; ESLint setzt das durch,
`test/domainLayerBoundary.test.ts` sichert die Regeln ab.

## Eckdaten

| Feld    | Wert                                                   |
|---------|--------------------------------------------------------|
| Kürzel  | `ALS` — Präfix der Story-Nummern (`ALS-007`)           |
| Bauart  | `onion` — Domain-Driven Design mit Onion-Architektur   |
| Basispfad | `/album-statistics/` — muss zum Namen des GitHub-Repositorys passen |
| Repository | <https://github.com/burnyWes/album-statistics> |
