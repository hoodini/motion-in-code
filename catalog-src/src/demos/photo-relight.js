// Real photos in a code film: a photo card with a slow Ken Burns push, then a slider that relights it from day to
// golden hour. The relight is a wipe between two aligned shots that follows the knob, never a crossfade.
import { EN, T, DIR } from '../ui/i18n.js';
import { canvas2d, C, F, fontsReady } from '../ui/canvas.js';
import { clamp, inv, io3, out3, logLerp, spring, lerp } from '../../../kit/src/core.js';

const load = src => new Promise((res, rej) => { const i = new Image(); i.decoding = 'async'; i.onload = () => res(i); i.onerror = rej; i.src = src; });

export async function mount(stage) {
  await fontsReady();
  const [day, dusk] = await Promise.all([load(new URL('../static/relight-day.jpg', import.meta.url).href), load(new URL('../static/relight-dusk.jpg', import.meta.url).href)]);
  const cv = canvas2d(stage, 960, 540);
  const CX = 480, CY = 250, CW = 760, CH = 380, R = 28;           // the photo card
  const SX0 = CX - 230, SX1 = CX + 230, SY = 482;                  // the slider track
  let hold = null;                                                 // a value from the viewer's own drag, while the pointer is down
  const knobAt = t => {   // the cursor drags the knob with two small pauses, like a person deciding
    const a = io3(inv(3.9, 5.2, t)) * 0.45, b = io3(inv(5.6, 6.9, t)) * 0.55;
    return clamp(a + b);
  };
  const cursor = (x, X, Y, down) => {
    x.save(); x.translate(X, Y); x.scale(down ? 0.9 : 1, down ? 0.9 : 1);
    x.fillStyle = '#fff'; x.strokeStyle = C.navy; x.lineWidth = 2.5; x.lineJoin = 'round';
    x.beginPath(); x.moveTo(0, 0); x.lineTo(0, 28); x.lineTo(7, 21); x.lineTo(12, 33); x.lineTo(17, 31); x.lineTo(12, 19); x.lineTo(22, 19); x.closePath(); x.fill(); x.stroke(); x.restore();
  };
  const cover = (x, img, zoom, px, py) => {   // draw an image to cover the card, scaled around its centre and panned
    const k = Math.max(CW / img.width, CH / img.height) * zoom, w = img.width * k, h = img.height * k;
    x.drawImage(img, CX - w / 2 + px, CY - h / 2 + py, w, h);
  };
  const render = t => {
    const { x, W, H } = cv;
    x.save(); x.fillStyle = C.cloud; x.fillRect(0, 0, W, H);
    const pop = clamp(spring(t, 9, 0.7), 0, 1.04);
    const zoom = logLerp(1.07, 1.2, io3(inv(0, 9.5, t)));             // starts above 1, so the pan never shows an edge            // Ken Burns: a slow push in log space, plus a small pan
    const px = lerp(18, -18, io3(inv(0, 9.5, t))), py = lerp(-6, 6, io3(inv(0, 9.5, t)));
    const v = hold ?? knobAt(t), held = hold != null || (t > 3.9 && t < 6.9 && !(t > 5.2 && t < 5.6));
    x.translate(CX, CY); x.scale(pop, pop); x.translate(-CX, -CY);
    x.shadowColor = 'rgba(18,22,63,.28)'; x.shadowBlur = 40; x.shadowOffsetY = 18;
    x.fillStyle = '#fff'; x.beginPath(); x.roundRect(CX - CW / 2, CY - CH / 2, CW, CH, R); x.fill(); x.shadowColor = 'transparent';
    x.save(); x.beginPath(); x.roundRect(CX - CW / 2, CY - CH / 2, CW, CH, R); x.clip();
    cover(x, day, zoom, px, py);
    // the wipe: golden hour is revealed up to the knob's position, with a lit leading edge
    const ex = CX - CW / 2 + CW * v;
    if (v > 0) { x.save(); x.beginPath(); x.rect(CX - CW / 2, CY - CH / 2, CW * v, CH); x.clip(); cover(x, dusk, zoom, px, py); x.restore(); }
    if (v > 0 && v < 1) { const g = x.createLinearGradient(ex - 40, 0, ex + 4, 0); g.addColorStop(0, 'rgba(255,199,78,0)'); g.addColorStop(1, 'rgba(255,199,78,.55)'); x.fillStyle = g; x.fillRect(ex - 40, CY - CH / 2, 44, CH); x.fillStyle = '#fff'; x.fillRect(ex - 1.5, CY - CH / 2, 3, CH); }
    x.restore();
    // labels on the photo
    x.font = F.textB(18); x.direction = DIR; x.textAlign = 'center';
    const tag = (txt, X, on) => { const w = x.measureText(txt).width + 30; x.fillStyle = on ? C.navy : 'rgba(255,255,255,.88)'; x.beginPath(); x.roundRect(X - w / 2, CY + CH / 2 - 52, w, 34, 17); x.fill(); x.fillStyle = on ? '#fff' : C.navy; x.fillText(txt, X, CY + CH / 2 - 29); };
    tag(T('צהריים', 'Midday'), CX - CW / 2 + 90, v < 0.5); tag(T('שעת הזהב', 'Golden hour'), CX + CW / 2 - 100, v >= 0.5);
    x.restore();
    // the slider grows out of the card's bottom edge
    const sl = clamp(spring(t - 3.2, 12, 0.65), 0, 1.06);
    if (sl > 0.01) {
      x.save(); x.translate(CX, SY); x.scale(sl, sl); x.translate(-CX, -SY);
      x.fillStyle = 'rgba(255,255,255,.9)'; x.shadowColor = 'rgba(18,22,63,.18)'; x.shadowBlur = 18; x.shadowOffsetY = 6;
      x.beginPath(); x.roundRect(SX0 - 34, SY - 26, SX1 - SX0 + 68, 52, 26); x.fill(); x.shadowColor = 'transparent';
      x.fillStyle = 'rgba(18,22,63,.12)'; x.beginPath(); x.roundRect(SX0, SY - 4, SX1 - SX0, 8, 4); x.fill();
      const kx = lerp(SX0, SX1, v), g = x.createLinearGradient(SX0, 0, kx, 0); g.addColorStop(0, C.gold); g.addColorStop(1, C.orange);
      x.fillStyle = g; x.beginPath(); x.roundRect(SX0, SY - 4, Math.max(8, kx - SX0), 8, 4); x.fill();
      const kr = held ? 19 : 15;
      x.fillStyle = '#fff'; x.shadowColor = 'rgba(18,22,63,.3)'; x.shadowBlur = 10; x.beginPath(); x.arc(kx, SY, kr, 0, Math.PI * 2); x.fill(); x.shadowColor = 'transparent';
      x.strokeStyle = C.orange; x.lineWidth = 3; x.beginPath(); x.arc(kx, SY, kr - 5, 0, Math.PI * 2); x.stroke();
      x.restore();
      if (hold == null && t > 3.5 && t < 7.6) { const kx2 = lerp(SX0, SX1, v), enter = out3(inv(3.5, 3.9, t)), leave = io3(inv(7.0, 7.6, t)); cursor(x, kx2 + 6 + (1 - enter) * 140 + leave * 160, SY + 4 + (1 - enter) * 60 + leave * 50, held); }
    }
    x.restore();
  };
  // let the viewer drag the knob themselves
  const toVal = e => { const r = cv.c.getBoundingClientRect(), X = (e.clientX - r.left) / r.width * 960; return clamp((X - SX0) / (SX1 - SX0)); };
  let lastT = 0;
  cv.c.style.touchAction = 'pan-y';
  cv.c.addEventListener('pointerdown', e => { const r = cv.c.getBoundingClientRect(), Y = (e.clientY - r.top) / r.height * 540; if (Math.abs(Y - SY) > 40) return; hold = toVal(e); cv.c.setPointerCapture(e.pointerId); render(lastT); });
  cv.c.addEventListener('pointermove', e => { if (hold == null) return; hold = toVal(e); render(lastT); });
  const up = () => { if (hold == null) return; hold = null; render(lastT); };
  cv.c.addEventListener('pointerup', up); cv.c.addEventListener('pointercancel', up);
  return { dur: 10, render: t => { lastT = t; render(t); }, resize: () => cv.fit(), poster: 6.2 };
}
