param([string]$ExtensionId, [string]$Python, [string]$DataDirectory, [switch]$PrepareOnly)
$ErrorActionPreference = 'Stop'
$nativeDirectory = $PSScriptRoot
$extensionManifest = Get-Content -LiteralPath (Join-Path $nativeDirectory '../manifest.json') -Raw | ConvertFrom-Json
$sha = [System.Security.Cryptography.SHA256]::Create()
try { $digest = $sha.ComputeHash([Convert]::FromBase64String($extensionManifest.key)) } finally { $sha.Dispose() }
$detectedId = -join ($digest[0..15] | ForEach-Object { [char](97 + ($_ -shr 4)); [char](97 + ($_ -band 15)) })
if ($ExtensionId -and $ExtensionId -cne $detectedId) { throw 'Die ID passt nicht zu dieser Version. Bitte den Hauptordner dieses Pakets als Erweiterung laden.' }
$ExtensionId = $detectedId
if (-not $DataDirectory) { $DataDirectory = Join-Path $env:LOCALAPPDATA 'KelvaniDownloader' }
New-Item -ItemType Directory -Force -Path $DataDirectory | Out-Null
Write-Host ('KelvaniDownloader einrichten: ' + $ExtensionId)
if (-not (Get-Command node -ErrorAction SilentlyContinue)) { throw 'Node.js wurde nicht gefunden. Bitte Node.js installieren und dieses Fenster danach neu oeffnen.' }
if (-not $Python) {
 $runtimeDirectory = Join-Path $DataDirectory 'runtime'
 $Python = Join-Path $runtimeDirectory 'python.exe'
 if (-not (Test-Path -LiteralPath $Python)) {
  if (-not [Environment]::Is64BitOperatingSystem) { throw 'Dieses Paket benoetigt Windows 64 Bit.' }
  Write-Host 'Lokale Python Umgebung wird von python.org geladen. Keine globale Python Installation.'
  New-Item -ItemType Directory -Force -Path $runtimeDirectory | Out-Null
  $runtimeZip = Join-Path $DataDirectory 'python-runtime.zip'
  Invoke-WebRequest -UseBasicParsing -Uri 'https://www.python.org/ftp/python/3.13.16/python-3.13.16-embed-amd64.zip' -OutFile $runtimeZip
  if ((Get-FileHash -LiteralPath $runtimeZip -Algorithm SHA256).Hash -ne '97DAE5274CC54867065E8D5A3226E48C35017ED332A0FDB0E27D5B5821961297') { throw 'Python Pruefsumme stimmt nicht. Installation abgebrochen.' }
  Expand-Archive -LiteralPath $runtimeZip -DestinationPath $runtimeDirectory -Force
 }
 $pathFile = Join-Path $runtimeDirectory 'python313._pth'
 $pathConfig = [IO.File]::ReadAllText($pathFile).Replace('#import site','import site')
 [IO.File]::WriteAllText($pathFile,$pathConfig,[Text.Encoding]::ASCII)
 & $Python (Join-Path $nativeDirectory 'check-runtime.py') pip
 if ($LASTEXITCODE -ne 0) {
  Write-Host 'Paketinstallation wird vorbereitet.'
  $bootstrap = Join-Path $runtimeDirectory 'get-pip.py'
  Invoke-WebRequest -UseBasicParsing -Uri 'https://bootstrap.pypa.io/get-pip.py' -OutFile $bootstrap
  & $Python $bootstrap --disable-pip-version-check --no-warn-script-location
  if ($LASTEXITCODE -ne 0) { throw 'pip konnte nicht eingerichtet werden.' }
 }
}
& $Python -m pip install --disable-pip-version-check --no-warn-script-location --requirement (Join-Path $nativeDirectory 'requirements.txt')
if ($LASTEXITCODE -ne 0) { throw 'Die Downloadkomponenten konnten nicht installiert werden.' }
& $Python (Join-Path $nativeDirectory 'check-runtime.py') media
if ($LASTEXITCODE -ne 0) { throw 'Die Downloadkomponenten sind nicht bereit.' }
$hostDirectory = Join-Path $DataDirectory 'host'
New-Item -ItemType Directory -Force -Path $hostDirectory | Out-Null
Copy-Item -LiteralPath (Join-Path $nativeDirectory 'host.py') -Destination (Join-Path $hostDirectory 'host.py') -Force
Copy-Item -LiteralPath (Join-Path $nativeDirectory 'prepare_install.py') -Destination (Join-Path $hostDirectory 'prepare_install.py') -Force
& $Python (Join-Path $hostDirectory 'prepare_install.py') --extension-id $ExtensionId --python $Python
if ($LASTEXITCODE -ne 0) { throw 'Installationsdateien konnten nicht erstellt werden.' }
if ($PrepareOnly) { Write-Host 'Testvorbereitung fertig. Keine Browserregistrierung ausgefuehrt.'; exit 0 }
& (Join-Path $hostDirectory 'Installieren.ps1')
Write-Host 'Fertig. Erweiterung neu laden und YouTube aktualisieren. Es ist keine zweite Erweiterung noetig.'
