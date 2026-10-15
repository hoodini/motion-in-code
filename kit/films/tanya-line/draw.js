/* =====================================================================
   tanya-line · DRAW — type and small objects. Pure functions of t.
   chips pop from zero on a spring · text rises out of a mask line and sinks back ·
   pins · candle flame · the pen head (the only glows in the film).
   ===================================================================== */
import { clamp, lerp, inv, out3, in3, spring, rgba, rrc, rr, circle, gradPaint } from '../../src/core.js';
import { pnoise } from './engine.js';

export const F = {
  head: s => `900 ${s}px Rubik`,
  kick: s => `400 ${s}px Anton, Rubik`,
  frank: s => `700 ${s}px "Frank Ruhl Libre", Rubik`,
  lab: s => `700 ${s}px Assistant, Rubik`
};
export const FONT_CHECK = ['900 100px Rubik', '400 100px Anton', '700 60px "Frank Ruhl Libre"', '700 40px Assistant'];
export const HE = /[\u0590-\u05FF]/;
export const NAVY = '#12163F', NAVY2 = '#1E2357', WHITE = '#FFFFFF', GOLD = '#FFC74E', ORANGE = '#FF8F3A', CORAL = '#F56B49', CYAN = '#5DE4E9', PINK = '#FF66C4';
export const FIRE = ['#FFC74E', '#FF8F3A', '#F56B49'];
export const HOT = '#FFF3D6';

/** two-layer navy shadow under whatever `paint()` fills */
export function shadow2(g, paint, k = 1) {
  g.save(); g.shadowColor = 'rgba(8,10,40,.38)'; g.shadowBlur = 26 * k; g.shadowOffsetY = 12 * k; paint();
  g.shadowColor = 'rgba(8,10,40,.30)'; g.shadowBlur = 5 * k; g.shadowOffsetY = 2 * k; paint(); g.restore();
}
/** pop-in / pop-out scale: spring z .55 in, accelerating shrink out */
export function popS(t, t0, tOut, w = 18, z = 0.55) {
  if (t < t0) return 0; let s = spring(t - t0, w, z);
  if (tOut != null) s *= 1 - in3(inv(tOut, tOut + 0.2, t));
  return Math.max(0, s);
}
/** a pill chip. anchor: 'c' centre, 'r' right edge at x, 'l' left edge at x. returns its width */
export function chip(g, t, t0, tOut, x, y, text, { size = 30, font = F.lab, fill = gradFire, ink = NAVY, anchor = 'c', ring = null, padX = 0.9, ltr = null, spacing = 0 } = {}) {
  const s = popS(t, t0, tOut); g.save(); g.font = font(size); if (spacing) g.letterSpacing = spacing + 'px';
  const tw = g.measureText(text).width, w = tw + size * padX * 2, h = size * 1.8;
  const cx = anchor === 'c' ? x : anchor === 'r' ? x - w / 2 : x + w / 2;
  if (s <= 0.001) { g.restore(); return w; }
  g.translate(cx, y); g.scale(s, s);
  const paint = typeof fill === 'function' ? fill(g, -w / 2, w / 2) : fill;
  if (ring) ring(g, w, h);
  shadow2(g, () => { rrc(g, 0, 0, w, h, h / 2); g.fillStyle = paint; g.fill(); });
  g.fillStyle = ink; g.textAlign = 'center'; g.textBaseline = 'alphabetic';
  g.direction = (ltr ?? !HE.test(text)) ? 'ltr' : 'rtl';
  g.fillText(text, 0, size * 0.36);
  g.restore(); return w;
}
export const gradFire = (g, x0, x1) => gradPaint(g, x1, 0, x0, 0, FIRE);

/** one line of text rising out of a mask line and sinking back into it.
 *  align 'r' -> x is the right edge, 'c' -> centre. opt.marker {t, paint, pad}: rounded block behind the line.
 *  opt.rule {color, lw}: draw the mask line itself (draws across before the text, retracts after it). */
