#!/usr/bin/env python3
"""Build films.html (news.yuv.ai/motion/films): every film made with Claude, in one gallery.

  data   site/films/films.json   sections, titles, descriptions, durations, versions, credits
         site/films/yt.json      YouTube ids per version: {"ep15-h": "xxxxxxxxxxx", ...} (missing id -> card links nowhere yet)
  media  media/films/<id>.mp4    6 s silent loop (640x360 / 360x640 / 480x480), media/films/<id>.jpg poster = its first frame
  out    films.html              hand-off to site/export.py like the other three pages

Usage: python3 site/films/build.py            (then python3 site/export.py --news ../yuvai-newsroom)
"""
import html, json, pathlib, re

ROOT = pathlib.Path(__file__).resolve().parents[2]
HERE = pathlib.Path(__file__).resolve().parent
D = json.loads((HERE / 'films.json').read_text(encoding='utf-8'))
YT = json.loads((HERE / 'yt.json').read_text(encoding='utf-8')) if (HERE / 'yt.json').exists() else {}
F = D['films']
ORDER = [f for s in D['sections'] for f in s['films']]
e = html.escape

LANG = {'he': 'עברית', 'en': 'English', 'en+he': 'English + עברית'}
FMT_LABEL = {'h': '16:9', 'v': '9:16', 's': '1:1', 'hhe': '16:9', 'vhe': '9:16'}


def mmss(s):
    s = int(round(s)); h, s = divmod(s, 3600); m, s = divmod(s, 60)
    return f'{h}:{m:02d}:{s:02d}' if h else f'{m}:{s:02d}'


def dmy(iso):
    y, m, d = iso.split('-'); return f'{int(d)}.{int(m)}.{y}'


def formats(f):
    seen = []
    for k, _ in f['v']:
        lab = FMT_LABEL[k]
        if lab not in seen: seen.append(lab)
    return ' · '.join(seen)


def yt_url(fid, ver):
    i = YT.get(f'{fid}-{ver}')
    return f'https://www.youtube.com/watch?v={i}' if i else None


PLAY = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.6-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5Z"/></svg>'


def card(fid, torah):
    f = F[fid]; ver = f['v'][0][0]; url = yt_url(fid, ver)
    shape = {'h': '', 'v': ' fm-v', 's': ' fm-s'}[f['loop']]
    label = f'צפייה בסרט {f["title"]} ({mmss(f["dur"])})'
    bg = f'<img class="fbg" src="media/films/{fid}.jpg" alt="" loading="lazy" decoding="async">' if f['loop'] != 'h' else ''
    flags = []
    if f.get('silent'): flags.append('<span>בלי סאונד</span>')
    tech = ''.join(f'<code>{e(t)}</code>' for t in f['tech'])
    title_cls = ' class="torah"' if torah else ''
    return f'''
  <article class="fcard" id="f-{fid}">
    <a class="fmedia{shape}" href="{e(url or '#')}" data-film="{fid}" data-ver="{ver}" aria-label="{e(label)}">{bg}
      <video class="floop" muted loop playsinline preload="none" poster="media/films/{fid}.jpg" data-src="media/films/{fid}.mp4" aria-hidden="true" tabindex="-1"></video>
      <span class="fdur">{mmss(f["dur"])}</span><span class="fplay">{PLAY}</span>
    </a>
    <div class="fbody">
      <h3{title_cls}>{e(f["title"])}</h3>
      <p>{e(f["desc"])}</p>
      <div class="fmeta"><span>{dmy(f["date"])}</span><span>{LANG[f["lang"]]}</span><span><bdi dir="ltr">{formats(f)}</bdi></span>{''.join(flags)}</div>
      {f'<div class="ftech">{tech}</div>' if tech else ''}
    </div>
  </article>'''


def section(s):
    cards = ''.join(card(fid, s.get('torah')) for fid in s['films'])
    n = len(s['films'])
    return f'''
<section class="sec {s["surface"]}" id="{s["id"]}" data-folio="{s["num"]}" data-toc="{e(s["title"])}">
  <div class="sh"><span class="num">{s["num"]}</span><div><h2>{e(s["title"])} <small class="cnt">{n} סרטים</small></h2><p class="sub">{e(s["sub"])}</p></div></div>
  <div class="fgrid">{cards}
  </div>
</section>'''


