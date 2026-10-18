// The prompt builder: pick elements from the catalog, a format, a length and a brand,
// and get one complete prompt in zero's six-block skeleton. No AI here: it is plain string assembly,
// so you can read exactly which sentence each choice adds.
import { EN, T } from '../ui/i18n.js';
export const ELEMENTS = [
  { id: 'chart-area', ord: 50, en: 'the area chart', cat: 'גרפים', he: 'גרף שטח שנבנה',
    dir: 'A Recharts AreaChart that draws itself left to right as the data points are revealed, with a soft gradient fill and a dashed goal line the curve crosses on a beat.',
    build: 'Recharts: set isAnimationActive={false} on every series and pass only the points revealed by time t; the reveal is animated by you, not by the library.',
    gotcha: 'Recharts animates on its own clock by default. If isAnimationActive is left on, the captured frames jump.',
    input: 'the real numbers for the chart (otherwise invent a plausible weekly series and say so)' },
  { id: 'chart-bars', ord: 52, en: 'the bar chart', cat: 'גרפים', he: 'עמודות שנוחתות על הביט',
    dir: 'A Recharts BarChart of 7 days where each bar springs up on its own beat and today\'s bar is highlighted in the accent colour.',
    build: 'Recharts BarChart with isAnimationActive={false}; each bar height = value × spring(t − its beat time).',
    gotcha: 'Bars that start below zero during the spring overshoot must be clamped at 0.',
    input: 'the 7 values to show' },
  { id: 'kpi', ord: 56, en: 'the KPI counters', cat: 'גרפים', he: 'מונים שעולים',
    dir: 'Three KPI tiles whose numbers count up to their final values and land with a small overshoot.',
    build: 'Numbers come from an eased function of t, formatted with Intl.NumberFormat(\'he-IL\'); use font-variant-numeric: tabular-nums.',
    gotcha: 'Proportional digits change width every frame and make counters shake. Tabular numbers fix it.',
    input: 'the final KPI values and their labels' },
  { id: 'ring', ord: 54, en: 'the progress ring', cat: 'גרפים', he: 'טבעת התקדמות',
    dir: 'A circular progress ring that fills to its goal with the number counting up in its centre.',
    build: 'SVG circle: stroke-dasharray = circumference, stroke-dashoffset = circumference × (1 − progress(t)), rotated −90° to start at 12 o\'clock.',
    gotcha: 'Use stroke-linecap round only above 2% progress, or an empty ring shows a dot.',
    input: 'the goal and the reached value' },
  { id: 'ui-scene', ord: 20, en: 'the app tour', cat: 'ממשק', he: 'סיור באפליקציה (shadcn/ui)',
    dir: 'A product tour built from real shadcn/ui components (Card, Input, Button, Tabs, Progress, Switch, Slider, Alert, Badge): a cursor types a query, clicks, switches tabs and flips a switch.',
    build: 'Add the components with npx shadcn add; make every one controlled (value, checked and selected tab are props computed from t) and delete every transition-* class.',
    gotcha: 'Radix-based components keep their own internal state. If they are not controlled from t, scrubbing backwards leaves them in the wrong state.',
    input: 'my app\'s real screens or copy (otherwise invent a believable app in my brand)' },
  { id: 'icons-draw', ord: 25, en: 'the icons', cat: 'אייקונים', he: 'אייקונים שמצטיירים',
    dir: 'A row of Lucide icons that draw themselves stroke by stroke, one per beat.',
    build: 'lucide-react icons; give every path pathLength="1" and animate stroke-dashoffset from 1 to 0 as a function of t.',
    gotcha: 'Without pathLength="1" every path has a different length and the drawing speeds do not match.',
    input: '' },
  { id: 'logos', ord: 70, en: 'the logo wall', cat: 'אייקונים', he: 'לוגואים רשמיים',
    dir: 'A wall of official brand logos that pop in on the beat, in their official colours.',
    build: 'Use the simple-icons npm package for the SVG paths and official hex colours; never redraw a logo by hand.',
    gotcha: 'Logos are trademarks even when the SVG file is free. Do not recolour, distort or imply endorsement; follow each brand\'s guidelines.',
    input: 'which brands to show, and confirmation that I may show them' },
  { id: 'type', ord: 15, en: 'the kinetic type', cat: 'טיפוגרפיה', he: 'טיפוגרפיה קינטית',
    dir: 'Kinetic typography: words slam in on beats, rise out of a mask line, type on with a real keystroke rhythm, and get a marker swipe under the key word.',
    build: 'Lay out each word once, then move and clip it as a function of t. Keystrokes land on 16th notes of the beat grid.',
    gotcha: 'Hebrew reads right to left: reveal words from the right, and wrap numbers and English in unicode-bidi: isolate so they do not jump.',
    input: 'the exact on-screen lines' },
  { id: 'd3-devices', ord: 30, en: 'the 3D phone and laptop', cat: 'תלת-ממד', he: 'טלפון ולפטופ בתלת-ממד',
    dir: 'A generic modern phone and laptop in 3D with live screens: the laptop lid opens, the phone rises, the camera orbits slowly.',
    build: 'three.js; draw each screen\'s UI on a 2D canvas every frame and use it as a CanvasTexture (needsUpdate = true); RoomEnvironment for reflections.',
    gotcha: 'Real Apple models and the Apple logo are protected. Build a generic device or use a GLTF model whose licence allows this use.',
    input: 'the screen content for each device' },
  { id: 'd3-glass', ord: 40, en: 'the glass orb', cat: 'תלת-ממד', he: 'כדור זכוכית',
    dir: 'A liquid glass orb that slowly breathes and refracts the brand name behind it.',
    build: 'MeshPhysicalMaterial with transmission 1, thickness, ior 1.4 and an environment map; vertex noise displacement whose time uniform is set from t.',
    gotcha: 'Transmission needs an environment and something behind the object, or the glass reads as grey plastic.',
    input: '' },
  { id: 'd3-particles', ord: 42, en: 'the particle morph', cat: 'תלת-ממד', he: 'חלקיקים שמשנים צורה',
    dir: '20,000 particles that morph from a sphere into a knot, into a word, into a galaxy.',
    build: 'THREE.Points with a fixed count; precompute target positions per shape (text is sampled from a 2D canvas); position = mix(A, B, eased progress of t).',
    gotcha: 'Every shape must use the same particle count, and the morph progress must be eased, or the motion looks linear and cheap.',
    input: 'the word the particles should spell' },
  { id: 'd3-ocean', ord: 65, en: 'the ocean time-lapse', cat: 'תלת-ממד', he: 'ים ושמיים, יום עד שקיעה',
    dir: 'A calm ocean under a sky that turns from day to sunset over the length of the scene.',
    build: 'three.js Sky and Water addons; sun elevation and colour are functions of t.',
    gotcha: 'The Water shader advances its own time uniform. Set it from t every frame instead.',
    input: '' },
  { id: 'd3-carousel', ord: 35, en: 'the 3D carousel', cat: 'תלת-ממד', he: 'קרוסלת כרטיסים',
    dir: 'Category cards on a 3D ring that snaps one step on every beat.',
    build: 'Cards placed on a circle; ring rotation = sum of springs, one spring per beat, so every snap overshoots slightly and settles.',
    gotcha: 'Turn cards toward the camera or the text on the far side reads mirrored.',
    input: 'the card titles' },
  { id: 'd3-eq', ord: 60, en: 'the 3D equalizer', cat: 'תלת-ממד', he: 'אקולייזר תלת-ממדי',
    dir: 'A 20×20 grid of bars that ripples with the music and kicks on every beat.',
    build: 'One InstancedMesh of 400 boxes; heights come from the track\'s spectrum, analysed offline per frame and looked up by t.',
    gotcha: 'A live Web Audio analyser runs on the wall clock. Precompute the spectrum, or capture and audio drift apart.',
    input: '' },
  { id: 'fx-neon', ord: 10, en: 'the neon input', cat: 'אפקטים', he: 'קצה ניאון "AI חושב"',
    dir: 'An input field with a rotating iridescent neon edge and a soft halo, pulsing on the beat while a request types in.',
    build: 'A conic-gradient border masked to a thin ring plus a blurred copy behind it; the angle is t × 1.5 radians.',
    gotcha: 'A CSS keyframe animation of the angle runs on its own clock. Set the angle from t.',
    input: 'the request that types into the field' },
  { id: 'fx-glass', ord: 58, en: 'the glass card', cat: 'אפקטים', he: 'כרטיס זכוכית',
    dir: 'A frosted glass card floating over slowly moving colour blobs.',
    build: 'backdrop-filter: blur() saturate() on the card; the blobs behind it move as functions of t.',
    gotcha: 'Glass only shows when something moves behind it. Over a flat background it just looks grey.',
    input: '' },
  { id: 'fx-aurora', ord: 0, kind: 'background', en: 'the aurora background', cat: 'אפקטים', he: 'רקע זוהר צפוני',
    dir: 'An aurora background of huge soft colour blobs drifting slowly, with fine film grain.',
    build: 'Five large circles drawn on a canvas with a heavy blur filter, positions from sin/cos of t; a tiled noise texture on top.',
    gotcha: 'Smooth gradients band after video compression. The grain (dithering) hides it.',
    input: '' },
  { id: 'transitions', ord: 0, kind: 'between', en: 'the transitions', cat: 'אפקטים', he: 'מעברים בלי פייד',
    dir: 'Scene changes without crossfades: a button floods the frame with its colour, a pill morphs into a card, a wipe with a leading accent band, an iris that closes into the logo\'s dot.',
    build: 'Flood radius = distance to the farthest corner × eased progress; iris radius interpolated in log space so it feels even.',
    gotcha: 'Every transition must start from an object already on screen, or it reads as a cut.',
    input: '' }
];

