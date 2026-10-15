"""cues770.json = the main cue sheet with everything from b88 on moved 16 beats later, plus the 770 / Rebbe phrase."""
import json
B = 60 / 128.09; bt = lambda k: k * B; C0, CL = bt(88), 16 * B
M = json.load(open('cues.json', encoding='utf-8'))
sh = lambda t: round(t + CL if t >= C0 - 1e-6 else t, 4)
cues = [[n, sh(t), g] for n, t, g in M['cues']]
sl = [[f, ss, ln, sh(at), g] for f, ss, ln, at, g in M['slices']]
add = lambda n, k, g: cues.append([n, round(bt(k), 4), g])
add('whoosh_air', 89.2, -9)                                   # the globe turns to New York, land un-draws
add('pop_long', 89.5, -8)                                     # 770 pin
add('whoosh_cine', 90.6, -9); add('page_turn', 90.4, -10)     # limb -> 770
add('pop_hard', 91, -8); add('chime', 91.5, -9); add('pop_hard', 92, -9)
add('whoosh_cine', 95.6, -9)                                  # 770 -> the Rebbe
add('pop_hard', 96, -8); add('chime', 96.5, -9); add('pop_hard', 98, -8)
add('whoosh_air', 101.6, -11)                                 # back into the limb
sl.append(['sfx/pen_paper-2367.mp3', 0.4, round(B, 4), round(bt(101.4), 4), -17]); add('pop_long', 102.2, -10)
out = dict(M, dur=round(4048 / 60, 4), cues=cues, slices=sl,
           mux=[['film_h_770_silent.mp4', r'C:\Users\User\Videos\motion-in-code\tanya-line-770-16x9.mp4'], ['film_v_770_silent.mp4', r'C:\Users\User\Videos\motion-in-code\tanya-line-770-9x16.mp4']])
json.dump(out, open('cues770.json', 'w', encoding='utf-8'), indent=1); print(len(cues), 'cues', len(sl), 'slices, dur', out['dur'])
