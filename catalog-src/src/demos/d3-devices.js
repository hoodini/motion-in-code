// A phone and a laptop built from code (no model files). Their screens are live 2D canvases redrawn from t.
import { view3d, orbit, gradientTexture, contactShadow, THREE } from '../ui/three.js';
import { makePhone, makeLaptop } from '../../../kit/src/world.js';
import { spring, clamp, inv, io3 } from '../../../kit/src/core.js';
import { C, fontsReady, fire } from '../ui/canvas.js';
const CODE = ['window.seek = (t) => {', '  const s = spring(t - 1.2);', '  phone.position.y = 0.2 * s;', '  lid.rotation.x = PI/2 - open(t);', '  ring.progress = reps(t) / 12;', '  renderer.render(scene, camera);', '};'];
export async function mount(stage) {
  await fontsReady();
  const v = view3d(stage, { aspect: 16 / 9, exposure: 1.0 });
  v.scene.background = gradientTexture(['#5EA9F2', '#93CBFF', '#DDF0FF']);
  // live screens: ordinary 2D canvases used as textures
  const pc = document.createElement('canvas'); pc.width = 512; pc.height = 1064; const px = pc.getContext('2d');
  const lc = document.createElement('canvas'); lc.width = 1024; lc.height = 660; const lx = lc.getContext('2d');
  const ptex = new THREE.CanvasTexture(pc), ltex = new THREE.CanvasTexture(lc); [ptex, ltex].forEach(t => { t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; });
  const phone = makePhone({ screenTex: ptex }), laptop = makeLaptop({ screenTex: ltex });
  laptop.position.set(-0.35, 0, 0); phone.position.set(1.05, 0.8, 0.35); phone.rotation.set(0, -0.35, 0);
  const sh = contactShadow(4.2, 0.32); sh.position.y = 0.001;
  v.scene.add(laptop, phone, sh);
  const key = new THREE.DirectionalLight('#FFFFFF', 1.6); key.position.set(3, 5, 4); v.scene.add(key, new THREE.HemisphereLight('#DDF0FF', '#12163F', 0.6));
  const target = new THREE.Vector3(0.2, 0.55, 0);
  const drawPhone = t => {
    const W = 512, H = 1064; px.fillStyle = C.navy; px.fillRect(0, 0, W, H);
    const reps = Math.min(12, Math.max(0, Math.floor((t - 2.2) / 0.45) + 1)), p = clamp((t - 2.2) / (12 * 0.45), 0, 1);
    px.fillStyle = '#fff'; px.font = '700 64px Karantina'; px.direction = 'rtl'; px.textAlign = 'center'; px.fillText('שכיבות סמיכה', W / 2, 190);
    px.lineWidth = 34; px.strokeStyle = 'rgba(255,255,255,.12)'; px.beginPath(); px.arc(W / 2, 520, 170, 0, Math.PI * 2); px.stroke();
    px.strokeStyle = fire(px, 100, 300, 420, 700); px.lineCap = 'round'; px.beginPath(); px.arc(W / 2, 520, 170, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.max(0.001, p)); px.stroke();
    px.fillStyle = '#fff'; px.font = '400 170px Anton'; px.direction = 'ltr'; px.fillText(String(reps), W / 2, 580);
    px.font = '400 44px Anton'; px.fillStyle = 'rgba(255,255,255,.6)'; px.fillText('/ 12', W / 2, 650);
    px.fillStyle = C.orange; px.beginPath(); px.roundRect(80, 860, W - 160, 96, 48); px.fill();
    px.fillStyle = C.navy; px.font = '700 50px Karantina'; px.direction = 'rtl'; px.fillText(reps >= 12 ? 'סיימת!' : 'עוד ' + (12 - reps), W / 2, 925);
    ptex.needsUpdate = true;
  };
  const drawLaptop = t => {
    const W = 1024, H = 660; lx.fillStyle = '#0B0E2A'; lx.fillRect(0, 0, W, H);
    lx.fillStyle = '#1E2357'; lx.fillRect(0, 0, W, 44); ['#F56B49', '#FFC74E', '#5DE4E9'].forEach((c, i) => { lx.fillStyle = c; lx.beginPath(); lx.arc(26 + i * 24, 22, 7, 0, 7); lx.fill(); });
    lx.font = '500 26px "JetBrains Mono"'; lx.direction = 'ltr'; lx.textAlign = 'left';
    const chars = Math.floor(Math.max(0, t - 1.4) * 34); let used = 0;
    CODE.forEach((line, i) => {
      const n = Math.max(0, Math.min(line.length, chars - used)); used += line.length;
      lx.fillStyle = 'rgba(255,255,255,.3)'; lx.fillText(String(i + 1).padStart(2, ' '), 24, 100 + i * 52);
      lx.fillStyle = i === 0 || i === 6 ? '#FFC74E' : '#E7ECFA'; lx.fillText(line.slice(0, n), 80, 100 + i * 52);
      if (n > 0 && n < line.length) { lx.fillStyle = C.orange; lx.fillRect(80 + lx.measureText(line.slice(0, n)).width + 2, 76 + i * 52, 14, 30); }
    });
    ltex.needsUpdate = true;
  };
  const render = t => {
    const open = (Math.PI / 2 + 0.3) * clamp(spring(t - 0.4, 6, 0.75), 0, 1.03);
    laptop.userData.lid.rotation.x = Math.PI / 2 - open;
    const rise = spring(t - 1.2, 8, 0.55);
    phone.position.y = 0.05 + 0.75 * clamp(rise, 0, 1.1); phone.rotation.y = -0.35 + 0.25 * Math.sin(t * 0.6);
    drawPhone(t); drawLaptop(t);
    orbit(v.camera, target, 4.6, -0.35 + 0.18 * Math.sin(t * 0.35) + v.user.yaw, 0.32 + v.user.pitch);
    v.render();
  };
  let last = 0; v.setOnDrag(() => render(last));
  return { dur: 9, render: t => { last = t; render(t); }, resize: v.size };
}
