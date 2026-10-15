// Bundles films/<name>/film.js (+ three.js, kit modules, brand PNGs) into ONE self-contained films/<name>/film.html
import { build } from 'esbuild';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import path from 'path';
// brand PNGs are NOT in the public repo: copy them into kit/brand/ (see README). Missing → empty URL, film draws without the logo.
const brandPlugin = { name: 'brand', setup(b) { b.onResolve({ filter: /brand\/.*\.png$/ }, a => { const p = path.resolve(a.resolveDir, a.path); if (existsSync(p)) return { path: p }; console.warn('missing brand asset', a.path, '→ building without it'); return { path: a.path, namespace: 'nobrand' }; }); b.onLoad({ filter: /.*/, namespace: 'nobrand' }, () => ({ contents: 'export default ""', loader: 'js' })); } };
const name = process.argv[2] || 'kit-demo';
const r = await build({ entryPoints: [`films/${name}/film.js`], bundle: true, format: 'iife', minify: true, write: false, loader: { '.png': 'dataurl' }, plugins: [brandPlugin], target: 'chrome120', logLevel: 'warning' });
const js = r.outputFiles[0].text;
if (js.includes('</script')) throw new Error('bundle contains </script');
const html = `<!doctype html>
<html lang="he" dir="rtl">
<head>
<meta charset="utf-8">
<title>${name} — YUV.AI motion kit</title>
<!--FONTS--><link href="https://fonts.googleapis.com/css2?family=Anton&family=Assistant:wght@600;700;800&family=JetBrains+Mono:wght@400;500;700&family=Rubik:wght@700;800;900&display=block" rel="stylesheet"><!--/FONTS-->
<style>html,body{margin:0;background:#12163F;overflow:hidden}canvas{display:block}</style>
</head>
<body>
<canvas id="c"></canvas>
<script>${js}</script>
</body>
</html>
`;
writeFileSync(`films/${name}/film.html`, html);
console.log('built', `films/${name}/film.html`, (html.length / 1024).toFixed(0) + ' KB');
