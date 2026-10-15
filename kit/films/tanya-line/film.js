/* =====================================================================
   "קו אחד" — the story of Sefer HaTanya and the Alter Rebbe, told by ONE continuous line
   drawn by ONE glowing dot. 128 beats @ 128.09 BPM (Mixkit "A New Life"), the song's drop on b48 = 19 Kislev.
   NIGHT b0–48 one line · DAY b48–108 the book lives · NIGHT b108–128 back to the dot (last frame = frame 0).
   PORTRAIT = "traditional": ref/portrait.png exists, so the figure is a skeleton trace of it (trace.py),
   captioned "הדיוקן המסורתי" whenever it is on screen.
   ===================================================================== */
import { clamp, lerp, inv, out3, in3, io3, spring, logLerp, rgba, mix, rr, rrc, circle, coverR, gradPaint } from '../../src/core.js';
import { slamWords, neonRing, SPECTRUM } from '../../src/ui.js';
import { Path, rrLoop, resample, cumLen, idxAt, ptAt, mspring, crit, align, canon, natIdx, strokeLine, hotTip, toUnit, unitCum, viewOf, projLL, globeLine, greatCircle, pnoise } from './engine.js';
import { F, FONT_CHECK, HE, NAVY, NAVY2, WHITE, GOLD, ORANGE, CORAL, CYAN, PINK, FIRE, HOT, shadow2, popS, chip, gradFire, riseLine, wrap, fitFont, pin, flame, penDot } from './draw.js';
import { LAND110, LAND50, BORDERS50, PLACES, FIG } from './data.js';

/* ---------------- clock ---------------- */
const BPM = 128.09, B = 60 / BPM, bt = k => k * B, NB = 128, NFR = 3598, T = NFR / 60;
const N = 8000;                                   // points per drawable line (the traced portrait needs more than 1200; see doc)
const SKY_TOP = '#AFCBEF', SKY_LOW = '#DDE9F9';
const Q = new URLSearchParams(location.search), LN = Q.get('L') === 'v' ? 'v' : 'h';
const LAYOUTS = {
  h: { W: 1920, H: 1080, lw: 5, fig: { ox: 250, oy: 92, s: 0.9 }, hd: { R: 1060, ys: [290, 440, 590], size: 150, maxW: 860 }, kick: [960, 668, 60],
       cap: [1872, 60, 'r'], chip20: [1060, 420], bookN: { cx: 960, cy: 540, w: 460, h: 640, r: 34 }, nameChip: [960, 948],
       tl: { YT: 580, gx: 760, k: 0.6 * 1920 / 67, cy: 450, cs: 280, my: 660, slR: 1840, slY: [830, 980], slS: 150, slW: 1000 },
       globe: { gx: 760, gy: 580, R0: 400, RZ: 4000 }, col: { R: 1840, ys: [300, 450, 600], size: 130, maxW: 640 }, cal: [960, 110],
       drop: { R: 1560, ys: [380, 560, 740], size: 150, maxW: 1200 }, bar: 46,
       day: { sx: 560, pw: 360, ph: 500, cy: 560, cx0: 150, cx1: 970, gy: 810, top: 330, ccx: 560, ctop: 420, cw: 120, gxD: 580, gyD: 560, RD: 380,
              R: 1840, chipY: 190, headY: 360, size: 140, maxW: 700, qY: 480, qLH: 82, qS: 56, qW: 700, vY: 330, vS: 92 },
       credit: [64, 60, 'l'] },
  v: { W: 1080, H: 1920, lw: 6, fig: { ox: 40, oy: 770, s: 0.568 }, hd: { R: 1010, ys: [330, 470, 610], size: 124, maxW: 960 }, kick: [540, 1078, 56],
       cap: [540, 1400, 'c'], chip20: [1010, 470], bookN: { cx: 540, cy: 1000, w: 520, h: 720, r: 38 }, nameChip: [540, 1452],
       tl: { YT: 1040, gx: 540, k: 0.6 * 1080 / 67, cy: 910, cs: 230, my: 1120, slR: 1010, slY: [400, 540], slS: 124, slW: 960 },
       globe: { gx: 540, gy: 1040, R0: 460, RZ: 4400 }, col: { R: 1010, ys: [330, 470, 610], size: 124, maxW: 960 }, cal: [540, 230],
       drop: { R: 1010, ys: [760, 920, 1080], size: 124, maxW: 960 }, bar: 34,
       day: { sx: 540, pw: 380, ph: 520, cy: 1000, cx0: 90, cx1: 990, gy: 1250, top: 760, ccx: 540, ctop: 820, cw: 130, gxD: 540, gyD: 1110, RD: 420,
              R: 1010, chipY: 250, headY: 420, size: 124, maxW: 960, qY: 1440, qLH: 70, qS: 50, qW: 980, vY: 1440, vS: 84 },
       credit: [540, 1530, 'c'] }
};
const L = LAYOUTS[LN], W = L.W, H = L.H, LW = L.lw;
const FLOOD_R = Math.hypot(W / 2, H / 2) * 1.06;     // flood from the frame centre covers the farthest corner
const FLOOD_D = 0.35;

/* ---------------- shapes (natural order, N points each, screen px) ---------------- */
const figMap = (x, y) => [L.fig.ox + (x - FIG.box[0]) * L.fig.s, L.fig.oy + (y - FIG.box[1]) * L.fig.s];
function figShape() {
  const raw = new Float32Array(FIG.pts.length); for (let i = 0; i < FIG.pts.length; i += 2) { const [x, y] = figMap(FIG.pts[i], FIG.pts[i + 1]); raw[i] = x; raw[i + 1] = y; }
  return raw;
}
function bookShape(cx, cy, w, h, r) {     // outer cover (from its top-left corner, clockwise) + inner frame
  const x0 = cx - w / 2, y0 = cy - h / 2, x1 = cx + w / 2, y1 = cy + h / 2, i = Math.min(w, h) * 0.07, r2 = r * 0.6;
  const p = new Path(x0 + r, y0); rrLoop(p, x0, y0, x1, y1, r);
  p.L(x0 + i + r2, y0 + i); rrLoop(p, x0 + i, y0 + i, x1 - i, y1 - i, r2);
  return p.done(N);
}
function circleShape(cx, cy, R) { const P = new Float32Array(2 * N); for (let k = 0; k < N; k++) { const a = -Math.PI / 2 + 2 * Math.PI * k / N; P[2 * k] = cx + R * Math.cos(a); P[2 * k + 1] = cy + R * Math.sin(a); } return P; }
function lineShape(xa, xb, y) { const P = new Float32Array(2 * N); for (let k = 0; k < N; k++) { P[2 * k] = lerp(xa, xb, k / (N - 1)); P[2 * k + 1] = y; } return P; }
/** a symmetric closed outline from its right half, given as unit points (u: 0 centre..1 edge, v: 0 ground..1 top) from the ground centre to the top centre */
function mirrored(cx, gy, hw, ht, half) {
  const pts = half.map(([u, v]) => [cx + u * hw, gy - v * ht]);
  const p = new Path(pts[0][0], pts[0][1]); for (let k = 1; k < pts.length; k++) p.L(pts[k][0], pts[k][1], 20);
  for (let k = half.length - 2; k >= 0; k--) p.L(cx - half[k][0] * hw, gy - half[k][1] * ht, 20);
  return p.done(N);
}
const D = L.day;
function spreadShape() {
  const { sx, pw, ph, cy } = D, y0 = cy - ph / 2, y1 = cy + ph / 2, r = 30, dip = 30, H2 = Math.PI / 2;
  const p = new Path(sx, y1 + dip * 0.5);
  p.C(sx + pw * 0.3, y1, sx + pw * 0.6, y1, sx + pw - r, y1).A(sx + pw - r, y1 - r, r, H2, 0).L(sx + pw, y0 + r).A(sx + pw - r, y0 + r, r, 0, -H2)
   .C(sx + pw * 0.6, y0, sx + pw * 0.3, y0, sx, y0 + dip)
   .C(sx - pw * 0.3, y0, sx - pw * 0.6, y0, sx - pw + r, y0).A(sx - pw + r, y0 + r, r, -H2, -Math.PI).L(sx - pw, y1 - r).A(sx - pw + r, y1 - r, r, Math.PI, H2)
   .C(sx - pw * 0.6, y1, sx - pw * 0.3, y1, sx, y1 + dip * 0.5);
  return p.done(N);
}
const CITY_HALF = [[0, 0], [1, 0], [1, 0.38], [0.93, 0.5], [0.86, 0.38], [0.86, 0.62], [0.72, 0.62], [0.72, 0.45], [0.68, 0.45], [0.6, 0.6], [0.52, 0.45], [0.4, 0.45],
  [0.4, 0.55], [0.36, 0.55], [0.26, 0.74], [0.16, 0.55], [0.08, 0.55], [0.08, 0.82], [0.04, 0.82], [0, 1]];
