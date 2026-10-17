// Six cards on a ring that snaps one card per beat. Angle = a sum of springs, one per snap.
import { view3d, orbit, gradientTexture, contactShadow, THREE } from '../ui/three.js';
import { makeCard3D } from '../../../kit/src/world.js';
import { sk } from '../../../kit/src/core.js';
import { C, fontsReady, fire } from '../ui/canvas.js';
const CARDS = [['01', 'גרפים', 'RECHARTS'], ['02', 'ממשק', 'SHADCN/UI'], ['03', 'לוגואים', 'SIMPLE ICONS'], ['04', 'תלת־ממד', 'THREE.JS'], ['05', 'טיפוגרפיה', 'KINETIC TYPE'], ['06', 'אפקטים', 'GLOW · GLASS']];
const BEAT = 0.75;
export async function mount(stage) {
  await fontsReady();
  const v = view3d(stage, { aspect: 16 / 9, exposure: 1 });
  v.scene.background = gradientTexture(['#5EA9F2', '#93CBFF', '#F4FBFF']);
  const ring = new THREE.Group(); v.scene.add(ring);
  const R = 2.3;
  CARDS.forEach(([num, he, en], i) => {
    const c = document.createElement('canvas'); c.width = 512; c.height = 640; const x = c.getContext('2d');
    const dark = i % 2 === 0; x.fillStyle = dark ? C.navy : '#FFFFFF'; x.fillRect(0, 0, 512, 640);
    x.font = '400 300px Anton'; x.fillStyle = dark ? 'rgba(255,143,58,.18)' : 'rgba(18,22,63,.07)'; x.textAlign = 'left'; x.fillText(num, -10, 610);
    x.fillStyle = fire(x, 0, 0, 512, 0); x.fillRect(40, 60, 120, 14);
    x.font = '700 120px Karantina'; x.direction = 'rtl'; x.textAlign = 'right'; x.fillStyle = dark ? '#FFFFFF' : C.navy; x.fillText(he, 472, 230);
    x.font = '400 34px Anton'; x.direction = 'ltr'; x.letterSpacing = '4px'; x.textAlign = 'right'; x.fillStyle = dark ? C.gold : C.orange; x.fillText(en, 472, 290);
    const card = makeCard3D(c, { w: 1.2, h: 1.5, r: 0.09 });
    const a = (i / CARDS.length) * Math.PI * 2; card.position.set(Math.sin(a) * R, 0, Math.cos(a) * R); card.rotation.y = a;
    ring.add(card);
  });
  const sh = contactShadow(6, 0.22); sh.position.y = -0.95; v.scene.add(sh);
  v.scene.add(new THREE.DirectionalLight('#FFFFFF', 1.4).translateY(4).translateZ(5));
  const keys = [[0, 0]]; for (let k = 1; k <= 12; k++) keys.push([k * BEAT, -k * (Math.PI * 2 / CARDS.length)]);
  const target = new THREE.Vector3(0, 0, 0);
  const render = t => {
    ring.rotation.y = sk(t, keys, 13, 0.55);
    orbit(v.camera, target, 6.6, v.user.yaw, 0.2 + v.user.pitch);
    v.render();
  };
  let last = 0; v.setOnDrag(() => render(last));
  return { dur: BEAT * 12 + 0.6, render: t => { last = t; render(t); }, resize: v.size };
}
