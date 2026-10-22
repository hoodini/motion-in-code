#!/usr/bin/env python3
"""Assemble the English edition: index.en.html, catalog.en.html and dictionary.en.html.

The Hebrew pages stay the source of truth for structure, CSS and code. This script copies each one,
swaps the main content for the translated slices in i18n/en/, translates the head, header, footer and
the strings that live inside the page scripts, and links the English pages to each other.
Run it after any change to the Hebrew pages:
  python3 i18n/gen_en_css.py && python3 i18n/gen_dictionary_en.py && python3 i18n/build_en.py
(gen_dictionary_en.py rebuilds i18n/en/D1.html from dictionary.html, which is edited directly.)
"""
import re, sys, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
EN = ROOT / 'i18n' / 'en'
HERO = '<!-- ============ HERO ============ -->'


class Page:
    def __init__(self, name):
        self.name, self.s = name, (ROOT / name).read_text()

    def rep(self, old, new, count=1):
        n = self.s.count(old)
        if n != count:
            sys.exit(f'{self.name}: expected {count}x, found {n}x: {old[:110]!r}')
        self.s = self.s.replace(old, new)

    def sub(self, pattern, new, count=1, flags=re.S):
        s, n = re.subn(pattern, new, self.s, flags=flags)
        if n != count:
            sys.exit(f'{self.name}: regex expected {count}x, found {n}x: {pattern[:110]!r}')
        self.s = s

    def header_en(self):
        # the three-page switch and the language switch in the top bar
        self.sub(r'<nav class="pages" aria-label="עמודי המושן">(.*?)</nav>', lambda m: '<nav class="pages" aria-label="Motion pages">' +
                 m.group(1).replace('>השיטה<', '>Method<').replace('>הקטלוג<', '>Catalog<').replace('>המילון<', '>Dictionary<')
                 .replace('<a href="films.html">הסרטים</a>', '') + '</nav>')   # the films gallery is Hebrew-only for now
        self.sub(r'<a class="lang" href="(\w+)\.en\.html" hreflang="en" lang="en"><span class="ll">English</span><span class="ls">EN</span></a>',
                 r'<a class="lang" href="\1.html" hreflang="he" lang="he"><span class="ll">עברית</span><span class="ls">עב</span></a>')

    def main(self, slices):
        a, b = self.s.index(HERO), self.s.index('<footer>')
        self.s = self.s[:a] + ''.join((EN / f'{k}.html').read_text() for k in slices) + self.s[b:]

    def finish(self, out):
        # English pages link to each other; the language switch points back to the Hebrew page
        self.s = re.sub(r'href="catalog\.html', 'href="catalog.en.html', self.s)
        self.s = re.sub(r'href="index\.html', 'href="index.en.html', self.s)
        self.s = re.sub(r'href="dictionary\.html', 'href="dictionary.en.html', self.s)
        self.s = re.sub(r'<a class="lang" href="(index|catalog|dictionary)\.en\.html"', r'<a class="lang" href="\1.html"', self.s)
        self.s = self.s.replace('‏', '').replace('‎', '')
        left = [m.group(0) for m in re.finditer(r'[^\n]{0,40}[֐-׿][^\n]{0,40}', self.s)
                if 'class="lang"' not in m.group(0) and 'fonts.load' not in m.group(0)]
        (ROOT / out).write_text(self.s)
        print(f'{out}: {len(self.s) // 1024} KB · Hebrew left: {len(left)}')
        for l in left[:12]: print('   ', l.strip()[:120])