const CANDLE_HALF = [[0, 0], [0.98, 0], [1.0, 0.03], [0.92, 0.07], [0.5, 0.08], [0.5, 0.9], [0.44, 0.96], [0.08, 0.97], [0, 1]];
const cityShape = () => mirrored((D.cx0 + D.cx1) / 2, D.gy, (D.cx1 - D.cx0) / 2, D.gy - D.top, CITY_HALF);
const candleShape = () => mirrored(D.ccx, D.gy, D.cw, D.gy - D.ctop, CANDLE_HALF);
const CANDLE_WICK = () => [D.ccx, D.ctop - 10];

/* ---------------- the timeline (RTL: earlier years to the right) ---------------- */
const TL = L.tl;
const camYear = t => {                                 // camera keys, critically damped, landing on 1745 at b28
  const keys = [[bt(22), 2026], [bt(22.15), 1812], [bt(24.4), 1798], [bt(25.4), 1796], [bt(26.1), 1745]];
  if (t < keys[0][0]) return 2026; let v = keys[0][1];
  for (let i = 1; i < keys.length; i++) { const last = i === keys.length - 1, w = last ? 9 : 7, s = last ? Math.min(1, crit(t - keys[i][0], w) / crit(bt(28) - keys[i][0], w)) : crit(t - keys[i][0], w); v += (keys[i][1] - keys[i - 1][1]) * s; }
  return v;
};
const yX = (year, t) => TL.gx + (camYear(t) - year) * TL.k;
const timelineShape = t => lineShape(yX(2045, t), yX(1735, t), TL.YT);

/* ---------------- the globe ---------------- */
const G = L.globe;
const limbR = t => t < bt(36) ? G.R0 : G.R0 * Math.pow(G.RZ / G.R0, crit(t - bt(36), 6.2));
const limbShape = t => t < bt(48) ? circleShape(G.gx, G.gy, limbR(t)) : circleShape(W / 2, H / 2, FLOOD_R);
const spinL = t => PLACES.liozna[0] + 450 * (1 - spring(t - bt(32), 3.4, 0.8));
const spinP = t => PLACES.liozna[1] - 38 * (1 - spring(t - bt(32), 3.4, 0.8));
const L110 = LAND110.map(r => { const U = toUnit(new Float32Array(r)); return { U, C: unitCum(U) }; });
const L50 = LAND50.map(r => { const U = toUnit(new Float32Array(r)); return { U, C: unitCum(U) }; });
const BD50 = BORDERS50.map(r => { const U = toUnit(new Float32Array(r)); return { U, C: unitCum(U) }; });
const rankBy = A => { const o = A.map((r, i) => [r.C[r.C.length - 1], i]).sort((a, b) => b[0] - a[0]); const R = new Array(A.length); o.forEach(([, i], k) => R[i] = k / Math.max(1, A.length - 1)); return R; };
const R110 = rankBy(L110), R50 = rankBy(L50), RB50 = rankBy(BD50);
const ROUTE = (() => { const U = greatCircle(PLACES.liozna, PLACES.fortress, 96); return { U, C: unitCum(U) }; })();

/* ---------------- main line: sum of morph springs over aligned shapes ---------------- */
const MORPHS = [];
let S0 = null, S0C = null, FIG_L = 0;
const STAG = {
  def: (P, span = 0.5) => { const d = new Float32Array(N); for (let i = 0; i < N; i++) d[i] = span * B * i / (N - 1); return d; },
  ends: () => { const d = new Float32Array(N); for (let i = 0; i < N; i++) d[i] = 0.5 * B * (1 - Math.abs(2 * i / (N - 1) - 1)); return d; },
  sides: (P, cx, hw) => { const d = new Float32Array(N); for (let i = 0; i < N; i++) d[i] = 0.6 * B * clamp(1 - Math.abs(P[2 * i] - cx) / hw); return d; }
};
function buildMorphs() {
  const fig = figShape(); S0 = resample(fig, N); S0C = cumLen(S0); FIG_L = S0C[N - 1];
  const bN = L.bookN, dcx = D.sx + D.pw / 2;
  const spec = [
    { t: bt(14), fn: () => bookShape(bN.cx, bN.cy, bN.w, bN.h, bN.r), closed: false, ref: bt(16) },
    { t: bt(20), fn: timelineShape, closed: false, ref: bt(22) },
    { t: bt(29.4), fn: limbShape, closed: true, ref: bt(32), stag: 'ends' },
    { t: bt(52), fn: () => bookShape(dcx, D.cy, D.pw, D.ph, 30), closed: false, ref: bt(53) },
    { t: bt(55.4), fn: spreadShape, closed: true, ref: bt(56), key: 'spread' },
    { t: bt(60), fn: cityShape, follow: 'spread', ref: bt(62), stag: 'sides' },
    { t: bt(68), fn: candleShape, follow: 'spread', ref: bt(70), stag: 'sides' },
    { t: bt(76), fn: () => circleShape(D.gxD, D.gyD, D.RD), closed: true, ref: bt(78) },
    { t: bt(96), fn: () => bookShape(dcx, D.cy, D.pw, D.ph, 30), closed: false, ref: bt(98) },
    { t: bt(108), fn: () => fig, raw: true, closed: false, ref: bt(112), forceId: true, span: 1.0 }
  ];
  let prev = S0; const perms = {};
  for (const s of spec) {
    const nat = s.raw ? S0 : s.fn(s.ref);
    let perm = s.forceId ? { dir: 0, off: 0, closed: false } : s.follow ? perms[s.follow] : align(prev, nat, s.closed, N);
    if (s.key) perms[s.key] = perm;
    const can = canon(nat, perm, N);
    const st = s.stag === 'ends' ? STAG.ends() : s.stag === 'sides' ? STAG.sides(can, (D.cx0 + D.cx1) / 2, (D.cx1 - D.cx0) / 2) : STAG.def(can, s.span || 0.5);
    MORPHS.push({ t: s.t, fn: s.raw ? () => S0 : s.fn, perm, stag: st, key: s.key, dyn: !s.raw && [timelineShape, limbShape].includes(s.fn) });
    prev = can;
  }
}
const SETTLE = 2.4;
const mainBuf = new Float32Array(2 * N), tmpA = new Float32Array(2 * N), tmpB = new Float32Array(2 * N);
const canonAt = (k, t, out) => k < 0 ? (out.set(S0), out) : canon(MORPHS[k].fn(t), MORPHS[k].perm, N, out);
/** the main line at time t (canonical order). also returns per-point morph progress of the active morph (for colour handoffs) */
function mainLine(t) {
  let m = -1; for (let k = 0; k < MORPHS.length; k++) if (t - MORPHS[k].t > SETTLE) m = k;
  canonAt(m, t, mainBuf); let prev = tmpA; prev.set(mainBuf);
  for (let k = m + 1; k < MORPHS.length; k++) {
    if (t < MORPHS[k].t) break;
    const cur = canonAt(k, t, tmpB), st = MORPHS[k].stag, t0 = MORPHS[k].t;
    for (let i = 0; i < N; i++) { const x = mspring(t - t0 - st[i]); if (x === 0) continue; mainBuf[2 * i] += (cur[2 * i] - prev[2 * i]) * x; mainBuf[2 * i + 1] += (cur[2 * i + 1] - prev[2 * i + 1]) * x; }
    prev.set(cur);
  }
  return mainBuf;
}
const morphX = (k, t, i) => mspring(t - MORPHS[k].t - MORPHS[k].stag[i]);

