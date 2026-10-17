// A three.js view for a catalog demo: renderer + scene + camera, sized to the card, drag-to-orbit offsets.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
export { THREE };
export function view3d(stage, { aspect = 16 / 9, exposure = 0.9, alpha = false, env = true, fov = 35, drag = true } = {}) {
  const wrap = document.createElement('div'); wrap.className = 'v3'; wrap.style.aspectRatio = String(aspect); stage.appendChild(wrap);
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(1.5, window.devicePixelRatio || 1));
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = exposure; renderer.outputColorSpace = THREE.SRGBColorSpace;
  wrap.appendChild(renderer.domElement);
  const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(fov, aspect, 0.05, 20000);
  if (env) { const pm = new THREE.PMREMGenerator(renderer); scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture; pm.dispose(); }
  const size = () => { const w = wrap.clientWidth || 640, h = Math.max(1, Math.round(w / aspect)); renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); };
  size();
  const user = { yaw: 0, pitch: 0 }; let d = null, onDrag = null;
  if (drag) {
    wrap.style.touchAction = 'pan-y'; wrap.classList.add('can-drag');
    wrap.addEventListener('pointerdown', e => { d = { x: e.clientX, y: e.clientY, yaw: user.yaw, pitch: user.pitch }; wrap.setPointerCapture(e.pointerId); wrap.classList.add('dragging'); });
    wrap.addEventListener('pointermove', e => { if (!d) return; user.yaw = d.yaw + (e.clientX - d.x) * 0.008; user.pitch = Math.max(-0.5, Math.min(0.5, d.pitch + (e.clientY - d.y) * 0.004)); onDrag && onDrag(); });
    const up = () => { d = null; wrap.classList.remove('dragging'); };
    wrap.addEventListener('pointerup', up); wrap.addEventListener('pointercancel', up);
  }
  return { renderer, scene, camera, wrap, size, user, setOnDrag(fn) { onDrag = fn; }, render() { renderer.render(scene, camera); } };
}
/** place the camera on a sphere around a target: yaw/pitch in radians */
export function orbit(camera, target, dist, yaw, pitch) {
  camera.position.set(target.x + dist * Math.sin(yaw) * Math.cos(pitch), target.y + dist * Math.sin(pitch), target.z + dist * Math.cos(yaw) * Math.cos(pitch));
  camera.lookAt(target);
}
/** a vertical gradient as a scene background (brand sky by default) */
export function gradientTexture(stops = ['#5EA9F2', '#93CBFF', '#DDF0FF']) {
  const c = document.createElement('canvas'); c.width = 4; c.height = 256; const x = c.getContext('2d'), g = x.createLinearGradient(0, 0, 0, 256);
  stops.forEach((s, i) => g.addColorStop(i / (stops.length - 1), s)); x.fillStyle = g; x.fillRect(0, 0, 4, 256);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
/** a soft round shadow under objects (no shadow maps needed) */
export function contactShadow(size = 3, opacity = 0.35) {
  const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d'), g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, `rgba(5,8,30,${opacity})`); g.addColorStop(1, 'rgba(5,8,30,0)'); x.fillStyle = g; x.fillRect(0, 0, 128, 128);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(size, size), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false }));
  m.rotation.x = -Math.PI / 2; return m;
}
