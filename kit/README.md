# YUV.AI Motion Kit

Code-only launch & explainer videos. Every film is **one pure function of time** (`seek(t)`), captured frame-by-frame with Playwright at 60 fps (6-subframe motion blur), encoded with ffmpeg, scored with real music + SFX placed by their **measured peak**. 2D on canvas, 3D with three.js, same clock.

Built on the method published by [@twoclipping](https://x.com/twoclipping), with the full breakdown at **https://hoodini.github.io/motion-in-code/**.

```
kit/
  src/core.js      math (springs, sum-of-springs, log zoom), brand themes (phoenix · spectrum), type, colour spreads, render API
  src/ui.js        cards with radius + depth, neon glow edges, slam type, popping typing, cursor + click, chips, counters, bars
  src/world.js     three.js: procedural phone + laptop with LIVE screens, 3D cards, day↔sunset sky (shader, clouds), ocean, PBR env
  src/people.js    people drawn in code: squat / run / push-up / sit-with-phone poses (feet planted, IK arms), drawPerson
  films/launch/    the flagship (68 beats, ~33 s): neon prompt in a day sky → 16th-note typing → click → card burst → 3D carousel
                   snapping on beats → iPhone + MacBook (lid opens on the beat) → day→sunset time-lapse → neon stats → logo
  films/fitness/   product story (84 beats, ~40 s): the problem in a dark room → heartbeat → drop → dive into the app, scroll, tap
                   → people training in sync with the phone → 30-day streak + chart → three reasons → CTA
  films/kit-demo/  shorter example: input → type (camera tracks caret) → click → card → lands on a 3D phone → sea → sky → logo
  films/motion-in-code-v2/standalone.html   2D magazine-style example (7 rules film)
  build.mjs        bundles a film + three.js + brand PNGs into ONE self-contained film.html
  qa/qa.py         stills / per-beat contact sheet / single-frame pop detector (works headless, SwiftShader WebGL)
  render/          render.js (Playwright → ffmpeg segment), run.ps1 (parallel workers + concat), mix_cues.py (score + loudnorm + mux)
```

## Quick start
```bash
npm i
cp ~/.claude/skills/yuv-design-system/assets/logo-*.png brand/   # brand PNGs are private, not in this repo
node build.mjs kit-demo                                          # -> films/kit-demo/film.html
KIT_FONTS=<@fontsource dir> python qa/qa.py films/kit-demo/film.html stills 1,6,12.2,16,21,30 h,v 0.4 qa_out
# render on a GPU machine (Windows/PowerShell):
cd render; copy ..\films\kit-demo\film.html .; .\run.ps1 -Film film.html -L h -Frames 943; .\run.ps1 -Film film.html -L v -Frames 943
python mix_cues.py ..\films\kit-demo\cues.json
```
Open `film.html?L=h` (or `?L=v`) in a browser and call `seek(3.2)` in the console to scrub. `?theme=spectrum` switches palette.

## The non-negotiables
1. `seek(t)` is pure. No timers, no rAF, no CSS transitions, no state between frames.
2. Things change **shape**, never fade. Shared elements carry the eye from scene to scene.
3. Something happens on every beat; a colour spread or scene change on every bar.
4. Springs everywhere (closed form), a tiny overshoot at most. Zoom in log space.
5. Sound is real and lands on its **peak**, not its file start.
6. 2D→3D handoff: the 3D surface faces the camera (parallel to the image plane) at the handoff, the 2D card lands on its projected rect, the card's shadow shrinks to zero as it touches.
7. One hero 3D shot per explainer. The rest is fast, clean UI motion.
8. Stills gate: look at one frame per beat before rendering anything.
9. Brand (Phoenix Day default): day sky + light denim `#AFCBEF`, navy ink `#12163F`, phoenix fire `#FFC74E → #FF8F3A → #F56B49`, neon spectrum edges. Hebrew: Karantina for headlines and short display text (condensed, so size up ~1.25x), Assistant for paragraphs and any running text, Bona Nova SC for Torah and Jewish topics, Gveret Levin only for a handwritten note or signature. Anton (EN), JetBrains Mono (code). Radius 24–48px on cards, 999px on pills.
10. Music: Mixkit (free licence, no redistribution of the raw files, so audio is never committed here).
