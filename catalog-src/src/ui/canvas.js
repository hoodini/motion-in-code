// Small shared helpers for 2D demos.
export const C = { navy: '#12163F', navy2: '#1E2357', navy3: '#0B0E2A', cloud: '#EEF3FB', denim: '#AFCBEF', gold: '#FFC74E', orange: '#FF8F3A', coral: '#F56B49',
  sky1: '#F4FBFF', sky2: '#DDF0FF', sky3: '#BDE1FF', sky4: '#93CBFF', sky5: '#5EA9F2', sky6: '#2C78D2', white: '#FFFFFF', raspberry: '#D74270', azure: '#5EA1C1', muted: '#4A5280', line: 'rgba(18,22,63,.14)' };
export const F = { he: s => `700 ${s}px Karantina, sans-serif`, heR: s => `400 ${s}px Karantina, sans-serif`, text: s => `500 ${s}px Assistant, sans-serif`, textB: s => `700 ${s}px Assistant, sans-serif`, en: s => `400 ${s}px Anton, sans-serif`, mono: s => `500 ${s}px "JetBrains Mono", monospace`, monoB: s => `700 ${s}px "JetBrains Mono", monospace` };
export async function fontsReady() {
  if (!document.fonts) return;
  await Promise.all(['700 40px Karantina', '400 40px Karantina', '500 20px Assistant', '700 20px Assistant', '400 40px Anton', '500 16px "JetBrains Mono"'].map(f => document.fonts.load(f, 'אבג abc 123')));
}
/** a canvas with a fixed logical size (W×H) that stays sharp at any CSS width / DPR */
export function canvas2d(stage, W, H, cls = '') {
  const c = document.createElement('canvas'); c.width = W; c.height = H; if (cls) c.className = cls; stage.appendChild(c);
  const x = c.getContext('2d');
  const fit = () => { const k = Math.max(1, Math.min(2.5, ((c.clientWidth || W) * Math.min(2, window.devicePixelRatio || 1)) / W)); c.width = Math.round(W * k); c.height = Math.round(H * k); x.setTransform(k, 0, 0, k, 0, 0); };
  fit(); return { c, x, W, H, fit };
}
export function fire(x, x0, y0, x1, y1) { const g = x.createLinearGradient(x0, y0, x1, y1); g.addColorStop(0, C.gold); g.addColorStop(0.5, C.orange); g.addColorStop(1, C.coral); return g; }
export function sky(x, W, H) { const g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, C.sky5); g.addColorStop(0.45, C.sky4); g.addColorStop(1, C.sky2); return g; }
export function el(tag, attrs = {}, html = '') { const e = document.createElement(tag); for (const k in attrs) e.setAttribute(k, attrs[k]); if (html) e.innerHTML = html; return e; }