# ---------------------------------------------------------------- shared: footer + top bar
FOOT = [
    ('<div class="sig">יובל אבידני</div>', '<div class="sig">Yuval Avidani</div>'),
    ('<p class="bio">מגיש פינת AI בחדשות 12, GitHub Star כפול, AWS Gen AI Superstar, מייסד YUV.AI. בונה, מלמד, ומשגר AI שעובד.</p>',
     '<p class="bio">AI segment host on Channel 12 News (Israel\'s leading TV news channel), 2× GitHub Star, AWS Gen AI Superstar, founder of YUV.AI. Building, teaching and shipping AI that works.</p>'),
    ('<b>הבלוג</b><span>מדריכים, סקירות כלים ופירוקים לעומק, בעברית ובאנגלית.</span>',
     '<b>The blog</b><span>Guides, tool reviews and deep dives, in English and Hebrew.</span>'),
    ('<b>חדר החדשות</b><span>חדר החדשות של YUV.AI: מה חדש בעולם ה-AI, בעברית.</span>',
     '<b>The newsroom</b><span>The YUV.AI newsroom: what is new in AI, in Hebrew.</span>'),
    ('<nav class="links" aria-label="קישורים">', '<nav class="links" aria-label="Links">'),
    ('<button id="toTop" type="button" aria-label="חזרה לראש העמוד">', '<button id="toTop" type="button" aria-label="Back to top">'),
    ('<button class="navbtn" id="tocBtn" aria-expanded="false" aria-controls="toc" aria-label="תוכן עניינים"><span class="tl">תוכן עניינים</span>',
     '<button class="navbtn" id="tocBtn" aria-expanded="false" aria-controls="toc" aria-label="Contents"><span class="tl">Contents</span>'),
    ('<nav class="toc" id="toc" aria-label="תוכן עניינים"></nav>', '<nav class="toc" id="toc" aria-label="Contents"></nav>'),
    ('<html lang="he" dir="rtl">', '<html lang="en" dir="ltr">'),
]

DICT_CARD_HE = '<b>מילון הממשק</b><span>כל רכיב, תנועה ומצלמה מהפרומפטים, חי, עם השם שכותבים בפרומפט.</span>'
DICT_CARD_EN = '<b>The interface dictionary</b><span>Every component, motion and camera rule from the prompts, live, with the name we write in the prompt.</span>'

# ================================================================ index.en.html (the method page)
p = Page('index.html')
p.main(['M1', 'M2', 'M3', 'M4', 'M5'])
for a, b in FOOT: p.rep(a, b)
p.rep('<meta name="description" content="פירוק מלא של שיטת @twoclipping: איך Claude Opus 5.5 מייצר סרטוני השקה ברמת סטודיו בקוד בלבד — seek(t), קפיצים, מצלמה לוגריתמית, ביטים, מושן בלר ובקרת איכות. עם מעבדות אינטראקטיביות אמיתיות.">',
      '<meta name="description" content="A full breakdown of the @twoclipping method: how Claude Opus 5.5 makes studio-grade launch films in code alone. seek(t), springs, a logarithmic camera, beats, motion blur and quality checks, with real interactive labs.">')
p.rep('<meta property="og:title" content="Motion in Code — איך Claude מייצר סרטוני השקה בקוד">',
      '<meta property="og:title" content="Motion in Code: how Claude makes launch films in code">')
p.rep('<meta property="og:description" content="השיטה של @twoclipping, מפורקת לפירורים עם מעבדות אינטראקטיביות. YUV.AI">',
      '<meta property="og:description" content="The @twoclipping method, broken down crumb by crumb, with interactive labs. YUV.AI">')
p.rep('</style>\n</head>', '</style>\n<link rel="stylesheet" href="catalog/en.css">\n</head>')
p.header_en()
p.rep(DICT_CARD_HE, DICT_CARD_EN)
p.rep('<b>קטלוג המושן</b><span>24 אלמנטים חיים עם הסבר מאפס ופרומפט מלא לכל אחד.</span>',
      '<b>The motion catalog</b><span>24 live elements, each explained from zero, with a full prompt.</span>')
p.rep('<p class="credit">כל התוכן והפרומפטים המקוריים שייכים ל-zero (<a href="https://x.com/twoclipping" target="_blank" rel="noopener" class="ltr">@twoclipping</a>). העמוד הזה הוא ניתוח ותרגום לצורכי לימוד. כל המעבדות מחושבות בזמן אמת בדפדפן — אין כאן אף מספר מזויף.</p>',
      '<p class="credit">The original method and prompts belong to zero (<a href="https://x.com/twoclipping" target="_blank" rel="noopener" class="ltr">@twoclipping</a>). This page is an analysis for learning purposes. Every lab is computed live in the browser: there is not a single fake number here.</p>')

# zero's three full prompts live on the Hebrew page next to their Hebrew translations; the English page
# summarizes his article and links to it instead (see GUIDE.md), so those three blocks go.
for k in ('food', 'print', 'ui'):
    p.sub(r'<script type="text/plain" id="P-' + k + r'">.*?</script>\n', '')

