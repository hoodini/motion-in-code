/* =====================================================================
   YUV.AI MOTION KIT — 3D world (three.js), deterministic.
   A procedural phone whose screen is a live 2D canvas (the same seek(t)
   UI the 2D layer draws), a physically-based sky + ocean at sunset.
   Nothing here owns time: the film sets every transform and uniform
   from t, then calls render(). No clocks, no animation mixers.
   ===================================================================== */
import * as THREE from 'three';
import { Water } from 'three/addons/objects/Water.js';
import { Sky } from 'three/addons/objects/Sky.js';

/** rounded rectangle with true circular corners (matches canvas arcTo corners) */
export function rrShape(w, h, r) {
  const s = new THREE.Shape(), x0 = -w / 2, y0 = -h / 2;
  s.moveTo(x0 + r, y0); s.lineTo(x0 + w - r, y0); s.absarc(x0 + w - r, y0 + r, r, -Math.PI / 2, 0, false);
  s.lineTo(x0 + w, y0 + h - r); s.absarc(x0 + w - r, y0 + h - r, r, 0, Math.PI / 2, false);
  s.lineTo(x0 + r, y0 + h); s.absarc(x0 + r, y0 + h - r, r, Math.PI / 2, Math.PI, false);
  s.lineTo(x0, y0 + r); s.absarc(x0 + r, y0 + r, r, Math.PI, 1.5 * Math.PI, false);
  return s;
}
function planarUV(geo, w, h) {
  const p = geo.attributes.position, uv = new Float32Array(p.count * 2);
  for (let i = 0; i < p.count; i++) { uv[i * 2] = (p.getX(i) + w / 2) / w; uv[i * 2 + 1] = (p.getY(i) + h / 2) / h; }
  geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); return geo;
}

