/* =====================================================================
   "קצב" — a launch film for a (fictional) fitness app, told as a story.
   I    the problem: January promise, missed workouts, three apps, zero results (night room)
   II   the pulse → drop → day: the app icon is born from a heartbeat
   III  product tour: icon becomes the phone, dive into the screen, scroll the home feed,
        tap today's workout (shared element → detail), start → live workout
   IV   real people: Noa squats (every rep counted on the phone, on the beat), Daniel runs, Maya pushes
   V    results: 30-day streak (callback to the red X's), consistency chart
   VI   why: three reasons · CTA: the phone becomes the icon again
   84 beats @ 129.723 BPM (Mixkit "Cat Walk"), drop on film beat 16. Everything is drawn in code.
   ===================================================================== */
import { clamp, lerp, inv, out3, in3, io3, logLerp, spring, sk, clock, rgba, mix, BRAND, FT, rr, rrc, circle, coverR, riseWords, gradPaint, mountFilm } from '../../src/core.js';
import { card, press, cursor, clickRing, countUp, neonRing, slamWords, neonChip, SPECTRUM } from '../../src/ui.js';
import { THREE, makeRenderer, makeTodWorld } from '../../src/world.js';
import { poseSquat, poseRun, posePushup, poseSitPhone, poseStand, drawPerson } from '../../src/people.js';
import LOGO_URL from '../../brand/logo-square-transparent.png';

const clk = clock(129.723), { B, bt } = clk;
const NB = 84, DUR = NB * B + 1.2;
const NAVY = BRAND.navy, NAVY2 = BRAND.navy2, W = '#FFFFFF', FIRE = BRAND.fire, DENIM = BRAND.denim, CLOUD = BRAND.cloud, ORANGE = BRAND.orange, GOLD = BRAND.gold, CORAL = BRAND.coral;
const beatPulse = t => Math.exp(-((t % B) / B) * 5);
const PEOPLE = {
  noa: { skin: '#E8B58E', hair: '#2A1E1A', top: '#FF8F3A', bottom: '#12163F', hairStyle: 'pony' },
  daniel: { skin: '#8D5A3B', hair: '#151515', top: '#5EA1C1', bottom: '#12163F', hairStyle: 'short' },
  maya: { skin: '#F2C9A6', hair: '#7A3E1D', top: '#D74270', bottom: '#12163F', hairStyle: 'bun' }
};

const LAYOUTS = {
  h: { name: 'h', W: 1920, H: 1080, right: 1800, tY1: 175, tY2: 300, tS: 110,
       floor: 900, sitX: 700, sitS: 400, cal: [1250, 640, 620, 500], notif: [1230, 540, 660],
       icon: [960, 540, 300], home: [960, 560, 780], dive: [960, 540, 1000], side: [1430, 560, 880], center: [960, 560, 840],
       stage: [610, 560, 780, 880], cta: [960, 350, 260], chipSide: 300, hudY: 1046 },
  v: { name: 'v', W: 1080, H: 1920, right: 1010, tY1: 330, tY2: 460, tS: 108,
       floor: 1520, sitX: 360, sitS: 560, cal: [540, 960, 920, 700], notif: [540, 900, 960],
       icon: [540, 900, 360], home: [540, 980, 1250], dive: [540, 960, 1840], side: [540, 1440, 820], center: [540, 1000, 1240],
       stage: [540, 540, 980, 860], cta: [540, 760, 340], chipSide: 0, hudY: 1862 }
};

/* ============================ the app (one canvas = the phone screen) ============================ */
const UIW = 600, UIH = 1303, SCREEN_AR = UIW / UIH;
const uiCv = document.createElement('canvas'); uiCv.width = UIW; uiCv.height = UIH; const ug = uiCv.getContext('2d');
let LOGO = null;
function pulsePath(g, x0, x1, y, amp) {         // the brand mark: flat, small blip, big spike, dip, flat
  const w = x1 - x0, P = [[0, 0], [0.28, 0], [0.36, -0.18], [0.42, 0], [0.5, 0], [0.57, -1], [0.66, 0.62], [0.73, 0], [1, 0]];
  g.beginPath(); P.forEach(([u, v], i) => { const X = x0 + u * w, Y = y + v * amp; i ? g.lineTo(X, Y) : g.moveTo(X, Y); });
}
function iconArt(g, cx, cy, s, t, draw = 1) {   // navy squircle + fire pulse
  rrc(g, cx, cy, s, s, s * 0.26); g.fillStyle = gradPaint(g, cx, cy - s / 2, cx, cy + s / 2, ['#262C6B', NAVY]); g.fill();
  g.save(); rrc(g, cx, cy, s, s, s * 0.26); g.clip();
  pulsePath(g, cx - s * 0.36, cx + s * 0.36, cy + s * 0.04, s * 0.3);
  g.lineWidth = s * 0.075; g.lineCap = 'round'; g.lineJoin = 'round'; g.strokeStyle = gradPaint(g, cx - s * 0.36, 0, cx + s * 0.36, 0, FIRE);
  g.setLineDash([s * 2, s * 2]); g.lineDashOffset = s * 2 * (1 - draw); g.stroke(); g.setLineDash([]);
  g.restore();
}
function flame(g, cx, cy, s, t) {
  const f = 1 + 0.05 * Math.sin(t * 11) + 0.03 * Math.sin(t * 17);
  g.save(); g.translate(cx, cy); g.scale(1, f);
  const path = k => { g.beginPath(); g.moveTo(0, -s * k); g.bezierCurveTo(s * 0.55 * k, -s * 0.35 * k, s * 0.62 * k, s * 0.35 * k, 0, s * 0.62 * k); g.bezierCurveTo(-s * 0.62 * k, s * 0.35 * k, -s * 0.55 * k, -s * 0.2 * k, -s * 0.12 * k, -s * 0.5 * k); g.bezierCurveTo(-s * 0.05 * k, -s * 0.2 * k, 0, -s * 0.4 * k, 0, -s * k); g.closePath(); };
  path(1); g.fillStyle = gradPaint(g, 0, -s, 0, s * 0.6, ['#FFC74E', '#FF8F3A', '#F56B49']); g.fill();
  g.translate(0, s * 0.2); path(0.5); g.fillStyle = '#FFE7A6'; g.fill(); g.restore();
}
const he = (g, s, w = 900) => (g.font = (w === 900 ? FT.he : w === 800 ? FT.he8 : FT.he7)(s), g.direction = 'rtl', g.textAlign = 'right');
const en = (g, s, al = 'right') => (g.font = FT.en(s), g.direction = 'ltr', g.textAlign = al);

