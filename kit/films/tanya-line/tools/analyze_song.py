import subprocess, json, sys, glob, os
import numpy as np
SR = 22050
def load(p):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', p, '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'], capture_output=True).stdout
    return np.frombuffer(raw, dtype=np.float32).copy()

def music(p):
    x = load(p); dur = len(x) / SR
    hop, win = 256, 1024; fps = SR / hop
    n = 1 + (len(x) - win) // hop
    idx = np.arange(win)[None, :] + hop * np.arange(n)[:, None]
    F = np.abs(np.fft.rfft(x[idx] * np.hanning(win), axis=1))
    freqs = np.fft.rfftfreq(win, 1 / SR)
    low = F[:, (freqs >= 30) & (freqs < 150)].sum(1)          # kick / bass band
    full = np.sqrt((x[idx] ** 2).mean(1))                        # RMS
    def onset(e):
        e = np.log1p(e / (e.mean() + 1e-9) * 10); d = np.maximum(0, np.diff(e, prepend=e[0])); return d
    on = onset(F.sum(1)) + 1.5 * onset(low)
    # tempo by autocorrelation, prefer 90-160
    lags = np.arange(int(fps * 60 / 200), int(fps * 60 / 60) + 1)
    ac = np.array([np.dot(on[:-L], on[L:]) for L in lags])
    bpms = 60 * fps / lags
    w = np.exp(-0.5 * (np.log2(bpms / 120) / 0.9) ** 2)
    i = int(np.argmax(ac * w)); L = float(lags[i])
    if 0 < i < len(ac) - 1:
        a, b, c = ac[i - 1], ac[i], ac[i + 1]; L += 0.5 * (a - c) / (a - 2 * b + c)
    bpm = 60 * fps / L; beat = 60 / bpm
    # phase: maximize kick-band onset on the grid
    ol = onset(low); best, ph = -1, 0
    for p0 in np.arange(0, L, 0.25):
        k = np.round(np.arange(p0, len(ol), L)).astype(int); k = k[k < len(ol)]
        s = ol[k].sum()
        if s > best: best, ph = s, p0
    first = ph / fps
    # refine each beat to the nearest real kick peak (+-35 ms) -> calibrated grid
    beats = []
    t = first
    while t < dur - 0.05:
        a, b = int((t - 0.035) * fps), int((t + 0.035) * fps) + 1
        a = max(a, 0); seg = ol[a:b]
        tt = (a + int(np.argmax(seg))) / fps if len(seg) and seg.max() > ol.mean() * 2 else t
        beats.append(round(tt, 4)); t += beat
    # energy per beat (RMS and low band) -> drop = biggest rise vs previous 2 beats
    eb, lb = [], []
    for k in range(len(beats) - 1):
        a, b = int(beats[k] * fps), int(beats[k + 1] * fps)
        eb.append(float(full[a:b].mean())); lb.append(float(low[a:b].mean()))
    eb, lb = np.array(eb), np.array(lb)
    score = [(lb[k] / (lb[max(0, k - 2):k].mean() + 1e-9)) * (eb[k] / (eb[max(0, k - 2):k].mean() + 1e-9)) if k >= 2 else 0 for k in range(len(eb))]
    order = list(np.argsort(score)[::-1][:5])
    return {'file': os.path.basename(p), 'dur': round(dur, 3), 'bpm': round(bpm, 3), 'beat': round(beat, 5), 'first_beat': round(first, 4),
            'n_beats': len(beats), 'beats_head': beats[:8],
            'drop_candidates': [{'beat': int(k), 't': beats[int(k)], 'score': round(float(score[int(k)]), 2)} for k in order],
            'energy_per_bar': [round(float(eb[k:k + 4].mean()), 4) for k in range(0, len(eb), 4)],
            'low_per_bar': [round(float(lb[k:k + 4].mean()), 1) for k in range(0, len(lb), 4)]}

def sfx(p):
    x = load(p); w = int(0.005 * SR)
    e = np.array([np.sqrt((x[i:i + w] ** 2).mean()) for i in range(0, len(x) - w, w)])
    k = int(np.argmax(e)); onset = int(np.argmax(e > e.max() * 0.1))
    return {'dur': round(len(x) / SR, 3), 'peak': round((k + 0.5) * w / SR, 4), 'onset': round(onset * w / SR, 4), 'peak_rms': round(float(e.max()), 4)}

r = music('music/a-new-life-543.mp3')
A = json.load(open('analysis.json'))
A['music_a_new_life'] = r
json.dump(A, open('analysis.json', 'w'), indent=1)
print({k: r[k] for k in ('bpm','beat','first_beat','beats_head','drop_candidates')})
