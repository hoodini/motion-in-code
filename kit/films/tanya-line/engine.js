/* =====================================================================
   tanya-line · ENGINE — the one-line engine. Pure functions of their inputs.
   arc-length resampling · Bezier/arc path sampler · closed-form morph springs ·
   alignment (direction + cyclic offset) · polyline drawing with ink cooling ·
   orthographic globe with horizon clipping · great-circle routes.
   ===================================================================== */
import { clamp, lerp, inv } from '../../src/core.js';

/* ---------- arc length ---------- */
export function cumLen(P) {
  const n = P.length / 2, C = new Float64Array(n);
  for (let i = 1; i < n; i++) C[i] = C[i - 1] + Math.hypot(P[2 * i] - P[2 * i - 2], P[2 * i + 1] - P[2 * i - 1]);
  return C;
}
/** index (float) at arc length s: binary search for the segment, linear inside it */
export function idxAt(C, s) {
  const n = C.length; if (s <= 0) return 0; if (s >= C[n - 1]) return n - 1;
  let a = 0, b = n - 1;
  while (b - a > 1) { const m = (a + b) >> 1; if (C[m] <= s) a = m; else b = m; }
  const d = C[b] - C[a]; return a + (d > 0 ? (s - C[a]) / d : 0);
}
export function ptAt(P, f) { const i = Math.floor(f), u = f - i, n = P.length / 2; if (i >= n - 1) return [P[2 * n - 2], P[2 * n - 1]]; return [lerp(P[2 * i], P[2 * i + 2], u), lerp(P[2 * i + 1], P[2 * i + 3], u)]; }
/** resample a flat polyline to n points equally spaced by arc length */
export function resample(P, n) {
  const C = cumLen(P), L = C[C.length - 1], out = new Float32Array(2 * n);
  for (let k = 0; k < n; k++) { const [x, y] = ptAt(P, idxAt(C, L * k / (n - 1))); out[2 * k] = x; out[2 * k + 1] = y; }
  return out;
}

/* ---------- path sampler: cubic Beziers / lines / arcs, >= 20 samples per segment ---------- */
export class Path {
  constructor(x, y) { this.p = [x, y]; this.x = x; this.y = y; }
  L(x, y, n = 20) { for (let k = 1; k <= n; k++) this.p.push(lerp(this.x, x, k / n), lerp(this.y, y, k / n)); this.x = x; this.y = y; return this; }
  C(x1, y1, x2, y2, x, y, n = 24) {
    const x0 = this.x, y0 = this.y;
    for (let k = 1; k <= n; k++) { const t = k / n, a = (1 - t) ** 3, b = 3 * (1 - t) ** 2 * t, c = 3 * (1 - t) * t * t, d = t ** 3; this.p.push(a * x0 + b * x1 + c * x2 + d * x, a * y0 + b * y1 + c * y2 + d * y); }
    this.x = x; this.y = y; return this;
  }
  A(cx, cy, r, a0, a1, n = 24) { for (let k = 1; k <= n; k++) { const a = lerp(a0, a1, k / n); this.p.push(cx + r * Math.cos(a), cy + r * Math.sin(a)); } this.x = cx + r * Math.cos(a1); this.y = cy + r * Math.sin(a1); return this; }
  done(n) { return resample(new Float32Array(this.p), n); }
}
/** rounded rect loop that starts at (sx,sy) on its top edge and runs clockwise back to it */
export function rrLoop(path, x0, y0, x1, y1, r) {
  const H = Math.PI / 2;
  path.L(x1 - r, y0).A(x1 - r, y0 + r, r, -H, 0).L(x1, y1 - r).A(x1 - r, y1 - r, r, 0, H).L(x0 + r, y1).A(x0 + r, y1 - r, r, H, 2 * H).L(x0, y0 + r).A(x0 + r, y0 + r, r, 2 * H, 3 * H);
  return path;
}

/* ---------- morph spring (f = 1.3 Hz, zeta = 0.8), closed form ---------- */
const MW = 2 * Math.PI * 1.3, MZ = 0.8, MWD = MW * Math.sqrt(1 - MZ * MZ);
export function mspring(tau) { if (tau <= 0) return 0; if (tau > 3) return 1; return 1 - Math.exp(-MZ * MW * tau) * (Math.cos(MWD * tau) + (MZ * MW / MWD) * Math.sin(MWD * tau)); }
/** critically damped step (camera moves, handoffs) */
export function crit(tau, w = 12) { if (tau <= 0) return 0; return 1 - Math.exp(-w * tau) * (1 + w * tau); }