/* scroll of the home feed: sum of springs, keyed on beats */
const scrollY = t => sk(t, [[-1, 0], [bt(22.5), 420], [bt(24.5), 560], [bt(26.4), 0]], 9, 0.72);
function home(g, t) {
  const sY = scrollY(t), R = UIW - 34;
  g.fillStyle = CLOUD; g.fillRect(0, 0, UIW, UIH);
  g.save(); g.translate(0, -sY);
  g.font = FT.body(26); g.direction = 'rtl'; g.textAlign = 'right'; g.fillStyle = rgba(NAVY, 0.6); g.fillText('יום רביעי, 15 באוקטובר', R, 135);
  he(g, 54); g.fillStyle = NAVY; g.fillText('בוקר טוב, נועה.', R, 200);
  circle(g, 70, 170, 34); g.fillStyle = gradPaint(g, 36, 136, 104, 204, FIRE); g.fill(); he(g, 34); g.textAlign = 'center'; g.fillStyle = NAVY; g.fillText('נ', 70, 182);
  // streak card
  rr(g, 30, 245, UIW - 60, 170, 36); g.fillStyle = gradPaint(g, 30, 245, UIW - 30, 415, FIRE); g.fill();
  flame(g, 100, 330, 52, t);
  en(g, 92); g.fillStyle = NAVY; g.fillText('12', R - 20, 368); he(g, 34); g.fillText('ימים ברצף', R - 110, 352); g.font = FT.body(24); g.fillStyle = rgba(NAVY, 0.75); g.fillText('השיא שלך: 21', R - 110, 390);
  // today's workout
  todayCard(g, t, 1);
  // programs
  he(g, 34); g.fillStyle = NAVY; g.fillText('תוכניות בשבילך', R, 860);
  [['ריצה', DENIM, 'run'], ['כוח', '#FFD9BF', 'push'], ['גמישות', '#D9E8FF', 'stand']].forEach(([n, c, k], i) => {
    const x0 = UIW - 30 - (i + 1) * 172 - i * 12; rr(g, x0, 885, 172, 200, 30); g.fillStyle = c; g.fill();
    const p = k === 'run' ? poseRun((t * 0.8) % 1) : k === 'push' ? posePushup(0.5 + 0.5 * Math.cos(t * 3)) : poseStand(t);
    drawPerson(g, p, x0 + (k === 'push' ? 40 : 86), 1030, k === 'push' ? 70 : 86, { ...(i === 0 ? PEOPLE.daniel : i === 1 ? PEOPLE.maya : PEOPLE.noa) });
    he(g, 28); g.fillStyle = NAVY; g.fillText(n, x0 + 172 - 16, 1072);
  });
  // weekly rings
  he(g, 34); g.fillStyle = NAVY; g.fillText('השבוע שלך', R, 1160);
  const vals = [1, 1, 0.8, 1, 0.65, 0.3, 0], days = 'אבגדהוש';
  vals.forEach((v, i) => { const x0 = UIW - 70 - i * 76, y0 = 1235; circle(g, x0, y0, 30); g.lineWidth = 9; g.strokeStyle = rgba(NAVY, 0.1); g.stroke();
    const a = clamp(v * clamp((t - bt(24.5) - i * 0.05) / 0.4 + (t > bt(26.6) ? 1 : 0)), 0, 1); if (a > 0) { g.beginPath(); g.arc(x0, y0, 30, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * a); g.strokeStyle = ORANGE; g.lineCap = 'round'; g.stroke(); }
    he(g, 24, 700); g.textAlign = 'center'; g.fillStyle = rgba(NAVY, 0.7); g.fillText(days[i], x0, y0 + 64); });
  he(g, 34); g.fillStyle = NAVY; g.fillText('פעילות אחרונה', R, 1370);
  [['HIIT 20', '21 דק׳ · 186 קל׳'], ['ריצה', '4.2 ק״מ · 24 דק׳'], ['כוח', '18 דק׳ · 140 קל׳']].forEach(([a, b], i) => { const y0 = 1395 + i * 112; rr(g, 30, y0, UIW - 60, 96, 26); g.fillStyle = W; g.fill(); he(g, 30); g.fillStyle = NAVY; g.fillText(a, R - 20, y0 + 44); g.font = FT.body(24); g.fillStyle = rgba(NAVY, 0.65); g.fillText(b, R - 20, y0 + 78); circle(g, 80, y0 + 48, 22); g.fillStyle = ORANGE; g.fill(); });
  g.restore();
  statusBar(g, NAVY, CLOUD); tabBar(g);
}
const TODAY = { x: 30, y: 445, w: UIW - 60, h: 360 };
function todayCard(g, t, k) {
  const R = TODAY.x + TODAY.w - 26;
  rr(g, TODAY.x, TODAY.y, TODAY.w, TODAY.h, 40); g.fillStyle = NAVY; g.fill();
  g.save(); rr(g, TODAY.x, TODAY.y, TODAY.w, TODAY.h, 40); g.clip();
  const rg = g.createRadialGradient(TODAY.x + 60, TODAY.y + 40, 10, TODAY.x + 60, TODAY.y + 40, 380); rg.addColorStop(0, rgba(ORANGE, 0.45)); rg.addColorStop(1, rgba(ORANGE, 0)); g.fillStyle = rg; g.fillRect(TODAY.x, TODAY.y, TODAY.w, TODAY.h);
  he(g, 28, 700); g.fillStyle = DENIM; g.fillText('האימון של היום', R, TODAY.y + 58);
  en(g, 116); g.fillStyle = W; g.fillText('HIIT 20', R, TODAY.y + 190);
  g.font = FT.body(26); g.direction = 'rtl'; g.textAlign = 'right'; g.fillStyle = rgba('#FFFFFF', 0.85); g.fillText('20 דק׳ · 6 תרגילים · בינוני', R, TODAY.y + 240);
  circle(g, R - 40, TODAY.y + 300, 40); g.fillStyle = gradPaint(g, R - 80, 0, R, 0, FIRE); g.fill();
  g.beginPath(); g.moveTo(R - 52, TODAY.y + 282); g.lineTo(R - 52, TODAY.y + 318); g.lineTo(R - 24, TODAY.y + 300); g.closePath(); g.fillStyle = NAVY; g.fill();
  drawPerson(g, poseSquat(0.5 + 0.5 * Math.cos(t * 2.4)), TODAY.x + 120, TODAY.y + TODAY.h - 28, 150, PEOPLE.noa);
  g.restore();
}
function statusBar(g, ink, bg) {
  g.fillStyle = bg; g.fillRect(0, 0, UIW, 92); g.font = FT.he7(26); g.direction = 'ltr'; g.textAlign = 'left'; g.fillStyle = ink; g.fillText('9:41', 44, 58);
  rrc(g, UIW / 2, 48, 176, 50, 25); g.fillStyle = '#000'; g.fill();
  rrc(g, UIW - 70, 50, 44, 20, 6); g.lineWidth = 2.5; g.strokeStyle = ink; g.stroke(); rrc(g, UIW - 73, 50, 32, 12, 3); g.fillStyle = ink; g.fill();
}
function tabBar(g) {
  g.fillStyle = W; g.fillRect(0, UIH - 120, UIW, 120); g.fillStyle = rgba(NAVY, 0.08); g.fillRect(0, UIH - 120, UIW, 2);
  [0, 1, 2, 3].forEach(i => { const x0 = UIW - 75 - i * 150; rrc(g, x0, UIH - 70, 44, 44, 14); g.fillStyle = i === 0 ? ORANGE : rgba(NAVY, 0.25); g.fill(); });
  rrc(g, UIW / 2, UIH - 14, 180, 9, 5); g.fillStyle = NAVY; g.fill();
}
const EX = [['סקוואט', '×20', 'squat'], ['שכיבות סמיכה', '×12', 'push'], ['ריצה במקום', '40״', 'run'], ['פלאנק', '40״', 'push'], ['סקוואט קפיצה', '×16', 'squat'], ['מתיחות', '3׳', 'stand']];
function detail(g, t, e) {
  // the today card grows into the whole screen (shared element)
  const x0 = lerp(TODAY.x, 0, e), y0 = lerp(TODAY.y, 0, e), w = lerp(TODAY.w, UIW, e), h = lerp(TODAY.h, UIH, e), r = lerp(40, 0, clamp(e));
  rr(g, x0, y0, w, h, r); g.fillStyle = NAVY; g.fill();
  g.save(); rr(g, x0, y0, w, h, r); g.clip();
  const rg = g.createRadialGradient(x0 + 60, y0 + 40, 10, x0 + 60, y0 + 40, 520); rg.addColorStop(0, rgba(ORANGE, 0.45)); rg.addColorStop(1, rgba(ORANGE, 0)); g.fillStyle = rg; g.fillRect(x0, y0, w, h);
  const R = x0 + w - 34, ty = lerp(TODAY.y + 190, 300, e);
  en(g, lerp(116, 130, e)); g.fillStyle = W; g.fillText('HIIT 20', R, ty);
  g.font = FT.body(28); g.direction = 'rtl'; g.textAlign = 'right'; g.fillStyle = rgba('#FFFFFF', 0.85); g.fillText('20 דק׳ · 6 תרגילים · בינוני', R, ty + 52);
  if (e > 0.6) {
    const sheetY = lerp(UIH, 430, clamp(spring(t - bt(28.9), 12, 0.8)));
    rr(g, 0, sheetY, UIW, UIH - sheetY + 40, 40); g.fillStyle = CLOUD; g.fill();
    EX.forEach(([n, r2, k], i) => {
      const s = spring(t - (bt(29.3) + i * bt(0.5)), 16, 0.55); if (s <= 0.001) return;
      const yy = sheetY + 50 + i * 112; g.save(); g.translate(UIW / 2, yy + 46); g.scale(clamp(s, 0, 1.3), clamp(s, 0, 1.3)); g.translate(-UIW / 2, -(yy + 46));
      rr(g, 30, yy, UIW - 60, 96, 28); g.fillStyle = W; g.fill();
      rr(g, UIW - 30 - 16 - 72, yy + 12, 72, 72, 20); g.fillStyle = NAVY; g.fill();
      const p = k === 'run' ? poseRun((t * 0.9) % 1) : k === 'push' ? posePushup(0.5 + 0.5 * Math.cos(t * 3)) : k === 'squat' ? poseSquat(0.5 + 0.5 * Math.cos(t * 3)) : poseStand(t);
      g.save(); rr(g, UIW - 30 - 16 - 72, yy + 12, 72, 72, 20); g.clip(); drawPerson(g, p, UIW - 30 - 16 - 72 + (k === 'push' ? 14 : 36), yy + 76, k === 'push' ? 44 : 52, { ...PEOPLE.noa, shade: '#000' }); g.restore();
      he(g, 34); g.fillStyle = NAVY; g.fillText(n, UIW - 30 - 16 - 72 - 20, yy + 60); en(g, 36, 'left'); g.fillStyle = ORANGE; g.fillText(r2, 56, yy + 62);
      g.restore();
    });
    const sp = spring(t - bt(31), 14, 0.55); if (sp > 0.001) { g.save(); g.translate(UIW / 2, UIH - 110); g.scale(sp, sp); rrc(g, 0, 0, UIW - 80, 104, 52); g.fillStyle = gradPaint(g, -260, 0, 260, 0, FIRE); g.fill(); he(g, 42); g.textAlign = 'center'; g.fillStyle = NAVY; g.fillText('התחל אימון', 20, 15); g.beginPath(); g.moveTo(-150, -16); g.lineTo(-150, 16); g.lineTo(-124, 0); g.closePath(); g.fill(); g.restore(); }
  }
  g.restore();
}
const reps = t => t < bt(37) ? 0 : clamp(Math.floor((t - bt(37)) / B) + 1, 0, 7);
const who = t => t >= bt(48.25) ? 2 : t >= bt(44.25) ? 1 : 0;          // card flips at half a beat
const PERSONA = [
  { title: 'סקוואט', sub: 'תרגיל 1 מתוך 6', of: '/20', coach: 'ברכיים מעל הקרסוליים ✓', bpm: 128, t0: 33, base: 12 },
  { title: 'ריצה', sub: 'ריצה ראשונה · 3 ק״מ', of: 'ק״מ', coach: 'קצב מצוין. נשום ✓', bpm: 146, t0: 44.25, base: 492 },
  { title: 'שכיבות סמיכה', sub: 'שבוע 6 · יעד 12', of: '/12', coach: 'גב ישר. מושלם ✓', bpm: 118, t0: 48.25, base: 95 }];