# our own prompt: adapt the Hebrew-film instructions to an English film (RTL stays as a short note)
p.rep('the topic and the ONE idea the viewer must leave with, the Hebrew script or my recorded voice-over',
      'the topic and the ONE idea the viewer must leave with, the script or my recorded voice-over')
p.rep('keywords sit on a fire marker block behind navy text, sweeping right-to-left.',
      'keywords sit on a fire marker block behind navy text, sweeping left to right.')
p.rep('Hebrew type is Karantina: Bold for headlines at magazine scale (150-200px at 1080p; it is condensed, so go big), anchored right; Karantina Regular for short captions and labels; Assistant 500-700 for any running text (paragraphs, lists, tables). Torah and Jewish topics use Bona Nova SC instead, for headlines and text (Bold headlines). Gveret Levin only for a handwritten note or a signature. English labels in Anton uppercase; code in JetBrains Mono. Giant Anton folio numerals bleed off the frame. Hebrew is RTL: words enter from the right, numbers and Latin stay LTR inside RTL lines.',
      'Headlines are Anton uppercase at magazine scale (130-170px at 1080p), letter-spacing 0, never negative, anchored left, and only one Anton block per frame; Inter 500-800 for captions, labels and any running text (paragraphs, lists, tables); code and numbers in JetBrains Mono. Giant Anton folio numerals bleed off the frame. If the film is in Hebrew or Arabic (right to left): Karantina Bold for Hebrew headlines and Assistant for running text, words enter from the right, and numbers and Latin stay LTR inside RTL lines.')
p.rep("5. Canvas text sets ctx.direction = 'rtl' for Hebrew; DOM text uses dir=\"rtl\" with <bdi> around Latin and numbers.",
      "5. Text runs left to right. For a right-to-left film (Hebrew, Arabic), canvas text sets ctx.direction = 'rtl' and DOM text uses dir=\"rtl\" with <bdi> around Latin and numbers.")
p.rep('an RTL check that no Hebrew word is reversed, clipped or orphaned,',
      'a type check that no word is clipped or orphaned (and, in a right-to-left film, that no word is reversed),')

# ---- canvas text inside the labs
p.rep("FONT_HE = '\"Karantina\",system-ui,sans-serif'", "FONT_HE = '\"Inter\",system-ui,sans-serif'")
p.rep("FONT_BODY = '\"Karantina\",system-ui,sans-serif'", "FONT_BODY = '\"Inter\",system-ui,sans-serif'")
p.rep("x.font = `700 16px ${FONT_BODY}`; x.direction = 'rtl'; x.textAlign = 'right'; x.fillText(o.title, X + w - 4, Y - 7);",
      "x.font = `700 14px ${FONT_BODY}`; x.textAlign = 'left'; x.fillText(o.title, X + 4, Y - 7);")
p.rep("txt(x, 'שגר', cx, cy + 1, { color: C.ink, font: `700 ${Math.round(32 * cs)}px ${FONT_HE}`, align: 'center', base: 'middle', rtl: true });",
      "txt(x, 'Launch', cx, cy + 1, { color: C.ink, font: `800 ${Math.round(26 * cs)}px ${FONT_HE}`, align: 'center', base: 'middle' });")
# the drop words: Anton, laid out left to right
p.rep("const words = ['בונים.', 'מרנדרים.', 'משיקים.'], times = [4.5, 5.0, 5.5];\n    x.save(); x.font = `700 115px ${FONT_HE}`; x.direction = 'rtl';",
      "const words = ['BUILD.', 'RENDER.', 'SHIP.'], times = [4.5, 5.0, 5.5];\n    x.save(); x.font = `400 96px ${FONT_EN}`; x.direction = 'ltr';")
p.rep("let xr = 640 + tot / 2;", "let xl = 640 - tot / 2;")
p.rep("x.fillStyle = C.ink; x.textAlign = 'right'; x.fillText(w, xr, 400 + dy); xr -= ws[i] + gap;",
      "x.fillStyle = C.ink; x.textAlign = 'left'; x.fillText(w, xl, 400 + dy); xl += ws[i] + gap;")
