import {videoUrl} from './core.js';
import './setup-help.js';
import './language.js';
globalThis.KelvaniLanguage.startLanguage();
const $=s=>document.querySelector(s);let url;
const preview=!globalThis.chrome?.runtime?.id;
async function directory(action='preferences'){
 const status=$('#directory-status');$('#choose-directory').disabled=true;$('#reset-directory').disabled=true;
 try{if(preview){status.textContent='Designvorschau. Downloads nur in der installierten Erweiterung.';return;}
 const helper=await chrome.runtime.sendMessage({action:'status'});if(!helper?.ok){showSetup(helper?.updateRequired);toggleSettings(false);return;}
 const result=await chrome.runtime.sendMessage({action});if(!result?.ok)throw Error(result?.error||'Ordner konnte nicht gespeichert werden.');$('#directory-path').textContent=result.directory;status.textContent='';
 }catch(error){status.textContent=error.message;}finally{$('#choose-directory').disabled=false;$('#reset-directory').disabled=false;}
}
function toggleSettings(open){document.body.classList.toggle('settings-open',open);$('#settings-panel').hidden=!open;$('#settings-toggle').setAttribute('aria-expanded',String(open));if(open){directory();$('#settings-back').focus();}else $('#settings-toggle').focus();}
$('#settings-toggle').onclick=()=>toggleSettings($('#settings-panel').hidden);
$('#settings-back').onclick=()=>toggleSettings(false);
$('#choose-directory').onclick=()=>directory('chooseDirectory');$('#reset-directory').onclick=()=>directory('resetDirectory');
$('#url-form').addEventListener('submit',event=>{event.preventDefault();loadNative($('#video-url').value.trim());});
$('#video-url').addEventListener('input',()=>{url=undefined;$('#download').disabled=true;$('#status').textContent='';});
$('#format').addEventListener('change',()=>$('#quality-label').hidden=$('#format').value!=='mp4');
function showSetup(update=false){
 $('#setup-container')?.remove();
 for(const element of [$('#url-form'),$('#title'),$('#format').closest('label'),$('#quality-label'),$('#download'),$('#status')])element.hidden=true;
 const section=document.createElement('div');section.id='setup-container';section.append(globalThis.KelvaniSetupHelp.create({update}));
 const retry=document.createElement('button');retry.textContent='Erneut prüfen';retry.className='kd-retry';retry.onclick=()=>preview?location.reload():loadNative();section.append(retry);document.querySelector('main').prepend(section);
}
async function loadNative(manualUrl){
 $('#download').disabled=true;
 url=undefined;$('#check-url').disabled=true;$('#video-url').disabled=true;
 try{
  const helper=await chrome.runtime.sendMessage({action:'status'});
  if(!helper?.ok||!helper.ffmpeg){showSetup(helper?.updateRequired);return;}
  $('#setup-container')?.remove();
  for(const element of [$('#url-form'),$('#title'),$('#format').closest('label'),$('#download'),$('#status')])element.hidden=false;
  $('#quality-label').hidden=$('#format').value!=='mp4';
  const active=helper.jobs?.[0];
  if(active){$('#title').textContent='Laufender Download';$('#format').value=active.format;$('#format').disabled=true;try{await followJob(active.jobId,$('#status'));}finally{$('#format').disabled=false;}}
  const [tab]=manualUrl===undefined?await chrome.tabs.query({active:true,currentWindow:true}):[];
  try{url=videoUrl(manualUrl===undefined?tab?.url:manualUrl);}catch(error){$('#title').textContent='YouTube-Link einfügen';$('#status').textContent=manualUrl===undefined?'':error.message;return;}
  $('#video-url').value=url;
  $('#title').textContent=tab?.title||'YouTube Video';$('#status').textContent='Verfügbare Formate werden geprüft …';
  const info=await chrome.runtime.sendMessage({action:'inspect',url});if(!info.ok)throw new Error(info.error);
  $('#quality').replaceChildren();
  for(const h of info.qualities){const option=document.createElement('option');option.value=h;option.textContent=h===2160?'4K':h+'p';$('#quality').append(option);}
  $('#format').querySelector('[value=mp4]').disabled=!info.qualities.length;
  if(!info.qualities.length)$('#format').value='mp3';
  $('#quality-label').hidden=$('#format').value!=='mp4';$('#download').disabled=false;$('#status').textContent='';
 }catch(error){$('#status').hidden=false;$('#status').textContent=error.message;}finally{$('#check-url').disabled=false;$('#video-url').disabled=false;}
}
if(preview){
 if(new URL(location.href).searchParams.has('setup'))showSetup();
 else try{const info=await fetch('../kelvani-night/downloader-hd-inspect.json').then(r=>r.json());$('#title').textContent=info.title;for(const h of info.qualities){const option=document.createElement('option');option.value=h;option.textContent=h===2160?'4K':h+'p';$('#quality').append(option);}$('#status').textContent='Designvorschau. Downloads nur in der installierten Erweiterung.';}catch(error){$('#status').textContent=error.message;}
}else await loadNative();
$('#download').addEventListener('click',async()=>{
 $('#download').disabled=true;$('#status').textContent='Download läuft …';
 try{const result=await chrome.runtime.sendMessage({action:'download',url,format:$('#format').value,height:Number($('#quality').value)});if(!result.ok)throw new Error(result.error);await followJob(result.jobId,$('#status'));}catch(error){$('#status').textContent=error.message;}finally{$('#download').disabled=false;}
});

async function followJob(jobId,status){
 const cancel=document.createElement('button');cancel.textContent='Abbrechen';cancel.className='kd-cancel';status.after(cancel);
 cancel.onclick=async()=>{cancel.disabled=true;try{const result=await chrome.runtime.sendMessage({action:'cancel',jobId});if(!result.ok)throw new Error(result.error||'Abbrechen fehlgeschlagen.');}catch(error){status.textContent=error.message;cancel.disabled=false;}};
 try{for(;;){
  if(!status.isConnected)break;
  const info=await chrome.runtime.sendMessage({action:'job',jobId});
  if(!info.ok)throw new Error(info.error);
  if(info.phase==='done'){status.textContent=info.defaultDirectory===false?'Im gewählten Ordner gespeichert':'Gespeichert im Downloads-Ordner';break;}
  if(info.phase==='error')throw new Error(info.error||'Download fehlgeschlagen.');
  if(info.phase==='cancelled'){status.textContent='Download abgebrochen.';break;}
  status.textContent='Download läuft · '+Math.round(info.percent||0)+' %';
  await new Promise(resolve=>setTimeout(resolve,1000));
 }}finally{cancel.remove();}
}