const pushReps = t => t < bt(49) ? 0 : clamp(Math.floor((t - bt(49)) / B) + 1, 0, 3) + 8;
function live(g, t, e) {
  const cy0 = UIH - 110, r0 = 52, k = clamp(e);   // the start pill grows into the live screen
  const w = lerp(UIW - 80, UIW, k), h = lerp(104, UIH, k), cx = UIW / 2, cy = lerp(cy0, UIH / 2, k);
  rrc(g, cx, cy, w, h, lerp(r0, 0, k)); g.fillStyle = NAVY; g.fill();
  if (e < 0.5) return;
  g.save(); rrc(g, cx, cy, w, h, lerp(r0, 0, k)); g.clip();
  statusBar(g, W, NAVY);
  const R = UIW - 40;
  const ph = who(t), Pp = PERSONA[ph], sw0 = [33, 44.25, 48.25][ph], swp = ph ? spring(t - bt(sw0), 16, 0.5) : 1;   // new persona: the header + number re-slam
  g.save(); g.translate(R, 190); g.scale(swp, swp); he(g, 66); g.fillStyle = W; g.fillText(Pp.title, 0, 0); g.restore();
  he(g, 26); g.font = FT.body(26); g.fillStyle = DENIM; g.fillText(Pp.sub, R, 236);
  const km = 0.8 + 0.6 * clamp((t - bt(44.25)) / bt(3.75));
  const n = ph === 0 ? reps(t) : ph === 1 ? km : pushReps(t), prog = ph === 0 ? n / 20 : ph === 1 ? km / 3 : n / 12;
  const lastRep = ph === 0 ? bt(37) : bt(49);
  circle(g, UIW / 2, 540, 200); g.lineWidth = 26; g.strokeStyle = rgba('#FFFFFF', 0.1); g.stroke();
  if (prog > 0) { g.beginPath(); g.arc(UIW / 2, 540, 200, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * prog); g.strokeStyle = gradPaint(g, 100, 340, 500, 740, FIRE); g.lineCap = 'round'; g.stroke(); }
  const pop = (ph !== 1 && t > lastRep ? 1 + 0.18 * Math.exp(-((t - lastRep) % B) * 9) : 1) * swp;
  g.save(); g.translate(UIW / 2, 540); g.scale(pop, pop); en(g, ph === 1 ? 150 : 190, 'center'); g.fillStyle = W; g.fillText(ph === 1 ? n.toFixed(2) : String(n), ph === 1 ? 0 : -10, ph === 1 ? 50 : 62); g.restore();
  if (ph === 1) { he(g, 40); g.textAlign = 'center'; g.fillStyle = DENIM; g.fillText(Pp.of, UIW / 2, 640); } else { en(g, 52, 'left'); g.fillStyle = DENIM; g.fillText(Pp.of, UIW / 2 + 60, 610); }
  const secs = Math.floor(Math.max(0, t - bt(Pp.t0))) + Pp.base; en(g, 56, 'center'); g.fillStyle = W; g.fillText(`${String(Math.floor(secs / 60)).padStart(2, '0')}:${String(secs % 60).padStart(2, '0')}`, UIW / 2, 830);
  // heart rate line, scrolling
  g.save(); g.beginPath(); for (let i = 0; i <= 60; i++) { const xx = 40 + i * 8.7, ph = (i * 0.12 + t * 2.2) % 1, v = ph > 0.45 && ph < 0.5 ? -60 : ph >= 0.5 && ph < 0.55 ? 34 : Math.sin(ph * 20) * 3; i ? g.lineTo(xx, 940 + v) : g.moveTo(xx, 940 + v); } g.lineWidth = 5; g.strokeStyle = ORANGE; g.lineJoin = 'round'; g.stroke(); g.restore();
  en(g, 36, 'left'); g.fillStyle = GOLD; g.fillText(`${Pp.bpm} BPM`, 40, 1010);
  const cb = spring(t - bt(34.6), 15, 0.55); if (cb > 0.001) { g.save(); g.translate(UIW / 2, 1120); g.scale(cb, cb); rrc(g, 0, 0, UIW - 70, 130, 34); g.fillStyle = W; g.fill(); he(g, 24, 700); g.fillStyle = ORANGE; g.fillText('מאמן AI', 230, -26); he(g, 32); g.fillStyle = NAVY; g.fillText(Pp.coach, 230, 26); g.restore(); }
  g.restore();
}
function streakScreen(g, t, e) {
  circle(g, UIW / 2, UIH / 2, e * Math.hypot(UIW, UIH) * 0.55); g.fillStyle = gradPaint(g, 0, 0, UIW, UIH, FIRE); g.fill();
  if (e < 0.3) return;
  g.save(); circle(g, UIW / 2, UIH / 2, e * Math.hypot(UIW, UIH) * 0.55); g.clip(); statusBar(g, NAVY, 'rgba(0,0,0,0)');
  flame(g, UIW / 2, 430, 150 * spring(t - bt(52.2), 12, 0.5), t);
  const n = countUp(t, bt(52.4), 12, 30, 6); en(g, 230, 'center'); g.fillStyle = NAVY; g.fillText(String(n), UIW / 2, 860);
  he(g, 60); g.textAlign = 'center'; g.fillStyle = NAVY; g.fillText('ימים ברצף', UIW / 2, 950);
  const c = spring(t - bt(54), 16, 0.5); if (c > 0.001) { g.save(); g.translate(UIW / 2, 1080); g.scale(c, c); rrc(g, 0, 0, 260, 76, 38); g.fillStyle = NAVY; g.fill(); he(g, 34); g.textAlign = 'center'; g.fillStyle = GOLD; g.fillText('שיא חדש!', 0, 12); g.restore(); }
  g.restore();
}
function drawUI(t) {
  ug.setTransform(1, 0, 0, 1, 0, 0);
  home(ug, t);
  const e1 = spring(t - bt(28.1), 11, 0.82); if (t >= bt(28.1)) detail(ug, t, e1);
  const e2 = spring(t - bt(32.1), 11, 0.85); if (t >= bt(32.1)) live(ug, t, e2);
  const e3 = out3(inv(bt(52), bt(52) + 0.4, t)); if (e3 > 0) streakScreen(ug, t, e3);
  // tap ripples
  [[bt(28), TODAY.x + TODAY.w / 2, TODAY.y + TODAY.h / 2], [bt(32), UIW / 2, UIH - 110]].forEach(([tc, x0, y0]) => { const q = inv(tc, tc + 0.4, t); if (q > 0 && q < 1) { circle(ug, x0, y0, 20 + 120 * out3(q)); ug.fillStyle = rgba('#FFFFFF', 0.35 * (1 - q)); ug.fill(); } });
}

