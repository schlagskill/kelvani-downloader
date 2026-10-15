import {request} from './core.js';
let port;
const pending=new Map();
function settle(requestId,error,value){
 const entry=pending.get(requestId);
 if(!entry)return;
 clearTimeout(entry.timer);pending.delete(requestId);
 if(error)entry.reject(error);else entry.resolve(value);
}
function connect(){
 if(port)return port;
 const connection=chrome.runtime.connectNative('net.kelvani.downloader');
 port=connection;
 connection.onMessage.addListener(message=>{
  if(pending.get(message.requestId)?.connection===connection)settle(message.requestId,null,message);
 });
 connection.onDisconnect.addListener(()=>{
  if(port===connection)port=null;
  for(const [id,entry] of pending){
   if(entry.connection===connection)settle(id,new Error('Der lokale Helfer ist nicht erreichbar.'));
  }
 });
 return connection;
}
function native(payload){
 return new Promise((resolve,reject)=>{
  let requestId;
  try{
   const connection=connect();requestId=crypto.randomUUID();
   const timer=setTimeout(()=>settle(requestId,new Error('Der Helfer antwortet nicht.')),payload.action==='inspect'?90000:15000);
   pending.set(requestId,{resolve,reject,timer,connection});
   connection.postMessage({...payload,requestId});
  }catch(error){
   if(requestId&&pending.has(requestId))settle(requestId,error);else reject(error);
  }
 });
}
chrome.runtime.onMessage.addListener((message,sender,reply)=>{
 if(sender.id!==chrome.runtime.id)return false;
 if(sender.tab&&!sender.url?.startsWith('https://www.youtube.com/'))return false;
 let payload;try{payload=request(message);}catch(error){reply({ok:false,error:error.message});return false;}
 native(payload).then(result=>{
  if(payload.action==='status'&&result.ok&&result.compatibilityVersion!==2){reply({ok:false,updateRequired:true,error:'Die lokale Downloadkomponente braucht ein Update.'});return;}
  reply(result);
 }).catch(error=>reply({ok:false,error:error.message+' Bitte den Kelvani Helfer prüfen.'}));return true;
});
