// A progress ring = a circle's outline drawn as ONE dash whose length grows. stroke-dasharray / stroke-dashoffset.
import { EN, T, DIR } from '../ui/i18n.js';
import { spring, clamp } from '../../../kit/src/core.js';
const R = 92, CIRC = 2 * Math.PI * R;
export function mount(stage) {
  stage.classList.add('ring');
  stage.innerHTML = `<div class="ring-wrap"><svg viewBox="0 0 240 240" class="ring-svg" aria-hidden="true">
      <defs><linearGradient id="rgF" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFC74E"/><stop offset=".5" stop-color="#FF8F3A"/><stop offset="1" stop-color="#F56B49"/></linearGradient></defs>
      <circle cx="120" cy="120" r="${R}" fill="none" stroke="rgba(18,22,63,.1)" stroke-width="22"/>
      <circle class="ring-guide" cx="120" cy="120" r="${R}" fill="none" stroke="#2C78D2" stroke-width="2" stroke-dasharray="6 8"/>
      <circle class="ring-arc" cx="120" cy="120" r="${R}" fill="none" stroke="url(#rgF)" stroke-width="22" stroke-linecap="round" transform="rotate(-90 120 120)" stroke-dasharray="${CIRC.toFixed(1)}" stroke-dashoffset="${CIRC.toFixed(1)}"/>
    </svg><div class="ring-mid"><b>0%</b><span>${T('מהיעד השבועי', 'of weekly goal')}</span></div></div>
    <pre class="ring-read" dir="ltr"></pre>
    <div class="ctrl-row"><label class="chk"><input type="checkbox" class="ring-show"> ${T('הראו את קו המתאר המלא', 'Show the full outline')}</label></div>`;
  const arc = stage.querySelector('.ring-arc'), mid = stage.querySelector('.ring-mid b'), read = stage.querySelector('.ring-read');
  stage.querySelector('.ring-show').addEventListener('change', e => stage.classList.toggle('guide', e.target.checked));
  return {
    dur: 4,
    render(t) {
      const p = 0.78 * clamp(spring(t - 0.4, 6, 0.85), 0, 1.02);
      const off = CIRC * (1 - p);
      arc.setAttribute('stroke-dashoffset', off.toFixed(1));
      mid.textContent = Math.round(p * 100) + '%';
      read.textContent = `circumference = 2π × ${R} = ${CIRC.toFixed(1)} px\nstroke-dasharray  = ${CIRC.toFixed(1)}\nstroke-dashoffset = ${CIRC.toFixed(1)} × (1 − ${p.toFixed(2)}) = ${off.toFixed(1)}`;
    }
  };
}
