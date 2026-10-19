"""Fit a generated track to the film: exact tempo, sections on the chapters, the hook built from chops of the first drop.
1. beat-track the track, fit its tempo, stretch it to the film BPM (atempo; the correction is ~1%)
2. find the bar lines (the phase with the strongest low-end onsets is the downbeat)
3. snap every planned section start (from plan.json) to a bar line, refined ±2 bars by the energy change it should have
4. cut or repeat whole bars in the middle of each section so it lasts exactly as long as the film's section
5. hook (film 0 → b4): the first eighth of the drop, chopped on every montage cut with a low-pass opening up, a stop, then the drop
usage: python music_align.py music.mp3 plan.json bed.wav"""
import numpy as np, soundfile as sf, subprocess, json, sys, warnings, librosa
warnings.filterwarnings('ignore')
SR = 48000
mp3, plan_p, out = sys.argv[1], sys.argv[2], sys.argv[3]
plan = json.load(open(plan_p, encoding='utf-8')); BPM = plan['bpm']; B = 60 / BPM; BAR = 4 * B
# the sections the track was generated with come from plan_p; the film's own section starts may come from a newer plan (after the real holds)
A = json.load(open(sys.argv[4], encoding='utf-8'))['anchors'] if len(sys.argv) > 4 else plan['anchors']

def dec(path, af=None):
    r = subprocess.run(['ffmpeg', '-v', 'error', '-i', path] + (['-af', af] if af else []) + ['-ac', '2', '-ar', str(SR), '-f', 'f32le', '-'], capture_output=True)
    return np.frombuffer(r.stdout, np.float32).reshape(-1, 2).copy()

# ---- 1. tempo
y = dec(mp3); mono = librosa.resample(y.mean(1), orig_sr=SR, target_sr=22050)
oenv = librosa.onset.onset_strength(y=mono, sr=22050)
tempo, beats = librosa.beat.beat_track(onset_envelope=oenv, sr=22050, start_bpm=BPM, tightness=400)
bt_s = librosa.frames_to_time(beats, sr=22050)
k = np.arange(len(bt_s)); per, off = np.polyfit(k, bt_s, 1)
T = 60 / per
if T < BPM * 0.7: T *= 2
if T > BPM * 1.4: T /= 2
r = BPM / T
print(f'track {len(y) / SR:.1f} s · fitted tempo {T:.2f} BPM → stretch ×{r:.4f}')
if abs(r - 1) > 0.0008:
    y = dec(mp3, f'atempo={r:.6f}'); mono = librosa.resample(y.mean(1), orig_sr=SR, target_sr=22050)
    oenv = librosa.onset.onset_strength(y=mono, sr=22050)
# ---- 2. beat grid at exactly B, phase from the onset envelope; downbeat = strongest low-end phase
lo = librosa.onset.onset_strength(y=mono, sr=22050, fmax=160)
fps = 22050 / 512; best = (0, 0)
for ph in np.arange(0, B, 0.005):
    idx = ((ph + np.arange(0, len(mono) / 22050 - ph, B)) * fps).astype(int); idx = idx[idx < len(oenv)]
    sc = oenv[idx].mean()
    if sc > best[0]: best = (sc, ph)
ph = best[1]; grid = ph + np.arange(0, len(y) / SR - ph, B)
li = (grid * fps).astype(int).clip(0, len(lo) - 1)
dphase = int(np.argmax([lo[li[q::4]].mean() for q in range(4)]))
bars = grid[dphase::4]
print(f'beat phase {ph * 1000:.0f} ms · downbeat phase {dphase} · {len(bars)} bars')
rms = lambda a, b: 20 * np.log10(np.sqrt(np.mean(y[int(a * SR): int(b * SR)] ** 2)) + 1e-9)
barE = np.array([rms(b, b + BAR) for b in bars])

# ---- 3. section starts in the track (planned durations), snapped and refined
names = ['title', 'ch03', 'ch06', 'break', 'builder', 'finale', 'end']
secs = plan['composition_plan']['sections']; exp = [0.0]
for s in secs: exp.append(exp[-1] + s['duration_ms'] / 1000)
M = []
for j, n in enumerate(names):
    e = exp[j] if j < len(exp) else exp[-1]
    i0 = int(np.argmin(np.abs(bars - e)))
    if n == 'title': i0 = int(np.argmax(barE[:3] > barE.max() - 9)) if len(barE) > 3 else 0
    elif n in ('break', 'builder', 'ch03', 'ch06'):
        cand = [i for i in range(max(1, i0 - 2), min(len(bars) - 1, i0 + 3))]
        delta = {i: barE[i] - barE[i - 1] for i in cand}
        i0 = min(cand, key=lambda i: delta[i]) if n == 'break' else max(cand, key=lambda i: delta[i]) if n in ('builder',) else i0
    M.append(i0)
