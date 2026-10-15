/* =====================================================================
   YUV.AI MOTION — launch film.  "כל נושא. סרטון השקה."
   The product: a tool that turns any topic into a launch film. The film
   shows off everything the method can do, in one unbroken shot:
   I    neon prompt box in a bright day sky · 16th-note typing, camera on the caret · chips · click
   II   drop: the button bursts into a card → it lands in a 3D carousel of six "scenes" that snaps on the beat
   III  the carousel explodes · an iPhone and a MacBook rise · the lid opens on the beat · camera orbits
   IV   crane out over the sea while the sky time-lapses from day to phoenix sunset
   V    neon glass stat cards pop on the beat, merge into one pill
   VI   the pill becomes the ring around the phoenix · logo · tagline · CTA
   68 beats @ 129.723 BPM (Mixkit "Cat Walk"), song drop on film beat 16.
   ===================================================================== */
import { clamp, lerp, inv, out3, in3, io3, logLerp, spring, sk, clock, rgba, BRAND, FT, rr, rrc, circle, coverR, riseWords, gradPaint, mountFilm } from '../../src/core.js';
import { card, charTimes, press, cursor, clickRing, arrowLeft, countUp, bars, neonRing, slamWords, popType, neonChip, SPECTRUM } from '../../src/ui.js';
import { THREE, makeRenderer, makePhone, makeLaptop, makeCard3D, makeTodWorld, projectPx } from '../../src/world.js';
import LOGO_URL from '../../brand/logo-square-transparent.png';

const clk = clock(129.723), { B, bt } = clk;
const NB = 68, DUR = NB * B + 1.2;
const Q = new URLSearchParams(location.search);
const NAVY = BRAND.navy, NAVY2 = BRAND.navy2, W = '#FFFFFF', FIRE = BRAND.fire, DENIM = BRAND.denim, CLOUD = BRAND.cloud;
const TAU = Math.PI * 2, D2R = Math.PI / 180;
const beatPulse = t => Math.exp(-((t % B) / B) * 5);              // 1 on every beat, decays before the next (pure)

const LAYOUTS = {
  h: { name: 'h', W: 1920, H: 1080, cx: 960, cy: 600, right: 1800, inputW: 1100, inputH: 136, zType: 2.3, zClick: 1.0, fov: 34,
       head1: 230, head2: 385, headS: 150, chipY: 770, chipDX: 270, titleY: 990, titleS: 128, devPhone: [-0.85, 0.8, 0.55], devLap: [0.6, 0.12, 0.1], orbitR: 4.7, camD: 3.72,
       stat: { y: 560, w: 390, h: 330, xs: [1560, 1150, 740, 330] }, logoY: 360, logoS: 320, wordY: 760, tagY: 900, hudY: 1046 },
  v: { name: 'v', W: 1080, H: 1920, cx: 540, cy: 1000, right: 1010, inputW: 960, inputH: 132, zType: 1.9, zClick: 0.98, fov: 44,
       head1: 560, head2: 700, headS: 136, chipY: 1210, chipDX: 0, titleY: 330, titleS: 132, devPhone: [-0.32, 1.15, 0.6], devLap: [0.22, 0.2, 0.0], orbitR: 5.8, camD: 3.87,
       stat: { w: 440, h: 360, pos: [[770, 760], [310, 760], [770, 1180], [310, 1180]] }, logoY: 700, logoS: 400, wordY: 1150, tagY: 1300, hudY: 1862 }
};

/* ---------------- canvases that live on 3D surfaces (and are drawn by 2D cards at handoff) ---------------- */
const PH = { w: 0.76, h: 1.58, d: 0.085, r: 0.125, bezel: 0.03 }, PSW = PH.w - 2 * PH.bezel, PSH = PH.h - 2 * PH.bezel;
const UIW = 600, UIH = Math.round(UIW * PSH / PSW);
const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
const phoneCv = mk(UIW, UIH), lapCv = mk(960, 598);
const CARD = { w: 1.0, h: 1.25, r: 0.08 }, CW = 512, CH = 640;
const cardCv = [0, 1, 2, 3, 4, 5].map(() => mk(CW, CH));
const CARD_NAMES = ['טיפוגרפיה', 'גרפים', 'מכשירים', 'קוד', 'צבע', 'סאונד'];
let LOGO = null;

