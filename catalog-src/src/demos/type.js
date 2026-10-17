// Four kinetic-type techniques on one canvas, one after another. All from the YUV.AI motion kit.
import { canvas2d, C, F, fontsReady, fire } from '../ui/canvas.js';
import { spring, inv, out3, clamp, riseWords } from '../../../kit/src/core.js';
import { slamWords, popType } from '../../../kit/src/ui.js';
const SEG = [
  { t: 0, name: 'SLAM', he: 'מילים שנוחתות', bg: C.navy },
  { t: 2.6, name: 'MASK RISE', he: 'עולות מקו מסכה', bg: C.denim },
  { t: 5.2, name: 'POP TYPE', he: 'הקלדה שכל אות קופצת', bg: C.sky2 },
  { t: 7.8, name: 'MARKER', he: 'מרקר שנמתח מימין', bg: C.cloud }
];
const he = s => `700 ${s}px Karantina, sans-serif`;
export async function mount(stage) {
  await fontsReady();
  stage.classList.add('typ');
  const cv = canvas2d(stage, 960, 540);
  const draw = t => {
    const { x, W, H } = cv;
    // background spread: the new colour wipes in from the right with a leading fire band
    let k = 0; SEG.forEach((s, i) => { if (t >= s.t) k = i; });
    const prev = SEG[Math.max(0, k - 1)], cur = SEG[k], w = out3(inv(cur.t, cur.t + 0.35, t));
    x.fillStyle = k === 0 ? cur.bg : prev.bg; x.fillRect(0, 0, W, H);
    if (k > 0 && w < 1) { const edge = W * (1 - w); x.fillStyle = cur.bg; x.fillRect(edge, 0, W - edge, H); x.fillStyle = fire(x, edge - 30, 0, edge, 0); x.fillRect(edge - 26, 0, 26, H); }
    else { x.fillStyle = cur.bg; x.fillRect(0, 0, W, H); }
    const ink = k === 0 ? '#FFFFFF' : C.navy;
    // label chip
    x.font = F.en(22); x.letterSpacing = '3px'; x.direction = 'ltr';
    const lw = x.measureText(cur.name).width + 36; x.fillStyle = k === 0 ? C.gold : C.navy; x.beginPath(); x.roundRect(W - 48 - lw, 40, lw, 40, 20); x.fill();
    x.fillStyle = k === 0 ? C.navy : C.gold; x.textAlign = 'center'; x.fillText(cur.name, W - 48 - lw / 2, 69); x.letterSpacing = '0px';
    x.font = F.textB(22); x.direction = 'rtl'; x.textAlign = 'right'; x.fillStyle = ink; x.fillText(cur.he, W - 48 - lw - 18, 68);
    const lt = t - cur.t;
    if (k === 0) slamWords(x, lt, ['בונים.', 'מרנדרים.', 'משיקים.'], W / 2, 330, 120, he, '#FFFFFF', [0.3, 0.8, 1.3], 2.3, { marker: { i: 2, paint: fire(x, 200, 0, 520, 0) }, colors: ['#FFFFFF', '#FFFFFF', C.navy] });
    if (k === 1) riseWords(x, lt, ['כל', 'מילה', 'עולה', 'מקו.'], W / 2, 330, 120, he, C.navy, [0.3, 0.55, 0.8, 1.05], 2.3);
    if (k === 2) {
      const txt = 'הזמן מצייר הכול'; // Hebrew only: popType places letters right to left, so a Latin run here would come out reversed
      const times = Array.from(txt).map((_, i) => 0.3 + i * 0.09);
      x.font = he(110); x.direction = 'rtl';
      const tw = x.measureText(txt).width;
      const caret = popType(x, lt, txt, W / 2 + tw / 2, 320, he, 110, C.navy, times);
      if (Math.floor(lt * 2.2) % 2 === 0) { x.fillStyle = C.orange; x.fillRect(caret - 10, 230, 7, 112); }
    }
    if (k === 3) riseWords(x, lt, ['השורה', 'החשובה', 'מסומנת.'], W / 2, 330, 120, he, C.navy, [0.2, 0.35, 0.5], null, { marker: { i: 1, t: 0.9, color: fire(x, 300, 0, 700, 0) } });
  };
  return { dur: 10.4, render: draw, resize: () => cv.fit() };
}