p.rep("axes(x, X, Y, w, h, { title: 'זמן האנימציה שנתפס בכל פריים',", "axes(x, X, Y, w, h, { title: 'Animation time captured in each frame',")
p.rep("axes(x, X, Y, S, S, { title: 'u (זמן) → התקדמות',", "axes(x, X, Y, S, S, { title: 'u (time) → progress',")
p.rep("title: multi ? 'רוחב = סכום של קפיץ לכל שינוי יעד' : 'רוחב הגלולה לאורך הזמן',", "title: multi ? 'width = one spring per target change, summed' : 'pill width over time',")
p.rep("axes(x, X, Y, w, h, { title: 'המהירות שהעין חווה: d ln(zoom) / dt',", "axes(x, X, Y, w, h, { title: 'Speed the eye feels: d ln(zoom) / dt',")
p.rep("axes(x, X, Y, w, h, { title: 'הפרש ממוצע בין פריים לקודם',", "axes(x, X, Y, w, h, { title: 'Average difference from the previous frame',")
p.rep("axes(x, X, 20, w, 150, { title: 'מהירות המצלמה במורד הדף (חלק ממהירות השיוט)',", "axes(x, X, 20, w, 150, { title: 'Camera speed down the page (share of cruise speed)',")
p.rep("axes(x, X, 200, w, 90, { title: 'מיקום במורד הדף (אינטגרל של המהירות)',", "axes(x, X, 200, w, 90, { title: 'Position down the page (the integral of speed)',")
p.rep("axes(x, X, Y, w, h, { title: 'רדיוס טשטוש (px) לפי מרחק מהעדשה',", "axes(x, X, Y, w, h, { title: 'Blur radius (px) by distance from the lens',")
# liquid tabs: first tab on the left
p.rep("const labels = ['סקירה', 'ביטים', 'קפיצים', 'רינדור'], TW = 215;\n  const edges = k => [860 - (k + 1) * TW + 16, 860 - k * TW - 16];",
      "const labels = ['Overview', 'Beats', 'Springs', 'Render'], TW = 215;\n  const edges = k => [k * TW + 16, (k + 1) * TW - 16];")
p.rep("font: `700 25px ${FONT_HE}`, color: inside ? '#fff' : C.ink, rtl: true });", "font: `700 21px ${FONT_HE}`, color: inside ? '#fff' : C.ink });")
p.rep("k = clamp(Math.floor((860 - px) / TW), 0, 3);", "k = clamp(Math.floor(px / TW), 0, 3);")
# morph vs fade: the button grows into a card whose title sits top-left
p.rep("txt(x, 'פתח', A.x + A.w / 2, A.y + A.h / 2 + 1, { color: '#fff', align: 'center', base: 'middle', font: `700 28px ${FONT_HE}`, rtl: true });",
      "txt(x, 'Open', A.x + A.w / 2, A.y + A.h / 2 + 1, { color: '#fff', align: 'center', base: 'middle', font: `700 22px ${FONT_HE}` });")
p.rep("txt(x, 'פתח', B.x + B.w - 24, B.y + 46, { color: '#fff', align: 'right', font: `700 38px ${FONT_HE}`, rtl: true });",
      "txt(x, 'Open', B.x + 24, B.y + 46, { color: '#fff', align: 'left', font: `700 30px ${FONT_HE}` });")
p.rep("rr(x, B.x + B.w - 24 - l, B.y + 80 + i * 36, l, 16, 999);", "rr(x, B.x + 24, B.y + 80 + i * 36, l, 16, 999);", 2)
p.rep("const fs = lerp(28, 38, e), lx = lerp(A.x + A.w / 2, B.x + B.w - 24, e),", "const fs = lerp(22, 30, e), lx = lerp(A.x + A.w / 2, B.x + 24, e),")
p.rep("txt(x, 'פתח', lx, ly, { color: '#fff', align: e < 0.5 ? 'center' : 'right', base: 'middle', font: `700 ${fs}px ${FONT_HE}`, rtl: true });",
      "txt(x, 'Open', lx, ly, { color: '#fff', align: e < 0.5 ? 'center' : 'left', base: 'middle', font: `700 ${fs}px ${FONT_HE}` });")
p.sub(r"const facts = \{ '130/32'.*?\};", "const facts = { '130/32': 'the food film: 0:15 in the player (14.8 seconds in the prompt) ✓', '120/54': 'the print film: 0:27 in the player ✓', '120/28': 'UI morph: 7 bars × 4 = 28 beats → 0:14 in the player ✓' };")