const PHOENIX = {
  look: 'navy #12163F for text and dark surfaces; cloud #EEF3FB and denim #AFCBEF for light surfaces; the phoenix fire gradient #FFC74E → #FF8F3A → #F56B49 as the single accent per frame; the clear sky gradient #5EA9F2 → #93CBFF → #DDF0FF for open scenes. Corners are fully round (999px) or 28px, never in between. Shadows are navy and two-layered.',
  fontsHe: 'Hebrew headlines in Karantina 700, Hebrew running text in Assistant 500, English labels in Anton uppercase, numbers in JetBrains Mono',
  fontsEn: 'Headlines in Anton uppercase with letter-spacing 0, body in Inter, numbers in JetBrains Mono'
};

// English edition: display names for the chips and categories (the prompt text itself is English in both editions)
const NAME_EN = { 'chart-area': 'Area chart that draws itself', 'chart-bars': 'Bars that land on the beat', kpi: 'Counting KPIs', ring: 'Progress ring',
  'ui-scene': 'App tour (shadcn/ui)', 'icons-draw': 'Icons that draw themselves', logos: 'Official logos', type: 'Kinetic typography',
  'd3-devices': '3D phone and laptop', 'd3-glass': 'Glass orb', 'd3-particles': 'Particle morph', 'd3-ocean': 'Ocean, day to sunset',
  'd3-carousel': 'Card carousel', 'd3-eq': '3D equalizer', 'fx-neon': 'Neon "AI is thinking" edge', 'fx-glass': 'Glass card',
  'fx-aurora': 'Aurora background', transitions: 'Transitions without fades' };