/* ---------- alignment: direction and (closed) cyclic offset with the smallest sum |A_i - B_i|^2 ---------- */
export function natIdx(perm, i, N) { const j = perm.dir ? N - 1 - i : i; return perm.closed ? (j + perm.off) % N : j; }
export function align(A, B, closed, N) {
  let best = { dir: 0, off: 0, closed, cost: Infinity };
  const offs = closed ? 64 : 1;
  for (let dir = 0; dir < 2; dir++) for (let k = 0; k < offs; k++) {
    const perm = { dir, off: Math.round(k * N / offs) % N, closed }; let c = 0;
    for (let i = 0; i < N; i += 4) { const j = natIdx(perm, i, N); const dx = A[2 * i] - B[2 * j], dy = A[2 * i + 1] - B[2 * j + 1]; c += dx * dx + dy * dy; }
    if (c < best.cost) best = { ...perm, cost: c };
  }
  return best;
}
export function canon(B, perm, N, out) {
  out = out || new Float32Array(2 * N);
  for (let i = 0; i < N; i++) { const j = natIdx(perm, i, N); out[2 * i] = B[2 * j]; out[2 * i + 1] = B[2 * j + 1]; }
  return out;
}

/* ---------- drawing a polyline: [i0, i1] float index range, colour per chunk, optional hot tip ---------- */
export function strokeLine(g, P, i0, i1, colorAt, lw, chunk = 24) {
  const n = P.length / 2; i1 = Math.min(i1, n - 1); if (i1 - i0 < 0.01) return;
  g.lineCap = 'round'; g.lineJoin = 'round'; g.lineWidth = lw;
  let col = null, a = i0;
  g.beginPath(); const [x0, y0] = ptAt(P, i0); g.moveTo(x0, y0);
  while (a < i1 - 1e-6) {
    const b = Math.min((Math.floor(a / chunk) + 1) * chunk, i1), c = colorAt((a + b) / 2);
    if (col !== null && c !== col) { g.stroke(); g.beginPath(); const [px, py] = ptAt(P, a); g.moveTo(px, py); }
    g.strokeStyle = c; col = c;
    for (let i = Math.floor(a) + 1; i < b; i++) g.lineTo(P[2 * i], P[2 * i + 1]);
    const [bx, by] = ptAt(P, b); g.lineTo(bx, by); a = b;
  }
  g.stroke();
}/** the newest ink: the last `len` px behind the head drawn 1.6x wider, graded cool -> hot */
export function hotTip(g, P, C, iHead, len, lw, cool, hot, mixFn) {
  const sH = C[Math.floor(iHead)] + (iHead % 1) * ((C[Math.min(C.length - 1, Math.floor(iHead) + 1)] - C[Math.floor(iHead)]) || 0);
  const K = 10; g.lineCap = 'round'; g.lineJoin = 'round'; g.lineWidth = lw * 1.6;
  for (let k = 0; k < K; k++) {
    const s0 = sH - len * (1 - k / K), s1 = sH - len * (1 - (k + 1) / K); if (s1 <= 0) continue;
    const a = idxAt(C, Math.max(0, s0)), b = idxAt(C, s1);
    g.beginPath(); g.strokeStyle = mixFn(cool, hot, (k + 1) / K);
    const [x0, y0] = ptAt(P, a); g.moveTo(x0, y0);
    for (let i = Math.ceil(a); i < b; i++) g.lineTo(P[2 * i], P[2 * i + 1]);
    const [x1, y1] = ptAt(P, b); g.lineTo(x1, y1); g.stroke();
  }
}