# ---- §15 anatomy of the prompt
ANAT_EN = r"""const ANAT = [
  ['<inputs>', 'what to ask for before starting', 'A list of materials Claude must ask for, and what to do when some are skipped ("If I skip any, use the defaults").',
    'Without real materials, a model invents them: placeholder images, a generic logo, music that is "roughly right". That is the number one source of the template look. Asking up front turns a guess into real material, and the defaults (in the food prompt: specific dishes from Pexels and a specific Mixkit song) keep the work moving when nobody answers.',
    '"Real footage only, never placeholder cards." · "If I skip any, use the defaults: ... Mixkit \\"Cat Walk\\"."',
    'Claude invents assets, or stops halfway through to ask.'],
  ['<direction>', 'taste: what is allowed and what is banned', 'A format sentence (length, resolution, fps, "2D only", "one continuous take"), a motion grammar ("objects change shape instead"), colors as hex codes, fonts by name, and a Banned list.',
    '"Beautiful" is an infinite space; <code>#f5f5f2</code> and Geist are a single point. The banned list is the strongest part: it deletes exactly the model\'s most statistically likely choices (glow, particles, crossfades, dark backgrounds), the ones zero saw Claude fall back on by default.',
    '"Banned: crossfades, blur-ins, 3D, particles, camera moves that reverse direction, holds longer than 1s, anything that looks like a template."',
    'A dark trailer with neon and particles that "does not look high end".'],
  ['<structure>', 'what happens when, in beats', 'The BPM, the number of beats, and for every beat: what happens and which object it is born from ("the send button grows into an orange wok").',
    'This turns a story into a schedule with numbers we can check. And the phrasing "X grows into Y" forces continuity while writing: there is no way to write a scene without saying which scene it comes from. It is also the spec Claude checks the stills against.',
    '"Beat 12, the drop: a lime circle floods out of the wok edge to edge in about 0.35s."',
    'Random pacing, dead time, and peaks that miss the music.'],
  ['<build>', 'how to build it: the engineering', 'seek(t), closed-form springs, a logarithmic camera, shared elements, sound effects placed by their peak, subframes, a pop scan.',
    'These are the technical decisions that make the taste buildable and checkable. Left to choose, Claude may use CSS transitions or real-time animation, which look fine in a browser but cannot be rendered deterministically. This is the block that holds the "step 1 of motion design" zero says he never learned.',
    '"Every style is computed from time inside seek(t): no CSS transitions, no timers, no state between frames."',
    'Stutter, drift out of sync, and no way to fix one scene without breaking the others.'],
  ['<gotchas>', 'the scars: bugs he already hit', 'A short list of specific failures, with the fix for each one.',
    'Every line here is a fix round saved. Models repeat the same web traps (z-index, will-change blurring text, preserve-3d flattening, http.server without range requests). Written down up front, Claude avoids them in the first draft instead of discovering them in the third render.',
    '"Set z-index on every layer, or the card floats over the flood." · "Declare every variable before the first seek() runs."',
    'The same bugs, every time, after a long render.'],
  ['<start>', 'a cheap approval gate before the expensive work', 'Ask for the inputs → show a beat map + 4 stills → only then write the film.',
    'A still costs seconds; a full render costs long minutes. The gate catches direction mistakes before the expensive stage, and it also forces the model to plan before it writes code (plan → approve → execute), a pattern that improves agent work on long tasks in general.',
    '"Ask me for the inputs, then show me the beat map and 4 stills (ask, drop, chat, outro) before you write the full film."',
    '20 minutes of rendering the wrong idea.']
];"""
p.sub(r'const ANAT = \[\n.*?\n\];', ANAT_EN.replace('\\', '\\\\'))
p.rep("</code> — ${title}</h3><p><b>מה זה:</b> ${what}</p><p><b>למה זה עובד על LLM:</b> ${why}</p>",
      "</code>: ${title}</h3><p><b>What it is:</b> ${what}</p><p><b>Why it works on an LLM:</b> ${why}</p>")
p.rep("<p><b>מה קורה בלעדיו:</b> ${without}</p>", "<p><b>What happens without it:</b> ${without}</p>")

