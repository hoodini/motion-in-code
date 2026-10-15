/* =====================================================================
   "תניא" — the book, in motion. A music film, everything drawn in code.
   I    night: inside each of us, two voices (two flames) — who wins? one book answered.
   II   the drop: dawn over the sea, a 3D Tanya opens on the beat; author, first print, five parts;
        the camera pushes into the title page — "כי קרוב אליך הדבר מאד".
   III  eight ideas, one card each (2 bars), each demonstrated by an object:
        two souls · small city · three garments · the beinoni · mind over heart · joy wins ·
        the candle · a dwelling below. Every quote is verbatim (Kehot text) with its chapter.
   IV   the card returns into the page, the book closes on the beat — "ספר של בינונים. כלומר – עליך."
   112 beats @ 128.09 BPM (Mixkit "A New Life"), the song's drop on film beat 16.
   The Alter Rebbe is represented symbolically (medallion "אדה״ז"), never as an invented portrait.
   ===================================================================== */
import { clamp, lerp, inv, out3, in3, io3, spring, sk, clock, rgba, mix, rnd, BRAND, FT, rr, rrc, circle, coverR, riseWords, gradPaint, fitSize, mountFilm } from '../../src/core.js';
import { card, neonRing, slamWords, neonChip, SPECTRUM } from '../../src/ui.js';
import { THREE, makeRenderer, makeTodWorld, rrShape, projectPx } from '../../src/world.js';
import { poseStand, poseSquat, drawPerson } from '../../src/people.js';
import LOGO_URL from '../../brand/logo-square-transparent.png';

const clk = clock(128.09), { B, bt } = clk;
const NB = 112, DUR = NB * B + 1.2;
const NAVY = BRAND.navy, NAVY2 = BRAND.navy2, W = '#FFFFFF', FIRE = BRAND.fire, DENIM = BRAND.denim, ORANGE = BRAND.orange, GOLD = BRAND.gold, CORAL = BRAND.coral;
const PAPER = '#F7F0DE', INK = '#1B1E3F', GOLDG = ['#FFE9A8', '#FFC74E', '#D9962F'];
const SOUL_G = ['#FFFFFF', '#5DE4E9', '#4FA3FF'], SOUL_A = ['#FFD3BF', '#F56B49', '#D74270'];   // divine (cyan) · animal (coral)
const beatPulse = t => Math.exp(-((((t % B) + B) % B) / B) * 5);
const he = (g, s, w = 900) => (g.font = (w === 900 ? FT.he : w === 800 ? FT.he8 : FT.he7)(s), g.direction = 'rtl', g.textAlign = 'right');
const body = (g, s) => (g.font = FT.body(s), g.direction = 'rtl', g.textAlign = 'right');
const en = (g, s, al = 'right') => (g.font = FT.en(s), g.direction = 'ltr', g.textAlign = al);

const LAYOUTS = {
  h: { name: 'h', W: 1920, H: 1080, R: 1800, tY: 190, tS: 112, floor: 880, px: 960, ps: 300, flameDX: 340, flameY: 470,
       fov: 38, offX: 0.82, offY: 0, D0: 4.0, Dpush: 2.0, pushOff: 1, col: { R: 1820, top: 300 },
       card: [960, 548, 1660, 880], demoK: 0.85, colF: 0.44 },
  v: { name: 'v', W: 1080, H: 1920, R: 1010, tY: 300, tS: 104, floor: 1540, px: 540, ps: 420, flameDX: 300, flameY: 980,
       fov: 50, offX: 0, offY: 0.55, D0: 4.7, Dpush: 2.25, pushOff: 0, col: { R: 1010, top: 250 },
       card: [540, 1000, 990, 1660], demoK: 1.12, colF: 1 }
};

/* ============================ shared drawing ============================ */
function flameC(g, cx, cy, s, t, stops, core = '#FFF3C8', { stretch = 1, lean = 0, seed = 0, halo = 1 } = {}) {
  if (s <= 0.5) return;
  const f = (1 + 0.05 * Math.sin(t * 11 + seed) + 0.03 * Math.sin(t * 17 + seed * 2)) * stretch;
  if (halo > 0) { const r = s * 1.9; const hg = g.createRadialGradient(cx, cy, 0, cx, cy, r); hg.addColorStop(0, rgba(stops[1], 0.42 * halo)); hg.addColorStop(1, rgba(stops[1], 0)); g.fillStyle = hg; circle(g, cx, cy, r); g.fill(); }
  g.save(); g.translate(cx, cy + s * 0.3); g.transform(1, 0, lean, 1, 0, 0); g.scale(1, f); g.translate(0, -s * 0.3);
  const path = k => { g.beginPath(); g.moveTo(0, -s * k); g.bezierCurveTo(s * 0.55 * k, -s * 0.35 * k, s * 0.62 * k, s * 0.35 * k, 0, s * 0.62 * k); g.bezierCurveTo(-s * 0.62 * k, s * 0.35 * k, -s * 0.55 * k, -s * 0.2 * k, -s * 0.12 * k, -s * 0.5 * k); g.bezierCurveTo(-s * 0.05 * k, -s * 0.2 * k, 0, -s * 0.4 * k, 0, -s * k); g.closePath(); };
  path(1); g.fillStyle = gradPaint(g, 0, -s, 0, s * 0.6, stops); g.fill();
  g.translate(0, s * 0.2); path(0.5); g.fillStyle = core; g.fill(); g.restore();
}
function medallion(g, cx, cy, r, s = 1) {
  if (s <= 0.001) return;
  g.save(); g.translate(cx, cy); g.scale(s, s);
  circle(g, 0, 0, r * 1.08); g.fillStyle = 'rgba(18,22,63,.25)'; g.fill();
  circle(g, 0, 0, r); g.fillStyle = gradPaint(g, -r, -r, r, r, GOLDG); g.fill();
  circle(g, 0, 0, r * 0.84); g.lineWidth = r * 0.04; g.strokeStyle = 'rgba(120,70,10,.55)'; g.stroke();
  he(g, r * 0.5); g.textAlign = 'center'; g.fillStyle = NAVY; g.fillText('אדה״ז', 0, r * 0.18);
  g.restore();
}
function wrapLines(g, text, font, maxW) {
  g.font = font; const words = text.split(' '), lines = []; let cur = '';
  for (const w of words) { const s = cur ? cur + ' ' + w : w; if (cur && g.measureText(s).width > maxW) { lines.push(cur); cur = w; } else cur = s; }
  if (cur) lines.push(cur); return lines;
}
const P2 = (ox, oy, s, f) => q => [ox + f * q.x * s, oy - q.y * s];

