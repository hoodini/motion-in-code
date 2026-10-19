"""v3 score for 'סרטון = קוד' (Gen Z edit): fitted music bed (music_align.py → bed.wav) + Kenney CC0 SFX placed by measured peak
+ the narration (vo_prep3.py → vo_track.wav) with the bed ducked under it; two-pass loudnorm to -14 LUFS / -1.5 dBTP.
Also writes impulses.json (the camera punches) from the same moments as the hits, so every punch lands with its sound.
usage: python mix3.py [mux]"""
import numpy as np, soundfile as sf, subprocess, json, re, sys, os
SR = 48000
FILM = '/home/claude/motion-in-code/kit/films/explainer/film.js'
src_js = open(FILM, encoding='utf-8').read()
BPM = float(re.search(r'const BPM = ([\d.]+);', src_js).group(1)); B = 60 / BPM
HOLDS = json.loads(re.search(r'const HOLDS = (\[.*?\]);', src_js).group(1))
bt = lambda k: (k + sum(n for p, n, _ in HOLDS if k >= p)) * B
NB = 208; DUR = bt(NB); N = int(round(DUR * SR))
WORK = os.path.dirname(os.path.abspath(__file__)); SFXD = '/home/claude/work/sfx'
mus, r = sf.read(os.path.join(WORK, 'bed.wav'), dtype='float32'); assert r == SR
mus = np.vstack([mus, np.zeros((max(0, N - len(mus)), 2), np.float32)])[:N]

SFX = {}
def load(n):
    if n not in SFX:
        y, r = sf.read(f'{SFXD}/{n}.wav', dtype='float32'); assert r == SR
        SFX[n] = (y, np.argmax(np.abs(y).max(1)) / SR)
    return SFX[n]
C, IMP = [], []
def cue(n, t, g): C.append((n, t, g))
def hit(t, s): IMP.append([round(t, 4), s])

# ---- headlines from film.js: every word slams with a soft thud (and the line's first word punches the camera); kickers pop
for m in re.finditer(r"head\(x, t, L, \d, \[([^\]]*)\], bt\(([\d.]+)\)", src_js):
    words = re.findall(r"'([^']*)'", m.group(1)); t0 = bt(float(m.group(2)))
    for i, _ in enumerate(words): cue('drop_003' if i % 2 == 0 else 'drop_004', t0 + i * B / 2, -11)
    hit(t0, 1)
for m in re.finditer(r"kick\(x, t, L, bt\(([\d.]+)\)", src_js): cue('pluck_002', bt(float(m.group(1))), -14)
# page wipes on the chapter downbeats
for b in (12, 24, 48, 80, 104, 120, 136, 152, 168, 198): cue('maximize_003', bt(b), -9); hit(bt(b), 2)

# ---- A hook: eight cuts on the eighths, a stop, the title drop
for k in range(1, 8): cue('select_001' if k % 2 else 'select_002', k * B / 2, -9); cue('drop_004', k * B / 2, -12)
cue('minimize_007', 7 * B / 2 - 0.05, -8)
cue('maximize_005', bt(4), -3); cue('drop_002', bt(4), -2); hit(bt(4), 3)
for b in (4.2, 4.7, 7, 7.5, 8): cue('drop_003', bt(b), -5); hit(bt(b), 2)
cue('pluck_002', bt(9), -9); cue('minimize_004', bt(11.6), -9)
# the big moments punch hardest
for b in (53, 152, 192): hit(bt(b), 3)
for b in (164, 191): hit(bt(b), 1)
# ---- 01 frames
for i in range(6): cue('tick_004', bt(14) + i * 0.125, -13)
cue('glass_003', bt(16), -8)
for b in (18, 19, 20, 21): cue('scroll_002', bt(b), -11)
cue('select_004', bt(22.5), -8); cue('minimize_002', bt(23.4), -9)
# ---- 02 shapes
for b in (26, 27, 28): cue('scroll_001', bt(b), -12)
cue('pluck_001', bt(27), -6)
cue('toggle_001', bt(29), -4); cue('error_004', bt(29.1), -14); cue('toggle_002', bt(31), -4); cue('toggle_001', bt(33), -4)
cue('select_002', bt(32.5), -11); cue('maximize_007', bt(36.2), -5)
for b in (40, 41, 43): cue('pluck_002', bt(b), -9)
cue('scroll_004', bt(42), -13); cue('minimize_002', bt(46.4), -7)
# ---- 03 morph
cue('drop_002', bt(48), -5)
cue('pluck_001', bt(50.1), -9); cue('pluck_001', bt(50.35), -9)
cue('click_001', bt(53), -2); cue('maximize_004', bt(53), -4); cue('minimize_005', bt(55), -6)
cue('glass_004', bt(56), -5); cue('pluck_002', bt(57), -9); cue('maximize_008', bt(60), -6)
for i in range(4): cue('select_001', bt(61.6) + i * B, -10)
# ---- 04 beat
cue('pluck_002', bt(66), -9)
for b in range(66, 74): cue('tick_002', bt(b), -11)
for b in range(68, 74): cue('drop_004', bt(b) - 0.06, -9)
cue('glass_003', bt(74.2), -8); cue('scroll_003', bt(75), -11)
# ---- 05 prompt
for i in range(6): cue('pluck_001' if i % 2 == 0 else 'pluck_002', bt(82 + i), -8)
for i in range(3):
    t0 = bt(90 + 2 * i); cue('select_002', t0, -9); cue('scratch_002', t0 + 0.42, -11); cue('pluck_002', t0 + 0.55, -7)