def data_blob():
    out = {}
    for fid in ORDER:
        f = F[fid]
        out[fid] = {'t': f['title'], 'd': f['desc'], 'dur': mmss(f['dur']), 'torah': fid in TORAH,
                    'v': [{'k': k, 'l': l, 'yt': YT.get(f'{fid}-{k}')} for k, l in f['v']]}
    return json.dumps(out, ensure_ascii=False, separators=(',', ':')).replace('</', '<\\/')


TORAH = {fid for s in D['sections'] if s.get('torah') for fid in s['films']}
N = len(ORDER)
TOTAL_MIN = round(sum(F[i]['dur'] for i in ORDER) / 60)
NFMT = len({FMT_LABEL[k] for i in ORDER for k, _ in F[i]['v']})
src = (ROOT / 'dictionary.html').read_text(encoding='utf-8')
FOOTER = re.search(r'<footer>.*?</footer>', src, re.S).group(0)
FONTS = re.search(r'<link href="https://fonts\.googleapis\.com/css2\?[^"]+" rel="stylesheet">', src).group(0)
FONTS = FONTS.replace('&display=swap', '&family=Bona+Nova+SC:wght@400;700&display=swap')
ICON = re.search(r'<link rel="icon"[^>]+>', src).group(0)

credits = ''.join(
    f'<li><a href="{e(c["url"])}" target="_blank" rel="noopener" class="ltr">{e(c["what"])}</a> · {e(c["license"])} · <span>{e(c["where"])}</span></li>'
    for c in D['credits'])