/* ============================ the phone (2D mockup that carries the screen) ============================ */
function phoneState(t, L) {
  const K = (k, i) => sk(t, [[-1, L.icon[i]], [bt(18), L.home[i]], [bt(20), L.dive[i]], [bt(36), L.side[i]], [bt(66), L.center[i]], [bt(68.4), L.cta[i]]], i === 2 ? 9 : 10, 0.82);
  const cx = K(0, 0), cy = K(0, 1), size = K(0, 2);
  // shape: icon (square, big radius) ↔ phone screen (portrait)
  const toPhone = spring(t - bt(18), 10, 0.8) - spring(t - bt(68.4), 10, 0.8);
  const sh = size, sw = lerp(size, size * SCREEN_AR, clamp(toPhone)), r = lerp(size * 0.26, sw * 0.13, clamp(toPhone));
  const bez = clamp(toPhone) * sw * 0.05;
  return { cx, cy, sw, sh, r, bez, toPhone: clamp(toPhone) };
}
function drawPhone(x, t, L) {
  if (t < bt(16)) return null;
  const P = phoneState(t, L);
  const sc0 = sk(t, [[-1, 1], [bt(16), 1.22], [bt(16) + 0.12, 1]], 20, 0.5);   // the icon kicks on the drop (no pop-in: it already exists)
  x.save(); x.translate(P.cx, P.cy); x.scale(sc0, sc0); x.translate(-P.cx, -P.cy);
  const tilt = t > bt(66) && t < bt(68.4) ? 0.05 * Math.sin((t - bt(66)) * 9) * Math.exp(-(t - bt(66)) * 2) : 0;
  x.translate(P.cx, P.cy); x.rotate(tilt); x.translate(-P.cx, -P.cy);
  if (P.bez > 0.5) { card(x, P.cx, P.cy, P.sw + P.bez * 2, P.sh + P.bez * 2, P.r + P.bez, { fill: '#1B2150', shadow: 'rgba(14,30,80,.45)', depth: 0.9 }); rrc(x, P.cx, P.cy, P.sw + P.bez * 2, P.sh + P.bez * 2, P.r + P.bez); x.lineWidth = Math.max(2, P.bez * 0.18); x.strokeStyle = gradPaint(x, P.cx - P.sw, P.cy - P.sh / 2, P.cx + P.sw, P.cy + P.sh / 2, ['#8F9BC9', '#2B3263', '#C9D3E8']); x.stroke(); }
  else card(x, P.cx, P.cy, P.sw, P.sh, P.r, { fill: NAVY, shadow: 'rgba(14,30,80,.45)', depth: 0.9 });
  x.save(); rrc(x, P.cx, P.cy, P.sw, P.sh, P.r); x.clip();
  // icon art underneath, the app opens over it with a circle reveal (and closes the same way at the end)
  iconArt(x, P.cx, P.cy, Math.min(P.sw, P.sh) * (P.toPhone > 0 ? 1 : 1), t, out3(inv(bt(14), bt(15.5), t)));
  const open = out3(inv(bt(18.5), bt(19.3), t)) * (1 - io3(inv(bt(68.2), bt(69), t)));
  if (open > 0) { x.save(); circle(x, P.cx, P.cy, open * Math.hypot(P.sw, P.sh) * 0.55); x.clip(); drawUI(t); x.drawImage(uiCv, P.cx - P.sw / 2, P.cy - P.sh / 2, P.sw, P.sh); x.restore(); }
  x.restore();
  x.restore();
  return P;
}
const uiToScreen = (P, ux, uy) => ({ x: P.cx - P.sw / 2 + ux * P.sw / UIW, y: P.cy - P.sh / 2 + uy * P.sh / UIH });

/* ============================ callouts (product review) ============================ */
const CALLOUTS = [
  [21.6, 22.4, 1, 'רצף שמחזיק אותך.', 300, 330, 'home0'],
  [23.0, 24.4, -1, 'תוכנית שנבנתה בשבילך.', 300, 985 - 420, 'abs'],
  [25.0, 26.3, 1, 'רואים התקדמות כל יום.', 300, 1235 - 560, 'abs'],
  [30.0, 31.8, -1, '20 דקות. בלי לחשוב.', 300, 700, 'abs'],
  [33.2, 34.6, 1, 'סופרת חזרות לבד.', 500, 540, 'abs', 430],
  [34.7, 35.9, -1, 'מאמן AI שמתקן תנוחה.', 50, 1120, 'abs', 1785]
];
function callouts(x, t, L, P) {
  if (!P) return;
  CALLOUTS.forEach(([b0, b1, side, text, ux, uy, , vy], i) => {
    if (t < bt(b0) || t > bt(b1) + 0.3) return;
    const tg = uiToScreen(P, ux, uy), out = in3(inv(bt(b1), bt(b1) + 0.25, t)), s = spring(t - bt(b0), 18, 0.5) * (1 - out);
    let cx, cy;
    if (L.name === 'h') { cx = side > 0 ? P.cx + P.sw / 2 + 330 : P.cx - P.sw / 2 - 330; cy = tg.y; }
    else { cx = L.W / 2; cy = vy || (i % 2 ? 190 : L.H - 190); }
    const ln = out3(inv(bt(b0) + 0.05, bt(b0) + 0.32, t)) * (1 - out);
    if (ln > 0) { x.save(); x.setLineDash([2, 12]); x.lineCap = 'round'; x.beginPath(); x.moveTo(cx, cy); x.lineTo(lerp(cx, tg.x, ln), lerp(cy, tg.y, ln)); x.strokeStyle = W; x.lineWidth = 9; x.stroke(); x.strokeStyle = NAVY; x.lineWidth = 4; x.stroke(); x.setLineDash([]); circle(x, tg.x, tg.y, 12 * ln); x.fillStyle = ORANGE; x.fill(); circle(x, tg.x, tg.y, 12 * ln); x.lineWidth = 4; x.strokeStyle = W; x.stroke(); x.restore(); }
    if (s > 0.001) { x.save(); x.translate(cx, cy); x.scale(s, s); neonChip(x, 1e9, 0, 0, 0, text, { size: L.name === 'h' ? 40 : 44, fontFn: FT.he, angle: t * 1.5 + i, padX: 34 }); x.restore(); }
  });
}

