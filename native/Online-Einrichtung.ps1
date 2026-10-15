$ErrorActionPreference = 'Stop'
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
$setupFolder = Join-Path ([IO.Path]::GetTempPath()) ('KelvaniDownloader-' + [guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $setupFolder | Out-Null
$archive = Join-Path $setupFolder 'komponenten.zip'
Write-Host 'Downloadkomponente wird geladen und geprueft ...'
Invoke-WebRequest -UseBasicParsing -Uri 'https://codeload.github.com/schlagskill/kelvani-downloader/zip/2b1480a618d73d13dfcd0e316139db0c1796f008' -OutFile $archive
if ((Get-FileHash -LiteralPath $archive -Algorithm SHA256).Hash -ne 'E21C5C516592FD0AA81C3B5B078937A7D563775DF89E2848F00DEE50E67E4A60') { throw 'Die Pruefsumme stimmt nicht. Einrichtung abgebrochen.' }
Expand-Archive -LiteralPath $archive -DestinationPath $setupFolder
$installer = Join-Path $setupFolder 'kelvani-downloader-2b1480a618d73d13dfcd0e316139db0c1796f008/native/Install-Downloader.ps1'
& $installer
if ($LASTEXITCODE -ne 0) { throw 'Die Einrichtung konnte nicht abgeschlossen werden.' }
Write-Host 'Fertig. Erweiterung neu laden und YouTube aktualisieren.'
