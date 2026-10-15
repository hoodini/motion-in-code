/* =====================================================================
   KIT DEMO — "תגיד נושא. קבל סרטון."
   An input box types (the camera tracks the caret) → the cursor clicks
   send → the button opens into a card → the card lands on a 3D phone
   rising out of a sunset sea → the camera cranes up into the sky → logo.
   32 beats @ 129.723 BPM (Mixkit "Cat Walk"), drop on beat 12.
   ===================================================================== */
import { clamp, lerp, inv, out3, in3, io3, logLerp, spring, sk, clock, rgba, makeTheme, BRAND, FT, fitSize, rrc, circle, coverR, riseWords, gradPaint, mountFilm } from '../../src/core.js';
import { card, typedText, charTimes, press, cursor, clickRing, arrowLeft, countUp, bars } from '../../src/ui.js';
import { THREE, makeRenderer, makePhone, makeSeaWorld, projectPx } from '../../src/world.js';
import LOGO_URL from '../../brand/logo-square-transparent.png';

const clk = clock(129.723), { B, bt } = clk;
const NB = 32, DUR = NB * B + 0.9;
const Q = new URLSearchParams(location.search);
const TH = makeTheme(Q.get('theme') || 'phoenix');
const { K, W } = TH, FIRE = BRAND.fire, NAVY2 = BRAND.navy2;

const LAYOUTS = {
  h: { name: 'h', W: 1920, H: 1080, cx: 960, cy: 600, right: 1800, tY: 250, tSize: 150, tMax: 1500, inputW: 1100, inputH: 132,
       fov: 32, camDist: 4.4, camX: 0.62, camY: 0, zType: 2.2, zClick: 1.4, clickDX: 430, titleR: 1800, titleY0: 420, titleDY: 175, titleSize: 156, hudY: 1046, logoY: 330, logoS: 300, wordY: 690, wordS: 190 },
  v: { name: 'v', W: 1080, H: 1920, cx: 540, cy: 1000, right: 1015, tY: 560, tSize: 124, tMax: 950, inputW: 960, inputH: 128,
       fov: 40, camDist: 5.0, camX: 0, camY: 0.5, zType: 2.0, zClick: 1.0, clickDX: 480, titleR: 1015, titleY0: 300, titleDY: 150, titleSize: 128, hudY: 1862, logoY: 640, logoS: 380, wordY: 1110, wordS: 200 }
};

/* ---------------- the phone screen UI (one canvas: drawn by the 2D card AND mapped onto the 3D screen) ---------------- */
const PHONE = { w: 0.76, h: 1.58, d: 0.085, r: 0.125, bezel: 0.03 };
const SW = PHONE.w - 2 * PHONE.bezel, SH = PHONE.h - 2 * PHONE.bezel, SR = PHONE.r - PHONE.bezel * 0.9;
const UIW = 600, UIH = Math.round(UIW * SH / SW);
const ui = document.createElement('canvas'); ui.width = UIW; ui.height = UIH; const ug = ui.getContext('2d');
let LOGO = null;