/* ============================ the book's faces (canvases → textures) ============================ */
const PW = 1024, PH = 1434;
const mk = () => { const c = document.createElement('canvas'); c.width = PW; c.height = PH; return c; };
const coverCv = mk(), titleCv = mk(), textCv = [mk(), mk()], endCv = mk();
function drawCover(g, t) {
  g.setTransform(1, 0, 0, 1, 0, 0);
  const bg = g.createRadialGradient(PW * 0.4, PH * 0.35, 50, PW / 2, PH / 2, PH * 0.75); bg.addColorStop(0, '#2A3070'); bg.addColorStop(1, '#10133A'); g.fillStyle = bg; g.fillRect(0, 0, PW, PH);
  for (let i = 0; i < 2600; i++) { g.fillStyle = `rgba(255,255,255,${0.012 + 0.02 * rnd(i * 3.1)})`; g.fillRect(rnd(i) * PW, rnd(i + 99) * PH, 2, 2); }
  const gold = gradPaint(g, 0, 0, PW, PH, GOLDG);
  g.strokeStyle = gold; g.lineWidth = 10; rr(g, 64, 64, PW - 128, PH - 128, 46); g.stroke(); g.lineWidth = 3; rr(g, 92, 92, PW - 184, PH - 184, 30); g.stroke();
  flameC(g, PW / 2, 470, 92, 0.6, GOLDG, '#FFF6D8', { halo: 0 });
  he(g, 300); g.textAlign = 'center'; g.fillStyle = gold; g.fillText('תניא', PW / 2, 860);
  he(g, 78, 800); g.textAlign = 'center'; g.fillText('ליקוטי אמרים', PW / 2, 1010);
  g.fillRect(PW / 2 - 120, 1080, 240, 4);
  body(g, 46); g.textAlign = 'center'; g.fillText('רבי שניאור זלמן מלאדי', PW / 2, 1170);
  // a light sweep that crosses the cover on the beat (finale)
  const q = inv(bt(102), bt(103.6), t);
  if (q > 0 && q < 1) { const x0 = lerp(-PW, PW * 1.6, io3(q)); const sw = g.createLinearGradient(x0, 0, x0 + 420, 300); sw.addColorStop(0, 'rgba(255,255,255,0)'); sw.addColorStop(0.5, 'rgba(255,248,220,.38)'); sw.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = sw; g.fillRect(0, 0, PW, PH); }
}
const VERSE = ['כי', 'קרוב', 'אליך', 'הדבר', 'מאד'];
const VERSE_T = [28.5, 28.5, 29, 29.5, 30];   // beats: each word gets its fire marker
function drawTitlePage(g, t) {
  g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = PAPER; g.fillRect(0, 0, PW, PH);
  const vg = g.createRadialGradient(PW / 2, PH / 2, PH * 0.3, PW / 2, PH / 2, PH * 0.8); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(120,90,40,.16)'); g.fillStyle = vg; g.fillRect(0, 0, PW, PH);
  g.strokeStyle = rgba(INK, 0.55); g.lineWidth = 4; rr(g, 58, 58, PW - 116, PH - 116, 26); g.stroke(); g.lineWidth = 1.5; rr(g, 74, 74, PW - 148, PH - 148, 18); g.stroke();
  const C = (txt, y, font, col = INK) => { g.font = font; g.direction = 'rtl'; g.textAlign = 'center'; g.fillStyle = col; g.fillText(txt, PW / 2, y); };
  C('ספר', 205, FT.he7(54)); C('ליקוטי אמרים', 330, FT.he(116)); C('חלק ראשון הנקרא בשם', 420, FT.body(44)); C('ספר של בינונים', 512, FT.he8(76));
  g.fillStyle = gradPaint(g, PW / 2 - 160, 0, PW / 2 + 160, 0, FIRE); g.fillRect(PW / 2 - 160, 566, 320, 6);
  C('מלוקט מפי ספרים ומפי סופרים', 652, FT.body(40), rgba(INK, 0.85)); C('קדושי עליון נשמתם עדן', 704, FT.body(40), rgba(INK, 0.85));
  C('מיוסד על פסוק', 800, FT.he7(48));
  // the verse, word by word, each with a fire marker on its beat
  g.font = FT.he(84); g.direction = 'rtl'; const gap = 22, ws = VERSE.map(w => g.measureText(w).width), tot = ws.reduce((a, b) => a + b, 0) + gap * (VERSE.length - 1);
  let xr = PW / 2 + tot / 2;
  VERSE.forEach((w, i) => { const m = clamp(spring(t - bt(VERSE_T[i]), 18, 0.6), 0, 1.15); const xl = xr - ws[i];
    if (m > 0.001) { g.fillStyle = gradPaint(g, xl, 0, xr, 0, FIRE); rr(g, xl - 10, 840, (ws[i] + 20) * m, 104, 18); g.fill(); }
    g.fillStyle = INK; g.textAlign = 'left'; g.fillText(w, xl, 918); xr = xl - gap; });
  C('בפיך ובלבבך לעשותו', 1010, FT.he8(62)); C('לבאר היטב איך הוא קרוב מאד', 1102, FT.body(40), rgba(INK, 0.85));
  C('בדרך ארוכה וקצרה', 1172, FT.he7(52)); C('בעזרת ה׳ יתברך', 1238, FT.body(36), rgba(INK, 0.8)); C('סלאוויטא · תקנ״ז', 1330, FT.body(32), rgba(INK, 0.6));
}
function drawTextPage(g, k) {
  g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = PAPER; g.fillRect(0, 0, PW, PH);
  const vg = g.createRadialGradient(PW / 2, PH / 2, PH * 0.3, PW / 2, PH / 2, PH * 0.8); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(120,90,40,.14)'); g.fillStyle = vg; g.fillRect(0, 0, PW, PH);
  he(g, 56, 800); g.textAlign = 'center'; g.fillStyle = INK; g.fillText(k ? 'פרק ב' : 'פרק א', PW / 2, 180);
  g.fillStyle = gradPaint(g, PW / 2 - 70, 0, PW / 2 + 70, 0, FIRE); g.fillRect(PW / 2 - 70, 214, 140, 5);
  let y = 290; for (let i = 0; i < 28; i++) { const par = (i + k * 3) % 9 === 8, w = par ? 380 + 260 * rnd(i + k * 50) : 780 - 50 * rnd(i * 7 + k); rr(g, PW - 120 - w, y, w, 16, 8); g.fillStyle = rgba(INK, 0.26); g.fill(); y += par ? 64 : 38; }
}
function drawEndpaper(g) {
  g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = NAVY2; g.fillRect(0, 0, PW, PH);
  g.strokeStyle = 'rgba(255,199,78,.14)'; g.lineWidth = 3; for (let i = -PH; i < PW; i += 46) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i + PH, PH); g.stroke(); }
  for (let i = 0; i < 40; i++) { const x = (i % 5 + 0.5) * PW / 5, y = (Math.floor(i / 5) + 0.5) * PH / 8; flameC(g, x, y, 22, i, GOLDG, '#FFF6D8', { halo: 0 }); }
}

/* ============================ 3D: the book ============================ */
const BK = { W: 1.0, H: 1.4, T: 0.24, ct: 0.04 };
function planarUV(geo, w, h) { const p = geo.attributes.position, uv = new Float32Array(p.count * 2); for (let i = 0; i < p.count; i++) { uv[i * 2] = (p.getX(i) + w / 2) / w; uv[i * 2 + 1] = (p.getY(i) + h / 2) / h; } geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); return geo; }
function texOf(cv) { const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; }
function makeBook() {
  const { W: bw, H: bh, T, ct } = BK, book = new THREE.Group(), hinge = new THREE.Group(); hinge.position.set(bw / 2, 0, T / 2); book.add(hinge);
  const leather = new THREE.MeshPhysicalMaterial({ color: '#1A1F55', roughness: 0.55, metalness: 0.05, clearcoat: 0.35, clearcoatRoughness: 0.4 });
  const board = () => { const g = new THREE.ExtrudeGeometry(rrShape(bw, bh, 0.035), { depth: ct - 0.012, bevelEnabled: true, bevelThickness: 0.006, bevelSize: 0.006, bevelSegments: 3, curveSegments: 10 }); g.translate(-bw / 2, 0, -ct + 0.006); return g; };
  // front cover on its own pivot (rotation.y = θ: 0 closed → π open, it swings toward the camera and lands on the right)
  const coverPivot = new THREE.Group(); hinge.add(coverPivot);
  coverPivot.add(new THREE.Mesh(board(), leather));
  const coverTex = texOf(coverCv), coverMat = new THREE.MeshPhysicalMaterial({ map: coverTex, roughness: 0.42, metalness: 0.1, clearcoat: 0.5, clearcoatRoughness: 0.3 });
  const front = new THREE.Mesh(planarUV(new THREE.ShapeGeometry(rrShape(bw - 0.01, bh - 0.01, 0.03), 10), bw - 0.01, bh - 0.01), coverMat); front.position.set(-bw / 2, 0, 0.0012); coverPivot.add(front);
  const endTex = texOf(endCv), inner = new THREE.Mesh(planarUV(new THREE.ShapeGeometry(rrShape(bw - 0.03, bh - 0.03, 0.025), 10), bw - 0.03, bh - 0.03), new THREE.MeshBasicMaterial({ map: endTex, toneMapped: false }));
  inner.rotation.y = Math.PI; inner.position.set(-bw / 2, 0, -ct - 0.0012); coverPivot.add(inner);
  // back cover + spine
  const back = new THREE.Mesh(board(), leather); back.position.z = -T + ct; hinge.add(back);
  const spine = new THREE.Mesh(new THREE.BoxGeometry(0.05, bh, T), leather); spine.position.set(0.0, 0, -T / 2); hinge.add(spine);
  const band = new THREE.MeshPhysicalMaterial({ color: '#E2A93C', metalness: 1, roughness: 0.3 });
  [-0.5, -0.42, 0.42, 0.5].forEach(y => { const m = new THREE.Mesh(new THREE.BoxGeometry(0.054, 0.012, T + 0.004), band); m.position.set(0, y, -T / 2); hinge.add(m); });
  // the page block
  const pw = bw - 0.035, ph = bh - 0.045, blockD = T - 2 * ct - 0.016;
  const paperEdge = new THREE.MeshStandardMaterial({ color: '#EADFC4', roughness: 0.95 });
  const blockTex = texOf(textCv[1]), blockFace = new THREE.MeshBasicMaterial({ map: blockTex, toneMapped: false });
  const block = new THREE.Mesh(new THREE.BoxGeometry(pw, ph, blockD), [paperEdge, paperEdge, paperEdge, paperEdge, blockFace, paperEdge]);
  block.position.set(-pw / 2 - 0.006, 0, -ct - 0.014 - blockD / 2); hinge.add(block);
  // loose pages that riffle on the beat. page i sits behind the cover at z = -(ct + e_i); flipped by π it lands in front of the cover's inside
  const titleTex = texOf(titleCv), textTex = textCv.map(texOf), pages = [];
  for (let i = 0; i < 8; i++) {
    const pv = new THREE.Group(); hinge.add(pv);
    const e = 0.002 + 0.0011 * i, fm = new THREE.MeshBasicMaterial({ map: i === 0 ? titleTex : textTex[i % 2], toneMapped: false }), bm = new THREE.MeshBasicMaterial({ map: textTex[(i + 1) % 2], toneMapped: false });
    const geo = planarUV(new THREE.PlaneGeometry(pw, ph), pw, ph);
    const f = new THREE.Mesh(geo, fm); f.position.set(-pw / 2 - 0.006, 0, -(ct + e)); pv.add(f);
    const b = new THREE.Mesh(geo, bm); b.rotation.y = Math.PI; b.position.set(-pw / 2 - 0.006, 0, -(ct + e) - 0.0004); pv.add(b);
    pages.push({ pv, fm, bm, front: f });
  }
  book.userData = { coverPivot, pages, coverTex, titleTex, pw, ph };
  return book;
}

