// The neon edge: a conic (colour-wheel) gradient painted around a shape, masked to a thin ring, plus a blurred copy.
// Its angle and glow strength are CSS variables that t sets, so the "AI is thinking" glow can be rendered to video.
import { spring, clamp } from '../../../kit/src/core.js';
export function mount(stage) {
  stage.classList.add('fxn');
  stage.innerHTML = `<div class="fxn-stage"><div class="fxn-box"><span class="fxn-ph">על מה הסרטון?</span><span class="fxn-txt"></span><i class="fxn-caret"></i><b class="fxn-go">→</b></div></div>
  <div class="ctrl-row"><label class="chk"><input type="checkbox" class="fxn-halo" checked> הילה מטושטשת</label><label class="chk"><input type="checkbox" class="fxn-beat" checked> פועם על הביט</label></div>`;
  const box = stage.querySelector('.fxn-box'), txt = stage.querySelector('.fxn-txt'), ph = stage.querySelector('.fxn-ph'), caret = stage.querySelector('.fxn-caret');
  const halo = stage.querySelector('.fxn-halo'), beat = stage.querySelector('.fxn-beat');
  halo.addEventListener('change', () => stage.classList.toggle('nohalo', !halo.checked));
  const Q = 'השקה לאפליקציית כושר';
  return {
    dur: 6,
    render(t) {
      const ang = (t * 1.5) % (Math.PI * 2);                                     // 1.5 rad/s, like the brand spec
      const b = Math.floor(t / 0.5), kick = beat.checked ? 1 - spring(t - b * 0.5, 22, 0.6) : 0; // a pulse on every beat (120 BPM)
      box.style.setProperty('--ang', ang + 'rad');
      box.style.setProperty('--pow', (0.75 + 0.5 * clamp(kick, 0, 1)).toFixed(3));
      const n = Math.max(0, Math.min(Array.from(Q).length, Math.floor((t - 0.8) / 0.11) + 1));
      txt.textContent = Array.from(Q).slice(0, n).join(''); ph.style.display = n > 0 ? 'none' : '';
      caret.style.opacity = Math.floor(t * 2.2) % 2 ? 0 : 1;
    }
  };
}