/* ---------------- figure drawing progress: one stroke ends on every 8th note ---------------- */
let PASS = [];
function buildPasses() {
  const P = FIG.pts, n = P.length / 2, C = new Float64Array(n);
  for (let i = 1; i < n; i++) C[i] = C[i - 1] + Math.hypot(P[2 * i] - P[2 * i - 2], P[2 * i + 1] - P[2 * i - 1]);
  const Lr = C[n - 1], br = FIG.breaks.map(b => C[b] / Lr).concat([1]);
  const ends = []; for (let k = 1; k <= 20; k++) { const target = k / 20; let best = 1; for (const f of br) if (Math.abs(f - target) < Math.abs(best - target) && f > (ends[ends.length - 1] || 0) + 0.004) best = f; ends.push(k === 20 ? 1 : best); }
  PASS = ends.map((f, k) => ({ t0: bt(2 + k * 0.5), t1: bt(2.5 + k * 0.5), s0: (k ? ends[k - 1] : 0) * FIG_L, s1: f * FIG_L }));
}
function trap(u, e) { u = clamp(u); e = clamp(e, 0.001, 0.49); if (u < e) return (u * u / (2 * e)) / (1 - e); if (u > 1 - e) return 1 - ((1 - u) * (1 - u) / (2 * e)) / (1 - e); return (u - e / 2) / (1 - e); }
function figS(t) {
  if (t < bt(2)) return 0;
  if (t >= bt(120)) { const u = inv(bt(120), bt(126.4), t); return FIG_L * (1 - trap(u, (B / 16) / (bt(126.4) - bt(120)))); }
  for (const p of PASS) if (t < p.t1) return p.s0 + (p.s1 - p.s0) * trap((t - p.t0) / (p.t1 - p.t0), (B / 16) / (p.t1 - p.t0));
  return FIG_L;
}
/* ---------------- writing on the top page (b12–14): one short line per 16th note ---------------- */
const WR = (() => {
  const [nl, nr, fr, fl] = FIG.page, out = [];
  for (let r = 0; r < 8; r++) {
    const v = (r + 0.5) / 8, a = [lerp(fr[0], nr[0], v) - 6, lerp(fr[1], nr[1], v)], b = [lerp(fl[0], nl[0], v) + 6, lerp(fl[1], nl[1], v)];
    const len = 0.62 + 0.33 * ((r * 7) % 5) / 4, P = new Float32Array(48);
    for (let k = 0; k < 24; k++) { const u = k / 23 * len, x = lerp(a[0], b[0], u), y = lerp(a[1], b[1], u) + 2.2 * Math.sin(u * 38 + r) * (k % 3 ? 1 : -0.5); const [X, Y] = figMap(x, y); P[2 * k] = X; P[2 * k + 1] = Y; }
    out.push(P);
  }
  return out;
})();
const bN = L.bookN, TITLE_S = LN === 'h' ? 150 : 160, TITLE_Y = bN.cy - 30, RULE_Y = TITLE_Y + TITLE_S * 0.3;
function writingLines(g, t, P) {
  if (t < bt(12) || t > bt(20.2)) return;
  g.lineCap = 'round'; g.lineJoin = 'round'; g.lineWidth = LW * 0.8;
  const seg = 180 / 8, x0 = bN.cx + 90;
  for (let r = 0; r < 8; r++) {
    const ts = bt(12 + r / 4), u = clamp((t - ts) / (B / 4 * 0.85)); if (u <= 0) continue;
    const m = mspring(t - bt(14) - r * 0.06 * B), c = mspring(t - bt(19.62) - r * 0.02 * B);
    const pen = penAt(t);
    g.beginPath(); const n = Math.max(2, Math.ceil(24 * u));
    for (let k = 0; k < n; k++) {
      const kk = Math.min(k, 24 * u - 1e-6), k0 = Math.floor(kk), f = kk - k0, src = WR[r];
      let x = lerp(src[2 * k0], src[2 * Math.min(23, k0 + 1)], f), y = lerp(src[2 * k0 + 1], src[2 * Math.min(23, k0 + 1) + 1], f);
      const tx = x0 - seg * r - seg * (k / 23) + 2, ty = RULE_Y;
      x = lerp(x, tx, m); y = lerp(y, ty, m); x = lerp(x, pen[0], c); y = lerp(y, pen[1], c);
      k ? g.lineTo(x, y) : g.moveTo(x, y);
    }
    g.strokeStyle = u < 1 ? mix(GOLD, HOT, u) : ORANGE; g.stroke();
  }
}

/* ---------------- the pen head: a chain of position sources blended by critically damped springs ---------------- */
const dcx = D.sx + D.pw / 2;
const nat0 = k => MORPHS[k].perm.dir ? N - 1 : 0;           // canonical index of a shape's natural point 0 (open shapes)
let curP = null;                                               // the main line of the frame being drawn
const dayPos = (pl, t) => { const v = globeDayView(t); const [x, y, z] = projLL(PLACES[pl][0], PLACES[pl][1], v, D.RD, D.gxD, D.gyD); return [x, y, z]; };
const PEN = [
  [0, () => [W / 2, H / 2]],
  [bt(1.7), t => ptAt(S0, idxAt(S0C, figS(t)))],
  [bt(14), () => ptAt(curP, nat0(0))],
  [bt(20.2), () => [TL.gx, TL.YT]],
  [bt(41.9), t => regionXY('slavuta', t)],
  [bt(44), t => routeHead(t)],
  [bt(47.55), () => [W / 2, H / 2]],
  [bt(52), () => ptAt(curP, nat0(3))],
  [bt(57), () => [D.sx, D.cy - D.ph / 2 - 6]],
  [bt(68), () => CANDLE_WICK()],
  [bt(76), () => [D.gxD, D.gyD - D.RD]],
  [bt(77.6), t => dayPos('slavuta', t)], [bt(79.6), t => dayPos('adelaide', t)], [bt(81.6), t => dayPos('harare', t)],
  [bt(83.6), t => dayPos('alexandria', t)], [bt(84.6), t => dayPos('cairo', t)],
  [bt(88), t => ringHead(t)],
  [bt(96), () => ptAt(curP, nat0(8))],
  [bt(108), () => [curP[0], curP[1]]],
  [bt(120), t => ptAt(curP, idxAt(S0C, figS(t)))],
  [bt(126.5), () => [W / 2, H / 2]]
];
function penAt(t) {
  let m = 0; for (let k = 0; k < PEN.length; k++) if (t - PEN[k][0] > 1.1) m = k;
  let [x, y] = PEN[m][1](t);
  for (let k = m + 1; k < PEN.length && t >= PEN[k][0]; k++) {
    const a = PEN[k - 1][1](t), b = PEN[k][1](t), s = crit(t - PEN[k][0], 12);
    x += (b[0] - a[0]) * s; y += (b[1] - a[1]) * s;
  }
  return [x, y];
}

/* ---------------- colours of the main line ---------------- */
const inkDusk = t => clamp(inv(bt(114.5), bt(116.5), t));
function lineColor(t, night) {
  if (night) return () => ORANGE;
  const b = t / B;
  if (b < 56) return () => NAVY;
  if (b < 80) {
    const sp = MORPHS[4].perm, rev = out3(inv(bt(57), bt(58.4), t));
    return i => { const j = natIdx(sp, Math.round(i), N), d = Math.abs(j - N / 2) / (N / 2), half = j < N / 2 ? CORAL : CYAN;
      let c = d < rev ? half : NAVY; if (t > bt(76)) { const x = morphX(7, t, Math.round(i)); c = x > 0.5 ? NAVY : c; } return c; };
  }
  if (b < 108) return () => NAVY;
  const u = inkDusk(t), c = mix(NAVY, ORANGE, u); return () => c;
}