/* ============================ ACT I: the problem (2D night room) ============================ */
function room(x, t, L) {
  if (t >= bt(16) + 0.45) return;
  x.fillStyle = gradPaint(x, 0, 0, 0, L.H, ['#1E2357', '#141A44', '#0B0E2A']); x.fillRect(0, 0, L.W, L.H);
  // window with night sky + moon
  const wx = L.name === 'h' ? 130 : 80, wy = L.name === 'h' ? 120 : 620, ww = L.name === 'h' ? 380 : 300, wh = L.name === 'h' ? 420 : 400;
  rr(x, wx, wy, ww, wh, 28); x.fillStyle = gradPaint(x, 0, wy, 0, wy + wh, ['#0B0E2A', '#232A6E']); x.fill(); x.lineWidth = 10; x.strokeStyle = '#2B3263'; x.stroke();
  circle(x, wx + ww * 0.68, wy + wh * 0.28, 34); x.fillStyle = '#FFE7A6'; x.fill(); circle(x, wx + ww * 0.68 + 14, wy + wh * 0.28 - 8, 30); x.fillStyle = '#141A44'; x.fill();
  x.fillStyle = '#2B3263'; x.fillRect(wx + ww / 2 - 4, wy, 8, wh); x.fillRect(wx, wy + wh / 2 - 4, ww, 8);
  // floor + couch
  x.fillStyle = '#0E1233'; x.fillRect(0, L.floor, L.W, L.H - L.floor);
  const cxs = L.sitX, s = L.sitS;
  rr(x, cxs - 0.35 * s, L.floor - 0.95 * s, 1.5 * s, 0.6 * s, 0.12 * s); x.fillStyle = '#262C6B'; x.fill();
  rr(x, cxs - 0.4 * s, L.floor - 0.5 * s, 1.6 * s, 0.32 * s, 0.1 * s); x.fillStyle = '#303778'; x.fill();
  rr(x, cxs - 0.5 * s, L.floor - 0.7 * s, 0.2 * s, 0.55 * s, 0.08 * s); x.fill();
  x.fillStyle = '#0B0E2A'; x.fillRect(cxs - 0.3 * s, L.floor - 0.18 * s, 0.06 * s, 0.18 * s); x.fillRect(cxs + 1.0 * s, L.floor - 0.18 * s, 0.06 * s, 0.18 * s);
  // person on the couch, phone glow
  const p = poseSitPhone(0.46 * 1, t * 3);
  const lift = in3(inv(bt(4), bt(4.4), t));      // the phone leaves the hand (it becomes the calendar)
  drawPerson(x, p, cxs, L.floor - 0.18 * s + 0.18 * s, s, { ...PEOPLE.noa, top: '#5A6299', shade: '#000' });
  const ph = { x: cxs + p.phone.x * s, y: L.floor - p.phone.y * s };
  const glow = 0.5 + 0.2 * beatPulse(t);
  const rg = x.createRadialGradient(ph.x, ph.y, 4, ph.x, ph.y, 0.7 * s); rg.addColorStop(0, rgba('#5DE4E9', 0.35 * glow)); rg.addColorStop(1, rgba('#5DE4E9', 0)); x.fillStyle = rg; x.fillRect(ph.x - s, ph.y - s, 2 * s, 2 * s);
  if (lift < 1) { rrc(x, ph.x, ph.y, 0.1 * s, 0.19 * s, 0.025 * s); x.fillStyle = '#5DE4E9'; x.fill(); }
  return ph;
}
const CAL_X = [3, 5, 9, 11, 16, 18, 22, 25];
function calendar(x, t, L, ph) {
  if (t < bt(4) || t > bt(13.2)) return;
  const [cx0, cy0, cw, chh] = L.cal, g = spring(t - bt(4), 11, 0.72), col = io3(inv(bt(12), bt(12.8), t));
  const fromW = 0.1 * L.sitS, fromH = 0.19 * L.sitS;
  const cx = lerp(lerp(ph.x, cx0, g), L.W / 2, col), cy = lerp(lerp(ph.y, cy0, g), L.H / 2, col), w = lerp(fromW, cw, g) * (1 - col), h = lerp(fromH, chh, g) * (1 - col);
  const push = io3(inv(bt(8), bt(8.6), t)) * (1 - col);                // pushed back by the notifications
  x.save(); x.translate(cx, cy - push * 60); x.scale(1 - 0.12 * push, 1 - 0.12 * push); x.translate(-cx, -cy);
  card(x, cx, cy, w, h, lerp(14, 40, g), { fill: W, shadow: 'rgba(0,0,0,.5)', depth: 1 });
  if (g > 0.3 && w > 50) {
    x.save(); rrc(x, cx, cy, w, h, 40); x.clip();
    const k = w / cw, X0 = cx - w / 2, Y0 = cy - h / 2;
    he(x, 52 * k); x.fillStyle = NAVY; x.fillText('ינואר', X0 + w - 40 * k, Y0 + 78 * k);
    en(x, 30 * k, 'left'); x.fillStyle = rgba(NAVY, 0.4); x.fillText('2026', X0 + 40 * k, Y0 + 74 * k);
    const gx = 7, gy = 4, cwid = (w - 80 * k) / gx, chg = (h - 150 * k) / gy;
    for (let i = 0; i < 28; i++) {
      const c = 6 - (i % 7), r = Math.floor(i / 7), x1 = X0 + 40 * k + c * cwid, y1 = Y0 + 120 * k + r * chg;
      rr(x, x1 + 6 * k, y1 + 6 * k, cwid - 12 * k, chg - 12 * k, 16 * k); x.fillStyle = rgba(NAVY, 0.06); x.fill();
      en(x, 24 * k, 'left'); x.fillStyle = rgba(NAVY, 0.55); x.fillText(String(i + 1), x1 + 16 * k, y1 + 34 * k);
      const xi = CAL_X.indexOf(i);
      if (xi >= 0) { const tx = bt(4.5) + xi * bt(0.5), s = spring(t - tx, 20, 0.45); if (s > 0.001) { const mx = x1 + cwid / 2, my = y1 + chg / 2 + 6 * k, R = Math.min(cwid, chg) * 0.28 * s * (1 + 0.6 * (1 - clamp(s))); x.save(); x.lineCap = 'round'; x.lineWidth = 12 * k; x.strokeStyle = CORAL; x.beginPath(); x.moveTo(mx - R, my - R); x.lineTo(mx + R, my + R); x.moveTo(mx + R, my - R); x.lineTo(mx - R, my + R); x.stroke(); x.restore(); } }
    }
    x.restore();
  }
  x.restore();
}
const NOTIFS = [['FitApp', 'הגיע הזמן להתאמן!', 'פספסת 5 אימונים השבוע'], ['GymPro', 'המנוי שלך חודש', 'חויבת ‎₪249'], ['MoveIt', 'עוד לא התחלת?', 'האתגר מתחיל בלעדיך']];
function notifications(x, t, L) {
  if (t < bt(8) || t > bt(13.2)) return;
  const [cx0, cy0, w] = L.notif, col = io3(inv(bt(12), bt(12.8), t));
  NOTIFS.forEach(([app, a, b], i) => {
    const s = spring(t - (bt(8) + i * bt(0.5)), 15, 0.55); if (s <= 0.001) return;
    const tyy = cy0 + i * 150 - (1 - clamp(s)) * 260, cx = lerp(cx0 + (i - 1) * 24, L.W / 2, col), cy = lerp(tyy, L.H / 2, col), k = 1 - col;
    x.save(); x.translate(cx, cy); x.scale(k * clamp(s, 0, 1.1), k * clamp(s, 0, 1.1)); x.rotate((i - 1) * 0.03);
    card(x, 0, 0, w, 130, 34, { fill: 'rgba(255,255,255,.96)', shadow: 'rgba(0,0,0,.5)', depth: 0.8 });
    rrc(x, w / 2 - 64, 0, 64, 64, 18); x.fillStyle = ['#9AA3C7', '#C7A39A', '#9AC7B5'][i]; x.fill();
    en(x, 24, 'right'); x.fillStyle = rgba(NAVY, 0.55); x.fillText(app.toUpperCase(), w / 2 - 112, -26);
    he(x, 34); x.fillStyle = NAVY; x.fillText(a, w / 2 - 112, 14); x.font = FT.body(26); x.fillStyle = rgba(NAVY, 0.7); x.fillText(b, w / 2 - 112, 48);
    x.restore();
  });
}
function pulseDot(x, t, L) {   // everything collapses into one point; it beats; a heartbeat line becomes the icon
  if (t < bt(12.6) || t >= bt(16) + 0.45) return;
  const cx = L.W / 2, cy = L.H / 2, kick = sk(t, [[-1, 1], [bt(13), 1.9], [bt(13) + 0.12, 1], [bt(14), 1.9], [bt(14) + 0.12, 1], [bt(15), 2.2], [bt(15) + 0.12, 1]], 24, 0.5);
  const grow = io3(inv(bt(15.3), bt(16), t));
  if (grow < 1) { circle(x, cx, cy, 22 * kick * (1 - grow)); x.fillStyle = gradPaint(x, cx - 30, cy - 30, cx + 30, cy + 30, FIRE); x.fill(); }
  const ln = out3(inv(bt(14), bt(15.2), t)), shrink = io3(inv(bt(15.3), bt(16), t));
  if (ln > 0 && t < bt(16)) {
    const x0 = lerp(0, cx - L.icon[2] * 0.36, shrink), x1 = lerp(L.W, cx + L.icon[2] * 0.36, shrink), amp = lerp(L.H * 0.22, L.icon[2] * 0.3, shrink);
    x.save(); pulsePath(x, x0, x1, cy + lerp(0, L.icon[2] * 0.04, shrink), amp); x.lineWidth = lerp(10, L.icon[2] * 0.075, shrink); x.lineCap = 'round'; x.lineJoin = 'round';
    x.strokeStyle = gradPaint(x, x0, 0, x1, 0, FIRE); x.setLineDash([L.W * 3, L.W * 3]); x.lineDashOffset = L.W * 3 * (1 - ln); x.shadowColor = rgba(ORANGE, 0.8); x.shadowBlur = 24; x.stroke(); x.restore();
  }
  if (grow > 0 && t < bt(16)) { const S = L.icon[2] * out3(grow); x.save(); rrc(x, cx, cy, S, S, S * 0.26); x.fillStyle = gradPaint(x, cx, cy - S / 2, cx, cy + S / 2, ['#262C6B', NAVY]); x.globalCompositeOperation = 'destination-over'; x.fill(); x.restore(); }
}
function act1Titles(x, t, L) {
  const R = L.right;
  riseWords(x, t, ['ינואר.'], 0, L.tY1 - L.tS * 0.95, 40, FT.he, GOLD, [bt(0.3)], bt(3.7), { right: R });
  slamWords(x, t, ['הבטחת', 'לעצמך:'], 0, L.tY1, L.tS, FT.he, W, [bt(1), bt(1.5)], bt(3.6), { right: R, maxW: L.W - 140 });
  slamWords(x, t, ['השנה', 'זה', 'קורה.'], 0, L.tY2, L.tS, FT.he, W, [bt(2), bt(2.5), bt(3)], bt(3.65), { right: R, maxW: L.W - 140, marker: { i: 2, paint: gradPaint(x, R - 900, 0, R, 0, FIRE) }, colors: [W, W, NAVY] });
  slamWords(x, t, ['ושוב', 'לא.'], 0, L.tY1, L.tS, FT.he, W, [bt(5), bt(5.5)], bt(7.6), { right: R });
  slamWords(x, t, ['3', 'אפליקציות.'], 0, L.tY1, L.tS, FT.he, W, [bt(10), bt(10.25)], bt(11.6), { right: R, maxW: L.W - 140 });
  slamWords(x, t, ['0', 'תוצאות.'], 0, L.tY2, L.tS, FT.he, W, [bt(10.75), bt(11)], bt(11.65), { right: R, maxW: L.W - 140, marker: { i: 0, paint: gradPaint(x, R - 600, 0, R, 0, [CORAL, CORAL]) } });
}

