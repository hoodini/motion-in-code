/* =====================================================================
   YUV.AI MOTION KIT — core
   Everything a film needs that is not specific to the film:
   pure motion math, brand themes, type, colour spreads, render API.
   Rule zero: every function here is a pure function of its inputs.
   No timers, no requestAnimationFrame, no state carried between frames.
   ===================================================================== */

/* ---------- motion math (closed-form, pure) ---------- */
export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a, b, u) => a + (b - a) * u;
export const inv = (a, b, x) => clamp((x - a) / (b - a));
export const out3 = u => 1 - Math.pow(1 - u, 3);
export const in3 = u => u * u * u;
export const io3 = u => (u < .5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2);
export const logLerp = (a, b, u) => a * Math.pow(b / a, u);
/** damped spring step response: 0 at t<=0, settles at 1. w = stiffness (rad/s), z = damping ratio */
export function spring(t, w = 12, z = 0.8) {
  if (t <= 0) return 0;
  if (z < 1) { const wd = w * Math.sqrt(1 - z * z); return 1 - Math.exp(-z * w * t) * (Math.cos(wd * t) + (z * w / wd) * Math.sin(wd * t)); }
  return 1 - Math.exp(-w * t) * (1 + w * t);
}
/** "sum of springs": a value retargeted at keys [[time, value], ...] — continuous, pure */
export function sk(t, keys, w = 12, z = 0.8) { let v = keys[0][1]; for (let i = 1; i < keys.length; i++) v += (keys[i][1] - keys[i - 1][1]) * spring(t - keys[i][0], w, z); return v; }
export function rnd(i) { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }
export function clock(bpm) { const B = 60 / bpm; return { BPM: bpm, B, bt: k => k * B }; }

/* ---------- colour ---------- */
export function hex(h) { const n = parseInt(h.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; }
export function toHex(a) { return '#' + a.map(v => Math.round(clamp(v, 0, 255)).toString(16).padStart(2, '0')).join(''); }
export function mix(a, b, u) { const A = hex(a), Bc = hex(b); u = clamp(u); return toHex(A.map((v, i) => lerp(v, Bc[i], u))); }
export const tr = (a, b, t0, t, d = 0.3) => mix(a, b, inv(t0, t0 + d, t));
export function rgba(h, a) { const [r, g, b] = hex(h); return `rgba(${r},${g},${b},${a})`; }
export function lum(h) { const [r, g, b] = hex(h).map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; }

/* ---------- brand themes ----------
   K = base page / ink, M = the one signature accent (also the accent page), C = secondary page.
   PAL = the three "spreads" (magazine pages) and the colours that live on each. */
/* Brand colours sampled from Yuval's own look (navy tee on N12, light denim, the phoenix logo file). */
export const BRAND = {
  navy: '#12163F', navy2: '#1E2357', denim: '#AFCBEF', cloud: '#EEF3FB',
  gold: '#FFC74E', orange: '#FF8F3A', coral: '#F56B49', raspberry: '#D74270', plum: '#97429A', violet: '#603689', azure: '#5EA1C1',
  pink: '#FF66C4', cyan: '#5DE4E9',                 // the wordmark: YUV.AI pink, LET'S FLY HIGH cyan
  fire: ['#FFC74E', '#FF8F3A', '#F56B49'],          // phoenix upper wing
  wing: ['#F56B49', '#D74270', '#7B3FA8'],          // phoenix mid wing
  spectrum: ['#FFC74E', '#FF8F3A', '#F56B49', '#D74270', '#97429A', '#603689', '#5EA1C1']
};
export const THEMES = {
  /* A — default. navy base, phoenix-fire accent page (gradient), light-denim page */
  phoenix:  { K: BRAND.navy, M: BRAND.orange, C: BRAND.denim, pages: { M: { grad: BRAND.fire, hd: BRAND.navy, sb: BRAND.navy, band: '#FFFFFF' }, K: { sb: BRAND.gold, chip: BRAND.orange, band: BRAND.orange, num: BRAND.orange }, C: { band: BRAND.orange } } },
  /* B — navy base, full wing spectrum page, wordmark pink + cyan */
  spectrum: { K: BRAND.navy, M: BRAND.pink, C: BRAND.cyan, pages: { M: { grad: BRAND.wing, hd: '#FFFFFF', sb: '#FFFFFF', band: BRAND.gold }, K: { sb: BRAND.cyan, chip: BRAND.raspberry, band: BRAND.coral, num: BRAND.raspberry } } },
  /* legacy, kept for comparison only */
  ink:    { K: '#0B0B10', M: '#FF2EA0', C: '#16D6E8' }
};
export function makeTheme(name = 'phoenix') {
  const T = THEMES[name] || THEMES.phoenix, W = '#FFFFFF';
  const on = bg => (lum(bg) > 0.45 ? T.K : W);
  const PAL = {
    K: { bg: T.K, hd: W, sb: T.C, chip: T.M, band: T.M, num: T.M, numMode: 'stroke' },
    C: { bg: T.C, hd: on(T.C), sb: on(T.C), chip: T.K, band: T.M, num: mix(T.C, T.K, 0.13), numMode: 'fill' },
    M: { bg: T.M, hd: on(T.M), sb: T.K, chip: T.K, band: W, num: mix(T.M, T.K, 0.13), numMode: 'fill' }
  };
  for (const k in (T.pages || {})) Object.assign(PAL[k], T.pages[k]);
  if (PAL.M.grad) PAL.M.bg = PAL.M.grad[1];
  return { name, K: T.K, M: T.M, C: T.C, W, on, PAL };
}

/* ---------- type ---------- */
export const FT = {
  he: s => `900 ${s}px Rubik, Assistant, sans-serif`, he8: s => `800 ${s}px Rubik, Assistant, sans-serif`, he7: s => `700 ${s}px Rubik, Assistant, sans-serif`,
  body: s => `700 ${s}px Assistant, Rubik, sans-serif`,
  en: s => `400 ${s}px Anton, Impact, sans-serif`,
  mono: s => `500 ${s}px "JetBrains Mono", ui-monospace, monospace`, monoB: s => `700 ${s}px "JetBrains Mono", ui-monospace, monospace`
};
export const FONT_FACES = ['900 100px Rubik', '800 40px Rubik', '700 40px Rubik', '700 40px Assistant', '400 100px Anton', '500 30px "JetBrains Mono"', '700 30px "JetBrains Mono"'];
export function fitSize(x, text, fontFn, size, maxW) { x.font = fontFn(size); const w = x.measureText(text).width; return w > maxW ? size * maxW / w : size; }

/* ---------- shapes ---------- */
export function rr(x, X, Y, w, h, r) { r = Math.max(0, Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2)); x.beginPath(); x.moveTo(X + r, Y); x.arcTo(X + w, Y, X + w, Y + h, r); x.arcTo(X + w, Y + h, X, Y + h, r); x.arcTo(X, Y + h, X, Y, r); x.arcTo(X, Y, X + w, Y, r); x.closePath(); }
export function rrc(x, cx, cy, w, h, r) { rr(x, cx - w / 2, cy - h / 2, w, h, r); }
export function circle(x, cx, cy, r) { x.beginPath(); x.arc(cx, cy, Math.max(0, r), 0, Math.PI * 2); }
export function coverR(W, H, ox, oy) { return Math.max(...[[0, 0], [W, 0], [0, H], [W, H]].map(([a, b]) => Math.hypot(a - ox, b - oy))) * 1.03; }