/* ============================ the 3D world + camera ============================ */
let R3 = null, LOGO = null;
async function init3D(L, SCALE) {
  const renderer = makeRenderer(Math.round(L.W * SCALE), Math.round(L.H * SCALE), 0.8), scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(L.fov, L.W / L.H, 0.02, 20000);
  const world = makeTodWorld(renderer, scene, {});
  drawCover(coverCv.getContext('2d'), 0); drawEndpaper(endCv.getContext('2d')); textCv.forEach((c, k) => drawTextPage(c.getContext('2d'), k)); drawTitlePage(titleCv.getContext('2d'), 0);
  const book = makeBook(); scene.add(book);
  R3 = { renderer, scene, camera, world, book };
}
const PI_OPEN = Math.PI * 0.985, FACE = { title: 0, cover: 0 };
const coverAngle = t => PI_OPEN * (clamp(spring(t - bt(18), 9, 0.62), 0, 1.06) - clamp(spring(t - bt(98), 13, 0.85), 0, 1.02));
const pageAngle = (t, i) => PI_OPEN * (clamp(spring(t - bt(22 + 0.5 * i), 14, 0.72), 0, 1.04) - clamp(spring(t - bt(26 + 0.25 * (7 - i)), 16, 0.8), 0, 1.03));
const todAt = t => sk(t, [[-1, 0.92], [bt(16.5), 0.92], [bt(19), 0.02], [bt(96), 0.02], [bt(100), 0.28]], 1.2, 1);
function camState(t, L) {
  // look target (book space): closed centre x=0 → open spread centre x=0.5 → title page x=0 (push) → … → closed
  const tx = sk(t, [[-1, 0], [bt(18.2), 0.5], [bt(28), 0], [bt(94.8), 0.5], [bt(98), 0]], 5, 1);
  const off = sk(t, [[-1, 1], [bt(28), L.pushOff], [bt(94.8), 1]], 5, 1);                // layout offset (book left / lower)
  const D = sk(t, [[-1, L.D0 + 0.7], [bt(16), L.D0], [bt(28), L.Dpush], [bt(94.8), L.D0], [bt(100), L.D0 - 0.45]], 4.5, 1);
  const crane = sk(t, [[-1, 0], [bt(32), 1], [bt(94.6), 0]], 4.2, 1);
  const pitch = sk(t, [[-1, 1], [bt(28), 0], [bt(94.8), 1]], 5, 1);
  const orbit = 0.18 * Math.sin(t * 0.22) * (1 - clamp(inv(bt(27), bt(28.5), t)) + clamp(inv(bt(94.8), bt(96.5), t)));
  return { lx: tx + L.offX * off * (D / L.D0) + orbit, ly: L.offY * off, D, crane, pitch };
}
function render3D(t, L) {
  const { renderer, scene, camera, world, book } = R3, u = book.userData;
  world.update(t, todAt(t));
  u.coverPivot.rotation.y = coverAngle(t);
  u.pages.forEach((p, i) => { const a = pageAngle(t, i); p.pv.rotation.y = a; const sh = 1 - 0.22 * Math.sin(Math.min(a, Math.PI)); p.fm.color.setScalar(sh); p.bm.color.setScalar(sh); });
  const tk = t < bt(27) ? 0 : t < bt(33) ? t : 1, ck = t > bt(101.8) && t < bt(103.8) ? t : 0;
  if (tk !== FACE.title) { drawTitlePage(titleCv.getContext('2d'), tk === 1 ? bt(33) : tk); u.titleTex.needsUpdate = true; FACE.title = tk; }
  if (ck !== FACE.cover) { drawCover(coverCv.getContext('2d'), ck); u.coverTex.needsUpdate = true; FACE.cover = ck; }
  const thump = sk(t, [[-1, 1], [bt(98.25), 1.035], [bt(98.25) + 0.1, 1]], 22, 0.5); book.scale.setScalar(thump);
  placeCamera(camera, camState(t, L));
  renderer.render(scene, camera);
  return renderer.domElement;
}
function placeCamera(camera, C) { camera.position.set(C.lx, C.ly - 0.75 * C.pitch + 6 * C.crane, C.D + 1.5 * C.crane); camera.lookAt(C.lx, C.ly + 0.05 * C.pitch + 9.5 * C.crane, 0); camera.updateMatrixWorld(); }
/** the title page's rect on screen (for the 2D card that grows out of it / returns into it); tCam = use the camera of that moment */
function pageRect(L, tCam = null) {
  const { camera, book, scene } = R3, f = book.userData.pages[0].front, { pw, ph } = book.userData;
  const keep = tCam == null ? null : [camera.position.clone(), camera.quaternion.clone()];
  if (tCam != null) placeCamera(camera, camState(tCam, L));
  scene.updateMatrixWorld(); camera.updateMatrixWorld();
  const pts = [[-pw / 2, ph / 2], [pw / 2, ph / 2], [-pw / 2, -ph / 2], [pw / 2, -ph / 2]].map(([a, b]) => projectPx(f, camera, new THREE.Vector3(a, b, 0), L.W, L.H));
  if (keep) { camera.position.copy(keep[0]); camera.quaternion.copy(keep[1]); camera.updateMatrixWorld(); }
  const xs = pts.map(p => p.x), ys = pts.map(p => p.y), x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  return { cx: (x0 + x1) / 2, cy: (y0 + y1) / 2, w: x1 - x0, h: y1 - y0 };
}

/* ============================ ACT I: night — two voices ============================ */
function night(x, t, L) {
  const g = x.createLinearGradient(0, 0, 0, L.H); g.addColorStop(0, '#080B26'); g.addColorStop(0.75, NAVY); g.addColorStop(1, '#1B2160'); x.fillStyle = g; x.fillRect(0, 0, L.W, L.H);
  for (let i = 0; i < 140; i++) { const sx = rnd(i * 1.7) * L.W, sy = rnd(i * 3.3 + 7) * L.H * 0.8, tw = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(t * (1 + rnd(i) * 2) + i)); x.fillStyle = `rgba(255,255,255,${0.12 + 0.5 * tw * rnd(i + 3)})`; circle(x, sx, sy, 1 + 1.6 * rnd(i + 11)); x.fill(); }
  const fl = x.createRadialGradient(L.px, L.floor, 10, L.px, L.floor, L.W * 0.5); fl.addColorStop(0, 'rgba(175,203,239,.16)'); fl.addColorStop(1, 'rgba(175,203,239,0)'); x.fillStyle = fl; x.fillRect(0, L.floor - 200, L.W, L.H);
}
const chest = (L) => ({ x: L.px + 0.06 * L.ps, y: L.floor - 1.32 * L.ps });
function actOne(x, t, L) {
  night(x, t, L);
  // the person (comes up on b0)
  const ps = spring(t - bt(0.1), 9, 0.7);
  if (ps > 0.001) { x.save(); x.translate(L.px, L.floor); x.scale(1, clamp(ps, 0, 1.1)); x.translate(-L.px, -L.floor);
    drawPerson(x, poseStand(t), L.px, L.floor, L.ps, { skin: '#D9A882', hair: '#1D1A2B', top: '#5EA1C1', bottom: '#2A3170', shoe: '#E9EEF8', hairStyle: 'short', shade: '#0B0E2A' }); x.restore(); }
  // two flames, the two voices
  const C = chest(L), merge = io3(inv(bt(12), bt(13), t));
  const sides = [{ dx: L.flameDX, stops: SOUL_G, core: '#F2FEFF', beats: [5, 7], lines: ['קום.', 'תאיר.'], t0: 1.6 }, { dx: -L.flameDX, stops: SOUL_A, core: '#FFE4D8', beats: [4, 6], lines: ['עוד חמש דקות.', 'לא היום.'], t0: 1.2 }];
  sides.forEach((S, k) => {
    const pop = spring(t - bt(S.t0), 14, 0.5), kick = S.beats.reduce((a, b) => a + 0.4 * Math.exp(-Math.max(0, t - bt(b)) * 7) * (t >= bt(b) ? 1 : 0), 0);
    const fx = lerp(L.px + S.dx, C.x, merge), fy = lerp(L.flameY, C.y, merge), size = 70 * pop * (1 + kick) * (1 - 0.55 * merge) * (L.name === 'v' ? 1.25 : 1);
    if (t < bt(13.05)) flameC(x, fx, fy, size, t, S.stops, S.core, { seed: k * 3 });
    // the voice
    S.beats.forEach((b, j) => { const tOut = j === 0 ? bt(S.beats[1]) - 0.05 : bt(8); if (t < bt(b) || t > tOut + 0.25) return; const o = in3(inv(tOut, tOut + 0.2, t));
      x.save(); const cx = L.px + S.dx, cy = L.flameY - (L.name === 'v' ? 190 : 150); x.translate(cx, cy); x.scale(1 - o, 1 - o);
      neonChip(x, t, bt(b), 0, 0, S.lines[j], { size: L.name === 'v' ? 40 : 36, fontFn: FT.he, fill: k === 0 ? '#EFFFFF' : '#FFF1EA', ink: NAVY, angle: t * 1.6 + k * 2, padX: 30 }); x.restore(); });
  });
  // one flame at the heart, beating
  if (t >= bt(13)) {
    const hb = [13, 14, 15].reduce((a, b) => a + (t >= bt(b) ? 0.38 * Math.exp(-(t - bt(b)) * 8) : 0), 0);
    const rise = io3(inv(bt(15.3), bt(15.95), t)), fx = lerp(C.x, L.W / 2, rise), fy = lerp(C.y, L.H / 2, rise);
    const s0 = spring(t - bt(13), 14, 0.5) * 62 * (1 + hb) * (1 - 0.65 * rise) * (L.name === 'v' ? 1.25 : 1);
    [13, 14, 15].forEach(b => { const q = inv(bt(b), bt(b) + 0.45, t); if (q > 0 && q < 1) { circle(x, C.x, C.y, 30 + 220 * out3(q)); x.lineWidth = 6 * (1 - q); x.strokeStyle = rgba(GOLD, 0.8 * (1 - q)); x.stroke(); } });
    flameC(x, fx, fy, s0, t, FIRE, '#FFF3C8', { seed: 5, halo: 1.3 });
  }
  // titles
  const R = L.R, y = L.tY, S = L.tS, mk = (lo, hi) => gradPaint(x, R - lo, 0, R, 0, FIRE);
  riseWords(x, t, ['בתוך', 'כל', 'אחד', 'מאיתנו'], 0, y - S * 0.95, S * 0.42, FT.he7, DENIM, [bt(0.3), bt(0.42), bt(0.54), bt(0.66)], bt(3.4), { right: R });
  slamWords(x, t, ['שני', 'קולות.'], 0, y, S, FT.he, W, [bt(1), bt(1.5)], bt(3.5), { right: R, colors: [NAVY, W], marker: { i: 0, paint: mk(260) } });
  slamWords(x, t, ['מי', 'מנצח?'], 0, y, S, FT.he, W, [bt(8), bt(8.5)], bt(9.6), { right: R });
  riseWords(x, t, ['לפני', '230', 'שנה,'], 0, y - S * 0.95, S * 0.42, FT.he7, DENIM, [bt(10), bt(10.12), bt(10.24)], bt(15.2), { right: R });
  slamWords(x, t, ['ספר', 'אחד', 'ענה.'], 0, y, S, FT.he, W, [bt(10.5), bt(10.75), bt(11)], bt(15.25), { right: R, colors: [W, NAVY, W], marker: { i: 1, paint: mk(560) } });
}

