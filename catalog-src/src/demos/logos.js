// Official brand marks from Simple Icons (CC0 SVG data; the trademarks belong to their owners).
import { EN, T, DIR } from '../ui/i18n.js';
import { siClaude, siAnthropic, siReact, siThreedotjs, siTailwindcss, siShadcnui, siRadixui, siLucide, siFfmpeg, siNodedotjs, siGithub, siD3, siGreensock, siBlender, siFigma, siVite } from 'simple-icons';
import { spring, clamp } from '../../../kit/src/core.js';
const LOGOS = [siClaude, siAnthropic, siReact, siThreedotjs, siTailwindcss, siShadcnui, siRadixui, siLucide, siFfmpeg, siNodedotjs, siVite, siGithub, siD3, siGreensock, siBlender, siFigma];
// a few brand colours are near-black; on our light tiles we keep them, on the navy "night" mode we flip them to white
const dark = hex => { const n = parseInt(hex, 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255; return 0.2126 * r + 0.7152 * g + 0.0722 * b < 60; };
export function mount(stage) {
  stage.classList.add('logos');
  stage.innerHTML = `<div class="logo-grid">${LOGOS.map(l => `<figure title="${l.title}"><svg viewBox="0 0 24 24" role="img" aria-label="${l.title}"><path d="${l.path}"/></svg><figcaption dir="ltr">${l.title}</figcaption></figure>`).join('')}</div>
  <div class="ctrl-row"><label class="chk"><input type="checkbox" class="lg-brand" checked> ${T('צבעי המותג הרשמיים', 'Official brand colors')}</label><label class="chk"><input type="checkbox" class="lg-night"> ${T('רקע כהה', 'Dark background')}</label></div>`;
  const figs = [...stage.querySelectorAll('figure')], brand = stage.querySelector('.lg-brand'), night = stage.querySelector('.lg-night');
  const paint = () => figs.forEach((f, i) => { const h = LOGOS[i].hex; f.querySelector('path').setAttribute('fill', brand.checked ? (night.checked && dark(h) ? '#FFFFFF' : '#' + h) : (night.checked ? '#FFFFFF' : '#000000')); });
  brand.addEventListener('change', paint); night.addEventListener('change', () => { stage.classList.toggle('night', night.checked); paint(); }); paint();
  return {
    dur: 4.5,
    render(t) {
      figs.forEach((f, i) => {
        const row = Math.floor(i / 4), col = i % 4, t0 = 0.3 + (row + (3 - col)) * 0.16, s = spring(t - t0, 15, 0.5);
        f.style.transform = `translateY(${(1 - clamp(s, 0, 1)) * 26}px) scale(${clamp(s, 0, 1.25)})`;
      });
    }
  };
}
