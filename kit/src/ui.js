/* =====================================================================
   YUV.AI MOTION KIT — 2D UI primitives (canvas, pure functions of t)
   cards with real radius and depth · an input box that types · a cursor
   that clicks · a button that becomes something else · counters.
   ===================================================================== */
import { clamp, lerp, inv, out3, in3, spring, sk, rr, rrc, circle, rgba, gradPaint, markerPaint } from './core.js';

/** a premium card: generous radius, layered shadow (contact + ambient), optional top rim light */
export function card(x, cx, cy, w, h, r, { fill = '#FFFFFF', shadow = 'rgba(5,8,30,.55)', depth = 1, rim = null, stroke = null, strokeW = 2 } = {}) {
  if (w <= 0.5 || h <= 0.5) return;
  x.save();
  if (depth > 0) { // ambient (big, soft, offset down) then contact (tight)
    x.shadowColor = shadow; x.shadowBlur = 80 * depth; x.shadowOffsetY = 36 * depth; rrc(x, cx, cy, w, h, r); x.fillStyle = fill; x.fill();
    x.shadowBlur = 18 * depth; x.shadowOffsetY = 6 * depth; x.fill();
    x.shadowColor = 'transparent';
  } else { rrc(x, cx, cy, w, h, r); x.fillStyle = fill; x.fill(); }
  if (rim) { x.save(); rrc(x, cx, cy, w, h, r); x.clip(); x.fillStyle = gradPaint(x, 0, cy - h / 2, 0, cy - h / 2 + Math.min(80, h * 0.4), [rim, 'rgba(255,255,255,0)']); x.fillRect(cx - w / 2, cy - h / 2, w, Math.min(80, h * 0.4)); x.restore(); }
  if (stroke) { rrc(x, cx, cy, w, h, r); x.lineWidth = strokeW; x.strokeStyle = stroke; x.stroke(); }
  x.restore();
}

/** typed text: how many characters (code points) are visible at time t */
export function typedCount(text, t, t0, perChar) { return clamp(Math.floor((t - t0) / perChar) + 1, 0, Array.from(text).length); }
export function typedText(text, t, t0, perChar) { return Array.from(text).slice(0, typedCount(text, t, t0, perChar)).join(''); }
export function charTimes(text, t0, perChar) { return Array.from(text).map((_, i) => t0 + i * perChar); }

/** squash on press, spring back on release */
export function press(t, tDown, tUp, depth = 0.86) { return sk(t, [[-1, 1], [tDown, depth], [tUp, 1]], 34, 0.62); }

/** macOS-style arrow cursor; tip at (X, Y) */
export function cursor(x, X, Y, s = 1, fill = '#0B0B10', stroke = '#FFFFFF') {
  x.save(); x.translate(X, Y); x.scale(s, s); x.beginPath(); x.moveTo(0, 0); x.lineTo(0, 44); x.lineTo(11, 34); x.lineTo(20, 53); x.lineTo(28, 50); x.lineTo(19, 31); x.lineTo(34, 31); x.closePath();
  x.shadowColor = 'rgba(0,0,0,.35)'; x.shadowBlur = 10; x.shadowOffsetY = 4;
  x.lineJoin = 'round'; x.lineWidth = 3.4; x.strokeStyle = stroke; x.stroke(); x.shadowColor = 'transparent'; x.fillStyle = fill; x.fill(); x.restore();
}
/** click ripple: a ring that expands and thins out from the click point */
export function clickRing(x, X, Y, t, tc, color, R = 70) { const q = inv(tc, tc + 0.42, t); if (q <= 0 || q >= 1) return; circle(x, X, Y, 10 + R * out3(q)); x.lineWidth = 9 * (1 - q); x.strokeStyle = color; x.stroke(); }

/** a "send" arrow pointing left (Hebrew UI), centred at (cx, cy) */
export function arrowLeft(x, cx, cy, s, color) {
  x.save(); x.translate(cx, cy); x.scale(s, s); x.lineCap = 'round'; x.lineJoin = 'round'; x.lineWidth = 7; x.strokeStyle = color;
  x.beginPath(); x.moveTo(16, 0); x.lineTo(-16, 0); x.moveTo(-3, -13); x.lineTo(-16, 0); x.lineTo(-3, 13); x.stroke(); x.restore();
}

/** counter that springs from a to b (with a tiny overshoot clamped away) */
export function countUp(t, t0, a, b, w = 7) { return Math.round(lerp(a, b, clamp(spring(t - t0, w, 1)))); }

/** bars that grow on given times, fire gradient fill. values 0..1 */
export function bars(x, t, X, Y, W, H, values, times, paint, gap = 0.28, r = 14) {
  const n = values.length, bw = W / (n + (n - 1) * gap);
  values.forEach((v, i) => { const s = spring(t - times[i], 13, 0.72); if (s <= 0) return; const bh = H * v * s; rr(x, X + i * bw * (1 + gap), Y - bh, bw, bh, Math.min(r, bh / 2, bw / 2)); x.fillStyle = paint; x.fill(); });
}
export { rgba };

/* ===================== neon + kinetic type (v2) ===================== */
export const SPECTRUM = ['#5DE4E9', '#4FA3FF', '#8B6CFF', '#FF66C4', '#FF8F3A', '#FFC74E', '#5DE4E9'];   // retired v2 order
/** Phoenix Ink glow (the CTA ring on yuv.ai): the default for neon rings and chips */
export const GLOW = ['#FF2EA0', '#FF8F3A', '#FFC74E', '#8B6CFF', '#5DE4E9', '#FF2EA0'];
/** a glowing neon edge around a rounded rect: rotating conic gradient, blurred halo + crisp line.
 *  angle rotates the colours; power scales the halo (pulse it on beats). */