/** tileable procedural normal map for the ocean (fbm value noise → normals). No image files. */
export function waterNormals(N = 512, strength = 7) {
  const hash = (i, j, p) => { i = ((i % p) + p) % p; j = ((j % p) + p) % p; const s = Math.sin(i * 127.1 + j * 311.7 + p * 74.7) * 43758.5453; return s - Math.floor(s); };
  const noise = (x, y, p) => { const i = Math.floor(x), j = Math.floor(y), fx = x - i, fy = y - j, u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
    const a = hash(i, j, p), b = hash(i + 1, j, p), c = hash(i, j + 1, p), d = hash(i + 1, j + 1, p); return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v; };
  const H = new Float32Array(N * N);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { let h = 0, amp = 1, f = 6; for (let o = 0; o < 5; o++) { h += amp * noise(x / N * f, y / N * f, f); amp *= 0.5; f *= 2; } H[y * N + x] = h; }
  const c = document.createElement('canvas'); c.width = c.height = N; const g = c.getContext('2d'), img = g.createImageData(N, N);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const dx = H[y * N + (x + 1) % N] - H[y * N + (x - 1 + N) % N], dy = H[((y + 1) % N) * N + x] - H[((y - 1 + N) % N) * N + x];
    let nx = -dx * strength, ny = -dy * strength, nz = 1; const l = Math.hypot(nx, ny, nz); nx /= l; ny /= l; nz /= l;
    const k = (y * N + x) * 4; img.data[k] = (nx * 0.5 + 0.5) * 255; img.data[k + 1] = (ny * 0.5 + 0.5) * 255; img.data[k + 2] = (nz * 0.5 + 0.5) * 255; img.data[k + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(c); tex.wrapS = tex.wrapT = THREE.RepeatWrapping; return tex;
}

/** a phone: extruded rounded body with bevelled sides, black glass front, live screen, side buttons.
 *  dims in world units; the screen's corner radius and aspect are exposed so a 2D card can match it exactly. */
export function makePhone({ w = 0.76, h = 1.58, d = 0.085, r = 0.125, bezel = 0.03, bodyColor = '#2B3263', screenTex }) {
  const g = new THREE.Group(), bev = 0.022;
  const bodyMat = new THREE.MeshPhysicalMaterial({ color: bodyColor, metalness: 1, roughness: 0.3, clearcoat: 0.7, clearcoatRoughness: 0.18 });
  const bodyGeo = new THREE.ExtrudeGeometry(rrShape(w - 2 * bev, h - 2 * bev, r - bev), { depth: d - 2 * bev, bevelEnabled: true, bevelThickness: bev, bevelSize: bev, bevelSegments: 10, curveSegments: 36 });
  bodyGeo.translate(0, 0, -(d - 2 * bev) / 2);
  g.add(new THREE.Mesh(bodyGeo, bodyMat));
  const glassMat = new THREE.MeshPhysicalMaterial({ color: '#04050A', metalness: 0, roughness: 0.06, clearcoat: 1, clearcoatRoughness: 0.03 });
  const gw = w - 0.016, gh = h - 0.016, glass = new THREE.Mesh(new THREE.ShapeGeometry(rrShape(gw, gh, r - 0.008), 36), glassMat);
  glass.position.z = d / 2 + 0.0008; g.add(glass);
  const sw = w - 2 * bezel, sh = h - 2 * bezel, sr = r - bezel * 0.9;
  const screenMat = new THREE.MeshBasicMaterial({ map: screenTex || null, color: screenTex ? '#FFFFFF' : '#000000', toneMapped: false });
  const screen = new THREE.Mesh(planarUV(new THREE.ShapeGeometry(rrShape(sw, sh, sr), 36), sw, sh), screenMat);
  screen.position.z = d / 2 + 0.0016; g.add(screen);
  const btnGeo = new THREE.BoxGeometry(0.012, 0.16, 0.03);
  [[w / 2 + 0.004, 0.32], [-w / 2 - 0.004, 0.42], [-w / 2 - 0.004, 0.2]].forEach(([bx, by]) => { const m = new THREE.Mesh(btnGeo, bodyMat); m.position.set(bx, by, 0); g.add(m); });
  g.userData = { w, h, d, screen, screenMat, sw, sh, sr, screenZ: d / 2 + 0.0016 };
  return g;
}

/** an art-directed sunset dome in the brand's phoenix colours: gradient by elevation, sun glow,
 *  drifting fbm clouds lit gold on the sun side and raspberry away from it. Not tone-mapped, so the
 *  brand colours land exactly. time is a uniform → deterministic. */
export function makePhoenixSky(sunDir, { horizon = '#FFD27A', c1 = '#FF9A44', c2 = '#F56B49', c3 = '#D74270', c4 = '#603689', zenith = '#12163F', sunCol = '#FFE3A8', clouds = 1 } = {}) {
  const C = h => new THREE.Color(h);
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, toneMapped: false,
    uniforms: { sunDir: { value: sunDir.clone().normalize() }, time: { value: 0 }, cH: { value: C(horizon) }, c1: { value: C(c1) }, c2: { value: C(c2) }, c3: { value: C(c3) }, c4: { value: C(c4) }, cZ: { value: C(zenith) }, sunCol: { value: C(sunCol) }, cloudAmt: { value: clouds } },
    vertexShader: `varying vec3 vDir; void main(){ vDir = position; vec4 p = projectionMatrix * modelViewMatrix * vec4(position,1.0); gl_Position = p.xyww; }`,
    fragmentShader: `
      uniform vec3 sunDir, cH, c1, c2, c3, c4, cZ, sunCol; uniform float time, cloudAmt; varying vec3 vDir;
      float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
      float noise(vec2 p){ vec2 i=floor(p), f=fract(p); vec2 u=f*f*(3.0-2.0*f); return mix(mix(hash(i),hash(i+vec2(1,0)),u.x), mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),u.x), u.y); }
      float fbm(vec2 p){ float v=0.0, a=0.5; for(int i=0;i<6;i++){ v+=a*noise(p); p=p*2.03+vec2(1.7,9.2); a*=0.5; } return v; }
      void main(){
        vec3 d = normalize(vDir); float e = d.y, h = max(e, 0.0);
        vec3 g = mix(cH, c1, smoothstep(0.0, 0.04, h));
        g = mix(g, c2, smoothstep(0.04, 0.10, h));
        g = mix(g, c3, smoothstep(0.10, 0.22, h));
        g = mix(g, c4, smoothstep(0.22, 0.42, h));
        g = mix(g, cZ, smoothstep(0.42, 0.80, h));
        float s = max(dot(d, normalize(sunDir)), 0.0);
        g += sunCol * (pow(s, 5.0) * 0.28 + pow(s, 48.0) * 0.6 + pow(s, 1400.0) * 4.0);
        if (e > 0.0) {
          vec2 p = d.xz / (e + 0.06) * 1.25 + vec2(time * 0.018, time * 0.005);
          float n = fbm(p);
          float c = smoothstep(0.5, 0.78, n) * smoothstep(0.0, 0.03, e) * (1.0 - smoothstep(0.30, 0.55, e)) * cloudAmt;
          vec3 lit = mix(c3 * 0.85, c1 * 1.25 + sunCol * 0.25, pow(s, 2.5));
          lit = mix(lit, c4 * 0.8, smoothstep(0.12, 0.35, e));
          float rim = smoothstep(0.5, 0.62, n) - smoothstep(0.62, 0.78, n);
          g = mix(g, lit + sunCol * rim * pow(s, 4.0) * 0.5, c * 0.9);
        } else {
          g = mix(cH * 0.6, cZ, smoothstep(0.0, -0.08, e));
        }
        gl_FragColor = vec4(g, 1.0);
        #include <colorspace_fragment>
      }`
  });
  const dome = new THREE.Mesh(new THREE.SphereGeometry(5000, 64, 32), mat);
  return { dome, mat, setTime: t => { mat.uniforms.time.value = t; } };
}

