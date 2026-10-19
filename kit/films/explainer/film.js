/* =====================================================================
   "סרטון = קוד" — the whole method, explained end to end, in one film (Hebrew, RTL).
   A  hook: a neon prompt asks how; the send button floods into the title
   01 frames: a video is 60 pictures a second; seek(t) draws any one of them
   02 shapes: how Claude draws an iPhone toggle (numbers, easing, a spring) and morphs it into a capsule
   03 morph: change shape, never fade (flood, iris, push)
   04 beat: the music is the clock; SFX land on their peak
   05 prompt: the six blocks, numbers instead of adjectives, the banned list
   06 words: the interface dictionary
   07 engines: CPU vs GPU, a shader, HTML/Canvas/WebGL/WebGPU, particles
   08 real world: a delivery map · breakdown: "now we build it ourselves"
   09 builder: presets → scenes → prompt → copy link
   10 render: film.html → Playwright → ffmpeg → MP4, motion blur from subframes, sound on the beat
   end: "we write the direction, Claude writes the code" · logo on navy in the wordmark colours
   colours: Phoenix Day pages + the wordmark pair (pink = action, cyan = code/system), fire for the phoenix punches
   208 choreographed beats + 76 narration-hold beats = 284 beats, 142 s @ 120 BPM ("From Here" by Tanner Helland, CC BY 4.0).
   Narration: Omer (ElevenLabs eleven_v4), 28 lines. Everything is drawn in code.
   ===================================================================== */
import { clamp, lerp, inv, out3, in3, io3, logLerp, spring, sk, clock, rgba, mix, BRAND, FT, rr, rrc, circle, coverR, riseWords, gradPaint, makeSpreads, mountFilm, rnd } from '../../src/core.js';
import { card, press, cursor, clickRing, neonRing, slamWords, popType, SPECTRUM } from '../../src/ui.js';
import LOGO_URL from '../../brand/logo-384.png';
import PHOTO_URL from './photo-day.jpg';

const clk = clock(120), { B } = clk;
/* narration holds: [original beat, beats inserted, music bar]. The film was choreographed on 208 beats; the narration (28 lines, Omer,
   ElevenLabs v4) needs ~38 s more. Every event at or after an insertion point moves later by that many beats, so the scene holds
   (springs settle, neon, particles and the HUD keep running on the real clock) while the voice finishes. Insertions are whole bars,
   so the beat grid never breaks; the music is extended by repeating the bar(s) before the given music bar (mix.py reads this line). */
const HOLDS = [[11, 4, 16], [23.3, 4, 24], [26, 4, 28], [29, 4, 32], [30.8, 4, 36], [51.5, 4, 56], [65.9, 4, 68], [77, 4, 80], [95.2, 4, 96], [116, 4, 116], [125, 8, 132], [134.5, 4, 136], [143.6, 4, 142], [161.5, 4, 164], [175, 4, 176], [183, 4, 184], [197, 4, 200], [204, 4, 204]];
const bt = k => (k + HOLDS.reduce((a, [p, n]) => a + (k >= p ? n : 0), 0)) * B;
const NB = 208 + HOLDS.reduce((a, h) => a + h[1], 0), DUR = bt(208);
const NAVY = BRAND.navy, NAVY2 = BRAND.navy2, W = '#FFFFFF', FIRE = BRAND.fire, DENIM = BRAND.denim, CLOUD = BRAND.cloud, ORANGE = BRAND.orange, GOLD = BRAND.gold, CORAL = BRAND.coral;
// the wordmark pair from the logo: pink = action (clicks, playheads, the thing that moves), cyan = code / system (readouts, on navy)
const PINK = BRAND.pink, CYAN = BRAND.cyan, PC = [BRAND.pink, BRAND.cyan];
const SKY = ['#5EA9F2', '#93CBFF', '#DDF0FF'], GREEN = '#34C759', OFF = '#C9D3E6';
const beatPulse = t => Math.exp(-((((t % B) + B) % B) / B) * 5);
const win = (t, a, b) => t >= bt(a) && t < bt(b);

const LAYOUTS = {
  h: { name: 'h', W: 1920, H: 1080, right: 1800, hy: 290, hs: 150, hmax: 620, kY: 150, capX: 1800, capY: 640,
       dx: 640, dy: 600, dw: 1000, dh: 720, numSize: 620, numX: 40, hudY: 1046 },
  v: { name: 'v', W: 1080, H: 1920, right: 1010, hy: 330, hs: 132, hmax: 960, kY: 190, capX: 1010, capY: 1720,
       dx: 540, dy: 1170, dw: 960, dh: 980, numSize: 520, numX: 30, hudY: 1868 }
};
const isV = L => L.name === 'v';

/* ---------- pages (colour spreads, one per chapter) ---------- */
const PAL = {
  D: { bg: SKY[1], grad: SKY, hd: NAVY, ink: NAVY, sub: rgba(NAVY, 0.72), card: W, num: 'rgba(0,0,0,.09)', numMode: 'fill', band: W },
  C: { bg: DENIM, hd: NAVY, ink: NAVY, sub: rgba(NAVY, 0.72), card: W, num: mix(DENIM, NAVY, 0.12), numMode: 'fill', band: PINK },
  K: { bg: NAVY, hd: W, ink: W, sub: rgba(W, 0.72), card: NAVY2, num: rgba(CYAN, 0.38), numMode: 'stroke', band: PINK },
  M: { bg: ORANGE, grad: FIRE, hd: NAVY, ink: NAVY, sub: rgba(NAVY, 0.75), card: W, num: 'rgba(0,0,0,.09)', numMode: 'fill', band: NAVY }
};
const SEC = [
  { t: 0, p: 'D' }, { t: bt(8) + 0.36, p: 'M' },
  { t: bt(12), p: 'D', wipe: 'r', num: '01' }, { t: bt(24), p: 'C', wipe: 'b', num: '02' },
  { t: bt(48), p: 'K', wipe: 'r', num: '03' }, { t: bt(61.2), p: 'D', num: '04' },
  { t: bt(80), p: 'C', wipe: 'b', num: '05' }, { t: bt(104), p: 'D', wipe: 'r', num: '06' },
  { t: bt(120), p: 'K', wipe: 'b', num: '07' }, { t: bt(136), p: 'D', wipe: 'r', num: '08' },
  { t: bt(152), p: 'C', wipe: 'r', num: '09' }, { t: bt(168), p: 'K', wipe: 'b', num: '10' },
  { t: bt(192) + 0.36, p: 'M' }, { t: bt(198), p: 'K', wipe: 'r' }
];
const spreads = makeSpreads(SEC, PAL);
const ink = t => spreads.palTr('ink', t), sub = t => spreads.palTr('sub', t);
const firePaint = (x, X0, Y0, X1, Y1) => gradPaint(x, X0, Y0, X1, Y1, FIRE);
const pcPaint = (x, X0, Y0, X1, Y1) => gradPaint(x, X0, Y0, X1, Y1, PC);

/* ---------- type helpers ---------- */
// one headline line: words slam in (two per beat by default), RTL, anchored to the right column (16:9) or the top (9:16)
function head(x, t, L, line, words, t0, tOut, opt = {}) {
  const size = opt.size || L.hs, y = (opt.y ?? L.hy) + line * size * 1.0;
  const times = opt.times || words.map((_, i) => t0 + i * B / 2);
  const cx = opt.cx ?? (isV(L) ? L.W / 2 : null);
  const o = { maxW: opt.maxW || L.hmax, colors: opt.colors, marker: opt.marker };
  if (cx == null) o.right = L.right;
  slamWords(x, t, words, cx ?? 0, y, size, FT.he, opt.color || ink(t), times, tOut, o);
}
const markP = x => gradPaint(x, 0, 0, 1920, 0, FIRE);
// a small kicker: Anton on a pink pill (the wordmark colour), pops on a spring
function kick(x, t, L, t0, text, tOut) {
  const s = clamp(spring(t - t0, 18, 0.55), 0, 1.1) * (tOut == null ? 1 : 1 - in3(inv(tOut, tOut + 0.2, t))); if (s <= 0.01) return;
  x.save(); x.font = FT.en(30); x.letterSpacing = '4px'; const w = x.measureText(text).width + 44, h = 52;
  const cx = isV(L) ? L.W / 2 : L.right - w / 2, cy = L.kY;
  x.translate(cx, cy); x.scale(s, s); rrc(x, 0, 0, w, h, h / 2); x.fillStyle = PINK; x.fill();
  x.fillStyle = NAVY; x.textAlign = 'center'; x.direction = 'ltr'; x.fillText(text, 2, 11); x.restore();
}
// running text (Assistant), pops in with a small rise. align: 'right' | 'center' | 'left'
function cap(x, t, t0, text, X, Y, opt = {}) {
  const s = spring(t - t0, 16, 0.62); if (s <= 0.01) return;
  const out = opt.tOut == null ? 0 : in3(inv(opt.tOut, opt.tOut + 0.2, t)); if (out >= 1) return;
  x.save(); x.font = (opt.bold === false ? FT.text : FT.textB)(opt.size || 40); x.direction = opt.ltr ? 'ltr' : 'rtl'; x.textAlign = opt.align || 'right';
  x.fillStyle = opt.color || ink(t); x.translate(X, Y + (1 - s) * 26 + out * 20); x.scale(1, clamp(s, 0, 1.06) * (1 - out)); x.fillText(text, 0, 0); x.restore();
}
function mono(x, text, X, Y, size, color, align = 'left', bold = false) { x.save(); x.font = (bold ? FT.monoB : FT.mono)(size); x.direction = 'ltr'; x.textAlign = align; x.fillStyle = color; x.fillText(text, X, Y); x.restore(); }
// a pill chip (text centred), scale s
function pill(x, cx, cy, text, s, { size = 34, font = FT.textB, fill = W, color = NAVY, padX = 26, h = null, stroke = null, shadow = true } = {}) {
  if (s <= 0.01) return 0;
  x.save(); x.font = font(size); const he = /[֐-׿]/.test(text), tw = x.measureText(text).width, w = tw + padX * 2, hh = h || size * 1.7;
  x.translate(cx, cy); x.scale(s, s);
  if (shadow) card(x, 0, 0, w, hh, hh / 2, { fill, depth: 0.25, shadow: 'rgba(5,8,30,.35)' }); else { rrc(x, 0, 0, w, hh, hh / 2); x.fillStyle = fill; x.fill(); }
  if (stroke) { rrc(x, 0, 0, w, hh, hh / 2); x.lineWidth = 3; x.strokeStyle = stroke; x.stroke(); }
  x.fillStyle = color; x.textAlign = 'center'; x.direction = he ? 'rtl' : 'ltr'; x.fillText(text, 0, size * 0.36); x.restore(); return w;
}
const pop = (t, t0, w = 16, z = 0.55) => clamp(spring(t - t0, w, z), 0, 1.25);
const gone = (t, t0, d = 0.25) => 1 - in3(inv(t0, t0 + d, t));


/* neon edge, fast: the blurred halo is drawn at quarter resolution and scaled up (blur cost grows with pixels),
   the crisp line at full resolution. Same look as ui.js neonRing, ~10x cheaper in a software renderer. */