function cardArt(i, t) {
  const g = cardCv[i].getContext('2d'), w = CW, h = CH; g.setTransform(1, 0, 0, 1, 0, 0);
  const bgs = [NAVY, CLOUD, null, BRAND.navy3 || '#0B0E2A', W, null];
  if (i === 2) g.fillStyle = gradPaint(g, 0, 0, 0, h, ['#5EA9F2', '#BDE1FF']); else if (i === 5) g.fillStyle = gradPaint(g, 0, 0, w, h, FIRE); else g.fillStyle = bgs[i];
  g.fillRect(0, 0, w, h);
  const lt = t - bt(16);                                  // card-local time
  const ink = (i === 1 || i === 4 || i === 5) ? NAVY : W;
  if (i === 0) {           // typography
    g.font = FT.he(230); g.direction = 'rtl'; g.textAlign = 'right'; g.fillStyle = W; g.fillText('אב', w - 46, 300);
    g.fillStyle = gradPaint(g, 46, 0, w - 46, 0, FIRE); rr(g, 46, 352, w - 92, 92, 46); g.fill();
    g.font = FT.he(58); g.fillStyle = NAVY; g.fillText('כותרת.', w - 90, 418);
  } else if (i === 1) {    // charts
    bars(g, t, 50, 470, w - 100, 260, [0.35, 0.55, 0.45, 0.75, 1, 0.82], [0, 1, 2, 3, 4, 5].map(k => bt(18.3) + k * bt(0.25)), gradPaint(g, 0, 470, 0, 210, FIRE), 0.3, 14);
    g.font = FT.en(96); g.direction = 'ltr'; g.textAlign = 'right'; g.fillStyle = NAVY; g.fillText(countUp(t, bt(18.2), 0, 248) + 'K', w - 46, 130);
  } else if (i === 2) {    // devices
    card(g, w / 2, 250, 170, 340, 34, { fill: NAVY, depth: 0 }); rrc(g, w / 2, 112, 60, 16, 8); g.fillStyle = '#000'; g.fill();
    g.fillStyle = gradPaint(g, w / 2 - 60, 0, w / 2 + 60, 0, FIRE); rrc(g, w / 2, 300, 120, 40, 20); g.fill();
    g.font = FT.he(40); g.direction = 'rtl'; g.textAlign = 'center'; g.fillStyle = W; g.fillText('השקה.', w / 2, 210);
  } else if (i === 3) {    // code
    g.font = FT.monoB(30); g.direction = 'ltr'; g.textAlign = 'left';
    const L = ['seek(t) {', '  card.w = spring(t)', '  cam.z = log(1, 4)', '  sfx.at(peak)', '  return frame', '}'];
    const shown = Math.floor(clamp((lt - 0.3) / 0.09, 0, 999));
    let k = 0; L.forEach((s, li) => { const n = clamp(shown - k, 0, s.length); k += s.length; if (n > 0) { g.fillStyle = li === 0 || li === 5 ? '#5DE4E9' : li % 2 ? W : BRAND.gold; g.fillText(s.slice(0, n), 40, 80 + li * 56); } });
  } else if (i === 4) {    // colour
    const cs = ['#FFC74E', '#FF8F3A', '#F56B49', '#D74270', '#97429A', '#603689', '#5EA1C1', '#5DE4E9', NAVY];
    cs.forEach((c, k) => { const s = spring(t - bt(18.2) - k * 0.04, 14, 0.55); circle(g, 110 + (k % 3) * 146, 110 + Math.floor(k / 3) * 146, 58 * s); g.fillStyle = c; g.fill(); });
  } else {                 // sound
    for (let k = 0; k < 46; k++) { const u = k / 45, pk = 0.34, a = u < pk ? Math.pow(u / pk, 2) : Math.exp(-(u - pk) * 5); const hh = (0.3 + 0.7 * Math.abs(Math.sin(k * 1.7 + lt * 9))) * a * 170 + 4; g.fillStyle = NAVY; g.fillRect(40 + k * 9.6, 280 - hh, 6, hh * 2); }
    g.fillStyle = W; g.fillRect(40 + 0.34 * 45 * 9.6, 80, 7, 400);
  }
  // label row
  g.font = FT.en(30); g.direction = 'ltr'; g.textAlign = 'left'; g.fillStyle = ink; g.globalAlpha = 0.8; g.fillText(`0${i + 1} / 06`, 40, h - 50); g.globalAlpha = 1;
  g.font = FT.he(54); g.direction = 'rtl'; g.textAlign = 'right'; g.fillStyle = ink; g.fillText(CARD_NAMES[i], w - 40, h - 42);
}
function phoneUI(t) {
  const g = phoneCv.getContext('2d'), w = UIW, h = UIH, R = w - 44; g.setTransform(1, 0, 0, 1, 0, 0);
  g.fillStyle = gradPaint(g, 0, 0, 0, h, ['#DDF0FF', '#EEF3FB', '#FFFFFF']); g.fillRect(0, 0, w, h);
  g.font = FT.he7(26); g.direction = 'ltr'; g.textAlign = 'left'; g.fillStyle = NAVY; g.fillText('9:41', 46, 58);
  rrc(g, w / 2, 48, 176, 50, 25); g.fillStyle = '#000'; g.fill();
  if (LOGO) g.drawImage(LOGO, R - 64, 100, 64, 64);
  g.font = FT.en(40); g.direction = 'ltr'; g.textAlign = 'right'; g.fillStyle = NAVY; g.fillText('YUV.AI', R - 78, 148);
  g.font = FT.he(100); g.direction = 'rtl'; g.textAlign = 'right'; g.fillStyle = NAVY; g.fillText('כושר.', R, 320);
  g.fillStyle = gradPaint(g, R - 330, 0, R, 0, FIRE); rr(g, R - 330, 352, 330, 112, 56); g.fill(); g.fillStyle = NAVY; g.fillText('עכשיו.', R - 30, 440);
  card(g, w / 2, 700, w - 88, 300, 40, { fill: NAVY, depth: 0 });
  g.font = FT.he7(30); g.direction = 'rtl'; g.textAlign = 'right'; g.fillStyle = DENIM; g.fillText('אימונים השבוע', R - 26, 600);
  g.font = FT.en(92); g.direction = 'ltr'; g.textAlign = 'right'; g.fillStyle = W; g.fillText(countUp(t, bt(29), 0, 1240).toLocaleString('en-US'), R - 26, 700);
  bars(g, t, 70, 830, w - 140 - 26, 90, [0.4, 0.6, 0.5, 0.8, 1, 0.7, 0.9], [0, 1, 2, 3, 4, 5, 6].map(k => bt(29.2) + k * bt(0.25)), gradPaint(g, 0, 830, 0, 740, FIRE), 0.32, 9);
  const by = h - 190; rrc(g, w / 2, by, w - 88, 108, 54); g.fillStyle = gradPaint(g, 44, 0, w - 44, 0, FIRE); g.fill();
  g.font = FT.he(42); g.direction = 'rtl'; g.textAlign = 'center'; g.fillStyle = NAVY; g.fillText('התחל אימון', w / 2, by + 15);
  rrc(g, w / 2, h - 30, 190, 10, 5); g.fillStyle = NAVY; g.fill();
}
function laptopUI(t) {
  const g = lapCv.getContext('2d'), w = 960, h = 598; g.setTransform(1, 0, 0, 1, 0, 0);
  g.fillStyle = '#0B0E2A'; g.fillRect(0, 0, w, h);
  g.fillStyle = NAVY2; g.fillRect(0, 0, w, 44); [['#F56B49', 26], ['#FFC74E', 52], ['#5DE4E9', 78]].forEach(([c, x0]) => { circle(g, x0, 22, 8); g.fillStyle = c; g.fill(); });
  g.font = FT.monoB(18); g.direction = 'ltr'; g.textAlign = 'center'; g.fillStyle = DENIM; g.fillText('launch.film.js — yuv motion', w / 2, 28);
  const code = [['// any topic → a launch film', DENIM], ['const film = motion({', W], ["  topic: 'אפליקציית כושר',", BRAND.gold], ['  fps: 60, blur: 6,', '#5DE4E9'], ["  look: 'phoenix · day',", '#FF66C4'], ['  beats: 68,', '#5DE4E9'], ['})', W], ['film.seek(t)  // pure', BRAND.orange], ['await film.render()', '#5DE4E9']];
  g.font = FT.monoB(26); g.textAlign = 'left';
  const lt = t - bt(30.6), shown = Math.floor(clamp(lt / 0.022, 0, 9999)); let k = 0, caret = null;
  code.forEach(([s, c], li) => { const n = clamp(shown - k, 0, s.length); k += s.length; if (n > 0) { g.direction = /[֐-׿]/.test(s) ? 'ltr' : 'ltr'; g.fillStyle = c; const txt = s.slice(0, n); g.fillText(txt, 36, 96 + li * 52); if (n < s.length) caret = [36 + g.measureText(txt).width, 96 + li * 52]; } });
  if (caret) { g.fillStyle = BRAND.orange; g.fillRect(caret[0] + 3, caret[1] - 22, 4, 28); }
}