const CAT_EN = { 'גרפים': 'Charts', 'ממשק': 'Interface', 'אייקונים': 'Icons & logos', 'טיפוגרפיה': 'Typography', 'תלת-ממד': '3D', 'אפקטים': 'Effects' };

const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

export function buildPrompt(o) {
  const els = ELEMENTS.filter(e => o.els.includes(e.id));
  const spb = 60 / o.bpm, beats = Math.round(o.len / spb);
  const fmt = o.fmt === 'h' ? '1920x1080 (16:9)' : o.fmt === 'v' ? '1080x1920 (9:16)' : 'both 1920x1080 (16:9) and 1080x1920 (9:16) from the same seek(t), with a layout that reflows per aspect ratio';
  const look = o.brand === 'phoenix' ? PHOENIX.look : `background ${o.c1}, text ${o.c2}, one accent ${o.c3} (at most one accent per frame).`;
  const fonts = o.brand === 'phoenix' ? (o.lang === 'he' ? PHOENIX.fontsHe : PHOENIX.fontsEn) : `headlines in ${o.fh || 'a bold display font'}, running text in ${o.fb || 'a clean sans'}`;
  const lang = o.lang === 'he' ? 'All on-screen text is Hebrew, right to left (dir="rtl"), with English words and numbers isolated so the order never breaks.' : 'All on-screen text is English.';
  const inputs = ['a royalty-free song around ' + o.bpm + ' BPM with a clear drop (Mixkit or similar, licensed for commercial use)', ...els.map(e => e.input).filter(Boolean)];
  if (o.brand !== 'phoenix') inputs.push('my logo file');
  // spread the chosen elements across the beat grid, after a 4-beat hook and before a 4-beat CTA
  const scenes = els.filter(e => !e.kind).sort((a, b) => a.ord - b.ord);
  const body = Math.max(1, beats - 8), per = scenes.length ? body / scenes.length : body;
  const plan = scenes.map((e, i) => { const a = 4 + Math.round(i * per), b = 4 + Math.round((i + 1) * per) - 1; return `Beats ${a}-${Math.max(a, b)}: ${e.en}.`; });
  const lines = [];
  lines.push('<inputs>');
  lines.push(`Ask me for: ${inputs.join('; ')}. If I skip any, use sensible defaults, tell me which ones you used, and keep going.`);
  lines.push('</inputs>', '');
  lines.push('<direction>');
  lines.push(`${o.story.trim() || 'A product launch film.'} A ${o.len}-second film, ${fmt}, 60fps, one continuous take.`);
  lines.push('Every scene is made out of the previous one: nothing crossfades, blurs in or cuts. Objects change shape instead: buttons grow into pages, a colour floods out of one object, text rises out of a mask line. The camera makes one move per scene and never zooms in and out back to back.');
  lines.push(`Look: ${look}`);
  lines.push(`Type: ${fonts}. ${lang}`);
  if (els.length) { lines.push('Use these exact elements and libraries, in this story order:'); [...els].sort((a, b) => (a.ord || 99) - (b.ord || 99)).forEach(e => lines.push(`- ${e.dir}`)); }
  lines.push('Banned: crossfades, blur-ins, generic glowing particles on black, holds longer than 1 second, default Tailwind colours, anything that looks like a template.');
  lines.push('</direction>', '');
  lines.push('<structure>');
  lines.push(`${o.bpm} BPM, so one beat = ${spb.toFixed(3)}s and the film is ${beats} beats. Something visible happens on every beat. The drop lands at the start of the main reveal.`);
  lines.push('Beats 0-3: the hook, one bold line that states the problem.');
  plan.forEach(p => lines.push(p));
  if (!scenes.length) lines.push(`Beats 4-${beats - 5}: the main story, one idea per 4 to 8 beats.`);
  els.filter(e => e.kind === 'background').forEach(e => lines.push(`Background throughout: ${e.en}, slow and continuous, never competing with the text.`));
  els.filter(e => e.kind === 'between').forEach(e => lines.push(`Between scenes, use ${e.en} (flood, morph, wipe, iris), each starting on a downbeat from an object already on screen.`));
  lines.push(`Beats ${Math.max(4, beats - 4)}-${beats - 1}: the call to action and the logo, landing on the last downbeat.`);
  lines.push('Each scene is born from an object of the scene before it.');
  lines.push('</structure>', '');
  lines.push('<build>');
  lines.push('One HTML file that exposes window.seek(t). Every frame is computed from t alone: no CSS transitions or keyframe animations, no setTimeout or setInterval, no library auto-animation, no state carried between frames.');
  lines.push('Motion uses closed-form springs evaluated at t, spring(t) = 1 − e^(−ζωt)·(cos(ω_d·t) + (ζω/ω_d)·sin(ω_d·t)) with ω_d = ω·√(1 − ζ²) and ζ below 1, and zooms interpolate in log space.');
  els.forEach(e => lines.push(`- ${e.build}`));
  lines.push('Build a preview page with a scrubber. Render with Playwright at 60fps with 6 to 8 subframes per frame for motion blur, assemble with ffmpeg, place every sound effect so its peak lands on its beat, and loudness-normalise to −14 LUFS.');
  lines.push('</build>', '');
  lines.push('<gotchas>');
  lines.push('- Wait for document.fonts.ready before the first seek(), or the first frames render in a fallback font.');
  lines.push('- Give every layer an explicit z-index, or a flood can cover the element it was meant to come from.');
  lines.push('- Declare every variable before the first seek() runs.');
  els.forEach(e => lines.push(`- ${e.gotcha}`));
  lines.push('</gotchas>', '');
  lines.push('<start>');
  lines.push('Ask me for the inputs, then show me the beat map and 4 stills (hook, drop, the main reveal, CTA) before you write the full film. Wait for my OK.');
  lines.push('</start>');
  return lines.join('\n');
}