/* ---------------- night: region map helpers ---------------- */
const viewNight = t => viewOf(spinL(t), spinP(t));
function regionXY(pl, t) { const [x, y] = projLL(PLACES[pl][0], PLACES[pl][1], viewNight(t), limbR(t), G.gx, G.gy); return [x, y]; }
const routeF = t => trap(inv(bt(44), bt(45.5), t), 0.12);
function routeHead(t) { const f = routeF(t), C = ROUTE.C, s = C[C.length - 1] * f; let i = 1; while (i < C.length - 1 && C[i] < s) i++; const u = (s - C[i - 1]) / ((C[i] - C[i - 1]) || 1), U = ROUTE.U;
  const v = viewNight(t)(lerp(U[3 * i - 3], U[3 * i], u), lerp(U[3 * i - 2], U[3 * i + 1], u), lerp(U[3 * i - 1], U[3 * i + 2], u)), m = Math.hypot(...v), R = limbR(t); return [G.gx + R * v[0] / m, G.gy - R * v[1] / m]; }

/* ---------------- text helpers ---------------- */
const words = s => s.split(' ');
function slam(g, t, text, b0, bOut, R, y, size, maxW, color, opt = {}) {
  const ws = words(text); slamWords(g, t, ws, 0, y, size, F.head, color, ws.map((_, i) => bt(b0) + i * 0.035), bOut == null ? null : bt(bOut), { right: R, maxW, ...opt });
}
const firePaint = (g) => gradPaint(g, 0, 0, W, 0, FIRE);
const LABEL = LN === 'h' ? 28 : 30;
function placeChips(g, t, x, y, t0, tOut, main, sub, night) {
  const fill = night ? gradFire : NAVY, ink = night ? NAVY : WHITE;
  chip(g, t, t0, tOut, x + 26, y - 38, main, { size: LABEL, fill, ink, anchor: 'l' });
  if (sub) chip(g, t, t0 + 0.08, tOut, x + 26, y - 38 + LABEL * 1.95, sub, { size: LABEL * 0.78, fill: night ? NAVY2 : WHITE, ink: night ? GOLD : NAVY, anchor: 'l' });
}

/* ================= NIGHT (b0–48) ================= */
function drawNight(g, t, P) {
  const b = t / B;
  g.fillStyle = NAVY; g.fillRect(0, 0, W, H);
  // heartbeat on b46, 46.5, 47, 47.5 (the frame thumps)
  let hb = 0; for (const k of [46, 46.5, 47, 47.5]) { const s = t - bt(k); if (s > 0) hb += Math.exp(-s * 16) * (1 - Math.exp(-s * 70)); }
  g.save(); if (hb > 0) { g.translate(W / 2, H / 2); g.scale(1 + 0.035 * hb, 1 + 0.035 * hb); g.translate(-W / 2, -H / 2); }
  if (b >= 31) drawRegion(g, t);
  drawMainLine(g, t, P, true);
  if (b < 21) { writingLines(g, t, P); figureText(g, t); }
  if (b >= 19.8 && b < 32) timelineScene(g, t);
  if (b >= 36 && b < 49) regionMarks(g, t);
  g.restore();
  if (b >= 46) bars(g, t);
}
function drawMainLine(g, t, P, night) {
  const b = t / B, col = lineColor(t, night);
  const drawing = b < 12.05 || b >= 120;
  if (b < 1.95) return;
  const iH = drawing ? idxAt(S0C, figS(t)) : N - 1;
  strokeLine(g, P, 0, iH, col, LW);
  if (drawing && b < 12.05) hotTip(g, P, S0C, iH, 140, LW, GOLD, HOT, mix);
}
function figureText(g, t) {
  const hd = L.hd;
  riseLine(g, t, 'קו אחד.', L.kick[0], L.kick[1], F.head, L.kick[2], WHITE, bt(1.5), bt(3.3), { align: 'c', rule: { color: ORANGE, lw: 3 }, spacing: 2 });
  slam(g, t, 'רבי שניאור זלמן', 6, 11.3, hd.R, hd.ys[0], hd.size, hd.maxW, WHITE);
  slam(g, t, 'מליאדי.', 8, 11.35, hd.R, hd.ys[1], hd.size, hd.maxW, WHITE);
  slam(g, t, 'אדמו״ר הזקן.', 10, 11.4, hd.R, hd.ys[2], hd.size, hd.maxW, NAVY, { marker: { i: 0, paint: firePaint(g) }, colors: [NAVY, WHITE] });
  chip(g, t, bt(12), bt(14.1), L.chip20[0], L.chip20[1], '20 שנה של כתיבה', { size: LN === 'h' ? 40 : 38, anchor: LN === 'h' ? 'r' : 'r' });
  // the book's cover: title out of the rule (the writing became that rule), then the name chip
  riseLine(g, t, 'תניא', bN.cx, TITLE_Y, F.frank, TITLE_S, NAVY, bt(16), bt(19.25), { align: 'c', marker: { paint: gradFire, pad: 0.14 } });
  riseLine(g, t, 'ליקוטי אמרים', bN.cx, bN.cy + 140, F.frank, 62, WHITE, bt(17), bt(19.3), { align: 'c', rule: { color: ORANGE, lw: 3 } });
  chip(g, t, bt(18), bt(19.9), L.nameChip[0], L.nameChip[1], 'השם = המילה הראשונה בספר', { size: LN === 'h' ? 36 : 34 });
}
/* ---------------- timeline (b20–32) ---------------- */
const TICKS = []; for (let y = 1740; y <= 2040; y += 10) TICKS.push(y);
const MARKS = [[1812, '1812'], [1798, '1798 · נאסר'], [1796, '1796 · נדפס']];
const ENTER = {};
function buildEnter() {
  const vis = TICKS.filter(y => { const x = yX(y, bt(20.5)); return x > -20 && x < W + 20; }).sort((a, c) => Math.abs(yX(a, bt(20.5)) - TL.gx) - Math.abs(yX(c, bt(20.5)) - TL.gx));
  vis.forEach((y, i) => ENTER['t' + y] = bt(20.5 + 0.5 * Math.floor(i * 4 / vis.length)));
  const first = (x0) => { for (let t = bt(20.5); t < bt(30); t += 1 / 240) { const x = x0(t); if (x > -30 && x < W + 30) return t; } return Infinity; };
  for (const y of TICKS) if (!('t' + y in ENTER)) ENTER['t' + y] = first(t => yX(y, t));
  for (const [y] of MARKS) ENTER['m' + y] = Math.max(bt(22), first(t => yX(y, t) + (y === 1812 ? 0 : 0)));
}
function timelineScene(g, t) {
  const b = t / B;
  g.lineCap = 'round'; g.strokeStyle = ORANGE; g.lineWidth = 3;
  for (const y of TICKS) {
    const x = yX(y, t); if (x < -40 || x > W + 40) continue;
    const s = popS(t, ENTER['t' + y], bt(29.1)); if (s <= 0.001) continue;
    const h = (y % 50 === 0 ? 34 : 18) * s; g.beginPath(); g.moveTo(x, TL.YT - 4); g.lineTo(x, TL.YT - 4 - h); g.stroke();
  }
  for (const [y, label] of MARKS) {
    const x = yX(y, t); if (x < -400 || x > W + 400) continue;
    const t0 = ENTER['m' + y], s = popS(t, t0, bt(29.1)); if (s <= 0.001) continue;
    const my = y === 1798 ? TL.YT - (TL.my - TL.YT) : TL.my, dir = Math.sign(my - TL.YT);
    g.beginPath(); g.moveTo(x, TL.YT + 6 * dir); g.lineTo(x, TL.YT + (6 + (Math.abs(my - TL.YT) - 40) * s) * dir); g.strokeStyle = GOLD; g.lineWidth = 3; g.stroke();
    chip(g, t, t0 + 0.04, bt(29.1), x, my, label, { size: LN === 'h' ? 34 : 32 });
  }
  if (b >= 21.2 && b < 31.2) yearCounter(g, t);
  slam(g, t, '1745 · ה׳תק״ה', 28, 31.1, TL.slR, TL.slY[0], TL.slS, TL.slW, WHITE);
  slam(g, t, 'נולד.', 28.5, 31.15, TL.slR, TL.slY[1], TL.slS, TL.slW, NAVY, { marker: { i: 0, paint: firePaint(g) } });
}
function yearCounter(g, t) {
  const v = camYear(t), size = TL.cs, tIn = bt(21.2), tOut = bt(30.7);
  let dy = size * 1.2 * (1 - out3(inv(tIn, tIn + 0.34, t))) + size * 1.3 * in3(inv(tOut, tOut + 0.3, t));
  g.save(); g.font = F.kick(size); g.direction = 'ltr'; g.textAlign = 'center';
  const cw = g.measureText('0').width * 1.02, x0 = TL.gx - cw * 2, base = TL.cy;
  g.beginPath(); g.rect(x0 - 40, base - size * 0.86, cw * 4 + 80, size * 0.93); g.clip();
  g.fillStyle = WHITE;
  for (let p = 0; p < 4; p++) {
    const unit = Math.pow(10, 3 - p), q = v / unit, d = Math.floor(q) % 10, low = v - Math.floor(v / unit) * unit;
    const frac = p === 3 ? q - Math.floor(q) : clamp(low - (unit - 1));
    const lh = size * 1.0, x = x0 + cw * (p + 0.5);
    g.fillText(String(d), x, base + dy + frac * lh); g.fillText(String((d + 1) % 10), x, base + dy + frac * lh - lh);
  }
  g.restore();
}

