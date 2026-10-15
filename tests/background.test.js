import test from 'node:test';
import assert from 'node:assert/strict';
let sequence=0;
async function boot(){
 const connections=[];let listener;
 globalThis.chrome={runtime:{id:'kelvani-test',onMessage:{addListener(fn){listener=fn;}},connectNative(){
  const connection={sent:[],onMessage:{addListener(fn){connection.receive=fn;}},onDisconnect:{addListener(fn){connection.disconnect=fn;}},postMessage(message){if(connection.fail)throw new Error('Port geschlossen');connection.sent.push(message);}};
  connections.push(connection);return connection;
 }}};
 await import('../background.js?test='+sequence++);
 const sender={id:'kelvani-test'};
 const send=(message,origin=sender)=>new Promise(resolve=>listener(message,origin,resolve));
 return {connections,send,listener,sender};
}
const tick=()=>new Promise(resolve=>setImmediate(resolve));
test('an older installed helper is identified before inspecting media',async()=>{
 const {connections,send}=await boot();const response=send({action:'status'});
 connections[0].receive({...connections[0].sent[0],ok:true,ffmpeg:true});
 const result=await response;assert.equal(result.ok,false);assert.equal(result.updateRequired,true);assert.match(result.error,/Update/);
});
test('parallel native responses are matched even when arriving out of order',async()=>{
 const {connections,send}=await boot();const first=send({action:'status'}),second=send({action:'status'});
 const port=connections[0];assert.equal(connections.length,1);
 port.receive({...port.sent[1],ok:true,compatibilityVersion:3,marker:2});port.receive({...port.sent[0],ok:true,compatibilityVersion:3,marker:1});
 assert.equal((await first).marker,1);assert.equal((await second).marker,2);
});
test('foreign senders and foreign page origins never reach the helper',async()=>{
 const {connections,listener}=await boot();
 assert.equal(listener({action:'status'},{id:'foreign'},()=>assert.fail()),false);
 assert.equal(listener({action:'status'},{id:'kelvani-test',tab:{},url:'https://example.com/'},()=>assert.fail()),false);
 assert.equal(connections.length,0);
});
test('invalid requests are rejected before connecting',async()=>{
 const {connections,send}=await boot();assert.equal((await send({action:'cancel',jobId:'invalid'})).ok,false);assert.equal(connections.length,0);
});
test('disconnect rejects pending work and a later request reconnects',async()=>{
 const {connections,send}=await boot();const first=send({action:'status'});connections[0].disconnect();
 assert.equal((await first).ok,false);
 const second=send({action:'status'});assert.equal(connections.length,2);
 connections[0].disconnect();connections[1].receive({...connections[1].sent[0],ok:true,compatibilityVersion:3});
 assert.equal((await second).ok,true);
});
test('a synchronous port failure clears its pending request',async()=>{
 const {connections,send}=await boot();const first=send({action:'status'});connections[0].receive({...connections[0].sent[0],ok:true,compatibilityVersion:3});await first;
 connections[0].fail=true;const failed=await send({action:'status'});assert.equal(failed.ok,false);assert.match(failed.error,/Port geschlossen/);
 connections[0].fail=false;const retry=send({action:'status'});await tick();connections[0].receive({...connections[0].sent.at(-1),ok:true,compatibilityVersion:3});assert.equal((await retry).ok,true);
});
