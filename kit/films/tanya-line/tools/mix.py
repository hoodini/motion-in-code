"""Mix for tanya-line: Mixkit "A New Life" from S0 + every SFX placed at (event - measured peak), summed into one bed with numpy
(one decode per file; avoids ffmpeg's command-line limit), then two-pass loudnorm to -14 LUFS / -1.5 dBTP, mux with -t DUR."""
import json, subprocess, re, os, sys
import numpy as np
os.chdir(r'C:\Users\User\yuvwork\tanya-line')
C = json.load(open(sys.argv[1] if len(sys.argv) > 1 else 'cues.json', encoding='utf-8')); A_DIR = C['assets']; A = json.load(open(os.path.join(A_DIR, 'analysis.json')))
SR, DUR = 48000, C['dur']; n = int(round(DUR * SR))
PK = {k.rsplit('-', 1)[0]: (k, v['peak']) for k, v in A['sfx'].items()}
cache = {}
def load(path):
    if path not in cache:
        raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-ac', '2', '-ar', str(SR), '-f', 'f32le', '-'], capture_output=True).stdout
        cache[path] = np.frombuffer(raw, np.float32).reshape(-1, 2).copy()
    return cache[path]
bed = np.zeros((n, 2), np.float32)
def place(x, start, g):
    a = int(round(start * SR)); cut = max(0, -a); a = max(0, a); x = x[cut:]; L = min(len(x), n - a)
    if L > 0: bed[a:a + L] += x[:L] * (10 ** (g / 20))
for name, ev, g in C['cues']:
    f, peak = PK[name]; place(load(os.path.join(A_DIR, 'sfx', f + '.mp3')), ev - peak, g)
for fn, ss, ln, at, g in C['slices']:
    x = load(os.path.join(A_DIR, fn)); s0 = int(ss * SR); seg = x[s0:s0 + int(ln * SR)].copy(); k = min(len(seg), int(0.08 * SR))
    if k: seg[-k:] *= np.linspace(1, 0, k)[:, None]; seg[:min(len(seg), 240)] *= np.linspace(0, 1, min(len(seg), 240))[:, None]
    place(seg, at, g)
m = C['music']; mus = subprocess.run(['ffmpeg', '-v', 'error', '-ss', f"{m['S0']:.4f}", '-t', f'{DUR:.4f}', '-i', os.path.join(A_DIR, m['file']), '-ac', '2', '-ar', str(SR), '-f', 'f32le', '-'], capture_output=True).stdout
mus = np.frombuffer(mus, np.float32).reshape(-1, 2)[:n] * (10 ** (m.get('gain', -2) / 20))
fi, fo = int(0.02 * SR), int(0.75 * SR); env = np.ones(len(mus), np.float32); env[:fi] = np.linspace(0, 1, fi); env[-fo:] = np.linspace(1, 0, fo)
mix = bed.copy(); mix[:len(mus)] += mus * env[:, None]
import wave
def wav(path, x):
    y = np.clip(x, -1, 1); y = (y * 32767).astype('<i2')
    with wave.open(path, 'wb') as w: w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(y.tobytes())
# keep headroom before loudnorm measures (float -> 16 bit)
pk = np.abs(mix).max(); wav('premix.wav', mix * (0.9 / pk if pk > 0.9 else 1))
run = lambda a: subprocess.run(['ffmpeg', '-y', '-hide_banner'] + a, capture_output=True, text=True)
r = run(['-i', 'premix.wav', '-af', 'alimiter=limit=0.33:attack=3:release=60:level=disabled,loudnorm=I=-14:TP=-3.2:LRA=11:print_format=json', '-f', 'null', '-'])
mm = json.loads(re.findall(r'\{[^{}]*"input_i"[^{}]*\}', r.stderr)[-1])
ln = f"loudnorm=I=-14:TP=-3.2:LRA=11:measured_I={mm['input_i']}:measured_TP={mm['input_tp']}:measured_LRA={mm['input_lra']}:measured_thresh={mm['input_thresh']}:offset={mm['target_offset']}:linear=true"
r = run(['-i', 'premix.wav', '-af', 'alimiter=limit=0.33:attack=3:release=60:level=disabled,' + ln + ',aresample=48000', '-c:a', 'pcm_s16le', 'audio.wav'])
if r.returncode: print(r.stderr[-1500:]); sys.exit(1)
chk = run(['-i', 'audio.wav', '-af', 'ebur128=peak=true', '-f', 'null', '-'])
print('loudness', re.findall(r'I:\s+(-?[\d.]+) LUFS', chk.stderr)[-1], 'LUFS · true peak', re.findall(r'Peak:\s+(-?[\d.]+) dBFS', chk.stderr)[-1], 'dBFS ·', len(C['cues']), 'cues ·', len(C['slices']), 'slices')
for src, out in C['mux']:
    if not os.path.exists(src): print('missing', src); continue
    os.makedirs(os.path.dirname(out), exist_ok=True)
    r = run(['-i', src, '-i', 'audio.wav', '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '256k', '-t', f'{DUR:.4f}', '-movflags', '+faststart', out])
    print(out, 'ok' if r.returncode == 0 else r.stderr[-600:])