function screenUI(t) {
  const g = ug, w = UIW, h = UIH, R = w - 44;
  g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = K; g.fillRect(0, 0, w, h);
  const rg = g.createRadialGradient(w * 0.95, 0, 10, w * 0.95, 0, w * 1.2); rg.addColorStop(0, rgba(BRAND.orange, 0.42)); rg.addColorStop(1, rgba(BRAND.orange, 0)); g.fillStyle = rg; g.fillRect(0, 0, w, h);
  // status bar + island
  g.font = FT.he7(26); g.direction = 'ltr'; g.textAlign = 'left'; g.fillStyle = W; g.fillText('9:41', 46, 58);
  rrc(g, w - 70, 50, 44, 20, 6); g.lineWidth = 2.5; g.strokeStyle = W; g.stroke(); rrc(g, w - 73, 50, 32, 12, 3); g.fillStyle = W; g.fill();
  rrc(g, w / 2, 48, 176, 50, 25); g.fillStyle = '#000'; g.fill();
  // header
  if (LOGO) g.drawImage(LOGO, R - 62, 104, 62, 62);
  g.font = FT.en(40); g.direction = 'ltr'; g.textAlign = 'right'; g.fillStyle = W; g.fillText('YUV.AI', R - 76, 150);
  // headline
  riseWords(g, t, ['השקה.'], 0, 318, 104, FT.he, W, [bt(12.55)], null, { right: R });
  riseWords(g, t, ['היום.'], 0, 432, 104, FT.he, gradPaint(g, R - 300, 0, R, 0, FIRE), [bt(12.95)], null, { right: R });
  // stats card
  const cy = 700; card(g, w / 2, cy, w - 88, 330, 40, { fill: NAVY2, depth: 0, rim: 'rgba(255,255,255,.07)' });
  g.font = FT.he7(30); g.direction = 'rtl'; g.textAlign = 'right'; g.fillStyle = BRAND.denim; g.fillText('צפיות מאז ההשקה', R - 26, cy - 108);
  g.font = FT.en(96); g.direction = 'ltr'; g.textAlign = 'right'; g.fillStyle = W; g.fillText(countUp(t, bt(13.4), 0, 248) + 'K', R - 26, cy - 8);
  const vals = [0.32, 0.48, 0.4, 0.66, 0.9, 0.74, 1];
  bars(g, t, 70, cy + 140, w - 140 - 26, 120, vals, vals.map((_, i) => bt(13.6) + i * bt(0.25)), gradPaint(g, 0, cy + 140, 0, cy + 20, FIRE), 0.32, 10);
  // second card: a tiny timeline of beats
  const cy2 = 1000; card(g, w / 2, cy2, w - 88, 150, 40, { fill: NAVY2, depth: 0 });
  for (let i = 0; i < 9; i++) { const bx = 92 + i * 52, on = t >= bt(14 + i * 0.5); circle(g, bx, cy2, on ? 13 : 9); g.fillStyle = on ? BRAND.orange : rgba(BRAND.denim, 0.45); g.fill(); }
  g.font = FT.en(30); g.direction = 'ltr'; g.textAlign = 'right'; g.fillStyle = BRAND.gold; g.fillText('60 FPS', R - 26, cy2 + 11);
  // CTA
  const by = h - 190; rrc(g, w / 2, by, w - 88, 108, 54); g.fillStyle = gradPaint(g, 44, 0, w - 44, 0, FIRE); g.fill();
  g.font = FT.he(42); g.direction = 'rtl'; g.textAlign = 'center'; g.fillStyle = K; g.fillText('צפה בסרטון', w / 2 + 24, by + 15);
  g.beginPath(); g.moveTo(w / 2 - 128, by - 16); g.lineTo(w / 2 - 128, by + 16); g.lineTo(w / 2 - 102, by); g.closePath(); g.fill();
  rrc(g, w / 2, h - 30, 190, 10, 5); g.fillStyle = 'rgba(255,255,255,.85)'; g.fill();
}

