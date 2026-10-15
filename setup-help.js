(() => {
 const command='.\\INSTALLIEREN.cmd';
 function create({update=false}={}){
  const section=document.createElement('section');section.className='kd-setup';
  const title=document.createElement('strong');title.textContent=update?'Downloadkomponente aktualisieren':'Einmalig vorbereiten';
  const intro=document.createElement('p');intro.textContent=update?'Deine lokale Downloadkomponente ist noch eine ältere Version. Führe die Einrichtung aus dem neuen Paket erneut aus; sie ersetzt die alte Version.':'Bevor du etwas herunterladen kannst, richte die lokale Downloadkomponente ein.';
  const steps=document.createElement('ol');
  for(const text of ['Im entpackten aktuellen KelvaniDownloader Ordner das Terminal öffnen.','Diesen Befehl dort einfügen und mit Enter ausführen.','Danach die Erweiterung neu laden und YouTube aktualisieren.']){const item=document.createElement('li');item.textContent=text;steps.append(item);}
  const code=document.createElement('input');code.className='kd-setup-command';code.readOnly=true;code.value=command;code.setAttribute('aria-label','Einrichtungsbefehl');
  const button=document.createElement('button');button.type='button';button.className='kd-copy';button.textContent='Befehl kopieren';
  const feedback=document.createElement('p');feedback.className='kd-copy-feedback';feedback.setAttribute('role','status');feedback.hidden=true;
  button.onclick=async()=>{try{await navigator.clipboard.writeText(command);button.textContent='Kopiert';feedback.textContent='Im Terminal des Erweiterungsordners einfügen.';}catch{code.focus();code.select();feedback.textContent='Befehl markieren und mit Strg+C kopieren.';}feedback.hidden=false;};
  section.append(title,intro,steps,code,button,feedback);return section;
 }
 globalThis.KelvaniSetupHelp={create};
})();