/* ---------- globe: orthographic, horizon-clipped ---------- */
const D2R = Math.PI / 180;
/** unit vectors for lon/lat flat arrays (precomputed once) */
export function toUnit(LL) { const n = LL.length / 2, U = new Float32Array(3 * n); for (let i = 0; i < n; i++) { const l = LL[2 * i] * D2R, p = LL[2 * i + 1] * D2R; U[3 * i] = Math.cos(p) * Math.cos(l); U[3 * i + 1] = Math.cos(p) * Math.sin(l); U[3 * i + 2] = Math.sin(p); } return U; }
/** view basis for centre (l0, p0): returns fn(x,y,z) -> [X right, Y up, Z toward viewer] */
export function viewOf(l0, p0) {
  l0 *= D2R; p0 *= D2R; const cl = Math.cos(l0), sl = Math.sin(l0), cp = Math.cos(p0), sp = Math.sin(p0);
  // X = cosφ sin(λ-λ0), Y = cosφ0 sinφ - sinφ0 cosφ cos(λ-λ0), Z = sinφ0 sinφ + cosφ0 cosφ cos(λ-λ0)
  return (x, y, z) => { const cc = x * cl + y * sl, ss = y * cl - x * sl; return [ss, cp * z - sp * cc, sp * z + cp * cc]; };
}
export function projLL(lon, lat, V, R, cx, cy) { const l = lon * D2R, p = lat * D2R; const [X, Y, Z] = V(Math.cos(p) * Math.cos(l), Math.cos(p) * Math.sin(l), Math.sin(p)); return [cx + R * X, cy - R * Y, Z]; }
/** draw a unit-vector polyline up to fraction f of its length; split where visibility flips and end on the limb */
export function globeLine(g, U, cum, f, V, R, cx, cy) {
  const n = U.length / 3; if (n < 2 || f <= 0) return;
  const sEnd = cum[n - 1] * Math.min(1, f);
  let prev = null, pen = false;
  g.beginPath();
  for (let i = 0; i < n; i++) {
    let x = U[3 * i], y = U[3 * i + 1], z = U[3 * i + 2];
    if (cum[i] > sEnd) { // partial last segment
      const u = (sEnd - cum[i - 1]) / ((cum[i] - cum[i - 1]) || 1);
      x = lerp(U[3 * i - 3], x, u); y = lerp(U[3 * i - 2], y, u); z = lerp(U[3 * i - 1], z, u);
    }
    const v = V(x, y, z);
    if (prev) {
      const va = prev[2] > 0, vb = v[2] > 0;
      if (va && vb) g.lineTo(cx + R * v[0], cy - R * v[1]);
      else if (va !== vb) {
        const u = prev[2] / (prev[2] - v[2]); let X = lerp(prev[0], v[0], u), Y = lerp(prev[1], v[1], u); const m = Math.hypot(X, Y) || 1; X /= m; Y /= m;
        if (va) g.lineTo(cx + R * X, cy - R * Y); else { g.moveTo(cx + R * X, cy - R * Y); g.lineTo(cx + R * v[0], cy - R * v[1]); }
      }
    } else if (v[2] > 0) g.moveTo(cx + R * v[0], cy - R * v[1]);
    prev = v;
    if (cum[i] > sEnd) break;
  }
  g.stroke();
}
export function unitCum(U) { const n = U.length / 3, C = new Float64Array(n); for (let i = 1; i < n; i++) C[i] = C[i - 1] + Math.hypot(U[3 * i] - U[3 * i - 3], U[3 * i + 1] - U[3 * i - 2], U[3 * i + 2] - U[3 * i - 1]); return C; }
/** great circle between two lon/lat points as unit vectors (slerp), n samples */
export function greatCircle(a, b, n = 96) {
  const [A] = [toUnit(new Float32Array(a))], [Bv] = [toUnit(new Float32Array(b))];
  const dot = clamp(A[0] * Bv[0] + A[1] * Bv[1] + A[2] * Bv[2], -1, 1), om = Math.acos(dot), U = new Float32Array(3 * n);
  for (let k = 0; k < n; k++) { const t = k / (n - 1), s1 = Math.sin((1 - t) * om) / Math.sin(om), s2 = Math.sin(t * om) / Math.sin(om); for (let c = 0; c < 3; c++) U[3 * k + c] = s1 * A[c] + s2 * Bv[c]; }
  return U;
}

/* ---------- seeded, DUR-periodic noise (so the last frame matches frame 0) ---------- */
export function pnoise(t, T, seed = 0) {
  const w = 2 * Math.PI / T;
  return 0.5 * Math.sin(w * 331 * t + 1.3 + seed) + 0.3 * Math.sin(w * 547 * t + 4.1 + 2 * seed) + 0.2 * Math.sin(w * 829 * t + 2.2 + 3 * seed);
}
export { inv };
