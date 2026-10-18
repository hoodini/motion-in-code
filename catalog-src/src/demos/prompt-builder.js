// The prompt builder: start from a preset, pick elements, lay out the scenes on the beat grid, choose how things
// turn into each other, one signature trick and what is banned, and get one complete prompt in zero's six-block
// skeleton. No AI here: it is plain string assembly, so we can read exactly which sentence each choice adds.
// The state lives in the URL hash (#pb=…) when shared, and in localStorage for the viewer's own convenience.
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
    input: '' },
  { id: 'gl-shader', ord: 0, kind: 'background', en: 'the shader background', cat: 'מנועים', he: 'רקע בשיידר (WebGL)',
    dir: 'A full-frame background drawn by one fragment shader (a sky, a sea, marble, a liquid gradient or paper), moving slowly under everything, with fine grain so it never bands.',
    build: 'Raw WebGL2: one triangle that covers the canvas and a GLSL fragment shader, color = f(gl_FragCoord, u_t); u_t is set from seek(t) every frame; create the context with preserveDrawingBuffer: true so the canvas can be captured.',
    gotcha: 'smoothstep(edge0, edge1, x) with edge0 > edge1 is undefined in GLSL; write 1.0 - smoothstep(a, b, x).',
    input: '' },
  { id: 'gpu-particles', ord: 44, en: 'the GPU particles', cat: 'מנועים', he: 'חלקיקים ב-WebGPU',
    dir: '200,000 soft particles that morph between shapes, each particle starting slightly after its neighbour so the morph ripples, ending on my word or logo.',
    build: 'three.js WebGPURenderer from \'three/webgpu\' (it falls back to WebGL 2 by itself); await renderer.init() before the first seek(t). One instanced SpriteNodeMaterial mesh whose positions are computed in TSL from instanceIndex and one morph uniform set from t; no compute pass and no state between frames.',
    gotcha: 'Headless Chrome has no WebGPU by default: launch it with --enable-unsafe-webgpu --enable-features=Vulkan --use-vulkan=swiftshader --use-webgpu-adapter=swiftshader, or accept the WebGL 2 fallback, and log which backend actually ran.',
    input: 'the word or logo the particles should end on' },
  { id: 'map-route', ord: 62, en: 'the delivery map', cat: 'עולם אמיתי', he: 'מפה ומסלול',
    dir: 'A stylised 2D map: a route draws itself, a courier chip rides it while the camera follows, an ETA chip counts down, and the destination pin grows into the brand mark.',
    build: 'Canvas 2D: draw the map once into an offscreen canvas at 2x and only move and scale it per frame; place the courier at distance s(t) along the route (arc length); interpolate the zoom in log space.',
    gotcha: 'Moving the courier by segment index instead of arc length makes it speed up on short segments. Real map tiles need their attribution on screen.',
    input: 'the start and end of the route, and whether the map must show a real place' },
  { id: 'photo-relight', ord: 48, en: 'the photo relight', cat: 'עולם אמיתי', he: 'תמונה: קן ברנס והחלפת תאורה',
    dir: 'A real photo in a rounded card with a slow Ken Burns push; a slider dragged by the cursor relights it from one state to another with a wipe that follows the knob.',
    build: 'Canvas 2D: cover-fit each photo in the card and zoom from 1.07 to 1.2 in log space; clip the second photo to x < knob position and draw a lit leading edge.',
    gotcha: 'The two photos must be aligned pixel for pixel, or the wipe exposes the mismatch.',
    input: 'two aligned photos of the same scene in two states (day and golden hour, before and after)' },
  { id: 'd3-materials', ord: 46, en: 'the material swatches', cat: 'עולם אמיתי', he: 'חומרים וטקסטורות',
    dir: 'Identical spheres in one studio light, each in a different finish (chrome, brushed metal, glass, glazed ceramic, velvet, marble), with the camera gliding from one to the next.',
    build: 'three.js MeshPhysicalMaterial per finish (metalness, roughness, transmission with ior, clearcoat, sheen) with RoomEnvironment reflections; normal maps generated from noise on a canvas.',
    gotcha: 'Metal without an environment map renders almost black, and glass needs something behind it to bend.',
    input: 'the finishes my product comes in' },
  { id: 'd3-model', ord: 66, en: 'the product packshot', cat: 'עולם אמיתי', he: 'מודל אמיתי ותאורת HDRI',
    dir: 'My real product as a glTF model on a turntable, turning a quarter turn on the beat, lit first by a studio and then by an HDRI whose rotation sweeps reflections across it, while a new label wipes across the old one.',
    build: 'GLTFLoader and RGBELoader, both environments pre-filtered once with PMREMGenerator; the label is a CanvasTexture (flipY = false) redrawn from t; the rotation is a sum of springs; optimise the model first with gltf-transform resize and webp.',
    gotcha: 'glTF textures use flipY = false and a CanvasTexture defaults to true, so the label comes out upside down unless you set it.',
    input: 'my product as a glTF/GLB model and my label artwork' }
];
// which drawing engine each element needs: the builder names the stack in <build> and warns about capture
const ENGINE = { 'chart-area': 'react', 'chart-bars': 'react', kpi: 'dom', ring: 'svg', 'ui-scene': 'react', 'icons-draw': 'svg', logos: 'svg', type: 'canvas',
  'd3-devices': 'three', 'd3-glass': 'three', 'd3-particles': 'three', 'd3-ocean': 'three', 'd3-carousel': 'three', 'd3-eq': 'three',
  'fx-neon': 'dom', 'fx-glass': 'dom', 'fx-aurora': 'canvas', transitions: 'canvas', 'gl-shader': 'webgl', 'gpu-particles': 'webgpu',
  'map-route': 'canvas', 'photo-relight': 'canvas', 'd3-materials': 'three', 'd3-model': 'three' };

