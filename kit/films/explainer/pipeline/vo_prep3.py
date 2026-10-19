"""v3 narration: measure the 28 lines, plan the holds, place the lines, and write the captions.
1. decode + trim every line (vo/Sxx.mp3), optional global tempo
2. plan HOLDS: wherever a line would run into the next line's anchor, insert 4 beats at a rest point between the two anchors
   (CAND below; a rest point is a moment where nothing is mid-transition), until every line fits; write HOLDS into film.js
3. place each line at bt(beat) + off (or right after the previous line), write vo_track.wav
4. captions.json from the ElevenLabs character alignment: words with spoken times, grouped into 2–4 word chunks
usage: python vo_prep3.py vo_dir [tempo]"""
import numpy as np, soundfile as sf, subprocess, json, sys, os, re
SR = 48000
FILM = '/home/claude/motion-in-code/kit/films/explainer/film.js'
VO = sys.argv[1]; TEMPO = float(sys.argv[2]) if len(sys.argv) > 2 else 1.0
src = open(FILM, encoding='utf-8').read()
BPM = float(re.search(r'const BPM = ([\d.]+);', src).group(1)); B = 60 / BPM
segs = json.load(open('vo_script.json', encoding='utf-8'))['segments']
GAP = 0.08
CAND = {'S02': [6.4, 11], 'S03': [19.5], 'S04': [23.3], 'S05': [26, 28.5], 'S06': [30.8, 34.5], 'S07': [39.5], 'S08': [46], 'S09': [51.5],
        'S10': [58.5], 'S11': [65.9], 'S12': [77], 'S13': [87.3], 'S14': [95.2], 'S15': [101], 'S16': [110], 'S17': [116], 'S18': [125],
        'S19': [134.5], 'S20': [143.6], 'S21': [151.2], 'S22': [161.5], 'S23': [165.5], 'S24': [175], 'S25': [183], 'S26': [188.4],
        'S27': [197], 'S28': [204]}                       # rest points after line Sxx (before the next line's anchor)

def decode(path, tempo=1.0):
    af = ['-af', f'atempo={tempo:.4f}'] if abs(tempo - 1) > 1e-4 else []
    r = subprocess.run(['ffmpeg', '-v', 'error', '-i', path] + af + ['-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'], capture_output=True)
    if r.returncode: raise SystemExit(r.stderr.decode()[-300:])
    return np.frombuffer(r.stdout, np.float32).copy()

def trim(y):
    hop = int(0.01 * SR); n = len(y) // hop
    db = 20 * np.log10(np.sqrt(np.mean(y[: n * hop].reshape(n, hop) ** 2, 1)) + 1e-12)
    on = np.where(db > max(-50.0, db.max() - 38.0))[0]
    a = max(0, on[0] * hop - int(0.03 * SR)); b = min(len(y), (on[-1] + 1) * hop + int(0.08 * SR))
    return y[a:b], a / SR

def tighten(y, keep=0.09, longer=0.12):
    # Gen Z jump cuts inside a line: every pause longer than 120 ms becomes 90 ms (45 ms of its start + 45 ms of its end, 5 ms crossfade).
    # Returns the new audio and a warp from old to new time (for the captions).
    hop = int(0.005 * SR); n = len(y) // hop
    db = 20 * np.log10(np.sqrt(np.mean(y[: n * hop].reshape(n, hop) ** 2, 1)) + 1e-12); quiet = db <= db.max() - 36
    runs, i = [], 0
    while i < n:
        if quiet[i]:
            j = i
            while j < n and quiet[j]: j += 1
            if i > 0 and j < n and (j - i) * hop / SR > longer: runs.append((i * hop, j * hop))
            i = j
        else: i += 1
    if not runs: return y, (lambda t: t)
    h = int(keep / 2 * SR); xf = int(0.005 * SR); out, pos, bp = [], 0, [(0.0, 0.0)]; acc = 0
    for a, b in runs:
        out.append(y[pos:a + h]); acc += (a + h) - pos
        bp.append(((a + h) / SR, acc / SR))
        tail = y[b - h:b].copy(); last = out[-1]
        if len(last) > xf and len(tail) > xf:
            w = np.linspace(0, 1, xf); tail[:xf] = tail[:xf] * w + last[-xf:] * (1 - w); out[-1] = last[:-xf]; acc -= xf
        bp.append(((b - h) / SR, acc / SR)); out.append(tail); acc += len(tail); pos = b
    out.append(y[pos:]); bp.append((len(y) / SR, (acc + len(y) - pos) / SR))
    xo, xn = np.array([q[0] for q in bp]), np.array([q[1] for q in bp])
    return np.concatenate(out), (lambda t: float(np.interp(t, xo, xn)))

def active_db(y):
    hop = int(0.02 * SR); n = len(y) // hop
    db = 20 * np.log10(np.sqrt(np.mean(y[: n * hop].reshape(n, hop) ** 2, 1)) + 1e-12); act = db[db > db.max() - 30]
    return 10 * np.log10(np.mean(10 ** (act / 10)))

# ---- 1. measure
clips = {}
for s in segs:
    y, lead = trim(decode(os.path.join(VO, s['id'] + '.mp3'), TEMPO))
    y, warp = tighten(y)
    clips[s['id']] = (y * (10 ** ((-20.0 - active_db(y)) / 20)), lead, warp)