const NEO = document.createElement('canvas'); NEO.width = NEO.height = 8; const nctx = NEO.getContext('2d');
function neonFast(x, cx, cy, w, h, r, angle, { lw = 4, glow = 22, power = 1, stops = SPECTRUM } = {}) {
  if (w <= 1 || h <= 1) return;
  const k = 0.25, pad = glow * power * 2.2 + lw * 5, cw = Math.ceil((w + pad * 2) * k), ch = Math.ceil((h + pad * 2) * k);
  if (NEO.width < cw || NEO.height < ch) { NEO.width = Math.max(NEO.width, cw); NEO.height = Math.max(NEO.height, ch); }
  nctx.setTransform(1, 0, 0, 1, 0, 0); nctx.clearRect(0, 0, NEO.width, NEO.height);
  nctx.setTransform(k, 0, 0, k, (w / 2 + pad) * k, (h / 2 + pad) * k);
  const g = nctx.createConicGradient(angle, 0, 0); stops.forEach((c, i) => g.addColorStop(i / (stops.length - 1), c));
  nctx.strokeStyle = g;
  nctx.filter = `blur(${glow * power * k}px)`; nctx.lineWidth = lw * 5 * power; rrc(nctx, 0, 0, w, h, r); nctx.stroke();
  nctx.filter = `blur(${glow * 0.35 * power * k}px)`; nctx.lineWidth = lw * 2.2; rrc(nctx, 0, 0, w, h, r); nctx.stroke(); nctx.filter = 'none';
  x.drawImage(NEO, 0, 0, cw, ch, cx - w / 2 - pad, cy - h / 2 - pad, cw / k, ch / k);
  const g2 = x.createConicGradient(angle, cx, cy); stops.forEach((c, i) => g2.addColorStop(i / (stops.length - 1), c));
  x.save(); x.strokeStyle = g2; x.lineWidth = lw; rrc(x, cx, cy, w, h, r); x.stroke(); x.restore();
}

let LOGO = null, PHOTO = null;
const loadImg = src => new Promise(r => { const i = new Image(); i.onload = () => r(i); i.src = src; });

/* ===================== A · hook (b0–12) ===================== */
const Q_TEXT = 'איך עושים סרטון בקוד?';
const Q_TIMES = Array.from(Q_TEXT).map((_, i) => 0.55 + i * 0.125);
function hook(x, t, L) {
  if (t > bt(12.5)) return;
  const cx = L.W / 2, cy = L.H / 2, BW = isV(L) ? 940 : 1100, BH = 132;
  // the prompt box pops in, types, gets clicked, collapses into its send button, which floods the frame
  const s = clamp(spring(t - 0.02, 14, 0.6), 0, 1.1);
  const col = io3(inv(bt(6.3), bt(7.4), t));                       // collapse to a circle
  const bw = lerp(BW, BH, col), sendX = cx - BW / 2 + BH / 2 + 4;
  const bcx = lerp(cx, cx, col);
  const pr = press(t, bt(6), bt(6.25), 0.94);
  if (t < bt(8) + 0.5) {
    x.save(); x.translate(bcx, cy); x.scale(s * pr, s * pr); x.translate(-bcx, -cy);
    neonFast(x, bcx, cy, bw, BH, BH / 2, t * 1.7, { power: 1 + 0.35 * beatPulse(t) });
    card(x, bcx, cy, bw, BH, BH / 2, { fill: W, depth: 0.6 });
    x.save(); rrc(x, bcx, cy, bw, BH, BH / 2); x.clip();
    const sq = 1 - col;
    if (sq > 0.02) {
      x.save(); x.translate(bcx + bw / 2 - 56, 0); x.scale(sq, 1); x.translate(-(bcx + bw / 2 - 56), 0);
      if (t < Q_TIMES[0]) { x.font = FT.text(44); x.direction = 'rtl'; x.textAlign = 'right'; x.fillStyle = rgba(NAVY, 0.4); x.fillText('שאלו את Claude…', bcx + bw / 2 - 56, cy + 16); }
      popType(x, t, Q_TEXT, bcx + bw / 2 - 56, cy + 17, FT.textB, 50, NAVY, Q_TIMES);
      x.restore();
    }
    // the send button (left end in a Hebrew UI): it is the circle that stays
    const bx = lerp(sendX, bcx, col), br = lerp(BH / 2 - 14, BH / 2, col);
    circle(x, bx, cy, br); x.fillStyle = firePaint(x, bx - br, cy - br, bx + br, cy + br); x.fill();
    x.save(); x.translate(bx, cy); x.lineCap = 'round'; x.lineJoin = 'round'; x.lineWidth = 7; x.strokeStyle = NAVY; x.beginPath(); x.moveTo(15, 0); x.lineTo(-15, 0); x.moveTo(-2, -13); x.lineTo(-15, 0); x.lineTo(-2, 13); x.stroke(); x.restore();
    x.restore(); x.restore();
  }
  // cursor: arrives, clicks send on beat 6
  if (t > bt(3.6) && t < bt(7.2)) {
    const a = io3(inv(bt(3.6), bt(5.6), t)), tx = sendX + 6, ty = cy + 8;
    const X = lerp(isV(L) ? 160 : 420, tx, a), Y = lerp(isV(L) ? 1500 : 980, ty, a) + Math.sin(a * Math.PI) * -60;
    clickRing(x, tx, ty, t, bt(6), PINK, 80);
    cursor(x, X, Y, (isV(L) ? 1.25 : 1.1) * press(t, bt(6), bt(6.2), 0.85), NAVY, W);
  }
  // flood: the circle grows past the farthest corner in 0.35 s
  const fl = out3(inv(bt(8), bt(8) + 0.36, t));
  if (fl > 0 && t < bt(8) + 0.4) { circle(x, cx, cy, BH / 2 + (coverR(L.W, L.H, cx, cy) - BH / 2) * fl); x.fillStyle = firePaint(x, 0, 0, L.W, L.H); x.fill(); }
  // the title on the fire page
  const ts = isV(L) ? 250 : 300, y1 = cy + (isV(L) ? 40 : 60);
  slamWords(x, t, ['סרטון', '=', 'קוד.'], cx, y1, ts, FT.he, NAVY, [bt(8.5), bt(9), bt(9.5)], bt(11.6), {});
  if (t > bt(10) && t < bt(11.9)) {
    const s2 = pop(t, bt(10), 18, 0.55) * gone(t, bt(11.6));
    x.save(); x.font = FT.en(isV(L) ? 40 : 44); x.letterSpacing = '6px'; x.textAlign = 'center'; x.direction = 'ltr'; x.fillStyle = NAVY;
    x.translate(cx, y1 + (isV(L) ? 120 : 130)); x.scale(s2, s2); x.fillText('MOTION IN CODE · END TO END', 0, 0); x.restore();
  }
}

/* ===================== 01 · frames (b12–24) ===================== */
function ballAt(u) { return u; }   // the moving dot: position 0..1 is just time, the simplest function there is
function frames(x, t, L) {
  if (!win(t, 11.9, 25)) return;
  const v = isV(L);
  kick(x, t, L, bt(12.3), '01 · FRAMES', bt(23.6));
  head(x, t, L, 0, ['סרטון', '='], bt(12.5), bt(19.6));
  head(x, t, L, 1, ['60', 'תמונות', 'בשנייה'], bt(13.5), bt(19.6), { marker: { i: 0, paint: markP(x) } });
  head(x, t, L, 0, ['כל', 'פריים', '='], bt(20), bt(23.6));
  head(x, t, L, 1, ['פונקציה', 'של', 't'], bt(21), bt(23.6), { marker: { i: 2, paint: markP(x) } });
  // the filmstrip: six frames, each the same little scene a moment later
  const n = 6, fw = v ? 140 : 150, fh = v ? 104 : 110, gap = v ? 18 : 22;
  const sx = L.dx, sy = v ? L.dy + 330 : L.dy + 230;
  const total = n * fw + (n - 1) * gap, ex = io3(inv(bt(23.4), bt(24), t));
  for (let i = 0; i < n; i++) {
    const s = pop(t, bt(14) + i * 0.125, 18, 0.55) * (1 - ex); if (s <= 0.01) continue;
    const fx = sx + total / 2 - fw / 2 - i * (fw + gap);       // RTL: frame 1 on the right
    const playing = t > bt(16) && t < bt(18) && Math.floor((t - bt(16)) * 6) % n === i;
    x.save(); x.translate(fx, sy); x.scale(s, s);
    card(x, 0, 0, fw, fh, 16, { fill: W, depth: 0.35, stroke: playing ? PINK : null, strokeW: 6 });
    const u = i / (n - 1); circle(x, -fw / 2 + 24 + (fw - 48) * (1 - u), 6, 13); x.fillStyle = NAVY; x.fill();
    mono(x, String(i + 1), -fw / 2 + 10, fh / 2 - 10, 18, rgba(NAVY, 0.5));
    x.restore();
  }
  // the player: the same scene, drawn for ANY t
  const ps = pop(t, bt(16), 14, 0.6) * (1 - ex), PW = v ? 860 : 820, PH = v ? 420 : 400, py = v ? L.dy - 160 : L.dy - 120;
  if (ps > 0.01) {
    x.save(); x.translate(sx, py); x.scale(ps, ps);
    card(x, 0, 0, PW, PH, 36, { fill: W, depth: 0.8 });
    // local time on the scrubber: plays, then the cursor drags it back and forth
    const play = clamp((t - bt(16)) / 2), drag = sk(t, [[-1, 0], [bt(18), 0.22], [bt(19), 0.88], [bt(20), 0.34], [bt(21), 0.72], [bt(22.5), 0.5]], 9, 0.75);
    const u = t < bt(18) ? play % 1 : clamp(drag);
    const ballX = PW / 2 - 70 - (PW - 140) * ballAt(u);
    x.save(); rrc(x, 0, -20, PW - 60, PH - 120, 24); x.fillStyle = CLOUD; x.fill(); x.restore();
    circle(x, ballX, -20, 34); x.fillStyle = firePaint(x, ballX - 34, -54, ballX + 34, 14); x.fill();
    // scrubber
    const ty = PH / 2 - 40, tx0 = -PW / 2 + 60, tx1 = PW / 2 - 60;
    rrc(x, 0, ty, tx1 - tx0, 10, 5); x.fillStyle = rgba(NAVY, 0.15); x.fill();
    const hx = tx1 - (tx1 - tx0) * u;
    rr(x, hx, ty - 5, tx1 - hx, 10, 5); x.fillStyle = PINK; x.fill();
    circle(x, hx, ty, 15); x.fillStyle = NAVY; x.fill();
    mono(x, `t = ${(u * 2).toFixed(2)}s`, -PW / 2 + 40, -PH / 2 + 52, 28, NAVY, 'left', true);
    mono(x, '60 fps', PW / 2 - 40, -PH / 2 + 52, 28, ORANGE, 'right', true);
    if (t > bt(17.6) && t < bt(23)) cursor(x, hx - 4, ty + 2, v ? 1.15 : 1, NAVY, W);
    x.restore();
  }
  // the code chip: the whole idea in one line
  const cs = pop(t, bt(22.5), 18, 0.55) * gone(t, bt(23.6));
  if (cs > 0.01) {
    const X = v ? L.W / 2 : L.right - 250, Y = v ? L.hy + 300 : L.hy + 330;
    pill(x, X, Y, 'seek(t) → frame', cs, { font: FT.monoB, size: 34, fill: NAVY, color: CYAN });
  }
  if (!v) cap(x, t, bt(16.5), 'בקולנוע 24, ברשת 60.', L.right, L.hy + 420, { size: 40, tOut: bt(19.6), color: sub(t) });
  cap(x, t, bt(23), 'אפשר לקפוץ לכל רגע, בכל סדר.', v ? L.W / 2 : L.right, v ? L.hy + 390 : L.hy + 430, { align: v ? 'center' : 'right', size: 40, tOut: bt(23.7), color: sub(t) });
}