// motion verbs from the interface dictionary: each one adds a phrase to <direction> and, where it needs one, a build note
export const VERBS = [
  { id: 'morph', he: 'מורף', en: 'Morph', dir: 'buttons morph into cards and pages (size, corner radius and colour interpolate on one element)' },
  { id: 'shared', he: 'אלמנט משותף', en: 'Shared element', dir: 'an object carries its content into the next scene (a shared element)' },
  { id: 'rise', he: 'עולה מקו מסכה', en: 'Rise from a mask line', dir: 'text rises word by word out of a mask line' },
  { id: 'pop', he: 'צץ בקפיץ', en: 'Pop on a spring', dir: 'items pop from zero on a spring with a small overshoot' },
  { id: 'flood', he: 'הצפה וכיווץ', en: 'Flood and contract', dir: 'a colour floods out of one object edge to edge in about 0.35s and later contracts into the next object',
    build: 'Flood radius = distance to the farthest corner x 1.05 x eased progress, about 0.35s; give every layer an explicit z-index.' },
  { id: 'wipe', he: 'מגב', en: 'Wipe', dir: 'wipes with a lit leading edge reveal the next state' },
  { id: 'iris', he: 'צמצם', en: 'Iris', dir: 'a six-blade iris closes over one image and opens onto the next',
    build: 'Iris: 6 blades around a hexagonal aperture; the aperture radius is interpolated in log space.' },
  { id: 'push', he: 'דחיפה', en: 'Push', dir: 'pages push in from the side like iOS navigation' },
  { id: 'goo', he: 'נוזלי (goo)', en: 'Goo', dir: 'shapes merge and pinch apart like liquid',
    build: 'Goo: blur plus an alpha threshold (feGaussianBlur + feColorMatrix), then composite the sharp source on top.' },
  { id: 'squeeze', he: 'אקורדיון', en: 'Accordion squeeze', dir: 'a word squeezes into its own period like an accordion and springs back out' },
  { id: 'typing', he: 'הקלדה אנושית', en: 'Human typing', dir: 'text types on with a real keystroke rhythm',
    build: 'Keystrokes land on 16th notes with small human pauses after words and commas; type on fixed lines so nothing wraps.' },
  { id: 'cursor', he: 'סמן מניע', en: 'Cursor-driven', dir: 'a cursor drives every change with real clicks, drags and long-presses',
    build: 'The cursor path is keyframed like the camera; a click scales it to 0.9 for two frames.' }
];
export const CAMERA = [
  { id: 'pushpull', he: 'דחיפה ומשיכה', en: 'Push in, pull back', dir: 'It opens close on one detail (about 3x) and pulls back once to reveal the whole.' },
  { id: 'studio', he: 'זום שעוקב אחרי הסמן', en: 'Screen-studio zoom', dir: 'The camera zooms screen-studio style to wherever the cursor clicks, and the cursor scales with it.' }
];
export const SIGNATURES = [
  { id: '', he: 'בלי', en: 'None' },
  { id: 'glow', he: 'זוהר סביב תיבת הקלט', en: 'Glow around the input', dir: 'an Apple Intelligence style iridescent glow (a rotating, blurred conic gradient) around the input' },
  { id: 'glass', he: 'זכוכית נוזלית', en: 'Liquid glass', dir: 'iOS 26 liquid glass over the content (an SVG displacement map on a clone of the scene behind it)' },
  { id: 'particles', he: 'הלוגו נבנה מחלקיקים', en: 'Logo from particles', dir: 'the logo assembling out of 200,000 particles' },
  { id: 'shader', he: 'רקע גרדיאנט נוזלי', en: 'Liquid gradient background', dir: 'a slow liquid-gradient shader background in the brand colours' },
  { id: 'reflections', he: 'השתקפויות על המוצר', en: 'Reflections on the product', dir: 'HDRI reflections sweeping across the product' },
  { id: 'custom', he: 'משהו אחר…', en: 'Something else…' }
];
export const BANNED = [
  { id: 'crossfade', he: 'קרוספייד', en: 'Crossfades', txt: 'crossfades' },
  { id: 'blur', he: 'כניסה מטושטשת', en: 'Blur-ins', txt: 'blur-ins' },
  { id: '3d', he: 'תלת-ממד', en: '3D', txt: '3D' },
  { id: 'particles', he: 'חלקיקים זוהרים על שחור', en: 'Glowing particles on black', txt: 'generic glowing particles on black' },
  { id: 'hold', he: 'עצירה של יותר משנייה', en: 'Holds over 1 second', txt: 'holds longer than 1 second' },
  { id: 'reverse', he: 'מצלמה שמשנה כיוון', en: 'Camera reversing', txt: 'camera moves that reverse direction' },
  { id: 'tailwind', he: 'צבעי Tailwind ברירת מחדל', en: 'Default Tailwind colours', txt: 'default Tailwind colours' },
  { id: 'template', he: 'מראה של תבנית', en: 'Template look', txt: 'anything that looks like a template' }
];
const DEF_BANNED = ['crossfade', 'blur', 'particles', 'hold', 'reverse', 'tailwind', 'template'];