# ---- 2. holds
holds = {}
def bt(k): return (k + sum(n for p, n in holds.items() if k >= p)) * B
def place():
    out, prev = [], 0.0
    for s in segs:
        st = max(bt(s['beat']) + s['off'], prev + GAP); d = len(clips[s['id']][0]) / SR; out.append((st, st + d)); prev = st + d
    return out
for _ in range(200):
    P = place(); fixed = True
    for i, s in enumerate(segs):
        nxt = bt(segs[i + 1]['beat']) + segs[i + 1]['off'] if i + 1 < len(segs) else bt(208) - 0.7
        if P[i][1] + GAP > nxt + 0.02:
            c = [p for p in CAND.get(s['id'], []) if s['beat'] < p and (i + 1 == len(segs) or p < segs[i + 1]['beat'])]
            if not c: continue
            p = min(c, key=lambda q: holds.get(q, 0)); holds[p] = holds.get(p, 0) + 4; fixed = False; break
    if fixed: break
H = sorted([p, n, round(p)] for p, n in holds.items())
src = re.sub(r'const HOLDS = \[.*?\];', 'const HOLDS = ' + json.dumps(H) + ';', src, count=1)
open(FILM, 'w', encoding='utf-8').write(src)
DUR = bt(208); N = int(round(DUR * SR)); P = place()
print(f'BPM {BPM:g} · holds {sum(holds.values())} beats at {sorted(holds)} · film {DUR:.2f} s')

# ---- 3. place
track = np.zeros(N, np.float32); rep = []
for (st, en), s in zip(P, segs):
    y = clips[s['id']][0]; a = int(round(st * SR)); b = min(N, a + len(y)); track[a:b] += y[: b - a]
    f = int(0.006 * SR); track[a:a + f] *= np.linspace(0, 1, f); track[b - f:b] *= np.linspace(1, 0, f)
    anchor = bt(s['beat']) + s['off']
    rep.append({'id': s['id'], 'anchor': round(anchor, 3), 'start': round(st, 3), 'end': round(en, 3), 'drift': round(st - anchor, 3)})
    print(f"{s['id']} anchor {anchor:6.2f} start {st:6.2f} end {en:6.2f} drift {st - anchor:+.2f}")
sf.write('vo_raw.wav', track, SR, subtype='FLOAT')
r = subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', 'vo_raw.wav', '-af',
                    'highpass=f=80,acompressor=threshold=0.08:ratio=3:attack=6:release=120:makeup=1.4,equalizer=f=3500:t=q:w=1.3:g=2,equalizer=f=250:t=q:w=1:g=-1.5',
                    '-ac', '2', '-c:a', 'pcm_f32le', 'vo_track.wav'], capture_output=True, text=True)
if r.returncode: raise SystemExit(r.stderr[-400:])
json.dump(rep, open('vo_report.json', 'w'), indent=1)

# ---- 4. captions
NIQ = re.compile('[֑-ׇ]')
def words_of(seg):
    j = json.load(open(os.path.join(VO, seg['id'] + '.json'), encoding='utf-8'))
    al = j.get('alignment') or j.get('normalized_alignment')
    ch, t0s, t1s = al['characters'], al['character_start_times_seconds'], al['character_end_times_seconds']
    ws, cur = [], None
    for c, a, b in zip(ch, t0s, t1s):
        if c.isspace():
            if cur: ws.append(cur); cur = None
            continue
        if cur is None: cur = {'w': '', 't0': a, 't1': b}
        cur['w'] += c; cur['t1'] = b
    if cur: ws.append(cur)
    out, intag = [], False
    for w in ws:                                     # drop audio tags like [excited]
        if w['w'].startswith('['): intag = not w['w'].endswith(']'); continue
        if intag: intag = not w['w'].endswith(']'); continue
        out.append(w)
    return out
chunks = []
for (st, en), s in zip(P, segs):
    lead, warp = clips[s['id']][1], clips[s['id']][2]
    ws = []
    for w in words_of(s):
        disp = NIQ.sub('', w['w']).strip('.,:;—–-"״׳\'')
        if not disp: continue
        ws.append({'w': disp, 't0': round(st + warp(max(0, w['t0'] / TEMPO - lead)), 3), 't1': round(st + warp(max(0, w['t1'] / TEMPO - lead)), 3), 'brk': bool(re.search(r'[.,:;?!—]$', w['w']))})
    cur = []
    for w in ws:
        cur.append(w)
        if w['brk'] or len(cur) >= 3 or sum(len(x['w']) for x in cur) >= 15: chunks.append(cur); cur = []
    if cur: chunks.append(cur)
C = []
for i, c in enumerate(chunks):
    end = c[-1]['t1'] + 0.35
    if i + 1 < len(chunks): end = min(end, chunks[i + 1][0]['t0'] - 0.02)
    C.append({'t0': c[0]['t0'], 'end': round(max(end, c[-1]['t1'] + 0.05), 3), 'words': [{k: w[k] for k in ('w', 't0', 't1')} for w in c]})
json.dump({'chunks': C}, open('/home/claude/motion-in-code/kit/films/explainer/captions.json', 'w', encoding='utf-8'), ensure_ascii=False)
speech = sum(e - s for s, e in P)
print(f'captions: {len(C)} chunks · speech {speech:.1f} s · {sum(len(c["words"]) for c in C) / speech:.2f} words/s')
