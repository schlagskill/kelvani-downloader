$ErrorActionPreference = 'Stop'
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
$setupFolder = Join-Path ([IO.Path]::GetTempPath()) ('KelvaniDownloader-' + [guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $setupFolder | Out-Null
$archive = Join-Path $setupFolder 'komponenten.zip'
Write-Host 'Downloadkomponente wird geladen und geprueft ...'
Invoke-WebRequest -UseBasicParsing -Uri 'https://codeload.github.com/schlagskill/kelvani-downloader/zip/3382245236bfe40a0a0813ce002d436a741855f1' -OutFile $archive
if ((Get-FileHash -LiteralPath $archive -Algorithm SHA256).Hash -ne 'AC0787CE6F5377792CEEECEB48B7B72F1F4307DCDA2BC8CFD76219A5F3ED0034') { throw 'Die Pruefsumme stimmt nicht. Einrichtung abgebrochen.' }
Expand-Archive -LiteralPath $archive -DestinationPath $setupFolder
$installer = Join-Path $setupFolder 'kelvani-downloader-3382245236bfe40a0a0813ce002d436a741855f1/native/Install-Downloader.ps1'
& $installer
if ($LASTEXITCODE -ne 0) { throw 'Die Einrichtung konnte nicht abgeschlossen werden.' }
Write-Host 'Fertig. Erweiterung neu laden und YouTube aktualisieren.'
