import unittest,io,json,struct
from pathlib import Path
from host import validate,command,read_message,quality_options,handle_async
class HostTests(unittest.TestCase):
 def test_reject_foreign(self):
  with self.assertRaises(ValueError):validate({'action':'inspect','url':'https://evil.test/watch?v=abcdefghijk'})
 def test_exact_quality(self):
  cmd=command({'action':'download','url':'https://www.youtube.com/watch?v=abcdefghijk','format':'mp4','height':1080},Path('test'))
  self.assertIn('bestvideo[height=1080][ext=mp4]+bestaudio[ext=m4a]/best[height=1080][ext=mp4]',cmd)
  self.assertIn('--ignore-config',cmd)
 def test_inspection_deadline_precedes_browser_deadline(self):
  import host,subprocess
  from unittest.mock import patch
  message={'action':'inspect','url':'https://www.youtube.com/watch?v=abcdefghijk'}
  with patch('host.subprocess.run',side_effect=subprocess.TimeoutExpired('yt-dlp',75)) as run:
   response=host.handle(message)
   self.assertEqual(run.call_args.kwargs['timeout'],75)
   self.assertEqual(run.call_args.kwargs['stdin'],subprocess.DEVNULL)
   self.assertFalse(response['ok']);self.assertIn('erneut',response['error'])
 def test_protocol(self):
  data=json.dumps({'action':'status'}).encode();self.assertEqual(read_message(io.BytesIO(struct.pack('=I',len(data))+data)),{'action':'status'})
 def test_limit(self):
  with self.assertRaises(ValueError):read_message(io.BytesIO(struct.pack('=I',70000)))
 def test_only_mergeable_mp4_qualities(self):
  formats=[{'height':2160,'ext':'webm','vcodec':'vp9'},{'height':1080,'ext':'mp4','vcodec':'avc1','acodec':'none'}]
  self.assertEqual(quality_options(formats),[])
  formats.append({'ext':'m4a','acodec':'aac','vcodec':'none'})
  self.assertEqual(quality_options(formats),[1080])
 def test_unknown_job(self):
  self.assertFalse(handle_async({'action':'job','jobId':'a'*32})['ok'])
 def test_invalid_job_id(self):
  with self.assertRaises(ValueError):validate({'action':'cancel','jobId':'../../evil'})
 def test_partial_stream_reads(self):
  class Partial(io.BytesIO):
   def read(self,size=-1):return super().read(min(size,2))
  data=json.dumps({'action':'status'}).encode()
  self.assertEqual(read_message(Partial(struct.pack('=I',len(data))+data)),{'action':'status'})
 def test_protocol_non_object_rejected(self):
  data=b'[]'
  with self.assertRaises(ValueError):read_message(io.BytesIO(struct.pack('=I',len(data))+data))
 def test_duplicate_download_reuses_running_job(self):
  import host
  from unittest.mock import patch
  host.JOBS.clear();host.ACTIVE_REQUESTS.clear()
  message={'action':'download','url':'https://www.youtube.com/watch?v=abcdefghijk','format':'mp3'}
  try:
   with patch('host.threading.Thread') as thread,patch('host.ffmpeg_path',return_value='ffmpeg'),patch('importlib.util.find_spec',return_value=object()):
    first=host.handle_async(message);second=host.handle_async(message)
    self.assertTrue(first['ok']);self.assertEqual(first['jobId'],second['jobId']);self.assertEqual(thread.call_count,1)
  finally:host.JOBS.clear();host.ACTIVE_REQUESTS.clear()
 def test_cancelled_request_cannot_race_existing_file_writer(self):
  import host
  from unittest.mock import patch
  host.JOBS.clear();host.ACTIVE_REQUESTS.clear()
  message={'action':'download','url':'https://www.youtube.com/watch?v=abcdefghijk','format':'mp3'}
  try:
   with patch('host.threading.Thread'),patch('host.ffmpeg_path',return_value='ffmpeg'),patch('importlib.util.find_spec',return_value=object()):
    first=host.handle_async(message);host.handle_async({'action':'cancel','jobId':first['jobId']});self.assertFalse(host.handle_async(message)['ok'])
  finally:host.JOBS.clear();host.ACTIVE_REQUESTS.clear()
 def test_different_video_qualities_have_distinct_output_names(self):
  def output(height):
   args=command({'action':'download','url':'https://www.youtube.com/watch?v=abcdefghijk','format':'mp4','height':height},Path('test'))
   return args[args.index('-o')+1]
  self.assertNotEqual(output(720),output(1080));self.assertIn('[720p]',output(720));self.assertIn('[1080p]',output(1080))


class ConnectionEnvironmentTests(unittest.TestCase):
 def test_status_advertises_updated_helper_compatibility(self):
  import host
  from unittest.mock import patch
  with patch('importlib.util.find_spec',return_value=True),patch.object(host,'ffmpeg_path',return_value='ffmpeg'):
   status=host.handle({'action':'status'})
  self.assertEqual(status['compatibilityVersion'],2);self.assertEqual(status['helperVersion'],'0.1.4')
 def test_tls_debug_path_is_not_inherited_and_other_settings_are_unchanged(self):
  import host,os
  from unittest.mock import patch
  with patch.dict(os.environ,{'SSLKEYLOGFILE':'not-accessible.log','KEEP_TEST_VALUE':'yes'}):
   child=host.media_environment()
   self.assertNotIn('SSLKEYLOGFILE',child);self.assertEqual(child['KEEP_TEST_VALUE'],'yes')
   self.assertEqual(os.environ['SSLKEYLOGFILE'],'not-accessible.log')
 def test_long_internal_error_is_not_shown_as_product_message(self):
  import host
  result=host.friendly_error('ERROR: Permission denied: virtual_file.log please report this issue https://github.com/yt-dlp/yt-dlp/issues')
  self.assertLess(len(result),150);self.assertNotIn('virtual_file',result);self.assertNotIn('github',result)

if __name__=='__main__':unittest.main()
