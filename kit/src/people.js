/* =====================================================================
   YUV.AI MOTION KIT — people drawn in code (flat editorial style)
   A 2D side-view rig: poses are pure functions (phase / depth → joints),
   drawn as rounded capsules. Feet planted where the motion needs it.
   Local units ≈ metres, y up, feet on y = 0, facing +x.
   ===================================================================== */
import { clamp, lerp, mix } from './core.js';

export const BODY = { T: 0.45, S: 0.45, Tr: 0.55, N: 0.07, HR: 0.12, A1: 0.3, A2: 0.28, F: 0.16 };
const V = (x, y) => ({ x, y }), add = (a, b) => V(a.x + b.x, a.y + b.y), sc = (a, k) => V(a.x * k, a.y * k), dirD = th => V(Math.sin(th), -Math.cos(th)), dirU = th => V(Math.sin(th), Math.cos(th));
/** two-bone IK: from root to target with lengths a, b; bend = +1/-1 picks the side */
function ik(root, target, a, b, bend) {
  const dx = target.x - root.x, dy = target.y - root.y, d = clamp(Math.hypot(dx, dy), 1e-4, a + b - 1e-4), base = Math.atan2(dy, dx);
  const cosA = clamp((a * a + d * d - b * b) / (2 * a * d), -1, 1), ang = base + bend * Math.acos(cosA);
  return V(root.x + a * Math.cos(ang), root.y + a * Math.sin(ang));
}
function legFromHip(hip, th, ts) { const knee = add(hip, sc(dirD(th), BODY.T)); return { knee, ankle: add(knee, sc(dirD(ts), BODY.S)) }; }
function finish(p, lean, headLean = lean * 0.6) {
  p.neck = add(p.hip, sc(dirU(lean), BODY.Tr)); p.head = add(p.neck, sc(dirU(headLean), BODY.N + BODY.HR)); p.shoulder = add(p.neck, V(-0.01, -0.04));
  ['1', '2'].forEach(k => { if (!p['toe' + k]) p['toe' + k] = add(p['ankle' + k], V(BODY.F, 0)); });
  return p;
}
function armStraight(p, k, a, bendE = 0.15) { p['elbow' + k] = add(p.shoulder, sc(dirD(a), BODY.A1)); p['hand' + k] = add(p['elbow' + k], sc(dirD(a + bendE), BODY.A2)); }
function armTo(p, k, target, bend = -1) { p['elbow' + k] = ik(p.shoulder, target, BODY.A1, BODY.A2, bend); p['hand' + k] = target; }

/** d: 0 standing → 1 bottom of the squat. Feet planted at x = 0. */
export function poseSquat(d) {
  d = clamp(d, 0, 1); const th = 1.35 * d, ts = -0.6 * d, B = BODY;
  const hip = V(-B.S * Math.sin(ts) - B.T * Math.sin(th), B.S * Math.cos(ts) + B.T * Math.cos(th) + 0.06);
  const p = { hip }; const L = legFromHip(hip, th, ts); p.knee1 = add(L.knee, V(-0.03, 0)); p.ankle1 = add(L.ankle, V(-0.03, 0)); p.knee2 = L.knee; p.ankle2 = L.ankle;
  finish(p, 0.05 + 0.75 * d); armStraight(p, '1', 0.25 + 1.25 * d); armStraight(p, '2', 0.2 + 1.3 * d); return p;
}
/** phase 0..1 per stride (two steps). Running in place (the ground scrolls). */
export function poseRun(ph) {
  const w = ph * Math.PI * 2, p = { hip: V(0, 0.95 + 0.035 * Math.abs(Math.cos(w))) };
  [['1', w + Math.PI], ['2', w]].forEach(([k, a]) => {
    const th = 0.62 * Math.sin(a), flex = 0.25 + 1.05 * Math.max(0, Math.sin(a - 1.1)), L = legFromHip(p.hip, th, th - flex);
    p['knee' + k] = L.knee; p['ankle' + k] = L.ankle; p['toe' + k] = add(L.ankle, sc(dirD(th - flex + 1.45), BODY.F));
  });
  finish(p, 0.18);
  [['1', w], ['2', w + Math.PI]].forEach(([k, a]) => { const sh = 0.75 * Math.sin(a); p['elbow' + k] = add(p.shoulder, sc(dirD(sh), BODY.A1)); p['hand' + k] = add(p['elbow' + k], sc(dirD(sh + 1.5), BODY.A2)); });
  return p;
}
/** d: 0 arms straight (top) → 1 chest near the floor. Toes at x = 0. */
export function posePushup(d) {
  d = clamp(d, 0, 1); const B = BODY, th = 0.27 - 0.17 * d;               // body angle above horizontal
  const u = V(Math.cos(th), Math.sin(th)), ankle = V(0.04, 0.06);
  const p = { ankle1: add(ankle, V(-0.02, 0)), ankle2: ankle };
  p.knee2 = add(ankle, sc(u, B.S)); p.knee1 = add(p.knee2, V(-0.02, 0)); p.hip = add(p.knee2, sc(u, B.T));
  p.neck = add(p.hip, sc(u, B.Tr)); p.head = add(p.neck, sc(V(Math.cos(th + 0.25), Math.sin(th + 0.25)), B.N + B.HR)); p.shoulder = add(p.neck, V(-0.02, -0.02));
  p.toe1 = add(p.ankle1, V(-0.02, -0.06)); p.toe2 = add(p.ankle2, V(-0.02, -0.06));
  const hand = V(p.shoulder.x + 0.04, 0.0); armTo(p, '1', add(hand, V(-0.03, 0)), 1); armTo(p, '2', hand, 1);
  return p;
}
export function poseStand(t = 0) { const p = poseSquat(0); p.hip.y += 0.004 * Math.sin(t * 2); return p; }
/** sitting on a couch (seat height h), phone held up to the face */
export function poseSitPhone(h = 0.46, scroll = 0) {
  const p = { hip: V(0, h) }; p.knee1 = V(BODY.T - 0.03, h + 0.02); p.knee2 = V(BODY.T, h + 0.02);
  p.ankle1 = V(BODY.T - 0.06, 0.02); p.ankle2 = V(BODY.T - 0.02, 0.02); finish(p, -0.22, -0.05);
  const phone = add(p.neck, V(0.3, 0.02 + 0.01 * Math.sin(scroll))); armTo(p, '1', add(phone, V(-0.02, -0.03)), -1); armTo(p, '2', phone, -1); p.phone = phone; return p;
}
/** blend two poses joint by joint (shared-element morph between motions) */
export function blendPose(a, b, u) { const o = {}; for (const k in a) if (b[k]) o[k] = V(lerp(a[k].x, b[k].x, u), lerp(a[k].y, b[k].y, u)); return o; }

