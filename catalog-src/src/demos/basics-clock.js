// Why a library's own animation can't go into a video as-is: the capture is slower than real time.
import { EN, T, DIR } from '../ui/i18n.js';
import { canvas2d, C, F, fontsReady } from '../ui/canvas.js';
import { spring } from '../../../kit/src/core.js';
export async function mount(stage) {
  await fontsReady();
  stage.classList.add('clock');
  const { x, W, H, fit } = canvas2d(stage, 900, 330);
  const ctrl = document.createElement('div'); ctrl.className = 'ctrl-row';
  ctrl.innerHTML = `<button type="button" class="btn m clk-run">${T('צלמו 12 פריימים מחדש', 'Capture 12 frames again')}</button><span class="clk-note"></span>`;
  stage.appendChild(ctrl);
  const N = 12, FPS = 60;
  // the animation itself: a pill that springs from left to right in 0.2 s of film time
  const posAt = t => 40 + 140 * spring(t - 0.02, 26, 0.85);
  let wall = [];
  const shoot = () => { wall = []; let acc = 0; for (let i = 0; i < N; i++) { wall.push(acc); acc += (16 + Math.random() * 90) / 1000; } };
  const draw = () => {
    x.clearRect(0, 0, W, H);
    const rows = [[T('שעון אמיתי (אנימציה של הספרייה)', 'Wall clock (the library animates itself)'), wall, C.coral], [T('seek(t): פריים i מקבל t = i ÷ 60', 'seek(t): frame i gets t = i ÷ 60'), [...Array(N)].map((_, i) => i / FPS), C.navy]];
    rows.forEach(([label, times, col], r) => {
      const y0 = 30 + r * 150;
      x.fillStyle = C.navy; x.font = F.textB(19); x.direction = DIR; x.textAlign = EN ? 'left' : 'right'; x.fillText(label, EN ? 10 : W - 10, y0);
      x.direction = 'ltr';
      for (let i = 0; i < N; i++) {
        const fx = 10 + i * 74, fy = y0 + 14, fw = 66, fh = 88;
        x.fillStyle = '#fff'; x.strokeStyle = C.line; x.lineWidth = 1; x.beginPath(); x.roundRect(fx, fy, fw, fh, 10); x.fill(); x.stroke();
        const p = (posAt(times[i]) - 40) / 140;
        x.fillStyle = col; x.beginPath(); x.roundRect(fx + 8 + p * (fw - 34), fy + 30, 18, 18, 9); x.fill();
        x.fillStyle = C.muted; x.font = F.mono(10); x.textAlign = 'center'; x.fillText(`${(times[i] * 1000).toFixed(0)}ms`, fx + fw / 2, fy + fh - 10);
      }
    });
    const lateBy = wall[N - 1] - (N - 1) / FPS;
    const took = (wall[N - 1] * 1000).toFixed(0), should = ((N - 1) / FPS * 1000).toFixed(0), ran = (lateBy * 1000).toFixed(0), done = wall.findIndex(w => w > 0.2) + 1 || N;
    stage.querySelector('.clk-note').textContent = T(`בשורה העליונה הצילום לקח ${took}ms במקום ${should}ms, אז האנימציה "ברחה" ${ran}ms קדימה ונגמרה כבר בפריים ${done}.`, `In the top row the capture took ${took} ms instead of ${should} ms, so the animation ran ${ran} ms ahead and was already over by frame ${done}.`);
  };
  shoot(); draw();
  stage.querySelector('.clk-run').addEventListener('click', () => { shoot(); draw(); });
  return { noTime: true, resize() { fit(); draw(); } };
}