for j in range(1, len(M)): M[j] = max(M[j], M[j - 1] + 1)
# a measured section map wins over the planned durations (the generator does not follow them to the bar):
# {"downbeat": s, "bars": {name: bar index counted from that downbeat}}
if len(sys.argv) > 5:
    tm = json.load(open(sys.argv[5], encoding='utf-8')); d0 = tm['downbeat']
    bars = d0 + np.arange(0, (len(y) / SR - d0) / BAR) * BAR
    M = [tm['bars'][n] for n in names]
print('track bars at sections:', dict(zip(names, M)), '· expected bars', [round(e / BAR, 1) for e in exp])

# ---- 4. cut / repeat bars so every section has the film's length
film = [A[n] for n in names]; segs_out = []          # list of (track start s, track end s)
for j in range(len(names) - 1):
    nf = int(round((film[j + 1] - film[j]) / BAR)); a, b = M[j], M[j + 1]; nm = b - a
    order = list(range(a, b))
    if nm > nf:                                       # drop bars from the middle
        cut = nm - nf; mid = a + nm // 2 - cut // 2; order = [i for i in order if not (mid <= i < mid + cut)]
    elif nm < nf:                                     # repeat bars from the middle, in phrase-sized runs
        need = nf - nm; mid = a + nm // 2
        run = list(range(max(a, mid - 4), mid)) or [a]
        ins = []
        while len(ins) < need: ins += run
        order = order[:mid - a] + ins[:need] + order[mid - a:]
    for i in order: segs_out.append((bars[i], bars[i] + BAR))
    print(f'  {names[j]:8s} film {nf:3d} bars · track {nm:3d} bars')
tail = (bars[M[-1]], min(len(y) / SR, bars[M[-1]] + 2.0))
XF = int(0.012 * SR); parts = []; prev_end = None
for a, b in segs_out + [tail]:
    s = y[int(round(a * SR)): int(round(b * SR))].copy()
    if prev_end is not None and abs(prev_end - a) > 1e-3 and len(s) > XF:
        cont = y[int(round(prev_end * SR)): int(round(prev_end * SR)) + XF]
        if len(cont) == XF:
            w = np.sin(np.linspace(0, np.pi / 2, XF))[:, None]; s[:XF] = s[:XF] * w + cont * np.cos(np.linspace(0, np.pi / 2, XF))[:, None]
    parts.append(s); prev_end = b
main = np.vstack(parts)

# ---- 5. hook: chops of the first eighth on every montage cut (0.5 beat apart), low-pass opening, a stop, then the drop
N = int(round((A['end'] + 0.0) * SR)); bed = np.zeros((N, 2), np.float32)
t0 = int(round(A['title'] * SR)); n = min(len(main), N - t0); bed[t0:t0 + n] = main[:n]
sl = int(B / 2 * SR); chop = main[:sl].copy(); f = int(0.004 * SR); chop[:f] *= np.linspace(0, 1, f)[:, None]; chop[-f:] *= np.linspace(1, 0, f)[:, None]
def lowpass(x, fc):
    a = np.exp(-2 * np.pi * fc / SR); o = np.zeros_like(x); z = np.zeros(2)
    for i in range(len(x)): z = (1 - a) * x[i] + a * z; o[i] = z
    return o
shots = int(round(A['title'] / (B / 2)))
for k in range(shots - 1):
    fc = 500 * (16000 / 500) ** (k / max(1, shots - 2)); g = 0.55 + 0.45 * k / max(1, shots - 2)
    a = int(round(k * B / 2 * SR)); bed[a:a + sl] += lowpass(chop, fc) * g
fo = int(0.3 * SR); bed[-fo:] *= np.linspace(1, 0, fo)[:, None]
sf.write(out, bed, SR, subtype='FLOAT')
print(f'{out}: {len(bed) / SR:.2f} s (film {A["end"]:.2f} s)')
