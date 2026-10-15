// node stills.mjs <h|v> <beats,comma> [scale] [outdir] [sheet]  -> PNG per beat (+ contact sheet jpg when "sheet")
import { chromium } from 'playwright';
import { mkdirSync } from 'fs';
const [, , L = 'h', bl = '10', sc = '0.5', out = 'qa', sheet] = process.argv;
mkdirSync(out, { recursive: true });
const W = L === 'h' ? 1920 : 1080, H = L === 'h' ? 1080 : 1920, s = +sc;
const b = await chromium.launch({ args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist'] });
const p = await b.newPage({ viewport: { width: Math.round(W * s), height: Math.round(H * s) } });
const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
await p.goto('file:///C:/Users/User/yuvwork/tanya-line/film.html?L=' + L + '&scale=' + s + (process.env.CUT ? '&cut=' + process.env.CUT : ''));
await p.evaluate(() => window.__ready);
console.log('fonts ok', await p.evaluate(() => window.__fontsOk));
const beats = bl === 'all' ? Array.from({ length: +(process.env.NBEATS || 128) }, (_, k) => k + 0.35) : bl.split(',').map(Number);
for (const k of beats) { await p.evaluate(t => window.seek(t), k * 60 / 128.09); await p.screenshot({ path: `${out}/${L}_${k}.png` }); }
console.log('ERRORS', errs.length ? errs.slice(0, 5) : 'none');
await b.close();
