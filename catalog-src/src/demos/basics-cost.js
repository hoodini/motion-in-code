// The same N dots drawn three ways. We really draw them and time it with performance.now().
import { EN, T, DIR } from '../ui/i18n.js';
import * as THREE from 'three';
import { el } from '../ui/canvas.js';
const STEPS = [100, 300, 1000, 3000, 10000, 30000];
function dots(n, seed = 7) { const a = new Float32Array(n * 2); let s = seed; for (let i = 0; i < n * 2; i++) { s = (s * 16807) % 2147483647; a[i] = (s % 10000) / 10000; } return a; }
export function mount(stage) {
  stage.classList.add('cost');
  stage.innerHTML = `
    <div class="cost-grid">
      <figure><div class="cost-view cost-dom"></div><figcaption><b>DOM</b><span class="cost-ms" data-k="dom">—</span></figcaption></figure>
      <figure><div class="cost-view"><canvas class="cost-cv" width="240" height="240"></canvas></div><figcaption><b>Canvas 2D</b><span class="cost-ms" data-k="cv">—</span></figcaption></figure>
      <figure><div class="cost-view cost-gl"></div><figcaption><b>WebGL</b><span class="cost-ms" data-k="gl">—</span></figcaption></figure>
    </div>
    <div class="ctrl-row"><label>${T('כמה נקודות', 'How many dots')} <input type="range" min="0" max="${STEPS.length - 1}" step="1" value="2" class="cost-n"><output>1,000</output></label>
    <button type="button" class="btn m cost-run">${T('מדוד עכשיו', 'Measure now')}</button></div>
    <p class="cost-note">${T('המספרים נמדדים עכשיו, במכשיר שלך. ב-60fps יש לכל פריים 16.7 מילישניות.', 'These numbers are measured right now, on this device. At 60fps each frame gets 16.7 milliseconds.')}</p>`;
  const domBox = stage.querySelector('.cost-dom'), cv = stage.querySelector('.cost-cv'), cx = cv.getContext('2d'), glBox = stage.querySelector('.cost-gl');
  const out = k => stage.querySelector(`.cost-ms[data-k="${k}"]`), nIn = stage.querySelector('.cost-n'), nOut = stage.querySelector('output');
  const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true, preserveDrawingBuffer: false });
  renderer.setPixelRatio(1); renderer.setSize(240, 240, false); glBox.appendChild(renderer.domElement);
  const scene = new THREE.Scene(), cam = new THREE.OrthographicCamera(0, 1, 1, 0, -1, 1);
  const mat = new THREE.PointsMaterial({ color: 0xFF8F3A, size: 3, sizeAttenuation: false });
  let pts = null;
  const run = () => {
    const n = STEPS[+nIn.value]; nOut.textContent = n.toLocaleString('en-US');
    const d = dots(n);
    // DOM: one element per dot. The browser must create, style and lay out every one.
    let t0 = performance.now();
    const frag = document.createDocumentFragment();
    for (let i = 0; i < n; i++) { const s = document.createElement('i'); s.style.cssText = `left:${(d[i * 2] * 100).toFixed(2)}%;top:${(d[i * 2 + 1] * 100).toFixed(2)}%`; frag.appendChild(s); }
    domBox.replaceChildren(frag); void domBox.offsetHeight; domBox.getBoundingClientRect();
    const tDom = performance.now() - t0;
    // Canvas: one bitmap, n paint commands, nothing to remember afterwards.
    t0 = performance.now();
    cx.clearRect(0, 0, 240, 240); cx.fillStyle = '#FF8F3A';
    for (let i = 0; i < n; i++) { cx.fillRect(d[i * 2] * 240 - 1.5, d[i * 2 + 1] * 240 - 1.5, 3, 3); }
    cx.getImageData(0, 0, 1, 1);
    const tCv = performance.now() - t0;
    // WebGL: hand the GPU one list of n points, it draws them all in parallel.
    t0 = performance.now();
    if (pts) { scene.remove(pts); pts.geometry.dispose(); }
    const pos = new Float32Array(n * 3); for (let i = 0; i < n; i++) { pos[i * 3] = d[i * 2]; pos[i * 3 + 1] = 1 - d[i * 2 + 1]; }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    pts = new THREE.Points(g, mat); scene.add(pts); renderer.render(scene, cam); renderer.getContext().finish();
    const tGl = performance.now() - t0;
    [['dom', tDom], ['cv', tCv], ['gl', tGl]].forEach(([k, v]) => { const o = out(k); o.textContent = `${v < 10 ? v.toFixed(1) : Math.round(v)} ms`; o.classList.toggle('over', v > 16.7); });
  };
  stage.querySelector('.cost-run').addEventListener('click', run);
  nIn.addEventListener('change', run); nIn.addEventListener('input', () => (nOut.textContent = STEPS[+nIn.value].toLocaleString('en-US')));
  requestAnimationFrame(run);
  return { noTime: true };
}
