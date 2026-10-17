// Lucide icons are drawn with lines, so each line can "draw itself": dasharray = its length, dashoffset shrinks to 0.
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import { Dumbbell, Flame, HeartPulse, Timer, Trophy, Footprints, Zap, Target } from 'lucide-react';
import { spring, clamp } from '../../../kit/src/core.js';
const ICONS = [['Dumbbell', Dumbbell], ['Flame', Flame], ['HeartPulse', HeartPulse], ['Timer', Timer], ['Trophy', Trophy], ['Footprints', Footprints], ['Zap', Zap], ['Target', Target]];
export function mount(stage) {
  stage.classList.add('ico');
  const grid = document.createElement('div'); grid.className = 'ico-grid'; stage.appendChild(grid);
  const ctrl = document.createElement('div'); ctrl.className = 'ctrl-row';
  ctrl.innerHTML = `<label>עובי קו <input type="range" min="1" max="3" step="0.25" value="2" class="ico-w"><output>2</output></label>`;
  stage.appendChild(ctrl);
  const root = createRoot(grid);
  flushSync(() => root.render(<>{ICONS.map(([n, I]) => <figure key={n}><I size={64} strokeWidth={2} absoluteStrokeWidth={false} /><figcaption dir="ltr">{n}</figcaption></figure>)}</>));
  const figs = [...grid.querySelectorAll('figure')].map(f => {
    const parts = [...f.querySelectorAll('path,circle,line,rect,polyline,polygon,ellipse')].map(p => { const L = p.getTotalLength ? p.getTotalLength() : 100; p.style.strokeDasharray = `${L} ${L}`; return [p, L]; });
    return { f, svg: f.querySelector('svg'), parts };
  });
  const wIn = ctrl.querySelector('.ico-w'), wOut = ctrl.querySelector('output');
  wIn.addEventListener('input', () => { wOut.textContent = wIn.value; figs.forEach(g => g.svg.setAttribute('stroke-width', wIn.value)); });
  return {
    dur: 4.8,
    render(t) {
      figs.forEach((g, i) => {
        const t0 = 0.3 + i * 0.25, p = clamp(spring(t - t0, 7, 1), 0, 1), pop = spring(t - t0 - 0.35, 18, 0.45);
        g.parts.forEach(([el, L], k) => { const pk = clamp(p * g.parts.length - k * 0.6, 0, 1); el.style.strokeDashoffset = (L * (1 - pk)).toFixed(2); });
        g.svg.style.transform = `scale(${0.9 + 0.1 * clamp(pop, 0, 1.3)})`;
        g.f.classList.toggle('lit', p > 0.98 && t > 3.6 + i * 0.04);
      });
    }
  };
}