/** sky + ocean at sunset, PBR environment from the same sky. Returns handles the film animates.
 *  skyMode 'phoenix' = art-directed brand sunset (default); 'physical' = three.js Preetham sky. */
export function makeSeaWorld(renderer, scene, { skyMode = 'phoenix', skyColors = {}, elevation = 2.6, azimuth = 192, turbidity = 7, rayleigh = 1.6, mie = 0.006, mieG = 0.86, waterY = -2.2, waterColor = '#0B1440', size = 3.2, distortion = 3.2 } = {}) {
  const sun = new THREE.Vector3().setFromSphericalCoords(1, THREE.MathUtils.degToRad(90 - elevation), THREE.MathUtils.degToRad(azimuth));
  let sky, skyTime = () => {};
  if (skyMode === 'phoenix') { const ps = makePhoenixSky(sun, skyColors); sky = ps.dome; skyTime = ps.setTime; }
  else { sky = new Sky(); sky.scale.setScalar(10000); const u = sky.material.uniforms; u.turbidity.value = turbidity; u.rayleigh.value = rayleigh; u.mieCoefficient.value = mie; u.mieDirectionalG.value = mieG; u.sunPosition.value.copy(sun); }
  const pmrem = new THREE.PMREMGenerator(renderer), envScene = new THREE.Scene(); envScene.add(sky);
  const env = pmrem.fromScene(envScene).texture; scene.add(sky); scene.environment = env;
  const water = new Water(new THREE.PlaneGeometry(10000, 10000), {
    textureWidth: 1024, textureHeight: 1024, waterNormals: waterNormals(), sunDirection: sun.clone().normalize(), sunColor: 0xFFE2B8, waterColor: new THREE.Color(waterColor).getHex(), distortionScale: distortion, fog: false
  });
  water.rotation.x = -Math.PI / 2; water.position.y = waterY; water.material.uniforms.size.value = size; scene.add(water);
  const key = new THREE.DirectionalLight('#FFB37A', 2.2); key.position.copy(sun).multiplyScalar(50); scene.add(key);
  scene.add(new THREE.HemisphereLight('#FFB98A', '#0B1440', 0.5));
  return { sun, sky, water, env, setTime: t => { water.material.uniforms.time.value = t * 0.55; skyTime(t); } };
}

