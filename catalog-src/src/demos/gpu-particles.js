// three.js WebGPURenderer: 200,000 particles whose positions are computed on the GPU from t, written in TSL
// (three.js shading language, plain JavaScript that compiles to WGSL for WebGPU or GLSL for the WebGL 2 fallback).
import { EN, T, DIR } from '../ui/i18n.js';
import * as THREE from 'three/webgpu';
import { Fn, float, vec3, vec4, uniform, instanceIndex, hash, sin, cos, floor, mix, smoothstep, uv, clamp } from 'three/tsl';

const N = 200000;
const io3 = u => (u < .5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2);

export async function mount(stage) {
  stage.classList.add('gpu');
  const wrap = document.createElement('div'); wrap.className = 'v3'; wrap.style.aspectRatio = '16 / 9'; stage.appendChild(wrap);
  const badge = document.createElement('div'); badge.className = 'gpu-badge'; badge.dir = DIR; wrap.appendChild(badge);
  const renderer = new THREE.WebGPURenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(1.5, window.devicePixelRatio || 1));
  wrap.appendChild(renderer.domElement);
  await renderer.init();   // WebGPU starts asynchronously; this also decides whether we got WebGPU or the WebGL 2 fallback
  const isGPU = !!(renderer.backend && renderer.backend.isWebGPUBackend);
  badge.innerHTML = `<b dir="ltr">${isGPU ? 'WebGPU' : 'WebGL 2'}</b><span>${isGPU ? T('הדפדפן הזה מריץ WebGPU', 'This browser is running WebGPU') : T('אין כאן WebGPU, אז three.js עבר לבד ל-WebGL 2', 'No WebGPU here, so three.js fell back to WebGL 2 by itself')}</span><span><bdi>${N.toLocaleString('en-US')}</bdi> ${T('חלקיקים', 'particles')}</span>`;

  const scene = new THREE.Scene(); scene.background = new THREE.Color('#0B0E2A');
  const camera = new THREE.PerspectiveCamera(40, 16 / 9, 0.1, 100);
  const uMorph = uniform(0), uT = uniform(0);
  const mat = new THREE.SpriteNodeMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
  // every particle gets three fixed random numbers from its index, then three target shapes, then a staggered morph
  const r1 = hash(instanceIndex), r2 = hash(instanceIndex.add(7919)), r3 = hash(instanceIndex.add(104729));
  mat.positionNode = Fn(() => {
    const th = r1.mul(6.2831853), z = r2.mul(2).sub(1), rr = z.mul(z).oneMinus().sqrt();
    const A = vec3(rr.mul(cos(th)), z, rr.mul(sin(th))).mul(1.5);                            // a sphere
    const arm = floor(r3.mul(3)), rad = r1.pow(0.6).mul(2.4), ang = rad.mul(2.4).add(arm.mul(2.0944)).add(r2.sub(0.5).mul(0.7));
    const B = vec3(cos(ang).mul(rad), r2.sub(0.5).mul(0.12), sin(ang).mul(rad));               // a three-armed galaxy
    const x = r1.mul(6).sub(3), zz = r2.mul(2.6).sub(1.3);
    const C = vec3(x, sin(x.mul(1.6).add(uT.mul(2.2))).mul(0.45).add(cos(zz.mul(2.5).add(uT.mul(1.4))).mul(0.18)), zz);   // a wave that moves with t
    const m = clamp(uMorph.mul(1.3).sub(r3.mul(0.3)), 0, 2);                                   // each particle starts a little later
    const p = mix(mix(A, B, smoothstep(0, 1, m)), C, smoothstep(1, 2, m));
    const a = uT.mul(0.15), ca = cos(a), sa = sin(a);                                           // a slow turn of the whole cloud
    return vec3(p.x.mul(ca).sub(p.z.mul(sa)), p.y, p.x.mul(sa).add(p.z.mul(ca)));
  })();
  mat.scaleNode = float(0.018).mul(r2.mul(0.8).add(0.6));
  mat.colorNode = Fn(() => {
    const d = uv().sub(0.5).length();
    const soft = smoothstep(0.0, 0.5, d).oneMinus();   // edges in increasing order: reversed edges are undefined in GLSL and WGSL
    const fire = mix(vec3(1.0, 0.78, 0.31), vec3(0.96, 0.42, 0.29), r1);
    const skyc = mix(vec3(0.37, 0.66, 0.95), vec3(0.87, 0.94, 1.0), r2);
    return vec4(mix(skyc, fire, smoothstep(0.35, 0.65, r3)).mul(0.26), soft);
  })();
  const pts = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat); pts.count = N; pts.frustumCulled = false; scene.add(pts);

  const size = () => { const w = wrap.clientWidth || 640, h = Math.max(1, Math.round(w * 9 / 16)); renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); };
  size();
  const render = t => {
    // 0–3 s sphere · 3–5 s → galaxy · 5–8 s galaxy · 8–10 s → wave · 10–12 s wave
    const m = t < 3 ? 0 : t < 5 ? io3((t - 3) / 2) : t < 8 ? 1 : t < 10 ? 1 + io3((t - 8) / 2) : 2;
    uMorph.value = m; uT.value = t;
    const yaw = 0.4 + 0.25 * Math.sin(t * 0.3), pitch = 0.32 - 0.12 * Math.min(1, m);
    camera.position.set(6 * Math.sin(yaw) * Math.cos(pitch), 6 * Math.sin(pitch), 6 * Math.cos(yaw) * Math.cos(pitch)); camera.lookAt(0, 0, 0);
    renderer.render(scene, camera);
  };
  return { dur: 12, render, resize: size, poster: 6.5 };
}
