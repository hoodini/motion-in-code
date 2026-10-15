const E = require('./engine.js');
const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) process.exitCode = 1; };
ok(E.spring(0, 12, .8) === 0, 'spring(0)=0');
ok(Math.abs(E.spring(5, 12, .8) - 1) < 1e-6, 'spring settles to 1');
for (const z of [0.3, 0.6, 0.8]) {
  let mx = 0; for (let t = 0; t < 5; t += 1e-4) mx = Math.max(mx, E.spring(t, 12, z));
  ok(Math.abs((mx - 1) - E.overshoot(z)) < 1e-3, `overshoot formula z=${z}: numeric ${(mx - 1).toFixed(4)} vs ${E.overshoot(z).toFixed(4)}`);
}
ok(Math.abs(E.spring(0.3, 12, 0.9999) - E.spring(0.3, 12, 1)) < 1e-3, 'continuous at zeta=1 (under side)');
ok(Math.abs(E.spring(0.3, 12, 1.0001) - E.spring(0.3, 12, 1)) < 1e-3, 'continuous at zeta=1 (over side)');
let mono = true, prev = 0; for (let t = 0; t < 3; t += 1e-3) { const v = E.spring(t, 12, 1.5); if (v < prev - 1e-12) mono = false; prev = v; } ok(mono, 'overdamped is monotonic');
ok(E.spring(1e-5, 12, .8) < 1e-6, 'starts at rest');
const keys = [[0, 0], [0.5, 100], [1.0, 40]];
ok(Math.abs(E.springKeys(1.0 - 1e-6, keys) - E.springKeys(1.0 + 1e-6, keys)) < 1e-3, 'springKeys is continuous at retarget');
ok(Math.abs(E.springKeys(9, keys) - 40) < 1e-6, 'springKeys ends on last target');
ok(Math.abs(E.logLerp(1, 4, .5) - 2) < 1e-12, 'log midpoint of 1..4 is 2');
console.log('130 BPM x 32 beats =', (32 * 60 / 130).toFixed(2), 's ; 120 x 54 =', (54 * 60 / 120), 's ; 120 BPM x 7 bars =', 7 * 4 * 0.5, 's');
for (const bpm of [100, 120, 130, 140]) {
  const tr = E.synthTrack({ bpm, beats: 24, dropBeat: 12 });
  const a = E.analyze(tr.samples, tr.sr);
  const dropTrue = 12 * 60 / bpm;
  ok(Math.abs(a.bpm - bpm) < 1.0, `tempo ${bpm}: detected ${a.bpm.toFixed(2)}`);
  ok(Math.abs(a.drop - dropTrue) < 0.06, `drop ${dropTrue.toFixed(3)}s: detected ${a.drop.toFixed(3)} (x${a.dropRatio.toFixed(1)})`);
  const ph = ((a.firstBeat % a.beatLen) + a.beatLen) % a.beatLen; ok(Math.min(ph, a.beatLen - ph) < 0.03, `phase ok (${ph.toFixed(3)})`);
}
for (const k of Object.keys(E.SFX)) { const s = E.renderSfx(k); const p = E.measurePeak(s, 22050); ok(Math.abs(p - E.SFX[k].peakAt) < 0.02, `sfx ${k} peak ${p.toFixed(3)} vs ${E.SFX[k].peakAt}`); }
const pts = E.flyIntegrate(); ok(pts.every(p => p[2] >= 0), 'fly speed >= 0'); console.log('fly distance at 8.3s ~', Math.round(pts[pts.length - 1][1]), 'page px');
let maxS = 0, minS = 9; for (const p of pts) if (p[0] > 1.6 && p[0] < 7.3) { maxS = Math.max(maxS, p[2] / 770); minS = Math.min(minS, p[2] / 770); } ok(minS >= 0.94 && maxS <= 1.1, `cruise held in [0.94,1.1]: ${minS.toFixed(3)}..${maxS.toFixed(3)}`);
console.log('DoF: focus 1360, depth 700 ->', E.dofBlur(700, 1360).toFixed(1), 'px ; depth 2720 ->', E.dofBlur(2720, 1360).toFixed(1), 'px');
console.log('settle z=.8 w=12:', E.settle(12, .8).toFixed(3), 's');
