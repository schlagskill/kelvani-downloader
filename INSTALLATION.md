# KelvaniDownloader 0.1.3

1. Die alte KelvaniDownloader Erweiterung in Edge oder Chrome deaktivieren oder entfernen. Sonst kann ihr altes grosses Dialogfenster weiterhin erscheinen.
2. Das neue ZIP an einen dauerhaften Ort entpacken. In edge://extensions oder chrome://extensions den Entwicklermodus aktivieren und den Hauptordner mit manifest.json als entpackte Erweiterung laden. Nicht den Unterordner native laden.
3. INSTALLIEREN.cmd im Hauptordner einmal starten. Die Erweiterungs ID wird automatisch aus dem Paket erkannt. Eine private Python Umgebung und die benoetigten Medienkomponenten werden automatisch eingerichtet. Auf diesem Rechner ist Node.js bereits vorhanden; auf anderen Rechnern muss Node.js verfuegbar sein.
4. Erweiterung neu laden und die YouTube Seite aktualisieren. Herunterladen oeffnet nun ein kleines Menue direkt unter dem Button mit Format, Aufloesung und Download. Kein grosses Fenster und keine Abdunklung.

## Einrichtung und Fehlerbehebung
Die Installation benoetigt eine Internetverbindung und Windows 64 Bit. Python wird von python.org geladen und anhand einer SHA256 Pruefsumme kontrolliert. pip wird von bootstrap.pypa.io geladen, die Medienkomponenten aus dem Python Paketverzeichnis. Es wird keine globale Python Installation veraendert.

Die benoetigten Dateien liegen nach Einrichtung unter %LOCALAPPDATA%/KelvaniDownloader. Sie liegen ausserhalb der Browsererweiterung, damit Python Dateien das Laden der Erweiterung nicht stoeren. Der lokale Helfer wird nur fuer die feste Erweiterungs ID dieses Pakets unter dem aktuellen Windows Benutzer in Chrome und Edge registriert. Es ist keine zweite Erweiterung und kein Administratorkonto noetig.

Falls Einrichtung fehlt angezeigt wird: INSTALLIEREN.cmd starten und danach im Menue Erneut pruefen waehlen. Leere, nicht benutzbare Formatfelder werden bei fehlender Verbindung ausgeblendet. Bei Manifest fehlt den entpackten Hauptordner mit manifest.json auswaehlen. Die alten separaten Helfer ZIPs niemals als Erweiterung laden.

## Technische Grenze
MP3/WAV Umwandlung und das Zusammenfuehren getrennter Video und Tonspuren benoetigen den lokalen Helfer weiterhin. Das gemeinsame Paket ist keine reine Browserumwandlung und verwendet keinen fremden Downloadserver. Es werden nur tatsaechlich gelieferte Aufloesungen angeboten.

## Pruefstand
Die automatische Einrichtung wurde mit einer frischen privaten Python Umgebung in einem isolierten Testordner ausgefuehrt, ohne die Browserregistrierung zu veraendern. Die Menueposition, Formatwahl, Fehlerbehandlung und Schliessen wurden geprueft. Mit der neu eingerichteten Python Umgebung wurde ueber den echten Windows Starter eine Formatpruefung und ein MP4 Download abgeschlossen und die Datei vollstaendig fehlerfrei dekodiert. Medienprozesse haben einen getrennten Eingabekanal und blockieren die Browserkommunikation nicht mehr. Die komplette Registrierung und Zusammenarbeit mit der installierten Erweiterung in Edge ist weiterhin nicht als vollstaendig nachgewiesen zu verstehen. Weitere Ergebnisse stehen im Pruefbericht neben dem Paket.

Bei bereits eingerichteter Version: den Erweiterungsordner aktualisieren und INSTALLIEREN.cmd noch einmal ausfuehren. Das aktualisiert auch den bereits installierten lokalen Helfer. Es wird keine zweite Erweiterung installiert. Der Einrichtungshinweis mit Kopierbutton steht im YouTube Menue und im Erweiterungs Popup.