/* ---------------- ACT I: the neon prompt (2D stage under a 2D camera) ---------------- */
const TEXT = 'השקה לאפליקציית כושר חדשה', T0 = bt(5.5), PER = bt(0.25);
const CT = charTimes(TEXT, T0, PER);
let CARET = [];
function inputGeom(L) { const w = L.inputW, h = L.inputH; return { w, h, xr: w / 2 - 66, bx: -w / 2 + h / 2, rb: h / 2 - 16 }; }
function measureCaret(x, L) { const G = inputGeom(L); x.font = FT.he8(56); CARET = Array.from(TEXT).map((_, i) => G.xr - x.measureText(Array.from(TEXT).slice(0, i + 1).join('')).width); }
function cam2d(t, L) {
  const G = inputGeom(L), focus0 = G.xr - 260 / L.zType * 2.3;
  const typing = tt => sk(tt, [[-1, focus0], ...CT.map((c, i) => [c, Math.min(focus0, CARET[i] + 150)])], 12, 0.9);
  let z = 1, fx = 0;
  if (t < bt(4)) { z = 1; fx = 0; }
  else if (t < bt(5.4)) { const u = io3(inv(bt(4), bt(5.4), t)); z = logLerp(1, L.zType, u); fx = lerp(0, focus0, u); }
  else if (t < bt(11.9)) { z = L.zType; fx = typing(t); }
  else { const u = io3(inv(bt(11.9), bt(12.8), t)), v = io3(inv(bt(15.3), bt(16), t)); z = logLerp(L.zType, L.zClick, u); fx = lerp(lerp(typing(bt(11.9)), 0, u), G.bx, v); }   // the send button ends centred: the drop bursts from it
  return { z, fx, fy: 0 };
}
const toScreen = (L, c, X, Y) => ({ x: L.cx + (X - c.fx) * c.z, y: L.cy + (Y - c.fy) * c.z });
const CHIPS = ['16:9', '9:16', '60 FPS', 'עברית'];
function chipPos(L, i) { if (L.name === 'h') return { x: L.cx + (1.5 - i) * L.chipDX, y: L.chipY }; return { x: L.cx + (i % 2 ? -170 : 170), y: L.chipY + Math.floor(i / 2) * 120 }; }

