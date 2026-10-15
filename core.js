export function videoUrl(value) {
 const url=new URL(value);
 if(url.protocol!=='https:'||!['www.youtube.com','youtube.com','m.youtube.com','youtu.be'].includes(url.hostname)||url.username||url.password)throw new Error('Nur YouTube Video URLs sind erlaubt.');
 const id=url.hostname==='youtu.be'?url.pathname.slice(1):url.pathname.startsWith('/shorts/')?url.pathname.split('/')[2]:url.searchParams.get('v');
 if(!/^[A-Za-z0-9_-]{11}$/.test(id||''))throw new Error('Kein gültiges Video.');
 return 'https://www.youtube.com/watch?v='+id;
}
export function request(value) {
 if(!value||!['inspect','download','status','job','cancel'].includes(value.action))throw new Error('Ungültige Aktion.');
 if(value.action==='status')return {action:'status'};
 if(['job','cancel'].includes(value.action)){if(!/^[a-f0-9]{32}$/.test(value.jobId||''))throw new Error('Ungültiger Download.');return {action:value.action,jobId:value.jobId};}
 const url=videoUrl(value.url);
 if(value.action==='inspect')return {action:'inspect',url};
 if(!['mp3','mp4','wav'].includes(value.format))throw new Error('Ungültiges Format.');
 const height=Number(value.height);
 if(value.format==='mp4'&&![144,240,360,480,720,1080,1440,2160].includes(height))throw new Error('Ungültige Auflösung.');
 return {action:'download',url,format:value.format,...(value.format==='mp4'?{height}:{})};
}
export function qualities(formats=[]) {
 const audio=formats.some(f=>f.ext==='m4a'&&f.acodec&&f.acodec!=='none'&&!f.has_drm);
 return [2160,1440,1080,720,480,360,240,144].filter(h=>formats.some(f=>f.height===h&&f.ext==='mp4'&&f.vcodec&&f.vcodec!=='none'&&!f.has_drm&&((f.acodec&&f.acodec!=='none')||audio)));
}
