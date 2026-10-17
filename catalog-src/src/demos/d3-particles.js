// 20,000 points that flow from shape to shape. Every point has a start and a target; t decides the mix.
import { view3d, orbit, THREE } from '../ui/three.js';
import { clamp, io3 } from '../../../kit/src/core.js';
import { fontsReady } from '../ui/canvas.js';
const N = 20000, HOLD = 1.6, MORPH = 1.5, STEP = HOLD + MORPH;
function rng(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }
function sphere(r = 1.6) { const a = new Float32Array(N * 3), g = Math.PI * (3 - Math.sqrt(5)); for (let i = 0; i < N; i++) { const y = 1 - (i / (N - 1)) * 2, rr = Math.sqrt(1 - y * y), th = g * i; a.set([Math.cos(th) * rr * r, y * r, Math.sin(th) * rr * r], i * 3); } return a; }
function knot() { const geo = new THREE.TorusKnotGeometry(1.05, 0.34, 600, 40, 2, 3), p = geo.attributes.position, a = new Float32Array(N * 3), R = rng(3); for (let i = 0; i < N; i++) { const k = Math.floor(R() * p.count); a.set([p.getX(k), p.getY(k), p.getZ(k)], i * 3); } geo.dispose(); return a; }
function galaxy() { const a = new Float32Array(N * 3), R = rng(9); for (let i = 0; i < N; i++) { const arm = i % 3, r = Math.pow(R(), 0.6) * 2.3, th = r * 2.6 + arm * (Math.PI * 2 / 3) + (R() - 0.5) * 0.5 / (r + 0.3); a.set([Math.cos(th) * r, (R() - 0.5) * 0.18 * (2.4 - r), Math.sin(th) * r], i * 3); } return a; }
function text(word = 'AI') {
  const c = document.createElement('canvas'); c.width = 640; c.height = 320; const x = c.getContext('2d');
  x.fillStyle = '#fff'; x.font = '400 300px Anton'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(word, 320, 172);
  const d = x.getImageData(0, 0, 640, 320).data, pts = []; for (let y = 0; y < 320; y += 2) for (let xx = 0; xx < 640; xx += 2) if (d[(y * 640 + xx) * 4 + 3] > 128) pts.push(xx, y);
  const a = new Float32Array(N * 3), R = rng(5); for (let i = 0; i < N; i++) { const k = Math.floor(R() * (pts.length / 2)) * 2; a.set([(pts[k] - 320) / 95, -(pts[k + 1] - 160) / 95, (R() - 0.5) * 0.3], i * 3); } return a;
}
export async function mount(stage, card) {
  await fontsReady();
  const hero = card && card.dataset.variant === 'hero';
  const v = view3d(stage, { aspect: hero ? 1.05 : 16 / 9, alpha: hero, env: false, exposure: 1, drag: true });
  if (!hero) v.scene.background = new THREE.Color('#0B0E2A');
  const SH = [sphere(), knot(), text('AI'), galaxy()];
  const pos = new Float32Array(N * 3), col = new Float32Array(N * 3), del = new Float32Array(N), R = rng(1);
  const pal = (hero ? ['#12163F', '#2C78D2', '#FF8F3A', '#FFC74E', '#F56B49'] : ['#FFC74E', '#FF8F3A', '#F56B49', '#5DE4E9', '#FFFFFF']).map(h => new THREE.Color(h));
  for (let i = 0; i < N; i++) { const c = pal[Math.floor(R() * pal.length)]; col.set([c.r, c.g, c.b], i * 3); del[i] = R() * 0.45; }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, vertexColors: true, blending: hero ? THREE.NormalBlending : THREE.AdditiveBlending,
    uniforms: { size: { value: (hero ? 5.2 : 4.2) * Math.min(1.5, window.devicePixelRatio || 1) } },
    vertexShader: `uniform float size; varying vec3 vC; void main(){ vC = color; vec4 mv = modelViewMatrix * vec4(position,1.0); gl_PointSize = size * (6.0 / -mv.z); gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `varying vec3 vC; void main(){ vec2 d = gl_PointCoord - 0.5; float r = length(d); if (r > 0.5) discard; gl_FragColor = vec4(vC, smoothstep(0.5, 0.15, r)); }`
  });
  const pts = new THREE.Points(geo, mat); v.scene.add(pts);
  const target = new THREE.Vector3(0, 0, 0), DUR = STEP * SH.length;
  const render = t => {
    const tt = ((t % DUR) + DUR) % DUR, k = Math.floor(tt / STEP), local = tt - k * STEP, A = SH[k], B = SH[(k + 1) % SH.length];
    const u = clamp((local - HOLD) / MORPH, 0, 1);
    for (let i = 0; i < N; i++) {
      const e = io3(clamp((u - del[i]) / (1 - 0.45), 0, 1)), j = i * 3;
      pos[j] = A[j] + (B[j] - A[j]) * e; pos[j + 1] = A[j + 1] + (B[j + 1] - A[j + 1]) * e; pos[j + 2] = A[j + 2] + (B[j + 2] - A[j + 2]) * e;
    }
    geo.attributes.position.needsUpdate = true;
    pts.rotation.y = (tt - (2 * STEP + HOLD / 2)) * 0.22; pts.rotation.x = 0.25 * Math.sin(tt * 0.3);  // zero turn mid-way through the word's hold, so the word faces the camera
    orbit(v.camera, target, hero ? 6.4 : 6.2, v.user.yaw, 0.1 + v.user.pitch);
    v.render();
  };
  let last = 0; v.setOnDrag(() => render(last));
  return { dur: DUR, poster: 2 * STEP + 0.8, render: t => { last = t; render(t); }, resize: v.size };  // poster: the still shown under reduced motion (the word)
}
