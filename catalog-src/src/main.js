import { EN, T, DIR } from './ui/i18n.js';
import { makeTimebar, makeLoop } from './ui/timebar.js';

const loaders = {
  'hero-particles': () => import('./demos/d3-particles.js'),
  'basics-layers': () => import('./demos/basics-layers.js'),
  'basics-cost': () => import('./demos/basics-cost.js'),
  'basics-vector': () => import('./demos/basics-vector.js'),
  'basics-clock': () => import('./demos/basics-clock.js'),
  'chart-area': () => import('./demos/chart-area.js'),
  'chart-bars': () => import('./demos/chart-bars.js'),
  'kpi': () => import('./demos/kpi.js'),
  'ring': () => import('./demos/ring.js'),
  'ui-scene': () => import('./demos/ui-scene.js'),
  'icons-draw': () => import('./demos/icons-draw.js'),
  'logos': () => import('./demos/logos.js'),
  'type': () => import('./demos/type.js'),
  'd3-devices': () => import('./demos/d3-devices.js'),
  'd3-glass': () => import('./demos/d3-glass.js'),
  'd3-particles': () => import('./demos/d3-particles.js'),
  'd3-ocean': () => import('./demos/d3-ocean.js'),
  'd3-carousel': () => import('./demos/d3-carousel.js'),
  'd3-eq': () => import('./demos/d3-eq.js'),
  'fx-neon': () => import('./demos/fx-neon.js'),
  'fx-glass': () => import('./demos/fx-glass.js'),
  'fx-aurora': () => import('./demos/fx-aurora.js'),
  'transitions': () => import('./demos/transitions.js'),
  'gl-shader': () => import('./demos/gl-shader.js'),
  'gpu-particles': () => import('./demos/gpu-particles.js'),
  'map-route': () => import('./demos/map-route.js'),
  'photo-relight': () => import('./demos/photo-relight.js'),
  'd3-materials': () => import('./demos/d3-materials.js'),
  'd3-model': () => import('./demos/d3-model.js'),
  'prompt-builder': () => import('./demos/prompt-builder.js')
};
const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
const players = new Map();

async function boot(el) {
  const load = loaders[el.dataset.demo]; if (!load) return;
  el.classList.add('is-loading');
  try {
    const mod = await load();
    const stage = el.querySelector('.stage') || el;
    const ctl = await mod.mount(stage, el);
    el.classList.remove('is-loading'); el.classList.add('is-ready');
    if (!ctl) return;
    if (ctl.noTime) { if (ctl.resize) new ResizeObserver(() => ctl.resize()).observe(stage); return; }
    const p = el.hasAttribute('data-notb') ? makeLoop(ctl) : makeTimebar(el.querySelector('.tb-host') || el, ctl);
    players.set(el, p);
    if (ctl.resize) new ResizeObserver(() => { ctl.resize(); p.redraw(); }).observe(stage);
    // reduced motion: no autoplay, so show a representative still instead of the (often empty) first frame
    if (reduce) p.seek(ctl.poster ?? ctl.dur * 0.8);
    else if (el.dataset.visible === '1') p.play();
  } catch (e) {
    console.error('demo failed', el.dataset.demo, e);
    el.classList.remove('is-loading'); el.classList.add('is-failed');
  }
}

const near = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { near.unobserve(e.target); boot(e.target); } }), { rootMargin: '700px 0px' });
const seen = new IntersectionObserver(es => es.forEach(e => {
  e.target.dataset.visible = e.isIntersecting ? '1' : '0';
  const p = players.get(e.target); if (!p) return;
  if (e.isIntersecting && !reduce && !p.userPaused) p.play(); else if (!e.isIntersecting) p.pause();
}), { threshold: 0.15 });
document.querySelectorAll('[data-demo]').forEach(el => { near.observe(el); seen.observe(el); });
// a shared builder link (#pb=…): bring the builder into view so it boots and reads the hash
if (/^#pb=/.test(location.hash)) { const b = document.getElementById('e-builder'); if (b) setTimeout(() => b.scrollIntoView({ block: 'start' }), 200); }

/* ---------- page chrome: copy buttons, TOC, progress, back to top ---------- */
document.querySelectorAll('.prompt').forEach(box => {
  const b = box.querySelector('.cp'); if (!b) return;
  b.addEventListener('click', async () => {
    const txt = box.querySelector('pre').innerText;
    try { await navigator.clipboard.writeText(txt); b.textContent = T('הועתק ✓', 'Copied ✓'); } catch { b.textContent = T('סמנו והעתיקו', 'Select and copy'); }
    setTimeout(() => (b.textContent = T('העתק פרומפט', 'Copy prompt')), 1600);
  });
});
const toc = document.getElementById('toc'), tocBtn = document.getElementById('tocBtn');
if (toc && tocBtn) {
  document.querySelectorAll('[data-toc]').forEach(s => {
    const a = document.createElement('a'); a.href = '#' + s.id;
    a.innerHTML = `<span>${s.dataset.folio || ''}</span>${s.dataset.toc}`;
    a.addEventListener('click', () => { toc.classList.remove('open'); tocBtn.setAttribute('aria-expanded', 'false'); });
    toc.appendChild(a);
  });
  tocBtn.addEventListener('click', () => { const o = toc.classList.toggle('open'); tocBtn.setAttribute('aria-expanded', o); });
}
const prog = document.getElementById('prog'), top = document.getElementById('toTop');
const onScroll = () => {
  const h = document.documentElement, y = h.scrollTop, max = h.scrollHeight - h.clientHeight;
  if (prog) prog.style.width = (y / max * 100) + '%';
  if (top) top.classList.toggle('show', y > 900);
};
window.addEventListener('scroll', onScroll, { passive: true }); onScroll();
if (top) top.addEventListener('click', () => window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }));