/* ===================== 02 · shapes: the iPhone toggle (b24–48) ===================== */
const TG = { w: 360, h: 216 };
function togglePos(L) { return isV(L) ? [540, 1300] : [640, 690]; }
function shapes(x, t, L) {
  if (!win(t, 23.4, 48.6)) return;
  const v = isV(L), [tcx, tcy] = togglePos(L);
  kick(x, t, L, bt(24.3), '02 · SHAPES', bt(47.6));
  head(x, t, L, 0, ['איך', 'Claude'], bt(24.5), bt(35.6));
  head(x, t, L, 1, ['מצייר', 'מתג?'], bt(25.5), bt(35.6), { marker: { i: 1, paint: markP(x) } });
  head(x, t, L, 0, ['אין', 'קסם.'], bt(36), bt(43.6));
  head(x, t, L, 1, ['רק', 'מספרים', 'בקפיץ.'], bt(37), bt(43.6), { marker: { i: 1, paint: markP(x) } });
  head(x, t, L, 0, ['Claude', 'כותב'], bt(44), bt(47.7));
  head(x, t, L, 1, ['את', 'הקוד.'], bt(45), bt(47.7), { marker: { i: 1, paint: markP(x) } });

  // the code card: three lines, each one draws a part of the shape
  const cdx = v ? 540 : 640, cdy = v ? 800 : 330, CW = v ? 960 : 900, CH = 236;
  const cs = pop(t, bt(25.5), 14, 0.62) * gone(t, bt(35.5), 0.3);
  const LINES = [
    ['roundRect(x, y, 360, 216, 108)', bt(26)],
    ['circle(knob.x, knob.y, 90)', bt(27)],
    ["fill(on ? '#34C759' : '#C9D3E6')", bt(28)]
  ];
  if (cs > 0.01) {
    x.save(); x.translate(cdx, cdy); x.scale(cs, cs); card(x, 0, 0, CW, CH, 32, { fill: NAVY, depth: 0.7 });
    ['#F56B49', '#FFC74E', '#5DE4E9'].forEach((c, i) => { circle(x, -CW / 2 + 36 + i * 26, -CH / 2 + 30, 7); x.fillStyle = c; x.fill(); });
    if (t < LINES[0][1] && Math.floor(t / (B / 2)) % 2 === 0) { rr(x, -CW / 2 + 40, -CH / 2 + 66, 16, 34, 3); x.fillStyle = CYAN; x.fill(); }   // a caret blinks on the beat until the code types
    LINES.forEach(([s, t0], i) => {
      const n = clamp(Math.floor((t - t0) / 0.035) + 1, 0, s.length); if (n <= 0) return;
      mono(x, s.slice(0, n), -CW / 2 + 40, -CH / 2 + 92 + i * 52, v ? 31 : 32, i === 2 ? CYAN : '#E7ECFA');
    });
    x.restore();
  }
  // easing labels
  const lab = (t0, text, good, tOut) => { const s = pop(t, t0, 18, 0.55) * gone(t, tOut); if (s > 0.01) pill(x, tcx, tcy - (v ? 220 : 200), text, s, { size: 36, fill: good ? NAVY : W, color: good ? CYAN : CORAL, stroke: good ? null : CORAL }); };
  lab(bt(29), 'לינארי: רובוטי ✕', false, bt(30.8));
  lab(bt(31), 'קפיץ: חי ✓', true, bt(35.6));
  const fs = pop(t, bt(32.5), 18, 0.55) * gone(t, bt(35.6));
  if (fs > 0.01) pill(x, tcx, tcy + (v ? 230 : 210), 'x = lerp(a, b, spring(t))', fs, { font: FT.monoB, size: 30, fill: NAVY, color: '#E7ECFA' });

  // the toggle itself: outline draws, fills, the knob lands, clicks linear then spring, then morphs into a capsule card
  const tgShow = t > bt(26);
  if (!tgShow) return;
  const draw = clamp((t - bt(26)) / 0.6);
  const m = clamp(spring(t - bt(36.2), 10, 0.55), 0, 1.2);         // the morph, with a visible overshoot
  const shrink = io3(inv(bt(46.4), bt(47.6), t));                    // ends as the button of chapter 03
  const W0 = TG.w, H0 = TG.h, W1 = v ? 900 : 860, H1 = v ? 380 : 360, R1 = 56;
  let w = lerp(W0, W1, m), h = lerp(H0, H1, m), r = lerp(H0 / 2, R1, clamp(m));
  const BTN = { w: 300, h: 110 };
  w = lerp(w, BTN.w, shrink); h = lerp(h, BTN.h, shrink); r = lerp(r, BTN.h / 2, shrink);
  const cy = lerp(tcy, isV(L) ? 1180 : 600, clamp(m)), cx = lerp(tcx, isV(L) ? 540 : 640, clamp(m));
  // knob state: off → on (linear, b29) → off (spring, b31) → on (spring, b33)
  const lin = clamp((t - bt(29)) / 0.5), sp1 = spring(t - bt(31), 13, 0.42), sp2 = spring(t - bt(33), 13, 0.42);
  const pos = t < bt(31) ? lin : 1 - sp1 + sp2;                       // 0 = off (right in RTL?) we use: 0 left, 1 right
  const onCol = clamp(t < bt(31) ? lin : (t < bt(33) ? 1 - clamp(sp1) : clamp(sp2)));
  const fill = mix(mix(OFF, GREEN, onCol), NAVY, clamp(m));
  x.save();
  if (draw < 1) { rrc(x, cx, cy, w, h, r); x.setLineDash([2400, 2400]); x.lineDashOffset = 2400 * (1 - draw) + 1400 * 0; x.lineWidth = 6; x.strokeStyle = ink(t); x.stroke(); x.setLineDash([]); }
  const fs2 = clamp((t - bt(26.5)) / 0.3);
  if (fs2 > 0) card(x, cx, cy, w, h, r, { fill, depth: 0.55 });
  // the knob (lands at b27), becomes the icon of the capsule
  const kn = t > bt(27) ? clamp(spring(t - bt(27), 16, 0.5), 0, 1.2) : 0;
  if (kn > 0) {
    const travel = (W0 - H0) / 2 * (1 - clamp(m));
    const kx = lerp(cx - travel + (2 * travel) * pos, cx + w / 2 - (v ? 110 : 100), clamp(m)), kr = lerp(H0 / 2 - 12, 46, clamp(m)) * kn * (1 - shrink);
    if (kr > 0.5) { x.save(); x.shadowColor = 'rgba(5,8,30,.35)'; x.shadowBlur = 16; x.shadowOffsetY = 5; circle(x, kx, cy, kr); x.fillStyle = m > 0.5 ? firePaint(x, kx - kr, cy - kr, kx + kr, cy + kr) : W; x.fill(); x.restore(); }
  }
  // the capsule's content: a live activity (pops in on beats 40–43)
  if (m > 0.6 && shrink < 0.9) {
    const k = 1 - shrink, R = cx + w / 2 - (v ? 200 : 190);
    x.save(); x.globalAlpha = 1; x.translate(0, 0);
    const a1 = pop(t, bt(40), 18, 0.55) * k, a2 = pop(t, bt(41), 18, 0.55) * k, a3 = clamp((t - bt(42)) / 1.6), a4 = pop(t, bt(43), 18, 0.55) * k;
    if (a1 > 0.01) { x.save(); x.translate(R, cy - 60); x.scale(a1, a1); x.font = FT.he(64); x.direction = 'rtl'; x.textAlign = 'right'; x.fillStyle = W; x.fillText('סרטון בהכנה', 0, 0); x.restore(); }
    if (a2 > 0.01) { const bw = (w - 340) * a2; rr(x, R - bw, cy + 10, bw, 22, 11); x.fillStyle = rgba(W, 0.15); x.fill(); rr(x, R - bw * a3, cy + 10, bw * a3, 22, 11); x.fillStyle = pcPaint(x, R - bw, 0, R, 0); x.fill(); }
    if (a4 > 0.01) { x.save(); x.translate(R - 50, cy + 90); x.scale(a4, a4); mono(x, `frame ${String(Math.floor(clamp((t - bt(42)) / 1.6) * 720)).padStart(4, '0')}/0720`, 0, 0, 30, CYAN, 'right', true); x.restore(); }
    x.restore();
  }
  // the button label when it has become a button
  if (shrink > 0.6) { x.save(); x.font = FT.he(54); x.direction = 'rtl'; x.textAlign = 'center'; x.fillStyle = W; x.fillText('לחצו', cx, cy + 19); x.restore(); }
  x.restore();
  // live readouts: the numbers the code computes this very frame
  const ro = pop(t, bt(36.6), 18, 0.55) * gone(t, bt(43.6));
  if (ro > 0.01) {
    const X = v ? 90 : 1100, Y0 = v ? 1500 : 640;
    const rows = [['w', Math.round(w)], ['h', Math.round(h)], ['r', Math.round(r)]];
    rows.forEach(([k2, val], i) => { x.save(); x.translate(X, Y0 + i * (v ? 64 : 70)); x.scale(ro, ro); mono(x, `${k2}: ${String(val).padStart(3, ' ')}`, 0, 0, v ? 44 : 46, ink(t), 'left', true); x.restore(); });
    if (!v) cap(x, t, bt(38.5), 'כל פריים: Claude מחשב את המספרים מחדש.', L.right, 900, { size: 38, tOut: bt(43.6), color: sub(t) });
  }
}