function act1(x, t, L) {
  if (t >= bt(16.2)) return;
  const G = inputGeom(L), c = cam2d(t, L), appear = spring(t, 12, 0.55), collapse = io3(inv(bt(15.3), bt(16), t));
  const ang = t * 1.5 + 0.5 * sk(t, [[-1, 0], ...[...Array(16).keys()].map(k => [bt(k), k * 0.5])], 14, 0.6);
  x.save(); x.translate(L.cx, L.cy); x.scale(c.z, c.z); x.translate(-c.fx, -c.fy);
  if (t < bt(16)) {
    const w = lerp(G.w, G.rb * 2, collapse) * appear, h = lerp(G.h, G.rb * 2, collapse) * appear, cxb = -G.w / 2 * appear + w / 2;
    neonRing(x, cxb, 0, w + 6, h + 6, (h + 6) / 2, ang, { lw: 4, glow: 20, power: 1 + 0.55 * beatPulse(t) + 0.4 * inv(bt(14), bt(15.2), t) });
    card(x, cxb, 0, w, h, h / 2, { fill: W, shadow: 'rgba(20,60,120,.35)', depth: 0.8 });
    x.save(); rrc(x, cxb, 0, w, h, h / 2); x.clip();
    x.font = FT.he8(56); x.direction = 'rtl'; x.textAlign = 'right';
    let caretX = G.xr;
    if (t < T0) { x.fillStyle = 'rgba(18,22,63,.35)'; x.fillText('על מה הסרטון?', G.xr, 20); }
    else caretX = popType(x, t, TEXT, G.xr, 20, FT.he8, 56, NAVY, CT);
    const blink = t > bt(11.6) ? Math.floor((t - bt(11.6)) / (B / 2)) % 2 === 0 : true;
    if (t > bt(0.5) && blink && collapse < 0.15) { x.fillStyle = BRAND.orange; x.fillRect(caretX - 8, -32, 5, 64); }
    x.restore();
    const ps = press(t, bt(15), bt(15.25)) * appear;
    circle(x, G.bx, 0, G.rb * ps); x.fillStyle = gradPaint(x, G.bx - G.rb, -G.rb, G.bx + G.rb, G.rb, FIRE); x.fill();
    arrowLeft(x, G.bx, 0, ps * 1.2, NAVY);
  }
  x.restore();
  // option chips pop on 8th notes, then get sucked into the send button
  const bs = toScreen(L, c, G.bx, 0), suck = io3(inv(bt(15.25), bt(15.9), t));
  CHIPS.forEach((s, i) => { if (suck >= 0.999) return; const p = chipPos(L, i); x.save(); x.translate(lerp(p.x, bs.x, suck), lerp(p.y, bs.y, suck)); x.scale(1 - suck, 1 - suck); neonChip(x, t, bt(12.5 + 0.5 * i), 0, 0, s, { size: 42, fontFn: /[֐-׿]/.test(s) ? FT.he : FT.en, angle: t * 1.5 + i }); x.restore(); });
  // the cursor clicks "send"
  if (t > bt(13.4) && t < bt(16.6)) {
    const a = io3(inv(bt(13.4), bt(14.7), t)), e = io3(inv(bt(15.4), bt(16.3), t));
    let px = lerp(L.W * 0.9, bs.x + 6, a), py = lerp(L.H * 1.05, bs.y + 8, a); px = lerp(px, L.W * 0.7, e); py = lerp(py, L.H * 1.2, e);
    clickRing(x, bs.x, bs.y, t, bt(15), BRAND.orange, 100);
    cursor(x, px, py, 1.5 * press(t, bt(15), bt(15.25), 0.78), NAVY, W);
  }
}
function act1Type(x, t, L) {
  riseWords(x, t, ['YUV.AI MOTION'], 0, L.head1 - L.headS * 0.95, 34, FT.en, NAVY, [bt(0.3)], bt(3.85), { ltr: true, right: L.right, spacing: '6px' });
  slamWords(x, t, ['כל', 'נושא.'], 0, L.head1, L.headS, FT.he, NAVY, [bt(1), bt(1.5)], bt(3.85), { right: L.right });
  slamWords(x, t, ['סרטון', 'השקה.'], 0, L.head2, L.headS, FT.he, NAVY, [bt(2), bt(2.5)], bt(3.9), { right: L.right, marker: { i: 1, paint: gradPaint(x, L.right - 700, 0, L.right, 0, FIRE) } });
}

