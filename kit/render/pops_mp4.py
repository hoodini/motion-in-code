"""Single-frame pop detector on a FINISHED video (decodes with ffmpeg at low res).
A pop = a frame unlike BOTH neighbours while the neighbours match each other.  usage: python pops_mp4.py film.mp4"""
import sys, subprocess, numpy as np
f = sys.argv[1]; W, H = 192, 108
p = subprocess.run(['ffprobe', '-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height', '-of', 'csv=p=0', f], capture_output=True, text=True).stdout.strip().split(',')
if int(p[1]) > int(p[0]): W, H = 108, 192
raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', f, '-vf', f'scale={W}:{H}', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], capture_output=True).stdout
fr = np.frombuffer(raw, np.uint8).reshape(-1, H, W, 3).astype(np.int16); pops = []
for i in range(1, len(fr) - 1):
    d1, d2, d3 = np.abs(fr[i] - fr[i - 1]).mean(), np.abs(fr[i + 1] - fr[i]).mean(), np.abs(fr[i + 1] - fr[i - 1]).mean()
    if min(d1, d2) > 3 * max(d3, 0.3) and min(d1, d2) > 1.0: pops.append((i, round(i / 60, 3), round(float(min(d1, d2)), 2)))
print(f, 'frames', len(fr), 'pops', pops if pops else 'NONE')