/* ===================== 03 · morph, never fade (b48–64) ===================== */
function hexPath(x, cx, cy, R, rot) { x.beginPath(); for (let i = 0; i < 6; i++) { const a = rot + i * Math.PI / 3; const X = cx + R * Math.cos(a), Y = cy + R * Math.sin(a); i ? x.lineTo(X, Y) : x.moveTo(X, Y); } x.closePath(); }
function morph(x, t, L) {
  if (!win(t, 47.4, 64.6)) return;
  const v = isV(L);
  kick(x, t, L, bt(48.3), '03 · MORPH', bt(63.6));
  const fp = markP(x);
  head(x, t, L, 0, ['משנים', 'צורה,'], bt(48.5), bt(52.4), { colors: [W, fp] });
  head(x, t, L, 1, ['לא', 'מעלימים.'], bt(49.5), bt(52.4));
  // fade ✕ vs morph ✓
  const k = gone(t, bt(52.2), 0.3);
  const cards = v ? [[290, 1180], [790, 1180]] : [[1040, 620], [440, 620]];
  const CW = v ? 460 : 470, CH = v ? 460 : 380;
  [['פייד', false], ['מורף', true]].forEach(([name, good], i) => {
    const s = pop(t, bt(50) + i * 0.25, 14, 0.6) * k; if (s <= 0.01) return;
    const [X, Y] = cards[i]; x.save(); x.translate(X, Y); x.scale(s, s);
    card(x, 0, 0, CW, CH, 40, { fill: NAVY2, depth: 0.6 });
    const ph = ((t - bt(50)) % 2) / 2;
    if (!good) { x.save(); x.globalAlpha = 0.15 + 0.85 * Math.abs(Math.cos(ph * Math.PI)); rrc(x, 0, -20, 150, 150, 26); x.fillStyle = W; x.fill(); x.restore(); }
    else { const u = io3(Math.abs(Math.sin(ph * Math.PI))); rrc(x, 0, -20, lerp(150, 300, u), lerp(150, 110, u), lerp(26, 55, u)); x.fillStyle = PINK; x.fill(); }
    x.font = FT.he(56); x.direction = 'rtl'; x.textAlign = 'center'; x.fillStyle = good ? CYAN : CORAL; x.fillText(name + (good ? ' ✓' : ' ✕'), 0, CH / 2 - 40);
    x.restore();
  });
  // the button from chapter 02 is pressed and floods the frame with pink, which later contracts into a dot
  const bx = v ? 540 : 640, by = v ? 1180 : 600;
  const bs = t < bt(52.2) ? 0 : 1;
  const fl = out3(inv(bt(53), bt(53) + 0.36, t)), ct = io3(inv(bt(55), bt(55) + 0.36, t));
  const R0 = 55, RMAX = coverR(L.W, L.H, bx, by);
  if (t > bt(52.2) && t < bt(56.2)) {
    const R = fl < 1 ? R0 + (RMAX - R0) * fl : lerp(RMAX, 30, ct);
    if (fl <= 0) { const pr = press(t, bt(53) - 0.12, bt(53) + 0.02, 0.9); card(x, bx, by, 300 * pr, 110 * pr, 55, { fill: NAVY2, depth: 0.5 }); neonFast(x, bx, by, 300 * pr, 110 * pr, 55, t * 2, { power: 0.8 }); x.save(); x.font = FT.he(54); x.direction = 'rtl'; x.textAlign = 'center'; x.fillStyle = W; x.fillText('לחצו', bx, by + 19); x.restore(); }
    else { circle(x, bx, by, R); x.fillStyle = PINK; x.fill(); }
    if (t > bt(52.4) && t < bt(53.3)) { const a = io3(inv(bt(52.4), bt(52.95), t)); cursor(x, lerp(bx - 260, bx + 10, a), lerp(by + 240, by + 14, a), (v ? 1.2 : 1.05) * press(t, bt(53) - 0.12, bt(53) + 0.05, 0.85), NAVY, W); clickRing(x, bx + 10, by + 14, t, bt(53), PINK, 90); }
    // label on the fire
    slamWords(x, t, ['הצפה'], bx, by - (v ? 40 : 30), v ? 210 : 230, FT.he, NAVY, [bt(53.5)], bt(54.7), {});
    slamWords(x, t, ['flood'], bx, by + (v ? 130 : 130), v ? 90 : 96, FT.en, NAVY, [bt(54)], bt(54.7), { ltr: true });
  }
  // iris: six blades open from the dot onto a photo
  const ir = io3(inv(bt(56), bt(56.6), t)), push = io3(inv(bt(60), bt(61.2), t));
  const PW = v ? 960 : 1000, PH = v ? 600 : 560, pcx = v ? 540 : 640, pcy = v ? 1180 : 600;
  if (t > bt(55.9) && t < bt(61.3) && PHOTO) {
    const slide = push * (L.W + PW);
    x.save(); x.translate(slide, 0);
    const Rap = lerp(30, Math.hypot(PW, PH) * 0.62, ir);
    x.save(); rrc(x, pcx, pcy, PW, PH, 40); x.clip(); hexPath(x, pcx, pcy, Rap, t * 0.6 + (1 - ir) * 1.2); x.clip();
    const z = logLerp(1.12, 1.0, ir), iw = PW * z, ih = iw * PHOTO.height / PHOTO.width;
    x.drawImage(PHOTO, pcx - iw / 2, pcy - Math.max(ih, PH * z) / 2, iw, Math.max(ih, PH * z)); x.restore();
    // the blades: dark wedges between the aperture and the card edge
    if (ir < 1) { x.save(); rrc(x, pcx, pcy, PW, PH, 40); x.clip(); x.beginPath(); x.rect(pcx - PW, pcy - PH, PW * 2, PH * 2); hexPath(x, pcx, pcy, Rap, t * 0.6 + (1 - ir) * 1.2); x.fillStyle = NAVY2; x.fill('evenodd'); x.restore(); }
    x.restore();
    const ls = pop(t, bt(57), 18, 0.55) * gone(t, bt(59.6));
    if (ls > 0.01) pill(x, pcx, pcy + PH / 2 + (v ? 80 : 70), 'צמצם · iris', ls, { size: 38, fill: NAVY2, color: CYAN });
  }
  // push: a new day page pushes in from the left (RTL) and pushes the photo out to the right
  if (t > bt(60) && t < bt(61.3)) {
    const X = lerp(-L.W, 0, push);
    x.save(); x.beginPath(); x.rect(X, 0, L.W, L.H); x.clip(); x.fillStyle = gradPaint(x, 0, 0, L.W, L.H, SKY); x.fillRect(0, 0, L.W, L.H); x.restore();
  }
  // recap on the new page: the four names
  const names = [['מורף', 'morph'], ['הצפה', 'flood'], ['צמצם', 'iris'], ['דחיפה', 'push']];
  names.forEach(([heb, en], i) => {
    const s = pop(t, bt(61.6) + i * 0.5, 18, 0.55) * gone(t, bt(63.7)); if (s <= 0.01) return;
    const X = v ? 540 : 1500 - (i % 2) * 520, Y = v ? 700 + i * 170 : 480 + Math.floor(i / 2) * 200;
    const X2 = v ? 540 : X;
    pill(x, X2, Y, `${heb} · ${en}`, s, { size: 46, fill: W, color: NAVY, padX: 40 });
  });
  head(x, t, L, 0, ['ככה', 'זה', 'נקרא.'], bt(62), bt(63.7), v ? { y: 1500 } : { y: 300 });
}

/* ===================== 04 · the beat (b64–80) ===================== */
function beat(x, t, L) {
  if (!win(t, 63.9, 80.6)) return;
  const v = isV(L);
  kick(x, t, L, bt(64.3), '04 · BEAT', bt(79.6));
  head(x, t, L, 0, ['המוזיקה'], bt(64.5), bt(71.6));
  head(x, t, L, 1, ['היא', 'השעון.'], bt(65), bt(71.6), { marker: { i: 1, paint: markP(x) } });
  head(x, t, L, 0, ['השיא', 'נוחת'], bt(72), bt(79.4));
  head(x, t, L, 1, ['על', 'הביט.'], bt(73), bt(79.4), { marker: { i: 1, paint: markP(x) } });
  // a timeline of 8 beats (b66–74) with a playhead that moves with the real clock
  const X0 = v ? 80 : 120, X1 = v ? 1000 : 1100, Y = v ? 1180 : 640, tl = pop(t, bt(65.5), 14, 0.62) * gone(t, bt(73.6), 0.35);
  const b0 = 66, nb = 8, px = b => X0 + (X1 - X0) * (b - b0) / nb;
  if (tl > 0.01) {
    x.save(); x.translate((X0 + X1) / 2, Y); x.scale(tl, tl); x.translate(-(X0 + X1) / 2, -Y);
    card(x, (X0 + X1) / 2, Y, X1 - X0 + 80, v ? 420 : 380, 40, { fill: W, depth: 0.6 });
    rrc(x, (X0 + X1) / 2, Y + 60, X1 - X0, 8, 4); x.fillStyle = rgba(NAVY, 0.15); x.fill();
    for (let b = b0; b <= b0 + nb; b++) {
      const pulse = t >= bt(b) ? Math.exp(-(t - bt(b)) * 6) : 0;
      rrc(x, px(b), Y + 60, 6, 40 + 30 * pulse, 3); x.fillStyle = b % 4 === 0 ? PINK : NAVY; x.fill();
      if (b < b0 + nb) mono(x, String(b), px(b), Y + 120, 22, rgba(NAVY, 0.55), 'center');
    }
    // events: one block lands on every beat the playhead reaches (b68–74)
    for (let b = 68; b < b0 + nb; b++) {
      const s = spring(t - bt(b) + 0.12, 16, 0.5); if (s <= 0) continue;
      const yy = Y - 10 - (1 - clamp(s, 0, 1)) * 140; rrc(x, px(b), yy, 54 * clamp(s, 0, 1.2), 54 * clamp(s, 0, 1.2), 14); x.fillStyle = firePaint(x, px(b) - 27, 0, px(b) + 27, 0); x.fill();
    }
    const ph = clamp((t - bt(b0)) / (nb * B));
    const hx = X0 + (X1 - X0) * ph; rrc(x, hx, Y + 20, 5, 170, 2.5); x.fillStyle = PINK; x.fill(); circle(x, hx, Y - 66, 10 + 5 * beatPulse(t)); x.fill();
    pill(x, X0 + 110, Y - (v ? 170 : 150), '120 BPM', pop(t, bt(66), 18, 0.55), { font: FT.monoB, size: 30, fill: NAVY, color: CYAN });
    mono(x, 'beat = 0.5s', X1 - 10, Y - (v ? 160 : 140), 28, NAVY, 'right', true);
    x.restore();
    cap(x, t, bt(68.5), 'משהו קורה על כל ביט.', v ? L.W / 2 : L.right, v ? 1500 : 640, { align: v ? 'center' : 'right', size: 42, tOut: bt(71.6) });
  }
  // a sound effect, zoomed: the file starts early so its peak lands on the beat
  const zs = pop(t, bt(74.2), 13, 0.65) * gone(t, bt(78.2), 0.35);
  if (zs > 0.01) {
    const cx = v ? 540 : 620, cy = v ? 1180 : 620, WW = v ? 920 : 960, HH = v ? 420 : 400;
    x.save(); x.translate(cx, cy); x.scale(zs, zs);
    card(x, 0, 0, WW, HH, 40, { fill: W, depth: 0.7 });
    const beatX = 120, startX = -170;
    // waveform: a short rise to the peak at the beat line, then a decay
    x.beginPath();
    for (let i = 0; i <= 300; i++) {
      const X = -WW / 2 + 60 + (WW - 120) * i / 300, rel = X - startX;
      const env = X < startX ? 0 : X < beatX ? Math.pow((X - startX) / (beatX - startX), 3) : Math.exp(-(X - beatX) / 70);
      const a = env * (0.55 + 0.45 * Math.sin(i * 1.7) * Math.sin(i * 0.37)) * 120;
      x.moveTo(X, -a); x.lineTo(X, a);
    }
    x.lineWidth = 3; x.strokeStyle = NAVY; x.stroke();
    rrc(x, beatX, 0, 6 + 4 * beatPulse(t), HH - 80, 3); x.fillStyle = PINK; x.fill();
    mono(x, 'beat', beatX, -HH / 2 + 44, 26, NAVY, 'center', true);
    const ar = clamp((t - bt(75)) / 0.4);
    if (ar > 0) { x.save(); x.strokeStyle = CORAL; x.lineWidth = 4; x.beginPath(); x.moveTo(startX, HH / 2 - 60); x.lineTo(lerp(startX, beatX, ar), HH / 2 - 60); x.stroke(); x.restore(); mono(x, 'file start', startX - 8, HH / 2 - 76, 24, CORAL, 'right', true); mono(x, 'peak', beatX + 14, -HH / 2 + 84, 26, NAVY, 'left', true); }
    x.restore();
    cap(x, t, bt(75.5), 'האפקט מתחיל קצת לפני הביט,', v ? L.W / 2 : L.right, v ? 1480 : 560, { align: v ? 'center' : 'right', size: 40, tOut: bt(78) });
    cap(x, t, bt(76), 'כדי שהשיא שלו ינחת עליו.', v ? L.W / 2 : L.right, v ? 1540 : 616, { align: v ? 'center' : 'right', size: 40, tOut: bt(78) });
  }
}

