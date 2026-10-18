# English edition: translation guide (read fully before translating)

You are translating one slice of a Hebrew teaching page into English. The English pages will live on **yuv.ai/motion** (the method page) and **yuv.ai/motion/catalog** (the catalog). The Hebrew originals stay on news.yuv.ai. The author is **Yuval Avidani** (YUV.AI, AI educator, 2× GitHub Star, AWS Gen AI Superstar). Write as Yuval writing his own page, not as a translator.

## The reader
An English-speaking builder or marketer with **zero** background in After Effects or programming. The page's whole promise is: every term is explained where it first appears, every claim comes with its *why*, intuition before formulas. Keep that standard exactly. If the Hebrew explains a term, the English explains it too. Never drop an explanation to save space.

## Voice
- Narrative uses **we / our** ("we spend hours", "our film"). Do not lecture with "you should". Direct UI instructions in the imperative are fine ("Drag the scrubber", "Press Play").
- Natural developer English: scale, benchmark, deploy, repo, render, prompt.
- Yuval's phrases are welcome sparingly: "Here's the thing", "Let's break this down", "Bottom line", "In my view", "Turns out".
- **Banned:** "game-changer", "groundbreaking", "revolutionary", "in the evolving world of AI", "forget everything you knew", "dive into", "unleash", "seamless", "robust", "leverage".
- No em dashes (—) in prose. Use a comma, a colon, parentheses or a new sentence. Hyphens in compound words are fine.
- Short, clear sentences. American spelling (color, center), except keep proper names as they are.

## Adapt, don't transliterate
- The running example is **"Ketzev"**, a fictional Hebrew fitness app. On first mention in a slice write: Ketzev (Hebrew for "rhythm"), a fictional fitness app. After that just "Ketzev".
- Hebrew-specific advice becomes advice for any right-to-left language: "If your film is in Hebrew or Arabic (right-to-left)...". Keep it, shortened, because it is genuinely useful.
- Font advice: on English pages the brand uses **Anton** (uppercase display headlines) and **Inter** (body), JetBrains Mono for code. Where the Hebrew text says "Karantina for headlines / Assistant for text", the English says Anton / Inter, unless the sentence is specifically about Hebrew typography (then keep it as an RTL note).
- Israeli-specific references (e.g. "Channel 12 News") stay, with a short gloss if needed: "Channel 12 News (Israel's leading TV news channel)".
- Numbers: use English number formatting (1,800; 16.7 ms; 60fps).
- Dates: write "September 28, 2026" style.

## Glossary (use these exact English terms)
frame · fps (frames per second) · resolution · aspect ratio · beat · BPM · the drop · beat map · stills · contact sheet · render / rendering · subframes · motion blur · pop scan · seek(t) · pure function · closed-form spring · stiffness · damping · easing (ease-in, ease-out, ease-in-out) · morph · flood · wipe · iris · mask · kinetic typography · component · props · library · package · license · trademark · scrubber (the time bar under each demo) · lab · prompt · the six blocks · art direction · Phoenix palette (YUV.AI brand colors) · catalog · element (on the catalog: a whole building block you can put in a film)
Hebrew → English: פירור → crumb ("crumb by crumb") · מעבדה → lab · יסודות → Foundations · מתי כן / מתי לא → When to use / When not to · מה רואים → What you see · איך זה עובד → How it works · נסו → Try it · פרומפט מלא → Full prompt · העתק פרומפט → Copy prompt · הועתק → Copied · תוכן עניינים → Contents · לעמוד השיטה → The method · קטלוג האלמנטים → Element catalog

## Markup rules (critical: the slice is spliced back into the page by a script)
1. Keep **every** tag, attribute, id, class and nesting exactly. Do not add, remove or reorder elements (one exception below).
2. Translate visible text and these attributes: `data-toc`, `aria-label`, `alt`, `title`, `placeholder`. Translate `data-folio` only if it contains Hebrew.
3. Leave `href`, `src`, `poster`, `data-demo`, `data-variant`, `data-from`, `data-to`, `data-k`, `style` untouched.
4. `<pre>` blocks that are English prompts or code: keep them exactly, **except** Hebrew strings inside them (on-screen text such as "יעד: 60 דקות"): replace with natural English equivalents ("Goal: 60 min"), and adapt Hebrew-only instructions (e.g. "Hebrew in Karantina, right to left") to an English film (Anton for headlines, Inter for text, left to right). Escape `<` and `>` inside `<pre>` as `&lt;` `&gt;` exactly as the source does.
5. Remove invisible direction marks (U+200F, U+200E) from the text.
6. Elements with `class="ltr"` keep the class.
7. Keep HTML entities valid. Output must be well-formed HTML of the same slice.

## The one exception: the article section (slice M2, section id="s3")
The Hebrew page contains a full Hebrew translation of zero's (@twoclipping) English article. Reproducing it in English would reproduce his article, so **do not translate it line by line**. Replace the body of that section with: a short intro (what the article is, who wrote it, when: X, September 28, 2026), then **a summary of each step in our own words** (one short paragraph per step, keeping the step headings), keeping our explanatory glosses of technical terms, and a clear link to the original: https://x.com/twoclipping/status/2104446706741825818 ("Read zero's original article on X"). Do not quote his prompts in that section (they are quoted elsewhere on the page with credit). Keep the section's outer structure (`<section>`, `.sh` header, one `.card`), and you may use `<h3>`, `<p>`, `<ul>`, `<li>` inside the card.

## Output
Write the translated slice to the output path you were given, nothing else in the file. Then reply with: the output path, the number of `<section>` / `<article>` / `<pre>` elements in source vs output (they must match, except M2), and any sentence you were unsure about.
