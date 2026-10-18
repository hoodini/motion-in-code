#!/usr/bin/env python3
"""i18n/en/D1.html: the English main content of the dictionary page, generated from dictionary.html.

The cards' markup, demos and prompt sentences are shared; only the Hebrew prose is swapped, card by card,
in page order (the script checks the order by each card's English term). Run before i18n/build_en.py.
"""
import re, sys, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
src = (ROOT / 'dictionary.html').read_text()
a, b = src.index('<!-- ============ HERO ============ -->'), src.index('<footer>')
s = src[a:b]

# term (checked) -> plain-English gloss, explanation
CARDS = [
 ('Composer · input', 'the message box', 'The field where we type a message, like the bottom of WhatsApp or Claude. Composer is the word for that message box. The colorful glow circling it is the Apple Intelligence style.'),
 ('Chat bubble', 'a sent message', 'The message after it is sent. Our messages sit on one side in a dark color, and the replies sit on the other side in a light one.'),
 ('Pill', 'a fully rounded button', 'A button or label with fully rounded ends. Filled means a solid color; outline means only a border.'),
 ('Cursor · click · long-press · drag', 'the pointer and what it does', 'The mouse pointer that moves the story along. A click is a press, a long-press is a press held down, and a drag moves something while pressed. When the cursor causes every change, the film feels like a real product instead of an animation playing by itself.'),
 ('Card', 'one item in a box', 'A rounded rectangle that holds one item: photo, name, description, price and rating. A row of cards that slides sideways is called a carousel or a strip.'),
 ('Toast', 'a brief pop-up note', 'A short message that pops up for a moment and disappears on its own, like "Saved" or "Sent". It doesn\'t block the screen and doesn\'t need to be closed.'),
 ('Command palette (⌘K)', 'a search-a-command window', 'A search window that opens from a keyboard shortcut. Instead of hunting for an action in menus, we type its name. Try typing "ex" to filter.'),
 ('Dynamic Island', 'the iPhone\'s top pill', 'The black pill at the top of the iPhone screen that expands when something happens: a timer, a call or music. That expanded state is called a live activity. Tap it.'),
 ('Toggle · knob', 'an on/off switch', 'An on/off button. The circle that moves inside it is the knob. Here the knob\'s two edges move on different springs, so it stretches on the way.'),
 ('Slider', 'drag to set a value', 'A track with a handle we drag to pick a value, like volume. Try dragging past the end: the track stretches like rubber, and springs back when we let go.'),
 ('Progress bar · scrub', 'how far along, and dragging through time', 'The bar that shows how much of the song has played. Scrub means dragging the playhead back and forth. The play button turning into pause is a small morph.'),
 ('Tabs · tab indicator', 'pick one of several', 'Several options in a row, and only one is active. The marker that moves between them is the indicator. Its leading edge runs ahead of the trailing one, which reads as liquid.'),
 ('Tooltip', 'hover for details', 'A small bubble that appears when we hover over something and shows one more detail, here the value of each bar. It moves between the bars on a spring.'),
 ('Loader → check', 'working… done', 'A button that shrinks into a spinning circle, a spinner, and then draws a check mark. It is one shape changing itself, with no cut.'),
 ('Bento grid · reflow', 'tiles of different sizes', 'A grid of tiles in different sizes, like a Japanese bento box. Reflow means the tiles rearrange. Each tile travels to its new place on a spring.'),
 ('Phone anatomy', 'the names of a phone\'s parts', 'The words for the parts of a phone: the bezel is the frame, the status bar is the row with the time and battery, the lock screen is the screen before unlocking, and the home bar is the small line at the bottom.'),
 ('Glass toolbar', 'a floating icon bar', 'A row of icons floating over the content. Liquid glass is the iOS 26 glass style: see-through, blurring what is behind it, with a lit edge.'),
 ('Wordmark · brand mark · end card', 'the closing screen', 'A wordmark is a logo that is a word, a brand mark is the symbol, and the end card is the film\'s last screen. Press Play: the word is revealed from behind the mark.'),
 ('Morph', 'one thing becomes another', 'The same object changes its size, corners and color until it becomes something else. Here a button turns into a card and back.'),
 ('Shared element', 'the object carries over', 'An object that crosses into the next scene and carries its content with it. Here the button grows until it is the whole screen, and its label becomes the headline.'),
 ('Rises out of a mask line', 'words rise from a hidden line', 'Words rising out of an invisible line, one word at a time. Below the line they are hidden, so they seem to come out of it.'),
 ('Pop from zero on a spring', 'grows in with a little bounce', 'Items that grow from nothing, go a little past their full size and land, one after another.'),
 ('Flood → contract', 'color fills the screen, then shrinks', 'A color that comes out of one object and covers the whole screen in about 0.35 seconds, then shrinks back into a different object.'),
 ('Wipe', 'a moving edge reveals', 'A reveal by an edge that moves across the screen. Behind the edge is already visible, ahead of it is still hidden. This one has a highlight band on its leading edge.'),
 ('Iris', 'a camera-shutter opening', 'A six-sided opening that closes and opens like a camera shutter. When it is fully closed the content swaps, and when it opens we see a new picture.'),
 ('Push', 'a new page slides in', 'A new page comes in from the side and pushes the previous one out, like opening an item in a list on the iPhone.'),
 ('Goo · liquid', 'shapes merge like drops', 'Two shapes that approach and merge like drops, then stretch and separate. This is how the Dynamic Island "melts" into a new window.'),
 ('Overshoot vs bouncy', 'settle versus bounce', 'Both dots travel the same distance. The first goes slightly past the line and comes back; the second bounces like a ball. zero allows the first and bans the second.'),
 ('Keystroke rhythm', 'typing like a person', 'In the top line every letter appears at exactly the same pace, like a machine. In the bottom one there are small slowdowns and pauses after words and commas, like a person typing.'),
 ('Accordion squeeze', 'letters fold into the dot', 'The letters squeeze into the period at the end of the word, the dot grows into a black pill, and then everything opens back up.'),
 ('Push in · pull back', 'move in, move out', 'We start very close on one detail: that is the push. Then the camera backs away, the pull back, and reveals the whole phone.'),
 ('Screen-studio style zoom', 'the camera follows the clicks', 'The camera zooms in automatically wherever the cursor clicks, and the cursor scales with it. The name comes from Screen Studio, an app that does this in screen recordings.'),
 ('One move per scene', 'one move, then hold', 'In the first frame the camera moves once, smoothly. In the second it zooms in, out and in again, which tires the eye. zero bans the second.'),
]
SRC = {'סרט 1': 'Film 1', 'סרט 2': 'Film 2', 'סרט 3': 'Film 3', 'סרט 1, סרט 2': 'Films 1, 2', 'סרט 2, סרט 3': 'Films 2, 3',
       'סרט 1, סרט 3': 'Films 1, 3', 'כל שלושת הסרטים': 'All three films'}