/* ============================ ACT II: the book at dawn ============================ */
const glowText = (x, fn) => { x.save(); x.shadowColor = 'rgba(255,255,255,.75)'; x.shadowBlur = 22; fn(); x.restore(); };
function actTwo(x, t, L) {
  const R = L.col.R, Y = L.col.top, v = L.name === 'v', s = v ? 1 : 1;
  const fp = gradPaint(x, R - 400, 0, R, 0, FIRE);
  glowText(x, () => {
    slamWords(x, t, ['תניא.'], 0, Y + 40, v ? 176 : 168, FT.he, NAVY, [bt(16.4)], bt(21.55), { right: R });
    riseWords(x, t, ['ליקוטי', 'אמרים', '·', 'ספר', 'של', 'בינונים'], 0, Y + 125, v ? 44 : 42, FT.he7, NAVY, [17, 17.1, 17.2, 17.3, 17.4, 17.5].map(bt), bt(21.5), { right: R });
  });
  // the author, symbolically
  const my = Y + (v ? 250 : 270), mx = R - 62, ms = spring(t - bt(18.6), 15, 0.5) * (1 - in3(inv(bt(21.5), bt(21.75), t)));
  if (t > bt(18.5) && t < bt(21.8)) medallion(x, mx, my, 58, ms);
  glowText(x, () => {
    slamWords(x, t, ['רבי', 'שניאור', 'זלמן'], 0, my + 4, v ? 54 : 52, FT.he, NAVY, [bt(19), bt(19.2), bt(19.4)], bt(21.5), { right: R - 140 });
    riseWords(x, t, ['מלאדי', '·', '1745–1812'], 0, my + 58, v ? 36 : 34, FT.he7, rgba(NAVY, 0.85), [bt(19.6), bt(19.65), bt(19.7)], bt(21.5), { right: R - 140 });
    riseWords(x, t, ['נדפס', 'לראשונה:'], 0, my + (v ? 160 : 175), v ? 40 : 38, FT.he7, NAVY, [bt(20), bt(20.1)], bt(21.5), { right: R });
    slamWords(x, t, ['סלאוויטא,', '1796.'], 0, my + (v ? 250 : 265), v ? 76 : 72, FT.he, NAVY, [bt(20.5), bt(20.9)], bt(21.55), { right: R, colors: [NAVY, NAVY], marker: { i: 1, paint: gradPaint(x, R - 600, 0, R, 0, FIRE) } });
  });
  // five parts — one chip per 8th note while the pages riffle
  glowText(x, () => slamWords(x, t, ['5', 'חלקים.'], 0, Y + 40, v ? 120 : 112, FT.he, NAVY, [bt(22), bt(22.3)], bt(27.55), { right: R, marker: { i: 0, paint: fp } }));
  const parts = ['ליקוטי אמרים · 53 פרקים', 'שער היחוד והאמונה', 'אגרת התשובה', 'אגרת הקודש', 'קונטרס אחרון'];
  parts.forEach((p, i) => { const t0 = bt(22.5 + 0.5 * i); if (t < t0 || t > bt(27.8)) return; const o = in3(inv(bt(27.3) + i * 0.03, bt(27.55) + i * 0.03, t));
    x.save(); x.font = FT.he8(v ? 36 : 34); const tw = x.measureText(p).width, cw = tw + 64, cx = R - cw / 2 - (v ? 0 : 0), cy = Y + (v ? 150 : 150) + i * (v ? 74 : 72);
    x.translate(cx, cy); x.scale(1 - o, 1 - o); x.translate(-cx, -cy); neonChip(x, t, t0, cx, cy, p, { size: v ? 36 : 34, fontFn: FT.he8, angle: t * 1.4 + i, padX: 32 });
    x.save(); x.font = FT.en(30); x.direction = 'ltr'; x.textAlign = 'center'; x.fillStyle = ORANGE; const nx = cx - cw / 2 - 34; const s2 = spring(t - t0 - 0.05, 18, 0.5); if (s2 > 0.01) { x.translate(nx, cy); x.scale(s2, s2); circle(x, 0, 0, 24); x.fillStyle = NAVY; x.fill(); x.fillStyle = GOLD; x.fillText(String(i + 1), 0, 11); } x.restore();
    x.restore(); });
  // the push into the title page: one verse holds the whole book
  if (v) {
    glowText(x, () => riseWords(x, t, ['כל', 'הספר', 'מיוסד', 'על', 'פסוק', 'אחד:'], L.W / 2, 175, 54, FT.he, NAVY, [28, 28.08, 28.16, 28.24, 28.32, 28.4].map(bt), bt(31.6), {}));
    glowText(x, () => slamWords(x, t, ['8', 'רעיונות', 'ממנו.'], L.W / 2, L.H - 150, 84, FT.he, NAVY, [bt(30.5), bt(30.75), bt(31)], bt(31.75), { marker: { i: 0, paint: gradPaint(x, L.W / 2 - 300, 0, L.W / 2 + 300, 0, FIRE) } }));
  } else {
    riseWords(x, t, ['כל', 'הספר'], 0, 330, 76, FT.he, W, [bt(28), bt(28.1)], bt(31.6), { right: R - 60 });
    riseWords(x, t, ['מיוסד', 'על', 'פסוק'], 0, 425, 76, FT.he, W, [bt(28.25), bt(28.35), bt(28.45)], bt(31.6), { right: R - 60 });
    slamWords(x, t, ['אחד.'], 0, 560, 130, FT.he, NAVY, [bt(28.7)], bt(31.6), { right: R - 60, marker: { i: 0, paint: gradPaint(x, R - 400, 0, R, 0, FIRE) } });
    slamWords(x, t, ['8', 'רעיונות', 'ממנו.'], 0, 800, 84, FT.he, W, [bt(30.5), bt(30.75), bt(31)], bt(31.75), { right: R - 60, colors: [NAVY, W, W], marker: { i: 0, paint: gradPaint(x, R - 700, 0, R, 0, FIRE) } });
  }
}

