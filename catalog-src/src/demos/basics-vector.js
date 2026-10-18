// Vector (a recipe of shapes) vs raster (a grid of coloured squares). Zoom both and watch.
import { EN, T, DIR } from '../ui/i18n.js';
import { el } from '../ui/canvas.js';
const PATH = 'M12 1.5c1.2 3.2 4.6 5.4 4.6 10.1a4.6 4.6 0 0 1-9.2 0c0-2.3 1.1-3.6 2.3-4.6.1 2.3 1.1 3.4 2.3 3.4-1-3.4-.2-6.4 0-8.9z';
export function mount(stage) {
  stage.classList.add('vec');
  stage.innerHTML = `
    <div class="vec-grid">
      <figure><div class="vec-box"><svg class="vec-svg" viewBox="0 0 24 24" aria-hidden="true"><defs><linearGradient id="vf" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFC74E"/><stop offset=".5" stop-color="#FF8F3A"/><stop offset="1" stop-color="#F56B49"/></linearGradient></defs><path d="${PATH}" fill="url(#vf)" stroke="#12163F" stroke-width=".6"/></svg></div><figcaption><b>${T('SVG · וקטור', 'SVG · vector')}</b><span>${T('מתכון: "קו מכאן לשם, עקומה, מלא בכתום"', 'A recipe: "line from here to there, a curve, fill orange"')}</span></figcaption></figure>
      <figure><div class="vec-box"><canvas class="vec-png" width="320" height="320"></canvas></div><figcaption><b>${T('PNG · פיקסלים', 'PNG · pixels')}</b><span>${T('טבלה של 24×24 ריבועים צבעוניים', 'A grid of 24×24 colored squares')}</span></figcaption></figure>
    </div>
    <div class="ctrl-row"><label>${T('זום', 'Zoom')} <input type="range" min="1" max="16" step="0.1" value="1" class="vec-z"><output>×1.0</output></label>
    <label class="chk"><input type="checkbox" class="vec-smooth"> ${T('החלקה (טשטוש)', 'Smoothing (blur)')}</label></div>`;
  const src = document.createElement('canvas'); src.width = src.height = 24;
  const sx = src.getContext('2d'); const p = new Path2D(PATH);
  const g = sx.createLinearGradient(0, 0, 24, 24); g.addColorStop(0, '#FFC74E'); g.addColorStop(0.5, '#FF8F3A'); g.addColorStop(1, '#F56B49');
  sx.fillStyle = g; sx.fill(p); sx.strokeStyle = '#12163F'; sx.lineWidth = 0.6; sx.stroke(p);
  const cv = stage.querySelector('.vec-png'), x = cv.getContext('2d'), svg = stage.querySelector('.vec-svg');
  const zr = stage.querySelector('.vec-z'), zo = stage.querySelector('output'), sm = stage.querySelector('.vec-smooth');
  const draw = () => {
    const z = +zr.value; zo.textContent = '×' + z.toFixed(1);
    // both views show the same window: the centre of the icon, magnified z times
    const view = 24 / z, ox = 12 - view / 2, oy = 11 - view / 2;
    svg.setAttribute('viewBox', `${ox} ${oy} ${view} ${view}`);
    x.imageSmoothingEnabled = sm.checked; x.clearRect(0, 0, 320, 320);
    x.drawImage(src, ox, oy, view, view, 0, 0, 320, 320);
  };
  zr.addEventListener('input', draw); sm.addEventListener('change', draw); draw();
  return { noTime: true };
}
