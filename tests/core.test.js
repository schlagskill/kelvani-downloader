import test from 'node:test';import assert from 'node:assert/strict';import {videoUrl,request,qualities} from '../core.js';
test('canonical URL drops page parameters',()=>assert.equal(videoUrl('https://www.youtube.com/watch?v=abcdefghijk&list=x'),'https://www.youtube.com/watch?v=abcdefghijk'));
test('foreign hosts and malformed ids rejected',()=>{for(const url of ['https://youtube.com.evil.test/watch?v=abcdefghijk','https://www.youtube.com/watch?v=abc','http://youtube.com/watch?v=abcdefghijk','https://user:pass@youtube.com/watch?v=abcdefghijk'])assert.throws(()=>videoUrl(url));});
test('request rejects arbitrary format and shell inputs',()=>{assert.throws(()=>request({action:'download',url:'https://youtu.be/abcdefghijk',format:'mp4;rm',height:1080}));assert.throws(()=>request({action:'download',url:'https://youtu.be/abcdefghijk',format:'mp4',height:9999}));});
test('qualities require real video and no DRM',()=>assert.deepEqual(qualities([{height:2160,vcodec:'av1',has_drm:true},{height:1080,vcodec:'none'},{height:720,ext:'mp4',vcodec:'h264',acodec:'aac'}]),[720]));

test('video-only mp4 requires compatible audio',()=>{const f=[{height:1080,ext:'mp4',vcodec:'h264',acodec:'none'}];assert.deepEqual(qualities(f),[]);assert.deepEqual(qualities([...f,{ext:'m4a',acodec:'aac'}]),[1080]);});
