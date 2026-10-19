// Offline build: bundles films/<name>/film.js + images into ONE self-contained film.html,
// with the fonts inlined as base64 @font-face (no Google Fonts needed; the cloud shell cannot reach them).
// KIT_FONTS = an @fontsource node_modules folder with karantina, assistant, anton, jetbrains-mono.
import { build } from 'esbuild';
import { readFileSync, writeFileSync, existsSync } from 'fs';
const name = process.argv[2];
const FS = process.env.KIT_FONTS;
if (!FS) throw new Error('set KIT_FONTS to an @fontsource folder');
const faces = [
  ['Karantina', 'karantina', 400], ['Karantina', 'karantina', 700],
  ['Assistant', 'assistant', 500], ['Assistant', 'assistant', 600], ['Assistant', 'assistant', 700],
  ['Anton', 'anton', 400], ['JetBrains Mono', 'jetbrains-mono', 500], ['JetBrains Mono', 'jetbrains-mono', 700]
];
let css = '', n = 0;
for (const [fam, pkg, w] of faces) for (const sub of ['hebrew', 'latin', 'latin-ext']) {
  const f = `${FS}/${pkg}/files/${pkg}-${sub}-${w}-normal.woff2`;
  if (!existsSync(f)) continue;
  css += `@font-face{font-family:'${fam}';font-weight:${w};font-style:normal;font-display:block;src:url(data:font/woff2;base64,${readFileSync(f).toString('base64')}) format('woff2');}\n`; n++;
}
const r = await build({ entryPoints: [`films/${name}/film.js`], bundle: true, format: 'iife', minify: true, write: false,
  loader: { '.png': 'dataurl', '.jpg': 'dataurl' }, target: 'chrome120', logLevel: 'warning' });
const js = r.outputFiles[0].text;
if (js.includes('</script')) throw new Error('bundle contains </script');
const html = `<!doctype html>\n<html lang="he" dir="ltr">\n<head>\n<meta charset="utf-8">\n<title>${name} — YUV.AI motion</title>\n<style>${css}html,body{margin:0;background:#12163F;overflow:hidden}canvas{display:block}</style>\n</head>\n<body>\n<canvas id="c"></canvas>\n<script>${js}</script>\n</body>\n</html>\n`;
writeFileSync(`films/${name}/film.html`, html);
console.log('built', `films/${name}/film.html`, (html.length / 1024).toFixed(0) + ' KB,', n, 'font files');