/* ===================== 05 · the prompt (b80–104) ===================== */
const BLOCKS = [['<inputs>', 'מה לבקש ממני'], ['<direction>', 'איך זה נראה, ומה אסור'], ['<structure>', 'מה קורה בכל ביט'], ['<build>', 'איך לבנות, טכנית'], ['<gotchas>', 'באגים שכבר פגשנו'], ['<start>', 'סטילס לפני הרינדור']];
function prompt(x, t, L) {
  if (!win(t, 77.5, 104.6)) return;
  const v = isV(L);
  kick(x, t, L, bt(80.3), '05 · PROMPT', bt(103.6));
  head(x, t, L, 0, ['הפרומפט:'], bt(80.5), bt(87.8));
  head(x, t, L, 1, ['6', 'בלוקים'], bt(81), bt(87.8), { marker: { i: 0, paint: markP(x) } });
  head(x, t, L, 0, ['מספרים'], bt(88.5), bt(95.8));
  head(x, t, L, 1, ['במקום', 'תארים.'], bt(89), bt(95.8), { marker: { i: 1, paint: markP(x) } });
  head(x, t, L, 0, ['רשימת'], bt(96.5), bt(103.6));
  head(x, t, L, 1, ['האסור.'], bt(97), bt(103.6), { marker: { i: 0, paint: markP(x) } });
  // six cards: born from the beat blocks of chapter 04 (they gather at b78–80), one per beat
  const cx = v ? 540 : 640, CW = v ? 960 : 900, CH = v ? 120 : 96, gap = v ? 150 : 110, y0 = v ? 720 : 270;
  const away = io3(inv(bt(87.6), bt(88.4), t));
  BLOCKS.forEach(([tag, gloss], i) => {
    const s = pop(t, bt(82) + i * B, 15, 0.58); if (s <= 0.01) return;
    const y = lerp(y0 + i * gap, (v ? 560 : 200), away), sc = s * (1 - away);
    if (sc <= 0.01) return;
    x.save(); x.translate(cx + (1 - clamp(s)) * 200, y); x.scale(sc, sc);
    card(x, 0, 0, CW, CH, CH / 2, { fill: W, depth: 0.45 });
    mono(x, tag, -CW / 2 + 40, 11, v ? 36 : 32, ORANGE, 'left', true);
    x.font = FT.textB(v ? 44 : 38); x.direction = 'rtl'; x.textAlign = 'right'; x.fillStyle = NAVY; x.fillText(gloss, CW / 2 - 40, 13);
    x.restore();
  });
  // numbers instead of adjectives: three swaps
  const SW = [['מהר', '0.35s'], ['רקע חם', '#F5F5F2'], ['קופצני', 'spring ζ 0.55']];
  const swOut = gone(t, bt(95.6), 0.3);
  SW.forEach(([adj, num], i) => {
    const t0 = bt(90 + i * 2), s = pop(t, t0, 16, 0.58) * swOut; if (s <= 0.01) return;
    const y = (v ? 760 : 330) + i * (v ? 230 : 210), ax = v ? 790 : 960, nx = v ? 330 : 360;
    const aw = pill(x, ax, y, adj, s, { size: 46, fill: W, color: NAVY, padX: 36 });
    const st = clamp((t - t0 - 0.4) / 0.25); if (st > 0) { x.save(); x.strokeStyle = CORAL; x.lineWidth = 7; x.lineCap = 'round'; x.beginPath(); x.moveTo(ax + aw / 2 * s - 18, y); x.lineTo(ax + aw / 2 * s - 18 - (aw * s - 36) * st, y); x.stroke(); x.restore(); }
    const ns = pop(t, t0 + 0.55, 18, 0.5) * swOut; if (ns > 0.01) { pill(x, nx, y, num, ns, { size: 40, font: FT.monoB, fill: NAVY, color: CYAN, padX: 30 }); x.save(); x.font = FT.en(56); x.fillStyle = ink(t); x.textAlign = 'center'; x.fillText('←', (ax + nx) / 2 + (v ? 40 : 60), y + 20); x.restore(); }
  });
  // the banned list
  const BAN = ['קרוספייד', 'כניסה מטושטשת', 'חלקיקים על שחור', 'עצירה ארוכה'];
  const coll = io3(inv(bt(102), bt(103), t));
  BAN.forEach((b, i) => {
    const s = pop(t, bt(97.5) + i * B, 16, 0.55); if (s <= 0.01) return;
    const col = i % 2, row = Math.floor(i / 2);
    let X = v ? 540 : 860 - col * 460, Y = v ? 760 + i * 170 : 360 + row * 200;
    X = lerp(X, v ? 540 : 640, coll); Y = lerp(Y, v ? 1180 : 600, coll);
    const k = s * (1 - coll); if (k <= 0.01) return;
    const w = pill(x, X, Y, b + '  ✕', k, { size: 42, fill: W, color: CORAL, padX: 36, stroke: CORAL });
  });
  cap(x, t, bt(100), 'מוחקים את הממוצע, ומה שנשאר הוא הסגנון שלנו.', v ? L.W / 2 : L.right, v ? 1560 : 640, { align: v ? 'center' : 'right', size: v ? 38 : 40, tOut: bt(103.6) });
  // the collapsed banned chips become a question-mark chip (the dictionary asks: what is it called?)
  const qs = coll > 0.9 ? pop(t, bt(103), 18, 0.55) * gone(t, bt(104.2)) : 0;
  if (qs > 0.01) pill(x, v ? 540 : 640, v ? 1180 : 600, '?', qs, { size: 90, font: FT.he, fill: NAVY, color: PINK, padX: 50 });
}

/* ===================== 06 · words: the interface dictionary (b104–120) ===================== */
const WORDS = [['Composer', 'תיבת הקלט'], ['Pill', 'כפתור מעוגל'], ['Toast', 'הודעה קופצת'], ['Dynamic Island', 'הקפסולה באייפון'], ['Morph', 'הופך לדבר אחר'], ['Flood', 'צבע שמציף'], ['Iris', 'צמצם'], ['Push in', 'זום פנימה']];
function miniIcon(x, i, cx, cy, s, t) {
  const ph = (t * 0.9 + i * 0.37) % 1, u = io3(Math.abs(Math.sin(ph * Math.PI)));
  x.save(); x.translate(cx, cy); x.scale(s, s); x.fillStyle = NAVY; x.strokeStyle = NAVY; x.lineWidth = 4;
  if (i === 0) { rrc(x, 0, 0, 96, 36, 18); x.stroke(); rrc(x, 30 - 50 * u, 0, 3, 18, 1); x.fill(); }
  else if (i === 1) { rrc(x, 0, 0, 90, 38, 19); x.fillStyle = firePaint(x, -45, 0, 45, 0); x.fill(); }
  else if (i === 2) { rrc(x, 0, 18 - 30 * u, 92, 30, 15); x.fill(); }
  else if (i === 3) { rrc(x, 0, 0, lerp(46, 96, u), lerp(20, 34, u), 17); x.fill(); }
  else if (i === 4) { rrc(x, 0, 0, lerp(40, 90, u), lerp(40, 30, u), lerp(8, 15, u)); x.fillStyle = firePaint(x, -45, 0, 45, 0); x.fill(); }
  else if (i === 5) { circle(x, 0, 0, 6 + 26 * u); x.fillStyle = PINK; x.fill(); }
  else if (i === 6) { hexPath(x, 0, 0, 30, u * 1.2); x.stroke(); hexPath(x, 0, 0, 8 + 16 * u, u * 1.2); x.fill(); }
  else { rrc(x, 0, 0, lerp(30, 80, u), lerp(22, 44, u), 6); x.stroke(); }
  x.restore();
}
function words(x, t, L) {
  if (!win(t, 103.6, 120.6)) return;
  const v = isV(L);
  kick(x, t, L, bt(104.3), '06 · WORDS', bt(119.6));
  head(x, t, L, 0, ['איך', 'קוראים'], bt(104.5), bt(111.8), { marker: { i: 1, paint: markP(x) } });
  head(x, t, L, 1, ['לזה?'], bt(105.5), bt(111.8));
  head(x, t, L, 0, ['שם', 'מדויק'], bt(112.5), bt(119.6));
  head(x, t, L, 1, ['=', 'פרומפט', 'מדויק.'], bt(113.5), bt(119.6), { marker: { i: 1, paint: markP(x) } });
  const cols = v ? 2 : 2, CW = v ? 460 : 470, CH = v ? 200 : 180, gx = v ? 490 : 500, gy = v ? 220 : 200;
  const ox = v ? 540 : 640, oy = v ? 660 : 250;
  const toDots = io3(inv(bt(117.5), bt(119.5), t));
  WORDS.forEach(([en, he], i) => {
    const s = pop(t, bt(106) + i * B / 2, 16, 0.55); if (s <= 0.01) return;
    const col = i % cols, row = Math.floor(i / cols);
    const X = ox + (col === 0 ? gx / 2 : -gx / 2), Y = oy + row * gy;
    const k = s * (1 - toDots);
    if (k > 0.02) {
      x.save(); x.translate(X, Y); x.scale(k, k);
      card(x, 0, 0, CW, CH, 36, { fill: W, depth: 0.4 });
      miniIcon(x, i, -CW / 2 + 80, 0, 1, t);
      x.font = FT.en(44); x.direction = 'ltr'; x.textAlign = 'right'; x.fillStyle = NAVY; x.fillText(en, CW / 2 - 30, -6);
      x.font = FT.textB(32); x.direction = 'rtl'; x.textAlign = 'right'; x.fillStyle = rgba(NAVY, 0.7); x.fillText(he, CW / 2 - 30, 44);
      x.restore();
    }
    if (toDots > 0) { const d = clamp(toDots); circle(x, lerp(X, L.W / 2, d * 0.2), Y, 8 * d); x.fillStyle = PINK; x.fill(); }
  });
  const us = pop(t, bt(115), 18, 0.55) * gone(t, bt(119.6));
  if (us > 0.01) pill(x, v ? 540 : L.right - 330, v ? 1640 : L.hy + 330, 'news.yuv.ai/motion/dictionary', us, { font: FT.monoB, size: v ? 30 : 30, fill: NAVY, color: CYAN });
  cap(x, t, bt(108), 'כל רכיב: השם באנגלית, הסבר, ומשפט להעתקה.', v ? L.W / 2 : L.right, v ? 1560 : 560, { align: v ? 'center' : 'right', size: v ? 36 : 38, tOut: bt(111.8), color: sub(t) });
}