/* ---------------- 3D ---------------- */
let R3 = null;
const RC = new THREE.Vector3(0, 1.0, 0), RING_R = 2.1;
function ringTheta(t) { return sk(t, [[-1, 0], [bt(20), -60], [bt(22), -120], [bt(24), -180], [bt(26), -240], [bt(27), -300]], 11, 0.55) * D2R; }
function camPose(t, L) {
  // returns {pos, target}
  const carPos = new THREE.Vector3(0, RC.y, RING_R + L.camD), carTgt = carPos.clone().add(new THREE.Vector3(0, 0, -1));
  // act I: same spot, looking up into the sky, small dolly with the 2D dive
  const dive = io3(inv(bt(4), bt(5.4), t)) * (1 - io3(inv(bt(11.9), bt(12.8), t)));
  const lookUp = 0.12 * (1 - io3(inv(bt(16), bt(17.4), t)));
  const p1 = carPos.clone().add(new THREE.Vector3(0, 0, -0.5 * dive)), t1 = p1.clone().add(new THREE.Vector3(0, Math.tan(lookUp), -1));
  if (t < bt(18.4)) return { pos: p1, target: t1 };
  // act II: gentle orbit around the ring after the handoff
  const o = io3(inv(bt(18.4), bt(20), t)), sway = 0.35 * Math.sin((t - bt(18.4)) * 0.7) * o;
  const p2 = carPos.clone().add(new THREE.Vector3(sway, 0.15 * o, 0.3 * o)), t2 = new THREE.Vector3(0, RC.y, RING_R * 0.5);
  if (t < bt(28)) return { pos: p2, target: carTgt.clone().lerp(t2, o) };
  // act III: orbit the devices
  const TG = new THREE.Vector3(-0.1, L.name === 'h' ? 0.62 : 0.9, 0.3);
  const az = sk(t, [[-1, 0], [bt(31), 0.4], [bt(34.5), -0.34], [bt(38), 0.08]], 2.6, 0.9);
  const crane = io3(inv(bt(40), bt(48), t)), tod = crane;
  const rad = lerp(L.orbitR, L.orbitR * 2.6, crane), el = lerp(9, 5, crane) * D2R, azc = lerp(az, 0, crane);
  const p3 = TG.clone().add(new THREE.Vector3(Math.sin(azc) * Math.cos(el) * rad, Math.sin(el) * rad + 2.2 * crane, Math.cos(azc) * Math.cos(el) * rad));
  const t3 = TG.clone().add(new THREE.Vector3(0, 1.6 * crane, -6 * crane));
  // act V/VI: tilt up into the sky for the logo
  const up = io3(inv(bt(56), bt(60), t));
  const t4 = t3.clone().add(new THREE.Vector3(0, 7.5 * up, 0));
  const m = io3(inv(bt(28), bt(30), t));
  const prev = camPose(bt(27.999), L);
  return { pos: prev.pos.clone().lerp(p3, m), target: prev.target.clone().lerp(t4, m) };
}
function todAt(t) { return io3(inv(bt(40), bt(48.5), t)); }
function cardPose(i, t) {
  const th = ringTheta(t), a = i * 60 * D2R + th;
  const ring = new THREE.Vector3(RC.x + RING_R * Math.sin(a), RC.y, RC.z + RING_R * Math.cos(a));
  const stack = new THREE.Vector3(RC.x, RC.y, RC.z + RING_R - 0.03 * i);
  const d = i === 0 ? 1 : spring(t - (bt(18.1) + i * 0.07), 10, 0.62);
  const pos = stack.clone().lerp(ring, d); let rotY = lerp(0, a, d);
  // act III: the ring explodes outward and up, cards spin away
  const ex = in3(inv(bt(28), bt(29.4), t));
  if (ex > 0) { const dir = new THREE.Vector3(Math.sin(a), 0.35 + 0.15 * i % 3, Math.cos(a)).normalize(); pos.add(dir.multiplyScalar(ex * 9)); rotY += ex * (i % 2 ? 6 : -6); }
  return { pos, rotY, rotX: ex * (i % 2 ? 2 : -2) };
}
function devicePose(t, L) {
  const rp = sk(t, [[-1, -3.2], [bt(28.4), 0]], 6, 0.8), rl = sk(t, [[-1, -3.2], [bt(28.8), 0]], 6, 0.8);
  const spin = TAU * spring(t - bt(32), 7.5, 0.72), bob = 0.04 * Math.sin((t - bt(30)) * 1.6);
  const lid = 1.88 * spring(t - bt(30), 9, 0.5);
  return { phone: { x: L.devPhone[0], y: L.devPhone[1] + rp + bob, z: L.devPhone[2], yaw: 0.35 + spin, pitch: 0.05 }, lap: { x: L.devLap[0], y: L.devLap[1] + rl, z: L.devLap[2], yaw: -0.38, lid } };
}
async function init3D(L, SCALE) {
  const renderer = makeRenderer(Math.round(L.W * SCALE), Math.round(L.H * SCALE), 0.85);
  const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(L.fov, L.W / L.H, 0.05, 20000);
  const world = makeTodWorld(renderer, scene, {});
  const tex = c => { const tx = new THREE.CanvasTexture(c); tx.colorSpace = THREE.SRGBColorSpace; tx.anisotropy = 8; return tx; };
  const phoneTex = tex(phoneCv), lapTex = tex(lapCv);
  const phone = makePhone({ ...PH, bodyColor: '#2B3263', screenTex: phoneTex }); scene.add(phone);
  const lap = makeLaptop({ screenTex: lapTex }); scene.add(lap);
  const cards = cardCv.map(c => { const m = makeCard3D(c, CARD); scene.add(m); return m; });
  // the handoff rectangle: card 0 at the ring front, camera at the carousel pose
  const cp = camPose(bt(18), L); camera.position.copy(cp.pos); camera.lookAt(cp.target); camera.updateMatrixWorld();
  const c0 = cards[0], p0 = cardPose(0, bt(18)); c0.position.copy(p0.pos); c0.rotation.set(0, p0.rotY, 0); c0.updateMatrixWorld();
  const a = projectPx(c0, camera, new THREE.Vector3(-CARD.w / 2, CARD.h / 2, 0), L.W, L.H), b = projectPx(c0, camera, new THREE.Vector3(CARD.w / 2, -CARD.h / 2, 0), L.W, L.H);
  const target = { cx: (a.x + b.x) / 2, cy: (a.y + b.y) / 2, w: b.x - a.x, h: b.y - a.y }; target.r = CARD.r / CARD.w * target.w;
  R3 = { renderer, scene, camera, world, phone, lap, cards, phoneTex, lapTex, target };
}
function render3D(t, L) {
  const { renderer, scene, camera, world, phone, lap, cards, phoneTex, lapTex } = R3;
  world.update(t + 30 * io3(inv(bt(40), bt(48.5), t)), todAt(t));     // clouds race during the time-lapse
  const shake = 0.06 * Math.exp(-Math.max(0, t - bt(16)) * 9) * (t >= bt(16) ? 1 : 0);
  const cp = camPose(t, L); camera.position.copy(cp.pos).add(new THREE.Vector3(Math.sin(t * 61) * shake, Math.cos(t * 47) * shake, 0)); camera.lookAt(cp.target);
  cards.forEach((m, i) => { const vis = t >= bt(18) - 0.0001 && t < bt(29.6) && (i === 0 || t >= bt(18.05)); m.visible = vis; if (!vis) return; const p = cardPose(i, t); m.position.copy(p.pos); m.rotation.set(p.rotX, p.rotY, 0); cardArt(i, t); m.userData.tex.needsUpdate = true; });
  const dv = devicePose(t, L), on = t >= bt(28.2);
  phone.visible = on; lap.visible = on;
  if (on) {
    phone.position.set(dv.phone.x, dv.phone.y, dv.phone.z); phone.rotation.set(dv.phone.pitch, dv.phone.yaw, 0); phoneUI(t); phoneTex.needsUpdate = true;
    lap.position.set(dv.lap.x, dv.lap.y, dv.lap.z); lap.rotation.set(0, dv.lap.yaw, 0); lap.userData.lid.rotation.x = Math.PI / 2 - dv.lap.lid; laptopUI(t); lapTex.needsUpdate = true;
  }
  renderer.render(scene, camera);
  return renderer.domElement;
}

