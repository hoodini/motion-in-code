// A fragment shader with no library at all: raw WebGL2, one triangle that covers the canvas,
// and a tiny GLSL program that the GPU runs once for every pixel, every frame. color = f(pixel, t).
import { EN, T, DIR } from '../ui/i18n.js';

const PRESETS = [
  { id: 'sunset', he: 'שקיעה', en: 'Sunset',
    code: `vec3 sunset(vec2 p, float t) {
  float sunY = 0.55 - 0.5 * smoothstep(0.0, 1.0, t / 8.0);   // the sun goes down with t
  vec3 top = mix(vec3(0.37,0.66,0.95), vec3(0.18,0.12,0.38), 1.0 - smoothstep(0.1, 0.55, sunY));
  vec3 low = mix(vec3(0.86,0.94,1.0), vec3(1.0,0.56,0.23), 1.0 - smoothstep(0.1, 0.55, sunY));
  vec3 sky = mix(low, top, smoothstep(0.0, 0.9, p.y));
  float d = length(p - vec2(0.5 * u_aspect, sunY));
  sky += vec3(1.0,0.78,0.31) * (1.0 - smoothstep(0.065, 0.07, d) + 0.35 * exp(-d * 6.0));
  return sky;
}` },
  { id: 'sea', he: 'ים', en: 'Sea',
    code: `vec3 sea(vec2 p, float t) {
  float h = 0.45;                                          // the horizon line
  vec3 sky = mix(vec3(1.0,0.72,0.45), vec3(0.37,0.66,0.95), smoothstep(h, 1.0, p.y));
  if (p.y > h) return sky;
  float depth = h - p.y;                                   // 0 at the horizon, bigger closer to us
  float z = 1.0 / (depth + 0.02);                          // perspective: rows near the horizon are far away
  float x = (p.x - 0.5 * u_aspect) * z;                    // sideways position on the water surface
  float w = 0.5 * sin(x * 1.3 + z * 0.9 - t * 1.6) + 0.5 * sin(x * 0.7 - z * 1.7 + t * 1.1);
  w *= smoothstep(0.0, 0.12, depth);                       // far waves melt into one colour instead of flickering
  float glitter = smoothstep(0.55, 1.0, w) * exp(-pow((p.x - 0.5 * u_aspect) * 3.0, 2.0));
  vec3 water = mix(vec3(0.55,0.62,0.78), vec3(0.07,0.09,0.25), smoothstep(0.0, 0.45, depth)) + 0.05 * w;
  return mix(water, sky, exp(-depth * 40.0) * 0.6) + vec3(1.0,0.85,0.55) * glitter;
}` },
  { id: 'marble', he: 'שיש', en: 'Marble',
    code: `vec3 marble(vec2 p, float t) {
  vec2 q = vec2(fbm(p * 3.0 + t * 0.05), fbm(p * 3.0 + 5.2));   // domain warping: noise moves noise
  float v = fbm(p * 3.0 + 4.0 * q);
  float vein = 1.0 - smoothstep(0.0, 0.02, abs(sin((p.x + v * 1.6) * 9.0)) * 0.08);
  vec3 stone = mix(vec3(0.93,0.95,0.98), vec3(0.69,0.80,0.94), v);
  return mix(stone, vec3(0.07,0.09,0.25), vein * 0.8);
}` },
  { id: 'gradient', he: 'גרדיאנט נוזלי', en: 'Liquid gradient',
    code: `vec3 gradient(vec2 p, float t) {
  vec2 q = p + 0.25 * vec2(fbm(p * 1.5 + t * 0.12), fbm(p * 1.5 - t * 0.1 + 3.0));
  vec3 a = vec3(1.0,0.78,0.31), b = vec3(1.0,0.56,0.23), c = vec3(0.37,0.66,0.95), d = vec3(0.07,0.09,0.25);
  vec3 col = mix(mix(a, b, smoothstep(0.1, 0.7, q.x / u_aspect)), mix(c, d, smoothstep(0.2, 0.9, q.x / u_aspect)), smoothstep(0.25, 0.85, q.y));
  return col + (hash(p * 900.0 + t) - 0.5) * 0.035;          // grain, so it never bands
}` },
  { id: 'paper', he: 'נייר וגרעין', en: 'Paper and grain',
    code: `vec3 paper(vec2 p, float t) {
  float fibers = fbm(vec2(p.x * 60.0, p.y * 6.0)) * 0.5 + fbm(p * 140.0) * 0.5;
  float grain = hash(p * 1200.0 + floor(t * 24.0));        // new grain 24 times a second, like film
  vec3 col = vec3(0.965,0.955,0.93) - fibers * 0.07 - (grain - 0.5) * 0.06;
  float ink = 1.0 - smoothstep(0.0, 0.012, abs(p.y - 0.5 - 0.03 * sin(p.x * 6.0 + t)) - 0.004);
  return mix(col, vec3(0.07,0.09,0.25), ink * smoothstep(0.0, 1.0, t / 2.0 - p.x / u_aspect));
}` }
];