/* ===================== 07 · engines (b120–136) ===================== */
function engines(x, t, L) {
  if (!win(t, 119.6, 136.6)) return;
  const v = isV(L);
  kick(x, t, L, bt(120.3), '07 · ENGINES', bt(135.6));
  const fp = markP(x);
  head(x, t, L, 0, ['מי', 'מצייר'], bt(120.5), bt(129.6));
  head(x, t, L, 1, ['את', 'הפיקסלים?'], bt(121.5), bt(129.6), { colors: [W, fp] });
  head(x, t, L, 0, ['4', 'מנועים.'], bt(130), bt(135.6), { colors: [fp, W] });
  // CPU (a few big cores) vs GPU (hundreds of tiny ones)
  const dA = io3(inv(bt(125.6), bt(126.4), t));
  const cpuS = pop(t, bt(122.5), 14, 0.6) * (1 - dA), gpuS = pop(t, bt(123), 14, 0.6);
  const c1 = v ? [540, 760] : [860, 650], c2 = v ? [540, 1300] : [320, 650];   // 16:9: clear of the headline column (x ≥ 1150), held longer now
  const CW = v ? 900 : 480, CH = v ? 420 : 460;
  if (cpuS > 0.01) {
    x.save(); x.translate(c1[0], c1[1]); x.scale(cpuS, cpuS); card(x, 0, 0, CW, CH, 40, { fill: NAVY2, depth: 0.6 });
    for (let i = 0; i < 8; i++) { const col = i % 4, row = Math.floor(i / 4), on = Math.floor(t / (B / 2)) % 8 === i; rrc(x, (col - 1.5) * (v ? 150 : 110), -40 + (row - 0.5) * (v ? 130 : 120), v ? 120 : 90, v ? 100 : 90, 18); x.fillStyle = on ? CYAN : rgba(W, 0.18); x.fill(); }
    x.font = FT.he(54); x.direction = 'rtl'; x.textAlign = 'center'; x.fillStyle = W; x.fillText('CPU · כמה שפים', 0, CH / 2 - 44); x.restore();
  }
  // the GPU card grows into the shader canvas
  if (gpuS > 0.01) {
    const gx = lerp(c2[0], v ? 540 : 640, dA), gy = lerp(c2[1], v ? 1150 : 600, dA);
    const gw = lerp(CW, v ? 960 : 1000, dA), gh = lerp(CH, v ? 760 : 620, dA);
    const fold = io3(inv(bt(129.6), bt(130.4), t));
    x.save(); x.translate(gx, gy); x.scale(gpuS * (1 - fold), gpuS * (1 - fold));
    if (gpuS * (1 - fold) > 0.01) {
      card(x, 0, 0, gw, gh, 40, { fill: NAVY2, depth: 0.6 });
      const nx = dA > 0.5 ? 48 : 32, ny = dA > 0.5 ? 27 : 18, cw = (gw - 80) / nx, ch = (gh - (dA > 0.5 ? 80 : 150)) / ny, ox = -gw / 2 + 40, oy = -gh / 2 + 40;
      const sunY = lerp(0.25, 0.85, clamp((t - bt(126.5)) / 3)), wave = (t - bt(123)) * 9;
      for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
        let col;
        if (dA < 0.5) { const on = ((i + j + Math.floor(wave)) % 12) === 0; col = on ? PINK : rgba(W, 0.16); }
        else {   // the shader: colour = f(pixel, t): a sky gradient and a sun that sets
          const u = (i + 0.5) / nx, vv = (j + 0.5) / ny, set = clamp(sunY), d = Math.hypot((u - 0.5) * 1.8, vv - sunY);
          const top = mix('#2C78D2', '#3A2470', set), low = mix('#93CBFF', '#FF8F3A', set);
          let c = mix(top, low, Math.pow(vv, 0.8));
          if (vv > 0.78) c = mix('#12163F', '#F56B49', set * (1 - (vv - 0.78) * 2));   // the sea below the horizon
          col = d < 0.1 ? '#FFF1C2' : mix(c, '#FFC74E', clamp(0.5 - d) * 1.6);
        }
        rr(x, ox + i * cw + 1.5, oy + j * ch + 1.5, cw - 3, ch - 3, 3); x.fillStyle = col; x.fill();
      }
      if (dA < 0.5) { x.font = FT.he(54); x.direction = 'rtl'; x.textAlign = 'center'; x.fillStyle = W; x.fillText('GPU · אלף טבחים', 0, gh / 2 - 44); }
    }
    x.restore();
    const ls = pop(t, bt(126.6), 18, 0.55) * gone(t, bt(129.6));
    if (ls > 0.01) pill(x, v ? 540 : 640, (v ? 1150 : 600) + (v ? 460 : 380), 'color = f(pixel, t)', ls, { font: FT.monoB, size: 36, fill: W, color: NAVY });
    cap(x, t, bt(127.5), 'שיידר: תוכנית קטנה שרצה על כל פיקסל.', v ? L.W / 2 : L.right, v ? 1730 : 640, { align: v ? 'center' : 'right', size: v ? 36 : 40, tOut: bt(129.6) });
  }
  cap(x, t, bt(123.5), 'כרטיס מסך: אלפי ליבות קטנות, במקביל.', v ? L.W / 2 : L.right, v ? 1640 : 580, { align: v ? 'center' : 'right', size: v ? 36 : 40, tOut: bt(125.6) });
  // the four engines
  const ENG = [['HTML / CSS', 'ממשק וטקסט'], ['Canvas 2D', 'תנועה דו-ממדית'], ['WebGL', 'תלת-ממד ושיידרים'], ['WebGPU', 'מאות אלפי חלקיקים']];
  const toP = io3(inv(bt(133), bt(133.8), t));
  ENG.forEach(([en, he], i) => {
    const s = pop(t, bt(130.5) + i * B / 2, 16, 0.56) * (1 - toP); if (s <= 0.01) return;
    const X = v ? 540 : 640, Y = (v ? 760 : 300) + i * (v ? 190 : 150), CW2 = v ? 940 : 900, CH2 = v ? 150 : 120;
    x.save(); x.translate(X, Y); x.scale(s, s); card(x, 0, 0, CW2, CH2, CH2 / 2, { fill: i === 3 ? pcPaint(x, -CW2 / 2, 0, CW2 / 2, 0) : NAVY2, depth: 0.5 });
    x.font = FT.en(v ? 50 : 46); x.direction = 'ltr'; x.textAlign = 'left'; x.fillStyle = i === 3 ? NAVY : CYAN; x.fillText(en, -CW2 / 2 + 46, 16);
    x.font = FT.textB(v ? 40 : 38); x.direction = 'rtl'; x.textAlign = 'right'; x.fillStyle = i === 3 ? NAVY : W; x.fillText(he, CW2 / 2 - 46, 14);
    x.restore();
  });
  // particles: a sphere that becomes a galaxy (drawn here in 2D; in the catalog it is 200,000 on WebGPU)
  if (t > bt(133)) {
    const cx = v ? 540 : 640, cy = v ? 1150 : 600, Rr = v ? 330 : 300, N = 1600;
    const g = io3(inv(bt(134), bt(135.4), t)), born = clamp((t - bt(133)) / 0.8), toLine = io3(inv(bt(135.6), bt(136.4), t));
    for (let i = 0; i < N; i++) {
      const r1 = rnd(i), r2 = rnd(i + 7.1), r3 = rnd(i + 13.7);
      const th = r1 * Math.PI * 2 + t * 0.5, z = r2 * 2 - 1, rr2 = Math.sqrt(1 - z * z);
      const ax = Math.cos(th) * rr2 * Rr, ay = z * Rr * 0.95;
      const arm = Math.floor(r3 * 3), rad = Math.pow(r1, 0.6) * Rr * 1.25, ang = rad / Rr * 2.6 + arm * 2.094 + t * 0.6 + (r2 - 0.5) * 0.5;
      const bx = Math.cos(ang) * rad, by = Math.sin(ang) * rad * 0.45;
      const gi = clamp(g * 1.3 - r3 * 0.3);
      let X = cx + lerp(ax, bx, gi) * born, Y = cy + lerp(ay, by, gi) * born;
      if (toLine > 0) { const lx = cx - Rr * 1.4 + r1 * Rr * 2.8; X = lerp(X, lx, clamp(toLine * 1.4 - r3 * 0.4)); Y = lerp(Y, cy, clamp(toLine * 1.4 - r3 * 0.4)); }
      x.fillStyle = r3 > 0.66 ? PINK : r3 > 0.33 ? CYAN : (r2 > 0.55 ? GOLD : W);
      x.fillRect(X - 1.6, Y - 1.6, 3.2, 3.2);
    }
    const ls = pop(t, bt(134), 18, 0.55) * gone(t, bt(135.6));
    if (ls > 0.01) { pill(x, cx, cy + Rr + (v ? 110 : 50), 'חלקיקים על WebGPU', ls, { size: 34, fill: NAVY2, color: W }); pill(x, cx, cy - Rr - (v ? 90 : 40), '200,000', ls, { font: FT.monoB, size: 34, fill: CYAN, color: NAVY }); }
  }
}

/* ===================== 08 · real world + breakdown (b136–152) ===================== */
const ROUTE = [[0.18, 0.28], [0.52, 0.28], [0.52, 0.55], [0.78, 0.55], [0.78, 0.8]];
function routeAt(u, MW, MH) {
  const P = ROUTE.map(([a, b]) => [a * MW, b * MH]); const seg = P.slice(1).map((p, i) => Math.hypot(p[0] - P[i][0], p[1] - P[i][1])); const tot = seg.reduce((a, b) => a + b, 0);
  let d = clamp(u) * tot; for (let i = 0; i < seg.length; i++) { if (d <= seg[i] || i === seg.length - 1) { const k = seg[i] ? d / seg[i] : 0; return [lerp(P[i][0], P[i + 1][0], k), lerp(P[i][1], P[i + 1][1], k), P, seg, tot, i]; } d -= seg[i]; }
}
function realWorld(x, t, L) {
  if (!win(t, 135.6, 152.8)) return;
  const v = isV(L);
  kick(x, t, L, bt(136.3), '08 · REAL WORLD', bt(143.6));
  head(x, t, L, 0, ['עולם'], bt(136.5), bt(143.6));
  head(x, t, L, 1, ['אמיתי.'], bt(137), bt(143.6), { marker: { i: 0, paint: markP(x) } });
  const MW = v ? 960 : 1000, MH = v ? 720 : 620, mx = v ? 540 : 640, my = v ? 1150 : 600;
  const ms = pop(t, bt(136.6), 13, 0.65), shrink = io3(inv(bt(144), bt(144.8), t));
  const endP = [mx - MW / 2 + ROUTE[4][0] * MW, my - MH / 2 + ROUTE[4][1] * MH];
  if (ms > 0.01 && shrink < 1) {
    const k = ms * (1 - shrink);
    x.save(); x.translate(lerp(mx, endP[0], shrink), lerp(my, endP[1], shrink)); x.scale(k, k); x.translate(-mx, -my);
    card(x, mx, my, MW, MH, 40, { fill: '#F3F6FC', depth: 0.7 });
    x.save(); rrc(x, mx, my, MW, MH, 40); x.clip(); x.translate(mx - MW / 2, my - MH / 2);
    x.fillStyle = '#BFDDFB'; x.fillRect(0, 0, 60, MH);
    x.fillStyle = '#DCEBDD'; rr(x, MW * 0.6, MH * 0.08, MW * 0.14, MH * 0.16, 20); x.fill(); rr(x, MW * 0.22, MH * 0.62, MW * 0.18, MH * 0.2, 20); x.fill();
    x.lineCap = 'round'; [0.28, 0.55, 0.8].forEach(f => { x.strokeStyle = W; x.lineWidth = 26; x.beginPath(); x.moveTo(60, f * MH); x.lineTo(MW, f * MH); x.stroke(); });
    [0.18, 0.35, 0.52, 0.78, 0.92].forEach(f => { x.strokeStyle = W; x.lineWidth = 22; x.beginPath(); x.moveTo(f * MW, 0); x.lineTo(f * MW, MH); x.stroke(); });
    const drawn = io3(inv(bt(137.5), bt(139), t)), ride = io3(inv(bt(139), bt(142.6), t));
    const [, , P, seg, tot] = routeAt(0, MW, MH);
    const part = (a, b) => { x.beginPath(); let d = 0, st = false; for (let i = 0; i < seg.length; i++) { const e = d + seg[i]; if (e >= a * tot && d <= b * tot) { const u0 = clamp((a * tot - d) / seg[i]), u1 = clamp((b * tot - d) / seg[i]); const p0 = [lerp(P[i][0], P[i + 1][0], u0), lerp(P[i][1], P[i + 1][1], u0)], p1 = [lerp(P[i][0], P[i + 1][0], u1), lerp(P[i][1], P[i + 1][1], u1)]; if (!st) { x.moveTo(...p0); st = true; } x.lineTo(...p1); } d = e; } };
    x.lineJoin = 'round'; x.strokeStyle = NAVY; x.lineWidth = 8; x.setLineDash([2, 16]); part(ride, drawn); x.stroke(); x.setLineDash([]);
    if (ride > 0) { x.strokeStyle = PINK; x.lineWidth = 11; part(0, ride); x.stroke(); }
    const [cxr, cyr] = routeAt(ride, MW, MH);
    const pinPop = pop(t, bt(137), 16, 0.5);
    const pinHead = (X, Y, col, s) => { x.save(); x.translate(X, Y); x.scale(s, s); x.fillStyle = col; x.beginPath(); x.moveTo(0, 0); x.bezierCurveTo(-6, -14, -20, -22, -20, -40); x.arc(0, -40, 20, Math.PI, 0); x.bezierCurveTo(20, -22, 6, -14, 0, 0); x.fill(); circle(x, 0, -40, 8); x.fillStyle = W; x.fill(); x.restore(); };
    pinHead(P[0][0], P[0][1], NAVY, pinPop);
    const arrive = io3(inv(bt(142.8), bt(143.5), t));
    if (arrive < 1) pinHead(P[4][0], P[4][1], CORAL, pinPop * (1 - arrive));
    if (t > bt(139) && t < bt(142.8)) { x.save(); x.translate(cxr, cyr); rrc(x, 0, 0, 40, 30, 15); x.fillStyle = NAVY; x.fill(); x.restore(); }
    x.restore();
    const eta = Math.max(0, Math.ceil(12 * (1 - ride)));
    if (t > bt(139)) pill(x, mx, my - MH / 2 + 60, ride >= 1 ? 'הגיע ✓' : `עוד ${eta} דק׳`, pop(t, bt(139), 16, 0.55), { size: 36, fill: ride >= 1 ? PINK : NAVY, color: ride >= 1 ? NAVY : W });
    x.restore();
  }
  // the destination becomes the fire disc that carries the breakdown
  const dcx = v ? 540 : 960, dcy = v ? 1100 : 600;
  if (t > bt(142.8)) {
    const a = io3(inv(bt(144.6), bt(145.6), t)), r0 = 24;
    const X = lerp(endP[0], dcx, a), Y = lerp(endP[1] - 40, dcy, a), Rr = lerp(r0, 120, a) * (1 + 0.04 * beatPulse(t) * a);
    const toWin = io3(inv(bt(152), bt(152.7), t));
    if (toWin < 1) { circle(x, X, Y, Rr * (1 - toWin * 0.2)); x.fillStyle = firePaint(x, X - Rr, Y - Rr, X + Rr, Y + Rr); x.fill(); x.save(); x.translate(X, Y); x.lineWidth = 12; x.strokeStyle = NAVY; x.lineCap = 'round'; x.lineJoin = 'round'; const c = Rr / 54; x.beginPath(); x.moveTo(-20 * c, 2 * c); x.lineTo(-6 * c, 16 * c); x.lineTo(22 * c, -14 * c); x.stroke(); x.restore(); }
  }
  const chips = ['מפה', 'תמונה', 'חומרים', 'מודל אמיתי'];
  chips.forEach((c, i) => {
    const s = pop(t, bt(138) + i * B, 18, 0.55) * gone(t, bt(143.6)); if (s <= 0.01) return;
    const X = v ? 180 + i * 240 : L.right - 110 - (i % 2) * 260, Y = v ? 1640 : 640 + Math.floor(i / 2) * 120;
    pill(x, X, Y, c, s, { size: 36, fill: W, color: NAVY });
  });
  // breakdown (quiet): slow rise, one thing per beat
  riseWords(x, t, ['ועכשיו:'], v ? 540 : 960, v ? 650 : 330, v ? 150 : 150, FT.he, NAVY, [bt(145.5)], bt(151.6), {});
  riseWords(x, t, ['בונים', 'לבד.'], v ? 540 : 960, v ? 1460 : 900, v ? 150 : 150, FT.he, NAVY, [bt(147), bt(147.5)], bt(151.6), { marker: { i: 0, t: bt(148), color: gradPaint(x, 0, 0, 1920, 0, FIRE) } });
  ['השקה', 'אוכל', 'מוצר', 'נתונים'].forEach((c, i) => {
    const s = pop(t, bt(148) + i * B, 14, 0.7) * gone(t, bt(151.8)); if (s <= 0.01) return;
    const a = -Math.PI / 2 + (i - 1.5) * 0.75 + Math.PI, R = v ? 260 : 250;
    pill(x, dcx + Math.cos(a) * R * (v ? 1.3 : 1.6), dcy + Math.sin(a) * R * 0.9, c, s, { size: 34, fill: W, color: NAVY });
  });
}

