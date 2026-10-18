// The preview player for a demo: it only supplies t. Every demo's render(t) is a pure function of t,
// exactly like a film's seek(t), so the same code could be captured frame by frame into a video.
import { EN, T, DIR } from './i18n.js';
export function makeTimebar(host, ctl) {
  const bar = document.createElement('div');
  bar.className = 'tb';
  bar.innerHTML = `<button class="tb-play" type="button" aria-label="${T('נגן או עצור', 'Play or pause')}">▶</button>
    <input class="tb-range" type="range" min="0" max="${ctl.dur}" step="0.01" value="0" aria-label="${T('זמן בהדגמה', 'Time in the demo')}">
    <output class="tb-t">t = 0.00s</output>`;
  host.appendChild(bar);
  const btn = bar.querySelector('.tb-play'), range = bar.querySelector('.tb-range'), out = bar.querySelector('.tb-t');
  let t = 0, playing = false, last = 0, raf = 0, userPaused = false;
  const show = () => { range.value = t; out.textContent = `t = ${t.toFixed(2)}s`; ctl.render(t); };
  const tick = now => {
    if (!playing) return;
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    t += dt; if (t > ctl.dur) t = ctl.loop === false ? ctl.dur : 0;
    show(); raf = requestAnimationFrame(tick);
  };
  const play = () => { if (playing) return; playing = true; btn.textContent = '❚❚'; last = performance.now(); raf = requestAnimationFrame(tick); };
  const pause = () => { playing = false; btn.textContent = '▶'; cancelAnimationFrame(raf); };
  btn.addEventListener('click', () => { if (playing) { pause(); userPaused = true; } else { userPaused = false; play(); } });
  range.addEventListener('input', () => { pause(); userPaused = true; t = +range.value; show(); });
  show();
  const seek = v => { t = Math.max(0, Math.min(ctl.dur, v)); show(); };
  return { play, pause, seek, get userPaused() { return userPaused; }, get t() { return t; }, redraw: show };
}

// A free-running clock for demos without a timebar (the hero): still feeds t, still pure.
export function makeLoop(ctl) {
  let t = 0, playing = false, last = 0, raf = 0;
  const tick = now => { if (!playing) return; t += Math.min(0.05, (now - last) / 1000); last = now; if (t > ctl.dur) t -= ctl.dur; ctl.render(t); raf = requestAnimationFrame(tick); };
  return {
    play() { if (playing) return; playing = true; last = performance.now(); raf = requestAnimationFrame(tick); },
    pause() { playing = false; cancelAnimationFrame(raf); },
    seek(v) { t = v; ctl.render(t); }, userPaused: false, get t() { return t; }, redraw() { ctl.render(t); }
  };
}