const PHOENIX = {
  look: 'navy #12163F for text and dark surfaces; cloud #EEF3FB and denim #AFCBEF for light surfaces; the phoenix fire gradient #FFC74E → #FF8F3A → #F56B49 as the single accent per frame; the clear sky gradient #5EA9F2 → #93CBFF → #DDF0FF for open scenes. Corners are fully round (999px) or 28px, never in between. Shadows are navy and two-layered.',
  fontsHe: 'Hebrew headlines in Karantina 700, Hebrew running text in Assistant 500, English labels in Anton uppercase, numbers in JetBrains Mono',
  fontsEn: 'Headlines in Anton uppercase with letter-spacing 0, body in Inter, numbers in JetBrains Mono'
};
const NAME_EN = { 'chart-area': 'Area chart that draws itself', 'chart-bars': 'Bars that land on the beat', kpi: 'Counting KPIs', ring: 'Progress ring',
  'ui-scene': 'App tour (shadcn/ui)', 'icons-draw': 'Icons that draw themselves', logos: 'Official logos', type: 'Kinetic typography',
  'd3-devices': '3D phone and laptop', 'd3-glass': 'Glass orb', 'd3-particles': 'Particle morph', 'd3-ocean': 'Ocean, day to sunset',
  'd3-carousel': 'Card carousel', 'd3-eq': '3D equalizer', 'fx-neon': 'Neon "AI is thinking" edge', 'fx-glass': 'Glass card',
  'fx-aurora': 'Aurora background', transitions: 'Transitions without fades', 'gl-shader': 'Shader background (WebGL)', 'gpu-particles': 'WebGPU particles',
  'map-route': 'Map and route', 'photo-relight': 'Photo: Ken Burns and relight', 'd3-materials': 'Materials and textures', 'd3-model': 'Real model + HDRI light' };
const CAT_EN = { 'גרפים': 'Charts', 'ממשק': 'Interface', 'אייקונים': 'Icons & logos', 'טיפוגרפיה': 'Typography', 'תלת-ממד': '3D', 'אפקטים': 'Effects', 'מנועים': 'Engines', 'עולם אמיתי': 'Real world' };

// starting points: each fills every field, and everything stays editable
const sc = (name, beats, text = '', el = '', verb = '', drop = false) => ({ name, beats, text, el, verb, drop });
export const PRESETS = [
  { id: 'app', he: 'השקת אפליקציה', en: 'App launch', st: { story: 'A launch film for "Ketzev", a Hebrew fitness app that turns every workout into a beat.', fmt: 'b', bpm: 120, lang: 'he', brand: 'phoenix',
    els: ['fx-neon', 'ui-scene', 'kpi', 'd3-devices', 'transitions'], verbs: ['morph', 'rise', 'pop', 'flood', 'typing', 'cursor'], cam: ['pushpull'], sig: 'glow',
    scenes: [sc('Hook', 4, 'כל אימון הוא ביט.', '', 'rise'), sc('Ask', 6, 'תבנה לי אימון של 20 דקות', 'fx-neon', 'typing'), sc('The app', 10, '', 'ui-scene', 'morph'),
      sc('Progress', 8, '', 'kpi', 'flood', true), sc('Devices', 8, '', 'd3-devices', 'push'), sc('Call to action', 4, 'קצב. להתאמן בקצב.', '', 'flood')] } },
  { id: 'food', he: 'הזמנת אוכל (zero)', en: 'Food order (zero)', st: { story: 'A product launch film for an AI food-ordering assistant: the user types what they crave and gets the perfect dish.', fmt: 'h', bpm: 130, lang: 'en', brand: 'own',
    c1: '#F5F5F2', c2: '#0E0E10', c3: '#CDF24F', fh: 'a serif for the product name', fb: 'Geist',
    els: ['fx-neon', 'ui-scene', 'transitions', 'map-route'], verbs: ['morph', 'shared', 'rise', 'pop', 'flood', 'typing', 'cursor'], cam: ['pushpull'], sig: 'glow',
    scenes: [sc('Ask', 6, "I'm really hungry, I don't know what I want", 'fx-neon', 'typing'), sc('Think', 6, 'Finding something for you…', '', 'morph'),
      sc('The drop: cards', 4, 'Best match', '', 'flood', true), sc('Chat', 5, 'Want me to order it for you?', 'ui-scene', 'shared'), sc('On the way', 11, 'Now it\'s on the way.', 'map-route', 'rise')] } },
  { id: 'product', he: 'מוצר פיזי', en: 'Physical product', st: { story: 'A launch film for a reusable water bottle that keeps drinks cold for 24 hours.', fmt: 'v', bpm: 110, lang: 'en', brand: 'phoenix',
    els: ['gl-shader', 'd3-materials', 'd3-model', 'transitions'], verbs: ['pop', 'wipe', 'rise'], cam: ['pushpull'], sig: 'reflections', unban: ['3d'],
    scenes: [sc('Detail', 6, 'Cold for 24 hours.', '', 'rise'), sc('Finishes', 8, '', 'd3-materials', 'pop'), sc('Packshot', 10, '', 'd3-model', 'wipe', true),
      sc('New label', 6, 'Your colour. Your label.', '', 'wipe'), sc('Call to action', 4, 'Order now', '', 'pop')] } },
  { id: 'data', he: 'סרטון נתונים', en: 'Data explainer', st: { story: 'A 30-second explainer of our quarterly results for the team.', fmt: 'h', bpm: 100, lang: 'he', brand: 'phoenix',
    els: ['type', 'chart-area', 'chart-bars', 'kpi', 'ring'], verbs: ['rise', 'pop', 'wipe'], cam: [], sig: '',
    scenes: [sc('Hook', 4, 'רבעון של שיאים', 'type', 'rise'), sc('Growth', 10, '', 'chart-area', 'wipe'), sc('Week by week', 8, '', 'chart-bars', 'pop', true),
      sc('Numbers', 8, '', 'kpi', 'pop'), sc('The goal', 6, '', 'ring', 'pop'), sc('Thanks', 4, 'תודה לצוות', '', 'rise')] } },
  { id: 'blank', he: 'דף ריק', en: 'Blank', st: { story: '', fmt: 'h', bpm: 120, lang: 'he', brand: 'phoenix', els: [], verbs: ['morph', 'rise', 'pop'], cam: [], sig: '',
    scenes: [sc('Hook', 4, ''), sc('Main', 16, '', '', '', true), sc('Call to action', 4, '')] } }
];

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const FMT = { h: [1920, 1080], v: [1080, 1920], s: [1440, 1440] };

