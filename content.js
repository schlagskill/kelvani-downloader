async function sendToHelper(message){
 const runtime=globalThis.chrome?.runtime;
 const expired=()=>Object.assign(new Error('Die Erweiterung wurde aktualisiert. Lade YouTube einmal neu, damit die aktuelle Version verbunden wird.'),{code:'RELOAD_REQUIRED'});
 if(!runtime?.id||typeof runtime.sendMessage!=='function')throw expired();
 try{return await runtime.sendMessage(message);}catch(error){if(/extension context invalidated|receiving end does not exist|reading ['"]sendMessage|message port closed/i.test(error.message||''))throw expired();throw error;}
}
let mounted,hiddenNative;
function restoreNative(){if(hiddenNative){hiddenNative.element.hidden=hiddenNative.wasHidden;hiddenNative=null;}}
let panelCleanup;
function closePanel(restoreFocus=true){
 panelCleanup?.();panelCleanup=null;
 document.querySelector('.kelvani-download-panel')?.remove();
 mounted?.setAttribute('aria-expanded','false');
 if(restoreFocus)mounted?.focus();
}
async function showPanel(){
 if(document.querySelector('.kelvani-download-panel')){closePanel();return;}
 const panel=document.createElement('div');panel.className='kelvani-download-panel';panel.id='kelvani-download-options';panel.setAttribute('role','dialog');panel.setAttribute('aria-label','Downloadoptionen');panel.setAttribute('popover','auto');
 panel.innerHTML='<p class="kd-status" role="status">Formate laden …</p><div class="kd-fields" hidden><label>Format<select class="kd-format"><option value="mp4">MP4</option><option value="mp3">MP3</option><option value="wav">WAV</option></select></label><label class="kd-quality-label">Auflösung<select class="kd-quality"></select></label><button class="kd-start" disabled>Herunterladen</button></div><button class="kd-retry" hidden>Erneut prüfen</button>';
 document.body.append(panel);mounted?.setAttribute('aria-expanded','true');
 const controller=new AbortController(),options={signal:controller.signal};
 globalThis.KelvaniLanguage?.startLanguage(panel);
 const position=()=>{const anchor=mounted?.getBoundingClientRect();if(!anchor){closePanel(false);return;}const gap=8,edge=12,width=Math.min(280,window.innerWidth-2*edge);panel.style.width=width+'px';panel.style.left=Math.max(edge,Math.min(anchor.right-width,window.innerWidth-width-edge))+'px';panel.style.top=Math.max(edge,anchor.bottom+gap)+'px';panel.style.maxHeight=Math.max(100,window.innerHeight-anchor.bottom-gap-edge)+'px';};
 panelCleanup=()=>controller.abort();
 position();if(panel.showPopover)panel.showPopover();
 window.addEventListener('resize',position,options);window.addEventListener('scroll',position,{...options,capture:true});
 document.addEventListener('pointerdown',event=>{if(!panel.contains(event.target)&&!mounted?.contains(event.target))closePanel(false);},options);
 document.addEventListener('keydown',event=>{if(event.key==='Escape'){event.preventDefault();closePanel();}},options);
 panel.addEventListener('toggle',event=>{if(event.newState==='closed')closePanel(false);},options);
 const status=panel.querySelector('.kd-status'),format=panel.querySelector('.kd-format'),quality=panel.querySelector('.kd-quality'),start=panel.querySelector('.kd-start'),retry=panel.querySelector('.kd-retry'),fields=panel.querySelector('.kd-fields');const url=location.href;
 format.onchange=()=>panel.querySelector('.kd-quality-label').hidden=format.value!=='mp4';
 async function inspect(){
  panel.querySelector('.kd-setup')?.remove();start.disabled=true;fields.hidden=true;retry.hidden=true;retry.textContent='Erneut prüfen';retry.onclick=inspect;status.hidden=false;status.textContent='Formate laden …';quality.replaceChildren();
  try{
   const helper=await sendToHelper({action:'status'});
   if(!helper?.ok||!helper.ffmpeg){status.hidden=true;status.textContent='';panel.insertBefore(globalThis.KelvaniSetupHelp.create({update:helper?.updateRequired}),retry);retry.hidden=false;position();return;}
   const info=await sendToHelper({action:'inspect',url});if(!info.ok)throw new Error(info.error);
   if(!panel.isConnected)return;
   format.querySelector('[value="mp4"]').disabled=!info.qualities.length;
   for(const h of info.qualities){const option=document.createElement('option');option.value=h;option.textContent=h===2160?'4K':h+'p';quality.append(option);}
   if(!info.qualities.length)format.value='mp3';format.onchange();
   fields.hidden=false;status.textContent='';status.hidden=true;start.disabled=false;position();
  }catch(error){if(!panel.isConnected)return;status.textContent=error.message;retry.hidden=false;if(error.code==='RELOAD_REQUIRED'){retry.textContent='YouTube neu laden';retry.onclick=()=>location.reload();}position();}
 }
 retry.onclick=inspect;await inspect();
 start.onclick=async()=>{
  start.disabled=true;format.disabled=true;quality.disabled=true;status.hidden=false;status.textContent='Download startet …';
  try{const result=await sendToHelper({action:'download',url,format:format.value,height:Number(quality.value)});if(!result.ok)throw new Error(result.error);await followJob(result.jobId,status);}catch(error){status.textContent=error.message;}finally{start.disabled=false;format.disabled=false;quality.disabled=false;}
 };
}
function mount(){
 if(!location.pathname.startsWith('/watch'))return;
 const row=document.querySelector('#top-level-buttons-computed');if(!row||row.querySelector('.kelvani-download'))return;
 const button=document.createElement('button');button.className='kelvani-download';button.textContent='Herunterladen ↓';button.title='Herunterladen';button.setAttribute('aria-haspopup','dialog');button.setAttribute('aria-expanded','false');button.setAttribute('aria-controls','kelvani-download-options');button.addEventListener('click',showPanel);row.append(button);mounted=button;
 // Preserve YouTube's own action unless the helper is actually available.
 sendToHelper({action:'status'}).then(result=>{
  if(!result?.ok||!result.ffmpeg||!button.isConnected)return;
  const native=[...row.querySelectorAll('ytd-download-button-renderer')].find(el=>!el.contains(button));
  if(native){hiddenNative={element:native,wasHidden:native.hidden};native.hidden=true;}
 }).catch(()=>{});
}
const observer=new MutationObserver(()=>{if(!mounted?.isConnected)mount();});observer.observe(document.documentElement,{childList:true,subtree:true});
document.addEventListener('yt-navigate-finish',()=>{restoreNative();mounted?.remove();mounted=null;closePanel(false);mount();});mount();

async function followJob(jobId,status){
 const cancel=document.createElement('button');cancel.textContent='Abbrechen';cancel.className='kd-cancel';status.after(cancel);
 cancel.onclick=async()=>{cancel.disabled=true;try{const result=await sendToHelper({action:'cancel',jobId});if(!result.ok)throw new Error(result.error||'Abbrechen fehlgeschlagen.');}catch(error){status.textContent=error.message;cancel.disabled=false;}};
 try{for(;;){
  if(!status.isConnected)break;
  const info=await sendToHelper({action:'job',jobId});
  if(!info.ok)throw new Error(info.error);
  if(info.phase==='done'){status.textContent=info.defaultDirectory===false?'Im gewählten Ordner gespeichert':'Gespeichert im Downloads-Ordner';break;}
  if(info.phase==='error')throw new Error(info.error||'Download fehlgeschlagen.');
  if(info.phase==='cancelled'){status.textContent='Download abgebrochen.';break;}
  status.textContent='Download läuft · '+Math.round(info.percent||0)+' %';
  await new Promise(resolve=>setTimeout(resolve,1000));
 }}finally{cancel.remove();}
}

window.addEventListener('pagehide',()=>{observer.disconnect();closePanel(false);});
window.addEventListener('pageshow',()=>{observer.observe(document.documentElement,{childList:true,subtree:true});mount();});
