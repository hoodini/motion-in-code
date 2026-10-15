// Renders frames [f0, f1) of any kit film at 60 fps with subframe motion blur straight into an H.264 segment.
// usage: node render.js <film.html> <h|v> <f0> <f1> <out.mp4> [subframes=6] [extraQuery]
// Needs: npm i playwright (any recent), ffmpeg on PATH. Uses the GPU (ANGLE/D3D11 on Windows, default elsewhere).
const path = require('path');
const { chromium } = require(process.env.PW_PATH || 'playwright');
const { spawn } = require('child_process');
const [, , film, L, f0s, f1s, out, subs, extra] = process.argv;
const f0 = +f0s, f1 = +f1s, SUB = +(subs || 6);
(async () => {
  const W = L === 'h' ? 1920 : 1080, H = L === 'h' ? 1080 : 1920;
  const args = process.platform === 'win32' ? ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist', '--enable-gpu-rasterization'] : ['--ignore-gpu-blocklist', '--enable-unsafe-swiftshader'];
  const browser = await chromium.launch({ args });
  const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
  page.on('pageerror', e => console.error('PAGEERROR', e.message));
  const url = 'file:///' + path.resolve(film).replace(/\\/g, '/') + '?L=' + L + (extra ? '&' + extra : '');
  await page.goto(url);
  await page.evaluate(() => window.__ready);
  const fontsOk = await page.evaluate(() => ['900 100px Rubik', '400 100px Anton', '700 30px "JetBrains Mono"'].every(f => document.fonts.check(f, 'אבג abc')));
  console.log('fonts ok:', fontsOk);
  if (!fontsOk) { console.error('FONTS NOT LOADED - abort'); process.exit(2); }
  const ff = spawn('ffmpeg', ['-y', '-v', 'error', '-f', 'image2pipe', '-framerate', '60', '-c:v', 'png', '-i', '-',
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '14', '-pix_fmt', 'yuv420p', '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', out]);
  ff.stderr.on('data', d => process.stderr.write(d));
  const t0 = Date.now();
  for (let f = f0; f < f1; f++) {
    await page.evaluate(([t, n]) => window.renderFrame(t, n, 0.5, 60), [f / 60, SUB]);
    const buf = await page.screenshot({ type: 'png' });
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    if ((f - f0) % 30 === 0) console.log(`frame ${f}/${f1} · ${((f - f0 + 1) / ((Date.now() - t0) / 1000)).toFixed(1)} fps`);
  }
  ff.stdin.end(); await new Promise(r => ff.on('close', r));
  await browser.close();
  console.log('DONE', out, ((Date.now() - t0) / 1000).toFixed(1) + 's');
})().catch(e => { console.error(e); process.exit(1); });