/* ---------------- act 1: the input box (stage space, under a 2D camera) ---------------- */
const TEXT = 'סרטון השקה למוצר החדש שלי', PER = bt(0.24), T0 = bt(4);
const CT = charTimes(TEXT, T0, PER);
let CARET = [];   // caret x after each character (stage units), measured once fonts are ready
function inputGeom(L) { const w = L.inputW, h = L.inputH; return { w, h, xr: w / 2 - 64, bx: -w / 2 + h / 2, rb: h / 2 - 16 }; }
function measureCaret(x, L) { const G = inputGeom(L); x.font = FT.he8(54); CARET = Array.from(TEXT).map((_, i) => G.xr - x.measureText(Array.from(TEXT).slice(0, i + 1).join('')).width); }
function cam2d(t, L) {
  const G = inputGeom(L), focus0 = G.xr - 230;
  const typing = tt => sk(tt, [[-1, focus0], ...CT.map((c, i) => [c, Math.min(focus0, CARET[i] + 140)])], 8, 1);
  let z = 1, fx = 0;
  if (t < bt(2.2)) { z = 1; fx = 0; }
  else if (t < bt(3.6)) { const u = io3(inv(bt(2.2), bt(3.6), t)); z = logLerp(1, L.zType, u); fx = lerp(0, focus0, u); }
  else if (t < bt(10.1)) { z = L.zType; fx = typing(t); }
  else if (t < bt(11.6)) { const u = io3(inv(bt(10.1), bt(11.0), t)); z = logLerp(L.zType, L.zClick, u); fx = lerp(typing(bt(10.1)), G.bx + L.clickDX, u); }
  else { const u = io3(inv(bt(11.6), bt(12), t)); z = logLerp(L.zClick, 1, u); fx = lerp(G.bx + L.clickDX, G.bx, u); }
  return { z, fx, fy: 0 };
}
const toScreen = (L, c, X, Y) => ({ x: L.cx + (X - c.fx) * c.z, y: L.cy + (Y - c.fy) * c.z });

function act1(x, t, L) {
  if (t >= bt(12) + 0.4) return;
  const G = inputGeom(L), c = cam2d(t, L);
  const appear = spring(t, 11, 0.74);
  const collapse = io3(inv(bt(11.7), bt(12.0), t));
  x.save(); x.translate(L.cx, L.cy); x.scale(c.z, c.z); x.translate(-c.fx, -c.fy);
  if (t < bt(12)) {
    const w = lerp(G.w, G.rb * 2 + 2, collapse) * appear, h = lerp(G.h, G.rb * 2 + 2, collapse) * appear, cxb = -G.w / 2 * appear + w / 2;
    card(x, cxb, 0, w, h, h / 2, { fill: W, shadow: 'rgba(3,5,25,.6)', depth: 1 });
    x.save(); rrc(x, cxb, 0, w, h, h / 2); x.clip();
    const typed = typedText(TEXT, t, T0, PER);
    x.font = FT.he8(54); x.direction = 'rtl'; x.textAlign = 'right';
    if (t < T0) { x.fillStyle = 'rgba(18,22,63,.38)'; x.fillText('על מה הסרטון?', G.xr, 19); }
    else { x.fillStyle = K; x.fillText(typed, G.xr, 19); }
    const n = typed.length, caretX = t < T0 ? G.xr : CARET[Array.from(typed).length - 1] ?? G.xr;
    const blink = t > bt(10) ? (Math.floor((t - bt(10)) / (B / 2)) % 2 === 0) : true;
    if (t > bt(1) && blink && collapse < 0.2) { x.fillStyle = BRAND.orange; x.fillRect(caretX - 7, -30, 5, 60); }
    x.restore();
    // send button: fire gradient circle + arrow, squashes on the click
    const ps = press(t, bt(11.5), bt(11.62)) * appear;
    circle(x, G.bx, 0, G.rb * ps); x.fillStyle = gradPaint(x, G.bx - G.rb, -G.rb, G.bx + G.rb, G.rb, FIRE); x.fill();
    arrowLeft(x, G.bx, 0, ps * 1.15, K);
  }
  x.restore();
  // the cursor clicks send (screen space)
  if (t > bt(10.3) && t < bt(12.6)) {
    const bs = toScreen(L, c, G.bx, 0), a = io3(inv(bt(10.3), bt(11.3), t)), e = io3(inv(bt(11.85), bt(12.5), t));
    let px = lerp(L.W * 0.88, bs.x + 6, a), py = lerp(L.H * 1.06, bs.y + 8, a);
    px = lerp(px, L.W * 0.62, e); py = lerp(py, L.H * 1.2, e);
    clickRing(x, bs.x, bs.y, t, bt(11.5), BRAND.gold, 90);
    cursor(x, px, py, 1.45 * press(t, bt(11.5), bt(11.62), 0.8), K, W);
  }
}
function act1Screen(x, t, L) {
  riseWords(x, t, ['YUV.AI MOTION KIT'], 0, L.tY - 120, 34, FT.en, BRAND.gold, [bt(0.2)], bt(1.95), { ltr: true, right: L.right, spacing: '4px' });
  const s = fitSize(x, 'תגיד נושא.', FT.he, L.tSize, L.tMax);
  riseWords(x, t, ['תגיד', 'נושא.'], 0, L.tY, s, FT.he, W, [bt(0.4), bt(0.6)], bt(1.95), { right: L.right, colors: [W, gradPaint(x, L.right - 700, 0, L.right - 250, 0, FIRE)] });
  riseWords(x, t, ['קבל', 'סרטון.'], 0, L.tY, s, FT.he, W, [bt(10.2), bt(10.4)], bt(11.6), { right: L.right, colors: [W, gradPaint(x, L.right - 760, 0, L.right - 250, 0, FIRE)] });
}

