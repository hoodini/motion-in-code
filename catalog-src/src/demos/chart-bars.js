// Recharts bars that land one per beat, each on its own spring. Values are a function of t.
import { EN, T, DIR } from '../ui/i18n.js';
import { BarChart, Bar, XAxis, YAxis, Cell, LabelList } from 'recharts';
import { reactStage } from '../ui/react.js';
import { spring, clamp } from '../../../kit/src/core.js';
const DAYS = EN ? ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] : ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳'], VALS = [24, 38, 31, 52, 44, 61, 48], BEAT = 0.5, START = 0.5, TODAY = 5;
function Bars({ t, w }) {
  const h = Math.round(Math.min(340, Math.max(230, w * 0.5)));
  const data = DAYS.map((name, i) => { const s = spring(t - (START + i * BEAT), 13, 0.5); return { name, v: VALS[i] * clamp(s, 0, 1.25), lab: s > 0.6 ? VALS[i] : '' }; });
  return (
    <div dir="ltr" className="rc-wrap">
      <BarChart width={w} height={h} data={EN ? data : [...data].reverse()} margin={{ top: 30, right: 12, bottom: 4, left: 12 }} barCategoryGap="22%">
        <defs><linearGradient id="cbFire" x1="0" y1="1" x2="0" y2="0"><stop offset="0%" stopColor="#F56B49" /><stop offset="50%" stopColor="#FF8F3A" /><stop offset="100%" stopColor="#FFC74E" /></linearGradient></defs>
        <XAxis dataKey="name" tick={{ fill: '#12163F', fontSize: EN ? 14 : 16, fontFamily: EN ? 'Inter' : 'Karantina', fontWeight: 700 }} axisLine={false} tickLine={false} />
        <YAxis hide domain={[0, 75]} />
        <Bar dataKey="v" radius={[14, 14, 4, 4]} isAnimationActive={false}>
          {(EN ? data : [...data].reverse()).map((d, i) => <Cell key={i} fill={(EN ? i : DAYS.length - 1 - i) === TODAY ? 'url(#cbFire)' : '#12163F'} />)}
          <LabelList dataKey="lab" position="top" style={{ fill: '#12163F', fontFamily: 'Anton', fontSize: 18 }} />
        </Bar>
      </BarChart>
    </div>
  );
}
export function mount(stage) {
  stage.classList.add('rc');
  const host = document.createElement('div'); stage.appendChild(host);
  const r = reactStage(host, Bars, { w: stage.clientWidth });
  return { dur: 5.5, render: t => r.draw({ t }), resize: () => r.draw({ w: stage.clientWidth }) };
}