parts = re.split(r'(<article class="dcard".*?</article>)', s, flags=re.S)
k = 0
for i, part in enumerate(parts):
    if not part.startswith('<article class="dcard"'):
        continue
    term, gloss, text = CARDS[k]
    got = re.search(r'<span class="en">(.*?)</span>', part).group(1).replace('&amp;', '&')
    if got != term:
        sys.exit(f'card {k}: expected {term!r}, found {got!r}')
    part = re.sub(r'<span class="he">.*?</span>', f'<span class="he">{gloss}</span>', part, count=1)
    part = re.sub(r'(<div class="dbody">.*?</h3>\s*)<p>.*?</p>', lambda m: m.group(1) + f'<p>{text}</p>', part, count=1, flags=re.S)
    part = re.sub(r'<div class="dsrc">(.*?)</div>', lambda m: f'<div class="dsrc">{SRC[m.group(1)]}</div>', part)
    part = part.replace('<button class="cp">העתק</button>', '<button class="cp">Copy</button>')
    parts[i] = part
    k += 1
assert k == len(CARDS), (k, len(CARDS))
s = ''.join(parts)

R = [
 ('<h1>איך <span class="hl">קוראים</span> לזה?</h1>', '<h1>What is it <span class="hl">called</span>?</h1>'),
 ('<p class="deck">מילון חי של רכיבי ממשק, תנועות ומצלמה, עם השם שכותבים בפרומפט</p>', '<p class="deck">A live dictionary of interface components, motion and camera, with the name we write in the prompt</p>'),
 ('<span>▶</span>לרכיבים</a>', '<span>▶</span>To the components</a>'),
 ('>לתבנית הפרומפט</a>', '>To the prompt template</a>'),
 ('<p class="lead">כדי לבקש מ-Claude סרטון מושן ברמה של סטודיו, צריך לדעת איך כל דבר נקרא. כל כרטיס כאן מראה רכיב, תנועה או חוק מצלמה מהפרומפטים של zero, חי: אפשר ללחוץ, לגרור ולהקליד. מתחת לכל אחד מופיע השם באנגלית כמו שכותבים אותו בפרומפט, הסבר קצר, משפט מוכן להעתקה, ובאיזה משלושת הסרטים הוא מופיע.</p>',
  '<p class="lead">To ask Claude for a studio-grade motion film, we need to know what everything is called. Every card here shows a component, a motion or a camera rule from zero\'s prompts, live: click it, drag it, type in it. Under each one is the English name as we write it in the prompt, a short explanation, a ready-to-copy sentence, and which of the three films uses it.</p>'),
 ('<div class="dkey"><span>סרט 1 · הזמנת אוכל</span><span>סרט 2 · הדפסת תמונות</span><span>סרט 3 · מורף של ממשק</span></div>',
  '<div class="dkey"><span>Film 1 · food ordering</span><span>Film 2 · photo prints</span><span>Film 3 · UI morph</span></div>'),
 ('data-toc="רכיבי ממשק"', 'data-toc="Interface components"'), ('<h2>רכיבי ממשק</h2>', '<h2>Interface components</h2>'),
 ('<p class="sub">החלקים שמהם בנויות אפליקציות. אפשר ללחוץ, לגרור ולהקליד בכל אחד מהם.</p>', '<p class="sub">The parts apps are built from. Click, drag and type in every one of them.</p>'),
 ('data-toc="פעלי תנועה"', 'data-toc="Motion verbs"'), ('<h2>פעלי תנועה</h2>', '<h2>Motion verbs</h2>'),
 ('<p class="sub">איך דבר אחד הופך לדבר אחר. אלה המילים שאומרות ל-Claude מה מותר לזוז ואיך, ובכל כרטיס יש כפתור Play.</p>', '<p class="sub">How one thing becomes another. These are the words that tell Claude what may move and how, and every card has a Play button.</p>'),
 ('data-toc="מצלמה"', 'data-toc="Camera"'), ('<h2>מצלמה</h2>', '<h2>Camera</h2>'),
 ('<p class="sub">בסרט שנבנה בקוד אין מצלמה אמיתית. "מצלמה" היא הגדלה והזזה של כל הסצנה יחד, ואלה החוקים שלה.</p>', '<p class="sub">A film built in code has no real camera. The "camera" is scaling and moving the whole scene together, and these are its rules.</p>'),
 ('data-toc="איפה למצוא עוד"', 'data-toc="Where to find more"'), ('<h2>איפה למצוא עוד</h2>', '<h2>Where to find more</h2>'),
 ('<p class="sub">קטלוגים של רכיבים שעוזרים לגלות מה קיים ואיך הוא נקרא, לפני שמבקשים מ-Claude.</p>', '<p class="sub">Component catalogs that help us discover what exists and what it is called, before we ask Claude.</p>'),
 ('<span>מילון של 60 רכיבים מ-95 מערכות עיצוב, עם 2,671 דוגמאות אמיתיות. לכל רכיב יש הגדרה, ולחלקם גם שמות חלופיים. המקום הכי טוב לשאלה "איך זה נקרא?".</span>',
  '<span>A dictionary of 60 components from 95 design systems, with 2,671 real examples. Every component has a definition, and some list alternative names. The best place to ask "what is this called?".</span>'),
 ('<span>ספריית רכיבים פתוחה שכוללת יותר מ-60 רכיבים, מ-Accordion ועד Tooltip, לכל אחד עמוד משלו עם קוד. Claude מכיר אותה היטב, והסיור באפליקציה בקטלוג שלנו בנוי ממנה.</span>',
  '<span>An open component library with more than 60 components, from Accordion to Tooltip, each with its own page and code. Claude knows it well, and the app tour in our catalog is built from it.</span>'),
 ('<span>השמות הרשמיים של אפל לרכיבים באייפון ובמק, עם הסבר מתי להשתמש בכל אחד. טוב כשרוצים שהסרט ירגיש כמו מוצר של אפל.</span>',
  '<span>Apple\'s official names for iPhone and Mac components, with guidance on when to use each one. Useful when we want the film to feel like an Apple product.</span>'),
 ('<span>מערכת העיצוב של גוגל: יותר מ-30 רכיבים, עם הסבר על התפקיד של כל אחד.</span>', '<span>Google\'s design system: more than 30 components, with an explanation of each one\'s role.</span>'),
 ('<span>ספרייה של יותר מ-600 אלף מסכים מאפליקציות ואתרים אמיתיים, כולל זרימות ואנימציות. יש הרשמה חינמית ומסלולים בתשלום. טוב כדי לראות איך מוצר אמיתי עושה משהו.</span>',
  '<span>A library of more than 600,000 screens from real apps and websites, including flows and animations. There is a free sign-up and there are paid plans. Useful for seeing how a real product does something.</span>'),
 ('<b dir="rtl" style="direction:rtl;text-align:right">קטלוג המושן</b>', '<b>The motion catalog</b>'),
 ('<span>24 אבני בניין לסרטי מושן בקוד, כל אחת עם הדגמה חיה, הסבר מאפס ופרומפט מלא, ובסוף בונה פרומפטים שמרכיב סרט שלם.</span>',
  '<span>24 building blocks for motion films in code, each with a live demo, an explanation from zero and a full prompt, plus a prompt builder that assembles a whole film.</span>'),
]
for x, y in R:
    if s.count(x) != 1:
        sys.exit(f'{s.count(x)}x: {x[:80]}')
    s = s.replace(x, y)
left = re.findall(r'[֐-׿][^<]{0,30}', s)
if left:
    sys.exit('Hebrew left: ' + ' | '.join(left[:8]))
(ROOT / 'i18n' / 'en' / 'D1.html').write_text(s)
print('i18n/en/D1.html', len(s) // 1024, 'KB')
