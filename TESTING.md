# Tests und Entwicklungsstand

## Welche Version wird verwendet?

Ein Commit auf `main` aktualisiert weder eine bereits installierte Erweiterung
noch den lokalen Helfer. Auch ein vorhandenes ZIP bleibt unverändert.

Die Online-Einrichtung verwendet einen festgelegten, geprüften Quellstand.
Sie lädt nicht automatisch die neuesten Änderungen von `main`.
Für einen neuen Helferstand müssen Quellverweis und Integritätsprüfung gemeinsam
aktualisiert und die Installation separat geprüft werden. Den Quellverweis nicht
allein auf `main` ändern.

## Automatisierte Tests

Die Befehle im Stammordner dieses Repositorys ausführen, nicht im übergeordneten
Ordner mehrerer Kelvani-Projekte.

Voraussetzungen: Node.js mit Unterstützung für `node --test` und eine Python-
Umgebung mit den Abhängigkeiten aus `native/requirements.txt` (oder den bereits
vorbereiteten lokalen Dateien in `native/vendor`). Für die JavaScript-Tests
werden keine npm-Pakete benötigt.

```powershell
node --test tests/*.test.js
python -B -m unittest discover -s native -p "test_*.py"
```

Falls Python unter Windows nur über den Launcher verfügbar ist, den zweiten
Befehl mit `py -3 -B -m unittest discover -s native -p "test_*.py"` ausführen.
Dabei muss dieselbe Python-Umgebung die Helfer-Abhängigkeiten finden können.

Die nativen Tests erstellen vorübergehend Testordner unter `native`.
Das Verzeichnis muss deshalb beschreibbar sein. Sie ersetzen die Aufrufe für
YouTube-Prüfung, Downloads und Ordnerauswahl durch Testobjekte; sie starten
keinen echten YouTube-Download und öffnen keinen Ordnerdialog.

## Grenzen der Prüfung

Bestandene Tests belegen das Verhalten der getesteten Funktionen und
simulierten Browser-/Helferverbindungen. Sie bestätigen keine erfolgreiche
Installation auf einem anderen Rechner und keinen aktuellen Download von
YouTube.

Vor einem Release zusätzlich in Chrome oder Edge prüfen: Erweiterung aus
einem dauerhaft vorhandenen Ordner laden, Helferverbindung prüfen, verfügbare
Formate eines öffentlichen Videos abfragen und einen berechtigten Download
testen. Abbruch, erneuter Versuch und gewählter Zielordner gehören ebenfalls
zur manuellen Prüfung. Keine Zugangsdaten oder privaten Videos für Tests verwenden.
