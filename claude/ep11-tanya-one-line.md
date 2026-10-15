# EP11 — "קו אחד": Sefer HaTanya and the Alter Rebbe, told by one line

One continuous line drawn by one glowing dot (the pen head, which is also the candle flame). 2D canvas only, one pure `seek(t)`.

## Outputs
| file | where | spec |
|---|---|---|
| `tanya-line-16x9.mp4` | `C:\Users\User\Videos\motion-in-code\` (CRF 14 master, PC only) | 1920×1080, 60 fps, 3598 frames, 59.967 s |
| `tanya-line-9x16.mp4` | same | 1080×1920, 60 fps, 3598 frames |
| `chat\tanya-line-*-chat.mp4` | same | CRF 24 copies, 8.2 / 7.3 MiB |

QA (on the final MP4s): frame count 3598 both · single-frame pop scan: **none** both · first-vs-last frame mean abs diff 0.006 (16:9) / 0.005 (9:16) · loudness −14.1 LUFS, −2.8 dBTP (AAC) · 20 stills per layout pulled from the MP4s and inspected.

## Source
- `kit/films/tanya-line/film.js` (scenes, layouts, morph chain, pen chain), `engine.js` (arc-length resampling, Bézier sampler, closed-form morph spring f=1.3 Hz ζ=0.8, alignment over direction + 64 cyclic offsets, ink cooling, orthographic globe with horizon clipping, great circles, DUR-periodic noise), `draw.js` (chips, mask-line text, pins, flames, pen dot), `data.js` (generated), `fonts.css` (generated, @fontsource woff2 inlined), `beatmap.md`, `cues.json`, `tools/`.
- Build: `node tools/prep.mjs` (world-atlas → land-110m rings, land-50m + countries-50m borders cut to lon 12–50 / lat 40–68, figure trace, fonts) → `node tools/build.mjs` → `film.html` (one file, no network). `?L=h|v`, `window.renderFrame(t, 6, 0.5, 60)`.
- Render: `go.ps1` → kit `run.ps1` (6 workers per layout, 6 subframes / 0.5-frame shutter, x264 CRF 14) → `mix.py` → `pops_mp4.py`. ~11 fps per worker on the 4090; whole film ≈ 5 min per layout.

## Timings
128.09 BPM, beat 0.46842 s, first beat 0.2815 s, song drop on song beat 52 (re-measured from the mp3; see fallbacks) → S0 = 2.1552 s, film b48 = drop = 19 Kislev.
Night b0–48 (dot · traced figure · book · RTL timeline 2026→1745 · limb · globe spin onto Liozna · log zoom · copies · stamp at Slavuta · route to the Peter and Paul Fortress · bars) → Day b48–108 (flood 0.35 s + spectrum shockwave · book · two souls · small city · candle · globe with five pins · ring of days · verse) → dusk time-lapse b108–120 → un-draw b120–126.5 → dot at centre. Full per-beat table: `kit/films/tanya-line/beatmap.md`.

## Choices
- PORTRAIT = "traditional" (ref/portrait.png exists — the user's reference, converted from webp). Skeleton trace: threshold < 150 → skeletonize → pixel chains → junction merge → smooth → RDP ε 1.5 → drop < 16 px (< 10 px in the face) → **bands bottom→top, boustrophedon sweep** (plain greedy left long jumps across the face) → visible travel joins. Around the bust: authored candle, desk, page stack, hand + quill; joins between authored parts are retraces of existing ink so they add no stray lines. The line ends with "his back" (a curve from the hat down to the desk) and runs home along the desk to the flame. Caption "הדיוקן המסורתי" whenever the bust is on screen.
- Every scene is the previous line: figure → book → timeline → limb (= globe edge) → flood circle → day book → open spread → city (the two halves are the two souls, coral/cyan by the spread's own point order) → candle → day globe → book → figure. Main line = sum of morph springs (one per change) over shapes aligned once at init.
- The 8 written lines become the cover's title rule; "תניא" rises out of it.
- Pen head = chain of position sources blended with critically damped springs; splits into two flames b57–68, one candle flame b68–76.
- Timeline: x(year) = x₀ − (year−1745)·k, k = 0.6·W/67; no tick labels (numbers not in facts); 1798 marker above the line, 1796 below (2 years apart would collide).
- Day pins navy on the sky; neon spectrum only on the drop shockwave and the "דברים ל׳, י״ד" pill.

## Fallbacks used
1. `claude/ep10-tanya-one-line-engine.md` is not in the repo → engine written from the prompt + kit core/ui.
2. `analysis.json` `music` held Cat Walk, not A New Life → re-analysed `a-new-life-543.mp3` with the same analyzer; values match the prompt (128.09 / 0.46842 / 0.2815 / drop 52); stored as `music_a_new_life`.
3. N = 8000 points per line instead of 1200: the traced portrait loses its beard and eyes at 1200.
4. Kickers: Anton has no Hebrew → "קו אחד." in Rubik 900 with 2 px tracking (Anton kept for numerals and the Latin credit).
5. Missing SFX downloaded from Mixkit and measured into `analysis.json`: pen on paper 2367, metal hammer hit 833 (bar clang), single heartbeat 490, crystal chime 3108, deep wind hum 1177 (swell), wood hard hit 2182 (stamp), page turn 1104.
6. kit `mix_cues.py` fails on Windows with ~190 ffmpeg inputs (WinError 206) → `mix.py` sums all SFX into one bed with numpy (start = event − peak), then limiter + two-pass loudnorm. WAV target −3.2 dBTP so the AAC lands under −1.5.
7. Slavuta has no coordinates in the Wikipedia API → read from its infobox (50°18′10″N 26°52′06″E).
8. No logo in the film (none needed; credit is a text chip) — nothing from `yuv-design-system/assets` used.
9. Render ran as an attached background job instead of a detached `Start-Process` (same scripts).
10. Two extra SVGs sent mid-build (770, the Lubavitcher Rebbe) are outside <facts> → filed in `tanya-line/ref/extra`, not used.

## Gotchas hit
- Greedy stroke order on an engraving draws long jumps across the face; sweep bands instead.
- Rolling digits need a clip tighter than the glyph line or the neighbour digit peeks in.
- Book title rising during a morph looks detached — schedule text after the line settles.
- The navy→fire ink change must wait until the dusk sky is dark, or the line vanishes on the orange horizon.
- AAC adds ~1 dB of true peak over the WAV.

## The 770 cut (`?cut=770`) — added after delivery
The user sent two more SVGs (VTracer colour traces): 770 Eastern Parkway and the Lubavitcher Rebbe. The main film above is unchanged (re-verified after the change: same frame count, no pops, same loudness). A second cut inserts one 16-beat phrase at b88, after the day globe:

| beat | on screen | words |
|---:|---|---|
| 88–90 | the globe turns to New York; land un-draws; pin pops | "770 · ברוקלין, ניו יורק" |
| 90–95 | the limb flows into 770 Eastern Parkway (one line) | "770." · "איסטערן פארקוויי." · chip "מרכז חב״ד העולמי · מאז 1940" |
| 95–101 | 770 flows into the Lubavitcher Rebbe (one line) | "הרבי מליובאוויטש." · chip "1902–1994" · "להפיץ את התניא." |
| 101–104 | the Rebbe flows back into the same limb; land and pins return | — |
| 104→ | the main film's b88 onward, 16 beats later | |

- Implementation: `drawFrame` time-warp — t < b88 main film, b88–104 `drawCoda`, after that the main film at t − 16 beats. The coda's line is its own sum-of-springs chain starting and ending on the main line's exact state at b88, so the hand-over is seamless. 144 beats = 4048 frames.
- Facts (en.wikipedia.org, local copies in `yuvwork/chabad/facts`): 770 Eastern Parkway, Crown Heights, Brooklyn = World Headquarters of Chabad-Lubavitch, bought 1940 (coordinates 40.669021, −73.94287 from its page); Menachem Mendel Schneerson 1902–1994; "the Rebbes of Chabad taught that it is a sacred duty to publish and distribute this book as widely as possible" (Tanya article) → "להפיץ את התניא.". "איסטערן פארקוויי" is the Yiddish spelling given on Wikipedia.
- Drawings: 770 is authored as strokes over the user's image (three gables, bay window, door, windows, steps, garden wall); the Rebbe is iso-luminance contours (gaussian σ 2, levels .30/.45/.62) inside the head plus an authored hat crown and under-brim edge. Canny edges on a posterised image gave region seams, not a face — rejected. Strokes are ordered by a multi-start nearest-neighbour search (closed loops entered at their nearest point) and every join is routed along ink already drawn (Dijkstra over the stroke graph, gap jumps ×4), so travel retraces lines instead of cutting across the face.
- Outputs: `tanya-line-770-16x9.mp4` / `-9x16.mp4` (CRF 14, 26.3 / 25.6 MiB) + chat copies (9.7 / 8.6 MiB). QA: 4048 frames, pops none, first-vs-last diff 0.006 / 0.005, −13.9 LUFS, −2.8 dBTP.
- Audio: `cues770.json` = main cues shifted 16 beats from b88 + whooshes / pops / chimes for the phrase. The song simply continues (A New Life is 99 s long).
- Not committed: the SVGs and PNG references (user assets). `data.js` carries the derived line traces.