export function riseLine(g, t, text, x, y, font, size, color, tIn, tOut, opt = {}) {
  const ruleIn = opt.rule ? tIn - 0.16 : tIn;
  if (t < ruleIn || (tOut != null && t > tOut + 0.62)) return;
  g.save(); g.font = font(size); if (opt.spacing) g.letterSpacing = opt.spacing + 'px';
  const ltr = opt.ltr ?? !HE.test(text); g.direction = ltr ? 'ltr' : 'rtl'; g.textAlign = 'left';
  const w = g.measureText(text).width, xl = opt.align === 'c' ? x - w / 2 : opt.align === 'l' ? x : x - w;
  const maskY = y + size * (opt.maskK ?? 0.3);
  if (opt.rule) {
    const a = out3(inv(ruleIn, ruleIn + 0.18, t)), b = tOut == null ? 0 : in3(inv(tOut + 0.36, tOut + 0.56, t)), pad = size * 0.3;
    const L = (w + 2 * pad) * a * (1 - b);
    if (L > 0.5) { const xr = xl + w + pad; g.beginPath(); g.moveTo(xr, maskY); g.lineTo(xr - L, maskY); g.lineCap = 'round'; g.lineWidth = opt.rule.lw || 3; g.strokeStyle = opt.rule.color; g.stroke(); }
  }
  if (t >= tIn) {
    let dy = size * 1.3 * (1 - out3(inv(tIn, tIn + 0.34, t)));
    if (tOut != null) dy += size * 1.4 * in3(inv(tOut, tOut + 0.3, t));
    g.beginPath(); g.rect(-1e4, maskY - size * 1.5, 3e4, size * 1.5 - (opt.rule ? (opt.rule.lw || 3) : 0)); g.clip();
    if (opt.marker) {
      const m = opt.marker, mt = m.t ?? tIn + 0.1, k = clamp(spring(t - mt, 16, 0.6), 0, 1.12), pad = size * (m.pad ?? 0.16);
      if (k > 0.001) { const mw = (w + 2 * pad) * k; g.fillStyle = m.paint(g, xl - pad, xl + w + pad); rr(g, xl + w + pad - mw, y + dy - size * 0.86, mw, size * 1.08, size * 0.2); g.fill(); }
    }
    g.fillStyle = color; g.fillText(text, xl, y + dy);
  }
  g.restore();
}
/** word wrap (RTL safe: measures logical strings) */
export function wrap(g, text, font, maxW) {
  g.font = font; const words = text.split(' '), lines = []; let cur = '';
  for (const w of words) { const s = cur ? cur + ' ' + w : w; if (cur && g.measureText(s).width > maxW) { lines.push(cur); cur = w; } else cur = s; }
  if (cur) lines.push(cur); return lines;
}
export function fitFont(g, text, font, size, maxW) { g.font = font(size); const w = g.measureText(text).width; return w > maxW ? size * maxW / w : size; }

/** map pin: tip at (x, y) */
export function pin(g, x, y, s, fill, dot = WHITE) {
  if (s <= 0.001) return;
  g.save(); g.translate(x, y); g.scale(s, s);
  const r = 17;
  const body = () => { g.beginPath(); g.moveTo(0, 0); g.bezierCurveTo(-6, -12, -r, -22, -r, -36); g.arc(0, -36, r, Math.PI, 0); g.bezierCurveTo(r, -22, 6, -12, 0, 0); g.closePath(); };
  shadow2(g, () => { body(); g.fillStyle = typeof fill === 'function' ? fill(g) : fill; g.fill(); }, 0.6);
  circle(g, 0, -36, 6.5); g.fillStyle = dot; g.fill();
  g.restore();
}
/** a teardrop flame. stretch > 1 leans it upward; halo = the candle's glow (allowed) */
export function flame(g, cx, cy, s, t, T, stops, { stretch = 1, lean = 0, seed = 0, halo = 1, core = HOT } = {}) {
  if (s <= 0.3) return;
  const f = (1 + 0.06 * pnoise(t, T, seed)) * stretch;
  if (halo > 0) { const r = s * 2.1; const hg = g.createRadialGradient(cx, cy, 0, cx, cy, r); hg.addColorStop(0, rgba(stops[1], 0.4 * halo)); hg.addColorStop(1, rgba(stops[1], 0)); g.fillStyle = hg; circle(g, cx, cy, r); g.fill(); }
  g.save(); g.translate(cx, cy + s * 0.4); g.transform(1, 0, lean, 1, 0, 0); g.scale(1, f); g.translate(0, -s * 0.4);
  const P = k => { g.beginPath(); g.moveTo(0, -s * k); g.bezierCurveTo(s * 0.55 * k, -s * 0.35 * k, s * 0.62 * k, s * 0.35 * k, 0, s * 0.62 * k); g.bezierCurveTo(-s * 0.62 * k, s * 0.35 * k, -s * 0.55 * k, -s * 0.35 * k, 0, -s * k); g.closePath(); };
  P(1); g.fillStyle = gradPaint(g, 0, -s, 0, s * 0.6, stops); g.fill();
  g.translate(0, s * 0.22); P(0.48); g.fillStyle = core; g.fill(); g.restore();
}
/** the pen head: a small fire dot with a radial glow that flickers with seeded (DUR-periodic) noise */
export function penDot(g, x, y, t, T, k = 1, breathe = 0) {
  if (k <= 0.01) return;
  const fl = 1 + 0.1 * pnoise(t, T, 0.7), r = (24 + 8 * breathe) * fl * k;
  const hg = g.createRadialGradient(x, y, 0, x, y, r); hg.addColorStop(0, 'rgba(255,214,120,.85)'); hg.addColorStop(0.35, 'rgba(255,143,58,.42)'); hg.addColorStop(1, 'rgba(255,143,58,0)');
  g.fillStyle = hg; circle(g, x, y, r); g.fill();
  circle(g, x, y, (6.5 + 2.2 * breathe) * k); g.fillStyle = HOT; g.fill();
}
export { lerp, inv, out3, in3, spring, clamp };