const HEADER = `#version 300 es
precision highp float;
uniform vec2 u_res; uniform float u_t; uniform float u_aspect; uniform int u_preset;
out vec4 o;
float hash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float noise(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y); }
float fbm(vec2 p) { float v = 0.0, a = 0.5; for (int k = 0; k < 5; k++) { v += a * noise(p); p *= 2.02; a *= 0.5; } return v; }
`;
const FRAG = HEADER + PRESETS.map(p => p.code).join('\n') + `
void main() {
  vec2 p = gl_FragCoord.xy / u_res.y;            // y from 0 (bottom) to 1 (top), x from 0 to the aspect ratio
  vec3 c = u_preset == 0 ? sunset(p, u_t) : u_preset == 1 ? sea(p, u_t) : u_preset == 2 ? marble(p, u_t) : u_preset == 3 ? gradient(p, u_t) : paper(p, u_t);
  o = vec4(c, 1.0);
}`;
const VERT = `#version 300 es
in vec2 a; void main() { gl_Position = vec4(a, 0.0, 1.0); }`;

export function mount(stage) {
  stage.classList.add('gls');
  const c = document.createElement('canvas'); c.width = 960; c.height = 540; c.className = 'gls-c'; stage.appendChild(c);
  const row = document.createElement('div'); row.className = 'seg gls-seg'; row.dir = DIR;
  row.innerHTML = PRESETS.map((p, i) => `<button type="button" data-i="${i}"${i ? '' : ' class="on"'}>${EN ? p.en : p.he}</button>`).join('');
  stage.appendChild(row);
  const det = document.createElement('details'); det.className = 'gls-code';
  det.innerHTML = `<summary>${T('הקוד שמצייר כל פיקסל (GLSL)', 'The code that paints every pixel (GLSL)')}</summary><pre dir="ltr"></pre>`;
  stage.appendChild(det);
  let preset = 0;
  const showCode = () => { det.querySelector('pre').textContent = PRESETS[preset].code; };
  showCode();
  const gl = c.getContext('webgl2', { antialias: false, preserveDrawingBuffer: true });
  if (!gl) { stage.insertAdjacentHTML('afterbegin', `<p class="gls-no">${T('הדפדפן הזה לא תומך ב-WebGL2.', 'This browser does not support WebGL2.')}</p>`); return null; }
  const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
  const prog = gl.createProgram(); gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG)); gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
  gl.useProgram(prog);
  // one triangle bigger than the screen: the GPU clips it, and every pixel of the canvas is covered exactly once
  const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'a'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const U = n => gl.getUniformLocation(prog, n), uRes = U('u_res'), uT = U('u_t'), uA = U('u_aspect'), uP = U('u_preset');
  let last = 0;
  const fit = () => { const k = Math.min(2, window.devicePixelRatio || 1), w = Math.round((c.clientWidth || 960) * k); c.width = w; c.height = Math.round(w * 9 / 16); };
  const render = t => {
    last = t;
    gl.viewport(0, 0, c.width, c.height);
    gl.uniform2f(uRes, c.width, c.height); gl.uniform1f(uT, t); gl.uniform1f(uA, c.width / c.height); gl.uniform1i(uP, preset);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };
  row.addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; preset = +b.dataset.i; row.querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b)); showCode(); render(last); });
  fit();
  return { dur: 10, render, resize: () => { fit(); render(last); }, poster: 6 };
}
