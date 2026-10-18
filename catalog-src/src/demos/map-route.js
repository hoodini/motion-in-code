// A delivery map drawn from code: streets, a route that draws itself, a courier that rides it by arc length,
// a camera that follows, and a destination pin that turns into the brand mark. Canvas 2D, a pure function of t.
import { EN, T, DIR } from '../ui/i18n.js';
import { canvas2d, C, F, fontsReady } from '../ui/canvas.js';
import { clamp, inv, io3, out3, logLerp, spring, lerp } from '../../../kit/src/core.js';

const MW = 1960, MH = 1160;
const HS = [120, 300, 480, 660, 840, 1020], VS = [150, 380, 610, 840, 1070, 1300, 1530, 1760];
const ROUTE = [[380, 300], [840, 300], [840, 480], [1070, 480], [1070, 660], [1300, 660], [1300, 840]];
const PARKS = [[400, 500, 190, 140], [1090, 140, 190, 140], [870, 680, 180, 140]];
// arc length along the route, so the courier moves at an even speed whatever the segment lengths are
const SEG = ROUTE.slice(1).map((p, i) => Math.hypot(p[0] - ROUTE[i][0], p[1] - ROUTE[i][1]));
const LEN = SEG.reduce((a, b) => a + b, 0);
function at(s) {   // point + heading at distance s along the route
  let d = clamp(s, 0, LEN);
  for (let i = 0; i < SEG.length; i++) {
    if (d <= SEG[i] || i === SEG.length - 1) { const a = ROUTE[i], b = ROUTE[i + 1], u = SEG[i] ? d / SEG[i] : 0; return [lerp(a[0], b[0], u), lerp(a[1], b[1], u), Math.atan2(b[1] - a[1], b[0] - a[0])]; }
    d -= SEG[i];
  }
}
function path(x, s0, s1) {   // the part of the route between two distances
  x.beginPath(); let d = 0, started = false;
  for (let i = 0; i < SEG.length; i++) {
    const a = ROUTE[i], b = ROUTE[i + 1], e = d + SEG[i];
    if (e >= s0 && d <= s1) {
      const u0 = clamp((s0 - d) / SEG[i]), u1 = clamp((s1 - d) / SEG[i]);
      const p0 = [lerp(a[0], b[0], u0), lerp(a[1], b[1], u0)], p1 = [lerp(a[0], b[0], u1), lerp(a[1], b[1], u1)];
      if (!started) { x.moveTo(p0[0], p0[1]); started = true; }
      x.lineTo(p1[0], p1[1]);
    }
    d = e;
  }
}

