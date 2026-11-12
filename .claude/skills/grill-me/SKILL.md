---
name: grill-me
description: Befragt den Nutzer unnachgiebig zu einem Plan oder Entwurf, bis ein gemeinsames Verständnis erreicht ist, und arbeitet dabei jeden Ast des Entscheidungsbaums ab. Nutze diesen Skill, wenn ein Vorhaben auf Herz und Nieren geprüft werden soll. Deutsche Auslöser - grill mich, löchere mich, durchleuchte meinen Plan, stell meinen Entwurf infrage. Englische Auslöser - grill me, stress-test my plan.
---

Befrage mich unnachgiebig zu jedem Aspekt dieses Vorhabens, bis wir ein gemeinsames
Verständnis erreicht haben. Arbeite jeden Ast des Entscheidungsbaums ab und löse
Abhängigkeiten zwischen Entscheidungen einzeln auf.

Antworte auf Deutsch.

Stelle die Fragen **einzeln**, eine nach der anderen.

Gib zu jeder Frage deine **empfohlene Antwort** an, mit Begründung und den Nachteilen
der Alternativen.

Lässt sich eine Frage durch einen Blick in den Code beantworten, sieh im Code nach,
statt zu fragen.

Sei visuell: Nutze ASCII-Skizzen und Bäume für Struktur-, Architektur- und
Oberflächenentscheidungen. Das macht Unterschiede sofort begreifbar.

## Vorschläge immer untereinander

Der Nutzer arbeitet mit einem Screen-Reader. Mehrere Vorschläge, Alternativen oder
Varianten stehen deshalb **niemals nebeneinander**, sondern **immer untereinander**:

- Jede Alternative bekommt einen eigenen Abschnitt mit Überschrift oder Nummer, darunter
  Beschreibung, Vor- und Nachteile als Liste.
- Keine Vergleichstabellen, in denen Alternativen Spalten sind.
- ASCII-Skizzen verschiedener Varianten nie nebeneinander, sondern jede einzeln
  untereinander mit eigener Überschrift.
- Beim Werkzeug `AskUserQuestion` das Feld `preview` nicht verwenden, denn damit stellt
  die Oberfläche Optionen und Vorschau nebeneinander dar. Skizzen gehören stattdessen
  untereinander in den Text vor der Frage.

Nimm keine Annahme stillschweigend hin. Triffst du beim Formulieren einer Frage selbst
eine Annahme, mach sie sichtbar und stell sie zur Wahl.

Fasse am Ende alle getroffenen Entscheidungen zusammen und nenne die Annahmen, die du
ohne Rückfrage umsetzen würdest.