/* ============================ ACT II–VI overlays ============================ */
function dropTitles(x, t, L) {
  const y1 = L.name === 'h' ? L.icon[1] + 260 : L.icon[1] + 330;
  x.save(); x.shadowColor = 'rgba(255,255,255,.6)'; x.shadowBlur = 20;
  slamWords(x, t, ['קצב.'], L.W / 2, y1, L.name === 'h' ? 120 : 130, FT.he, NAVY, [bt(16.4)], bt(17.7), {});
  x.restore();
  slamWords(x, t, ['האימון', 'שזז', 'איתך.'], L.W / 2, y1 + (L.name === 'h' ? 90 : 110), L.name === 'h' ? 60 : 64, FT.he, NAVY, [bt(16.9), bt(17.1), bt(17.3)], bt(17.75), { colors: [NAVY, NAVY, NAVY], marker: { i: 2, paint: gradPaint(x, L.W / 2 - 300, 0, L.W / 2 + 300, 0, FIRE) } });
}
function stageRect(t, L) {
  const [cx, cy, w, h] = L.stage, inS = spring(t - bt(36), 11, 0.62), outS = spring(t - bt(66), 10, 0.85);
  const P = phoneState(t, L);
  return { cx: lerp(cx, P.cx, clamp(outS)), cy: lerp(cy, P.cy, clamp(outS)), w: w * clamp(inS, 0, 1.2) * (1 - clamp(outS)) + 0.0001, h: h * clamp(inS, 0, 1.2) * (1 - clamp(outS)) + 0.0001, s: inS };
}
function flipAt(t, b) { return clamp((t - bt(b)) / bt(0.5)); }        // 0..1 over half a beat
function stage(x, t, L) {
  if (t < bt(36) || t > bt(67.5)) return;
  const S = stageRect(t, L); if (S.w < 2) return;
  const flips = [44, 48, 52, 56, 60]; let sx = 1, phase = 0;
  flips.forEach((b, i) => { const u = flipAt(t, b); if (u > 0 && u < 1) sx = Math.abs(Math.cos(Math.PI * u)); if (u >= 0.5) phase = i + 1; });
  x.save(); x.translate(S.cx, S.cy); x.scale(sx, 1); x.translate(-S.cx, -S.cy);
  const isDark = phase >= 5;
  card(x, S.cx, S.cy, S.w, S.h, 48, { fill: isDark ? NAVY : W, shadow: 'rgba(14,30,80,.4)', depth: 0.9 });
  x.save(); rrc(x, S.cx, S.cy, S.w, S.h, 48); x.clip();
  const X0 = S.cx - S.w / 2, Y0 = S.cy - S.h / 2, k = S.w / L.stage[2], R = X0 + S.w - 48 * k;
  if (phase <= 2) {
    // backdrop: sky gradient + mat
    x.fillStyle = gradPaint(x, 0, Y0, 0, Y0 + S.h, ['#BDE1FF', '#EEF3FB']); x.fillRect(X0, Y0, S.w, S.h);
    const gy = Y0 + S.h * 0.86, who = ['noa', 'daniel', 'maya'][phase], sc = S.h * (phase === 2 ? 0.38 : 0.32);
    if (phase === 1) { x.fillStyle = '#E3EBF8'; x.fillRect(X0, gy, S.w, S.h); for (let i = 0; i < 9; i++) { const xx = X0 + ((i * 160 - (t * 520) % 160) % (S.w + 160)); x.fillStyle = rgba(NAVY, 0.15); x.fillRect(xx, gy + 30 * k, 80 * k, 8 * k); } }
    else { rr(x, S.cx - S.w * 0.36, gy - 6 * k, S.w * 0.72, 30 * k, 15 * k); x.fillStyle = gradPaint(x, S.cx - S.w * 0.36, 0, S.cx + S.w * 0.36, 0, FIRE); x.fill(); }
    let pose;
    if (phase === 0) { const a = inv(bt(36.6), bt(37), t); pose = poseSquat(a * (0.5 + 0.5 * Math.cos(2 * Math.PI * (t - bt(37)) / B))); }
    else if (phase === 1) pose = poseRun(((t - bt(44)) / (2 * B)) % 1);
    else pose = posePushup(0.5 + 0.5 * Math.cos(2 * Math.PI * (t - bt(49)) / B));
    drawPerson(x, pose, S.cx + (phase === 2 ? -0.75 * sc : -0.05 * sc), gy, sc, PEOPLE[who]);
    const names = [['נועה, 34', 'עובדת. שני ילדים. 12 דק׳ ביום.'], ['דניאל, 41', 'ריצה ראשונה מזה שנתיים.'], ['מאיה, 27', 'שבוע 6. שכיבות סמיכה מלאות.']];
    const bb = [36.3, 44.3, 48.3][phase];
    slamWords(x, t, [names[phase][0]], 0, Y0 + 110 * k, 76 * k, FT.he, NAVY, [bt(bb)], null, { right: R });
    riseWords(x, t, [names[phase][1]], 0, Y0 + 165 * k, 34 * k, FT.body, rgba(NAVY, 0.8), [bt(bb + 0.4)], null, { right: R });
    if (phase === 0) { const c = spring(t - bt(40), 15, 0.5); if (c > 0.001) { x.save(); x.translate(S.cx, Y0 + S.h * 0.935); x.scale(c, c); neonChip(x, 1e9, 0, 0, 0, 'ברכיים מעל הקרסוליים ✓', { size: 30 * k, fontFn: FT.he, angle: t * 1.5 }); x.restore(); } }
  } else if (phase === 3) {   // 30-day streak: fire checks fill in (callback to the red X's)
    he(x, 76 * k); x.fillStyle = NAVY; slamWords(x, t, ['30', 'ימים.'], 0, Y0 + 110 * k, 76 * k, FT.he, NAVY, [bt(52.3), bt(52.6)], null, { right: R, marker: { i: 0, paint: gradPaint(x, R - 400 * k, 0, R, 0, FIRE) } });
    const gx = 6, gy = 5, cw = (S.w - 96 * k) / gx, ch = (S.h - 230 * k) / gy;
    for (let i = 0; i < 30; i++) {
      const c = gx - 1 - (i % gx), r = Math.floor(i / gx), x1 = X0 + 48 * k + c * cw, y1 = Y0 + 190 * k + r * ch, s = spring(t - (bt(52.6) + i * bt(0.1)), 22, 0.5);
      rr(x, x1 + 6 * k, y1 + 6 * k, cw - 12 * k, ch - 12 * k, 18 * k); x.fillStyle = rgba(NAVY, 0.06); x.fill();
      if (s > 0.001) { const mx = x1 + cw / 2, my = y1 + ch / 2; x.save(); x.translate(mx, my); x.scale(s, s); rrc(x, 0, 0, cw - 18 * k, ch - 18 * k, 16 * k); x.fillStyle = gradPaint(x, -cw / 2, -ch / 2, cw / 2, ch / 2, FIRE); x.fill(); x.lineWidth = 8 * k; x.lineCap = 'round'; x.lineJoin = 'round'; x.strokeStyle = NAVY; x.beginPath(); x.moveTo(-cw * 0.16, 0); x.lineTo(-cw * 0.03, ch * 0.13); x.lineTo(cw * 0.18, -ch * 0.14); x.stroke(); x.restore(); }
    }
  } else if (phase === 4) {   // consistency chart: before vs with the app
    slamWords(x, t, ['4×', 'יותר', 'עקביות.'], 0, Y0 + 110 * k, 70 * k, FT.he, NAVY, [bt(56.3), bt(56.6), bt(56.9)], null, { right: R, marker: { i: 0, paint: gradPaint(x, R - 200 * k, 0, R, 0, FIRE) } });
    const gx0 = X0 + 60 * k, gx1 = X0 + S.w - 60 * k, gy0 = Y0 + 230 * k, gy1 = Y0 + S.h - 120 * k;
    for (let j = 0; j <= 4; j++) { x.fillStyle = rgba(NAVY, 0.08); x.fillRect(gx0, lerp(gy0, gy1, j / 4), gx1 - gx0, 2); }
    const line = (f, d, col, w, dash) => { x.save(); x.beginPath(); for (let i = 0; i <= 40; i++) { const u = i / 40 * d, X = lerp(gx0, gx1, u), Y = lerp(gy1, gy0, f(u)); i ? x.lineTo(X, Y) : x.moveTo(X, Y); } x.lineWidth = w; x.strokeStyle = col; x.lineCap = 'round'; x.lineJoin = 'round'; if (dash) x.setLineDash(dash); x.stroke(); x.restore(); };
    const d1 = out3(inv(bt(56.4), bt(57.6), t)), d2 = out3(inv(bt(57.4), bt(59), t));
    if (d1 > 0) line(u => 0.55 - 0.45 * u + 0.05 * Math.sin(u * 18), d1, CORAL, 7 * k, [14 * k, 12 * k]);
    if (d2 > 0) line(u => 0.15 + 0.78 * (1 - Math.exp(-u * 3)) + 0.03 * Math.sin(u * 14), d2, gradPaint(x, gx0, 0, gx1, 0, FIRE), 12 * k);
    riseWords(x, t, ['לפני'], 0, gy1 + 60 * k, 30 * k, FT.he, CORAL, [bt(57)], null, { right: gx1 });
    riseWords(x, t, ['עם קצב'], 0, gy1 + 60 * k, 30 * k, FT.he, ORANGE, [bt(58.6)], null, { left: gx0 });
  } else {                    // why: three reasons slam in, one per two beats
    const rows = [['מותאם אלייך.', 'התוכנית לומדת אותך כל יום.'], ['סופר בשבילך.', 'המצלמה סופרת. אתה רק זז.'], ['12 דקות ביום.', 'כי זה מה שיש. וזה מספיק.']];
    rows.forEach(([a, b], i) => { const t0 = bt(60.3 + i * 2), s = spring(t - t0, 16, 0.5); if (s <= 0.001) return; const yy = Y0 + 150 * k + i * (S.h - 200 * k) / 3;
      x.save(); x.translate(S.cx, yy + 70 * k); x.scale(s, s); x.translate(-S.cx, -(yy + 70 * k));
      rr(x, X0 + 36 * k, yy, S.w - 72 * k, 160 * k, 36 * k); x.fillStyle = NAVY2; x.fill(); neonRing(x, S.cx, yy + 80 * k, S.w - 72 * k, 160 * k, 36 * k, t * 1.4 + i, { lw: 3, glow: 10, power: 0.6 + 0.4 * beatPulse(t) });
      circle(x, X0 + 110 * k, yy + 80 * k, 44 * k); x.fillStyle = gradPaint(x, X0 + 66 * k, 0, X0 + 154 * k, 0, FIRE); x.fill(); en(x, 50 * k, 'center'); x.fillStyle = NAVY; x.fillText(String(i + 1), X0 + 110 * k, yy + 98 * k);
      he(x, 52 * k); x.fillStyle = W; x.fillText(a, R - 30 * k, yy + 76 * k); x.font = FT.body(28 * k); x.fillStyle = DENIM; x.fillText(b, R - 30 * k, yy + 122 * k);
      x.restore(); });
  }
  x.restore(); x.restore();
}
function repSparks(x, t, L, P) {   // every squat sends a "+1" from Noa into the phone's counter
  if (!P || t < bt(37) || t > bt(52)) return;
  const S = stageRect(t, L), from = { x: S.cx, y: S.cy + S.h * 0.1 }, to = uiToScreen(P, UIW / 2, 540);
  for (const b of [37, 38, 39, 40, 41, 42, 43, 49, 50, 51]) { const u = inv(bt(b), bt(b) + 0.42, t); if (u <= 0 || u >= 1) continue; const e = io3(u), xx = lerp(from.x, to.x, e), yy = lerp(from.y, to.y, e) - Math.sin(e * Math.PI) * 140;
    x.save(); x.translate(xx, yy); const s = 1 - 0.5 * e; x.scale(s, s); rrc(x, 0, 0, 92, 60, 30); x.fillStyle = gradPaint(x, -46, 0, 46, 0, FIRE); x.fill(); en(x, 38, 'center'); x.fillStyle = NAVY; x.fillText('+1', 0, 14); x.restore(); }
}
function ctaTitles(x, t, L) {
  const P = phoneState(t, L), y1 = P.cy + (L.name === 'h' ? 270 : 330);
  x.save(); x.shadowColor = 'rgba(255,255,255,.6)'; x.shadowBlur = 20;
  slamWords(x, t, ['קצב.'], L.W / 2, y1, L.name === 'h' ? 130 : 140, FT.he, NAVY, [bt(69.2)], null, {}); x.restore();
  slamWords(x, t, ['האימון', 'שזז', 'איתך.'], L.W / 2, y1 + (L.name === 'h' ? 96 : 116), L.name === 'h' ? 64 : 68, FT.he, NAVY, [bt(70), bt(70.25), bt(70.5)], null, { marker: { i: 2, paint: gradPaint(x, L.W / 2 - 300, 0, L.W / 2 + 300, 0, FIRE) } });
  const c = spring(t - bt(72), 16, 0.5);
  if (c > 0.001) { x.save(); x.translate(L.W / 2, y1 + (L.name === 'h' ? 210 : 250)); x.scale(c, c); const w = 520, h = 104; neonRing(x, 0, 0, w + 6, h + 6, (h + 6) / 2, t * 1.6, { lw: 4, glow: 18, power: 1 + 0.5 * beatPulse(t) }); rrc(x, 0, 0, w, h, h / 2); x.fillStyle = NAVY; x.fill(); he(x, 44); x.textAlign = 'center'; x.fillStyle = W; x.fillText('הורידו עכשיו · חינם', 0, 15); x.restore(); }
  if (t > bt(74)) { const s = spring(t - bt(74), 12, 0.6); x.save(); x.translate(L.W / 2, L.H - (L.name === 'h' ? 70 : 140)); x.scale(s, s);
    if (LOGO) x.drawImage(LOGO, -232, -30, 44, 44); en(x, 26, 'left'); x.letterSpacing = '3px'; x.fillStyle = NAVY; x.fillText('MADE WITH YUV.AI MOTION  ·  100% CODE', -180, 2); x.restore(); }
}
function hud(x, t, L) {
  x.save(); x.direction = 'ltr'; x.textAlign = 'left'; x.font = FT.monoB(L.name === 'h' ? 21 : 23); x.fillStyle = t < bt(16) ? 'rgba(255,255,255,.55)' : 'rgba(18,22,63,.6)';
  x.fillText(`seek(${t.toFixed(3)})  ·  beat ${Math.min(NB, Math.floor(t / B))}/${NB}`, L.name === 'h' ? 40 : 44, L.hudY); x.restore();
}