/* ===================== time-of-day world: bright day ↔ phoenix dusk ===================== */
/** two looks for the same sky dome; `tod` blends them (0 = day, 1 = dusk). Colours are sRGB hex. */
export const SKY_PRESETS = {
  day:  { cH: '#F4FBFF', c1: '#DDF0FF', c2: '#BDE1FF', c3: '#93CBFF', c4: '#5EA9F2', cZ: '#2C78D2', sunCol: '#FFF4D6', cloudLit: '#FFFFFF', cloudShade: '#AFC6E6', elev: 38, azim: 160, water: '#1E6FB8', sunWater: '#FFFFFF', exposure: 0.85, cover: 0.47 },
  dusk: { cH: '#FFD27A', c1: '#FF9A44', c2: '#F56B49', c3: '#D74270', c4: '#603689', cZ: '#12163F', sunCol: '#FFE3A8', cloudLit: '#FFB067', cloudShade: '#9E3F78', elev: 1.8, azim: 192, water: '#081033', sunWater: '#FFE2B8', exposure: 0.6, cover: 0.5 }
};
const SKY_KEYS = ['cH', 'c1', 'c2', 'c3', 'c4', 'cZ', 'sunCol', 'cloudLit', 'cloudShade'];
export function makeTodSky() {
  const uniforms = { sunDir: { value: new THREE.Vector3(0, 1, 0) }, time: { value: 0 }, tod: { value: 0 }, cover: { value: 0.47 } };
  SKY_KEYS.forEach(k => { uniforms[k + 'A'] = { value: new THREE.Color(SKY_PRESETS.day[k]) }; uniforms[k + 'B'] = { value: new THREE.Color(SKY_PRESETS.dusk[k]) }; });
  const decl = SKY_KEYS.map(k => `uniform vec3 ${k}A, ${k}B;`).join('\n');
  const pick = SKY_KEYS.map(k => `vec3 ${k} = mix(${k}A, ${k}B, tod);`).join('\n');
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, toneMapped: false, uniforms,
    vertexShader: `varying vec3 vDir; void main(){ vDir = position; vec4 p = projectionMatrix * modelViewMatrix * vec4(position,1.0); gl_Position = p.xyww; }`,
    fragmentShader: `
      ${decl}
      uniform vec3 sunDir; uniform float time, tod, cover; varying vec3 vDir;
      float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
      float noise(vec2 p){ vec2 i=floor(p), f=fract(p); vec2 u=f*f*(3.0-2.0*f); return mix(mix(hash(i),hash(i+vec2(1,0)),u.x), mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),u.x), u.y); }
      float fbm(vec2 p){ float v=0.0, a=0.5; for(int i=0;i<6;i++){ v+=a*noise(p); p=p*2.03+vec2(1.7,9.2); a*=0.5; } return v; }
      void main(){
        ${pick}
        vec3 d = normalize(vDir); float e = d.y, h = max(e, 0.0);
        vec3 g = mix(cH, c1, smoothstep(0.0, 0.04, h));
        g = mix(g, c2, smoothstep(0.04, 0.10, h));
        g = mix(g, c3, smoothstep(0.10, 0.22, h));
        g = mix(g, c4, smoothstep(0.22, 0.42, h));
        g = mix(g, cZ, smoothstep(0.42, 0.85, h));
        vec3 sd = normalize(sunDir); float s = max(dot(d, sd), 0.0);
        g += sunCol * (pow(s, 5.0) * mix(0.12, 0.28, tod) + pow(s, 48.0) * 0.55 + pow(s, 1400.0) * 4.0);
        if (e > 0.0) {
          vec2 p = d.xz / (e + 0.06) * 1.25 + vec2(time * 0.02, time * 0.006);
          float n = fbm(p);
          float n2 = fbm(p + sd.xz * 0.06);
          float c = smoothstep(cover, cover + 0.27, n) * smoothstep(0.0, 0.03, e) * (1.0 - smoothstep(0.32, 0.6, e));
          float light = clamp((n - n2) * 5.0 + 0.55, 0.0, 1.0);
          vec3 cl = mix(cloudShade, cloudLit, light);
          cl += sunCol * pow(s, 3.0) * 0.35 * light;
          g = mix(g, cl, c * 0.92);
        } else {
          g = mix(cH * 0.7, cZ, smoothstep(0.0, -0.08, e));
        }
        gl_FragColor = vec4(g, 1.0);
        #include <colorspace_fragment>
      }`
  });
  const dome = new THREE.Mesh(new THREE.SphereGeometry(5000, 64, 32), mat);
  return { dome, mat };
}
const sunAt = (elev, azim) => new THREE.Vector3().setFromSphericalCoords(1, THREE.MathUtils.degToRad(90 - elev), THREE.MathUtils.degToRad(azim));
/** sky + ocean + lights whose look follows `tod` (0 day → 1 dusk). Call update(t, tod) every frame before render.
 *  The PBR environment (reflections on devices) is regenerated only when tod changes. */