/* ===================== 09 · the builder (b152–168) ===================== */
const PROMPT_LINES = ['<inputs>', 'Ask me for: a song around 120 BPM…', '</inputs>', '<direction>', 'A launch film for "Ketzev"… 1920x1080,', '60fps, one continuous take. Objects', 'change shape instead: morph, flood…', '</direction>', '<structure>', 'Beats 0-3, Hook: "כל אימון הוא ביט."', 'Beats 14-21, Progress (THE DROP)…', '</structure>'];
function builder(x, t, L) {
  if (!win(t, 151.6, 168.6)) return;
  const v = isV(L);
  const cx = L.W / 2, cy = v ? 1010 : 560, CW = v ? 1000 : 1720, CH = v ? 1500 : 860;
  const open = clamp(spring(t - bt(152), 11, 0.7), 0, 1.04), shrink = io3(inv(bt(166.6), bt(167.6), t));
  if (open <= 0.01) return;
  const k = open * (1 - shrink * 0.92);
  x.save(); x.translate(cx, cy); x.scale(k, k); x.translate(-cx, -cy);
  card(x, cx, cy, CW, CH, 48, { fill: W, depth: 0.8 });
  // title bar
  x.save(); rrc(x, cx, cy, CW, CH, 48); x.clip(); x.fillStyle = gradPaint(x, cx - CW / 2, 0, cx + CW / 2, 0, FIRE); x.fillRect(cx - CW / 2, cy - CH / 2, CW, 90); x.restore();
  x.font = FT.he(58); x.direction = 'rtl'; x.textAlign = 'right'; x.fillStyle = NAVY; x.fillText('בונה הפרומפטים', cx + CW / 2 - 50, cy - CH / 2 + 66);
  mono(x, '09 · BUILDER', cx - CW / 2 + 50, cy - CH / 2 + 58, 26, NAVY, 'left', true);
  // form (right in RTL) and output (left)
  const fx = v ? cx + CW / 2 - 50 : cx + CW / 2 - 50, fy = cy - CH / 2 + 160;
  const PRE = ['השקת אפליקציה', 'הזמנת אוכל', 'מוצר פיזי', 'נתונים'];
  let px = fx;
  PRE.forEach((p, i) => {
    const s = pop(t, bt(152.6) + i * 0.12, 18, 0.55); const on = t > bt(153.5) && i === 0;
    x.save(); x.font = FT.textB(30); const w = x.measureText(p).width + 50; x.restore();
    pill(x, px - w / 2, fy, p, s, { size: 30, fill: on ? PINK : CLOUD, color: NAVY, padX: 25, shadow: false });
    px -= w + 14;
  });
  const ELS = ['ניאון', 'ממשק', 'מונים', 'טלפון', 'מעברים'];
  px = fx;
  ELS.forEach((e, i) => {
    const on = t > bt(154) + i * 0.125, s = pop(t, bt(153), 18, 0.55);
    x.save(); x.font = FT.textB(28); const w = x.measureText(e).width + 44; x.restore();
    pill(x, px - w / 2, fy + 90, e, s, { size: 28, fill: on ? NAVY : CLOUD, color: on ? W : NAVY, padX: 22, shadow: false });
    px -= w + 12;
  });
  // scenes on the beat grid
  const SC = [['Hook', 4], ['Ask', 6], ['App', 10], ['Progress', 8], ['CTA', 4]], tot = 32;
  const gw = v ? CW - 100 : CW / 2 - 90, gx1 = fx, gy = fy + 200;
  SC.forEach(([n, b], i) => {
    const s = clamp((t - bt(155) - i * B) / 0.35); if (s <= 0) return;
    const y = gy + i * 66; let acc = 0; for (let j = 0; j < i; j++) acc += SC[j][1];
    const x0 = gx1 - gw * acc / tot, w = gw * b / tot * out3(s);
    rr(x, x0 - w, y - 24, w - 6, 48, 14); x.fillStyle = i === 3 ? firePaint(x, x0 - w, 0, x0, 0) : rgba(NAVY, 0.85); x.fill();
    mono(x, n, x0 - 14, y + 9, 24, i === 3 ? NAVY : W, 'right', true);
    if (i === 3 && t > bt(159.5)) { const ds = pop(t, bt(159.5), 18, 0.5); pill(x, x0 - w / 2, y - 52, 'DROP', ds, { font: FT.monoB, size: 20, fill: NAVY, color: CYAN, padX: 12, shadow: false }); }
  });
  // output: the prompt pours in, line by line
  const ox = v ? cx - CW / 2 + 50 : cx - CW / 2 + 50, oy = v ? cy + 40 : cy - CH / 2 + 130, OW = v ? CW - 100 : CW / 2 - 60, OH = v ? 560 : CH - 180;
  rr(x, ox, oy, OW, OH, 28); x.fillStyle = NAVY; x.fill();
  PROMPT_LINES.forEach((ln, i) => {
    const t0 = bt(160) + i * 0.27, n = clamp(Math.floor((t - t0) / 0.012), 0, ln.length); if (n <= 0) return;
    const tag = /^<\/?[a-z]+>$/.test(ln);
    x.save(); x.font = FT.mono(v ? 25 : 24); x.direction = /[֐-׿]/.test(ln) ? 'rtl' : 'ltr';
    if (x.direction === 'rtl') { x.direction = 'ltr'; }
    x.textAlign = 'left'; x.fillStyle = tag ? CYAN : '#E7ECFA'; x.fillText(ln.slice(0, n), ox + 30, oy + 52 + i * (v ? 44 : 50)); x.restore();
  });
  // copy link → toast
  const bxl = ox + OW - 170, byl = oy + OH + (v ? 70 : 0) - (v ? 0 : 0);
  if (!v) { /* button sits under the scenes */ }
  const btnX = v ? cx : fx - 170, btnY = v ? oy + OH + 68 : gy + 5 * 66 + 60;
  pill(x, btnX, btnY, 'העתק קישור', pop(t, bt(158), 18, 0.55), { size: 32, fill: NAVY, color: W, padX: 30 });
  if (t > bt(162.6) && t < bt(164.6)) { const a = io3(inv(bt(162.6), bt(163.8), t)); cursor(x, lerp(btnX - 300, btnX + 10, a), lerp(btnY + 260, btnY + 12, a), (v ? 1.3 : 1.1) * press(t, bt(164) - 0.1, bt(164) + 0.05, 0.85), NAVY, W); clickRing(x, btnX + 10, btnY + 12, t, bt(164), PINK, 80); }
  const ts = pop(t, bt(164.2), 18, 0.5) * gone(t, bt(166.4));
  if (ts > 0.01) pill(x, btnX, btnY - (v ? 100 : 96), 'הועתק ✓', ts, { size: 34, fill: PINK, color: NAVY });
  // stats
  pill(x, v ? cx : ox + OW / 2, v ? oy - 50 : oy + OH + 60, '32 ביטים · 16 שניות · 960 פריימים', pop(t, bt(163), 18, 0.55), { size: 34, fill: CLOUD, color: NAVY, shadow: false });
  x.restore();
  // the window ends as a file: film.html
  if (shrink > 0.85) pill(x, cx, cy, 'film.html', pop(t, bt(167.4), 18, 0.55) * gone(t, bt(168.4)), { font: FT.monoB, size: 44, fill: NAVY, color: CYAN });
}