/* ---------------- region (b31–48): globe, zoom, borders, pages, print, route ---------------- */
function drawRegion(g, t) {
  const b = t / B, V = viewNight(t), R = limbR(t), B2 = B;
  g.lineCap = 'round'; g.lineJoin = 'round';
  g.strokeStyle = ORANGE; g.lineWidth = 3;
  if (b >= 32 && b < 37.8) L110.forEach((r, i) => {
    let f = clamp((t - bt(32) - R110[i] * 0.5 * B2) / (0.5 * B2));
    if (b >= 36) f = Math.min(f, 1 - clamp((t - bt(36) - R110[i] * 0.3 * B2) / (0.5 * B2)));
    if (f > 0) globeLine(g, r.U, r.C, f, V, R, G.gx, G.gy);
  });
  if (b >= 36.2) L50.forEach((r, i) => { const f = clamp((t - bt(36.2) - R50[i] * 0.5 * B2) / (0.6 * B2)); if (f > 0) globeLine(g, r.U, r.C, f, V, R, G.gx, G.gy); });
  if (b >= 36.5) {
    g.save(); g.setLineDash([0.01, 12]); g.lineWidth = 4.5; g.strokeStyle = GOLD;
    BD50.forEach((r, i) => { const f = clamp((t - bt(36.5) - RB50[i] * 0.4 * B2) / (0.6 * B2)); if (f > 0) globeLine(g, r.U, r.C, f, V, R, G.gx, G.gy); });
    g.restore();
  }
  if (b >= 44) { g.strokeStyle = GOLD; g.lineWidth = 6; globeLine(g, ROUTE.U, ROUTE.C, routeF(t), V, R, G.gx, G.gy); }
}
const PG = [[-430, -250], [-560, 60], [-300, 300], [250, -290], [330, 160], [-140, -380], [150, 330], [-690, -150]];
const STRIKE = [1, 3, 4, 6, 0, 7, 2, 5];
const PGW = LN === 'h' ? 64 : 58, PGH = LN === 'h' ? 84 : 76;
function pageState(j, t) {
  const tj = bt(38 + j / 2), u = crit(t - tj, 9), [cx, cy] = [G.gx, G.gy];
  const off = LN === 'h' ? PG[j] : [PG[j][0] * 0.62, PG[j][1] * 1.25];
  const ex = cx + off[0], ey = cy + off[1], mx = (cx + ex) / 2, my = (cy + ey) / 2 - 170;
  let x = (1 - u) * (1 - u) * cx + 2 * (1 - u) * u * mx + u * u * ex, y = (1 - u) * (1 - u) * cy + 2 * (1 - u) * u * my + u * u * ey;
  const c = crit(t - bt(42) - j * 0.04 * B, 10), [sx, sy] = regionXY('slavuta', t);
  x = lerp(x, sx, c); y = lerp(y, sy - PGH * 1.3, c);
  let s = popS(t, tj, null) * (1 + 0.15 * Math.sin(u * Math.PI));
  if (j) s *= 1 - in3(inv(bt(42.45), bt(42.75), t)); else s *= 1 + 1.4 * crit(t - bt(42.4), 10);
  return { x, y, s, rot: (1 - u) * 0.5 * (j % 2 ? 1 : -1) * (1 - c) };
}
function drawPage(g, t, j) {
  const { x, y, s, rot } = pageState(j, t); if (s <= 0.002) return;
  let sx = s, sy = s;
  if (!j) { const d = t - bt(43); if (d > 0) sy *= 1 - 0.2 * Math.exp(-d * 9) * Math.cos(d * 22); sx *= 1 + 0.08 * (d > 0 ? Math.exp(-d * 9) : 0); const e = 1 - in3(inv(bt(44.2), bt(44.5), t)); sx *= e; sy *= e; if (e <= 0) return; }
  g.save(); g.translate(x, y + PGH / 2); g.rotate(rot); g.scale(sx, sy); g.translate(0, -PGH / 2);
  rrc(g, 0, 0, PGW, PGH, 14); g.fillStyle = NAVY2; g.fill(); g.lineWidth = 3 / Math.max(0.5, s); g.strokeStyle = ORANGE; g.stroke();
  const printed = !j && t >= bt(43);
  if (printed) {
    g.fillStyle = GOLD; g.font = F.frank(9.5); g.direction = 'rtl'; g.textAlign = 'center'; g.fillText('ליקוטי אמרים', 0, -PGH * 0.22);
    g.fillStyle = 'rgba(255,199,78,.75)'; for (let k = 0; k < 4; k++) { rrc(g, 0, -PGH * 0.02 + k * 9, PGW * (k === 3 ? 0.4 : 0.66), 3, 1.5); g.fill(); }
  } else {
    g.strokeStyle = GOLD; g.lineWidth = 1.6; g.beginPath();
    for (let k = 0; k < 4; k++) { const yy = -PGH * 0.28 + k * PGH * 0.17, xr = PGW * 0.32, xl = -PGW * (k === 3 ? 0.05 : 0.32); g.moveTo(xr, yy); for (let q = 1; q <= 8; q++) g.lineTo(lerp(xr, xl, q / 8), yy + 1.6 * Math.sin(q * 2.3 + k + j)); }
    g.stroke();
    const k = STRIKE.indexOf(j), ts = bt(40 + k / 4), u = clamp((t - ts) / 0.07);
    if (k >= 0 && u > 0) { g.beginPath(); g.moveTo(PGW * 0.36, -PGH * 0.36); g.lineTo(lerp(PGW * 0.36, -PGW * 0.36, u), lerp(-PGH * 0.36, PGH * 0.36, u)); g.lineCap = 'round'; g.lineWidth = 5; g.strokeStyle = CORAL; g.stroke(); }
  }
  g.restore();
}
function stamp(g, t) {
  const d0 = bt(43) - 0.24; if (t < d0 || t > bt(44.6)) return;
  const p = pageState(0, t), w = PGW * 2.9, h = 64, top = p.y - 4;
  const fall = clamp((t - d0) / 0.24), lift = crit(t - bt(43.25), 7);
  const y = top - h / 2 - 700 * (1 - fall * fall) - 900 * lift;
  const sq = t > bt(43) ? 1 - 0.12 * Math.exp(-(t - bt(43)) * 10) : 1;
  g.save(); g.translate(p.x, y + h / 2); g.scale(1 / sq, sq); g.translate(0, -h / 2);
  shadow2(g, () => { rrc(g, 0, 0, w, h, 28); g.fillStyle = gradPaint(g, -w / 2, 0, w / 2, 0, FIRE); g.fill(); });
  rrc(g, 0, -h * 0.72, w * 0.22, h * 0.9, 18); g.fillStyle = gradPaint(g, -w / 2, 0, w / 2, 0, FIRE); g.fill();
  g.restore();
}
function regionMarks(g, t) {
  const b = t / B, col = L.col;
  const [lx, ly] = regionXY('liozna', t);
  pin(g, lx, ly, popS(t, bt(36), null), firePaint);
  placeChips(g, t, lx, ly, bt(36.1), null, 'ליוזנא · 1745', 'היום: בלארוס', true);
  if (b >= 37.4) { const [bx, by] = projLL(28.6, 51.45, viewNight(t), limbR(t), G.gx, G.gy); chip(g, t, bt(37.5), null, bx, by, 'גבולות של היום', { size: LABEL * 0.8, fill: NAVY2, ink: GOLD }); }
  if (b >= 38) for (let j = 7; j >= 0; j--) drawPage(g, t, j);
  stamp(g, t);
  const [sx, sy] = regionXY('slavuta', t);
  if (b >= 43.1) { pin(g, sx, sy, popS(t, bt(43.2), null), firePaint); placeChips(g, t, sx, sy, bt(43.3), null, 'סלאוויטא · 1796', 'היום: אוקראינה', true); }
  if (b >= 45.4) { const [fx, fy] = regionXY('fortress', t); pin(g, fx, fy, popS(t, bt(45.5), null), firePaint); placeChips(g, t, fx, fy, bt(45.6), null, 'פטרבורג · מבצר פטרופבלובסק', null, true); }
  chip(g, t, bt(44), null, col.R, col.ys[2] + 40, 'תשרי ה׳תקנ״ט · 1798', { size: LN === 'h' ? 38 : 36, anchor: 'r' });
  slam(g, t, 'הועתק ביד.', 38, 39.1, col.R, col.ys[0], col.size, col.maxW, WHITE);
  slam(g, t, 'ונפלו טעויות.', 40, 41.9, col.R, col.ys[1], col.size, col.maxW, WHITE, { marker: { i: 1, paint: firePaint(g) }, colors: [WHITE, NAVY] });
  slam(g, t, 'נדפס.', 43, 45.4, col.R, col.ys[0], col.size, col.maxW, NAVY, { marker: { i: 0, paint: firePaint(g) } });
  slam(g, t, 'נאסר.', 44.5, null, col.R, col.ys[1], col.size, col.maxW, WHITE);
}
const MONTHS = [['תשרי', 46], ['חשוון', 46.5], ['כסלו', 47], ['י״ט כסלו', 48]];
function bars(g, t) {
  const bw = L.bar, open = spring(t - bt(48), 14, 0.6);
  for (let j = 0; j < 8; j++) {
    const x = W * (j + 0.5) / 8, d = spring(t - bt(46 + j / 4), 16, 0.55); if (d <= 0) continue;
    const y0 = -H * 1.1 * (1 - d), dx = Math.sign(x - W / 2) * (Math.abs(x - W / 2) * 0.4 + W * 0.62) * open;
    rr(g, x + dx - bw / 2, y0 - 30, bw, H + 60, bw / 2); g.fillStyle = NAVY2; g.fill(); g.lineWidth = 3; g.strokeStyle = ORANGE; g.stroke();
  }
  // the calendar: the month rolls out of its pill on 8th notes and lands on 19 Kislev at the drop
  const s = popS(t, bt(46), null), size = LN === 'h' ? 46 : 44; if (s <= 0.001) return;
  g.save(); g.font = F.head(size); const w = g.measureText('י״ט כסלו').width + size * 1.6, h = size * 1.8;
  g.translate(L.cal[0], L.cal[1]); g.scale(s, s);
  shadow2(g, () => { rrc(g, 0, 0, w, h, h / 2); g.fillStyle = gradPaint(g, w / 2, 0, -w / 2, 0, FIRE); g.fill(); });
  rrc(g, 0, 0, w, h, h / 2); g.clip(); g.fillStyle = NAVY; g.direction = 'rtl'; g.textAlign = 'center';
  MONTHS.forEach(([m, k], i) => {
    const t0 = bt(k), t1 = i < 3 ? bt(MONTHS[i + 1][1]) : Infinity; if (t < t0 - 0.001 && i) return;
    const yIn = i ? h * (1 - out3(inv(t0, t0 + 0.12, t))) : 0, yOut = -h * in3(inv(t1, t1 + 0.12, t));
    g.fillText(m, 0, size * 0.36 + yIn + yOut);
  });
  g.restore();
}
/* ================= DAY (b48–108) and the return (b108–128) ================= */
function sky(g, t) {
  const u = inv(bt(108), bt(120), t), DUSK_T = '#4B4F9C', DUSK_L = '#FF8F3A';
  const top = u < 0.45 ? mix(SKY_TOP, DUSK_T, u / 0.45) : mix(DUSK_T, NAVY, (u - 0.45) / 0.55);
  const low = u < 0.45 ? mix(SKY_LOW, DUSK_L, u / 0.45) : mix(DUSK_L, NAVY, (u - 0.45) / 0.55);
  if (top === low) { g.fillStyle = top; g.fillRect(0, 0, W, H); return; }
  const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, top); gr.addColorStop(1, low); g.fillStyle = gr; g.fillRect(0, 0, W, H);
}
const VIEW_KEYS = [[75, [26.87, 50.3]], [76.9, [138.6, -34.93]], [78.9, [31.05, -17.83]], [80.9, [29.89, 31.2]], [83.2, [31.24, 30.04]]];
function globeDayView(t) {
  let l = VIEW_KEYS[0][1][0], p = VIEW_KEYS[0][1][1];
  for (let i = 1; i < VIEW_KEYS.length; i++) { const s = crit(t - bt(VIEW_KEYS[i][0]), 5.2); l += (VIEW_KEYS[i][1][0] - VIEW_KEYS[i - 1][1][0]) * s; p += (VIEW_KEYS[i][1][1] - VIEW_KEYS[i - 1][1][1]) * s; }
  p = lerp(18, p, 1) - 14; // tilt a little south of each place so its label sits on the disc
  return viewOf(l, p);
}
const RING_A0 = LN === 'h' ? -Math.PI / 2 : Math.PI / 2;
const DPINS = [['slavuta', 'סלאוויטא · 1796', 78], ['adelaide', 'אדלייד', 80], ['harare', 'הרארה', 82], ['alexandria', 'אלכסנדריה', 84], ['cairo', 'קהיר', 85]];
function ringHead(t) { const k = clamp(Math.floor((t - bt(88)) / (B / 4)), 0, 31), a = RING_A0 + 2 * Math.PI * (k + 1) / 32; return [D.gxD + (D.RD + 34) * Math.cos(a), D.gyD + (D.RD + 34) * Math.sin(a)]; }
function quote(g, t, text, b0, bOut) {
  const lines = wrap(g, text, F.frank(D.qS), D.qW);
  lines.forEach((ln, k) => riseLine(g, t, ln, D.R, D.qY + k * D.qLH, F.frank, D.qS, NAVY, bt(b0 + k * 0.5), bt(bOut) + k * 0.03, { align: 'r', rule: { color: NAVY, lw: 3 } }));
}
const dayHead = (g, t, text, b0, bOut, row = 0, marker = null) => slam(g, t, text, b0, bOut, D.R, D.headY + row * D.size * 1.08, D.size, D.maxW, NAVY, marker != null ? { marker: { i: marker, paint: firePaint(g) } } : {});
const dayChip = (g, t, text, b0, bOut) => chip(g, t, bt(b0), bt(bOut), D.R, D.chipY, text, { size: LN === 'h' ? 38 : 36, anchor: 'r', fill: NAVY, ink: WHITE });
function crown(g, x, y, s, c) {
  if (s <= 0.002) return; g.save(); g.translate(x, y); g.scale(s, s);
  g.beginPath(); g.moveTo(-46, 22); g.lineTo(-52, -26); g.lineTo(-24, 0); g.lineTo(0, -38); g.lineTo(24, 0); g.lineTo(52, -26); g.lineTo(46, 22); g.closePath();
  g.fillStyle = c; g.fill(); g.lineJoin = 'round'; g.lineWidth = 5; g.strokeStyle = NAVY; g.stroke(); g.restore();
}
function drawDay(g, t, P) {
  const b = t / B;
  sky(g, t);
  const kick = b < 52 ? 1 + 0.05 * (1 - spring(t - bt(48), 14, 0.5)) : 1;
  g.save(); if (kick !== 1) { g.translate(W / 2, H / 2); g.scale(kick, kick); g.translate(-W / 2, -H / 2); }
  if (b >= 76 && b < 98) globeDay(g, t);
  drawMainLine(g, t, P, false);
  if (b < 52) { const R = L.drop; slam(g, t, 'י״ט כסלו.', 48, 51.3, R.R, R.ys[0], R.size, R.maxW, NAVY); slam(g, t, 'שוחרר.', 49, 51.3, R.R, R.ys[1], R.size, R.maxW, NAVY, { marker: { i: 0, paint: firePaint(g) } }); slam(g, t, 'ראש השנה לחסידות.', 50, 51.3, R.R, R.ys[2], R.size, R.maxW, NAVY); }
  if (b >= 52 && b < 60) {
    riseLine(g, t, 'תניא', dcx, D.cy - 10, F.frank, LN === 'h' ? 110 : 112, NAVY, bt(53.1), bt(54.9), { align: 'c', marker: { paint: gradFire, pad: 0.14 } });
    dayChip(g, t, 'פרק ב׳', 56, 59.25); dayHead(g, t, 'שתי נפשות.', 57, 59.2, 0, 1); quote(g, t, 'ונפש השנית בישראל, היא חלק אלוה ממעל ממש', 57.5, 59.15);
  }
  if (b >= 60 && b < 68.6) {
    const cx = (D.cx0 + D.cx1) / 2, hw = (D.cx1 - D.cx0) / 2, cy = D.top + (D.gy - D.top) * 0.18;
    crown(g, cx + hw * 0.6, cy, popS(t, bt(62), bt(68)), CORAL); crown(g, cx - hw * 0.6, cy, popS(t, bt(63), bt(68)), CYAN);
    dayChip(g, t, 'פרק ט׳', 60, 67.25); dayHead(g, t, 'עיר קטנה.', 61, 67.2, 0, 1); quote(g, t, 'כי הגוף נקרא \'עיר קטנה\', וכמו ששני מלכים נלחמים על עיר אחת', 63, 67.15);
  }
  if (b >= 68 && b < 76) { dayChip(g, t, 'פרק י״ט', 68, 75.25); dayHead(g, t, 'הנר.', 69, 75.2, 0, 0); quote(g, t, 'כאור הנר שמתנענע תמיד למעלה בטבעו', 70, 75.15); }
  if (b >= 79 && b < 88) { dayHead(g, t, 'אלפי מהדורות.', 80, 87.2, 0, 1); dayHead(g, t, 'בכל העולם.', 82, 87.25, 1); }
  if (b >= 87 && b < 96) { dayHead(g, t, 'לומדים כל יום.', 88, 95.3, 0, 2); dayHead(g, t, 'ומסיימים בי״ט כסלו.', 92, 95.35, 1, 1); }
  if (b >= 96 && b < 108.2) verse(g, t);
  g.restore();
}
function globeDay(g, t) {
  const b = t / B, V = globeDayView(t), R = D.RD;
  g.lineCap = 'round'; g.lineJoin = 'round'; g.strokeStyle = NAVY; g.lineWidth = 3;
  L110.forEach((r, i) => {
    let f = clamp((t - bt(77) - R110[i] * 0.5 * B) / (0.5 * B));
    if (b >= 96) f = Math.min(f, 1 - clamp((t - bt(96) - R110[i] * 0.3 * B) / (0.5 * B)));
    if (f > 0) globeLine(g, r.U, r.C, f, V, R, D.gxD, D.gyD);
  });
  for (const [pl, label, k] of DPINS) {
    const [x, y, z] = projLL(PLACES[pl][0], PLACES[pl][1], V, R, D.gxD, D.gyD), vis = clamp((z - 0.05) * 5);
    const s = popS(t, bt(k), bt(96)) * vis; if (s <= 0.002) continue;
    pin(g, x, y, s, NAVY, GOLD);
    const dy = pl === 'cairo' ? LABEL * 2.1 : 0;
    g.save(); g.translate(x, y); g.scale(vis, vis); g.translate(-x, -y);
    chip(g, t, bt(k) + 0.06, bt(96), x + 26, y - 38 + dy, label, { size: LABEL, fill: NAVY, ink: WHITE, anchor: 'l' }); g.restore();
  }
  // the year: a ring of day ticks, one per 16th note, closing on a fire mark at the top
  if (b >= 88) {
    for (let k = 0; k < 32; k++) {
      const s = popS(t, bt(88 + k / 4), null) * (1 - in3(inv(bt(96) + k * 0.004, bt(96.4) + k * 0.004, t))); if (s <= 0.002) continue;
      const a = RING_A0 + 2 * Math.PI * (k + 1) / 32, r0 = R + 22, r1 = R + 22 + (k === 31 ? 40 : 24) * s;
      g.beginPath(); g.moveTo(D.gxD + r0 * Math.cos(a), D.gyD + r0 * Math.sin(a)); g.lineTo(D.gxD + r1 * Math.cos(a), D.gyD + r1 * Math.sin(a));
      g.lineWidth = k === 31 ? 9 : 5; g.strokeStyle = k === 31 ? ORANGE : NAVY; g.stroke();
    }
    chip(g, t, bt(95.75), bt(97.2), D.gxD, LN === 'h' ? D.gyD - R - 100 : D.gyD + R + 100, 'י״ט כסלו', { size: LN === 'h' ? 40 : 38 });
  }
}
const VERSE = ['כי', 'קרוב', 'אליך', 'הדבר', 'מאד'];
function verse(g, t) {
  riseLine(g, t, 'תניא', dcx, D.cy - 10, F.frank, LN === 'h' ? 110 : 112, NAVY, bt(97.5), bt(107.1), { align: 'c', marker: { paint: gradFire, pad: 0.14 } });
  const S = D.vS; g.save(); g.font = F.frank(S); const gap = S * 0.28;
  const rows = [[0, 1, 2], [3, 4]];
  rows.forEach((row, r) => {
    let xr = D.R; const y = D.vY + r * S * 1.3;
    row.forEach(i => { const w = g.measureText(VERSE[i]).width; riseLine(g, t, VERSE[i], xr, y, F.frank, S, NAVY, bt(97 + i), bt(107.0), { align: 'r', marker: { t: bt(97 + i) + 0.12, paint: gradFire, pad: 0.12 } }); xr -= w + gap; });
  });
  g.restore();
  const cy = D.vY + S * 2.45;
  chip(g, t, bt(101.5), bt(107.1), D.R, cy, 'דברים ל׳, י״ד', { size: LN === 'h' ? 36 : 34, anchor: 'r', fill: NAVY, ink: WHITE,
    ring: (g2, w, h) => { const gr = g2.createConicGradient(t * 2.2, 0, 0); SPECTRUM.forEach((c, i) => gr.addColorStop(i / (SPECTRUM.length - 1), c)); rrc(g2, 0, 0, w + 12, h + 12, (h + 12) / 2); g2.fillStyle = gr; g2.fill(); } });
  const yA = LN === 'h' ? 720 : D.headY, yB = LN === 'h' ? 870 : D.headY + D.size * 1.08, sz = LN === 'h' ? 112 : D.size;
  slam(g, t, 'ספר של בינונים.', 104, 107.0, D.R, yA, sz, D.maxW, NAVY, { marker: { i: 2, paint: firePaint(g) } });
  slam(g, t, 'מדת כל אדם.', 106, 107.05, D.R, yB, sz, D.maxW, NAVY);
  chip(g, t, bt(106.2), bt(107.1), LN === 'h' ? D.R : D.R, LN === 'h' ? 960 : D.chipY, 'פרק י״ד', { size: LN === 'h' ? 34 : 36, anchor: 'r', fill: NAVY, ink: WHITE });
}

