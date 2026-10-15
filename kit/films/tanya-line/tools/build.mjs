// Bundles kit/films/tanya-line/film.js into ONE self-contained film.html (fonts and map data inlined; no network at render time).
import { build } from 'esbuild';
import { readFileSync, writeFileSync } from 'fs';
const SRC = 'C:/Users/User/yuvwork/motion-in-code/kit/films/tanya-line';
const r = await build({ entryPoints: [SRC + '/film.js'], bundle: true, format: 'iife', minify: true, write: false, target: 'chrome120', logLevel: 'warning' });
const js = r.outputFiles[0].text; if (js.includes('</script')) throw new Error('bundle contains </script');
const css = readFileSync(SRC + '/fonts.css', 'utf8');
writeFileSync('film.html', `<!doctype html><html lang="he" dir="rtl"><head><meta charset="utf-8"><title>קו אחד — tanya-line</title>
<style>${css}html,body{margin:0;background:#12163F;overflow:hidden}canvas{display:block}</style></head>
<body><canvas id="c"></canvas><script>${js}</script></body></html>`);
console.log('built film.html', (js.length / 1024).toFixed(0) + ' KB js');
