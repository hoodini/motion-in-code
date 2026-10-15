# Motion in Code — YUV.AI

**Live:** https://hoodini.github.io/motion-in-code/

A Hebrew, fully interactive teardown of the code-only motion-design method published by **zero ([@twoclipping](https://x.com/twoclipping))** — how Claude Opus 5.5 makes studio-grade launch videos with no After Effects: one `seek(t)` HTML file, Playwright frame capture, ffmpeg, beat-synced timing and self-QA.

Every lab on the page runs real math in the browser (closed-form springs, log-space zoom, beat/drop detection, subframe motion blur, pop scanning, speed-curve integration). The engine is in `engine/engine.js` and its tests in `engine/test_engine.js` (`node engine/test_engine.js`).

The original article and prompts belong to zero (@twoclipping). This page is an analysis and translation for learning.

— יובל אבידני | yuv.ai | @yuvalav
