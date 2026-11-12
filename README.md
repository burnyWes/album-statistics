# Projekt-Template

Vorlage für neue Projekte. Enthält die Arbeitsweise, die in jedem Projekt gleich ist,
damit sie nicht jedes Mal neu erklärt werden muss.

## Neues Projekt starten

1. Das Template **ohne** den Ordner `.git` an den Zielort kopieren und umbenennen —
   oder auf GitHub über „Use this template“ ein neues Repository daraus erzeugen.
2. Im neuen Ordner `claude` starten.
3. `/setup` ausführen.

`/setup` fragt Projektname, Kürzel und Bauart ab, erkennt Stack und Befehle, schreibt
`.claude/projekt.md`, legt `docs/`, `.gitignore` und das Git-Repository an und erzeugt
auf Wunsch ein lauffähiges Grundgerüst.

Das Template ist selbst ein Git-Repository, damit seine Pflege versioniert ist. Seine
Historie gehört nicht in neue Projekte: Wurde `.git` versehentlich mitkopiert, erkennt
`/setup` das und bietet an, mit einer frischen Historie zu beginnen.

## Was drin ist

```
CLAUDE.md                     Dauerregeln: Sprache, Code, Architektur, Tests
.claude/
  projekt.md                  einziger projektspezifischer Ort (von /setup gefüllt)
  settings.json               Freigaben, damit nicht jeder Testlauf nachfragt
  skills/
    setup/                    Projekt einrichten
    architecture/             DDD und Onion - Schichten, Bausteine, Anti-Patterns
    commit/                   Commit mit Gate
    rpi-research/             Codebasis untersuchen
    rpi-plan/                 Plan erstellen
    rpi-implement/            Plan umsetzen
    grill-me/                 Vorhaben auf Herz und Nieren prüfen
docs/
  notes.txt                   TODO-Liste des Nutzers
```

## Arbeitsablauf

```
/setup                      einmal zu Beginn
   |
/rpi-research <Frage>       Bestehendes verstehen        -> docs/agents/research/
   |
/rpi-plan <Vorhaben>        Plan erstellen               -> docs/agents/plans/
   |
/rpi-implement <Plan>       Plan Phase für Phase umsetzen
   |
/commit                     Format, Lint, Tests, Architektur, Secrets -> Commit
```

`/grill-me <Vorhaben>` lässt sich jederzeit dazwischenschieben, wenn ein Entwurf erst
noch auseinandergenommen werden soll.

## Festgelegte Arbeitsweise

- **Sprache** — Gespräch, Skills und Dokumente auf Deutsch; Code, Bezeichner und
  Commit-Nachrichten auf Englisch.
- **Architektur** — Domain-Driven Design mit Onion-Architektur, fachlicher Kontext vor
  Schicht. Über `Bauart: schlank` in `.claude/projekt.md` abwählbar.
- **Code** — so sprechend, dass keine Kommentare nötig sind. Einzige Ausnahme: ein
  Warum-Kommentar mit überprüfbarer Quelle, wenn der Grund ausserhalb des Codes liegt.
- **Tests** — test-getrieben in `domain` und `application`, dort ohne Framework und ohne
  Mockito; aussen pragmatisch.
- **Commits** — `KUERZEL-NNN > type: subject` mit Fusszeile `(committed by agent)`, nur
  bei grünem Gate.

## Template pflegen

Änderungen an der Arbeitsweise gehören in dieses Template, nicht in einzelne Projekte.
`CLAUDE.md` und die Skills sind projektunabhängig und lassen sich in bestehende Projekte
kopieren, ohne `.claude/projekt.md` zu berühren.
