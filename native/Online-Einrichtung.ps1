$ErrorActionPreference = 'Stop'
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
$setupFolder = Join-Path ([IO.Path]::GetTempPath()) ('KelvaniDownloader-' + [guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $setupFolder | Out-Null
$archive = Join-Path $setupFolder 'komponenten.zip'
Write-Host 'Downloadkomponente wird geladen und geprueft ...'
Invoke-WebRequest -UseBasicParsing -Uri 'https://codeload.github.com/schlagskill/kelvani-downloader/zip/b5e404650ee433fc65df3a858d17bf7feffee18d' -OutFile $archive
if ((Get-FileHash -LiteralPath $archive -Algorithm SHA256).Hash -ne 'E61545D58B76808C1265D29DA528C192E131800740D91FD92C31C5D70A084BBB') { throw 'Die Pruefsumme stimmt nicht. Einrichtung abgebrochen.' }
Expand-Archive -LiteralPath $archive -DestinationPath $setupFolder
$installer = Join-Path $setupFolder 'kelvani-downloader-b5e404650ee433fc65df3a858d17bf7feffee18d/native/Install-Downloader.ps1'
& $installer
if ($LASTEXITCODE -ne 0) { throw 'Die Einrichtung konnte nicht abgeschlossen werden.' }
Write-Host 'Fertig. Erweiterung neu laden und YouTube aktualisieren.'