/* ---------------- the drop: button → card → lands on card 0 of the ring ---------------- */
function dropCard(x, t, L) {
  if (t < bt(16) || t >= bt(18)) return;
  const T = R3.target, G = inputGeom(L);
  const heroH = L.H * (L.name === 'h' ? 0.74 : 0.5), heroW = heroH * CW / CH, hero = { cx: L.W / 2, cy: L.H / 2, w: heroW, h: heroH };
  const st = { cx: L.cx, cy: L.cy, w: G.rb * 2, h: G.rb * 2 };
  const a = spring(t - bt(16), 12, 0.6), b = spring(t - bt(17), 17, 1);
  const f = k => st[k] + (hero[k] - st[k]) * a + (T[k] - hero[k]) * b;
  const w = f('w'), h = f('h'), r = lerp(Math.min(w, h) / 2, CARD.r / CARD.w * w, clamp(a * 1.3));
  cardArt(0, t);
  card(x, f('cx'), f('cy'), w, h, r, { fill: NAVY, shadow: 'rgba(20,60,120,.45)', depth: 0.9 * (1 - io3(inv(bt(17.2), bt(17.85), t))) });
  x.save(); rrc(x, f('cx'), f('cy'), w, h, r); x.clip();
  x.fillStyle = gradPaint(x, f('cx') - w / 2, 0, f('cx') + w / 2, 0, FIRE); x.fillRect(f('cx') - w / 2, f('cy') - h / 2, w, h);
  const open = out3(inv(bt(16) + 0.06, bt(16) + 0.42, t)); if (open > 0) { circle(x, f('cx'), f('cy'), open * Math.hypot(w, h) * 0.55); x.clip(); x.drawImage(cardCv[0], f('cx') - w / 2, f('cy') - h / 2, w, h); }
  x.restore();
}
function shockwave(x, t, L) {
  if (t < bt(16) || t > bt(16) + 0.7) return;
  const q = inv(bt(16), bt(16) + 0.7, t), R = out3(q) * coverR(L.W, L.H, L.cx, L.cy) * 1.1;
  const g = x.createConicGradient(t * 3, L.cx, L.cy); SPECTRUM.forEach((c, i) => g.addColorStop(i / (SPECTRUM.length - 1), c));
  x.save(); x.strokeStyle = g; x.lineWidth = 60 * (1 - q) + 2; x.filter = 'blur(6px)'; circle(x, L.cx, L.cy, R); x.stroke(); x.filter = 'none'; x.lineWidth = 10 * (1 - q); circle(x, L.cx, L.cy, R); x.stroke(); x.restore();
}

