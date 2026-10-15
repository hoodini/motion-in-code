import { chromium } from 'playwright';
import { readFileSync } from 'fs';
const b = await chromium.launch(); const p = await b.newPage();
for (const n of ['770', 'lubavitcher-rebbe']) {
  const svg = readFileSync(`ref/extra/${n}.svg`, 'utf8'); const m = svg.match(/width="(\d+)" height="(\d+)"/);
  await p.setViewportSize({ width: +m[1], height: +m[2] }); await p.setContent(`<body style="margin:0">${svg}</body>`);
  await p.screenshot({ path: `ref/${n}.png` }); console.log(n, m[1], m[2]);
}
await b.close();
