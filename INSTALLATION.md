# KelvaniDownloader 0.1.7

## Helfer einrichten oder aktualisieren
1. Im Erweiterungsmenü auf **Befehl kopieren** klicken.
2. Windows-Terminal oder PowerShell öffnen. Der aktuelle Ordner ist egal.
3. Einfügen und Enter drücken. Der Befehl lädt die Installationsdateien von GitHub, prüft ihre SHA256-Prüfsumme und richtet den Helfer ein oder aktualisiert ihn.
4. Danach die Erweiterung neu laden und YouTube aktualisieren.

Dafür wird kein heruntergeladenes oder entpacktes ZIP benötigt. Der Befehl funktioniert auch, wenn das ursprüngliche Installationspaket gelöscht wurde. Er ändert keine dauerhafte PowerShell-Ausführungsrichtlinie. Der Helfer wird pro Windows-Benutzer für Edge und Chrome registriert, ohne Administratorkonto.

## Browsererweiterung laden
Die Browsererweiterung selbst als ZIP herunterladen und an einen dauerhaften Ort entpacken. In edge://extensions oder chrome://extensions Entwicklermodus einschalten und den Ordner mit manifest.json als entpackte Erweiterung laden. Eine alte zweite Installation deaktivieren. Edge lädt den entpackten Ordner; diesen Ordner anschließend behalten. Nur das ZIP kann gelöscht werden. Den Unterordner native nicht als Erweiterung laden.

## Voraussetzungen und Grenzen
Windows 64 Bit, Internetverbindung und Node.js werden benötigt. Eine private Python-Umgebung wird von python.org geladen und per Prüfsumme geprüft; Medienkomponenten werden aus dem Python-Paketverzeichnis eingerichtet. Keine globale Python-Installation wird verändert. Die Helferdateien liegen unter %LOCALAPPDATA%/KelvaniDownloader, außerhalb des Erweiterungsordners.

Eine Browsererweiterung und ein lokales Hilfsprogramm für MP3/WAV sowie das Zusammenführen getrennter Video- und Tonspuren. Nur tatsächlich verfügbare Formate, keine DRM-Umgehung oder Zugangsdaten. Die komplette Zusammenarbeit mit der installierten Erweiterung in Edge ist noch nicht vollständig nachgewiesen. Isolierte Installation, native Kommunikation, ein öffentlicher MP4-Download und vollständige Dekodierung wurden zuvor geprüft.

Alternativ kann INSTALLIEREN.cmd aus einem vorhandenen aktuellen Paket verwendet werden.

Downloads werden direkt im Downloads-Ordner gespeichert, ohne Kelvani-Unterordner. Im Erweiterungsfenster kann ein YouTube-Videolink eingefuegt werden. Andere Websites werden abgewiesen.
