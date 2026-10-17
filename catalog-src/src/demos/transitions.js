// Four ways one scene becomes the next without a fade: flood, morph, wipe, iris. All pure functions of t.
import { canvas2d, C, F, fontsReady, fire } from '../ui/canvas.js';
import { spring, sk, clamp, inv, out3, io3, lerp, logLerp, coverR } from '../../../kit/src/core.js';
const SEG = [{ t: 0, name: 'FLOOD', he: 'הצפה מתוך כפתור' }, { t: 2.8, name: 'MORPH', he: 'גלולה שהופכת לכרטיס' }, { t: 5.6, name: 'WIPE', he: 'מגב עם פס מוביל' }, { t: 8.4, name: 'IRIS', he: 'איריס שנסגר לנקודה' }];
export async function mount(stage) {
  await fontsReady();
  stage.classList.add('trn');
  const cv = canvas2d(stage, 960, 540);
  const label = (x, W, k, ink) => { const s = SEG[k]; x.font = F.en(22); x.letterSpacing = '3px'; x.direction = 'ltr'; const lw = x.measureText(s.name).width + 36; x.fillStyle = ink; x.beginPath(); x.roundRect(W - 48 - lw, 40, lw, 40, 20); x.fill(); x.fillStyle = ink === C.navy ? C.gold : C.navy; x.textAlign = 'center'; x.fillText(s.name, W - 48 - lw / 2, 69); x.letterSpacing = '0px'; x.font = F.textB(22); x.direction = 'rtl'; x.textAlign = 'right'; x.fillStyle = ink; x.fillText(s.he, W - 66 - lw, 68); };
  const title = (x, txt, y, col, size = 96) => { x.font = F.he(size); x.direction = 'rtl'; x.textAlign = 'center'; x.fillStyle = col; x.fillText(txt, 480, y); };
  const render = t => {
    const { x, W, H } = cv; x.save();
    let k = 0; SEG.forEach((s, i) => { if (t >= s.t) k = i; }); const lt = t - SEG[k].t;
    if (k === 0) { // a button grows, gets pressed, then floods the whole frame with its own colour
      x.fillStyle = C.cloud; x.fillRect(0, 0, W, H); title(x, 'לחצו כדי להתחיל', 200, C.navy, 70);
      const bx = 480, by = 330, press = sk(lt, [[0, 1], [0.8, 0.88], [0.95, 1]], 34, 0.6), s = spring(lt - 0.15, 14, 0.6) * press;
      x.fillStyle = fire(x, bx - 120, 0, bx + 120, 0); x.beginPath(); x.roundRect(bx - 120 * s, by - 34 * s, 240 * s, 68 * s, 34 * s); x.fill();
      x.fillStyle = C.navy; x.font = F.he(36 * s); x.textAlign = 'center'; x.direction = 'rtl'; x.fillText('התחל', bx, by + 12 * s);
      const fr = coverR(W, H, bx, by) * out3(inv(1.0, 1.35, lt));
      if (fr > 0) { x.fillStyle = fire(x, 0, 0, W, H); x.beginPath(); x.arc(bx, by, fr, 0, Math.PI * 2); x.fill(); if (lt > 1.35) title(x, 'הוצפנו.', 300, C.navy, 120 * clamp(spring(lt - 1.4, 16, 0.5), 0, 1.2)); }
      label(x, W, k, C.navy);
    }
    if (k === 1) { // the same shape changes width, height and corner radius on springs: pill → card
      x.fillStyle = C.denim; x.fillRect(0, 0, W, H);
      const w = sk(lt, [[0, 90], [0.5, 360], [1.3, 620]], 11, 0.72), h = sk(lt, [[0, 90], [0.5, 90], [1.3, 340]], 11, 0.72), r = sk(lt, [[0, 45], [0.5, 45], [1.3, 28]], 11, 0.8);
      x.fillStyle = C.navy; x.beginPath(); x.roundRect(480 - w / 2, 290 - h / 2, w, h, r); x.fill();
      if (lt > 0.6 && lt < 1.3) { x.font = F.textB(30); x.direction = 'rtl'; x.textAlign = 'center'; x.fillStyle = '#fff'; x.fillText('אימון בוקר', 480, 300); }
      if (lt > 1.45) { const s = clamp(spring(lt - 1.45, 14, 0.6), 0, 1.1); x.fillStyle = '#fff'; x.font = F.he(64); x.direction = 'rtl'; x.textAlign = 'right'; x.globalAlpha = 1; x.fillText('אימון בוקר', 760, 230 + (1 - s) * 30); x.fillStyle = fire(x, 200, 0, 760, 0); x.beginPath(); x.roundRect(760 - 400 * s, 300, 400 * s, 22, 11); x.fill(); x.fillStyle = 'rgba(255,255,255,.3)'; x.beginPath(); x.roundRect(200, 300, 560 - 400 * s, 22, 11); x.fill(); }
      label(x, W, k, C.navy);
    }
    if (k === 2) { // a new colour page wipes in from the right with a leading fire band
      const w = out3(inv(0.3, 0.75, lt)), edge = W * (1 - w);
      x.fillStyle = C.navy; x.fillRect(0, 0, W, H); title(x, 'עמוד ישן', 300, '#fff', 110);
      x.save(); x.beginPath(); x.rect(edge, 0, W - edge, H); x.clip(); x.fillStyle = C.sky2; x.fillRect(0, 0, W, H); title(x, 'עמוד חדש', 300, C.navy, 110); x.restore();
      if (w > 0 && w < 1) { x.fillStyle = fire(x, edge - 40, 0, edge, 0); x.fillRect(edge - 34, 0, 34, H); }
      label(x, W, k, w > 0.5 ? C.navy : C.gold);
    }
    if (k === 3) { // the frame closes into a shrinking circle (log space, so it feels even), the dot becomes the logo's period
      const rr = logLerp(coverR(W, H, 480, 290), 14, io3(inv(0.3, 1.3, lt)));
      x.fillStyle = C.navy; x.fillRect(0, 0, W, H);
      x.save(); x.beginPath(); x.arc(480, 290, rr, 0, Math.PI * 2); x.clip(); x.fillStyle = C.sky2; x.fillRect(0, 0, W, H); title(x, 'עמוד חדש', 320, C.navy, 110); x.restore();
      if (lt > 1.3) { const s = clamp(spring(lt - 1.35, 13, 0.6), 0, 1.15); x.font = `400 ${150 * s}px Anton`; x.direction = 'ltr'; x.textAlign = 'center'; x.fillStyle = '#fff'; x.fillText('YUV', 400, 345); x.fillText('AI', 585, 345); x.fillStyle = C.orange; x.beginPath(); x.arc(lerp(480, 507, s), 330, 14, 0, Math.PI * 2); x.fill(); }
      label(x, W, k, '#FFFFFF');
    }
    x.restore();
  };
  return { dur: 11.2, render, resize: () => cv.fit() };
}