/* ---------------- 3D ---------------- */
const SEA = { skyMode: 'phoenix', elevation: 1.6, azimuth: 192, waterY: -4.5, waterColor: '#081033', size: 5, distortion: 6 };
let R3 = null; // { renderer, scene, camera, phone, sea, uiTex, target }
function phonePose(t, L) {
  const rise = sk(t, [[-1, -3.6], [bt(12.6), 0]], 6, 0.85);
  const yaw = sk(t, [[-1, 0.55], [bt(12.3), 0], [bt(16.3), -0.38], [bt(19.8), 0.3], [bt(22.6), -0.1]], 3.2, 0.9) + (t < bt(12.3) ? 0 : 0);
  const pitch = sk(t, [[-1, 0], [bt(16.3), 0.1], [bt(19.8), -0.05], [bt(22.6), 0.02]], 3.2, 0.9);
  const bob = 0.03 * Math.sin((t - bt(16)) * 1.7) * inv(bt(16), bt(17.5), t);
  return { y: rise + bob, yaw: t < bt(16) ? sk(t, [[-1, 0.55], [bt(12.6), 0]], 6, 0.85) : yaw, pitch: t < bt(16) ? 0 : pitch };
}
function cameraPose(t, L) {
  const d = lerp(L.camDist, L.camDist * 0.9, io3(inv(bt(16), bt(24), t)));
  const crane = io3(inv(bt(24), bt(27.6), t)), tilt = io3(inv(bt(24.3), bt(27.9), t));
  return { x: L.camX, y: L.camY + 2.6 * crane, z: d, pitch: 0.42 * tilt };
}
async function init3D(L, SCALE) {
  const renderer = makeRenderer(Math.round(L.W * SCALE), Math.round(L.H * SCALE), +(Q.get('exposure') || 0.62));
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(L.fov, L.W / L.H, 0.05, 20000);
  const uiTex = new THREE.CanvasTexture(ui); uiTex.colorSpace = THREE.SRGBColorSpace; uiTex.anisotropy = 8;
  // lock screen shown while the phone rises (static): navy, big clock, the phoenix
  const lk = document.createElement('canvas'); lk.width = UIW; lk.height = UIH; const lg = lk.getContext('2d');
  lg.fillStyle = gradPaint(lg, 0, 0, 0, UIH, ['#1E2357', '#12163F', '#0B0E2A']); lg.fillRect(0, 0, UIW, UIH);
  rrc(lg, UIW / 2, 48, 176, 50, 25); lg.fillStyle = '#000'; lg.fill();
  lg.font = FT.he7(36); lg.direction = 'rtl'; lg.textAlign = 'center'; lg.fillStyle = 'rgba(255,255,255,.85)'; lg.fillText('יום חמישי, 15 באוקטובר', UIW / 2, 210);
  lg.font = FT.en(190); lg.direction = 'ltr'; lg.fillStyle = '#FFFFFF'; lg.fillText('9:41', UIW / 2, 410);
  if (LOGO) { lg.globalAlpha = 0.9; lg.drawImage(LOGO, UIW / 2 - 110, UIH - 420, 220, 220); lg.globalAlpha = 1; }
  const lockTex = new THREE.CanvasTexture(lk); lockTex.colorSpace = THREE.SRGBColorSpace; lockTex.anisotropy = 8;
  const phone = makePhone({ ...PHONE, bodyColor: '#2B3263' }); scene.add(phone);
  const sea = makeSeaWorld(renderer, scene, { ...SEA, ...JSON.parse(Q.get('sea') || '{}') });
  // the screen rectangle at the phone's rest pose (faces the camera, parallel to the image plane)
  phone.position.set(0, 0, 0); phone.rotation.set(0, 0, 0); camera.position.set(L.camX, L.camY, L.camDist); camera.rotation.set(0, 0, 0); camera.updateMatrixWorld(); phone.updateMatrixWorld();
  const z = phone.userData.screenZ, a = projectPx(phone, camera, new THREE.Vector3(-SW / 2, SH / 2, z), L.W, L.H), b = projectPx(phone, camera, new THREE.Vector3(SW / 2, -SH / 2, z), L.W, L.H);
  const target = { cx: (a.x + b.x) / 2, cy: (a.y + b.y) / 2, w: b.x - a.x, h: b.y - a.y }; target.r = SR / SW * target.w;
  R3 = { renderer, scene, camera, phone, sea, uiTex, lockTex, target };
}
function render3D(t, L) {
  const { renderer, scene, camera, phone, sea, uiTex, lockTex } = R3;
  const p = phonePose(t, L), c = cameraPose(t, L);
  phone.position.set(0, p.y, 0); phone.rotation.set(p.pitch, p.yaw, 0);
  camera.position.set(c.x, c.y, c.z); camera.rotation.set(c.pitch, 0, 0);
  const live = t >= bt(15.8);
  const want = live ? uiTex : lockTex; if (phone.userData.screenMat.map !== want) { phone.userData.screenMat.map = want; phone.userData.screenMat.color.set('#FFFFFF'); phone.userData.screenMat.needsUpdate = true; }
  if (live) uiTex.needsUpdate = true;
  sea.setTime(t); renderer.render(scene, camera);
  return renderer.domElement;
}

