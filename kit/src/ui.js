/* =====================================================================
   YUV.AI MOTION KIT — 2D UI primitives (canvas, pure functions of t)
   cards with real radius and depth · an input box that types · a cursor
   that clicks · a button that becomes something else · counters.
   ===================================================================== */
import { clamp, lerp, inv, out3, spring, sk, rr, rrc, circle, rgba, gradPaint } from './core.js';

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
