// An "aurora" background: a few huge soft colour blobs that drift with t, blurred together on a 2D canvas.
import { canvas2d } from '../ui/canvas.js';
const BLOBS = [['#5EA9F2', 0.0], ['#FF8F3A', 1.3], ['#FFC74E', 2.4], ['#D74270', 3.6], ['#93CBFF', 4.8]];
export function mount(stage) {
  stage.classList.add('fxa');
  const cv = canvas2d(stage, 960, 540);
  const ctrl = document.createElement('div'); ctrl.className = 'ctrl-row';
  ctrl.innerHTML = `<label class="chk"><input type="checkbox" class="fxa-grain" checked> גרעין (grain)</label><label class="chk"><input type="checkbox" class="fxa-raw"> בלי טשטוש (לראות את העיגולים)</label>`;
  stage.appendChild(ctrl);
  const grain = ctrl.querySelector('.fxa-grain'), raw = ctrl.querySelector('.fxa-raw');
  const noise = document.createElement('canvas'); noise.width = noise.height = 160; { const x = noise.getContext('2d'), d = x.createImageData(160, 160); let s = 7; for (let i = 0; i < d.data.length; i += 4) { s = (s * 16807) % 2147483647; const v = s % 255; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 22; } x.putImageData(d, 0, 0); }
  const render = t => {
    const { x, W, H } = cv;
    x.save(); x.fillStyle = '#12163F'; x.fillRect(0, 0, W, H);
    x.filter = raw.checked ? 'none' : 'blur(70px)';
    BLOBS.forEach(([c, ph], i) => { const a = t * (0.25 + i * 0.05) + ph; x.fillStyle = c; x.globalAlpha = 0.85; x.beginPath(); x.arc(W * (0.5 + 0.34 * Math.cos(a)), H * (0.5 + 0.32 * Math.sin(a * 1.3)), 150 + 40 * Math.sin(t * 0.7 + i), 0, Math.PI * 2); x.fill(); });
    x.filter = 'none'; x.globalAlpha = 1;
    if (grain.checked) { x.fillStyle = x.createPattern(noise, 'repeat'); x.fillRect(0, 0, W, H); }
    x.font = '400 92px Anton'; x.fillStyle = '#FFFFFF'; x.textAlign = 'center'; x.direction = 'ltr'; x.fillText('FLY HIGH', W / 2, H / 2 + 32);
    x.restore();
  };
  return { dur: 14, render, resize: () => cv.fit() };
}
