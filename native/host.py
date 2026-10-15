"""Kelvani native messaging host. Only public YouTube video IDs; no cookie access."""
import json,struct,sys,subprocess,shutil,os
from pathlib import Path
from urllib.parse import urlparse,parse_qs
def media_environment():
 env=os.environ.copy()
 # Browser TLS debug paths may be inaccessible to this separate process.
 # Do not log TLS session secrets; certificate verification stays enabled.
 env.pop('SSLKEYLOGFILE',None)
 return env

def download_directory():
 if os.environ.get('KELVANI_DOWNLOAD_DIR'):return Path(os.environ['KELVANI_DOWNLOAD_DIR'])
 try:
  value=json.loads((Path(__file__).parent/'preferences.json').read_text(encoding='utf-8')).get('directory')
  if isinstance(value,str) and Path(value).is_absolute():return Path(value)
 except (OSError,ValueError,TypeError,AttributeError):pass
 return Path.home()/'Downloads'

def directory_preferences(action):
 prefs=Path(__file__).parent/'preferences.json'
 if action=='chooseDirectory':
  if sys.platform!='win32':return {'ok':False,'error':'Nur unter Windows verfügbar.'}
  script="[Console]::OutputEncoding=[Text.Encoding]::UTF8; Add-Type -AssemblyName System.Windows.Forms; $d=New-Object System.Windows.Forms.FolderBrowserDialog; $d.Description='Choose download folder'; $d.ShowNewFolderButton=$true; try { if($d.ShowDialog() -eq 'OK'){[Console]::Write($d.SelectedPath)} } finally {$d.Dispose()}"
  result=subprocess.run(['powershell.exe','-NoProfile','-STA','-Command',script],capture_output=True,text=True,encoding='utf-8-sig',timeout=120,creationflags=getattr(subprocess,'CREATE_NO_WINDOW',0))
  if result.returncode:return {'ok':False,'error':'Ordner konnte nicht gespeichert werden.'}
  value=result.stdout.strip()
  if not value:return {'ok':True,'directory':str(download_directory()),'cancelled':True}
  folder=Path(value)
  if not folder.is_absolute() or not folder.is_dir():return {'ok':False,'error':'Ordner konnte nicht gespeichert werden.'}
  temp=prefs.with_suffix('.tmp');temp.write_text(json.dumps({'directory':str(folder)}),encoding='utf-8');temp.replace(prefs)
 elif action=='resetDirectory':
  prefs.unlink(missing_ok=True)
 return {'ok':True,'directory':str(download_directory())}

def friendly_error(raw):
 text=str(raw).lower()
 if 'permission denied' in text:return 'Eine lokale Datei ist nicht zugänglich. Bitte die Einrichtung einmal erneut ausführen.'
 if 'sign in' in text or 'confirm you' in text:return 'YouTube verlangt eine Anmeldung für dieses Video. Anmeldedaten werden nicht verwendet.'
 if 'private video' in text or 'video unavailable' in text:return 'Dieses Video ist derzeit nicht öffentlich verfügbar.'
 if 'requested format' in text:return 'Dieses Format ist derzeit nicht verfügbar. Bitte die Formate erneut prüfen.'
 return 'Der Download ist gerade nicht verfügbar. Bitte erneut versuchen.'
VENDOR=Path(__file__).parent/"vendor"
if VENDOR.is_dir():
 sys.path.insert(0,str(VENDOR))
 os.environ["PYTHONPATH"]=str(VENDOR)+os.pathsep+os.environ.get("PYTHONPATH","")

def validate(msg):
 if not isinstance(msg,dict) or msg.get('action') not in ('status','inspect','download','job','cancel','preferences','chooseDirectory','resetDirectory'):raise ValueError('Ungültige Anfrage')
 if msg['action'] in ('status','preferences','chooseDirectory','resetDirectory'):return {'action':msg['action']}
 if msg['action'] in ('job','cancel'):
  import re
  if not re.fullmatch(r'[a-f0-9]{32}',str(msg.get('jobId',''))):raise ValueError('Ungültiger Download')
  return msg
 u=urlparse(msg.get('url',''));vid=parse_qs(u.query).get('v',[''])[0]
 import re
 if u.scheme!='https' or u.netloc!='www.youtube.com' or u.path!='/watch' or not re.fullmatch(r'[A-Za-z0-9_-]{11}',vid):raise ValueError('Ungültige Video URL')
 if msg['action']=='download':
  if msg.get('format') not in ('mp3','mp4','wav'):raise ValueError('Ungültiges Format')
  if msg['format']=='mp4' and msg.get('height') not in (144,240,360,480,720,1080,1440,2160):raise ValueError('Ungültige Auflösung')
 return msg

def ffmpeg_path():
 native=shutil.which('ffmpeg')
 if native:return native
 try:
  import imageio_ffmpeg
  return imageio_ffmpeg.get_ffmpeg_exe()
 except (ImportError,RuntimeError):return None

