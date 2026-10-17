// Count-up numbers. The trap: in most fonts the digit "1" is narrower than "8", so a counting number wiggles sideways.
import { spring, clamp } from '../../../kit/src/core.js';
const TILES = [['דקות אימון', 1248, ''], ['ימים ברצף', 30, ''], ['שיפור החודש', 38, '%+']];
export function mount(stage) {
  stage.classList.add('kpi');
  stage.innerHTML = `<div class="kpi-row">${TILES.map(([l], i) => `<div class="kpi-tile" style="--i:${i}"><b class="kpi-n">0</b><span>${l}</span></div>`).join('')}</div>
    <div class="ctrl-row"><label class="chk"><input type="checkbox" class="kpi-tab" checked> ספרות ברוחב קבוע (tabular-nums)</label></div>`;
  const ns = [...stage.querySelectorAll('.kpi-n')], tiles = [...stage.querySelectorAll('.kpi-tile')], tab = stage.querySelector('.kpi-tab');
  tab.addEventListener('change', () => stage.classList.toggle('prop', !tab.checked));
  return {
    dur: 4.5,
    render(t) {
      TILES.forEach(([, target, suf], i) => {
        const t0 = 0.3 + i * 0.35, pop = spring(t - t0, 16, 0.5), cnt = clamp(spring(t - t0 - 0.1, 5.5, 1), 0, 1);
        const v = Math.round(target * cnt);
        ns[i].textContent = (suf === '%+' ? '+' : '') + v.toLocaleString('en-US') + (suf === '%+' ? '%' : '');
        tiles[i].style.transform = `scale(${0.6 + 0.4 * clamp(pop, 0, 1.3)})`;
      });
    }
  };
}