export async function mount(stage) {
  await fontsReady();
  const cv = canvas2d(stage, 960, 540);
  // the static map is drawn once into an offscreen canvas; every frame only moves the "camera" over it
  const map = document.createElement('canvas'); map.width = MW * 2; map.height = MH * 2; const m = map.getContext('2d'); m.scale(2, 2);
  m.fillStyle = '#F3F6FC'; m.fillRect(0, 0, MW, MH);
  m.fillStyle = '#BFDDFB'; m.beginPath(); m.moveTo(0, 0); for (let y = 0; y <= MH; y += 20) m.lineTo(70 + 18 * Math.sin(y / 70) + 8 * Math.sin(y / 23), y); m.lineTo(0, MH); m.fill();
  m.fillStyle = '#DCEBDD'; PARKS.forEach(([x, y, w, h]) => { m.beginPath(); m.roundRect(x, y, w, h, 28); m.fill(); });
  const road = (draw, w) => { m.lineCap = 'round'; m.strokeStyle = '#D9E1EF'; m.lineWidth = w + 6; draw(); m.stroke(); m.strokeStyle = '#FFFFFF'; m.lineWidth = w; draw(); m.stroke(); };
  HS.forEach(y => road(() => { m.beginPath(); m.moveTo(90, y); m.lineTo(MW, y); }, 26));
  VS.forEach(x => road(() => { m.beginPath(); m.moveTo(x, 0); m.lineTo(x, MH); }, 22));
  road(() => { m.beginPath(); m.moveTo(90, 960); m.lineTo(1600, 140); m.lineTo(MW, -55); }, 34);
  m.fillStyle = 'rgba(18,22,63,.42)'; m.font = F.textB(19); m.direction = DIR; m.textAlign = 'center';
  m.fillText(T('רחוב הנביאים', 'Prophets St'), 610 + 115, 300 - 18);
  m.fillText(T('שדרות הרצל', 'Herzl Blvd'), 1180, 840 - 18);
  m.save(); m.translate(560, 715); m.rotate(Math.atan2(140 - 960, MW - 90)); m.fillText(T('דרך יפו', 'Jaffa Rd'), 0, -24); m.restore();
  m.fillStyle = 'rgba(18,22,63,.35)'; m.font = F.textB(17); m.fillText(T('גן העצמאות', 'Independence Park'), 495, 578);

  const pin = (x, X, Y, s, col, label, k = 1) => {
    x.save(); x.translate(X, Y); x.scale(s, s);
    x.fillStyle = 'rgba(18,22,63,.18)'; x.beginPath(); x.ellipse(0, 4, 14, 5, 0, 0, Math.PI * 2); x.fill();
    x.fillStyle = col; x.beginPath(); x.moveTo(0, 0); x.bezierCurveTo(-6, -14, -20, -22, -20, -40); x.arc(0, -40, 20, Math.PI, 0); x.bezierCurveTo(20, -22, 6, -14, 0, 0); x.fill();
    x.fillStyle = '#fff'; x.beginPath(); x.arc(0, -40, 8 * k, 0, Math.PI * 2); x.fill();
    if (label) { x.font = F.textB(18); x.direction = DIR; x.textAlign = 'center'; const w = x.measureText(label).width + 26; x.fillStyle = C.navy; x.beginPath(); x.roundRect(-w / 2, -96, w, 34, 17); x.fill(); x.fillStyle = '#fff'; x.fillText(label, 0, -73); }
    x.restore();
  };

  const render = t => {
    const { x, W, H } = cv;
    // camera: overview → follow the courier → pull back to the destination. Zoom moves in log space so it feels even.
    const s0 = io3(inv(3.4, 8.0, t)) * LEN, [cx, cy, hd] = at(s0);
    const zIn = io3(inv(2.6, 3.4, t)), zOut = io3(inv(8.0, 8.8, t));
    const zoom = t < 2.6 ? 0.55 : t < 8.0 ? logLerp(0.55, 1.35, zIn) : logLerp(1.35, 0.95, zOut);
    const start = ROUTE[0], end = ROUTE[ROUTE.length - 1], mid = [840, 520];
    let fx, fy;
    if (t < 3.4) { const u = zIn; fx = lerp(mid[0], start[0], u); fy = lerp(mid[1], start[1], u); }
    else if (t < 8.0) { fx = cx; fy = cy; }
    else { fx = lerp(end[0], end[0], zOut); fy = lerp(end[1], end[1] - 60, zOut); }
    x.save(); x.fillStyle = '#F3F6FC'; x.fillRect(0, 0, W, H);
    x.translate(W / 2, H / 2); x.scale(zoom, zoom); x.translate(-fx, -fy);
    x.drawImage(map, 0, 0, MW, MH);
    // the route draws itself start → end, then the travelled part turns to fire
    const drawn = io3(inv(1.2, 2.6, t)) * LEN;
    x.lineCap = 'round'; x.lineJoin = 'round';
    x.strokeStyle = 'rgba(18,22,63,.85)'; x.lineWidth = 9; x.setLineDash([2, 16]); path(x, s0, drawn); x.stroke(); x.setLineDash([]);
    if (s0 > 0) { const g = x.createLinearGradient(start[0], start[1], end[0], end[1]); g.addColorStop(0, C.gold); g.addColorStop(0.5, C.orange); g.addColorStop(1, C.coral); x.strokeStyle = g; x.lineWidth = 11; path(x, 0, s0); x.stroke(); }
    // pins pop in on springs
    pin(x, start[0], start[1], clamp(spring(t - 0.3, 14, 0.55), 0, 1.3), C.navy, T('המסעדה', 'Restaurant'));
    const land = t > 8.0 ? 1 + 0.18 * Math.sin(Math.min(1, (t - 8.0) / 0.35) * Math.PI) * Math.exp(-(t - 8.0) * 3) : 1;
    const morph = out3(inv(8.8, 9.5, t));
    if (morph < 1) pin(x, end[0], end[1], clamp(spring(t - 0.6, 14, 0.55), 0, 1.3) * land, C.coral, morph > 0 ? '' : T('הבית', 'Home'), 1 - morph);
    // the courier: a navy chip that rides the route and turns with it
    if (t >= 2.6 && t < 8.9) {
      const k = clamp(spring(t - 2.6, 16, 0.6), 0, 1.2) * (1 - out3(inv(8.4, 8.9, t)));
      x.save(); x.translate(cx, cy); x.rotate(hd); x.scale(k, k);
      x.fillStyle = 'rgba(18,22,63,.25)'; x.beginPath(); x.ellipse(0, 6, 22, 9, 0, 0, Math.PI * 2); x.fill();
      x.fillStyle = C.navy; x.beginPath(); x.roundRect(-20, -15, 40, 30, 15); x.fill();
      x.fillStyle = C.orange; x.beginPath(); x.moveTo(20, 0); x.lineTo(8, -8); x.lineTo(8, 8); x.fill();
      x.restore();
    }
    // the pin's head grows into the brand mark: a fire disc with a check, born from the pin, not faded in
    if (morph > 0) {
      const r = lerp(20, 54, morph), yy = end[1] - lerp(40, 70, morph);
      const g = x.createLinearGradient(end[0] - r, yy - r, end[0] + r, yy + r); g.addColorStop(0, C.gold); g.addColorStop(0.5, C.orange); g.addColorStop(1, C.coral);
      x.fillStyle = g; x.beginPath(); x.arc(end[0], yy, r, 0, Math.PI * 2); x.fill();
      const c = out3(inv(9.3, 9.8, t)); x.strokeStyle = C.navy; x.lineWidth = 9; x.lineCap = 'round'; x.lineJoin = 'round';
      x.beginPath(); const pts = [[-20, 2], [-6, 16], [22, -14]]; x.moveTo(end[0] + pts[0][0], yy + pts[0][1]);
      if (c > 0) { const L1 = Math.hypot(14, 14), L2 = Math.hypot(28, 30), d = c * (L1 + L2); if (d <= L1) x.lineTo(end[0] - 20 + 14 * d / L1, yy + 2 + 14 * d / L1); else { x.lineTo(end[0] - 6, yy + 16); const u = (d - L1) / L2; x.lineTo(end[0] - 6 + 28 * u, yy + 16 - 30 * u); } x.stroke(); }
    }
    x.restore();
    // ETA chip: screen space, so it stays put while the map moves
    const eta = Math.max(0, Math.ceil(12 * (1 - s0 / LEN)));
    const chip = t < 2.6 ? 0 : clamp(spring(t - 2.6, 14, 0.6), 0, 1.15);
    if (chip > 0) {
      const txt = s0 >= LEN ? T('הגיע ✓', 'Arrived ✓') : T(`עוד ${eta} דק׳`, `${eta} min away`);
      x.save(); x.translate(W / 2, 54); x.scale(chip, chip); x.font = F.textB(24); x.direction = DIR; x.textAlign = 'center';
      const w = x.measureText(txt).width + 48; x.fillStyle = s0 >= LEN ? C.orange : C.navy; x.beginPath(); x.roundRect(-w / 2, -24, w, 48, 24); x.fill();
      x.fillStyle = s0 >= LEN ? C.navy : '#fff'; x.fillText(txt, 0, 9); x.restore();
    }
  };
  return { dur: 10, render, resize: () => cv.fit(), poster: 6 };
}
