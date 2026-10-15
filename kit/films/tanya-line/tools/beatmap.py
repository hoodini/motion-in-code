import json
B = 60 / 128.09
cues = json.load(open('cues.json', encoding='utf-8'))
sfx = {}
for n, t, g in cues['cues']: sfx.setdefault(int(t / B + 1e-6), []).append(n)
for f, ss, ln, at, g in cues['slices']: sfx.setdefault(int(at / B + 1e-6), []).append(f.split('/')[-1].split('-')[0] + ' slice')
R = [  # (b0, b1, on screen, grows out of, words)
 (0, 2, 'navy frame, one fire dot breathing at centre', '—', 'b1.5 kicker "קו אחד."'),
 (2, 6, 'the dot draws the candle, desk, page stack, hand + quill, then the traced bust (bottom→top); a stroke pass ends on every 8th note', 'the dot (centre → candle flame)', 'caption "הדיוקן המסורתי"'),
 (6, 12, 'bust, hat, beard, his back; home along the desk to the flame by b12', 'the same line', 'b6 "רבי שניאור זלמן" · b8 "מליאדי." · b10 "אדמו״ר הזקן."'),
 (12, 14, 'the quill writes 8 short lines on the top page, one per 16th', 'the page of the figure', 'b12 chip "20 שנה של כתיבה"'),
 (14, 16, 'the whole figure flows (staggered wave) into a closed book; the flame rides to the cover corner; the written lines become the title rule', 'the figure line', '—'),
 (16, 20, 'title rises out of the rule', 'the cover', 'b16 "תניא" · b17 "ליקוטי אמרים" · b18 chip "השם = המילה הראשונה בספר"'),
 (20, 22, 'the cover outline unrolls into one horizontal line = the timeline; ticks pop on 8th notes', 'the book outline', '—'),
 (22, 28, 'camera travels right (RTL) from 2026 to 1745; giant Anton counter rolls; markers pop as they enter', 'the timeline', 'markers "1812", "1798 · נאסר", "1796 · נדפס"'),
 (28, 32, 'lands on 1745; both ends of the line curl around the dot and close into a circle on b31.5', 'the timeline', 'b28 "1745 · ה׳תק״ה" · b28.5 "נולד."'),
 (32, 36, 'land-110m draws in (1 beat), globe spins 1.25 turns, lands on Liozna on b36', 'the circle = the limb', 'b36 pin "ליוזנא · 1745" + "היום: בלארוס"'),
 (36, 38, 'log zoom; 110m retracts while land-50m and dotted today-borders draw in', 'the globe', 'chip "גבולות של היום"'),
 (38, 42, '8 hand-copied pages fly out of Liozna on arcs (8th notes); coral strikes on 16ths from b40', 'Liozna pin', 'b38 "הועתק ביד." · b40 "ונפלו טעויות."'),
 (42, 44, 'copies collapse into one page at Slavuta; stamp squashes it on b43 → printed page', 'the pages', 'b43 "נדפס." · pin "סלאוויטא · 1796" + "היום: אוקראינה"'),
 (44, 46, 'great-circle route Liozna → St Petersburg draws, the dot rides its head', 'Liozna', 'chip "תשרי ה׳תקנ״ט · 1798" · b44.5 "נאסר." · pin "פטרבורג · מבצר פטרופבלובסק"'),
 (46, 48, 'prison bars drop one per 16th; calendar rolls תשרי → חשוון → כסלו on 8ths; heartbeat on b46/46.5/47/47.5', 'the frame', '—'),
 (48, 52, 'DROP: calendar lands on "י״ט כסלו", bars spring apart, the centre gap floods into the day sky (0.35 s), spectrum shockwave, camera kick', 'the dot at centre', 'b48 "י״ט כסלו." · b49 "שוחרר." · b50 "ראש השנה לחסידות."'),
 (52, 56, 'the flood edge contracts into the closed book (navy on sky); fire-marker title; the cover pushes open RTL (b55.4)', 'the flood circle', '"תניא" on the cover · b56 chip "פרק ב׳"'),
 (56, 60, 'the flame splits into coral and cyan flames; the two halves of the line take their colours', 'the open book', 'b57 "שתי נפשות." · quote פרק ב׳ line by line'),
 (60, 68, 'the two halves draw a small city from both sides; two crowns pop b62 (coral), b63 (cyan)', 'the two pages', 'chip "פרק ט׳" · b61 "עיר קטנה." · quote פרק ט׳'),
 (68, 76, 'the city flows into one candle; the two flames merge; the flame leans upward on every beat', 'the city', 'chip "פרק י״ט" · b69 "הנר." · quote פרק י״ט'),
 (76, 88, 'the flame rises and the line becomes a day globe; pins pop on beats: Slavuta, Adelaide, Harare, Alexandria, Cairo', 'the candle', 'b80 "אלפי מהדורות." · b82 "בכל העולם."'),
 (88, 96, 'a ring of day ticks fills on 16ths and closes on a fire mark', 'the globe', 'b88 "לומדים כל יום." · b92 "ומסיימים בי״ט כסלו." · chip "י״ט כסלו"'),
 (96, 108, 'ring and globe collapse into the closed book; the verse rises word by word with fire markers', 'the globe limb', '"כי קרוב אליך הדבר מאד" b97–101 · chip "דברים ל׳, י״ד" · b104 "ספר של בינונים." · b106 "מדת כל אדם." + chip "פרק י״ד"'),
 (108, 120, 'sky time-lapse day → dusk → navy; the book outline flows back into the seated figure', 'the book', 'caption "הדיוקן המסורתי" · b112–118 chip "MADE WITH YUV.AI MOTION · 100% CODE"'),
 (120, 128, 'the pen retraces the figure backwards into the candle flame; the dot returns to centre and breathes; last frame = frame 0', 'the figure', '—'),
]
L = ['# tanya-line — beatmap', '', '128.09 BPM · beat 0.46842 s · 128 beats = 3598 frames @ 60 fps · song offset S0 = 2.1552 s (song beat 52 = film b48)', '',
     '| beat | time | on screen | grows out of | words | SFX |', '|---:|---:|---|---|---|---|']
for k in range(128):
    r = next(x for x in R if x[0] <= k < x[1]); first = k == r[0]
    L.append(f"| {k} | {k * B:6.3f} | {r[2] if first else '↳'} | {r[3] if first else ''} | {r[4] if first else ''} | {', '.join(sorted(set(sfx.get(k, [])))) or '·'} |")
open('beatmap.md', 'w', encoding='utf-8').write('\n'.join(L) + '\n'); print(len(L))