/* ============================ the day world (3D sky + sea) ============================ */
let R3 = null;
async function init3D(L, SCALE) {
  const renderer = makeRenderer(Math.round(L.W * SCALE), Math.round(L.H * SCALE), 0.85), scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(L.name === 'h' ? 38 : 50, L.W / L.H, 0.05, 20000);
  const world = makeTodWorld(renderer, scene, {}); R3 = { renderer, scene, camera, world };
}
function render3D(t, L) {
  const { renderer, scene, camera, world } = R3; world.update(t, 0);
  camera.position.set(0.3 * Math.sin(t * 0.12), 1.2, 6 - 0.02 * t); camera.lookAt(0.3 * Math.sin(t * 0.12), 1.2 + 0.9, 0); renderer.render(scene, camera); return renderer.domElement;
}

/* ============================ the film ============================ */
function draw(x, t, L) {
  if (t >= bt(16)) { x.drawImage(render3D(t, L), 0, 0, L.W, L.H); }
  // the room covers everything until the drop, then an iris opens from the centre into the day
  if (t < bt(16) + 0.45) {
    const iris = out3(inv(bt(16), bt(16) + 0.42, t)) * coverR(L.W, L.H, L.W / 2, L.H / 2);
    x.save(); if (iris > 0) { x.beginPath(); x.rect(0, 0, L.W, L.H); x.arc(L.W / 2, L.H / 2, iris, 0, Math.PI * 2, true); x.clip(); }
    const ph = room(x, t, L); calendar(x, t, L, ph || { x: L.W / 2, y: L.H / 2 }); notifications(x, t, L); act1Titles(x, t, L);
    x.restore();
    pulseDot(x, t, L);
  }
  if (t >= bt(16) && t < bt(16) + 0.7) { const q = inv(bt(16), bt(16) + 0.7, t), R = out3(q) * coverR(L.W, L.H, L.W / 2, L.H / 2) * 1.05; const g = x.createConicGradient(t * 3, L.W / 2, L.H / 2); SPECTRUM.forEach((c, i) => g.addColorStop(i / (SPECTRUM.length - 1), c)); x.save(); x.strokeStyle = g; x.lineWidth = 50 * (1 - q) + 2; x.filter = 'blur(6px)'; circle(x, L.W / 2, L.H / 2, R); x.stroke(); x.restore(); }
  stage(x, t, L);
  const P = drawPhone(x, t, L);
  repSparks(x, t, L, P); callouts(x, t, L, P);
  if (t >= bt(16)) { dropTitles(x, t, L); ctaTitles(x, t, L); }
}
mountFilm({
  layouts: LAYOUTS, draw, dur: DUR, clk, extra: { NB },
  init: async (L, SCALE) => { LOGO = LOGO_URL ? await new Promise(res => { const im = new Image(); im.onload = () => res(im); im.onerror = () => res(null); im.src = LOGO_URL; }) : null; await init3D(L, SCALE); }
});
