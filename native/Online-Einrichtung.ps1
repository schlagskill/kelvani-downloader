$ErrorActionPreference = 'Stop'
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
$setupFolder = Join-Path ([IO.Path]::GetTempPath()) ('KelvaniDownloader-' + [guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $setupFolder | Out-Null
$archive = Join-Path $setupFolder 'komponenten.zip'
Write-Host 'Downloadkomponente wird geladen und geprueft ...'
Invoke-WebRequest -UseBasicParsing -Uri 'https://codeload.github.com/schlagskill/kelvani-downloader/zip/e6184f04e388036506f88e24dc5fc68fb7f9344b' -OutFile $archive
if ((Get-FileHash -LiteralPath $archive -Algorithm SHA256).Hash -ne 'E4AA059AE4789DE725247C85F2736A64196360A279E424090A6657ADACBAAA1A') { throw 'Die Pruefsumme stimmt nicht. Einrichtung abgebrochen.' }
Expand-Archive -LiteralPath $archive -DestinationPath $setupFolder
$installer = Join-Path $setupFolder 'kelvani-downloader-e6184f04e388036506f88e24dc5fc68fb7f9344b/native/Install-Downloader.ps1'
& $installer
if ($LASTEXITCODE -ne 0) { throw 'Die Einrichtung konnte nicht abgeschlossen werden.' }
Write-Host 'Fertig. Erweiterung neu laden und YouTube aktualisieren.'