/* ===================== 10 · render (b168–192) ===================== */
function renderCh(x, t, L) {
  if (!win(t, 167.6, 192.6)) return;
  const v = isV(L);
  kick(x, t, L, bt(168.3), '10 · RENDER', bt(191.6));
  const fp = markP(x);
  head(x, t, L, 0, ['מקוד'], bt(168.5), bt(175.8));
  head(x, t, L, 1, ['לסרטון.'], bt(169), bt(175.8), { colors: [fp] });
  head(x, t, L, 0, ['מושן', 'בלר'], bt(176.5), bt(183.8), { colors: [W, fp] });
  head(x, t, L, 1, ['=', '6', 'צילומים.'], bt(177.5), bt(183.8));
  head(x, t, L, 0, ['סאונד'], bt(184.5), bt(191.4));
  head(x, t, L, 1, ['על', 'הביט.'], bt(185), bt(191.4), { colors: [W, fp] });
  // the pipeline: four nodes, a frame token travelling through them
  const NODES = [['film.html', 'seek(t)'], ['Playwright', 'מצלם כל פריים'], ['ffmpeg', 'מרכיב וידאו'], ['MP4', '60fps']];
  const pos = i => v ? [[790, 760], [290, 760], [290, 1120], [790, 1120]][i] : [[970, 560], [700, 560], [430, 560], [160, 560]][i];
  const comp = io3(inv(bt(175.6), bt(176.4), t));
  NODES.forEach(([en, he], i) => {
    const s = pop(t, bt(170) + i * B, 16, 0.55) * (1 - comp); if (s <= 0.01) return;
    const [X, Y] = pos(i), NW = v ? 420 : 250, NH = v ? 250 : 230;
    x.save(); x.translate(X, Y); x.scale(s, s); card(x, 0, 0, NW, NH, 36, { fill: i === 3 ? firePaint(x, -NW / 2, 0, NW / 2, 0) : NAVY2, depth: 0.6 });
    x.font = FT.en(v ? 50 : 40); x.direction = 'ltr'; x.textAlign = 'center'; x.fillStyle = i === 3 ? NAVY : CYAN; x.fillText(en, 0, -10);
    x.font = (i === 0 || i === 3 ? FT.monoB : FT.textB)(v ? 32 : 28); x.direction = /[֐-׿]/.test(he) ? 'rtl' : 'ltr'; x.fillStyle = i === 3 ? NAVY : W; x.fillText(he, 0, 48);
    x.restore();
    if (i > 0) { const [X0, Y0] = pos(i - 1), c = clamp((t - bt(170) - i * B + 0.2) / 0.3) * (1 - comp); if (c > 0) { x.save(); x.strokeStyle = CYAN; x.lineWidth = 6; x.setLineDash([3, 14]); x.lineCap = 'round'; x.beginPath(); x.moveTo(X0, Y0); x.lineTo(lerp(X0, X, c), lerp(Y0, Y, c)); x.stroke(); x.restore(); } }
  });
  if (t > bt(173) && comp < 1) {
    const seg = ((t - bt(173)) * 1.6) % 3, i = Math.floor(seg), u = io3(seg - i), [X0, Y0] = pos(i), [X1, Y1] = pos(i + 1);
    rrc(x, lerp(X0, X1, u), lerp(Y0, Y1, u), 46 * (1 - comp), 32 * (1 - comp), 6); x.fillStyle = W; x.fill();
  }
  const fc = pop(t, bt(172), 18, 0.55) * (1 - comp);
  if (fc > 0.01) pill(x, v ? 540 : 640, v ? 1420 : 820, `frame ${String(Math.floor(t * 60)).padStart(4, '0')} / ${String(NB * 30).padStart(4, '0')}`, fc, { font: FT.monoB, size: 36, fill: NAVY2, color: CYAN });
  // motion blur: one sample per frame (it jumps) vs six samples blended (it flows)
  const mb = pop(t, bt(176.5), 14, 0.62) * gone(t, bt(183.8), 0.3);
  if (mb > 0.01) {
    const cx = v ? 540 : 640, CW = v ? 960 : 1000, CH = v ? 300 : 260;
    [0, 1].forEach(row => {
      const cy = (v ? 900 : 440) + row * (v ? 380 : 330);
      x.save(); x.translate(cx, cy); x.scale(mb, mb); card(x, 0, 0, CW, CH, 36, { fill: NAVY2, depth: 0.5 });
      const ph = ((t * 0.9) % 1), xp = u => -CW / 2 + 90 + (CW - 180) * io3(Math.abs(Math.sin(u * Math.PI)));
      if (row === 0) { const q = Math.floor(ph * 12) / 12; circle(x, xp(q), -10, 40); x.fillStyle = W; x.fill(); }
      else { for (let s = 0; s < 6; s++) { circle(x, xp(ph - (s / 6) * 0.06), -10, 40); x.fillStyle = rgba('#FFFFFF', 0.28); x.fill(); } circle(x, xp(ph), -10, 40); x.fillStyle = rgba('#FFFFFF', 0.4); x.fill(); }
      x.font = FT.textB(v ? 36 : 34); x.direction = 'rtl'; x.textAlign = 'right'; x.fillStyle = row ? CYAN : CORAL;
      x.fillText(row ? '6 צילומים בכל פריים: זורם ✓' : 'צילום אחד בכל פריים: קופץ ✕', CW / 2 - 40, CH / 2 - 30);
      x.restore();
    });
  }
  // sound: a waveform with beat lines and the loudness target
  const au = pop(t, bt(184.5), 14, 0.62), toMp4 = io3(inv(bt(188.6), bt(189.6), t));
  if (au > 0.01) {
    const cx = v ? 540 : 640, cy = v ? 1150 : 600, CW = lerp(v ? 960 : 1000, 380, toMp4), CH = lerp(v ? 520 : 460, 214, toMp4);
    x.save(); x.translate(cx, cy); x.scale(au, au); card(x, 0, 0, CW, CH, 40, { fill: toMp4 > 0.5 ? firePaint(x, -CW / 2, 0, CW / 2, 0) : NAVY2, depth: 0.6 });
    if (toMp4 < 0.6) {
      const k = 1 - toMp4 / 0.6;
      x.save(); x.beginPath(); for (let i = 0; i <= 220; i++) { const X = -CW / 2 + 50 + (CW - 100) * i / 220, a = (40 + 70 * Math.abs(Math.sin(i * 0.31) * Math.sin(i * 0.07 + t))) * k; x.moveTo(X, -a); x.lineTo(X, a); } x.lineWidth = 3; x.strokeStyle = CYAN; x.stroke(); x.restore();
      for (let b = 0; b < 8; b++) { const X = -CW / 2 + 50 + (CW - 100) * b / 8, pl = Math.exp(-(((t - bt(b % 8)) % (4 * B) + 4 * B) % (4 * B)) * 2); rrc(x, X, 0, 5, (CH - 140) * k, 2.5); x.fillStyle = rgba(PINK, 0.9); x.fill(); }
      pill(x, -CW / 2 + 170, -CH / 2 + 50, '−14 LUFS', pop(t, bt(185.5), 18, 0.55) * k, { font: FT.monoB, size: 28, fill: W, color: NAVY, shadow: false });
      pill(x, CW / 2 - 190, -CH / 2 + 50, 'SFX על הביט', pop(t, bt(186), 18, 0.55) * k, { size: 32, fill: PINK, color: NAVY, shadow: false });
    } else {
      // the MP4 tile with a play button, clicked on beat 191
      const pr = press(t, bt(191) - 0.1, bt(191) + 0.05, 0.9);
      x.save(); x.scale(pr, pr); circle(x, 0, 0, 62); x.fillStyle = NAVY; x.fill(); x.beginPath(); x.moveTo(-16, -26); x.lineTo(30, 0); x.lineTo(-16, 26); x.closePath(); x.fillStyle = GOLD; x.fill(); x.restore();
      mono(x, 'film.mp4', 0, CH / 2 - 26, 26, NAVY, 'center', true);
    }
    x.restore();
    if (t > bt(189.6) && t < bt(191.4)) { const a = io3(inv(bt(189.6), bt(190.8), t)); cursor(x, lerp(cx + 300, cx + 8, a), lerp(cy + 300, cy + 10, a), (v ? 1.3 : 1.1) * press(t, bt(191) - 0.1, bt(191) + 0.05, 0.85), NAVY, W); clickRing(x, cx + 8, cy + 10, t, bt(191), PINK, 90); }
  }
  // the play button floods the frame with fire into the finale
  const fl = out3(inv(bt(192), bt(192) + 0.36, t));
  if (fl > 0 && t < bt(192) + 0.4) { const cx = v ? 540 : 640, cy = v ? 1150 : 600; circle(x, cx, cy, 62 + (coverR(L.W, L.H, cx, cy) - 62) * fl); x.fillStyle = firePaint(x, 0, 0, L.W, L.H); x.fill(); }
}

/* ===================== finale (b192–208) ===================== */
function finale(x, t, L) {
  if (t < bt(192.3)) return;
  const v = isV(L), cx = L.W / 2;
  const size = v ? 170 : 190, y1 = v ? 820 : 450;
  slamWords(x, t, ['אנחנו', 'כותבים'], cx, y1, size, FT.he, NAVY, [bt(192.5), bt(193)], bt(197.6), {});
  slamWords(x, t, ['את', 'הבימוי.'], cx, y1 + size, size, FT.he, NAVY, [bt(193.5), bt(194)], bt(197.6), { marker: { i: 1, paint: NAVY }, colors: [NAVY, W] });
  slamWords(x, t, ['Claude', 'כותב'], cx, y1 + size * 2.15, size * 0.62, FT.he, NAVY, [bt(195), bt(195.5)], bt(197.6), {});
  slamWords(x, t, ['את', 'הקוד.'], cx, y1 + size * 2.8, size * 0.62, FT.he, NAVY, [bt(196), bt(196.5)], bt(197.6), {});
  if (t < bt(198)) return;
  // end card on navy (Phoenix Night): the phoenix, YUV.AI in pink, LET'S FLY HIGH in cyan, exactly like the logo
  const ly = v ? 640 : 330, ls = v ? 300 : 250;
  const s = clamp(spring(t - bt(198.4), 12, 0.6), 0, 1.1);
  if (LOGO && s > 0.01) {
    neonFast(x, cx, ly, ls * 1.25 * s, ls * 1.25 * s, ls * 0.625 * s, t * 1.2, { power: 0.9 + 0.3 * beatPulse(t) });
    circle(x, cx, ly, ls * 0.62 * s); x.fillStyle = NAVY2; x.fill();
    x.drawImage(LOGO, cx - ls * 0.5 * s, ly - ls * 0.5 * s, ls * s, ls * s);
  }
  const wy = ly + ls * 0.62 + (v ? 150 : 130);
  slamWords(x, t, ['YUV.AI'], cx, wy, v ? 150 : 130, FT.en, PINK, [bt(199)], null, { ltr: true });
  const tg = pop(t, bt(199.5), 18, 0.55);
  if (tg > 0.01) { x.save(); x.font = FT.en(v ? 40 : 36); x.letterSpacing = '8px'; x.textAlign = 'center'; x.direction = 'ltr'; x.fillStyle = CYAN; x.translate(cx, wy + (v ? 70 : 64)); x.scale(tg, tg); x.fillText("LET'S FLY HIGH", 0, 0); x.restore(); }
  pill(x, cx, wy + (v ? 190 : 160), 'news.yuv.ai/motion', pop(t, bt(200.5), 18, 0.55), { font: FT.monoB, size: v ? 40 : 36, fill: NAVY2, color: CYAN, stroke: rgba(CYAN, 0.55) });
  cap(x, t, bt(201.5), 'השיטה · קטלוג של 24 אלמנטים · מילון · בונה פרומפטים', cx, wy + (v ? 300 : 250), { align: 'center', size: v ? 36 : 36 });
  cap(x, t, bt(202.5), 'יובל אבידני · 100% קוד', cx, wy + (v ? 370 : 310), { align: 'center', size: v ? 34 : 32, color: rgba(W, 0.72) });
  if (t > bt(202.5)) mono(x, 'Music: "From Here" by Tanner Helland · CC BY 4.0', cx, L.H - (v ? 120 : 84), v ? 22 : 20, rgba(W, 0.55), 'center');
}

/* ===================== chrome: HUD (a film about code shows its own clock) + watermark ===================== */
function hud(x, t, L) {
  if (t < bt(10)) return;
  const night = ink(t) === W, h = L.name === 'h', pad = h ? 40 : 44;
  x.save(); x.font = FT.mono(h ? 24 : 26); x.direction = 'ltr'; x.textAlign = 'left'; x.fillStyle = night ? rgba(CYAN, 0.8) : rgba(NAVY, 0.62);
  x.fillText(`seek(${t.toFixed(3)})  ·  beat ${Math.min(NB, Math.floor(t / B))}/${NB}`, pad, L.hudY);
  // the watermark: on navy it wears the logo's own colours (LET'S FLY HIGH cyan, YUV.AI pink); on light pages navy, for contrast
  x.textAlign = 'right'; x.font = FT.en(h ? 24 : 26); x.letterSpacing = '3px';
  const yuv = 'YUV.AI', fly = "LET'S FLY HIGH · ", wy = x.measureText(yuv).width;
  x.fillStyle = night ? PINK : rgba(NAVY, 0.62); x.fillText(yuv, L.W - pad, L.hudY);
  x.fillStyle = night ? rgba(CYAN, 0.9) : rgba(NAVY, 0.62); x.fillText(fly, L.W - pad - wy, L.hudY);
  x.restore();
}

function draw(x, t, L) {
  spreads.background(x, t, L);
  hook(x, t, L); frames(x, t, L); shapes(x, t, L); morph(x, t, L); beat(x, t, L); prompt(x, t, L);
  words(x, t, L); engines(x, t, L); realWorld(x, t, L); builder(x, t, L); renderCh(x, t, L); finale(x, t, L);
  hud(x, t, L);
}

mountFilm({ layouts: LAYOUTS, draw, dur: DUR, clk: { ...clk, bt }, init: async () => { [LOGO, PHOTO] = await Promise.all([loadImg(LOGO_URL), loadImg(PHOTO_URL)]); } });