/* ---------------- the card: button → card → onto the phone ---------------- */
function cardRect(t, L) {
  const T = R3.target, G = inputGeom(L);
  const heroH = L.H * (L.name === 'h' ? 0.8 : 0.46), heroW = heroH * UIW / UIH;
  const hero = { cx: L.name === 'h' ? L.W * 0.64 : L.W / 2, cy: L.name === 'h' ? L.H / 2 + 10 : L.H * 0.38, w: heroW, h: heroH };
  const start = { cx: L.cx, cy: L.cy, w: G.rb * 2, h: G.rb * 2 };
  const a = spring(t - bt(12), 10, 0.78), b = spring(t - bt(14.6), 16, 1);
  const f = k => start[k] + (hero[k] - start[k]) * a + (T[k] - hero[k]) * b;
  const w = f('w'), h = f('h'), r = Math.min(w, h) / 2 * (1 - clamp(a * 1.4)) + (SR / SW * w) * clamp(a * 1.4);
  return { cx: f('cx'), cy: f('cy'), w, h, r };
}
function drawCard(x, t, L) {
  if (t < bt(12) || t >= bt(16)) return;
  const c = cardRect(t, L);
  card(x, c.cx, c.cy, c.w, c.h, c.r, { fill: K, shadow: 'rgba(3,5,25,.55)', depth: 0.9 * (1 - io3(inv(bt(15), bt(15.85), t))) });
  x.save(); rrc(x, c.cx, c.cy, c.w, c.h, c.r); x.clip();
  x.fillStyle = gradPaint(x, c.cx - c.w / 2, c.cy - c.h / 2, c.cx + c.w / 2, c.cy + c.h / 2, FIRE); x.fillRect(c.cx - c.w / 2, c.cy - c.h / 2, c.w, c.h);
  const open = out3(inv(bt(12) + 0.08, bt(12) + 0.5, t));             // the app opens inside the button (shape, not fade)
  if (open > 0) { circle(x, c.cx, c.cy, open * Math.hypot(c.w, c.h) * 0.52); x.clip(); x.drawImage(ui, c.cx - c.w / 2, c.cy - c.h / 2, c.w, c.h); }
  x.restore();
}