/* ---------------- overlays that live across scenes ---------------- */
let CAP_OUT = 0;
function overlays(g, t) {
  const b = t / B, dusk = inkDusk(t), night = b < 48 || b > 116;
  const capFill = night ? NAVY2 : NAVY, capInk = GOLD, cs = LN === 'h' ? 26 : 28;
  chip(g, t, bt(2.4), bt(14.6), L.cap[0], L.cap[1], 'הדיוקן המסורתי', { size: cs, fill: capFill, ink: capInk, anchor: L.cap[2] });
  chip(g, t, bt(109), CAP_OUT, L.cap[0], L.cap[1], 'הדיוקן המסורתי', { size: cs, fill: capFill, ink: capInk, anchor: L.cap[2] });
  chip(g, t, bt(112), bt(118), L.credit[0], L.credit[1], 'MADE WITH YUV.AI MOTION · 100% CODE', { size: LN === 'h' ? 26 : 26, font: F.kick, fill: mix(NAVY, NAVY2, dusk), ink: WHITE, anchor: L.credit[2], spacing: 2, ltr: true });
}
function pens(g, t) {
  const b = t / B, [x, y] = penAt(t);
  const breathe = (0.5 - 0.5 * Math.cos(2 * Math.PI * b)) * Math.max(1 - crit(t - bt(1.7), 12), crit(t - bt(127), 12));
  let k = 1;
  if (b >= 57 && b < 76.5) k = b < 76 ? 1 - out3(inv(bt(57), bt(57) + 0.14, t)) : popS(t, bt(76), null);
  penDot(g, x, y, t, T, k, breathe);
  if (b >= 57 && b < 68.9) { // two flames: coral (נפש הבהמית) and cyan (נפש האלוקית)
    const s = popS(t, bt(57), null) * (1 - in3(inv(bt(68.4), bt(68.7), t))), cx = (D.cx0 + D.cx1) / 2, hw = (D.cx1 - D.cx0) / 2, ht = D.gy - D.top;
    const at = (side) => { const k0 = [D.sx, D.cy - D.ph / 2 - 10], k1 = [D.sx + side * D.pw * 0.5, D.cy - D.ph / 2 - 46], k2 = [cx + side * hw * 0.26, D.gy - 0.74 * ht - 44], k3 = CANDLE_WICK();
      const a = crit(t - bt(57.3), 9), c = crit(t - bt(60), 7), e = crit(t - bt(67.6), 10);
      return [k0[0] + (k1[0] - k0[0]) * a + (k2[0] - k1[0]) * c + (k3[0] - k2[0]) * e, k0[1] + (k1[1] - k0[1]) * a + (k2[1] - k1[1]) * c + (k3[1] - k2[1]) * e]; };
    const [rx, ry] = at(1), [lx, ly] = at(-1), fs = LN === 'h' ? 30 : 32;
    flame(g, rx, ry, fs * s, t, T, ['#FFD3BF', CORAL, '#D74270'], { seed: 1, halo: 0.8 });
    flame(g, lx, ly, fs * s, t, T, ['#FFFFFF', CYAN, '#4FA3FF'], { seed: 2, halo: 0.8 });
  }
  if (b >= 68.4 && b < 76.4) { // the candle: one flame, leaning upward on every beat
    let up = 0; for (let k2 = 69; k2 <= 75; k2++) { const d = t - bt(k2); if (d > 0) up += Math.exp(-d * 7) * (1 - Math.exp(-d * 40)); }
    const s = popS(t, bt(68.5), null) * (1 - in3(inv(bt(76), bt(76.25), t))), [wx, wy] = CANDLE_WICK();
    flame(g, wx, wy - 34, (LN === 'h' ? 46 : 50) * s, t, T, FIRE, { stretch: 1 + 0.45 * up, seed: 3 });
  }
}