/** words rise out of a mask line one by one and leave through the same line.
 *  opt: ltr, right (anchor right edge), colors[], spacing, gap, dur, marker {i,t,color} */
export function riseWords(x, t, words, cxp, y, size, fontFn, color, tIns, tOut, opt = {}) {
  if (t < Math.min(...tIns)) return;
  if (tOut != null && t > tOut + 0.4) return;
  x.save(); x.font = fontFn(size); x.direction = opt.ltr ? 'ltr' : 'rtl';
  if (opt.spacing) x.letterSpacing = opt.spacing;
  const gap = size * (opt.gap ?? 0.27), ws = words.map(w => x.measureText(w).width), total = ws.reduce((a, b) => a + b, 0) + gap * (words.length - 1);
  if (opt.right != null) cxp = opt.right - total / 2;
  if (opt.left != null) cxp = opt.left + total / 2;
  x.beginPath(); x.rect(-1e4, y - size * 1.05, 3e4, size * 1.42); x.clip();
  let pos = opt.ltr ? cxp - total / 2 : cxp + total / 2;
  words.forEach((w, i) => {
    const ti = tIns[i];
    if (t >= ti) {
      let dy = size * 1.25 * (1 - out3(inv(ti, ti + (opt.dur || 0.34), t)));
      if (tOut != null) dy += size * 1.5 * in3(inv(tOut + i * 0.025, tOut + 0.27 + i * 0.025, t));
      const xr = opt.ltr ? pos : pos - ws[i];
      if (opt.marker && opt.marker.i === i) {
        const m = opt.marker, mw = (ws[i] + size * 0.24) * out3(inv(m.t, m.t + 0.32, t));
        if (mw > 0) { x.fillStyle = m.color; x.fillRect(xr + ws[i] + size * 0.12 - mw, y + dy - size * 0.78, mw, size * 0.92); }
      }
      x.fillStyle = opt.colors ? opt.colors[i] : color; x.textAlign = 'left'; x.fillText(w, xr, y + dy);
    }
    pos += opt.ltr ? ws[i] + gap : -(ws[i] + gap);
  });
  x.restore();
}

/* ---------- colour spreads: a magazine page per bar, wiped in on the downbeat ----------
   SEC = [{ t, p:'K'|'C'|'M', wipe?:'r'|'b', num?:'01' }, ...]  (t in seconds) */
