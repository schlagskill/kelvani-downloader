(()=>{
const pairs = [
 ['Einstellungen','Settings'],['Sprache','Language'],['Downloadordner','Download folder'],['Ordner wählen','Choose folder'],['Standard wiederherstellen','Reset to Downloads'],['Zurück','Back'],['Schließen','Close'],['Prüfen','Check'],['YouTube-URL','YouTube URL'],['YouTube-Link einfügen','Paste a YouTube link'],['Auflösung','Resolution'],['Herunterladen ↓','Download ↓'],['Herunterladen','Download'],['Format','Format'],['Video · MP4','Video · MP4'],['Audio · MP3','Audio · MP3'],['Audio · WAV','Audio · WAV'],['Gespeichert im Downloads-Ordner','Saved to the Downloads folder'],['Abbrechen','Cancel'],['Download abgebrochen.','Download cancelled.'],['Download läuft …','Downloading …'],['Laufender Download','Download in progress'],['YouTube Video','YouTube video'],['YouTube-Link einfügen','Paste a YouTube link'],['Öffne ein YouTube Video.','Open a YouTube video.'],['Verfügbare Formate werden geprüft …','Checking available formats …'],['Formate laden …','Loading formats …'],['Erneut prüfen','Check again'],['YouTube neu laden','Reload YouTube'],['Einmalig vorbereiten','Set up once'],['Downloadkomponente aktualisieren','Update download component'],['Befehl kopieren','Copy command'],['Kopiert','Copied'],['Einrichtungsbefehl','Setup command'],['Bevor du etwas herunterladen kannst, richte die lokale Downloadkomponente ein.','Before downloading, set up the local download component.'],['Deine lokale Downloadkomponente ist noch eine ältere Version. Aktualisiere sie mit diesem Befehl. Die benötigten Dateien werden automatisch heruntergeladen.','Your local download component needs an update. Run this command to download and install the required files automatically.'],['Windows-Terminal oder PowerShell öffnen. Der aktuelle Ordner ist egal.','Open Windows Terminal or PowerShell. Any folder is fine.'],['Befehl kopieren, im Terminal einfügen und Enter drücken. Die Dateien werden automatisch geladen und geprüft.','Copy the command, paste it into the terminal and press Enter. The files are downloaded and verified automatically.'],['Danach die Erweiterung neu laden und YouTube aktualisieren.','Then reload the extension and refresh YouTube.'],['In einem beliebigen Windows-Terminal einfügen und Enter drücken.','Paste into any Windows terminal and press Enter.'],['Befehl markieren und mit Strg+C kopieren.','Select the command and press Ctrl+C to copy.'],['Nur YouTube Video URLs sind erlaubt.','Only YouTube video URLs are supported.'],['Kein gültiges Video.','Not a valid video.'],['Die Erweiterung wurde aktualisiert. Lade YouTube einmal neu, damit die aktuelle Version verbunden wird.','The extension was updated. Refresh YouTube to connect the new version.'],['Der lokale Helfer ist nicht erreichbar.','The local download component is not available.'],['Der Helfer antwortet nicht.','The download component is not responding.'],['Bitte den Kelvani Helfer prüfen.','Please check the Kelvani download component.'],['Der Download ist gerade nicht verfügbar. Bitte erneut versuchen.','Download unavailable. Please try again.'],['Dieses Video ist derzeit nicht öffentlich verfügbar.','This video is not publicly available.'],['YouTube verlangt eine Anmeldung für dieses Video. Anmeldedaten werden nicht verwendet.','YouTube requires sign-in for this video. Login credentials are not used.'],['Dieses Format ist derzeit nicht verfügbar. Bitte die Formate erneut prüfen.','This format is unavailable. Check formats again.'],['YouTube antwortet nicht rechtzeitig. Bitte erneut versuchen.','YouTube did not respond in time. Please try again.'],['Eine lokale Datei ist nicht zugänglich. Bitte die Einrichtung einmal erneut ausführen.','A local file is inaccessible. Please run setup again.'],['Nur unter Windows verfügbar.','Available on Windows only.'],['Ordner konnte nicht gespeichert werden.','Could not save the folder.'],['Designvorschau. Downloads nur in der installierten Erweiterung.','Design preview. Downloads require the installed extension.'],['Standard: Downloads','Default: Downloads'],['Ordner wird geöffnet …','Opening folder picker …']
];
const dictionary=new Map(pairs);
let language=localStorage.getItem('kelvani-language')==='de'?'de':'en';
const original=new WeakMap();
function translate(value){
 if(language==='de')return new Map([...dictionary].map(([de,en])=>[en,de])).get(value)||value.replace(/^(.*) filters$/,'$1 Filter');
 if(dictionary.has(value))return dictionary.get(value);
 return value.replace(/^Download läuft · /,'Downloading · ').replace(/^Design-Vorschau · hier werden keine Anfragen blockiert\.$/,'Design preview · no requests are blocked here.').replace(/^Design-Vorschau · (.+) ist ein Beispiel\. Hier wird keine Werbung blockiert\.$/,'Design preview · $1 is an example. No ads are blocked here.').replace(/^(.*) Filter$/,'$1 filters');
}
function apply(root=document.body){
 const doc=root?.ownerDocument;if(!root?.isConnected||!doc?.defaultView?.document)return;
 doc.documentElement.lang=language;
 const walker=doc.createTreeWalker(root,4);
 while(walker.nextNode()){
  const node=walker.currentNode;if(node.parentElement.closest('script,style,textarea,input,option[data-language]'))continue;
  const current=node.nodeValue,trim=current.trim();let base=original.get(node);
  if(!base||base.rendered!==current){base={value:current};original.set(node,base);}
  const translated=translate(base.value.trim());const next=base.value.replace(base.value.trim(),translated);
  if(current!==next)node.nodeValue=next;base.rendered=next;
 }
 for(const el of root.querySelectorAll('[placeholder],[aria-label]'))for(const attr of ['placeholder','aria-label'])if(el.hasAttribute(attr))el.setAttribute(attr,translate(el.getAttribute(attr)));
 for(const select of root.querySelectorAll('[data-language-picker]'))select.value=language;
}
async function setLanguage(value){language=value==='de'?'de':'en';localStorage.setItem('kelvani-language',language);apply();if(globalThis.chrome?.storage?.local)await chrome.storage.local.set({language});}
function startLanguage(root=document.body){
 apply(root);let scheduled=false;const observer=new MutationObserver(()=>{if(scheduled)return;scheduled=true;Promise.resolve().then(()=>{scheduled=false;apply(root);});});observer.observe(root,{childList:true,characterData:true,subtree:true});
 for(const select of root.querySelectorAll('[data-language-picker]'))select.addEventListener('change',()=>setLanguage(select.value));
 if(globalThis.chrome?.storage?.local){chrome.storage.local.get('language').then(data=>{language=data.language==='de'?'de':'en';localStorage.setItem('kelvani-language',language);apply(root);});chrome.storage.onChanged.addListener((changes,area)=>{if(area==='local'&&changes.language){language=changes.language.newValue==='de'?'de':'en';apply(root);}});}
}

 dictionary.set('Im gew\u00e4hlten Ordner gespeichert','Saved to the selected folder');
 globalThis.KelvaniLanguage={dictionary,translate,startLanguage,setLanguage};
})();