export function makeTodWorld(renderer, scene, { waterY = -4.5, size = 4.5, distortion = 4.5 } = {}) {
  const sky = makeTodSky(); scene.add(sky.dome);
  const pmrem = new THREE.PMREMGenerator(renderer), envScene = new THREE.Scene();
  const water = new Water(new THREE.PlaneGeometry(10000, 10000), { textureWidth: 1024, textureHeight: 1024, waterNormals: waterNormals(), sunDirection: new THREE.Vector3(0, 1, 0), sunColor: 0xFFFFFF, waterColor: 0x0F4F8C, distortionScale: distortion, fog: false });
  water.rotation.x = -Math.PI / 2; water.position.y = waterY; water.material.uniforms.size.value = size; scene.add(water);
  const key = new THREE.DirectionalLight('#FFFFFF', 2.0); scene.add(key);
  const hemi = new THREE.HemisphereLight('#CFE6FF', '#0F2A55', 0.7); scene.add(hemi);
  let envTod = -1, envRT = null;
  const D = SKY_PRESETS.day, K = SKY_PRESETS.dusk, col = (a, b, u) => new THREE.Color(a).lerp(new THREE.Color(b), u);
  function update(t, tod) {
    const el = D.elev + (K.elev - D.elev) * tod, az = D.azim + (K.azim - D.azim) * tod, sun = sunAt(el, az);
    const u = sky.mat.uniforms; u.sunDir.value.copy(sun); u.time.value = t; u.tod.value = tod; u.cover.value = D.cover + (K.cover - D.cover) * tod;
    const w = water.material.uniforms; w.time.value = t * 0.55; w.sunDirection.value.copy(sun); w.sunColor.value.copy(col(D.sunWater, K.sunWater, tod)); w.waterColor.value.copy(col(D.water, K.water, tod));
    key.position.copy(sun).multiplyScalar(50); key.color.copy(col('#FFFFFF', '#FFB37A', tod)); key.intensity = 2.0 + 0.4 * tod;
    hemi.color.copy(col('#CFE6FF', '#FFB98A', tod)); hemi.groundColor.copy(col('#0F2A55', '#0B1440', tod));
    renderer.toneMappingExposure = D.exposure + (K.exposure - D.exposure) * tod;
    const tq = Math.round(tod / 0.025) * 0.025;     // reflections follow the sky, quantised so they never depend on render history
    if (tq !== envTod || !envRT) {
      u.tod.value = tq; u.time.value = 0; envScene.add(sky.dome); const rt = pmrem.fromScene(envScene, 0, 0.1, 10000); scene.add(sky.dome); u.tod.value = tod; u.time.value = t;
      if (envRT) envRT.dispose(); envRT = rt; scene.environment = rt.texture; envTod = tq;
    }
  }
  return { sky, water, update };
}