/* ---------------- titles over the world ---------------- */
function titles(x, t, L) {
  const R = L.right, Y = L.titleY, S = L.titleS, MW = L.W - (L.W - R) * 2, fireM = gradPaint(x, R - 900, 0, R, 0, FIRE);
  const capt = [[18, 'טיפוגרפיה.'], [20, 'גרפים.'], [22, 'מכשירים.'], [24, 'קוד.'], [26, 'צבע.'], [27, 'סאונד.']];
  capt.forEach(([b0, w], i) => { const nxt = i < capt.length - 1 ? capt[i + 1][0] : 28; slamWords(x, t, [w], 0, Y, S, FT.he, NAVY, [bt(b0)], bt(nxt - 0.42), { right: R, maxW: MW, marker: { i: 0, paint: fireM } }); });
  slamWords(x, t, ['על', 'כל', 'מסך.'], 0, Y, S, FT.he, NAVY, [bt(30), bt(30.5), bt(31)], bt(33.5), { right: R, maxW: MW, marker: { i: 2, paint: fireM } });
  slamWords(x, t, ['חי.', 'בזמן', 'אמת.'], 0, Y, S, FT.he, NAVY, [bt(34), bt(35), bt(35.5)], bt(37.5), { right: R, maxW: MW });
  slamWords(x, t, ['מבוקר', 'עד', 'שקיעה.'], 0, Y, S, FT.he, NAVY, [bt(41), bt(42), bt(43)], bt(44.5), { right: R, maxW: MW, marker: { i: 2, paint: fireM } });
  slamWords(x, t, ['עולם', 'שלם.', 'בקוד.'], 0, Y, S, FT.he, NAVY, [bt(45), bt(45.5), bt(46.5)], bt(47.8), { right: R, maxW: MW, colors: [NAVY, NAVY, W] });
}