# ---- translations of zero's prompts are a Hebrew-page feature
p.sub(r'const TR = \{\n.*?\n\};', 'const TR = {};')
p.rep("const src = document.getElementById('P-' + k).textContent.trim();",
      "const el = document.getElementById('P-' + k); if (!el) continue; const src = el.textContent.trim();")
p.rep("const tr = document.getElementById('tr-' + k); if (tr) tr.innerHTML = TR[k];",
      "const tr = document.getElementById('tr-' + k); if (tr) tr.remove();")

SOURCES_EN = r"""const SOURCES = [
  ['zero (@twoclipping): How I Make $10K Launch Videos for $0 with Opus 5.5 (Full Course), X, September 28, 2026', 'https://x.com/twoclipping/status/2104446706741825818'],
  ['zero: the viral UI morph post with its prompt, X, September 24, 2026', 'https://x.com/twoclipping/status/2103273003555402193'],
  ['Latent Space · AINews: Opus 5.5 is good at explainer videos (view counts, Terminal-Bench, @rexan_wong)', 'https://www.latent.space/p/ainews-opus-55-is-good-at-explainer'],
  ['João Queirós: How zero Makes Code-Rendered Launch Videos With Opus 5.5 (an independent summary, with a critique of the "$0" claim)', 'https://www.ai.joaoqueiros.com/blog/opus-5-5-code-rendered-launch-video-zero-workflow'],
  ['yihui-dev/awesome-opus5-5-videos: 703 prompts, including zero\'s', 'https://github.com/yihui-dev/awesome-opus5-5-videos'],
  ['zero\'s "beat-synced footage" prompt (3 subframes, preserve-3d)', 'https://github.com/yihui-dev/awesome-opus5-5-videos/blob/main/prompts/twoclipping-000267.md'],
  ['howseen-ai/claude-motion-design: an open-source (MIT) skill for the same method', 'https://github.com/howseen-ai/claude-motion-design'],
  ['BeatAPI (Hugging Face blog): token cost per film (~90K/15K)', 'https://huggingface.co/blog/karmen-beatapi/how-to-make-videos-with-claude-opus-5-5'],
  ['laozhang blog: Claude Opus 5.5 Video Generation: Code In, Rendered MP4 Out (effort high/xhigh)', 'https://blog.laozhang.ai/en/posts/claude-opus-5-5-video-generation'],
  ['claudevideo.org: an index of 1,276 Opus 5.5 films by views', 'https://claudevideo.org/videos'],
  ['Revid: Claude Opus 5.5 motion graphics, ranked (Develop: ~106K views)', 'https://www.revid.ai/claude-motion-graphics'],
  ['Mixkit License: a separate license for each item type', 'https://mixkit.co/license/'],
  ['Pexels License', 'https://www.pexels.com/license/'],
  ['Playwright: Screenshots', 'https://playwright.dev/docs/screenshots'],
  ['FFmpeg Filters Documentation (tmix, loudnorm)', 'https://ffmpeg.org/ffmpeg-filters.html']
];"""
p.sub(r'const SOURCES = \[\n.*?\n\];', SOURCES_EN.replace('\\', '\\\\'))
p.rep("`<li>${t.replace(/</g, '&lt;')} — <a href=", "`<li>${t.replace(/</g, '&lt;')} · <a href=")
p.rep("b.textContent = 'הועתק ✓'; setTimeout(() => b.textContent = 'העתק', 1400);", "b.textContent = 'Copied ✓'; setTimeout(() => b.textContent = 'Copy', 1400);")
p.finish('index.en.html')

# ================================================================ catalog.en.html
c = Page('catalog.html')
c.main(['C1', 'C2', 'C3', 'C3b', 'C3c', 'C4', 'C4b', 'C5'])
for a, b in FOOT: c.rep(a, b)
c.rep('<title>קטלוג המושן · YUV.AI</title>', '<title>Motion Catalog · YUV.AI</title>')
c.rep('<meta name="description" content="קטלוג חי של אבני בניין לסרטוני מושן עם AI: גרפים של Recharts, ממשק shadcn/ui, אייקונים ולוגואים רשמיים, טיפוגרפיה קינטית, תלת-ממד ב-three.js, שיידרים ו-WebGPU, מפות, תמונות וחומרים, ואפקטים. כל אלמנט עם הדגמה חיה, הסבר מאפס ופרומפט מלא.">',
      '<meta name="description" content="A live catalog of building blocks for AI motion films: Recharts charts, shadcn/ui interfaces, official icons and logos, kinetic typography, three.js 3D, shaders and WebGPU, maps, photos and materials, and effects. Every element comes with a live demo, an explanation from zero and a full prompt.">')