for i in range(4): cue('error_002', bt(97.5) + i * B, -11)
cue('minimize_006', bt(102), -6); cue('question_001', bt(103), -6)
# ---- 06 words
for i in range(8): cue('pluck_001', bt(106) + i * B / 2, -12)
cue('select_004', bt(115), -8); cue('minimize_009', bt(117.5), -8)
# ---- 07 engines
cue('glass_001', bt(122.5), -8); cue('glass_002', bt(123), -8); cue('maximize_002', bt(125.6), -6); cue('select_002', bt(126.6), -10)
for i in range(4): cue('pluck_002', bt(130.5) + i * B / 2, -8)
cue('glitch_001', bt(133), -11); cue('maximize_009', bt(133), -9); cue('glass_005', bt(134), -8); cue('minimize_003', bt(135.6), -8)
# ---- 08 real world + breakdown
cue('glass_003', bt(136.6), -8); cue('pluck_001', bt(137), -8); cue('scratch_001', bt(137.5), -13); cue('scroll_005', bt(139), -13)
for i in range(4): cue('select_001', bt(138 + i), -11)
cue('confirmation_001', bt(142.8), -6)
cue('minimize_004', bt(144), -8); cue('glass_006', bt(144.6), -10)
cue('pluck_002', bt(145.5), -12); cue('pluck_002', bt(147), -12); cue('pluck_002', bt(147.5), -12); cue('scratch_005', bt(148), -13)
for i in range(4): cue('select_003', bt(148 + i), -14)
# ---- 09 builder
cue('maximize_001', bt(152), -5); cue('drop_002', bt(152), -5)
for i in range(4): cue('tick_004', bt(152.6) + i * 0.12, -15)
cue('click_002', bt(153.5), -6)
for i in range(5): cue('switch_002', bt(154) + i * 0.125, -12)
for i in range(5): cue('pluck_001', bt(155 + i), -9)
cue('pluck_002', bt(159.5), -6); cue('select_001', bt(158), -11)
for i in range(12): cue('click_005', bt(160) + i * 0.27, -15)
cue('tick_002', bt(163), -12); cue('click_001', bt(164), -3); cue('confirmation_002', bt(164.2), -5)
cue('minimize_007', bt(166.6), -6); cue('pluck_002', bt(167.4), -8)
# ---- 10 render
for i in range(4): cue('pluck_001', bt(170 + i * 0.5), -8)
for i in range(3): cue('scroll_001', bt(170.3 + i * 0.5), -14)
cue('tick_001', bt(172), -12); cue('minimize_002', bt(175.6), -8); cue('glass_003', bt(176.5), -8)
cue('maximize_003', bt(184.5), -8); cue('select_002', bt(185.5), -9); cue('select_002', bt(186), -9); cue('minimize_005', bt(188.6), -6)
cue('click_001', bt(191), -2); cue('maximize_005', bt(192), -3); cue('drop_002', bt(192), -3)
# ---- finale
for b in (192.5, 193, 193.5, 194, 195, 195.5, 196, 196.5): cue('drop_003', bt(b), -6)
cue('minimize_004', bt(197.6), -7); cue('glass_004', bt(198.4), -5); cue('drop_002', bt(199), -4); cue('pluck_002', bt(199.5), -8)
cue('select_004', bt(200.5), -7); cue('tick_004', bt(201.5), -12); cue('tick_004', bt(202.5), -12); cue('confirmation_003', bt(204), -8)


fx = np.zeros_like(mus)
for n, t, g in C:
    y, pk = load(n); st = int(np.floor((t - pk) * SR + 0.5)); cut = max(0, -st); st = max(0, st)
    seg = y[cut:] * (10 ** (g / 20)); e = min(N, st + len(seg)); fx[st:e] += seg[: e - st]
