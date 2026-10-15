# Externe Komponenten

Der Helfer verwendet separat installierte Komponenten. Sie werden nicht in diesem Quellpaket gebündelt. Setup-Helfer.ps1 installiert sie aus dem öffentlichen Python Paketverzeichnis.

* yt-dlp und yt-dlp-ejs: https://github.com/yt-dlp/yt-dlp und https://github.com/yt-dlp/ejs
* imageio-ffmpeg samt FFmpeg Laufzeit: https://github.com/imageio/imageio-ffmpeg und https://ffmpeg.org/
* Weitere Python Abhängigkeiten und deren Lizenztexte befinden sich nach Installation in %LOCALAPPDATA%/KelvaniDownloader/runtime/Lib/site-packages, einschließlich der jeweiligen dist-info Verzeichnisse.
* Node.js ist eine separat installierte Laufzeit: https://nodejs.org/

Die Lizenztexte der verwendeten Komponenten bleiben in ihrer Installation erhalten. Im Entwicklungsordner vorhandene vendor Testabhängigkeiten sind nicht Teil dieses Pakets.

Die automatische Einrichtung verwendet die offizielle portable Python Laufzeit von https://www.python.org/downloads/windows/ und pip von https://bootstrap.pypa.io/get-pip.py. Python Lizenztexte bleiben im privaten Laufzeitordner erhalten.
