// Six PBR materials side by side: chrome, brushed metal, glass, glazed ceramic, velvet and marble.
// Same light, same shape; only a few numbers and textures change. The textures are generated in code (no files).
import { EN, T, DIR } from '../ui/i18n.js';
import { view3d, gradientTexture, contactShadow, THREE } from '../ui/three.js';
import { clamp, inv, io3, spring, lerp, rnd } from '../../../kit/src/core.js';

// value noise → height field → normal map, on a canvas. A normal map tells the light which way each pixel "faces",
// so a flat polygon can look scratched, woven or bumpy without any extra triangles.
function heightField(n, fn) { const h = new Float32Array(n * n); for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) h[y * n + x] = fn(x / n, y / n); return h; }
function normalMap(h, n, strength) {
  const c = document.createElement('canvas'); c.width = c.height = n; const x = c.getContext('2d'), d = x.createImageData(n, n);
  for (let y = 0; y < n; y++) for (let X = 0; X < n; X++) {
    const l = h[y * n + (X - 1 + n) % n], r = h[y * n + (X + 1) % n], u = h[((y - 1 + n) % n) * n + X], dn = h[((y + 1) % n) * n + X];
    let nx = (l - r) * strength, ny = (u - dn) * strength, nz = 1; const k = 1 / Math.hypot(nx, ny, nz); nx *= k; ny *= k; nz *= k;
    const i = (y * n + X) * 4; d.data[i] = (nx * 0.5 + 0.5) * 255; d.data[i + 1] = (ny * 0.5 + 0.5) * 255; d.data[i + 2] = (nz * 0.5 + 0.5) * 255; d.data[i + 3] = 255;
  }
  x.putImageData(d, 0, 0); const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
}
const vnoise = (x, y, f) => { const X = Math.floor(x * f), Y = Math.floor(y * f), fx = x * f - X, fy = y * f - Y, s = u => u * u * (3 - 2 * u), m = (a, b, u) => a + (b - a) * u, h = (i, j) => rnd(((i % f) + f) % f * 57 + (((j % f) + f) % f) * 131);
  return m(m(h(X, Y), h(X + 1, Y), s(fx)), m(h(X, Y + 1), h(X + 1, Y + 1), s(fx)), s(fy)); };
const fbm = (x, y) => vnoise(x, y, 8) * 0.5 + vnoise(x, y, 16) * 0.25 + vnoise(x, y, 32) * 0.125 + vnoise(x, y, 64) * 0.0625;