json.dump(sorted(IMP), open('/home/claude/motion-in-code/kit/films/explainer/impulses.json', 'w'))
mix = mus * 0.9 + fx * 0.5
vo_p = os.path.join(WORK, 'vo_track.wav')
if os.path.exists(vo_p) and 'novo' not in sys.argv:
    vo, r = sf.read(vo_p, dtype='float32'); assert r == SR
    vo = np.vstack([vo, np.zeros((max(0, N - len(vo)), 2), np.float32)])[:N]
    hop = 480; nf = N // hop + 1; v1 = np.pad(vo.mean(1), (0, nf * hop - N))
    rms = np.sqrt(np.mean(v1.reshape(nf, hop) ** 2, 1) + 1e-12); act = 20 * np.log10(rms) > -42
    hold = int(0.15 * SR / hop); a2 = act.copy()
    for k in range(1, hold + 1): a2[:-k] |= act[k:]; a2[k:] |= act[:-k]
    def env(depth_db):
        g = np.zeros(nf); cur = 0.0; ka = 1 - np.exp(-hop / SR / 0.05); kr = 1 - np.exp(-hop / SR / 0.3)
        for k in range(nf):
            tgt = depth_db if a2[k] else 0.0; cur += (tgt - cur) * (ka if tgt < cur else kr); g[k] = cur
        return np.interp(np.arange(N), np.arange(nf) * hop, 10 ** (g / 20)).astype(np.float32)[:, None]
    gm, gf = env(-8.0), env(-5.0)
    bed = mus * 0.9 * gm + fx * 0.5 * gf
    on = np.repeat(act, hop)[:N]
    lv = lambda y: 10 * np.log10(np.mean(y[on] ** 2) + 1e-12)
    gv = 10 ** ((lv(bed) + 8.5 - lv(vo)) / 20)
    mix = bed + vo * gv
    print(f'narration: {on.mean() * DUR:.1f} s of speech, voice gain {20 * np.log10(gv):+.1f} dB, voice over bed {lv(vo * gv) - lv(bed):+.1f} dB')
os.chdir(WORK); sf.write('mix_raw.wav', mix, SR, subtype='FLOAT')
print(len(C), 'cues ·', len(IMP), 'camera punches')
run = lambda a: subprocess.run(['ffmpeg', '-y', '-hide_banner'] + a, capture_output=True, text=True)
r = run(['-i', 'mix_raw.wav', '-af', 'loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json', '-f', 'null', '-'])
m = json.loads(re.findall(r'\{[^{}]*"input_i"[^{}]*\}', r.stderr)[-1])
ln = f"loudnorm=I=-14:TP=-1.5:LRA=11:measured_I={m['input_i']}:measured_TP={m['input_tp']}:measured_LRA={m['input_lra']}:measured_thresh={m['input_thresh']}:offset={m['target_offset']}:linear=true"
run(['-i', 'mix_raw.wav', '-af', ln + ',aresample=48000', '-c:a', 'pcm_s16le', 'audio.wav'])
chk = run(['-i', 'audio.wav', '-af', 'ebur128=peak=true', '-f', 'null', '-'])
I = float(re.findall(r'I:\s+(-?[\d.]+) LUFS', chk.stderr)[-1]); TP = float(re.findall(r'Peak:\s+(-?[\d.]+) dBFS', chk.stderr)[-1])
print('loudness', I, 'LUFS · true peak', TP, 'dBFS')
if TP > -1.5 or abs(I + 14) > 0.5:
    run(['-i', 'mix_raw.wav', '-af', 'alimiter=limit=0.7:attack=2:release=60:level=false', '-c:a', 'pcm_f32le', 'mix_lim.wav'])
    c2 = run(['-i', 'mix_lim.wav', '-af', 'ebur128', '-f', 'null', '-']); I2 = float(re.findall(r'I:\s+(-?[\d.]+) LUFS', c2.stderr)[-1])
    run(['-i', 'mix_lim.wav', '-af', f'volume={-14 - I2:.2f}dB,alimiter=limit={10 ** (-1.6 / 20):.4f}:attack=1:release=50:level=false,aresample=48000', '-c:a', 'pcm_s16le', 'audio.wav'])
    chk = run(['-i', 'audio.wav', '-af', 'ebur128=peak=true', '-f', 'null', '-'])
    print('after limiter:', re.findall(r'I:\s+(-?[\d.]+) LUFS', chk.stderr)[-1], 'LUFS ·', re.findall(r'Peak:\s+(-?[\d.]+) dBFS', chk.stderr)[-1], 'dBFS')
if 'mux' in sys.argv:
    R = os.path.join(WORK, 'render'); os.makedirs('/home/claude/work/out', exist_ok=True)
    for L, name in (('v', 'sirton-kod-genz-9x16'), ('h', 'sirton-kod-genz-16x9')):
        src = f'{R}/film_{L}.mp4'
        if not os.path.exists(src): print('missing', src); continue
        out = f'/home/claude/work/out/{name}.mp4'
        r = run(['-i', src, '-i', 'audio.wav', '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '256k', '-t', f'{DUR:.4f}', '-movflags', '+faststart', out])
        print(out, 'ok' if r.returncode == 0 else r.stderr[-500:])