/* ============================ ACT III: eight ideas ============================ */
const IDEAS = [
  { ch: 'פרקים א–ב', title: ['שתי', 'נפשות.'], sub: 'אחת מחיה את הגוף. השנייה – חלק אלוה ממעל.', quote: 'ונפש השנית בישראל, היא חלק אלוה ממעל ממש', src: 'פרק ב׳', dark: true },
  { ch: 'פרק ט׳', title: ['עיר', 'קטנה.'], sub: 'הגוף – ושני מלכים שנלחמים עליו.', quote: 'כי הגוף נקרא ״עיר קטנה״, וכמו ששני מלכים נלחמים על עיר אחת', src: 'פרק ט׳', dark: false },
  { ch: 'פרק ד׳', title: ['שלושה', 'לבושים.'], sub: 'הנפש פועלת דרך מחשבה, דיבור ומעשה.', quote: 'שלשה לבושים, שהם מחשבה דבור ומעשה', src: 'פרק ד׳', dark: true },
  { ch: 'פרקים יב–יד', title: ['הבינוני.'], sub: 'הרע עוד חי בלב – אבל לא מגיע למעשה.', quote: 'מדת הבינוני, היא מדת כל אדם ואחריה כל אדם ימשוך', src: 'פרק י״ד', dark: false },
  { ch: 'פרק י״ב', title: ['המוח', 'שליט', 'על', 'הלב.'], sub: 'התאווה בלב. ההחלטה במוח.', quote: 'שכל אדם יכול ברצונו שבמוחו להתאפק ולמשול ברוח תאותו שבלבו', src: 'פרק י״ב', dark: true },
  { ch: 'פרק כ״ו', title: ['השמחה', 'מנצחת.'], sub: 'גם החזק נופל – כשהוא כבד ועצוב.', quote: 'אם האחד הוא בעצלות וכבדות – ינוצח בקל ויפול גם אם הוא גבור יותר מחבירו', src: 'פרק כ״ו', dark: false },
  { ch: 'פרק י״ט', title: ['נר', 'ה׳', 'נשמת', 'אדם.'], sub: 'הנשמה כמו להבה – תמיד נמשכת למעלה.', quote: 'כאור הנר שמתנענע תמיד למעלה בטבעו', src: 'פרק י״ט', dark: true },
  { ch: 'פרק ל״ו', title: ['דירה', 'בתחתונים.'], sub: 'המטרה: להפוך את העולם הזה לבית.', quote: 'שנתאוה הקדוש ברוך הוא להיות לו דירה בתחתונים', src: 'פרק ל״ו', dark: false }
];
const IDEA_T0 = i => 32 + 8 * i;
function cardRect(t, L) {
  const [cx, cy, w, h] = L.card, inE = spring(t - bt(32), 8, 0.86), outE = spring(t - bt(95.6), 9, 0.95);
  const live = { cx, cy, w, h };
  if (t < bt(32) || t > bt(97.6)) return null;
  const P0 = pageRect(L, bt(32));                 // grows out of the page as it was at the end of the push
  const a = inE < 1 ? { cx: lerp(P0.cx, cx, clamp(inE)), cy: lerp(P0.cy, cy, clamp(inE)), w: lerp(P0.w, w, inE), h: lerp(P0.h, h, inE) } : live;
  if (t < bt(95.6)) return { ...a, k: inE, out: 0 };
  const Pf = pageRect(L, bt(97.6)), Pl = pageRect(L), u = clamp(inv(0.6, 1, outE)), P = { cx: lerp(Pf.cx, Pl.cx, u), cy: lerp(Pf.cy, Pl.cy, u), w: lerp(Pf.w, Pl.w, u), h: lerp(Pf.h, Pl.h, u) };
  return { cx: lerp(a.cx, P.cx, clamp(outE)), cy: lerp(a.cy, P.cy, clamp(outE)), w: lerp(a.w, P.w, clamp(outE)), h: lerp(a.h, P.h, clamp(outE)), k: 1, out: clamp(outE) };
}
function ideas(x, t, L) {
  const Cr = cardRect(t, L); if (!Cr) return;
  const flips = [40, 48, 56, 64, 72, 80, 88]; let sx = 1, idx = 0;
  flips.forEach((b, i) => { const u = clamp((t - bt(b)) / bt(0.5)); if (u > 0 && u < 1) sx = Math.abs(Math.cos(Math.PI * u)); if (u >= 0.5) idx = i + 1; });
  const I = IDEAS[idx], dark = I.dark, fill0 = dark ? NAVY : W;
  const fill = Cr.out > 0 ? mix(fill0, PAPER, inv(0, 0.6, Cr.out)) : (Cr.k < 1 ? mix(PAPER, fill0, inv(0.15, 0.6, Cr.k)) : fill0);
  x.save(); x.translate(Cr.cx, Cr.cy); x.scale(sx, 1); x.translate(-Cr.cx, -Cr.cy);
  const r = 48 * clamp(Cr.k) * (1 - Cr.out);                  // square like the page at both ends of the morph
  card(x, Cr.cx, Cr.cy, Cr.w, Cr.h, r, { fill, shadow: 'rgba(14,30,80,.42)', depth: 0.9 * clamp(Cr.k) * (1 - Cr.out) });
  const pageA = Math.max(1 - inv(0.08, 0.42, Cr.k), inv(0.35, 0.85, Cr.out));   // the title page itself, at both ends
  if (pageA > 0.001) { x.save(); x.globalAlpha = pageA; x.drawImage(titleCv, Cr.cx - Cr.w / 2, Cr.cy - Cr.h / 2, Cr.w, Cr.h); x.restore(); }
  const content = clamp(inv(0.55, 0.9, Cr.k)) * (1 - clamp(inv(0, 0.25, Cr.out)));
  if (content > 0.01) {
    x.save(); rrc(x, Cr.cx, Cr.cy, Cr.w, Cr.h, r); x.clip();
    const sc = content; x.translate(Cr.cx, Cr.cy); x.scale(Cr.w / L.card[2] * (0.92 + 0.08 * sc), Cr.h / L.card[3] * (0.92 + 0.08 * sc)); x.translate(-L.card[0], -L.card[1]);
    ideaContent(x, t, L, idx);
    x.restore();
  }
  x.restore();
}
function ideaContent(x, t, L, i) {
  const I = IDEAS[i], T0 = IDEA_T0(i), v = L.name === 'v', [cx, cy, w, h] = L.card, X0 = cx - w / 2, Y0 = cy - h / 2;
  const ink = I.dark ? W : NAVY, soft = I.dark ? DENIM : rgba(NAVY, 0.72), k = L.demoK;
  const R = X0 + w - (v ? 56 : 70), colW = v ? w - 112 : w * L.colF;
  // folio numeral (magazine)
  en(x, v ? 300 : 340, 'left'); x.fillStyle = I.dark ? 'rgba(255,255,255,.06)' : 'rgba(18,22,63,.06)'; x.fillText(String(i + 1).padStart(2, '0'), X0 + 40, Y0 + (v ? 300 : 330));
  // chapter chip
  const cs = spring(t - bt(T0 + 0.3), 18, 0.5);
  if (cs > 0.01) { x.save(); he(x, v ? 30 : 28, 800); const tw = x.measureText('תניא · ' + I.ch).width, cw = tw + 44, ccx = R - cw / 2, ccy = Y0 + (v ? 70 : 66); x.translate(ccx, ccy); x.scale(cs, cs); rrc(x, 0, 0, cw, v ? 54 : 50, 27); x.fillStyle = gradPaint(x, -cw / 2, 0, cw / 2, 0, FIRE); x.fill(); x.fillStyle = NAVY; x.textAlign = 'center'; x.fillText('תניא · ' + I.ch, 0, v ? 11 : 10); x.restore(); }
  const tS = v ? 96 : 88, tY = Y0 + (v ? 190 : 180);
  slamWords(x, t, I.title, 0, tY, tS, FT.he, ink, I.title.map((_, j) => bt(T0 + 0.4 + 0.25 * j)), null, { right: R, maxW: colW, colors: I.title.map((_, j) => j === I.title.length - 1 && I.title.length > 1 ? NAVY : ink), marker: I.title.length > 1 ? { i: I.title.length - 1, paint: gradPaint(x, R - colW, 0, R, 0, FIRE) } : { i: 0, paint: gradPaint(x, R - colW, 0, R, 0, FIRE) } });
  if (I.title.length === 1) { /* single word: marker under it, ink on marker */ }
  const subS = fitSize(x, I.sub, FT.he7, v ? 42 : 38, colW);
  riseWords(x, t, [I.sub], 0, tY + (v ? 82 : 76), subS, FT.he7, soft, [bt(T0 + 1)], null, { right: R });
  // quote (verbatim) + source
  const qS = v ? 36 : 32, lines = wrapLines(x, '„' + I.quote + '"', FT.body(qS), colW);
  const qY = v ? Y0 + h - 120 - lines.length * qS * 1.4 : Y0 + h - 110 - lines.length * qS * 1.4;
  if (t > bt(T0 + 2.5)) { x.save(); x.fillStyle = I.dark ? 'rgba(255,255,255,.18)' : 'rgba(18,22,63,.14)'; const bh = out3(inv(bt(T0 + 2.5), bt(T0 + 2.9), t)) * (lines.length * qS * 1.4 + 20); x.fillRect(R + 16, qY - qS, 5, bh); x.restore(); }
  lines.forEach((ln, j) => riseWords(x, t, [ln], 0, qY + j * qS * 1.4, qS, FT.body, ink, [bt(T0 + 2.5 + 0.12 * j)], null, { right: R }));
  riseWords(x, t, ['—', 'תניא,', I.src], 0, qY + lines.length * qS * 1.4 + 6, v ? 30 : 28, FT.he7, ORANGE, [bt(T0 + 3), bt(T0 + 3.05), bt(T0 + 3.1)], null, { right: R });
  // the demonstration
  const dx = v ? cx : X0 + w * 0.28, dy = v ? Y0 + 880 : Y0 + h * 0.54;
  DEMOS[i](x, t, L, dx, dy, k, T0, I);
}
const lb = (t, T0) => (t - bt(T0)) / B;   // local beats into the idea
const DEMOS = [
  // 1 · two souls: two flames, each kicks on its own beats
  (x, t, L, dx, dy, k, T0) => {
    [[1, SOUL_G, '#F2FEFF', 'נפש אלוקית', 1], [-1, SOUL_A, '#FFE4D8', 'נפש בהמית', 1.5]].forEach(([sd, st, core, lab, b0], j) => {
      const p = spring(t - bt(T0 + b0), 14, 0.5), kick = [2, 3, 4, 5, 6, 7].filter(b => (b + j) % 2 === 0).reduce((a, b) => a + (t >= bt(T0 + b) ? 0.3 * Math.exp(-(t - bt(T0 + b)) * 7) : 0), 0);
      const fx = dx + sd * 190 * k, fy = dy - 30 * k; flameC(x, fx, fy, 150 * k * p * (1 + kick), t, st, core, { seed: j * 4 });
      if (p > 0.05) riseWords(x, t, [lab], fx, fy + 200 * k, 46 * k, FT.he, W, [bt(T0 + b0 + 0.3)], null, {});
    });
  },
  // 2 · the small city: windows switch sides, beat by beat
  (x, t, L, dx, dy, k, T0) => {
    k *= L.name === 'v' ? 0.86 : 1;
    const ws = [70, 92, 64, 112, 84, 96, 66], hs = [170, 250, 140, 320, 210, 236, 160], tot = ws.reduce((a, b) => a + b, 0) + 6 * 10;
    let bx = dx - tot * k / 2; const base = dy + 170 * k, rise = spring(t - bt(T0 + 0.6), 10, 0.6);
    const n = Math.floor(lb(t, T0)), side = n >= 1 ? (n % 2 ? 1 : -1) : 0;
    ws.forEach((bw, i) => { const bh = hs[i] * k * clamp(rise, 0, 1.15), X = bx, wv = bw * k;
      rr(x, X, base - bh, wv, bh, 14 * k); x.fillStyle = NAVY; x.fill();
      const cols = bw > 80 ? 3 : 2, rows = Math.floor(hs[i] / 44);
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) { const wx = X + (c + 0.5) * wv / cols - 8 * k, wy = base - bh + 22 * k + r * 44 * k; if (wy > base - 30 * k) continue;
        const sweep = side === 1 ? (ws.length - i) : i + 1, tl = bt(T0 + n) + sweep * 0.018, on = t >= tl ? clamp(spring(t - tl, 18, 0.7)) : 0;
        x.fillStyle = side === 0 ? 'rgba(255,255,255,.18)' : mix(n % 2 ? CORAL : '#5DE4E9', n % 2 ? '#5DE4E9' : CORAL, on); rr(x, wx, wy, 16 * k, 22 * k, 4 * k); x.fill(); }
      bx += (bw + 10) * k; });
    rr(x, dx - (tot / 2 + 60) * k, base, (tot + 120) * k, 8 * k, 4 * k); x.fillStyle = NAVY; x.fill();
    [[1, SOUL_G, '#F2FEFF'], [-1, SOUL_A, '#FFE4D8']].forEach(([sd, st, core], j) => { const p = spring(t - bt(T0 + 1 + 0.25 * j), 14, 0.5), on = side === sd ? 1 : 0;
      const kick = t >= bt(T0 + n) && on ? 0.35 * Math.exp(-(t - bt(T0 + n)) * 7) : 0; flameC(x, dx + sd * (tot / 2 + 75) * k, dy - 20 * k, 88 * k * p * (1 + kick) * (on ? 1.15 : 0.8), t, st, core, { seed: j, halo: 0.7 }); });
  },
  // 3 · three garments around a person
  (x, t, L, dx, dy, k, T0) => {
    const s = 290 * k, ox = dx - 60 * k, oy = dy + 270 * k, p = poseStand(t), P = P2(ox, oy, s, 1);
    drawPerson(x, p, ox, oy, s, { skin: '#E8B58E', hair: '#2A1E1A', top: '#5EA1C1', bottom: '#2A3170', hairStyle: 'short', shade: '#0B0E2A' });
    const pts = [[P(p.head), 'מחשבה', 1, -150, -80], [P({ x: p.head.x + 0.13, y: p.head.y - 0.05 }), 'דיבור', 2, 190, 10], [P(p.hand2), 'מעשה', 3, 190, 90]];
    pts.forEach(([[px, py], lab, b, ox2, oy2], j) => { const t0 = bt(T0 + b), q = spring(t - t0, 16, 0.55); if (q <= 0.01) return;
      const cx = px + ox2 * k, cy = py + oy2 * k;
      x.save(); x.setLineDash([2, 12]); x.lineCap = 'round'; x.beginPath(); x.moveTo(px, py); x.lineTo(lerp(px, cx, clamp(q)), lerp(py, cy, clamp(q))); x.strokeStyle = W; x.lineWidth = 9; x.stroke(); x.strokeStyle = NAVY; x.lineWidth = 4; x.stroke(); x.restore();
      circle(x, px, py, 10 * clamp(q)); x.fillStyle = ORANGE; x.fill();
      const rq = inv(t0, t0 + 0.5, t); if (rq > 0 && rq < 1) { circle(x, px, py, 14 + 60 * out3(rq)); x.lineWidth = 5 * (1 - rq); x.strokeStyle = rgba(GOLD, 1 - rq); x.stroke(); }
      neonChip(x, t, t0, cx, cy, lab, { size: 38 * k, fontFn: FT.he, angle: t * 1.5 + j * 2, padX: 30 }); });
  },
  // 4 · the beinoni: a slider swings to the middle and stays
  (x, t, L, dx, dy, k, T0) => {
    const tw = 720 * k, y = dy - 40 * k, a = spring(t - bt(T0 + 0.6), 12, 0.7);
    rr(x, dx - tw / 2 * a, y - 9 * k, tw * a, 18 * k, 9 * k); x.fillStyle = gradPaint(x, dx - tw / 2, 0, dx + tw / 2, 0, [CORAL, '#8B6CFF', '#5DE4E9']); x.fill();
    const labs = [['צדיק', 1], ['בינוני', 0], ['רשע', -1]];
    labs.forEach(([lab, sd], j) => { const q = spring(t - bt(T0 + 0.8 + 0.12 * j), 16, 0.5); if (q <= 0.01) return; const lx = dx + sd * tw / 2;
      circle(x, lx, y, 14 * k * q); x.fillStyle = NAVY; x.fill();
      const mid = sd === 0, mm = mid ? clamp(spring(t - bt(T0 + 3.15), 16, 0.6), 0, 1.15) : 0;
      x.save(); he(x, (mid ? 54 : 44) * k); x.textAlign = 'center'; const lw = x.measureText(lab).width;
      if (mm > 0.01) { x.fillStyle = gradPaint(x, lx - lw / 2, 0, lx + lw / 2, 0, FIRE); rr(x, lx - lw / 2 - 14 * k, y + 52 * k, (lw + 28 * k) * mm, 62 * k, 14 * k); x.fill(); }
      x.fillStyle = NAVY; x.globalAlpha = clamp(q); x.fillText(lab, lx, y + 98 * k); x.restore(); });
    const kx = sk(t, [[-1, 0], [bt(T0 + 1), 1], [bt(T0 + 2), -1], [bt(T0 + 3), 0]], 13, 0.42), ks = spring(t - bt(T0 + 1), 14, 0.5);
    if (ks > 0.01) { const X = dx + kx * tw / 2; const hg = x.createRadialGradient(X, y, 0, X, y, 70 * k); hg.addColorStop(0, 'rgba(255,199,78,.5)'); hg.addColorStop(1, 'rgba(255,199,78,0)'); x.fillStyle = hg; circle(x, X, y, 70 * k); x.fill();
      circle(x, X, y, 42 * k * ks); x.fillStyle = gradPaint(x, X - 42, y - 42, X + 42, y + 42, FIRE); x.fill(); circle(x, X, y, 42 * k * ks); x.lineWidth = 7 * k; x.strokeStyle = W; x.stroke(); }
    slamWords(x, t, ['כל', 'אדם', 'יכול.'], dx, dy + 230 * k, 70 * k, FT.he, NAVY, [bt(T0 + 4), bt(T0 + 4.33), bt(T0 + 4.66)], null, { marker: { i: 2, paint: gradPaint(x, dx - 260, 0, dx + 260, 0, FIRE) } });
  },
  // 5 · the mind rules the heart: a chaotic pulse becomes calm when the beam connects
  (x, t, L, dx, dy, k0, T0) => {
    const k = k0 * 1.25, bp = spring(t - bt(T0 + 0.6), 14, 0.5), hp = spring(t - bt(T0 + 1), 14, 0.5), calm = clamp(spring(t - bt(T0 + 4), 7, 0.9));
    const by = dy - 190 * k, hy = dy + 40 * k;
    if (bp > 0.01) { x.save(); x.translate(dx, by); x.scale(bp, bp); const c = [[-50, -10, 52], [-8, -34, 56], [38, -14, 50], [52, 22, 42], [-40, 26, 44], [6, 18, 52]];
      x.fillStyle = gradPaint(x, -100 * k, -80 * k, 100 * k, 80 * k, ['#5DE4E9', '#4FA3FF', '#8B6CFF']); c.forEach(([a, b, r]) => { circle(x, a * k, b * k, r * k); x.fill(); });
      x.strokeStyle = 'rgba(255,255,255,.55)'; x.lineWidth = 5 * k; x.lineCap = 'round'; [[-60, -10, 20], [-10, -40, 10], [30, -6, 40]].forEach(([a, b, c2]) => { x.beginPath(); x.moveTo(a * k, b * k); x.quadraticCurveTo((a + 20) * k, (b + 30) * k, (a + c2) * k, (b + 10) * k); x.stroke(); }); x.restore(); }
    // beam
    if (t > bt(T0 + 3.8)) { const q = out3(inv(bt(T0 + 3.8), bt(T0 + 4.2), t)); x.save(); x.strokeStyle = gradPaint(x, 0, by, 0, hy, ['#5DE4E9', GOLD]); x.lineCap = 'round'; x.lineWidth = 10 * k; x.filter = 'blur(6px)'; x.beginPath(); x.moveTo(dx, by + 70 * k); x.lineTo(dx, lerp(by + 70 * k, hy - 60 * k, q)); x.stroke(); x.filter = 'none'; x.lineWidth = 5 * k; x.stroke(); x.restore(); }
    // heart, irregular before, calm after
    const irr = [0.6, 1.1, 1.4, 2.0, 2.3, 2.9, 3.4].reduce((a, b) => a + (t >= bt(T0 + b) ? 0.3 * Math.exp(-(t - bt(T0 + b)) * 9) : 0), 0) * (1 - calm);
    const reg = [4, 5, 6, 7].reduce((a, b) => a + (t >= bt(T0 + b) ? 0.16 * Math.exp(-(t - bt(T0 + b)) * 6) : 0), 0) * calm;
    if (hp > 0.01) { const s = 92 * k * hp * (1 + irr + reg); x.save(); x.translate(dx, hy); x.beginPath(); x.moveTo(0, s * 0.35); x.bezierCurveTo(-s * 1.1, -s * 0.35, -s * 0.5, -s * 1.05, 0, -s * 0.45); x.bezierCurveTo(s * 0.5, -s * 1.05, s * 1.1, -s * 0.35, 0, s * 0.35); x.closePath(); x.fillStyle = gradPaint(x, -s, -s, s, s * 0.4, FIRE); x.fill(); x.restore(); }
    // the trace
    const x0 = dx - 250 * k, x1 = dx + 250 * k, yy = dy + 190 * k, drawn = out3(inv(bt(T0 + 0.8), bt(T0 + 1.6), t));
    if (drawn > 0) { x.save(); x.beginPath(); const N = 140; for (let i = 0; i <= N * drawn; i++) { const u = i / N, X = lerp(x0, x1, u);
      const ch = 38 * Math.sin(u * 41 + t * 9) * Math.sin(u * 13 - t * 5) + 30 * Math.sin(u * 97 + t * 15) * (rnd(Math.floor(u * 20 + t * 6)) > 0.6 ? 1 : 0.2);
      const ph = ((u * 2.4 - t / (2 * B)) % 1 + 1) % 1, cv = ph > 0.45 && ph < 0.5 ? -62 : ph >= 0.5 && ph < 0.55 ? 34 : 3 * Math.sin(ph * 20);
      const Y = yy + lerp(ch, cv, calm) * k; i ? x.lineTo(X, Y) : x.moveTo(X, Y); }
      x.lineWidth = 5 * k; x.lineJoin = 'round'; x.strokeStyle = mix(CORAL, GOLD, calm); x.stroke(); x.restore(); }
  },
  // 6 · joy wins: the heavy wrestler falls, though he is stronger
  (x, t, L, dx, dy, k, T0) => {
    const push = d => { const p = poseSquat(d); const sh = p.shoulder; [['1', 1.32, 1.5], ['2', 1.4, 1.56]].forEach(([n, a1, a2]) => { p['elbow' + n] = { x: sh.x + Math.sin(a1) * 0.3, y: sh.y - Math.cos(a1) * 0.3 }; p['hand' + n] = { x: p['elbow' + n].x + Math.sin(a2) * 0.28, y: p['elbow' + n].y - Math.cos(a2) * 0.28 }; }); return p; };
    const vv = L.name === 'v', base = dy + 230 * k, s = 240 * k * (vv ? 0.85 : 1), shift = (vv ? 200 : 130) * k, sway = sk(t, [[-1, 0], [bt(T0 + 1), 22], [bt(T0 + 2), -18], [bt(T0 + 3), 14], [bt(T0 + 4), -46]], 12, 0.55) * k;
    const fall = -1.32 * clamp(spring(t - bt(T0 + 4.05), 7.5, 0.62), 0, 1.06), app = spring(t - bt(T0 + 0.6), 12, 0.6);
    x.save(); x.translate(0, (1 - clamp(app)) * 60 * k); x.globalAlpha = clamp(app * 1.5);
    rr(x, dx - 340 * k, base, 680 * k, 8 * k, 4 * k); x.fillStyle = NAVY; x.fill();
    // the heavy one (left, bigger, slow) — the joyful one (right, quick)
    const lx = dx - 100 * k + sway + shift, rx = dx + 100 * k + sway + shift, lean = 0.06 * Math.sin(t * 9);
    x.save(); x.translate(lx - 40 * k, base); x.rotate(fall); x.translate(-(lx - 40 * k), -base);
    drawPerson(x, push(0.24), lx - 40 * k, base, s * 1.14, { skin: '#D6B192', hair: '#3A3A48', top: '#8C96B8', bottom: '#4A5275', shoe: '#C9CFE0', hairStyle: 'short', shade: '#2A2F4A' }); x.restore();
    x.save(); x.translate(rx, base); x.rotate(lean * (1 - clamp(-fall))); x.translate(-rx, -base);
    drawPerson(x, push(0.3 - 0.12 * clamp(-fall)), rx, base, s, { f: -1, skin: '#F2C9A6', hair: '#7A3E1D', top: ORANGE, bottom: NAVY, hairStyle: 'bun' }); x.restore();
    x.restore();
    neonChip(x, t, bt(T0 + 1.5), lx - 40 * k, dy - 210 * k, 'עצלות וכבדות', { size: 30 * k, fontFn: FT.he8, fill: '#EEF0F6', angle: t * 1.4, padX: 24 });
    neonChip(x, t, bt(T0 + 2), rx + 30 * k, dy - 130 * k, 'שמחה וזריזות', { size: 30 * k, fontFn: FT.he8, angle: t * 1.4 + 2, padX: 24 });
    const q = inv(bt(T0 + 4.55), bt(T0 + 5), t); if (q > 0 && q < 1) { x.save(); x.strokeStyle = rgba(NAVY, 0.5 * (1 - q)); x.lineWidth = 4; for (let j = 0; j < 5; j++) { const a = Math.PI + j * 0.35 - 0.7, r0 = 20 + 90 * out3(q); x.beginPath(); const hx = lx - 40 * k - 1.82 * s * 1.14 * 0.88; x.moveTo(hx + Math.cos(a) * r0 * 0.4, base + Math.sin(a) * r0 * 0.3); x.lineTo(hx + Math.cos(a) * r0, base + Math.sin(a) * r0 * 0.6); x.stroke(); } x.restore(); }
  },
  // 7 · the candle: the flame always reaches up
  (x, t, L, dx, dy, k, T0) => {
    const app = spring(t - bt(T0 + 0.6), 12, 0.6); if (app <= 0.01) return;
    x.save(); x.translate(dx, dy + 260 * k); x.scale(1, clamp(app, 0, 1.1)); x.translate(-dx, -(dy + 260 * k));
    rr(x, dx - 46 * k, dy + 10 * k, 92 * k, 250 * k, 20 * k); x.fillStyle = gradPaint(x, dx - 46 * k, 0, dx + 46 * k, 0, ['#FFFFFF', '#E9ECF7', '#C9D1EA']); x.fill();
    rr(x, dx - 120 * k, dy + 250 * k, 240 * k, 22 * k, 11 * k); x.fillStyle = gradPaint(x, dx - 120 * k, 0, dx + 120 * k, 0, GOLDG); x.fill();
    x.strokeStyle = '#2A2A33'; x.lineWidth = 5 * k; x.beginPath(); x.moveTo(dx, dy + 10 * k); x.lineTo(dx, dy - 14 * k); x.stroke(); x.restore();
    const reach = [1, 2, 3, 4, 5, 6, 7].reduce((a, b) => a + (t >= bt(T0 + b) ? 0.34 * Math.exp(-(t - bt(T0 + b)) * 5) : 0), 0);
    const ig = spring(t - bt(T0 + 1), 14, 0.5);
    flameC(x, dx, dy - 70 * k, 96 * k * ig, t, FIRE, '#FFF3C8', { stretch: 1 + reach, lean: 0.08 * Math.sin(t * 3), seed: 2, halo: 1.4 });
    if (ig > 0.5) for (let j = 0; j < 14; j++) { const ph = ((t * 0.55 + rnd(j * 5)) % 1), yy = dy - 160 * k - ph * 330 * k, xx = dx + Math.sin(t * 2 + j) * 22 * k + (rnd(j) - 0.5) * 60 * k; circle(x, xx, yy, (5 - 4 * ph) * k); x.fillStyle = rgba(GOLD, 0.8 * (1 - ph)); x.fill(); }
    neonChip(x, t, bt(T0 + 3), dx + 190 * k, dy - 260 * k, 'תמיד למעלה ↑', { size: 32 * k, fontFn: FT.he, angle: t * 1.5, padX: 26 });
  },
  // 8 · a dwelling below: a house drawn by a line of light
  (x, t, L, dx, dy, k, T0) => {
    const base = dy + 210 * k, gq = out3(inv(bt(T0 + 0.5), bt(T0 + 1.1), t));
    rr(x, dx - 330 * k * gq, base, 660 * k * gq, 8 * k, 4 * k); x.fillStyle = NAVY; x.fill();
    const pts = [[-160, 0], [-160, -250], [0, -400], [160, -250], [160, 0]].map(([a, b]) => [dx + a * k, base + b * k]);
    let len = 0; for (let i = 1; i < pts.length; i++) len += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    const dq = io3(inv(bt(T0 + 0.8), bt(T0 + 3), t));
    const glow = clamp(spring(t - bt(T0 + 5.5), 6, 0.9));
    if (glow > 0.01) { x.save(); x.beginPath(); pts.forEach(([a, b], i) => i ? x.lineTo(a, b) : x.moveTo(a, b)); x.closePath(); const hg = x.createRadialGradient(dx, base - 180 * k, 10, dx, base - 180 * k, 300 * k); hg.addColorStop(0, rgba(GOLD, 0.55 * glow)); hg.addColorStop(1, rgba(GOLD, 0.08 * glow)); x.fillStyle = hg; x.fill(); x.restore(); }
    if (dq > 0) { x.save(); x.beginPath(); pts.forEach(([a, b], i) => i ? x.lineTo(a, b) : x.moveTo(a, b)); x.setLineDash([len, len]); x.lineDashOffset = len * (1 - dq); x.lineCap = 'round'; x.lineJoin = 'round';
      x.strokeStyle = gradPaint(x, dx - 160 * k, base - 400 * k, dx + 160 * k, base, FIRE); x.lineWidth = 14 * k; x.filter = 'blur(8px)'; x.stroke(); x.filter = 'none'; x.lineWidth = 10 * k; x.stroke(); x.restore(); }
    [[-90, -180, 3.5], [90, -180, 4]].forEach(([a, b, bb]) => { const q = spring(t - bt(T0 + bb), 16, 0.5); if (q <= 0.01) return; x.save(); x.translate(dx + a * k, base + b * k); x.scale(q, q); rr(x, -34 * k, -34 * k, 68 * k, 68 * k, 12 * k); x.fillStyle = gradPaint(x, -34 * k, -34 * k, 34 * k, 34 * k, GOLDG); x.fill(); x.restore(); });
    const dq2 = spring(t - bt(T0 + 4.5), 14, 0.6); if (dq2 > 0.01) { rr(x, dx - 44 * k, base - 130 * k * clamp(dq2, 0, 1.1), 88 * k, 130 * k * clamp(dq2, 0, 1.1), 16 * k); x.fillStyle = NAVY; x.fill(); }
    const ps = spring(t - bt(T0 + 5), 12, 0.55); if (ps > 0.01) { x.save(); x.translate(dx + 250 * k, base); x.scale(ps, ps); x.translate(-(dx + 250 * k), -base); drawPerson(x, poseStand(t), dx + 250 * k, base, 150 * k, { f: -1, skin: '#E8B58E', hair: '#2A1E1A', top: ORANGE, bottom: NAVY, hairStyle: 'pony' }); x.restore(); }
  }
];

