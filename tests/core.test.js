import test from 'node:test';import assert from 'node:assert/strict';import {videoUrl,request,qualities} from '../core.js';
test('canonical URL drops page parameters',()=>assert.equal(videoUrl('https://www.youtube.com/watch?v=abcdefghijk&list=x'),'https://www.youtube.com/watch?v=abcdefghijk'));
test('foreign hosts and malformed ids rejected',()=>{for(const url of ['https://youtube.com.evil.test/watch?v=abcdefghijk','https://www.youtube.com/watch?v=abc','http://youtube.com/watch?v=abcdefghijk','https://user:pass@youtube.com/watch?v=abcdefghijk'])assert.throws(()=>videoUrl(url));});
test('request rejects arbitrary format and shell inputs',()=>{assert.throws(()=>request({action:'download',url:'https://youtu.be/abcdefghijk',format:'mp4;rm',height:1080}));assert.throws(()=>request({action:'download',url:'https://youtu.be/abcdefghijk',format:'mp4',height:9999}));});
test('qualities require real video and no DRM',()=>assert.deepEqual(qualities([{height:2160,vcodec:'av1',has_drm:true},{height:1080,vcodec:'none'},{height:720,ext:'mp4',vcodec:'h264',acodec:'aac'}]),[720]));

test('video-only mp4 requires compatible audio',()=>{const f=[{height:1080,ext:'mp4',vcodec:'h264',acodec:'none'}];assert.deepEqual(qualities(f),[]);assert.deepEqual(qualities([...f,{ext:'m4a',acodec:'aac'}]),[1080]);});

test('live and Shorts links normalize to a native-helper-compatible watch URL',()=>{
 for(const url of ['https://www.youtube.com/live/abcdefghijk?si=share','https://m.youtube.com/live/abcdefghijk/','https://youtube.com/shorts/abcdefghijk','https://youtu.be/abcdefghijk/?t=12']){
  assert.deepEqual(request({action:'inspect',url}),{action:'inspect',url:'https://www.youtube.com/watch?v=abcdefghijk'});
 }
});
test('unsupported routes and extra path segments cannot masquerade as videos',()=>{
 for(const url of ['https://youtube.com/playlist?v=abcdefghijk','https://youtube.com/?v=abcdefghijk','https://youtube.com/shorts/abcdefghijk/extra','https://youtube.com/live/abcdefghijk/extra','https://youtu.be/abcdefghijk/extra','https://youtube.com/live/abc','https://youtube.com.evil.test/live/abcdefghijk'])assert.throws(()=>videoUrl(url));
});
