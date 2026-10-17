// Builds ../catalog/ (ES modules, code-split per demo) and ../catalog/tw.css (Tailwind, scoped to .tw).
// three.js is aliased to ONE copy so kit/src/world.js and the catalog share the same THREE instance.
import { build } from 'esbuild';
import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
const here = path.dirname(fileURLToPath(import.meta.url));
const out = path.resolve(here, '../catalog');
// Resolve every 'three' and 'three/addons/...' import (including the kit's) from this folder, honouring package exports.
const oneThree = { name: 'one-three', setup(b) {
  b.onResolve({ filter: /^three(\/.*)?$/ }, async a => {
    if (a.pluginData === 'x') return;
    const r = await b.resolve(a.path, { resolveDir: here, kind: a.kind, pluginData: 'x' });
    return r.errors.length ? { errors: r.errors } : { path: r.path };
  });
} };
fs.rmSync(out, { recursive: true, force: true });   // no stale chunks from earlier builds
await build({
  entryPoints: [path.join(here, 'src/main.js')],
  bundle: true, splitting: true, format: 'esm', outdir: out, minify: true, target: 'es2020',
  chunkNames: 'chunks/[name]-[hash]', jsx: 'automatic', loader: { '.js': 'jsx' },
  plugins: [oneThree],
  define: { 'process.env.NODE_ENV': '"production"' },
  logLevel: 'warning', metafile: true
}).then(r => {
  const outs = Object.entries(r.metafile.outputs).map(([f, o]) => [path.relative(out, f), o.bytes]).sort((a, b) => b[1] - a[1]);
  console.log(outs.map(([f, b]) => `${(b / 1024).toFixed(0).padStart(6)} KB  ${f}`).join('\n'));
});
execSync(`npx tailwindcss -c ${path.join(here, 'tailwind.config.cjs')} -i ${path.join(here, 'src/tw.css')} -o ${path.join(out, 'tw.css')} --minify`, { stdio: 'inherit', cwd: here });
// The site's Phoenix CSS lives once, in index.html. Extract it so catalog.html always matches the main page.
import fs from 'fs';
const idx = fs.readFileSync(path.resolve(here, '../index.html'), 'utf8');
const css = idx.slice(idx.indexOf('<style>') + 7, idx.indexOf('</style>'));
fs.writeFileSync(path.join(out, 'site.css'), css);
fs.copyFileSync(path.join(here, 'src/catalog.css'), path.join(out, 'catalog.css'));
console.log(`site.css ${(css.length / 1024).toFixed(0)} KB · catalog.css copied`);
