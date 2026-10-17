// A small app screen built from real shadcn/ui components. Every prop comes from t.
import * as React from 'react';
import { Flame, Play, Bell, Gauge } from 'lucide-react';
import { reactStage } from '../ui/react.js';
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent, Badge, Input, Progress, Tabs, TabsList, TabsTrigger, Switch, Slider, Alert, AlertTitle, AlertDescription } from '../ui/shadcn.js';
import { spring, sk, clamp, inv, io3, lerp } from '../../../kit/src/core.js';
const QUERY = 'אימון בוקר', TYPE0 = 0.9, PER = 0.14;
let mctx = null;
const measure = s => { if (!mctx) mctx = document.createElement('canvas').getContext('2d'); mctx.font = '500 18px Assistant'; return mctx.measureText(s).width; };
const TAB_VALUES = { day: '42', week: '268', month: '1,248' };
function Scene({ t }) {
  const btnRef = React.useRef(null), wrapRef = React.useRef(null);
  const [cur, setCur] = React.useState({ x: 0, y: 0, ok: false });
  const enter = spring(t, 12, 0.7);
  const typed = Array.from(QUERY).slice(0, clamp(Math.floor((t - TYPE0) / PER) + 1, 0, QUERY.length)).join('');
  const caretOn = t > TYPE0 - 0.3 && t < 2.6 && Math.floor(t * 2.4) % 2 === 0;
  const press = sk(t, [[0, 1], [3.1, 0.9], [3.24, 1]], 34, 0.55);
  const started = t > 3.2;
  const prog = 72 * clamp(spring(t - 3.4, 4.2, 0.9), 0, 1.02);
  const tab = t < 4.4 ? 'day' : t < 5.4 ? 'week' : 'month';
  const sw = clamp(spring(t - 6.6, 22, 0.55), -0.1, 1.15);
  const sl = sk(t, [[0, 30], [7.2, 80]], 7, 0.75);
  const al = spring(t - 8.8, 13, 0.6), bd = spring(t - 9.6, 18, 0.45);
  React.useLayoutEffect(() => {
    if (!btnRef.current || !wrapRef.current) return;
    const b = btnRef.current.getBoundingClientRect(), w = wrapRef.current.getBoundingClientRect();
    setCur(c => { const nx = b.left - w.left + b.width * 0.3, ny = b.top - w.top + b.height * 0.55; return (Math.abs(c.x - nx) > 0.5 || Math.abs(c.y - ny) > 0.5 || !c.ok) ? { x: nx, y: ny, ok: true } : c; });
  });
  const u = io3(inv(2.4, 3.05, t)), cx = lerp(cur.x - 140, cur.x, u), cy = lerp(cur.y + 170, cur.y, u), cs = sk(t, [[0, 1], [3.1, 0.82], [3.22, 1]], 34, 0.6);
  return (
    <div className="tw ui-scene" dir="rtl" ref={wrapRef}>
      <div className="ui-alert-slot" style={{ transform: `translateY(${(1 - al) * -130}%)` }}>
        {al > 0.01 && <Alert className="bg-card shadow-lg"><Flame className="h-4 w-4 text-accent" /><AlertTitle className="font-display text-lg">יעד שבועי הושג</AlertTitle><AlertDescription>268 דקות השבוע, 3 ימים לפני הזמן.</AlertDescription></Alert>}
      </div>
      <Card className="ui-card" style={{ transform: `translateY(${(1 - enter) * 40}px) scale(${0.92 + 0.08 * enter})` }}>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="font-display text-3xl font-bold">האימון שלך</CardTitle>
            {bd > 0.01 && <Badge variant="accent" style={{ transform: `scale(${clamp(bd, 0, 1.4)})` }}>‎+12% השבוע</Badge>}
          </div>
          <CardDescription>קצב · אפליקציית כושר (דמיונית)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="relative">
            <Input readOnly value={typed} placeholder={t < TYPE0 ? 'חפשו אימון...' : ''} className="h-11 text-lg" />
            {caretOn && <span className="ui-caret" style={{ right: `${13 + measure(typed)}px` }} />}
          </div>
          <Button ref={btnRef} size="lg" variant={started ? 'accent' : 'default'} className="w-full text-lg" style={{ transform: `scale(${press})` }}>
            <Play />{started ? 'באימון עכשיו' : 'התחל אימון'}
          </Button>
          <div className="space-y-2">
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">התקדמות שבועית</span><b>{Math.round(prog)}%</b></div>
            <Progress value={prog} className="h-3" />
          </div>
          <Tabs value={tab} dir="rtl">
            <TabsList className="w-full"><TabsTrigger value="day" className="flex-1">היום</TabsTrigger><TabsTrigger value="week" className="flex-1">שבוע</TabsTrigger><TabsTrigger value="month" className="flex-1">חודש</TabsTrigger></TabsList>
          </Tabs>
          <div className="ui-big"><b>{TAB_VALUES[tab]}</b><span>דקות</span></div>
          <div className="flex items-center justify-between"><span className="flex items-center gap-2 text-sm"><Bell className="h-4 w-4" />תזכורות</span><Switch pos={sw} /></div>
          <div className="space-y-2"><span className="flex items-center gap-2 text-sm"><Gauge className="h-4 w-4" />עצימות · {Math.round(sl)}</span><Slider value={[sl]} max={100} step={1} dir="rtl" /></div>
        </CardContent>
      </Card>
      {cur.ok && t > 2.3 && t < 4.2 && <svg className="ui-cursor" viewBox="0 0 24 36" style={{ left: cx, top: cy, transform: `scale(${cs})` }}><path d="M0 0v30l8-7 6 13 5-2-6-13h10z" fill="#12163F" stroke="#fff" strokeWidth="2.2" strokeLinejoin="round" /></svg>}
    </div>
  );
}
export function mount(stage, card) {
  stage.classList.add('uis');
  const host = document.createElement('div'); stage.appendChild(host);
  const steps = card ? [...card.querySelectorAll('.ui-steps [data-from]')] : [];
  const r = reactStage(host, Scene, {});
  return {
    dur: 11,
    render(t) { r.draw({ t }); steps.forEach(li => li.classList.toggle('on', t >= +li.dataset.from && t < +li.dataset.to)); }
  };
}
