"""Runtime checks without shell-dependent Python command quoting."""
import importlib.util
import sys

if sys.argv[1] == 'pip':
    sys.exit(0 if importlib.util.find_spec('pip') else 1)
if sys.argv[1] == 'media':
    import yt_dlp
    import imageio_ffmpeg
    print(imageio_ffmpeg.get_ffmpeg_exe())
else:
    raise ValueError('Unknown runtime check')
