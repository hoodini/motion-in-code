// 400 boxes drawn in ONE draw call (instancing). Each box's height and colour is a function of (column, row, t).
import { view3d, orbit, gradientTexture, THREE } from '../ui/three.js';
import { spring } from '../../../kit/src/core.js';
const G = 20, BPM = 120, B = 60 / BPM;
export function mount(stage) {
  const v = view3d(stage, { aspect: 16 / 9, exposure: 1 });
  v.scene.background = gradientTexture(['#12163F', '#1E2357', '#2C78D2']);
  const geo = new THREE.BoxGeometry(0.16, 1, 0.16); geo.translate(0, 0.5, 0);
  const mat = new THREE.MeshStandardMaterial({ roughness: 0.5, metalness: 0.1, envMapIntensity: 0.45 });
  const mesh = new THREE.InstancedMesh(geo, mat, G * G); v.scene.add(mesh);
  v.scene.add(new THREE.DirectionalLight('#FFFFFF', 1.8).translateX(2).translateY(5).translateZ(3), new THREE.HemisphereLight('#FFC74E', '#12163F', 0.5));
  const M = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), p = new THREE.Vector3(), c = new THREE.Color();
  const lo = new THREE.Color('#2C78D2'), mid = new THREE.Color('#FF8F3A'), hi = new THREE.Color('#FFC74E');
  const target = new THREE.Vector3(0, 0.7, 0);
  const render = t => {
    const beat = Math.floor(t / B), kick = spring(t - beat * B, 30, 0.35);  // a pulse that lands on every beat
    let i = 0;
    for (let x = 0; x < G; x++) for (let z = 0; z < G; z++) {
      const dx = x - G / 2 + 0.5, dz = z - G / 2 + 0.5, r = Math.hypot(dx, dz);
      const wave = 0.5 + 0.5 * Math.sin(r * 0.7 - t * 4);
      const h = 0.12 + wave * 0.9 + (1 - kick) * Math.max(0, 1.2 - r * 0.12);
      p.set(dx * 0.22, 0, dz * 0.22); s.set(1, h, 1); M.compose(p, q, s); mesh.setMatrixAt(i, M);
      const u = Math.min(1, h / 1.6); if (u < 0.55) c.copy(lo).lerp(mid, u / 0.55); else c.copy(mid).lerp(hi, (u - 0.55) / 0.45); mesh.setColorAt(i, c);  // 3-stop ramp: blue → orange → gold
      i++;
    }
    mesh.instanceMatrix.needsUpdate = true; mesh.instanceColor.needsUpdate = true;
    orbit(v.camera, target, 8.6, 0.7 + t * 0.12 + v.user.yaw, 0.58 + v.user.pitch);
    v.render();
  };
  let last = 0; v.setOnDrag(() => render(last));
  return { dur: 12, render: t => { last = t; render(t); }, resize: v.size };
}
