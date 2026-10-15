"""Prepare explicit Windows installation files. Does not modify the registry."""
from pathlib import Path
import argparse,json,re,sys

def prepare(extension_id,python_path,folder):
 if not re.fullmatch('[a-p]{32}',extension_id):raise ValueError('Die Erweiterungs ID muss aus 32 Zeichen a bis p bestehen.')
 folder=Path(folder).resolve();python_path=Path(python_path).resolve()
 if not python_path.is_file():raise ValueError('Python wurde nicht gefunden.')
 if any(c in str(python_path)+str(folder) for c in ['%','!','\n','\r','"']):raise ValueError('Nicht unterstützter Installationspfad.')
 launcher=folder/'kelvani-host.cmd';launcher.write_bytes(('@echo off\r\nchcp 65001 >nul\r\n"'+str(python_path)+'" "'+str(folder/'host.py')+'" %*\r\n').encode('utf-8'))
 manifest=folder/'net.kelvani.downloader.json';manifest.write_text(json.dumps({'name':'net.kelvani.downloader','description':'Kelvani Downloader lokaler Helfer','path':str(launcher),'type':'stdio','allowed_origins':['chrome-extension://'+extension_id+'/']},indent=2),encoding='utf-8')
 # Installer is intentionally generated as a reviewable artifact, never executed here.
 escaped=str(manifest).replace("'","''")
 install=folder/'Installieren.ps1';install.write_text("$ErrorActionPreference = 'Stop'\n"+"$manifestPath = '"+escaped+"'\n"+"foreach ($browserKey in @('HKCU:\\Software\\Google\\Chrome\\NativeMessagingHosts\\net.kelvani.downloader','HKCU:\\Software\\Microsoft\\Edge\\NativeMessagingHosts\\net.kelvani.downloader')) {\n New-Item -Path $browserKey -Force | Out-Null\n Set-Item -Path $browserKey -Value $manifestPath\n}\nWrite-Host 'Kelvani Helfer registriert.'\n",encoding='utf-8')
 return manifest
if __name__=='__main__':
 parser=argparse.ArgumentParser();parser.add_argument('--extension-id',required=True);parser.add_argument('--python',default=sys.executable);args=parser.parse_args();print(prepare(args.extension_id,args.python,Path(__file__).parent))
