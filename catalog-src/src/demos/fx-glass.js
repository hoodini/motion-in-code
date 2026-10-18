// "Liquid glass" in CSS: a card that blurs and brightens whatever moves behind it (backdrop-filter).
import { EN, T, DIR } from '../ui/i18n.js';
import { spring } from '../../../kit/src/core.js';
export function mount(stage) {
  stage.classList.add('fxg');
  stage.innerHTML = `<div class="fxg-stage"><i class="fxg-b b1"></i><i class="fxg-b b2"></i><i class="fxg-b b3"></i><i class="fxg-b b4"></i>
    <div class="fxg-card"><b>268</b><span>${T('דקות השבוע', 'minutes this week')}</span><em>+12%</em></div></div>
    <div class="ctrl-row"><label>${T('טשטוש', 'Blur')} <input type="range" min="0" max="40" value="22" class="fxg-blur"><output>22px</output></label><label class="chk"><input type="checkbox" class="fxg-on" checked> ${T('זכוכית פעילה', 'Glass on')}</label></div>`;
  const st = stage.querySelector('.fxg-stage'), bs = [...stage.querySelectorAll('.fxg-b')], card = stage.querySelector('.fxg-card');
  const bl = stage.querySelector('.fxg-blur'), bo = stage.querySelector('output'), on = stage.querySelector('.fxg-on');
  const setBlur = () => { bo.textContent = bl.value + 'px'; st.style.setProperty('--blur', on.checked ? bl.value + 'px' : '0px'); st.classList.toggle('off', !on.checked); };
  bl.addEventListener('input', setBlur); on.addEventListener('change', setBlur); setBlur();
  return {
    dur: 10,
    render(t) {
      bs.forEach((b, i) => { const a = t * (0.5 + i * 0.13) + i * 1.7; b.style.transform = `translate(${Math.cos(a) * 34 + (i - 1.5) * 18}%, ${Math.sin(a * 1.2) * 30}%)`; });
      const s = spring(t - 0.3, 10, 0.6); card.style.transform = `translate(-50%,-50%) scale(${0.85 + 0.15 * s})`;
    }
  };
}
