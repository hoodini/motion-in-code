"""Cue sheet for tanya-line -> cues.json (read by mix_cues.py). Every time is a beat of the film; SFX land on their measured peak."""
import json
B = 60 / 128.09; bt = lambda k: k * B
DUR = 3598 / 60
C, S = [], []                        # cues [name, t, gain]; slices [file, ss, len, at, gain]
cue = lambda n, k, g: C.append([n, round(bt(k), 4), g])
pen = lambda k, beats, g, ss=0.15: S.append(['sfx/pen_paper-2367.mp3', ss, round(beats * B, 4), round(bt(k), 4), g])
cue('pop_light', 1.5, -12)
for k in range(20): pen(2 + k / 2, 0.5, -15, 0.12 + 0.37 * (k % 3))          # soft pen-scratch under every stroke pass
for k in (6, 8, 10): cue('pop_hard', k, -8)
cue('pop_long', 12, -8)
for k in range(8): pen(12 + k / 4, 0.22, -17, 0.2 + 0.3 * (k % 4))           # the quill writes
cue('page_turn', 14.4, -5); cue('whoosh_air', 15.0, -13)                       # figure -> book
cue('swoosh_small', 16, -11); cue('swoosh_small', 17, -13); cue('pop_long', 18, -8)
cue('whoosh_fast', 20.6, -10)                                                    # cover unrolls into the timeline
for k in (20.5, 21, 21.5, 22): cue('pop_light', k, -15)
cue('whoosh_cine', 22.6, -9); cue('whoosh_fast', 26.6, -11)
for k in (22.7, 24.7, 25.6): cue('pop_light', k, -11)
cue('impact_deep', 28, -7); cue('pop_hard', 28.5, -9)
cue('swoosh_small', 30.6, -10); cue('pop_light', 31.5, -10)                     # ends curl into the limb
pen(32, 1, -16, 0.3); cue('whoosh_air', 34, -8)                                  # land draws in, globe spins
cue('pop_hard', 36, -8); cue('whoosh_fast', 36.5, -10); pen(36.5, 1, -18, 0.6); cue('pop_light', 37.5, -12)
for j in range(8): cue('page_turn', 38 + j / 2 + 0.15, -11)                      # pages fly out of Liozna
cue('pop_hard', 38, -9)
for k in range(8): cue('click_mouse', 40 + k / 4, -13)                           # coral strikes
cue('pop_hard', 40, -9)
cue('whoosh_fast', 42.4, -12); cue('stamp_wood', 43, -1); cue('impact_deep', 43, -13); cue('pop_long', 43.2, -9); cue('pop_hard', 43, -10)
cue('whoosh_air', 45, -12); pen(44, 1.5, -16, 0.4); cue('pop_long', 44, -9); cue('pop_hard', 44.5, -9); cue('pop_long', 45.5, -9)
for j in range(8): cue('clang', 46 + j / 4, 2)                                   # one clang per bar
for k in (46, 46.5, 47, 47.5): cue('heartbeat', k, -1)
for k in (46.5, 47): cue('click_tone', k, -10)
cue('impact_intro', 48, -3); cue('sparkle', 48.1, -8)                            # the drop: impact + shimmer
for k in (49, 50): cue('pop_hard', k, -9)
cue('whoosh_cine', 52.6, -10); cue('swoosh_small', 53.1, -12); cue('page_turn', 55.6, -5); cue('sparkle', 57, -15)
for k in (56, 60, 68): cue('chime', k, -9)                                       # chapter chips
for k in (57, 61, 69): cue('pop_hard', k, -9)
cue('whoosh_air', 61, -14); cue('pop_long', 62, -8); cue('pop_long', 63, -8); cue('swoosh_small', 68.6, -10)
cue('whoosh_cine', 76.8, -10); pen(77, 1, -17, 0.5)
for k in (77, 79, 81, 83): cue('whoosh_fast', k, -14)
for k in (78, 80, 82, 84, 85): cue('pop_long', k, -9)
for k in (80, 82, 88, 92): cue('pop_hard', k, -9)
for k in range(31): cue('click_tone', 88 + k / 4, -17)                           # the ring of days
cue('chime', 95.75, -7)
cue('whoosh_air', 96.8, -12)
for k in (97, 98, 99, 100, 101): cue('pop_light', k, -10)
cue('chime', 101.5, -8); cue('pop_hard', 104, -9); cue('pop_hard', 106, -9); cue('chime', 106.2, -10)
cue('whoosh_cine', 108.8, -10); cue('pop_long', 112, -10)
S.append(['sfx/swell_hum-1177.mp3', 4.0, round(bt(127.6) - bt(108), 4), round(bt(108), 4), -9])   # low swell under the night return
for k in range(13): pen(120 + k / 2, 0.5, -19, 0.9 - 0.06 * k)                   # the pen retraces
out = {'dur': round(DUR, 4), 'assets': r'C:\Users\User\yuvwork\mic',
       'music': {'file': 'music/a-new-life-543.mp3', 'S0': round(0.2815 + (52 - 48) * 0.46842, 4), 'gain': -2},
       'cues': C, 'slices': S,
       'mux': [['film_h_silent.mp4', r'C:\Users\User\Videos\motion-in-code\tanya-line-16x9.mp4'], ['film_v_silent.mp4', r'C:\Users\User\Videos\motion-in-code\tanya-line-9x16.mp4']]}
json.dump(out, open('cues.json', 'w', encoding='utf-8'), indent=1)
print(len(C), 'cues', len(S), 'slices · S0', out['music']['S0'])
