// HTML = what is there · CSS = how it looks · JS = what it does over time. Toggle each layer.
import { EN, T, DIR } from '../ui/i18n.js';
import { spring, sk, clamp } from '../../../kit/src/core.js';
import { el } from '../ui/canvas.js';
const CODE = {
  html: `<button id="go">${T('התחל אימון', 'Start workout')}</button>`,
  css: `#go {
  background: #FF8F3A;      /* ${T('כתום פניקס', 'phoenix orange')} */
  color: #12163F;           /* ${T('נייבי', 'navy')} */
  border: 0;
  border-radius: 999px;     /* ${T('גלולה', 'a pill')} */
  padding: 16px 34px;
  font: ${EN ? '400 30px Anton' : '700 30px Karantina'};
}`,
  js: `window.seek = (t) => {
  const s = spring(t - 0.6);            // ${T('קפיץ שמתחיל ב-0.6 שנ׳', 'a spring that starts at 0.6 s')}
  go.style.transform = \`scale(\${0.4 + 0.6 * s})\`;
  go.style.rotate = \`\${(1 - s) * -8}deg\`;
};`
};
export function mount(stage) {
  stage.classList.add('layers');
  const toggles = el('div', { class: 'seg-row', role: 'group', 'aria-label': T('שכבות', 'Layers') }, `
    <label class="chk"><input type="checkbox" data-l="html" checked disabled> HTML</label>
    <label class="chk"><input type="checkbox" data-l="css" checked> CSS</label>
    <label class="chk"><input type="checkbox" data-l="js" checked> JS</label>`);
  const view = el('div', { class: 'layers-view' }, `<button type="button" class="layers-btn" tabindex="-1">${T('התחל אימון', 'Start workout')}</button>`);
  const code = el('pre', { class: 'layers-code', dir: 'ltr' });
  stage.append(toggles, view, code);
  const btn = view.querySelector('button');
  const on = { html: true, css: true, js: true };
  const paintCode = () => { code.textContent = ['html', 'css', 'js'].filter(k => on[k]).map(k => `/* ${k.toUpperCase()} */\n${CODE[k]}`).join('\n\n'); };
  let lastT = 0;
  const render = t => {
    lastT = t;
    btn.classList.toggle('styled', on.css);
    if (!on.js) { btn.style.transform = ''; btn.style.rotate = ''; return; }
    const s = spring(t - 0.6, 11, 0.55);
    const press = sk(t, [[0, 1], [2.4, 0.9], [2.55, 1]], 34, 0.6);
    btn.style.transform = `scale(${(0.4 + 0.6 * clamp(s, 0, 1.4)) * press})`;
    btn.style.rotate = `${(1 - s) * -8}deg`;
  };
  toggles.addEventListener('change', e => { on[e.target.dataset.l] = e.target.checked; paintCode(); render(lastT); });
  paintCode();
  return { dur: 4, render };
}
