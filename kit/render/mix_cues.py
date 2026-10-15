"""Score a kit film from a cue sheet: music from a chosen song offset + SFX placed by MEASURED PEAK
(start = event - peak), two-pass loudnorm to -14 LUFS, mux into each silent render.
usage: python mix_cues.py cues.json
cues.json: { "dur": s, "assets": "<folder with analysis.json, music/, sfx/>", "music": {"file": "music/x.mp3", "S0": s, "gain": -2},
             "cues": [["sfx_name", t, gainDb], ...], "slices": [["sfx/file.mp3", ss, len, at, gainDb], ...],
             "mux": [["film_h_silent.mp4", "out-16x9.mp4"], ...] }
analysis.json["sfx"] maps "<name>-<id>" -> {"peak": seconds}; files live at sfx/<name>-<id>.mp3"""
import json, subprocess, re, sys, os
C = json.load(open(sys.argv[1], encoding='utf-8')); A_DIR = C['assets']; A = json.load(open(os.path.join(A_DIR, 'analysis.json')))
DUR = C['dur']; PK = {k.rsplit('-', 1)[0]: (k, v['peak']) for k, v in A['sfx'].items()}
m = C['music']; inputs = ['-ss', f"{m['S0']:.4f}", '-t', f'{DUR:.4f}', '-i', os.path.join(A_DIR, m['file'])]
filt = [f"[0:a]aresample=48000,aformat=channel_layouts=stereo,afade=t=in:d=0.02,afade=t=out:st={DUR - 0.75:.3f}:d=0.75,volume={m.get('gain', -2)}dB[m]"]; labels = ['[m]']
for i, (name, ev, g) in enumerate(C['cues'], start=1):
    f, peak = PK[name]; start = ev - peak; cut = max(0.0, -start); start = max(0.0, start)
    inputs += ['-i', os.path.join(A_DIR, 'sfx', f + '.mp3')]
    filt.append(f'[{i}:a]aresample=48000,aformat=channel_layouts=stereo,atrim=start={cut:.4f},asetpts=PTS-STARTPTS,volume={g}dB,adelay={int(round(start * 1000))}:all=1[s{i}]'); labels.append(f'[s{i}]')
n = len(C['cues'])
for j, (fn, ss, ln, at, g) in enumerate(C.get('slices', []), start=n + 1):
    inputs += ['-ss', f'{ss:.3f}', '-t', f'{ln:.3f}', '-i', os.path.join(A_DIR, fn)]
    filt.append(f'[{j}:a]aresample=48000,aformat=channel_layouts=stereo,afade=t=out:st={max(0, ln - 0.08):.3f}:d=0.08,volume={g}dB,adelay={int(at * 1000)}:all=1[x{j}]'); labels.append(f'[x{j}]')
filt.append(''.join(labels) + f'amix=inputs={len(labels)}:normalize=0:duration=first,atrim=0:{DUR:.4f}[mix]'); fc = ';'.join(filt)
run = lambda a: subprocess.run(['ffmpeg', '-y', '-hide_banner'] + a, capture_output=True, text=True)
r = run(inputs + ['-filter_complex', fc + ';[mix]loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json[o]', '-map', '[o]', '-f', 'null', '-'])
mm = json.loads(re.findall(r'\{[^{}]*"input_i"[^{}]*\}', r.stderr)[-1])
ln = f"loudnorm=I=-14:TP=-1.5:LRA=11:measured_I={mm['input_i']}:measured_TP={mm['input_tp']}:measured_LRA={mm['input_lra']}:measured_thresh={mm['input_thresh']}:offset={mm['target_offset']}:linear=true"
r = run(inputs + ['-filter_complex', fc + f';[mix]{ln},aresample=48000[o]', '-map', '[o]', '-c:a', 'pcm_s16le', 'audio.wav'])
if r.returncode: print(r.stderr[-2000:]); sys.exit(1)
chk = run(['-i', 'audio.wav', '-af', 'ebur128=peak=true', '-f', 'null', '-'])
print('loudness', re.findall(r'I:\s+(-?[\d.]+) LUFS', chk.stderr)[-1], 'LUFS · true peak', re.findall(r'Peak:\s+(-?[\d.]+) dBFS', chk.stderr)[-1], 'dBFS ·', n, 'cues')
for src, out in C['mux']:
    if not os.path.exists(src): print('missing', src); continue
    os.makedirs(os.path.dirname(out) or '.', exist_ok=True)
    r = run(['-i', src, '-i', 'audio.wav', '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '256k', '-t', f'{DUR:.4f}', '-movflags', '+faststart', out])
    print(out, 'ok' if r.returncode == 0 else r.stderr[-600:])
