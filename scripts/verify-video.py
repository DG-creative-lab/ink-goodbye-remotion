"""Compare every decoded video frame with its clean PNG source."""
import argparse
import json
import subprocess
from pathlib import Path
from PIL import Image, ImageChops, ImageStat

parser = argparse.ArgumentParser()
parser.add_argument('video')
parser.add_argument('frames', type=Path)
parser.add_argument('--count', type=int, required=True)
parser.add_argument('--ffmpeg', default='ffmpeg')
parser.add_argument('--ffprobe', default='ffprobe')
args = parser.parse_args()
metadata = json.loads(subprocess.check_output([args.ffprobe, '-v', 'error', '-count_frames', '-show_streams', '-show_format', '-of', 'json', args.video]))
video = next(stream for stream in metadata['streams'] if stream['codec_type'] == 'video')
if (video['width'], video['height'], int(video['nb_read_frames']), video['avg_frame_rate']) != (1920, 1080, args.count, '24/1'):
    raise ValueError('Export metadata does not match the film')
process = subprocess.Popen([args.ffmpeg, '-v', 'error', '-i', args.video, '-pix_fmt', 'rgb24', '-f', 'rawvideo', '-'], stdout=subprocess.PIPE)
size = 1920 * 1080 * 3
errors = []
try:
    for frame in range(args.count):
        data = process.stdout.read(size)
        if len(data) != size:
            raise ValueError(f'Missing decoded frame {frame}')
        decoded = Image.frombytes('RGB', (1920, 1080), data)
        with Image.open(args.frames / f'frame-{frame:04}.png') as reference:
            error = sum(ImageStat.Stat(ImageChops.difference(decoded, reference.convert('RGB'))).mean) / 3
        if error > 4:
            raise ValueError(f'Frame {frame} differs from the clean source: {error}')
        errors.append(error)
    if process.wait() != 0:
        raise ValueError('FFmpeg reported a decoding failure')
finally:
    if process.poll() is None:
        process.terminate()
report = {'frames': args.count, 'durationSeconds': float(metadata['format']['duration']), 'maxMeanChannelError': max(errors), 'audioIncluded': any(s['codec_type'] == 'audio' for s in metadata['streams'])}
Path(args.video + '.json').write_text(json.dumps(report, indent=2) + '\n')
print(json.dumps(report, indent=2))