export function buildPrompt(o) {
  const byId = Object.fromEntries(ELEMENTS.map(e => [e.id, e]));
  const els = o.els.map(id => byId[id]).filter(Boolean).sort((a, b) => (a.ord || 99) - (b.ord || 99));
  const spb = 60 / o.bpm;
  const scenes = o.scenes.filter(s => s.beats > 0);
  const beats = scenes.reduce((a, s) => a + s.beats, 0) || Math.round(30 / spb);
  const len = +(beats * spb).toFixed(1);
  const fmt = o.fmt === 'b' ? 'both 1920x1080 (16:9) and 1080x1920 (9:16) from the same seek(t), with a layout that reflows per aspect ratio' : `${FMT[o.fmt].join('x')} (${o.fmt === 'h' ? '16:9' : o.fmt === 'v' ? '9:16' : '1:1'})`;
  const size = o.fmt === 'b' ? '1920x1080 and 1080x1920' : FMT[o.fmt].join('x');
  const look = o.brand === 'phoenix' ? PHOENIX.look : `background ${o.c1}, text ${o.c2}, one accent ${o.c3} (at most one accent per frame).`;
  const fonts = o.brand === 'phoenix' ? (o.lang === 'he' ? PHOENIX.fontsHe : PHOENIX.fontsEn) : `headlines in ${o.fh || 'a bold display font'}, running text in ${o.fb || 'a clean sans'}`;
  const lang = o.lang === 'he' ? 'All on-screen text is Hebrew, right to left (dir="rtl"), with English words and numbers isolated so the order never breaks.' : 'All on-screen text is English.';
  const verbs = VERBS.filter(v => o.verbs.includes(v.id)), cams = CAMERA.filter(c => o.cam.includes(c.id));
  const sig = o.sig === 'custom' ? (o.sigText || '').trim() : (SIGNATURES.find(s => s.id === o.sig) || {}).dir;
  const engines = new Set(els.map(e => ENGINE[e.id]));
  const banned = BANNED.filter(b => o.ban.includes(b.id) && !(b.id === '3d' && (engines.has('three') || engines.has('webgpu')))).map(b => b.txt);
  if (o.banText && o.banText.trim()) banned.push(...o.banText.split(',').map(s => s.trim()).filter(Boolean));
  const inputs = ['a royalty-free song around ' + o.bpm + ' BPM with a clear drop (Mixkit or similar, licensed for commercial use)', ...els.map(e => e.input).filter(Boolean)];
  if (o.brand !== 'phoenix') inputs.push('my logo file');
  const L = [];
  L.push('<inputs>');
  L.push(`Ask me for: ${inputs.join('; ')}. If I skip any, use sensible defaults, tell me which ones you used, and keep going.`);
  L.push('</inputs>', '');
  L.push('<direction>');
  const art = /^(8|1[18](\D|$))/.test(String(len)) ? 'An' : 'A', is3d = engines.has('three') || engines.has('webgpu');
  L.push(`${o.story.trim() || 'A product launch film.'} ${art} ${len}-second film, ${fmt}, 60fps, ${is3d ? '2D with the 3D moments listed below' : '2D only'}, one continuous take.`);
  L.push(`Every scene is made out of the previous one: nothing crossfades, blurs in or cuts. Objects change shape instead: ${verbs.length ? verbs.map(v => v.dir).join('; ') : 'buttons grow into pages, a colour floods out of one object, text rises out of a mask line'}.`);
  L.push(`The camera makes one move per scene on eased keyframes and never zooms in and out back to back.${cams.length ? ' ' + cams.map(c => c.dir).join(' ') : ''}`);
  L.push(`Look: ${look}${sig ? ` One signature trick, and only one: ${sig}.` : ''}`);
  L.push(`Type: ${fonts}. ${lang}`);
  if (els.length) { L.push('Use these exact elements and libraries:'); els.forEach(e => L.push(`- ${e.dir}`)); }
  L.push(`Banned: ${banned.join(', ') || 'anything that looks like a template'}.`);
  L.push('</direction>', '');
  L.push('<structure>');
  L.push(`${o.bpm} BPM, so one beat = ${spb.toFixed(3)}s and the film is ${beats} beats (${len}s). Something visible happens on every beat.`);
  let at = 0; const drop = scenes.find(s => s.drop);
  scenes.forEach((s, i) => {
    const a = at, b = at + s.beats - 1; at += s.beats;
    const el = s.el && byId[s.el], v = s.verb && VERBS.find(x => x.id === s.verb);
    const bits = [];
    if (s.text.trim()) bits.push(`on screen: "${s.text.trim()}"`);
    if (el) bits.push(el.en);
    if (v && i > 0) bits.push(`it is born from the previous scene by: ${v.en.toLowerCase()}`);
    else if (v) bits.push(`it enters by: ${v.en.toLowerCase()}`);
    L.push(`Beats ${a}-${Math.max(a, b)}, ${s.name.trim() || 'scene ' + (i + 1)}${s === drop ? ' (THE DROP lands on its first beat)' : ''}: ${bits.join('; ') || 'one clear idea'}.`);
  });
  els.filter(e => e.kind === 'background').forEach(e => L.push(`Background throughout: ${e.en}, slow and continuous, never competing with the text.`));
  els.filter(e => e.kind === 'between').forEach(e => L.push(`Between scenes, use ${e.en} (flood, morph, wipe, iris), each starting on a downbeat from an object already on screen.`));
  L.push('The last scene lands on the final downbeat. Each scene is born from an object of the scene before it.');
  L.push('</structure>', '');
  L.push('<build>');
  L.push(`One HTML file, ${size}, that exposes window.seek(t). Every frame is computed from t alone: no CSS transitions or keyframe animations, no setTimeout or setInterval, no library auto-animation, no state carried between frames.`);
  L.push('The camera is one transform on a container, keyed [time, zoom, x, y] with eased segments and zoom interpolated in log space.');
  L.push('Motion uses closed-form springs evaluated at t, spring(t) = 1 − e^(−ζωt)·(cos(ω_d·t) + (ζω/ω_d)·sin(ω_d·t)) with ω_d = ω·√(1 − ζ²) and ζ below 1. A value with many targets is the sum of one spring per change, so it stays a pure function of time.');
  const stack = [];
  if (engines.has('react')) stack.push('React for the components that need it (rendered once, then driven from t)');
  if (engines.has('three')) stack.push('three.js WebGLRenderer for 3D');
  if (engines.has('webgpu')) stack.push('three.js WebGPURenderer for the particles, which falls back to WebGL 2 by itself');
  if (engines.has('webgl')) stack.push('raw WebGL2 for the shader background');
  if (stack.length) L.push(`Stack: ${stack.join('; ')}; everything else is DOM and Canvas 2D.`);
  els.forEach(e => L.push(`- ${e.build}`));
  verbs.filter(v => v.build).forEach(v => L.push(`- ${v.build}`));
  L.push('Build a preview page with a scrubber. Render with Playwright at 60fps with 8 subframes per frame blended by ffmpeg tmix for motion blur, place every sound effect (downloaded from Mixkit, never synthesized) so its measured peak lands on its beat, and loudness-normalise to −14 LUFS. Check one frame per beat, then scan for single-frame pops (frame-difference spikes 3x their neighbours).');
  L.push('</build>', '');
  L.push('<gotchas>');
  L.push('- Wait for document.fonts.ready before the first seek(), or the first frames render in a fallback font.');
  L.push('- Give every layer an explicit z-index, or a flood can cover the element it was meant to come from.');
  L.push('- Declare every variable before the first seek() runs.');
  L.push('- 4 subframes leave ghost copies on fast moves; use 8 and slow the move down.');
  if (engines.has('three') || engines.has('webgl')) L.push('- Headless Chrome has no GPU by default; WebGL still runs through SwiftShader, only slower, so budget render time.');
  els.forEach(e => L.push(`- ${e.gotcha}`));
  L.push('</gotchas>', '');
  const pick = [scenes[0], drop, scenes[Math.floor(scenes.length / 2)], scenes[scenes.length - 1]].filter(Boolean);
  const stills = [...new Set(pick)].map(s => s.name.trim() || 'scene').join(', ');
  L.push('<start>');
  L.push(`Ask me for the inputs, then show me the beat map and ${Math.max(1, [...new Set(pick)].length)} stills (${stills || 'hook, drop, main reveal, call to action'}) before you write the full film. Wait for my OK.`);
  L.push('</start>');
  return { text: L.join('\n'), beats, len, engines: [...engines] };
}