export function mount(stage) {
  const v = view3d(stage, { aspect: 16 / 9, exposure: 1.0, fov: 30 });
  v.scene.background = gradientTexture(['#DDF0FF', '#EEF3FB', '#FFFFFF']);
  const N = 256;
  const brushed = normalMap(heightField(N, (x, y) => vnoise(x * 0.02, y, 128) * 0.7 + vnoise(x, y, 256) * 0.3), N, 2.2);
  const weave = normalMap(heightField(N, (x, y) => Math.sin(x * Math.PI * 64) * Math.sin(y * Math.PI * 64) * 0.5 + fbm(x, y) * 0.5), N, 1.6);
  const marble = (() => { const c = document.createElement('canvas'); c.width = c.height = 512; const x = c.getContext('2d'), d = x.createImageData(512, 512);
    for (let y = 0; y < 512; y++) for (let X = 0; X < 512; X++) { const u = X / 512, w = y / 512, q = fbm(u, w), vein = Math.abs(Math.sin((u + q * 1.7) * 9 * Math.PI)); const k = Math.pow(vein, 0.18), i = (y * 512 + X) * 4;
      d.data[i] = lerp(18, 238, k); d.data[i + 1] = lerp(22, 242, k); d.data[i + 2] = lerp(63, 250, k); d.data[i + 3] = 255; }
    x.putImageData(d, 0, 0); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
  const MATS = [
    { he: 'כרום', en: 'Chrome', p: 'metalness 1 · roughness 0.05', m: new THREE.MeshPhysicalMaterial({ color: '#EEF2F8', metalness: 1, roughness: 0.05 }) },
    { he: 'מתכת מוברשת', en: 'Brushed metal', p: 'metalness 1 · roughness 0.35 · normalMap', m: new THREE.MeshPhysicalMaterial({ color: '#C7D2E4', metalness: 1, roughness: 0.35, normalMap: brushed, normalScale: new THREE.Vector2(0.6, 0.6) }) },
    { he: 'זכוכית', en: 'Glass', p: 'transmission 1 · ior 1.45 · thickness 0.8', m: new THREE.MeshPhysicalMaterial({ color: '#FFFFFF', metalness: 0, roughness: 0.04, transmission: 1, ior: 1.45, thickness: 0.8 }) },
    { he: 'קרמיקה מבריקה', en: 'Glazed ceramic', p: 'roughness 0.4 · clearcoat 1', m: new THREE.MeshPhysicalMaterial({ color: '#12163F', metalness: 0, roughness: 0.4, clearcoat: 1, clearcoatRoughness: 0.04 }) },
    { he: 'קטיפה', en: 'Velvet', p: 'roughness 0.9 · sheen 1 · normalMap', m: new THREE.MeshPhysicalMaterial({ color: '#D74270', metalness: 0, roughness: 0.9, sheen: 1, sheenColor: new THREE.Color('#FFC74E'), sheenRoughness: 0.35, normalMap: weave, normalScale: new THREE.Vector2(0.35, 0.35) }) },
    { he: 'שיש', en: 'Marble', p: 'map (texture) · roughness 0.18', m: new THREE.MeshPhysicalMaterial({ map: marble, metalness: 0, roughness: 0.18, clearcoat: 0.6 }) }
  ];
  const GAP = 1.25, X0 = -GAP * (MATS.length - 1) / 2, balls = [];
  MATS.forEach((d, i) => {
    const b = new THREE.Mesh(new THREE.SphereGeometry(0.5, 96, 64), d.m); b.position.set(X0 + i * GAP, 0.5, 0); v.scene.add(b); balls.push(b);
    const sh = contactShadow(1.5, 0.3); sh.position.set(b.position.x, 0.002, 0); v.scene.add(sh);
  });
  // something behind the glass to bend: stripes on a backdrop
  const sc = document.createElement('canvas'); sc.width = 512; sc.height = 64; const sx = sc.getContext('2d'); for (let i = 0; i < 16; i++) { sx.fillStyle = i % 2 ? '#FFFFFF' : '#AFCBEF'; sx.fillRect(i * 32, 0, 32, 64); }
  const st = new THREE.CanvasTexture(sc); st.colorSpace = THREE.SRGBColorSpace; st.wrapS = THREE.RepeatWrapping; st.repeat.set(3, 1);
  const back = new THREE.Mesh(new THREE.PlaneGeometry(14, 2.2), new THREE.MeshBasicMaterial({ map: st })); back.position.set(0, 1.1, -2.2); v.scene.add(back);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(30, 10), new THREE.MeshStandardMaterial({ color: '#EEF3FB', roughness: 0.9 })); floor.rotation.x = -Math.PI / 2; v.scene.add(floor);
  const key = new THREE.DirectionalLight('#FFFFFF', 1.4); key.position.set(3, 5, 4); v.scene.add(key);
  const label = document.createElement('div'); label.className = 'mat-lbl'; label.dir = DIR; v.wrap.appendChild(label);
  let shown = -1;
  const render = t => {
    const i = Math.min(MATS.length - 1, Math.floor(t / 2)), u = io3(clamp((t - i * 2) / 0.6));
    const from = X0 + Math.max(0, i - 1) * GAP, to = X0 + i * GAP, fx = i === 0 ? to : lerp(from, to, u);
    balls.forEach((b, j) => { const lift = j === i ? clamp(spring(t - j * 2, 11, 0.6), 0, 1.15) : 0; b.position.y = 0.5 + 0.22 * lift; b.rotation.y = t * 0.35 + j; });
    v.camera.position.set(fx + 0.0 + v.user.yaw * 2, 1.25 + v.user.pitch * 2, 4.1); v.camera.lookAt(fx, 0.62, 0);
    if (i !== shown) { shown = i; const d = MATS[i]; label.innerHTML = `<b>${EN ? d.en : d.he}</b><code dir="ltr">${d.p}</code>`; }
    v.render();
  };
  let last = 0; v.setOnDrag(() => render(last));
  return { dur: 12, render: t => { last = t; render(t); }, resize: v.size, poster: 4.6 };
}