/* ---------------- overlays ---------------- */
function act2Titles(x, t, L) {
  const lines = [['מפרומפט.', bt(17)], ['למוצר.', bt(18.5)], ['לסרטון.', bt(20)]];
  x.save(); x.shadowColor = 'rgba(18,22,63,.35)'; x.shadowBlur = 30; x.shadowOffsetY = 8;
  lines.forEach(([w, t0], i) => riseWords(x, t, [w], 0, L.titleY0 + i * L.titleDY, L.titleSize, FT.he, i === 2 ? W : K, [t0], bt(23.6) + i * 0.03, { right: L.titleR }));
  x.restore();
}
function endCard(x, t, L) {
  if (t < bt(27.4)) return;
  const s = spring(t - bt(27.6), 9, 0.78);
  if (LOGO && s > 0) { const S = L.logoS * s; x.drawImage(LOGO, L.W / 2 - S / 2, L.logoY - S / 2 + (1 - s) * 80, S, S); }
  riseWords(x, t, ['YUV.AI'], L.W / 2, L.wordY, L.wordS, FT.en, W, [bt(28)], null, { ltr: true });
  riseWords(x, t, ["LET'S FLY HIGH"], L.W / 2, L.wordY + (L.name === 'h' ? 96 : 104), L.name === 'h' ? 50 : 52, FT.en, W, [bt(29)], null, { ltr: true, spacing: '14px', gap: 0 });
  riseWords(x, t, ['100% CODE  ·  0 AFTER EFFECTS  ·  MOTION KIT'], L.W / 2, L.H - (L.name === 'h' ? 90 : 230), L.name === 'h' ? 30 : 30, FT.en, BRAND.denim, [bt(30)], null, { ltr: true, spacing: '3px' });
}
function hud(x, t, L) {
  x.save(); x.direction = 'ltr'; x.textAlign = 'left'; x.font = FT.monoB(L.name === 'h' ? 21 : 23); x.fillStyle = t > bt(12) + 0.3 ? 'rgba(255,255,255,.7)' : BRAND.denim;
  x.fillText(`seek(${t.toFixed(3)})  ·  beat ${Math.min(NB, Math.floor(t / B))}/${NB}`, L.name === 'h' ? 40 : 44, L.hudY);
  if (L.name === 'h') { x.font = FT.en(26); x.letterSpacing = '3px'; x.textAlign = 'right'; x.fillText('YUV.AI MOTION KIT', L.W - 40, L.hudY); }
  x.restore();
}

/* ---------------- the film ---------------- */
function draw(x, t, L) {
  screenUI(t);
  x.fillStyle = K; x.fillRect(0, 0, L.W, L.H);
  if (t >= bt(12) && R3) {
    const gl = render3D(t, L), iris = out3(inv(bt(12), bt(12) + 0.38, t)) * coverR(L.W, L.H, L.cx, L.cy);
    x.save(); if (iris < coverR(L.W, L.H, L.cx, L.cy) * 0.999) { circle(x, L.cx, L.cy, iris); x.clip(); } x.drawImage(gl, 0, 0, L.W, L.H); x.restore();
  }
  act1(x, t, L); act1Screen(x, t, L);
  drawCard(x, t, L);
  act2Titles(x, t, L); endCard(x, t, L); hud(x, t, L);
}

mountFilm({
  layouts: LAYOUTS, draw, dur: DUR, clk, extra: { NB, theme: TH.name },
  init: async (L, SCALE, ctx) => {
    LOGO = LOGO_URL ? await new Promise(res => { const im = new Image(); im.onload = () => res(im); im.onerror = () => res(null); im.src = LOGO_URL; }) : null;
    measureCaret(ctx, L);
    await init3D(L, SCALE);
  }
});