/* ============================ ACT IV: the book closes ============================ */
function actFour(x, t, L) {
  const R = L.col.R, Y = L.col.top, v = L.name === 'v';
  glowText(x, () => {
    slamWords(x, t, ['ספר', 'של', 'בינונים.'], 0, Y + 40, v ? 104 : 100, FT.he, NAVY, [bt(98.6), bt(98.85), bt(99.1)], null, { right: R, maxW: v ? 900 : 760 });
    riseWords(x, t, ['כלומר'], 0, Y + (v ? 150 : 145), v ? 48 : 44, FT.he7, rgba(NAVY, 0.85), [bt(100.4)], null, { right: R });
    slamWords(x, t, ['עליך.'], 0, Y + (v ? 270 : 260), v ? 132 : 124, FT.he, NAVY, [bt(101)], null, { right: R, marker: { i: 0, paint: gradPaint(x, R - 360, 0, R, 0, FIRE) } });
  });
  // the verse as a neon pill
  const c = spring(t - bt(104), 15, 0.5);
  if (c > 0.001) { const py = v ? Y + 445 : Y + 470, px = v ? L.W / 2 : R - 330; x.save(); x.translate(px, py); x.scale(c, c); he(x, v ? 46 : 42); const tw = x.measureText('כי קרוב אליך הדבר מאד').width, w = tw + 90, h = v ? 104 : 96;
    neonRing(x, 0, 0, w + 6, h + 6, (h + 6) / 2, t * 1.6, { lw: 4, glow: 18, power: 1 + 0.5 * beatPulse(t) }); rrc(x, 0, 0, w, h, h / 2); x.fillStyle = NAVY; x.fill(); x.fillStyle = W; x.textAlign = 'center'; x.fillText('כי קרוב אליך הדבר מאד', 0, v ? 16 : 15); x.restore();
    riseWords(x, t, ['דברים', 'ל׳,', 'י״ד'], px, py + (v ? 100 : 92), v ? 32 : 30, FT.he7, NAVY, [bt(104.6), bt(104.65), bt(104.7)], null, {}); }
  if (t > bt(108)) { const s = spring(t - bt(108), 12, 0.6); x.save(); x.translate(L.W / 2, L.H - (v ? 120 : 56)); x.scale(s, s);
    if (LOGO) x.drawImage(LOGO, -232, -30, 44, 44); en(x, 26, 'left'); x.letterSpacing = '3px'; x.fillStyle = NAVY; x.fillText('MADE WITH YUV.AI MOTION  ·  100% CODE', -180, 2); x.restore(); }
}