export function neonRing(x, cx, cy, w, h, r, angle, { lw = 4, glow = 22, stops = GLOW, power = 1 } = {}) {
  if (w <= 1 || h <= 1) return;
  const g = x.createConicGradient(angle, cx, cy); stops.forEach((c, i) => g.addColorStop(i / (stops.length - 1), c));
  x.save(); x.strokeStyle = g;
  x.filter = `blur(${glow * power}px)`; x.lineWidth = lw * 5 * power; rrc(x, cx, cy, w, h, r); x.stroke();
  x.filter = `blur(${glow * 0.35 * power}px)`; x.lineWidth = lw * 2.2; rrc(x, cx, cy, w, h, r); x.stroke();
  x.filter = 'none'; x.lineWidth = lw; rrc(x, cx, cy, w, h, r); x.stroke();
  x.restore();
}
/** words SLAM in: each one lands with a visible spring (scale overshoot + drop), on its own time.
 *  RTL by default, anchored at opt.right (or centred at cx). exit: shrink into its baseline. */
export function slamWords(x, t, words, cx, y, size, fontFn, color, times, tOut, opt = {}) {
  if (t < Math.min(...times)) return;
  if (tOut != null && t > tOut + 0.3) return;
  x.save(); x.font = fontFn(size); x.direction = opt.ltr ? 'ltr' : 'rtl'; if (opt.spacing) x.letterSpacing = opt.spacing;
  if (opt.maxW) { const tot0 = words.map(w => x.measureText(w).width).reduce((a, b) => a + b, 0) + size * (opt.gap ?? 0.3) * (words.length - 1); if (tot0 > opt.maxW) { size *= opt.maxW / tot0; x.font = fontFn(size); } }
  const gap = size * (opt.gap ?? 0.3), ws = words.map(w => x.measureText(w).width), total = ws.reduce((a, b) => a + b, 0) + gap * (words.length - 1);
  if (opt.right != null) cx = opt.right - total / 2;
  let pos = opt.ltr ? cx - total / 2 : cx + total / 2;
  const w0 = opt.w ?? 24, z0 = opt.z ?? 0.42, from = opt.from ?? 1.55;
  words.forEach((w, i) => {
    const ti = times[i], xl = opt.ltr ? pos : pos - ws[i];
    if (t >= ti) {
      const s = spring(t - ti, w0, z0), out = tOut == null ? 0 : in3(inv(tOut + i * 0.02, tOut + 0.17 + i * 0.02, t));
      const sc = (1 + (from - 1) * (1 - s)) * (1 - out), dy = (1 - s) * size * 0.32 + out * size * 0.2, rot = (1 - s) * (opt.rot ?? -0.05);
      if (sc > 0.001) {
        x.save(); x.translate(xl + ws[i] / 2, y - size * 0.34 + dy); x.rotate(rot); x.scale(sc, sc); x.translate(-(xl + ws[i] / 2), -(y - size * 0.34));
        if (opt.marker && opt.marker.i === i) { const m = spring(t - ti - 0.05, 16, 0.6); x.fillStyle = markerPaint(x, opt.marker.paint, y - size * 0.8, size * 0.98); rr(x, xl - size * 0.14, y - size * 0.8, (ws[i] + size * 0.28) * clamp(m, 0, 1.2), size * 0.98, size * 0.16); x.fill(); }
        x.fillStyle = opt.colors ? opt.colors[i] : color; x.textAlign = 'left'; x.fillText(w, xl, y);
        x.restore();
      }
    }
    pos += opt.ltr ? ws[i] + gap : -(ws[i] + gap);
  });
  x.restore();
}
/** RTL typing where every character pops in on its own spring. xr = right edge of the text. returns caret x. */
export function popType(x, t, text, xr, y, fontFn, size, color, times, opt = {}) {
  // RTL (default): xr is the right edge and letters are laid out leftwards. LTR (opt.ltr): xr is the LEFT edge.
  const ch = Array.from(text); x.save(); x.font = fontFn(size); x.direction = opt.ltr ? 'ltr' : 'rtl'; x.textAlign = 'left'; x.fillStyle = color;
  let caret = xr, acc = '';
  ch.forEach((c, i) => {
    const prevW = x.measureText(acc).width; acc += c; const wTot = x.measureText(acc).width, left = opt.ltr ? xr + prevW : xr - wTot, cw = wTot - prevW;
    if (t < times[i]) return; caret = opt.ltr ? xr + wTot : left;
    if (c === ' ') return;
    const s = spring(t - times[i], 28, 0.42), sc = 0.15 + 0.85 * s;
    x.save(); x.translate(left + cw / 2, y - size * 0.3); x.scale(sc, sc); x.translate(-(left + cw / 2), -(y - size * 0.3));
    x.fillText(c, left, y + (1 - s) * size * 0.25); x.restore();
  });
  x.restore(); return caret;
}
/** a pill chip with a neon edge that pops in on a spring */
export function neonChip(x, t, t0, cx, cy, text, { size = 30, fontFn, fill = '#FFFFFF', ink = '#1C1A4B', angle = 0, padX = 30 } = {}) {
  const s = spring(t - t0, 18, 0.5); if (s <= 0.001) return;
  x.save(); x.font = fontFn(size); const tw = x.measureText(text).width, w = tw + padX * 2, h = size * 1.9;
  x.translate(cx, cy); x.scale(s, s);
  neonRing(x, 0, 0, w, h, h / 2, angle, { lw: 3, glow: 12 });
  rrc(x, 0, 0, w, h, h / 2); x.fillStyle = fill; x.fill();
  x.fillStyle = ink; x.textAlign = 'center'; x.direction = /[֐-׿]/.test(text) ? 'rtl' : 'ltr'; x.fillText(text, 0, size * 0.36);
  x.restore();
}