/** a laptop: aluminium base with keyboard well + trackpad, lid on a hinge (lid.rotation.x: 0 = closed, ~1.85 = open), live screen */
export function makeLaptop({ w = 1.5, dpt = 1.02, bodyColor = '#C7D2E4', screenTex }) {
  const g = new THREE.Group(), alu = new THREE.MeshPhysicalMaterial({ color: bodyColor, metalness: 1, roughness: 0.32, clearcoat: 0.4, clearcoatRoughness: 0.25 });
  const baseT = 0.045, baseGeo = new THREE.ExtrudeGeometry(rrShape(w - 0.02, dpt - 0.02, 0.06), { depth: baseT - 0.02, bevelEnabled: true, bevelThickness: 0.01, bevelSize: 0.01, bevelSegments: 4, curveSegments: 18 });
  baseGeo.rotateX(-Math.PI / 2); const base = new THREE.Mesh(baseGeo, alu); g.add(base);
  const dark = new THREE.MeshStandardMaterial({ color: '#1B2033', roughness: 0.6, metalness: 0.2 });
  const kb = new THREE.Mesh(new THREE.ShapeGeometry(rrShape(w * 0.86, dpt * 0.42, 0.02), 8), dark); kb.rotation.x = -Math.PI / 2; kb.position.set(0, baseT + 0.0015, -dpt * 0.12); g.add(kb);
  const tp = new THREE.Mesh(new THREE.ShapeGeometry(rrShape(w * 0.36, dpt * 0.26, 0.025), 8), new THREE.MeshPhysicalMaterial({ color: bodyColor, metalness: 1, roughness: 0.18 })); tp.rotation.x = -Math.PI / 2; tp.position.set(0, baseT + 0.0015, dpt * 0.27); g.add(tp);
  // lid on a hinge at the back edge
  const hinge = new THREE.Group(); hinge.position.set(0, baseT, -dpt / 2 + 0.01); g.add(hinge);
  const lidH = dpt - 0.04, lidT = 0.02, lidGeo = new THREE.ExtrudeGeometry(rrShape(w - 0.02, lidH, 0.05), { depth: lidT - 0.01, bevelEnabled: true, bevelThickness: 0.005, bevelSize: 0.008, bevelSegments: 3, curveSegments: 18 });
  lidGeo.translate(0, lidH / 2, -lidT / 2); const lid = new THREE.Mesh(lidGeo, alu);
  const lidPivot = new THREE.Group(); lidPivot.add(lid); hinge.add(lidPivot);
  const glass = new THREE.Mesh(new THREE.ShapeGeometry(rrShape(w - 0.05, lidH - 0.03, 0.04), 16), new THREE.MeshPhysicalMaterial({ color: '#04050A', roughness: 0.05, clearcoat: 1 }));
  glass.position.set(0, lidH / 2, lidT / 2 + 0.001); lidPivot.add(glass);
  const sw = w - 0.12, sh = lidH - 0.12, screenMat = new THREE.MeshBasicMaterial({ map: screenTex || null, color: screenTex ? '#FFFFFF' : '#000000', toneMapped: false });
  const screen = new THREE.Mesh(planarUV(new THREE.ShapeGeometry(rrShape(sw, sh, 0.012), 8), sw, sh), screenMat); screen.position.set(0, lidH / 2 + 0.01, lidT / 2 + 0.0018); lidPivot.add(screen);
  g.userData = { lid: lidPivot, screenMat, sw, sh };
  return g;
}

/** a thin card in 3D whose face is a live canvas (same canvas a 2D card can draw → seamless handoff) */
export function makeCard3D(canvas, { w = 1, h = 1.25, r = 0.08, back = '#1E2357' } = {}) {
  const tex = new THREE.CanvasTexture(canvas); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  const g = new THREE.Group();
  const front = new THREE.Mesh(planarUV(new THREE.ShapeGeometry(rrShape(w, h, r), 16), w, h), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }));
  const backM = new THREE.Mesh(new THREE.ShapeGeometry(rrShape(w, h, r), 16), new THREE.MeshPhysicalMaterial({ color: back, metalness: 0.3, roughness: 0.35, clearcoat: 0.6 }));
  backM.rotation.y = Math.PI; backM.position.z = -0.006; g.add(front, backM);
  g.userData = { tex, w, h, r }; return g;
}

/** renderer sized in device pixels; draws into its own canvas which the 2D film composites */
export function makeRenderer(wpx, hpx, exposure = 0.5) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(1); renderer.setSize(wpx, hpx, false);
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = exposure;
  return renderer;
}

/** project a phone-local point to layout pixels (W×H layout space) */
export function projectPx(obj, camera, local, W, H) {
  const v = obj.localToWorld(local.clone()).project(camera);
  return { x: (v.x * 0.5 + 0.5) * W, y: (-v.y * 0.5 + 0.5) * H };
}
export { THREE };
