// A real Recharts area chart whose data is a function of t (so it can be rendered into a video).
import { EN, T, DIR } from '../ui/i18n.js';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ReferenceLine, ReferenceDot } from 'recharts';
import { reactStage } from '../ui/react.js';
import { spring, clamp, inv, io3 } from '../../../kit/src/core.js';
const DAYS = 30;
const DATA = Array.from({ length: DAYS }, (_, i) => ({ d: i, v: Math.round(18 + i * 1.35 + 9 * Math.sin(i * 0.9) + 5 * Math.sin(i * 2.3)) }));
function Chart({ t, w, libMode, runKey }) {
  const h = Math.round(Math.min(360, Math.max(240, w * 0.52)));
  let data = DATA, dot = null, goal = 0;
  if (!libMode) {
    const k = io3(inv(0.4, 4.4, t)) * (DAYS - 1);           // how far along the line we are (0 → 29)
    const i = Math.floor(k), f = k - i;
    data = DATA.slice(0, i + 1);
    if (i < DAYS - 1) data = [...data, { d: k, v: DATA[i].v + (DATA[i + 1].v - DATA[i].v) * f }];
    dot = data[data.length - 1];
    goal = clamp(spring(t - 4.8, 14, 0.6), 0, 1.2);
  }
  return (
    <div dir="ltr" className="rc-wrap">
      <AreaChart key={libMode ? 'lib' + runKey : 't'} width={w} height={h} data={data} margin={{ top: 24, right: 24, bottom: 8, left: 0 }}>
        <defs>
          <linearGradient id="caFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#FF8F3A" stopOpacity={0.55} /><stop offset="100%" stopColor="#FFC74E" stopOpacity={0.04} /></linearGradient>
          <linearGradient id="caLine" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#FFC74E" /><stop offset="55%" stopColor="#FF8F3A" /><stop offset="100%" stopColor="#F56B49" /></linearGradient>
        </defs>
        <CartesianGrid stroke="rgba(18,22,63,.08)" vertical={false} />
        <XAxis dataKey="d" type="number" domain={[0, DAYS - 1]} ticks={[0, 7, 14, 21, 29]} tickFormatter={v => T(`יום ${v + 1}`, `Day ${v + 1}`)} tick={{ fill: '#4A5280', fontSize: 13, fontFamily: EN ? 'Inter' : 'Assistant' }} axisLine={false} tickLine={false} />
        <YAxis domain={[0, 80]} ticks={[0, 20, 40, 60, 80]} tick={{ fill: '#4A5280', fontSize: 13, fontFamily: EN ? 'Inter' : 'Assistant' }} axisLine={false} tickLine={false} width={36} />
        {!libMode && goal > 0.01 && <ReferenceLine y={60} stroke="#12163F" strokeDasharray="6 6" strokeWidth={2 * Math.min(goal, 1)} label={{ value: T('יעד: 60 דקות', 'Goal: 60 min'), position: 'insideTopRight', fill: '#12163F', fontSize: 14 * Math.min(goal, 1.1), fontWeight: 700 }} />}
        <Area type="monotone" dataKey="v" stroke="url(#caLine)" strokeWidth={4} fill="url(#caFill)" isAnimationActive={libMode} animationDuration={1600} dot={false} />
        {dot && <ReferenceDot x={dot.d} y={dot.v} r={8} fill="#FF8F3A" stroke="#fff" strokeWidth={3} />}
      </AreaChart>
    </div>
  );
}
export function mount(stage, card) {
  stage.classList.add('rc');
  const host = document.createElement('div'); stage.appendChild(host);
  const ctl = document.createElement('div'); ctl.className = 'ctrl-row';
  ctl.innerHTML = `<label class="chk"><input type="checkbox" class="ca-lib"> ${T('תנו ל-Recharts להנפיש לבד', 'Let Recharts animate on its own')}</label><button type="button" class="btn o ca-again" hidden>${T('הפעל שוב', 'Replay')}</button>`;
  stage.appendChild(ctl);
  const r = reactStage(host, Chart, { libMode: false, runKey: 0, w: stage.clientWidth });
  const lib = ctl.querySelector('.ca-lib'), again = ctl.querySelector('.ca-again');
  lib.addEventListener('change', () => { again.hidden = !lib.checked; card.classList.toggle('lib-mode', lib.checked); r.draw({ libMode: lib.checked, runKey: r.props.runKey + 1 }); });
  again.addEventListener('click', () => r.draw({ runKey: r.props.runKey + 1 }));
  return { dur: 7, render: t => { if (!r.props.libMode) r.draw({ t }); }, resize: () => r.draw({ w: stage.clientWidth }) };
}