PAGE = f'''<!doctype html>
<html lang="he" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>כל הסרטים · YUV.AI</title>
<meta name="description" content="{N} סרטים שיצרתי עם Claude: סרטי השקה בקוד, סרטי הסבר, תניא ועריכות של צילומים שלי. כל הגרפיקה נכתבה כקוד, בלי After Effects.">
<meta property="og:title" content="כל הסרטים שיצרתי עם Claude">
<meta property="og:description" content="{N} סרטים, {TOTAL_MIN} דקות, אפס After Effects. סרטי השקה, סרטי הסבר, תניא ועריכות על צילום. YUV.AI">
<meta property="og:image" content="https://hoodini.github.io/motion-in-code/media/films/og.jpg">
<meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
{FONTS}
<meta name="theme-color" content="#12163F">
{ICON}
<link rel="stylesheet" href="catalog/site.css">
<style>
.num::after{{content:none}}
.films-hero h1{{font:700 clamp(96px,13vw,210px)/.88 var(--heD);margin:26px 0 22px}}
.films-hero h1 .hl{{display:inline-block;padding:.06em .12em 0;line-height:.88;border-radius:.1em}}
.hstats{{display:flex;flex-wrap:wrap;gap:10px;margin:0 0 28px;padding:0;list-style:none}}
.hstats li{{background:rgba(255,255,255,.84);border-radius:var(--r-s);padding:10px 18px 9px;box-shadow:var(--sh-con);display:flex;flex-direction:column;gap:2px;min-width:104px}}
.hstats b{{font:400 clamp(34px,3.4vw,46px)/1 var(--en);color:var(--yuv-navy);direction:ltr;text-align:right}}
.hstats span{{font:700 19px/1.1 var(--he);color:var(--muted)}}
.hs-sq{{width:40%;aspect-ratio:1;left:4%;bottom:-2%;transform:rotate(-2deg);z-index:2}}
.sh h2 .cnt{{font:700 .3em/1 var(--he);background:var(--fg);color:var(--bg);border-radius:999px;padding:.2em .6em .14em;vertical-align:.55em;white-space:nowrap}}
.s-navy .sh h2 .cnt{{background:var(--yuv-gold);color:var(--yuv-navy)}}
.fgrid{{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,340px),1fr));gap:clamp(16px,2vw,26px);max-width:none}}
.fcard{{background:var(--card);border-radius:var(--r);overflow:hidden;display:flex;flex-direction:column;min-width:0;box-shadow:var(--sh-con);transition:transform .25s,box-shadow .25s}}
.fcard:hover{{transform:translateY(-3px);box-shadow:var(--sh)}}
.fmedia{{position:relative;display:block;aspect-ratio:16/9;background:var(--yuv-navy);overflow:hidden;isolation:isolate;text-decoration:none}}
.fmedia .floop{{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block}}
.fmedia.fm-v .floop,.fmedia.fm-s .floop{{left:50%;right:auto;transform:translateX(-50%);height:100%;width:auto;aspect-ratio:9/16;box-shadow:0 0 40px rgba(5,8,30,.5)}}
.fmedia.fm-s .floop{{aspect-ratio:1}}
.fbg{{position:absolute;inset:-10%;width:120%;height:120%;object-fit:cover;filter:blur(22px) saturate(1.2) brightness(.7);z-index:-1}}
.fdur{{position:absolute;top:12px;inset-inline-end:12px;font:500 14px/1 var(--mono);background:rgba(11,14,42,.78);color:#fff;border-radius:999px;padding:6px 10px 5px;direction:ltr}}
.fplay{{position:absolute;bottom:12px;inset-inline-start:12px;width:54px;height:54px;border-radius:999px;background:#fff;display:grid;place-items:center;box-shadow:var(--sh);transition:transform .2s,background .2s}}
.fplay svg{{width:24px;height:24px;fill:var(--yuv-navy);margin-inline-start:3px}}
.fmedia:hover .fplay,.fmedia:focus-visible .fplay{{transform:scale(1.1);background:var(--yuv-gold)}}
.fmedia:focus-visible{{outline:4px solid var(--yuv-sky-6);outline-offset:-4px}}
.fbody{{padding:16px 20px 18px;display:flex;flex-direction:column;gap:8px;flex:1}}
.fbody h3{{margin:0;font:700 clamp(32px,2.6vw,40px)/1 var(--heD);max-width:none}}
.fbody h3.torah{{font:700 clamp(25px,2vw,30px)/1.15 'Bona Nova SC',serif}}
.fbody p{{margin:0;font:500 18px/1.55 var(--body);color:var(--fg);max-width:none}}
.fmeta{{display:flex;flex-wrap:wrap;gap:6px 14px;margin-top:auto;padding-top:6px;font:600 15px/1.3 var(--body);color:var(--muted)}}
.fmeta span+span::before{{content:"·";margin-inline-end:14px;color:var(--acc-t)}}
.ftech{{display:flex;flex-wrap:wrap;gap:6px}}
.ftech code{{font-size:12.5px;padding:.25em .7em}}
.howto{{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,300px),1fr));gap:16px;max-width:none}}
.howto a{{display:flex;flex-direction:column;gap:6px;background:var(--card);border-radius:var(--r-s);padding:20px 22px;color:var(--fg);text-decoration:none;box-shadow:inset 0 0 0 1.5px rgba(255,255,255,.12)}}
.howto a:hover{{box-shadow:inset 0 0 0 2px var(--yuv-gold);color:var(--fg)}}
.howto b{{font:700 34px/1 var(--heD)}}
.howto span{{font:500 18px/1.5 var(--body);color:var(--muted)}}
.howto small{{font:500 13px var(--mono);color:var(--yuv-gold);direction:ltr;text-align:right}}
.credits{{list-style:none;padding:0;margin:0;display:grid;gap:8px;font:500 17px/1.5 var(--body);color:var(--muted);max-width:none}}
.credits a{{font-weight:600}}
.note{{font:500 17px/1.6 var(--body);color:var(--muted)}}
/* player */
.player{{border:0;padding:0;background:transparent;max-width:100vw;max-height:100vh;width:100vw;height:100vh;margin:0;color:#fff}}
.player::backdrop{{background:rgba(6,8,26,.88);backdrop-filter:blur(6px)}}
.pwrap{{height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;padding:16px}}
.phead{{width:min(1100px,100%);display:flex;align-items:center;gap:14px}}
.phead h3{{margin:0;flex:1;font:700 clamp(30px,3.4vw,46px)/1 var(--heD);color:#fff}}
.phead h3.torah{{font:700 clamp(24px,2.6vw,34px)/1.1 'Bona Nova SC',serif}}
.pclose{{flex:none;width:48px;height:48px;border-radius:999px;border:2px solid rgba(255,255,255,.35);background:transparent;color:#fff;font:700 22px/1 var(--lat);cursor:pointer}}
.pclose:hover,.pclose:focus-visible{{border-color:var(--yuv-gold);color:var(--yuv-gold);outline:none}}
.pframe{{position:relative;background:#000;border-radius:var(--r-s);overflow:hidden;box-shadow:var(--sh)}}
.pframe[data-k="h"],.pframe[data-k="hhe"]{{width:min(1100px,100%,calc((100vh - 230px) * 16 / 9));aspect-ratio:16/9}}
.pframe[data-k="v"],.pframe[data-k="vhe"]{{height:min(calc(100vh - 230px),1000px);aspect-ratio:9/16;max-width:100%}}
.pframe[data-k="s"]{{height:min(calc(100vh - 230px),900px);aspect-ratio:1;max-width:100%}}
.pframe iframe,.pframe video{{position:absolute;inset:0;width:100%;height:100%;border:0;display:block}}
.pver{{display:flex;flex-wrap:wrap;justify-content:center;gap:8px}}
.pver button{{border:2px solid rgba(255,255,255,.3);background:transparent;color:#fff;border-radius:999px;padding:8px 16px;font:700 17px/1 var(--body);cursor:pointer}}
.pver[hidden],.pyt[hidden]{{display:none}}
.pver button[aria-pressed="true"]{{background:#fff;color:var(--yuv-navy);border-color:#fff}}
.pver button:focus-visible{{outline:3px solid var(--yuv-gold);outline-offset:2px}}
.pyt{{color:var(--yuv-gold);font:700 20px/1 var(--he)}}
.pmsg{{position:absolute;inset:auto 0 0 0;padding:14px;text-align:center;font:600 18px/1.4 var(--body);background:rgba(11,14,42,.8)}}
body.pl-open{{overflow:hidden}}
@media (max-width:860px){{.hero-top{{grid-template-columns:1fr;min-height:0}}.films-hero .hero-stage{{max-width:560px;margin:10px auto 0}}}}
@media (max-width:600px){{.fbody h3{{font-size:34px}}.hstats li{{min-width:0;flex:1 1 40%}}.pframe[data-k="v"],.pframe[data-k="vhe"]{{height:calc(100vh - 220px)}}}}
@media (prefers-reduced-motion:reduce){{.fcard,.fplay{{transition:none}}.fcard:hover{{transform:none}}}}
</style>
</head>
<body>
<header class="bar"><div class="wrap">
  <a class="brand" href="index.html" style="text-decoration:none"><span>YUV<b>.</b>AI</span><small>MOTION FILMS</small></a>
  <nav class="pages" aria-label="עמודי המושן"><a href="index.html">השיטה</a><a href="catalog.html">הקטלוג</a><a href="dictionary.html">המילון</a><a href="films.html" aria-current="page">הסרטים</a></nav>
  <button class="navbtn" id="tocBtn" aria-expanded="false" aria-controls="toc" aria-label="תוכן עניינים"><span class="tl">תוכן עניינים</span><svg class="ti" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h10"/></svg></button>
</div><div class="prog" id="prog"></div></header>
<nav class="toc" id="toc" aria-label="תוכן עניינים"></nav>

<main>
<section class="hero films-hero" id="top">
  <div class="hero-top">
    <div class="hero-txt">
      <div class="hkick"><b>YUV.AI · MOTION FILMS</b><i></i></div>
      <h1>כל <span class="hl">הסרטים</span>.</h1>
      <p class="deck">שיצרתי עם Claude, מהראשון ועד האחרון</p>
      <ul class="hstats">
        <li><b>{N}</b><span>סרטים</span></li>
        <li><b>{TOTAL_MIN}</b><span>דקות</span></li>
        <li><b>{NFMT}</b><span>פורמטים</span></li>
        <li><b>0</b><span>After Effects</span></li>
      </ul>
      <a class="hcta neon" href="#f-ep15" data-film="ep15" data-ver="h"><span>▶</span>הסרט שמסביר הכל</a><a class="hcta2" href="index.html">איך זה עובד</a>
    </div>
    <div class="hero-stage">
      <figure class="hshot hs-wide"><video class="hloop" autoplay muted loop playsinline preload="auto" poster="media/films/anatomy.jpg" aria-label="קטע מהסרט ANATOMY//AGENT: מוח תלת־ממדי, כלים ולולאה מעל דף נייר"><source src="media/films/anatomy.mp4" type="video/mp4"></video></figure>
      <figure class="hshot hs-phone"><video class="hloop" autoplay muted loop playsinline preload="auto" poster="media/films/grokbot.jpg" aria-label="קטע מהריל על גרוק בוט: הכותרת עוברת מאחורי הראש שלי"><source src="media/films/grokbot.mp4" type="video/mp4"></video></figure>
    </div>
  </div>
  <p class="lead">כל סרט כאן נוצר בשיחה עם Claude. האנימציה, הכתוביות, הקריינות והסנכרון לביט נכתבו כקוד ורונדרו לווידאו. חלק מהסרטים הם קוד ב-100%, ובחלק הצילום הוא שלי והגרפיקה מעליו בקוד. לוחצים על סרט כדי לצפות בו.</p>
</section>
{''.join(section(s) for s in D['sections'])}

<section class="sec s-navy" id="how" data-folio="?" data-toc="איך עושים את זה">
  <div class="sh"><span class="num">05</span><div><h2>איך עושים את זה</h2><p class="sub">השיטה מפורקת לפירורים, עם קטלוג של אלמנטים מוכנים ומילון של כל המונחים.</p></div></div>
  <div class="howto">
    <a href="index.html"><b>השיטה</b><span>איך Claude מייצר סרטי השקה בקוד: seek(t), קפיצים, מורף, ביט ורינדור, עם הדגמות שרצות בדפדפן.</span><small>motion-in-code</small></a>
    <a href="catalog.html"><b>הקטלוג</b><span>24 אלמנטים חיים, כל אחד עם הסבר מאפס ופרומפט מלא להעתקה, ובונה פרומפטים.</span><small>catalog.html</small></a>
    <a href="dictionary.html"><b>המילון</b><span>איך קוראים לכל רכיב ותנועה בפרומפט, עם משפט מוכן להעתקה.</span><small>dictionary.html</small></a>
  </div>
</section>

<section class="sec s-cloud" id="credits" data-folio="©" data-toc="קרדיטים">
  <div class="sh"><span class="num">06</span><div><h2>קרדיטים</h2><p class="sub">היצירות של אחרים שמופיעות בסרטים ודורשות ייחוס.</p></div></div>
  <ul class="credits">{credits}</ul>
  <p class="note">שאר המוזיקה והאפקטים בסרטי הקוד הם מ-Mixkit (רישיון Mixkit) ומ-Kenney (CC0), או שנוצרו במיוחד לסרט. תמונות של אחרים בסרט "שבעה דורות" מוצגות לפי הרישיון שלהן, ופירוט מלא של כל תמונה ועובדה נמצא בדוח המקורות של הסרט.</p>
</section>

{FOOTER}
</main>
<button id="toTop" type="button" aria-label="חזרה לראש העמוד"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 19V5M5 12l7-7 7 7"/></svg></button>

<dialog class="player" id="player" aria-labelledby="pTitle">
  <div class="pwrap">
    <div class="phead"><h3 id="pTitle"></h3><button class="pclose" type="button" aria-label="סגירה">✕</button></div>
    <div class="pframe" id="pFrame" data-k="h"></div>
    <div class="pver" id="pVer" role="group" aria-label="גרסה"></div>
    <a class="pyt" id="pYt" href="#" target="_blank" rel="noopener">לצפייה ב-YouTube</a>
  </div>
</dialog>
<script type="application/json" id="filmData">{data_blob()}</script>
<script>
(function () {{ /* table of contents, reading progress, back to top (same as the other motion pages) */
  var toc = document.getElementById('toc'), btn = document.getElementById('tocBtn');
  document.querySelectorAll('section[data-toc]').forEach(function (s) {{ var a = document.createElement('a'); a.href = '#' + s.id; a.innerHTML = '<span>' + s.querySelector('.num').textContent + '</span>' + s.dataset.toc; a.addEventListener('click', function () {{ toc.classList.remove('open'); btn.setAttribute('aria-expanded', 'false'); }}); toc.appendChild(a); }});
  btn.addEventListener('click', function () {{ var o = toc.classList.toggle('open'); btn.setAttribute('aria-expanded', o); }});
  var prog = document.getElementById('prog'), top = document.getElementById('toTop'), rm = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var on = function () {{ var h = document.documentElement; prog.style.width = (h.scrollTop / (h.scrollHeight - h.clientHeight) * 100) + '%'; top.classList.toggle('show', h.scrollTop > 900); }};
  window.addEventListener('scroll', on, {{ passive: true }}); on();
  top.addEventListener('click', function () {{ window.scrollTo({{ top: 0, behavior: rm ? 'auto' : 'smooth' }}); }});
}})();
(function () {{ /* live loops: load and play only while a card is on screen; posters only for reduced motion / data saver */
  var rm = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var save = navigator.connection && navigator.connection.saveData;
  if (rm) document.querySelectorAll('.hloop').forEach(function (v) {{ v.removeAttribute('autoplay'); v.pause(); }});
  if (rm || save || !('IntersectionObserver' in window)) return;
  var io = new IntersectionObserver(function (es) {{
    es.forEach(function (e) {{
      var v = e.target;
      if (e.isIntersecting) {{ if (!v.src) v.src = v.dataset.src; var p = v.play(); if (p && p.catch) p.catch(function () {{}}); }}
      else if (v.src) v.pause();
    }});
  }}, {{ rootMargin: '120px 0px', threshold: 0.3 }});
  document.querySelectorAll('.floop').forEach(function (v) {{ io.observe(v); }});
}})();
(function () {{ /* player: YouTube in a dialog, one button per version (16:9 / 9:16 / language) */
  var DATA = JSON.parse(document.getElementById('filmData').textContent);
  var dlg = document.getElementById('player'), frame = document.getElementById('pFrame'), ver = document.getElementById('pVer'),
      title = document.getElementById('pTitle'), yt = document.getElementById('pYt'), opener = null;
  if (!dlg.showModal) return;   /* very old browsers: the card links straight to YouTube */
  function load(id, k) {{
    var f = DATA[id], v = f.v.filter(function (x) {{ return x.k === k; }})[0] || f.v[0];
    frame.dataset.k = v.k; frame.innerHTML = '';
    if (v.yt) {{
      var ifr = document.createElement('iframe');
      ifr.src = 'https://www.youtube-nocookie.com/embed/' + v.yt + '?autoplay=1&rel=0&playsinline=1';
      ifr.title = f.t; ifr.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen'; ifr.allowFullscreen = true;
      frame.appendChild(ifr); yt.href = 'https://www.youtube.com/watch?v=' + v.yt; yt.hidden = false;
    }} else {{
      var lv = document.createElement('video'); lv.muted = true; lv.loop = true; lv.autoplay = true; lv.playsInline = true;
      var card = document.querySelector('#f-' + id + ' .floop'); lv.src = card ? card.dataset.src : ''; lv.poster = card ? card.poster : '';
      frame.appendChild(lv); var m = document.createElement('div'); m.className = 'pmsg'; m.textContent = 'הסרט המלא יעלה לכאן בקרוב'; frame.appendChild(m); yt.hidden = true;
    }}
    ver.querySelectorAll('button').forEach(function (b) {{ b.setAttribute('aria-pressed', String(b.dataset.ver === v.k)); }});
  }}
  function open(id, k, from) {{
    var f = DATA[id]; if (!f) return;
    opener = from; title.textContent = f.t; title.className = f.torah ? 'torah' : '';
    ver.innerHTML = ''; ver.hidden = f.v.length < 2;
    f.v.forEach(function (x) {{ var b = document.createElement('button'); b.type = 'button'; b.textContent = x.l; b.dataset.film = id; b.dataset.ver = x.k; b.addEventListener('click', function () {{ load(id, x.k); }}); ver.appendChild(b); }});
    load(id, k); dlg.showModal(); document.body.classList.add('pl-open');
  }}
  function close() {{ frame.innerHTML = ''; document.body.classList.remove('pl-open'); if (dlg.open) dlg.close(); if (opener) opener.focus(); }}
  document.querySelectorAll('.fmedia[data-film]').forEach(function (a) {{
    a.addEventListener('click', function (ev) {{
      if (ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.button === 1) return;   /* new tab: let YouTube open */
      ev.preventDefault(); open(a.dataset.film, a.dataset.ver, a);
    }});
  }});
  dlg.querySelector('.pclose').addEventListener('click', close);
  dlg.addEventListener('cancel', function (ev) {{ ev.preventDefault(); close(); }});
  dlg.addEventListener('click', function (ev) {{ if (ev.target === dlg || ev.target.classList.contains('pwrap')) close(); }});
  var cta = document.querySelector('.hcta[href="#f-ep15"]');
  if (cta) cta.addEventListener('click', function (ev) {{ ev.preventDefault(); var a = document.querySelector('#f-ep15 .fmedia'); a.scrollIntoView({{ block: 'center' }}); open('ep15', 'h', a); }});
}})();
</script>
</body>
</html>
'''

(ROOT / 'films.html').write_text(PAGE, encoding='utf-8')
missing = [f'{fid}-{k}' for fid in ORDER for k, _ in F[fid]['v'] if f'{fid}-{k}' not in YT]
print(f'films.html: {N} films, {TOTAL_MIN} min, {NFMT} formats, {len(missing)} without a YouTube id')
