// Why a library's own animation can't go into a video as-is: the capture is slower than real time.
import { canvas2d, C, F, fontsReady } from '../ui/canvas.js';
import { spring } from '../../../kit/src/core.js';
export async function mount(stage) {
  await fontsReady();
  stage.classList.add('clock');
  const { x, W, H, fit } = canvas2d(stage, 900, 330);
  const ctrl = document.createElement('div'); ctrl.className = 'ctrl-row';
  ctrl.innerHTML = `<button type="button" class="btn m clk-run">צלמו 12 פריימים מחדש</button><span class="clk-note"></span>`;
  stage.appendChild(ctrl);
  const N = 12, FPS = 60;
  // the animation itself: a pill that springs from left to right in 0.2 s of film time
  const posAt = t => 40 + 140 * spring(t - 0.02, 26, 0.85);
  let wall = [];
  const shoot = () => { wall = []; let acc = 0; for (let i = 0; i < N; i++) { wall.push(acc); acc += (16 + Math.random() * 90) / 1000; } };
  const draw = () => {
    x.clearRect(0, 0, W, H);
    const rows = [['שעון אמיתי (אנימציה של הספרייה)', wall, C.coral], ['seek(t): פריים i מקבל t = i ÷ 60', [...Array(N)].map((_, i) => i / FPS), C.navy]];
    rows.forEach(([label, times, col], r) => {
      const y0 = 30 + r * 150;
      x.fillStyle = C.navy; x.font = F.textB(19); x.direction = 'rtl'; x.textAlign = 'right'; x.fillText(label, W - 10, y0);
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
    stage.querySelector('.clk-note').textContent = `בשורה העליונה הצילום לקח ${(wall[N - 1] * 1000).toFixed(0)}ms במקום ${((N - 1) / FPS * 1000).toFixed(0)}ms, אז האנימציה "ברחה" ${(lateBy * 1000).toFixed(0)}ms קדימה ונגמרה כבר בפריים ${wall.findIndex(w => w > 0.2) + 1 || N}.`;
  };
  shoot(); draw();
  stage.querySelector('.clk-run').addEventListener('click', () => { shoot(); draw(); });
  return { noTime: true, resize() { fit(); draw(); } };
}