/* ============================ the film ============================ */
function draw(x, t, L) {
  if (t >= bt(16)) x.drawImage(render3D(t, L), 0, 0, L.W, L.H);
  if (t < bt(16) + 0.45) {
    const iris = out3(inv(bt(16), bt(16) + 0.42, t)) * coverR(L.W, L.H, L.W / 2, L.H / 2);
    x.save(); if (iris > 0) { x.beginPath(); x.rect(0, 0, L.W, L.H); x.arc(L.W / 2, L.H / 2, iris, 0, Math.PI * 2, true); x.clip(); }
    actOne(x, t, L); x.restore();
  }
  if (t >= bt(16) && t < bt(16) + 0.7) { const q = inv(bt(16), bt(16) + 0.7, t), Rr = out3(q) * coverR(L.W, L.H, L.W / 2, L.H / 2) * 1.05; const g = x.createConicGradient(t * 3, L.W / 2, L.H / 2); SPECTRUM.forEach((c, i) => g.addColorStop(i / (SPECTRUM.length - 1), c)); x.save(); x.strokeStyle = g; x.lineWidth = 50 * (1 - q) + 2; x.filter = 'blur(6px)'; circle(x, L.W / 2, L.H / 2, Rr); x.stroke(); x.restore(); }
  if (t >= bt(16) && t < bt(32.5)) actTwo(x, t, L);
  ideas(x, t, L);
  if (t >= bt(97)) actFour(x, t, L);
}
mountFilm({
  layouts: LAYOUTS, draw, dur: DUR, clk, extra: { NB },
  init: async (L, SCALE) => { LOGO = LOGO_URL ? await new Promise(res => { const im = new Image(); im.onload = () => res(im); im.onerror = () => res(null); im.src = LOGO_URL; }) : null; await init3D(L, SCALE); }
});
