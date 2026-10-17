// A whole world from code: a shader sky and a reflective ocean that blend from bright day to phoenix dusk.
import { view3d, THREE } from '../ui/three.js';
import { makeTodWorld } from '../../../kit/src/world.js';
import { clamp, io3, inv } from '../../../kit/src/core.js';
export function mount(stage) {
  const v = view3d(stage, { aspect: 16 / 9, exposure: 0.85, env: false, fov: 42 });
  const world = makeTodWorld(v.renderer, v.scene, { waterY: -2.2, size: 3.5, distortion: 3.6 });
  const render = t => {
    // 0–2 s day · 2–7 s the sun sets · 7–9 s dusk · 9–12 s back to day
    const tod = t < 2 ? 0 : t < 7 ? io3(inv(2, 7, t)) : t < 9 ? 1 : 1 - io3(inv(9, 12, t));
    world.update(t, tod);
    const yaw = 0.15 * Math.sin(t * 0.2) + v.user.yaw;
    v.camera.position.set(0, 1.4 + 0.15 * Math.sin(t * 0.5), 6); v.camera.lookAt(Math.sin(yaw) * 60, 6 + v.user.pitch * 40, -Math.cos(yaw) * 60);
    v.render();
  };
  let last = 0; v.setOnDrag(() => render(last));
  return { dur: 12, render: t => { last = t; render(t); }, resize: v.size };
}