/* ---------------- ACT V: neon stat cards → one pill → the logo ring ---------------- */
const STATS = [['60', 'FPS', 'פריימים לשנייה'], ['0', '', 'After Effects'], ['100%', '', 'קוד'], ['∞', '', 'נושאים']];
function statRect(L, i) { const S = L.stat; if (L.name === 'h') return { cx: S.xs[i], cy: S.y, w: S.w, h: S.h }; const [cx, cy] = S.pos[i]; return { cx, cy, w: S.w, h: S.h }; }
function act5(x, t, L) {
  if (t < bt(48) || t > bt(60.5)) return;
  const pill = { cx: L.W / 2, cy: L.logoY, w: 260, h: 260 };            // ends as the ring around the logo
  const merge = spring(t - bt(55), 10, 0.75), ringify = io3(inv(bt(57), bt(58), t));
  STATS.forEach(([num, unit, label], i) => {
    const s = spring(t - bt(48 + i), 17, 0.5); if (s <= 0.001) return;
    const r0 = statRect(L, i), m = clamp(merge, 0, 1.2);
    const cx = lerp(r0.cx, pill.cx, merge), cy = lerp(r0.cy, pill.cy, merge), w = lerp(r0.w, pill.w, merge) * s, h = lerp(r0.h, pill.h, merge) * s, rad = lerp(44, pill.h / 2, clamp(m));
    const ang = t * 1.4 + i * 1.3;
    neonRing(x, cx, cy, w + 6, h + 6, rad + 3, ang, { lw: 4, glow: 18, power: 1 + 0.5 * beatPulse(t) });
    if (ringify < 1) {
      card(x, cx, cy, w, h, rad, { fill: rgba(NAVY, 0.88), shadow: 'rgba(10,10,40,.45)', depth: 0.6 * (1 - m) });
      x.save(); rrc(x, cx, cy, w, h, rad); x.clip(); const k = (1 - clamp(merge * 1.6)) * s;
      if (k > 0.01) {
        x.translate(cx, cy); x.scale(k, k);
        const val = num === '60' ? String(countUp(t, bt(48 + i) + 0.1, 0, 60)) : num === '100%' ? countUp(t, bt(48 + i) + 0.1, 0, 100) + '%' : num === '0' ? String(countUp(t, bt(48 + i) + 0.1, 100, 0)) : num;
        x.font = FT.en(150); x.direction = 'ltr'; x.textAlign = 'center'; x.fillStyle = gradPaint(x, -120, -100, 120, 40, FIRE); x.fillText(val, 0, 30);
        x.font = /[֐-׿]/.test(label) ? FT.he(44) : FT.en(44); x.direction = /[֐-׿]/.test(label) ? 'rtl' : 'ltr'; x.fillStyle = W; x.fillText(label, 0, 112);
      }
      x.restore();
    }
  });
  if (merge > 0.6 && ringify < 1) { x.save(); x.font = FT.en(64); x.direction = 'ltr'; x.textAlign = 'center'; x.fillStyle = W; const k = clamp((merge - 0.6) / 0.3) * (1 - ringify); x.translate(pill.cx, pill.cy); x.scale(k, k); x.fillText('YUV.AI', 0, 22); x.restore(); }
}
function act6(x, t, L) {
  if (t < bt(57)) return;
  const ringify = io3(inv(bt(57), bt(58), t)), Rr = L.logoS * 0.62, cx = L.W / 2, cy = L.logoY;
  // the ring: the merged pill hollows out into a rotating neon circle (same spectrum as the prompt box)
  if (ringify > 0) {
    const g = x.createConicGradient(t * 1.6, cx, cy); SPECTRUM.forEach((c, i) => g.addColorStop(i / (SPECTRUM.length - 1), c));
    const rr0 = lerp(130, Rr, ringify), lw = lerp(130, 6, ringify);
    x.save(); x.strokeStyle = g; x.filter = 'blur(18px)'; x.lineWidth = lw * 3; circle(x, cx, cy, rr0); x.stroke(); x.filter = 'none'; x.lineWidth = lw; circle(x, cx, cy, rr0); x.stroke(); x.restore();
  }
  const s = spring(t - bt(58), 12, 0.55);
  if (LOGO && s > 0.001) { const S = L.logoS * s; x.drawImage(LOGO, cx - S / 2, cy - S / 2, S, S); }
  slamWords(x, t, ['YUV.AI', 'MOTION'], L.W / 2, L.wordY, L.name === 'h' ? 170 : 128, FT.en, W, [bt(59), bt(59.5)], null, { ltr: true, colors: [W, gradPaint(x, L.W / 2, 0, L.W / 2 + 400, 0, FIRE)] });
  x.save(); x.shadowColor = 'rgba(18,22,63,.45)'; x.shadowBlur = 24; x.shadowOffsetY = 6;
  slamWords(x, t, ['תגיד', 'נושא.', 'קבל', 'סרטון.'], L.W / 2, L.tagY, L.name === 'h' ? 92 : 84, FT.he, W, [bt(61), bt(61.25), bt(62), bt(62.25)], null, {});
  x.restore();
  neonChip(x, t, bt(64), L.W / 2, L.tagY + (L.name === 'h' ? 96 : 120), 'yuv.ai', { size: 36, fontFn: FT.en, angle: t * 1.4 });
  if (L.name === 'v') riseWords(x, t, ['100% CODE  ·  60 FPS  ·  0 AFTER EFFECTS'], L.W / 2, L.H - 150, 28, FT.en, W, [bt(65)], null, { ltr: true, spacing: '3px' });
}
function hud(x, t, L) {
  x.save(); x.direction = 'ltr'; x.textAlign = 'left'; x.font = FT.monoB(L.name === 'h' ? 21 : 23); x.fillStyle = todAt(t) > 0.5 ? 'rgba(255,255,255,.75)' : 'rgba(18,22,63,.7)';
  x.fillText(`seek(${t.toFixed(3)})  ·  beat ${Math.min(NB, Math.floor(t / B))}/${NB}`, L.name === 'h' ? 40 : 44, L.hudY);
  if (L.name === 'h') { x.font = FT.en(26); x.letterSpacing = '3px'; x.textAlign = 'right'; x.fillText('YUV.AI MOTION', L.W - 40, L.hudY); }
  x.restore();
}

/* ---------------- the film ---------------- */
function draw(x, t, L) {
  const gl = render3D(t, L);
  x.drawImage(gl, 0, 0, L.W, L.H);
  const sh = 14 * Math.exp(-Math.max(0, t - bt(16)) * 9) * (t >= bt(16) ? 1 : 0);
  x.save(); if (sh > 0.05) x.translate(Math.sin(t * 71) * sh, Math.cos(t * 53) * sh);
  act1(x, t, L); act1Type(x, t, L); shockwave(x, t, L); dropCard(x, t, L);
  x.restore();
  titles(x, t, L); act5(x, t, L); act6(x, t, L); hud(x, t, L);
}
mountFilm({
  layouts: LAYOUTS, draw, dur: DUR, clk, extra: { NB },
  init: async (L, SCALE, ctx) => {
    LOGO = LOGO_URL ? await new Promise(res => { const im = new Image(); im.onload = () => res(im); im.onerror = () => res(null); im.src = LOGO_URL; }) : null;
    measureCaret(ctx, L); await init3D(L, SCALE);
  }
});