/** draw a person. ox, oy = ground point on screen; s = px per metre; f = facing (+1 right, -1 left) */
export function drawPerson(x, p, ox, oy, s, { f = 1, skin = '#E8B58E', hair = '#2A1E1A', top = '#FF8F3A', bottom = '#12163F', shoe = '#FFFFFF', hairStyle = 'pony', shade = '#12163F' } = {}) {
  const P = q => [ox + f * q.x * s, oy - q.y * s];
  const seg = (a, b, w, c) => { const [x1, y1] = P(a), [x2, y2] = P(b); x.beginPath(); x.moveTo(x1, y1); x.lineTo(x2, y2); x.lineWidth = w * s; x.strokeStyle = c; x.stroke(); };
  const far = c => mix(c, shade, 0.28);
  x.save(); x.lineCap = 'round'; x.lineJoin = 'round';
  // ground shadow
  const gx = (Math.min(p.ankle1.x, p.ankle2.x, p.hip.x) + Math.max(p.toe1.x, p.toe2.x, p.hand2 ? p.hand2.x : 0)) / 2;
  x.fillStyle = 'rgba(18,22,63,.18)'; x.beginPath(); x.ellipse(ox + f * gx * s, oy + 0.01 * s, 0.42 * s, 0.05 * s, 0, 0, Math.PI * 2); x.fill();
  // far side
  seg(p.elbow1, p.hand1, 0.075, far(skin)); seg(p.shoulder, p.elbow1, 0.09, far(top));
  seg(p.knee1, p.ankle1, 0.11, far(bottom)); seg(p.hip, p.knee1, 0.13, far(bottom)); seg(p.ankle1, p.toe1, 0.075, far(shoe));
  // torso + head
  seg(p.hip, p.neck, 0.22, top); seg(p.hip, p.hip, 0.24, bottom);
  const [hx, hy] = P(p.head), r = BODY.HR * s;
  if (hairStyle === 'pony') { const [nx, ny] = P(p.neck); x.beginPath(); x.ellipse(hx - f * r * 0.95, hy + r * 0.1, r * 0.42, r * 0.85, f * 0.5, 0, Math.PI * 2); x.fillStyle = hair; x.fill(); }
  if (hairStyle === 'bun') { x.beginPath(); x.arc(hx - f * r * 0.7, hy - r * 0.75, r * 0.45, 0, Math.PI * 2); x.fillStyle = hair; x.fill(); }
  x.beginPath(); x.arc(hx, hy, r, 0, Math.PI * 2); x.fillStyle = skin; x.fill();
  x.beginPath(); x.arc(hx - f * r * 0.12, hy - r * 0.12, r * 1.02, f > 0 ? Math.PI * 0.95 : -Math.PI * 0.05, f > 0 ? Math.PI * 2.05 : Math.PI * 1.05, f < 0); x.closePath(); x.fillStyle = hair; x.fill();
  // near side
  seg(p.hip, p.knee2, 0.13, bottom); seg(p.knee2, p.ankle2, 0.11, bottom); seg(p.ankle2, p.toe2, 0.075, shoe);
  seg(p.shoulder, p.elbow2, 0.09, top); seg(p.elbow2, p.hand2, 0.075, skin);
  x.restore();
}
