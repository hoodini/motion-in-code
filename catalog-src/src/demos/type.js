// Four kinetic-type techniques on one canvas, one after another. All from the YUV.AI motion kit.
import { EN, T, DIR } from '../ui/i18n.js';
import { canvas2d, C, F, fontsReady, fire } from '../ui/canvas.js';
import { spring, inv, out3, clamp, riseWords } from '../../../kit/src/core.js';
import { slamWords, popType } from '../../../kit/src/ui.js';
const SEG = [
  { t: 0, name: 'SLAM', he: T('מילים שנוחתות', 'words land on the beat'), bg: C.navy },
  { t: 2.6, name: 'MASK RISE', he: T('עולות מקו מסכה', 'rising out of a mask line'), bg: C.denim },
  { t: 5.2, name: 'POP TYPE', he: T('הקלדה שכל אות קופצת', 'typing, every letter pops'), bg: C.sky2 },
  { t: 7.8, name: 'MARKER', he: T('מרקר שנמתח מימין', 'a marker swipes in'), bg: C.cloud }
];
const he = F.he;   // Karantina in Hebrew, Anton in English
const LTR = { ltr: EN };
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
    x.font = F.textB(22); x.direction = DIR; x.textAlign = 'right'; x.fillStyle = ink; x.fillText(cur.he, W - 48 - lw - 18, 68);
    const lt = t - cur.t;
    if (k === 0) slamWords(x, lt, EN ? ['BUILD.', 'RENDER.', 'SHIP.'] : ['בונים.', 'מרנדרים.', 'משיקים.'], W / 2, 330, EN ? 104 : 120, he, '#FFFFFF', [0.3, 0.8, 1.3], 2.3, { ...LTR, marker: { i: 2, paint: fire(x, 200, 0, 520, 0) }, colors: ['#FFFFFF', '#FFFFFF', C.navy] });
    if (k === 1) riseWords(x, lt, EN ? ['EVERY', 'WORD', 'RISES.'] : ['כל', 'מילה', 'עולה', 'מקו.'], W / 2, 330, EN ? 104 : 120, he, C.navy, [0.3, 0.55, 0.8, 1.05], 2.3, LTR);
    if (k === 2) {
      const txt = T('הזמן מצייר הכול', 'TIME DRAWS IT ALL'); // one direction per run: popType lays letters out in reading direction
      const times = Array.from(txt).map((_, i) => 0.3 + i * 0.09), sz = EN ? 92 : 110;
      x.font = he(sz); x.direction = DIR;
      const tw = x.measureText(txt).width;
      const caret = popType(x, lt, txt, EN ? W / 2 - tw / 2 : W / 2 + tw / 2, 320, he, sz, C.navy, times, LTR);
      if (Math.floor(lt * 2.2) % 2 === 0) { x.fillStyle = C.orange; x.fillRect(caret - 10, 230, 7, 112); }
    }
    if (k === 3) riseWords(x, lt, EN ? ['THE', 'KEY', 'WORD.'] : ['השורה', 'החשובה', 'מסומנת.'], W / 2, 330, EN ? 104 : 120, he, C.navy, [0.2, 0.35, 0.5], null, { ...LTR, marker: { i: 1, t: 0.9, color: fire(x, 300, 0, 700, 0) } });
  };
  return { dur: 10.4, render: draw, resize: () => cv.fit() };
}