/** a page's paint: flat colour, or its diagonal gradient (screen-space, so every shape that uses it lines up) */
export function pagePaint(x, L, P) { if (!P.grad) return P.bg; const g = x.createLinearGradient(0, 0, L.W, L.H); P.grad.forEach((c, j) => g.addColorStop(j / (P.grad.length - 1), c)); return g; }
export function gradPaint(x, x0, y0, x1, y1, stops) { const g = x.createLinearGradient(x0, y0, x1, y1); stops.forEach((c, j) => g.addColorStop(j / (stops.length - 1), c)); return g; }
export function makeSpreads(SEC, PAL, { WIPE = 0.35, BAND = 0.07 } = {}) {
  const idx = t => { let i = 0; for (let k = 1; k < SEC.length; k++) if (t >= SEC[k].t) i = k; return i; };
  function clipWipe(x, L, dir, u) { x.beginPath(); if (dir === 'r') x.rect(L.W * (1 - u), 0, L.W * u + 1, L.H); else x.rect(0, L.H * (1 - u), L.W, L.H * u + 1); x.clip(); }
  function layer(x, t, L, i) {
    const s = SEC[i], P = PAL[s.p];
    x.fillStyle = pagePaint(x, L, P); x.fillRect(0, 0, L.W, L.H);
    if (!s.num) return;
    const size = L.numSize, a = t - s.t, rise = spring(a, 9, 0.86);
    x.save(); x.font = FT.en(size); x.direction = 'ltr'; x.textAlign = 'left';
    let X = L.numX - a * 14, Y = L.H + size * 0.1 + (1 - rise) * size * 0.85;
    if (L.name === 'v' && s.num.length > 2) { const vs = 640; x.font = FT.en(vs); x.translate(vs * 0.66, L.H - 40 + (1 - rise) * 1300 - a * 14); x.rotate(-Math.PI / 2); X = 0; Y = 0; }
    if (P.numMode === 'stroke') { x.lineWidth = 5; x.strokeStyle = P.num; x.strokeText(s.num, X, Y); } else { x.fillStyle = P.grad ? 'rgba(0,0,0,.09)' : P.num; x.fillText(s.num, X, Y); }
    x.restore();
  }
  function background(x, t, L) {
    const i = idx(t), s = SEC[i];
    if (s.wipe && t < s.t + WIPE + BAND) {
      layer(x, t, L, i - 1);
      const u1 = out3(inv(s.t, s.t + WIPE, t)), u2 = out3(inv(s.t + BAND, s.t + BAND + WIPE, t));
      if (u1 > 0) { x.save(); clipWipe(x, L, s.wipe, u1); x.fillStyle = PAL[s.p].band; x.fillRect(0, 0, L.W, L.H); x.restore(); }
      if (u2 > 0) { x.save(); clipWipe(x, L, s.wipe, u2); layer(x, t, L, i); x.restore(); }
    } else layer(x, t, L, i);
  }
  function palTr(key, t) { const i = idx(t), s = SEC[i], P = PAL[s.p]; if (i > 0 && t < s.t + WIPE) return mix(PAL[SEC[i - 1].p][key], P[key], inv(s.t, s.t + WIPE, t)); return P[key]; }
  return { background, palTr, idx };
}

/* ---------- render API ----------
   mountFilm({ layouts, draw(x, t, L), init(L, scale) (async, optional), dur, clock })
   installs window.seek(t), window.renderFrame(t, n, shutter, fps), window.FILM, window.__ready */
export function mountFilm({ layouts, draw, init, dur, clk, extra = {} }) {
  const Q = new URLSearchParams(location.search);
  const L = layouts[Q.get('L') || 'h'], SCALE = +(Q.get('scale') || 1);
  const cv = document.getElementById('c'); cv.width = Math.round(L.W * SCALE); cv.height = Math.round(L.H * SCALE);
  const ctx = cv.getContext('2d');
  const scratch = document.createElement('canvas'); scratch.width = cv.width; scratch.height = cv.height; const sctx = scratch.getContext('2d');
  const frame = (x, t) => { const k = x.canvas.width / L.W; x.setTransform(k, 0, 0, k, 0, 0); draw(x, t, L); };
  window.seek = t => frame(ctx, t);
  window.renderFrame = (t, n = 6, shutter = 0.5, fps = 60) => {
    if (n <= 1) { frame(ctx, t); return; }
    const span = shutter / fps;
    for (let i = 0; i < n; i++) {
      const ts = Math.max(0, t - span / 2 + span * (i + 0.5) / n);
      frame(sctx, ts);
      ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1 / (i + 1); ctx.drawImage(scratch, 0, 0); ctx.globalAlpha = 1;
    }
  };
  window.FILM = { B: clk.B, BPM: clk.BPM, DUR: dur, layout: L.name, W: L.W, H: L.H, ...extra };
  window.__ready = (async () => {
    await Promise.all(FONT_FACES.map(f => document.fonts.load(f, 'אבג abc ‎$15,000 ζ ✓')));
    await document.fonts.ready;
    if (init) await init(L, SCALE, ctx);
    frame(ctx, 0);
    return true;
  })();
  return { L, SCALE, ctx, Q };
}
