param([string]$ExtensionId, [string]$Python, [string]$DataDirectory, [switch]$PrepareOnly)
& (Join-Path $PSScriptRoot "Install-Downloader.ps1") @PSBoundParameters