export function mount(stage) {
  stage.classList.add('pb');
  const cats = [...new Set(ELEMENTS.map(e => e.cat))];
  const def = ['ui-scene', 'kpi', 'd3-devices', 'transitions'];
  stage.innerHTML = `
  <div class="pb-form">
    <label class="pb-f"><span>${T('1 · על מה הסרטון? משפט אחד', '1 · What is the film about? One sentence')}</span><textarea class="pb-story" rows="2">${T('A launch film for "Ketzev", a Hebrew fitness app that turns every workout into a beat.', 'A launch film for "Ketzev", a fitness app that turns every workout into a beat.')}</textarea></label>
    <div class="pb-f"><span>${T('2 · פורמט', '2 · Format')}</span><div class="seg pb-fmt"><button type="button" data-v="h" class="on">16:9</button><button type="button" data-v="v">9:16</button><button type="button" data-v="b">${T('שניהם', 'Both')}</button></div></div>
    <div class="pb-row">
      <label class="pb-f"><span>${T('3 · אורך: ', '3 · Length: ')}<output class="pb-lenO">30</output>${T(' שניות', ' seconds')}</span><input type="range" class="pb-len" min="10" max="60" step="1" value="30"></label>
      <label class="pb-f"><span>${T('4 · קצב המוזיקה: ', '4 · Music tempo: ')}<output class="pb-bpmO">120</output> BPM</span><input type="range" class="pb-bpm" min="80" max="150" step="1" value="120"></label>
    </div>
    <div class="pb-f"><span>${T('5 · שפה על המסך', '5 · On-screen language')}</span><div class="seg pb-lang"><button type="button" data-v="he"${EN ? '' : ' class="on"'}>${T('עברית', 'Hebrew (RTL)')}</button><button type="button" data-v="en"${EN ? ' class="on"' : ''}>English</button></div></div>
    <div class="pb-f"><span>${T('6 · מיתוג', '6 · Branding')}</span><div class="seg pb-brand"><button type="button" data-v="phoenix" class="on">Phoenix (YUV.AI)</button><button type="button" data-v="own">${T('המותג שלי', 'My brand')}</button></div>
      <div class="pb-own" hidden><label>${T('רקע', 'Background')} <input type="color" class="pb-c1" value="#F7F4EE"></label><label>${T('טקסט', 'Text')} <input type="color" class="pb-c2" value="#111111"></label><label>${T('צבע הדגשה', 'Accent')} <input type="color" class="pb-c3" value="#2F6BFF"></label><label>${T('פונט כותרות', 'Headline font')} <input type="text" class="pb-fh" placeholder="${T('למשל Karantina', 'e.g. Anton')}"></label><label>${T('פונט טקסט', 'Body font')} <input type="text" class="pb-fb" placeholder="${T('למשל Assistant', 'e.g. Inter')}"></label></div></div>
    <div class="pb-f"><span>${T('7 · אלמנטים מהקטלוג', '7 · Elements from the catalog')} <output class="pb-n"></output></span>
      ${cats.map(c => `<div class="pb-cat"><b>${EN ? CAT_EN[c] : c}</b>${ELEMENTS.filter(e => e.cat === c).map(e => `<label class="pb-chip"><input type="checkbox" value="${e.id}" ${def.includes(e.id) ? 'checked' : ''}><span>${EN ? NAME_EN[e.id] : e.he}</span></label>`).join('')}</div>`).join('')}
    </div>
  </div>
  <div class="pb-out">
    <div class="pb-stat"></div>
    <div class="code pb-code"><span class="lbl">your prompt · paste into Claude Code</span><button class="cp pb-cp" type="button">${T('העתק פרומפט', 'Copy prompt')}</button><pre class="pb-pre"></pre></div>
  </div>`;
  const $ = s => stage.querySelector(s), $$ = s => [...stage.querySelectorAll(s)];
  const st = { fmt: 'h', lang: EN ? 'en' : 'he', brand: 'phoenix' };
  const seg = (sel, key) => $$(sel + ' button').forEach(b => b.addEventListener('click', () => { $$(sel + ' button').forEach(x => x.classList.toggle('on', x === b)); st[key] = b.dataset.v; if (key === 'brand') $('.pb-own').hidden = st.brand !== 'own'; upd(); }));
  seg('.pb-fmt', 'fmt'); seg('.pb-lang', 'lang'); seg('.pb-brand', 'brand');
  const upd = () => {
    const o = { ...st, story: $('.pb-story').value, len: +$('.pb-len').value, bpm: +$('.pb-bpm').value, els: $$('.pb-chip input:checked').map(i => i.value),
      c1: $('.pb-c1').value, c2: $('.pb-c2').value, c3: $('.pb-c3').value, fh: $('.pb-fh').value, fb: $('.pb-fb').value };
    $('.pb-lenO').textContent = o.len; $('.pb-bpmO').textContent = o.bpm;
    $('.pb-n').textContent = T(`(${o.els.length} נבחרו)`, `(${o.els.length} selected)`);
    const p = buildPrompt(o);
    $('.pb-pre').innerHTML = esc(p).replace(/^(&lt;\/?[a-z]+>)$/gm, '<span class="pb-tag">$1</span>');
    const beats = Math.round(o.len / (60 / o.bpm));
    $('.pb-stat').innerHTML = `<span><b>${beats}</b>${T(' ביטים', ' beats')}</span><span><b>${(60 / o.bpm).toFixed(2)}</b>${T(' שניות לביט', ' s per beat')}</span><span><b>${o.len * 60}</b>${T(' פריימים', ' frames')}</span><span><b>${p.split(/\s+/).length}</b>${T(' מילים בפרומפט', ' words in the prompt')}</span>`;
  };
  stage.addEventListener('input', upd); stage.addEventListener('change', upd);
  $('.pb-cp').addEventListener('click', async () => {
    const b = $('.pb-cp');
    try { await navigator.clipboard.writeText($('.pb-pre').innerText); b.textContent = T('הועתק ✓', 'Copied ✓'); } catch { b.textContent = T('סמנו והעתיקו', 'Select and copy'); }
    setTimeout(() => (b.textContent = T('העתק פרומפט', 'Copy prompt')), 1600);
  });
  upd();
  return { noTime: true };
}
