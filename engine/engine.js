/* ============================================================
   ENGINE — pure functions of time. No timers, no hidden state.
   Everything on the page (the film and every lab) uses these.
   ============================================================ */
const E = (() => {
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const lerp = (a, b, u) => a + (b - a) * u;
  const inv = (a, b, x) => clamp((x - a) / (b - a));
  const ease = {
    linear: u => u,
    inOutCubic: u => (u < .5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2),
    outCubic: u => 1 - Math.pow(1 - u, 3),
    inCubic: u => u * u * u,
    outExpo: u => (u >= 1 ? 1 : 1 - Math.pow(2, -10 * u)),
    inOutQuad: u => (u < .5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2),
  };
  // eased tween between t0..t1
  const tw = (t, t0, t1, a, b, fn = ease.inOutCubic) => lerp(a, b, fn(inv(t0, t1, t)));

  /* Closed-form spring step response: position goes 0 -> 1 when a target
     changes at time 0. omega = natural frequency (rad/s, "stiffness"),
     zeta = damping ratio (<1 overshoots, =1 critical, >1 sluggish). */
  function spring(t, omega = 12, zeta = 0.8) {
    if (t <= 0) return 0;
    if (zeta < 1) {
      const wd = omega * Math.sqrt(1 - zeta * zeta);
      return 1 - Math.exp(-zeta * omega * t) * (Math.cos(wd * t) + (zeta * omega / wd) * Math.sin(wd * t));
    }
    if (zeta === 1) return 1 - Math.exp(-omega * t) * (1 + omega * t);
    const s = Math.sqrt(zeta * zeta - 1);
    const r1 = -omega * (zeta - s), r2 = -omega * (zeta + s);
    return 1 + (r2 * Math.exp(r1 * t) - r1 * Math.exp(r2 * t)) / (r1 - r2);
  }
  const overshoot = zeta => (zeta >= 1 ? 0 : Math.exp(-Math.PI * zeta / Math.sqrt(1 - zeta * zeta)));
  /* settle time: first time after which |x-1| stays below tol (numeric, exact enough) */
  function settle(omega, zeta, tol = 0.02) {
    let last = 0;
    for (let t = 0; t < 10; t += 0.001) if (Math.abs(spring(t, omega, zeta) - 1) > tol) last = t;
    return last;
  }
  /* A value that changes target many times = start + sum of one spring per change.
     keys: [[time, value], ...] sorted. Still a pure function of t. */
  function springKeys(t, keys, omega = 12, zeta = 0.8) {
    let v = keys[0][1];
    for (let i = 1; i < keys.length; i++) v += (keys[i][1] - keys[i - 1][1]) * spring(t - keys[i][0], omega, zeta);
    return v;
  }
  /* zoom is multiplicative -> interpolate in log space */
  const logLerp = (a, b, u) => a * Math.pow(b / a, u);

  /* ---------- deterministic noise ---------- */
  function rng(seed = 1) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }

  /* ---------- AUDIO: synthesize a 120-BPM demo track ---------- */
  function synthTrack({ bpm = 120, beats = 18, dropBeat = 8, sr = 22050, sfx = [] } = {}) {
    const beat = 60 / bpm, dur = beats * beat + 0.6, n = Math.floor(dur * sr);
    const out = new Float32Array(n), r = rng(7);
    const add = (t0, len, fn) => { const i0 = Math.floor(t0 * sr), m = Math.floor(len * sr); for (let i = 0; i < m && i0 + i < n; i++) if (i0 + i >= 0) out[i0 + i] += fn(i / sr); };
    const noise = () => r() * 2 - 1;
    // soft pad (A minor) the whole time, swelling into the drop
    const pad = [110, 130.81, 164.81, 220];
    for (let i = 0; i < n; i++) {
      const t = i / sr, b = t / beat;
      const amp = b < dropBeat ? 0.02 + 0.03 * (b / dropBeat) : 0.05;
      let s = 0; for (const f of pad) s += Math.sin(2 * Math.PI * f * t);
      out[i] += amp * s / pad.length;
    }
    for (let k = 0; k < beats; k++) {
      const t0 = k * beat;
      if (k < dropBeat) {
        add(t0, 0.03, t => noise() * 0.10 * Math.exp(-t * 120)); // quiet hat on the beat
      } else {
        // kick: sine sweeping 150 -> 45 Hz
        add(t0, 0.35, t => { const ph = 2 * Math.PI * (45 * t + (105 / 22) * (1 - Math.exp(-22 * t))); return Math.sin(ph) * 0.9 * Math.exp(-t * 7); });
        add(t0 + beat / 2, 0.04, t => noise() * 0.18 * Math.exp(-t * 90)); // off-beat hat
        add(t0, beat, t => Math.sin(2 * Math.PI * 55 * t) * 0.22 * Math.exp(-t * 2)); // bass
      }
    }
    // riser over the 2 beats before the drop
    add((dropBeat - 2) * beat, 2 * beat, t => noise() * 0.12 * Math.pow(t / (2 * beat), 2));
    for (const s of sfx) addSfx(out, sr, s.type, s.at);
    let peak = 0; for (let i = 0; i < n; i++) peak = Math.max(peak, Math.abs(out[i]));
    if (peak > 0.98) for (let i = 0; i < n; i++) out[i] *= 0.98 / peak;
    return { samples: out, sr, beat, dur };
  }

  /* SFX shapes. `peakAt` is where each one is loudest inside its own file. */
  const SFX = {
    pop: { len: 0.12, peakAt: 0.004, fn: t => Math.sin(2 * Math.PI * (900 - 2400 * t) * t) * 0.45 * Math.exp(-t * 40) },
    click: { len: 0.05, peakAt: 0.001, fn: (t, r) => (r() * 2 - 1) * 0.5 * Math.exp(-t * 260) },
    whoosh: { len: 0.6, peakAt: 0.42, fn: (t, r) => (r() * 2 - 1) * 0.35 * (t < 0.42 ? Math.pow(t / 0.42, 3) : Math.exp(-(t - 0.42) * 16)) },
  };
  function addSfx(out, sr, type, at) {
    const s = SFX[type], r = rng(type.length * 31 + Math.floor(at * 100));
    const start = at - s.peakAt; // <- the whole trick: start = event - measured peak
    const i0 = Math.floor(start * sr), m = Math.floor(s.len * sr);
    for (let i = 0; i < m; i++) { const j = i0 + i; if (j >= 0 && j < out.length) out[j] += s.fn(i / sr, r); }
  }
  /* measure where a sound is loudest: RMS in 5 ms windows, take the max */
  function measurePeak(samples, sr, win = 0.005) {
    const w = Math.max(1, Math.floor(win * sr)); let best = 0, at = 0;
    for (let i = 0; i + w < samples.length; i += w) {
      let e = 0; for (let j = 0; j < w; j++) e += samples[i + j] * samples[i + j];
      if (e > best) { best = e; at = (i + w / 2) / sr; }
    }
    return at;
  }
  function renderSfx(type, sr = 22050) {
    const s = SFX[type], r = rng(5), m = Math.floor(s.len * sr), o = new Float32Array(m);
    for (let i = 0; i < m; i++) o[i] = s.fn(i / sr, r); return o;
  }

  /* ---------- AUDIO: find tempo, beat phase and the drop ---------- */
  function analyze(samples, sr, hop = 256) {
    const nF = Math.floor(samples.length / hop), env = new Float32Array(nF);
    for (let f = 0; f < nF; f++) { let e = 0; for (let j = 0; j < hop; j++) { const x = samples[f * hop + j]; e += x * x; } env[f] = Math.sqrt(e / hop); }
    // onset strength = how much louder this window is than the previous one
    const on = new Float32Array(nF);
    for (let f = 1; f < nF; f++) on[f] = Math.max(0, env[f] - env[f - 1]);
    const fps = sr / hop;
    // autocorrelation over lags that correspond to 60..200 BPM
    const minL = Math.floor(fps * 60 / 200), maxL = Math.ceil(fps * 60 / 60);
    const ac = [];
    for (let L = minL; L <= maxL; L++) { let s = 0; for (let f = 0; f + L < nF; f++) s += on[f] * on[f + L]; ac.push([L, s]); }
    // prefer tempos near 120 (log-gaussian), like real beat trackers do
    let bi = 0, bv = -1;
    ac.forEach(([L, s], i) => { const bpm = 60 * fps / L, w = Math.exp(-0.5 * Math.pow(Math.log2(bpm / 120) / 0.9, 2)); if (s * w > bv) { bv = s * w; bi = i; } });
    // parabolic interpolation around the peak for sub-frame precision
    let L = ac[bi][0];
    if (bi > 0 && bi < ac.length - 1) { const a = ac[bi - 1][1], b = ac[bi][1], c = ac[bi + 1][1]; const d = (a - 2 * b + c); if (d !== 0) L += 0.5 * (a - c) / d; }
    const bpm = 60 * fps / L, period = L;
    // phase: which offset makes the beats land on the most onset energy
    let bestPh = 0, bestS = -1;
    for (let p = 0; p < period; p += 0.25) { let s = 0; for (let k = p; k < nF; k += period) s += on[Math.round(k)] || 0; if (s > bestS) { bestS = s; bestPh = p; } }
    const firstBeat = bestPh / fps, beatLen = 60 / bpm;
    // energy per bar (4 beats); the drop = biggest jump from one bar to the next
    const bars = [];
    for (let t = firstBeat; t + 4 * beatLen <= samples.length / sr + 1e-6; t += 4 * beatLen) {
      const a = Math.floor(t * fps), b = Math.floor((t + 4 * beatLen) * fps); let e = 0; for (let f = a; f < b && f < nF; f++) e += env[f]; bars.push([t, e / Math.max(1, b - a)]);
    }
    // finer: energy per beat, drop = beat with the largest rise vs the previous 2 beats
    const beatsE = [];
    for (let t = firstBeat; t + beatLen <= samples.length / sr; t += beatLen) {
      const a = Math.floor(t * fps), b = Math.floor((t + beatLen) * fps); let e = 0; for (let f = a; f < b; f++) e += env[f]; beatsE.push([t, e / (b - a)]);
    }
    let drop = 0, jump = 0;
    for (let i = 2; i < beatsE.length; i++) { const prev = (beatsE[i - 1][1] + beatsE[i - 2][1]) / 2, r = beatsE[i][1] / (prev + 1e-9); if (r > jump) { jump = r; drop = beatsE[i][0]; } }
    return { bpm, firstBeat, beatLen, drop, dropRatio: jump, env, onset: on, fps, ac, bars, beatsE };
  }

  /* ---------- motion blur: running average of N subframes ----------
     drawing a new subframe with alpha 1/(k+1) over the accumulator is
     exactly acc*(k/(k+1)) + new*(1/(k+1)) = the running mean. */
  function blurDraw(ctx, t, drawFn, { n = 1, shutter = 0.5, fps = 60, scratch } = {}) {
    if (n <= 1) { drawFn(ctx, t); return; }
    const sctx = scratch.getContext('2d'), span = shutter / fps;
    for (let k = 0; k < n; k++) {
      const ts = t - span / 2 + span * (k + 0.5) / n;
      sctx.setTransform(1, 0, 0, 1, 0, 0); sctx.clearRect(0, 0, scratch.width, scratch.height);
      drawFn(sctx, ts);
      ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1 / (k + 1); ctx.drawImage(scratch, 0, 0); ctx.restore();
    }
  }

  /* ---------- fly-over: camera speed curve, integrated ---------- */
  function flySpeed(t) { // share of cruise speed, per the prompt's spec
    if (t < 0.6) return 0.5 * ease.inOutCubic(t / 0.6);
    if (t < 1.25) return 0.5;
    if (t < 1.6) return lerp(0.5, 1.0, ease.inOutCubic((t - 1.25) / 0.35));
    if (t < 7.3) return 1.0 + 0.06 * Math.sin((t - 1.6) * 0.9); // "held between 0.94 and 1.1"
    if (t < 8.3) return lerp(1.0 + 0.06 * Math.sin(5.7 * 0.9), 0.12, ease.inOutCubic((t - 7.3) / 1.0));
    return 0.12;
  }
  function flyIntegrate(tEnd = 8.3, dt = 1 / 600, cruise = 770) {
    const pts = []; let y = 0;
    for (let t = 0; t <= tEnd + 1e-9; t += dt) { pts.push([t, y, flySpeed(t) * cruise]); y += flySpeed(t) * cruise * dt; }
    return pts;
  }
  /* depth of field from the prompt: strong in front of focus, weak behind */
  const dofBlur = (depth, focus) => Math.min(120, depth < focus ? 75 * (focus - depth) / depth : 6 * (depth - focus) / depth);

  return { clamp, lerp, inv, ease, tw, spring, overshoot, settle, springKeys, logLerp, rng, synthTrack, SFX, addSfx, measurePeak, renderSfx, analyze, blurDraw, flySpeed, flyIntegrate, dofBlur };
})();
if (typeof module !== 'undefined') module.exports = E;