// ---------- the UI ----------
const STORE = 'yuv-motion-builder-v2';
const enc = o => { try { return btoa(unescape(encodeURIComponent(JSON.stringify(o)))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); } catch { return ''; } };
const dec = s => { try { return JSON.parse(decodeURIComponent(escape(atob(s.replace(/-/g, '+').replace(/_/g, '/'))))); } catch { return null; } };
function fromPreset(p) {
  const s = JSON.parse(JSON.stringify(p.st));
  return { story: s.story, fmt: s.fmt, bpm: s.bpm, lang: s.lang || (EN ? 'en' : 'he'), brand: s.brand, c1: s.c1 || '#F7F4EE', c2: s.c2 || '#111111', c3: s.c3 || '#2F6BFF', fh: s.fh || '', fb: s.fb || '',
    els: s.els, verbs: s.verbs, cam: s.cam, sig: s.sig, sigText: '', ban: DEF_BANNED.filter(b => !(s.unban || []).includes(b)), banText: '', scenes: s.scenes, preset: p.id };
}

export function mount(stage) {
  stage.classList.add('pb');
  const cats = [...new Set(ELEMENTS.map(e => e.cat))];
  const nm = e => (EN ? NAME_EN[e.id] : e.he);
  let st = null;
  const h = location.hash.match(/[#&]pb=([^&]+)/);
  if (h) st = dec(h[1]);
  if (!st) { try { st = JSON.parse(localStorage.getItem(STORE) || 'null'); } catch { st = null; } }
  if (!st || !Array.isArray(st.scenes)) st = fromPreset(PRESETS[0]);
  const chip = (cls, id, label, on, type = 'checkbox', name = '') => `<label class="pb-chip"><input type="${type}" class="${cls}" value="${id}"${name ? ` name="${name}"` : ''}${on ? ' checked' : ''}><span>${label}</span></label>`;
  stage.innerHTML = `
  <div class="pb-form">
    <div class="pb-f"><span>${T('0 · מתחילים מתבנית', '0 · Start from a preset')}</span><div class="pb-presets">${PRESETS.map(p => `<button type="button" class="pb-pre-b" data-p="${p.id}">${EN ? p.en : p.he}</button>`).join('')}</div></div>
    <label class="pb-f"><span>${T('1 · על מה הסרטון? משפט אחד', '1 · What is the film about? One sentence')}</span><textarea class="pb-story" rows="2"></textarea></label>
    <div class="pb-row">
      <div class="pb-f"><span>${T('2 · פורמט', '2 · Format')}</span><div class="seg pb-fmt"><button type="button" data-v="h">16:9</button><button type="button" data-v="v">9:16</button><button type="button" data-v="s">1:1</button><button type="button" data-v="b">${T('16:9 + 9:16', '16:9 + 9:16')}</button></div></div>
      <div class="pb-f"><span>${T('3 · שפה על המסך', '3 · On-screen language')}</span><div class="seg pb-lang"><button type="button" data-v="he">${T('עברית', 'Hebrew (RTL)')}</button><button type="button" data-v="en">English</button></div></div>
    </div>
    <div class="pb-row">
      <label class="pb-f"><span>${T('4 · קצב: ', '4 · Tempo: ')}<output class="pb-bpmO"></output> BPM</span><input type="range" class="pb-bpm" min="80" max="160" step="1"></label>
      <label class="pb-f"><span>${T('5 · אורך: ', '5 · Length: ')}<output class="pb-lenO"></output>${T(' שניות', ' s')}</span><input type="range" class="pb-len" min="6" max="90" step="1"></label>
    </div>
    <div class="pb-f"><span>${T('6 · מיתוג', '6 · Branding')}</span><div class="seg pb-brand"><button type="button" data-v="phoenix">Phoenix (YUV.AI)</button><button type="button" data-v="own">${T('המותג שלי', 'My brand')}</button></div>
      <div class="pb-own"><label>${T('רקע', 'Background')} <input type="color" class="pb-c1"></label><label>${T('טקסט', 'Text')} <input type="color" class="pb-c2"></label><label>${T('הדגשה', 'Accent')} <input type="color" class="pb-c3"></label><label>${T('פונט כותרות', 'Headline font')} <input type="text" class="pb-fh" placeholder="${T('למשל Karantina', 'e.g. Anton')}"></label><label>${T('פונט טקסט', 'Body font')} <input type="text" class="pb-fb" placeholder="${T('למשל Assistant', 'e.g. Inter')}"></label></div></div>
    <div class="pb-f"><span>${T('7 · אלמנטים מהקטלוג', '7 · Elements from the catalog')} <output class="pb-n"></output></span>
      ${cats.map(c => `<div class="pb-cat"><b>${EN ? CAT_EN[c] : c}</b>${ELEMENTS.filter(e => e.cat === c).map(e => chip('pb-el', e.id, nm(e), false)).join('')}</div>`).join('')}
    </div>
    <div class="pb-f"><span>${T('8 · הסצנות, לפי הסדר', '8 · The scenes, in order')} <output class="pb-sum"></output></span>
      <p class="pb-hint">${T('כל שורה היא סצנה: שם, כמה ביטים, הטקסט על המסך, איזה אלמנט, ואיך היא נולדת מהסצנה הקודמת. סמנו באיזו סצנה נוחת הדרופ.', 'Each row is a scene: a name, how many beats, the on-screen text, which element, and how it is born from the scene before. Mark the scene where the drop lands.')}</p>
      <div class="pb-scenes"></div>
      <div class="pb-acts"><button type="button" class="btn pb-add">+ ${T('סצנה', 'Scene')}</button><button type="button" class="btn o pb-auto">${T('בנו סצנות מהאלמנטים', 'Build scenes from the elements')}</button></div>
    </div>
    <div class="pb-f"><span>${T('9 · איך דברים הופכים זה לזה', '9 · How things become each other')}</span>
      <div class="pb-cat">${VERBS.map(v => chip('pb-verb', v.id, EN ? v.en : v.he, false)).join('')}</div>
      <div class="pb-cat"><b>${T('מצלמה', 'Camera')}</b>${CAMERA.map(c => chip('pb-cam', c.id, EN ? c.en : c.he, false)).join('')}</div>
      <p class="pb-hint">${T('השמות והדוגמאות החיות נמצאים ב', 'Names and live examples are in the ')}<a href="dictionary.html#motion">${T('מילון הממשק', 'interface dictionary')}</a>.</p>
    </div>
    <div class="pb-f"><span>${T('10 · טריק חתימה אחד', '10 · One signature trick')}</span>
      <div class="pb-cat">${SIGNATURES.map(s => chip('pb-sig', s.id, EN ? s.en : s.he, false, 'radio', 'pb-sig')).join('')}</div>
      <input type="text" class="pb-sigT" placeholder="${T('תארו את הטריק במשפט אחד, באנגלית', 'Describe the trick in one sentence')}" hidden>
    </div>
    <div class="pb-f"><span>${T('11 · אסור', '11 · Banned')}</span>
      <div class="pb-cat">${BANNED.map(b => chip('pb-ban', b.id, EN ? b.en : b.he, false)).join('')}</div>
      <input type="text" class="pb-banT" placeholder="${T('עוד דברים אסורים, מופרדים בפסיקים (באנגלית)', 'More banned things, comma separated')}">
    </div>
  </div>
  <div class="pb-out">
    <div class="pb-stat"></div>
    <div class="pb-warn" hidden></div>
    <div class="code pb-code"><span class="lbl">your prompt · paste into Claude Code</span><button class="cp pb-cp" type="button">${T('העתק פרומפט', 'Copy prompt')}</button><pre class="pb-pre"></pre></div>
    <div class="pb-acts"><button type="button" class="btn o pb-link">${T('העתק קישור לפרומפט הזה', 'Copy a link to this prompt')}</button><button type="button" class="btn o pb-dl">${T('הורד כקובץ', 'Download as a file')}</button></div>
  </div>`;
  const $ = s => stage.querySelector(s), $$ = s => [...stage.querySelectorAll(s)];
  const elOpts = () => `<option value="">${T('בלי אלמנט', 'No element')}</option>` + st.els.map(id => { const e = ELEMENTS.find(x => x.id === id); return e ? `<option value="${id}">${esc(nm(e))}</option>` : ''; }).join('');
  const verbOpts = `<option value="">${T('בלי', 'None')}</option>` + VERBS.map(v => `<option value="${v.id}">${esc(EN ? v.en : v.he)}</option>`).join('');
  const drawScenes = () => {
    $('.pb-scenes').innerHTML = st.scenes.map((s, i) => `
      <div class="pb-sc" data-i="${i}">
        <span class="pb-sc-n">${i + 1}</span>
        <input type="text" class="pb-sc-name" value="${esc(s.name)}" aria-label="${T('שם הסצנה', 'Scene name')}" placeholder="${T('שם', 'Name')}">
        <label class="pb-sc-b"><input type="number" class="pb-sc-beats" min="1" max="64" value="${s.beats}" aria-label="${T('ביטים', 'Beats')}"><small>${T('ביטים', 'beats')}</small></label>
        <input type="text" class="pb-sc-text" value="${esc(s.text)}" dir="${st.lang === 'he' ? 'rtl' : 'ltr'}" aria-label="${T('טקסט על המסך', 'On-screen text')}" placeholder="${T('טקסט על המסך', 'On-screen text')}">
        <select class="pb-sc-el" aria-label="${T('אלמנט', 'Element')}">${elOpts()}</select>
        <select class="pb-sc-verb" aria-label="${T('איך היא נולדת', 'How it is born')}">${verbOpts}</select>
        <label class="pb-sc-drop" title="${T('הדרופ נוחת כאן', 'The drop lands here')}"><input type="radio" name="pb-drop" class="pb-sc-dropI"${s.drop ? ' checked' : ''}><span>${T('דרופ', 'Drop')}</span></label>
        <span class="pb-sc-ctl"><button type="button" class="pb-mini" data-a="up" aria-label="${T('למעלה', 'Up')}">↑</button><button type="button" class="pb-mini" data-a="down" aria-label="${T('למטה', 'Down')}">↓</button><button type="button" class="pb-mini" data-a="del" aria-label="${T('מחק', 'Delete')}">✕</button></span>
      </div>`).join('');
    $$('.pb-sc').forEach((row, i) => { row.querySelector('.pb-sc-el').value = st.els.includes(st.scenes[i].el) ? st.scenes[i].el : ''; row.querySelector('.pb-sc-verb').value = st.scenes[i].verb || ''; });
  };
  const paint = () => {   // state → controls
    $('.pb-story').value = st.story; $('.pb-bpm').value = st.bpm;
    $$('.pb-fmt button').forEach(b => b.classList.toggle('on', b.dataset.v === st.fmt));
    $$('.pb-lang button').forEach(b => b.classList.toggle('on', b.dataset.v === st.lang));
    $$('.pb-brand button').forEach(b => b.classList.toggle('on', b.dataset.v === st.brand)); $('.pb-own').hidden = st.brand !== 'own';
    ['c1', 'c2', 'c3', 'fh', 'fb'].forEach(k => { $('.pb-' + k).value = st[k] || ''; });
    $$('.pb-el').forEach(i => { i.checked = st.els.includes(i.value); });
    $$('.pb-verb').forEach(i => { i.checked = st.verbs.includes(i.value); });
    $$('.pb-cam').forEach(i => { i.checked = st.cam.includes(i.value); });
    $$('.pb-sig').forEach(i => { i.checked = i.value === (st.sig || ''); }); $('.pb-sigT').hidden = st.sig !== 'custom'; $('.pb-sigT').value = st.sigText || '';
    $$('.pb-ban').forEach(i => { i.checked = st.ban.includes(i.value); }); $('.pb-banT').value = st.banText || '';
    $$('.pb-pre-b').forEach(b => b.classList.toggle('on', b.dataset.p === st.preset));
    drawScenes();
  };
  let saveT = 0;
  const out = () => {   // state → prompt
    const r = buildPrompt(st);
    $('.pb-pre').innerHTML = esc(r.text).replace(/^(&lt;\/?[a-z]+&gt;)$/gm, '<span class="pb-tag">$1</span>');
    $('.pb-bpmO').textContent = st.bpm; $('.pb-lenO').textContent = Math.round(r.len); $('.pb-len').value = Math.round(r.len);
    $('.pb-n').textContent = T(`(${st.els.length} נבחרו)`, `(${st.els.length} selected)`);
    $('.pb-sum').textContent = T(`(${st.scenes.length} סצנות · ${r.beats} ביטים)`, `(${st.scenes.length} scenes · ${r.beats} beats)`);
    const eng = { react: 'React', dom: 'HTML/CSS', svg: 'SVG', canvas: 'Canvas 2D', three: 'three.js (WebGL)', webgl: 'WebGL2', webgpu: 'WebGPU' };
    $('.pb-stat').innerHTML = `<span><b>${r.beats}</b>${T(' ביטים', ' beats')}</span><span><b>${r.len}</b>${T(' שניות', ' s')}</span><span><b>${Math.round(r.len * 60)}</b>${T(' פריימים', ' frames')}</span><span><b>${r.text.split(/\s+/).length}</b>${T(' מילים', ' words')}</span>` +
      (r.engines.length ? `<span class="pb-eng">${T('מנועים: ', 'Engines: ')}<b dir="ltr">${[...new Set(r.engines.map(e => eng[e]))].join(' · ')}</b></span>` : '');
    const warn = [];
    if (!st.scenes.some(s => s.drop)) warn.push(T('לא סימנתם באיזו סצנה נוחת הדרופ.', 'No scene is marked as the drop.'));
    const unused = st.els.filter(id => { const e = ELEMENTS.find(x => x.id === id); return e && !e.kind && !st.scenes.some(s => s.el === id); });
    if (unused.length) warn.push(T(`אלמנטים שלא שובצו בסצנה: ${unused.map(id => nm(ELEMENTS.find(x => x.id === id))).join(', ')}.`, `Elements not placed in any scene: ${unused.map(id => nm(ELEMENTS.find(x => x.id === id))).join(', ')}.`));
    if (st.ban.includes('3d') && r.engines.some(e => e === 'three' || e === 'webgpu')) warn.push(T('בחרתם אלמנט תלת-ממדי, אז "תלת-ממד" לא ייכנס לרשימת האסור.', 'You picked a 3D element, so "3D" is left out of the banned list.'));
    if (r.engines.includes('webgpu')) warn.push(T('WebGPU: ברינדור על שרת צריך דגלים מיוחדים. הם כבר בפרומפט.', 'WebGPU: rendering on a server needs special flags. They are already in the prompt.'));
    $('.pb-warn').hidden = !warn.length; $('.pb-warn').innerHTML = warn.map(w => `<p>${esc(w)}</p>`).join('');
    clearTimeout(saveT);
    saveT = setTimeout(() => { try { localStorage.setItem(STORE, JSON.stringify(st)); } catch {} }, 300);
  };
  const autoScenes = () => {
    const parts = ELEMENTS.filter(e => st.els.includes(e.id) && !e.kind).sort((a, b) => (a.ord || 99) - (b.ord || 99));
    const mid = Math.floor(parts.length / 2);
    st.scenes = [sc('Hook', 4, '', '', 'rise'), ...parts.map((e, i) => sc(EN ? NAME_EN[e.id] : e.he, 8, '', e.id, i ? 'morph' : 'pop', i === mid)), sc('Call to action', 4, '', '', 'flood')];
    if (!parts.length) st.scenes[0].drop = true;
  };
  // controls → state
  $$('.pb-pre-b').forEach(b => b.addEventListener('click', () => { st = fromPreset(PRESETS.find(p => p.id === b.dataset.p)); paint(); out(); }));
  const seg = (sel, key) => $$(sel + ' button').forEach(b => b.addEventListener('click', () => { st[key] = b.dataset.v; st.preset = ''; paint(); out(); }));
  seg('.pb-fmt', 'fmt'); seg('.pb-lang', 'lang'); seg('.pb-brand', 'brand');
  stage.addEventListener('input', e => {
    const t = e.target, row = t.closest('.pb-sc'), i = row ? +row.dataset.i : -1;
    if (t.classList.contains('pb-story')) st.story = t.value;
    else if (t.classList.contains('pb-bpm')) st.bpm = +t.value;
    else if (t.classList.contains('pb-len')) {   // stretch every scene so the film lands on the new length
      const want = Math.max(st.scenes.length, Math.round(+t.value / (60 / st.bpm))), have = st.scenes.reduce((a, s) => a + s.beats, 0) || 1;
      st.scenes.forEach(s => { s.beats = Math.max(1, Math.round(s.beats * want / have)); }); drawScenes();
    }
    else if (['pb-c1', 'pb-c2', 'pb-c3', 'pb-fh', 'pb-fb'].some(c => t.classList.contains(c))) st[t.className.slice(3)] = t.value;
    else if (t.classList.contains('pb-sigT')) st.sigText = t.value;
    else if (t.classList.contains('pb-banT')) st.banText = t.value;
    else if (i >= 0) {
      const s = st.scenes[i];
      if (t.classList.contains('pb-sc-name')) s.name = t.value;
      if (t.classList.contains('pb-sc-beats')) s.beats = Math.max(1, Math.min(64, +t.value || 1));
      if (t.classList.contains('pb-sc-text')) s.text = t.value;
    } else return;
    out();
  });
  stage.addEventListener('change', e => {
    const t = e.target, row = t.closest('.pb-sc'), i = row ? +row.dataset.i : -1;
    const list = (cls) => $$('.' + cls + ':checked').map(x => x.value);
    if (t.classList.contains('pb-el')) { st.els = list('pb-el'); drawScenes(); }
    else if (t.classList.contains('pb-verb')) st.verbs = list('pb-verb');
    else if (t.classList.contains('pb-cam')) st.cam = list('pb-cam');
    else if (t.classList.contains('pb-sig')) { st.sig = t.value; $('.pb-sigT').hidden = st.sig !== 'custom'; }
    else if (t.classList.contains('pb-ban')) st.ban = list('pb-ban');
    else if (i >= 0) {
      if (t.classList.contains('pb-sc-el')) st.scenes[i].el = t.value;
      if (t.classList.contains('pb-sc-verb')) st.scenes[i].verb = t.value;
      if (t.classList.contains('pb-sc-dropI')) st.scenes.forEach((s, j) => { s.drop = j === i; });
    } else return;
    st.preset = ''; $$('.pb-pre-b').forEach(b => b.classList.remove('on'));
    out();
  });
  stage.addEventListener('click', e => {
    const b = e.target.closest('.pb-mini'); if (!b) return;
    const i = +b.closest('.pb-sc').dataset.i, a = b.dataset.a;
    if (a === 'del' && st.scenes.length > 1) st.scenes.splice(i, 1);
    if (a === 'up' && i > 0) [st.scenes[i - 1], st.scenes[i]] = [st.scenes[i], st.scenes[i - 1]];
    if (a === 'down' && i < st.scenes.length - 1) [st.scenes[i + 1], st.scenes[i]] = [st.scenes[i], st.scenes[i + 1]];
    drawScenes(); out();
  });
  $('.pb-add').addEventListener('click', () => { st.scenes.push(sc(T('סצנה חדשה', 'New scene'), 4)); drawScenes(); out(); });
  $('.pb-auto').addEventListener('click', () => { autoScenes(); drawScenes(); out(); });
  const flash = (b, ok, back) => { b.textContent = ok; setTimeout(() => (b.textContent = back), 1600); };
  const copy = async (txt, b, back) => { try { await navigator.clipboard.writeText(txt); flash(b, T('הועתק ✓', 'Copied ✓'), back); } catch { flash(b, T('סמנו והעתיקו', 'Select and copy'), back); } };
  $('.pb-cp').addEventListener('click', () => copy(buildPrompt(st).text, $('.pb-cp'), T('העתק פרומפט', 'Copy prompt')));
  $('.pb-link').addEventListener('click', () => { const u = location.href.replace(/#.*$/, '') + '#pb=' + enc(st); try { history.replaceState(null, '', u); } catch {} copy(u, $('.pb-link'), T('העתק קישור לפרומפט הזה', 'Copy a link to this prompt')); });
  $('.pb-dl').addEventListener('click', () => {
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([buildPrompt(st).text], { type: 'text/plain' }));
    a.download = (st.story.trim().split(/\s+/).slice(0, 4).join('-').replace(/[^\w֐-׿-]/g, '') || 'motion') + '-prompt.txt'; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  });
  paint(); out();
  return { noTime: true };
}