/* ---------------- frame ---------------- */
function drawFrame(g, t) {
  const b = t / B; curP = mainLine(t);
  if (b < 48) drawNight(g, t, curP);
  else if (t < bt(48) + FLOOD_D + 0.02) {
    drawNight(g, t, curP);
    const r = FLOOD_R * out3(clamp((t - bt(48)) / FLOOD_D));
    g.save(); circle(g, W / 2, H / 2, r); g.clip(); drawDay(g, t, curP); g.restore();
  } else drawDay(g, t, curP);
  if (b >= 48 && b < 49.5) { // spectrum shockwave riding the flood edge, then out of frame
    const q = (t - bt(48)) / 0.55, r = FLOOD_R * 1.25 * out3(clamp(q));
    if (q < 1) { const gr = g.createConicGradient(q * 3, W / 2, H / 2); SPECTRUM.forEach((c, i) => gr.addColorStop(i / (SPECTRUM.length - 1), c)); circle(g, W / 2, H / 2, r); g.lineWidth = 22 * (1 - q) + 4; g.strokeStyle = gr; g.stroke(); }
  }
  overlays(g, t); pens(g, t);
}

/* ---------------- mount: fonts first, then data, then the first seek ---------------- */
const cv = document.getElementById('c'), SCALE = +(Q.get('scale') || 1);
cv.width = Math.round(W * SCALE); cv.height = Math.round(H * SCALE);
const ctx = cv.getContext('2d'), scratch = document.createElement('canvas'); scratch.width = cv.width; scratch.height = cv.height; const sctx = scratch.getContext('2d');
const frame = (x, t) => { x.setTransform(SCALE, 0, 0, SCALE, 0, 0); x.globalAlpha = 1; drawFrame(x, t); };
window.__ready = (async () => {
  await Promise.all(FONT_CHECK.map(f => document.fonts.load(f, 'אבג abc 1745 ׳״')));
  await document.fonts.ready;
  window.__fontsOk = FONT_CHECK.every(f => document.fonts.check(f, 'אבג abc'));
  if (!window.__fontsOk) throw new Error('fonts missing');
  buildMorphs(); buildPasses(); buildEnter();
  // the caption leaves when the un-drawing pen has removed the last stroke of the bust
  const fb = FIG.breaks[FIG.kinds.indexOf('bust')] / (FIG.pts.length / 2), sB = fb * FIG_L;
  for (let tt = bt(120); tt < bt(127); tt += 1 / 240) if (figS(tt) < sB) { CAP_OUT = tt; break; }
  window.seek = t => frame(ctx, t);
  window.renderFrame = (t, n = 6, shutter = 0.5, fps = 60) => {
    if (n <= 1) { frame(ctx, t); return; }
    const span = shutter / fps;
    for (let i = 0; i < n; i++) { const ts = Math.max(0, t - span / 2 + span * (i + 0.5) / n); frame(sctx, ts); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1 / (i + 1); ctx.drawImage(scratch, 0, 0); ctx.globalAlpha = 1; }
  };
  window.FILM = { B, BPM, DUR: T, NB, NFR, layout: LN, W, H };
  frame(ctx, 0);
  return true;
})();