c.rep('<meta property="og:title" content="קטלוג המושן: מה אפשר לבקש מ-Claude">', '<meta property="og:title" content="The Motion Catalog: what we can ask Claude for">')
c.rep('<meta property="og:description" content="24 אלמנטים חיים, 9 מושגי יסוד, 24 פרומפטים מלאים ובונה פרומפטים. בלי ידע קודם. YUV.AI">',
      '<meta property="og:description" content="24 live elements, 9 foundations, 24 full prompts and a prompt builder. No prior knowledge needed. YUV.AI">')
c.rep('<link rel="stylesheet" href="catalog/catalog.css">', '<link rel="stylesheet" href="catalog/catalog.css">\n<link rel="stylesheet" href="catalog/en.css">')
c.header_en()
c.rep(DICT_CARD_HE, DICT_CARD_EN)
c.rep('<b>עמוד השיטה</b><span>איך Claude מייצר סרטוני השקה בקוד, מפורק לפירורים.</span>',
      '<b>The method page</b><span>How Claude makes launch films in code, broken down crumb by crumb.</span>')
c.rep('<p class="credit">כל ההדגמות בעמוד הזה רצות בדפדפן שלכם מקוד פתוח: React, Recharts, shadcn/ui, Radix, Lucide, Simple Icons ו-three.js, כל אחת לפי הרישיון שלה. הלוגואים שייכים לבעליהם ומוצגים כדי לציין את הכלים שבהם נבנה העמוד. השיטה והפרומפטים המקוריים שייכים ל-zero (<a href="https://x.com/twoclipping" target="_blank" rel="noopener" class="ltr">@twoclipping</a>).</p>',
      '<p class="credit">Every demo on this page runs in the browser from open-source code: React, Recharts, shadcn/ui, Radix, Lucide, Simple Icons and three.js, each under its own license. The logos belong to their owners and are shown to name the tools this page was built with. The method and the original prompts belong to zero (<a href="https://x.com/twoclipping" target="_blank" rel="noopener" class="ltr">@twoclipping</a>).</p>')
c.finish('catalog.en.html')

# ================================================================ dictionary.en.html
d = Page('dictionary.html')
d.main(['D1'])
for a, b in FOOT: d.rep(a, b)
d.header_en()
d.rep('<title>מילון הממשק · YUV.AI</title>', '<title>Interface Dictionary · YUV.AI</title>')
d.sub(r'<meta name="description" content="[^"]*">', '<meta name="description" content="A live dictionary of interface components, motion verbs and camera moves from the prompts for motion films made with Claude: touch every one, with the name to write in the prompt and a ready-to-copy sentence.">')
d.sub(r'<meta property="og:title" content="[^"]*">', '<meta property="og:title" content="The interface dictionary: what to call it in a prompt">')
d.sub(r'<meta property="og:description" content="[^"]*">', '<meta property="og:description" content="18 interface components, 12 motion verbs and 3 camera rules, live, with the name we write in the prompt. YUV.AI">')
d.rep('<link rel="stylesheet" href="catalog/site.css">', '<link rel="stylesheet" href="catalog/site.css">\n<link rel="stylesheet" href="catalog/en.css">')
d.rep('<b>עמוד השיטה</b><span>איך Claude מייצר סרטוני השקה בקוד, מפורק לפירורים.</span>',
      '<b>The method page</b><span>How Claude makes launch films in code, broken down crumb by crumb.</span>')
d.rep('<b>קטלוג המושן</b><span>24 אלמנטים חיים, כל אחד עם הסבר מאפס ופרומפט מלא.</span>',
      '<b>The motion catalog</b><span>24 live elements, each explained from zero, with a full prompt.</span>')
d.sub(r'<p class="credit">.*?</p>', '<p class="credit">The components on this page are drawn in code, and their motion is computed from a spring formula, just like in the films. The names and catalogs mentioned here belong to their owners. The original method and prompts belong to zero (<a href="https://x.com/twoclipping" target="_blank" rel="noopener" class="ltr">@twoclipping</a>).</p>')
d.finish('dictionary.en.html')
