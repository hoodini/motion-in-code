// A real 3D model file (glTF) lit by a real photographed environment (HDRI): a product packshot.
// The bottle is a CC0 sample model; its label is redrawn from t on a canvas, so the product can carry our brand.
import { EN, T, DIR } from '../ui/i18n.js';
import { view3d, gradientTexture, contactShadow, THREE } from '../ui/three.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { clamp, inv, io3, sk, logLerp } from '../../../kit/src/core.js';
import { fontsReady } from '../ui/canvas.js';

const asset = f => new URL('../static/' + f, import.meta.url).href;

export async function mount(stage) {
  await fontsReady();
  const v = view3d(stage, { aspect: 16 / 9, exposure: 1.0, env: false, fov: 30 });
  const [gltf, hdr] = await Promise.all([new GLTFLoader().loadAsync(asset('bottle.glb')), new RGBELoader().loadAsync(asset('venice_sunset_1k.hdr'))]);
  // two environments, each pre-filtered once (PMREM) so rough and shiny surfaces both pick up the right blur
  const pm = new THREE.PMREMGenerator(v.renderer);
  const studio = pm.fromScene(new RoomEnvironment(), 0.04).texture;
  hdr.mapping = THREE.EquirectangularReflectionMapping; const sunset = pm.fromEquirectangular(hdr).texture; pm.dispose();
  const studioBg = gradientTexture(['#93CBFF', '#DDF0FF', '#EEF3FB']);
  // normalise the model: centre it, stand it on the floor, make it 1.6 units tall
  const model = gltf.scene, box = new THREE.Box3().setFromObject(model), sz = box.getSize(new THREE.Vector3()), k = 1.6 / sz.y;
  model.scale.setScalar(k); box.setFromObject(model); model.position.sub(new THREE.Vector3((box.min.x + box.max.x) / 2, box.min.y, (box.min.z + box.max.z) / 2));
  const spin = new THREE.Group(); spin.add(model); v.scene.add(spin);
  const sh = contactShadow(1.6, 0.4); sh.position.y = 0.002; v.scene.add(sh);
  // the live label: the model's own colour texture, redrawn on a canvas with our label on top
  let mat = null; model.traverse(o => { if (o.isMesh && o.material && o.material.map && !mat) mat = o.material; });
  const img = mat.map.image, LC = document.createElement('canvas'); LC.width = img.width; LC.height = img.height; const lx = LC.getContext('2d');
  const tex = new THREE.CanvasTexture(LC); tex.flipY = false; tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8; mat.map = tex; mat.needsUpdate = true;
  const s = img.width / 1024, L = { x: 0, y: 148 * s, w: 745 * s, h: 590 * s };   // where the label sits in this texture
  const drawLabel = (x, a, b, c1, c2, word) => {
    const g = x.createLinearGradient(L.x, 0, L.x + L.w, 0); g.addColorStop(0, c1); g.addColorStop(1, c2);
    x.fillStyle = g; x.fillRect(L.x, L.y, L.w, L.h);
    x.fillStyle = '#12163F'; x.fillRect(L.x, L.y + L.h * 0.70, L.w, L.h * 0.06);
    x.font = `400 ${Math.round(112 * s)}px Anton, Impact, sans-serif`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.direction = 'ltr';
    const [w1, w2] = word.split(' ');   // two short lines: the label wraps around a cylinder, so wide words disappear around the back
    x.fillText(w1, L.x + L.w * 0.5, L.y + L.h * (w2 ? 0.27 : 0.4)); if (w2) x.fillText(w2, L.x + L.w * 0.5, L.y + L.h * 0.47);
    x.font = `700 ${Math.round(24 * s)}px "JetBrains Mono", monospace`; x.fillText(a, L.x + L.w * 0.5, L.y + L.h * 0.62);
    x.fillStyle = '#FFFFFF'; x.fillText(b, L.x + L.w * 0.5, L.y + L.h * 0.86);
  };
  const paint = t => {
    lx.drawImage(img, 0, 0);
    const w = io3(inv(5.8, 6.6, t));                           // the new label wipes across the old one
    if (w < 1) { lx.save(); lx.beginPath(); lx.rect(L.x + L.w * w, L.y, L.w * (1 - w), L.h); lx.clip(); drawLabel(lx, 'NO. 01 · 500 ML', 'LET\'S FLY HIGH', '#FFC74E', '#F56B49', 'FLY HIGH'); lx.restore(); }
    if (w > 0) { lx.save(); lx.beginPath(); lx.rect(L.x, L.y, L.w * w, L.h); lx.clip(); drawLabel(lx, 'NO. 02 · 500 ML', 'MADE WITH CODE', '#DDF0FF', '#5EA9F2', 'IN CODE'); lx.restore(); }
    tex.needsUpdate = true;
  };
  const seg = document.createElement('div'); seg.className = 'seg mdl-seg'; seg.dir = DIR;
  seg.innerHTML = `<button type="button" data-v="auto" class="on">${T('תאורה לפי הזמן', 'Light follows time')}</button><button type="button" data-v="studio">${T('סטודיו', 'Studio')}</button><button type="button" data-v="hdri">${T('שקיעה בוונציה (HDRI)', 'Venice sunset (HDRI)')}</button>`;
  stage.appendChild(seg);
  let mode = 'auto', last = 0;
  seg.addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; mode = b.dataset.v; seg.querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b)); render(last); });
  const Q = Math.PI / 2;
  const render = t => {
    last = t;
    const useHdr = mode === 'hdri' || (mode === 'auto' && t >= 6);
    v.scene.environment = useHdr ? sunset : studio;
    v.scene.background = useHdr ? hdr : studioBg; v.scene.backgroundBlurriness = useHdr ? 0.4 : 0; v.scene.backgroundIntensity = useHdr ? 0.75 : 1;
    v.scene.environmentRotation.y = useHdr ? 0.6 + t * 0.25 : 0;   // turning the world makes the reflections sweep across the glass and metal
    v.scene.backgroundRotation.y = v.scene.environmentRotation.y;
    spin.rotation.y = sk(t, [[0, -0.4], [1.5, -0.4 + Q], [3, -0.4 + 2 * Q], [4.5, -0.4 + 3 * Q], [6, -0.4 + 4 * Q], [8, -0.4 + 5 * Q], [10, -0.4 + 6 * Q]], 9, 0.72);
    paint(t);
    const d = logLerp(4.6, 3.4, io3(inv(0, 11, t)));
    const yaw = v.user.yaw, pitch = 0.12 + v.user.pitch;
    v.camera.position.set(d * Math.sin(yaw) * Math.cos(pitch), 0.8 + d * Math.sin(pitch), d * Math.cos(yaw) * Math.cos(pitch)); v.camera.lookAt(0, 0.78, 0);
    v.render();
  };
  v.setOnDrag(() => render(last));
  return { dur: 12, render, resize: v.size, poster: 7.5 };
}