def command(msg,directory):
 cmd=[sys.executable,'-m','yt_dlp','--ignore-config','--no-playlist','--no-progress','--no-warnings','--restrict-filenames','--windows-filenames','--no-overwrites','--socket-timeout','25']
 ffmpeg=ffmpeg_path()
 if ffmpeg:cmd+=['--ffmpeg-location',ffmpeg]
 node=shutil.which('node')
 if node:cmd+=['--js-runtimes','node:'+node]
 if msg['action']=='inspect':return cmd+['--dump-single-json','--skip-download',msg['url']]
 output='%(title).160B [%(id)s]'+(f' [{msg["height"]}p]' if msg['format']=='mp4' else '')+'.%(ext)s'
 cmd+=['-P',str(directory),'-o',output,'--print','after_move:filepath']
 if msg['format']=='mp4':
  h=msg['height'];cmd+=['-f',f'bestvideo[height={h}][ext=mp4]+bestaudio[ext=m4a]/best[height={h}][ext=mp4]','--merge-output-format','mp4']
 else:cmd+=['-f','bestaudio/best','-x','--audio-format',msg['format']]
 return cmd+[msg['url']]

def handle(msg):
 msg=validate(msg)
 if msg['action'] in ('preferences','chooseDirectory','resetDirectory'):return directory_preferences(msg['action'])
 import importlib.util
 if not importlib.util.find_spec('yt_dlp'):return {'ok':False,'error':'yt-dlp fehlt im lokalen Helfer.'}
 if msg['action']=='status':return {'ok':True,'helperVersion':'0.2.0','compatibilityVersion':4,'ffmpeg':bool(ffmpeg_path()),'directory':str(download_directory()),'jobs':[dict(job) for job in JOBS.values() if job['phase']=='running']}
 if msg['action']=='download' and not ffmpeg_path():return {'ok':False,'error':'FFmpeg wird für dieses Format benötigt.'}
 directory=download_directory();directory.mkdir(parents=True,exist_ok=True)
 try:process=subprocess.run(command(msg,directory),stdin=subprocess.DEVNULL,env=media_environment(),capture_output=True,text=True,encoding='utf-8',errors='replace',timeout=75 if msg['action']=='inspect' else 900,creationflags=getattr(subprocess,'CREATE_NO_WINDOW',0))
 except subprocess.TimeoutExpired:return {'ok':False,'error':'YouTube antwortet nicht rechtzeitig. Bitte erneut versuchen.'}
 if process.returncode:return {'ok':False,'error':friendly_error(process.stderr)}
 if msg['action']=='inspect':
  info=json.loads(process.stdout);formats=info.get('formats',[])
  return {'ok':True,'title':info.get('title'),'qualities':quality_options(formats)}
 return {'ok':True,'filename':Path(process.stdout.strip().splitlines()[-1]).name}

def read_exact(stream,size):
 chunks=[];remaining=size
 while remaining:
  data=stream.read(remaining)
  if not data:break
  chunks.append(data);remaining-=len(data)
 return b''.join(chunks)

def read_message(stream):
 header=read_exact(stream,4)
 if not header:return None
 if len(header)!=4:raise ValueError('Unvollständige Nachricht')
 size=struct.unpack('=I',header)[0]
 if size==0 or size>65536:raise ValueError('Nachricht zu groß oder leer')
 payload=read_exact(stream,size)
 if len(payload)!=size:raise ValueError('Unvollständige Nachricht')
 value=json.loads(payload)
 if not isinstance(value,dict):raise ValueError('Nachricht muss ein Objekt sein')
 return value

# The connected host owns the jobs; closing a popup does not cancel a download.
import threading,uuid,time
JOBS={}
PROCESSES={}
ACTIVE_REQUESTS={}
LOCK=threading.RLock()
OUTPUT_LOCK=threading.Lock()
INSPECT_LIMIT=threading.BoundedSemaphore(2)

def stop_process(process):
 if process.poll() is not None:return
 if sys.platform=='win32':
  subprocess.run(['taskkill','/PID',str(process.pid),'/T','/F'],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL,creationflags=getattr(subprocess,'CREATE_NO_WINDOW',0),timeout=15)
 else:process.terminate()


def quality_options(formats):
 audio=any(f.get('ext')=='m4a' and f.get('acodec') not in (None,'none') and not f.get('has_drm') for f in formats)
 return [h for h in (2160,1440,1080,720,480,360,240,144) if any(f.get('height')==h and f.get('ext')=='mp4' and f.get('vcodec') not in (None,'none') and not f.get('has_drm') and (f.get('acodec') not in (None,'none') or audio) for f in formats)]

def run_download(job_id,msg):
 try:
  directory=download_directory();directory.mkdir(parents=True,exist_ok=True)
  cmd=command(msg,directory)
  cmd[cmd.index('--no-progress')]='--progress'
  cmd+=['--newline']
  cmd+=['--progress-template','download:KD_PROGRESS:%(progress._percent_str)s']
  process=subprocess.Popen(cmd,stdin=subprocess.DEVNULL,env=media_environment(),stdout=subprocess.PIPE,stderr=subprocess.STDOUT,text=True,encoding='utf-8',errors='replace',creationflags=getattr(subprocess,'CREATE_NO_WINDOW',0))
  with LOCK:
   PROCESSES[job_id]=process
   if JOBS[job_id]['phase']=='cancelled':stop_process(process)
  watchdog=threading.Timer(900,lambda:stop_process(process));watchdog.daemon=True;watchdog.start()
  last=[];filename=None
  for line in process.stdout:
   text=line.strip();last=(last+[text])[-12:]
   if text.startswith('KD_PROGRESS:'):
    import re
    m=re.search(r'([0-9.]+)%',text)
    if m:
     with LOCK:JOBS[job_id]['percent']=float(m[1])
   elif text and not text.startswith('[') and Path(text).suffix in ('.mp4','.mp3','.wav'):filename=Path(text).name
  code=process.wait()
  watchdog.cancel()
  with LOCK:
   if JOBS[job_id]['phase']!='cancelled':JOBS[job_id].update(phase='done' if code==0 and filename else 'error',percent=100 if code==0 and filename else JOBS[job_id]['percent'],filename=filename,defaultDirectory=directory==Path.home()/'Downloads',error=None if code==0 and filename else friendly_error('\n'.join(last)))
 except Exception as error:
  with LOCK:JOBS[job_id].update(phase='error',error=friendly_error(error))
 finally:
  with LOCK:
   PROCESSES.pop(job_id,None)
   for signature,active_id in list(ACTIVE_REQUESTS.items()):
    if active_id==job_id:ACTIVE_REQUESTS.pop(signature,None)

def handle_async(msg):
 msg=validate(msg)
 if msg['action'] in ('job','cancel'):
  with LOCK:
   job=JOBS.get(msg['jobId'])
   if not job:return {'ok':False,'error':'Download ist nicht mehr vorhanden.'}
   if msg['action']=='cancel' and job['phase']=='running':
    job['phase']='cancelled';process=PROCESSES.get(msg['jobId'])
    if process:stop_process(process)
   return {'ok':True,**job}
 if msg['action']=='inspect':
  if not INSPECT_LIMIT.acquire(blocking=False):return {'ok':False,'error':'Die Prüfung läuft bereits. Bitte kurz warten.'}
  try:return handle(msg)
  finally:INSPECT_LIMIT.release()
 if msg['action']!='download':return handle(msg)
 import importlib.util
 if not importlib.util.find_spec('yt_dlp') or not ffmpeg_path():return {'ok':False,'error':'Der Helfer benötigt yt-dlp und FFmpeg.'}
 with LOCK:
  signature=(msg['url'],msg['format'],msg.get('height'))
  active_id=ACTIVE_REQUESTS.get(signature)
  if active_id:
   job=JOBS.get(active_id)
   if job and job['phase']=='running':return {'ok':True,**job}
   return {'ok':False,'error':'Dieser Download wird gerade beendet. Bitte kurz warten.'}
  if sum(j['phase']=='running' for j in JOBS.values())>=2:return {'ok':False,'error':'Zwei Downloads laufen bereits.'}
  # Keep bounded history without deleting active jobs.
  for key in list(JOBS):
   if len(JOBS)<50:break
   if JOBS[key]['phase']!='running':del JOBS[key]
  job_id=uuid.uuid4().hex;JOBS[job_id]={'jobId':job_id,'phase':'running','percent':0,'format':msg['format']}
 ACTIVE_REQUESTS[signature]=job_id
 threading.Thread(target=run_download,args=(job_id,msg),daemon=True).start()
 return {'ok':True,'jobId':job_id,'phase':'running'}

def answer(msg):
 try:response=handle_async(msg)
 except Exception as error:response={'ok':False,'error':str(error)}
 response['requestId']=msg.get('requestId') if isinstance(msg,dict) else None
 payload=json.dumps(response,ensure_ascii=False).encode()
 with OUTPUT_LOCK:sys.stdout.buffer.write(struct.pack('=I',len(payload))+payload);sys.stdout.buffer.flush()

def main():
 if sys.platform=='win32':
  import msvcrt
  msvcrt.setmode(sys.stdin.fileno(),os.O_BINARY);msvcrt.setmode(sys.stdout.fileno(),os.O_BINARY)
 try:
  while True:
   msg=read_message(sys.stdin.buffer)
   if msg is None:break
   if msg.get('action')=='inspect':threading.Thread(target=answer,args=(msg,),daemon=True).start()
   else:answer(msg)
 finally:
  with LOCK:
   for process in list(PROCESSES.values()):stop_process(process)
if __name__=='__main__':main()
