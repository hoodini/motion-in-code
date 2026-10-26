#!/usr/bin/env python3
"""Build films.html (news.yuv.ai/motion/films): every film made with Claude, in one gallery. Design: YUV.AI Phoenix Ink (v3).

  data   site/films/films.json        sections, titles, descriptions, durations, versions, credits
  media  media/films/<id>.mp4          6 s silent loop (640x360 / 360x640 / 480x480); media/films/<id>.jpg poster = its first frame
         media/films/full/<id>.mp4     the full film, web copy (H.264 + AAC, faststart). Its aspect decides which version it is.
         media/films/full/<id>-<k>.mp4 an extra version (k from the film's "v" list); <id>he.mp4 = the Hebrew 16:9 (k "hhe")
         media/films/brand/            phoenix mark + wordmark, copied from hoodini/yuv-design-system/assets
  out    films.html                    hand-off to site/export.py like the other three pages (export rewrites media/ to GitHub Pages)

Deep link: /motion/films?film=<id> opens that film in the player (the address bar follows the player, so it can be copied).

Usage: python3 site/films/build.py            (then python3 site/export.py --news ../yuvai-newsroom)
"""
import datetime, html, json, pathlib, subprocess

ROOT = pathlib.Path(__file__).resolve().parents[2]
HERE = pathlib.Path(__file__).resolve().parent
D = json.loads((HERE / 'films.json').read_text(encoding='utf-8'))
F = D['films']
# a film shows up once its loop is in media/films (EP13-15 wait for their files); the list in films.json stays complete
PENDING = [f for s in D['sections'] for f in s['films'] if not (ROOT / 'media' / 'films' / f'{f}.mp4').exists()]
for s in D['sections']: s['films'] = [f for f in s['films'] if f not in PENDING]
ORDER = [f for s in D['sections'] for f in s['films']]
FULL = ROOT / 'media' / 'films' / 'full'
FEATURED = 'wabot'                       # the editor's pick under the hero
HERO_WIDE, HERO_PHONE = 'ep16', 'grokbot'
NEWEST = 'gbopener'                      # the "new in the gallery" link under the CTAs
e = html.escape

LANG = {'he': 'עברית', 'en': 'English', 'en+he': 'English + עברית'}
FMT = {'h': '16:9', 'v': '9:16', 's': '1:1', 'hhe': '16:9', 'vhe': '9:16'}
MK = {'launch': 'השקה', 'explain': 'הסבר', 'tanya': 'תניא', 'footage': 'צילום'}   # the gold-marker word in each section title
BAND = {'launch': 'cloud', 'explain': 'paper', 'tanya': 'night', 'footage': 'cloud'}


def mmss(s):
    s = int(round(s)); h, s = divmod(s, 3600); m, s = divmod(s, 60)
    return f'{h}:{m:02d}:{s:02d}' if h else f'{m}:{s:02d}'


def dmy(iso):
    y, m, d = iso.split('-'); return f'{int(d)}.{int(m)}.{y}'


def formats(f):
    seen = []
    for k, _ in f['v']:
        if FMT[k] not in seen: seen.append(FMT[k])
    return ' · '.join(seen)


def probe(p):
    o = subprocess.run(['ffprobe', '-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height', '-of', 'csv=p=0', str(p)],
                       capture_output=True, text=True, check=True).stdout.strip().split(',')
    return int(o[0]), int(o[1])


def aspect(w, h):
    return 'h' if w > h * 1.05 else 'v' if h > w * 1.05 else 's'


def full_versions(fid):
    """The full-film files that exist for this film, as player versions [{k, l, src}] in the film's own version order."""
    f = F[fid]; label = dict((k, l) for k, l in f['v']); found = {}
    main = FULL / f'{fid}.mp4'
    if main.exists():
        k = aspect(*probe(main)); found[k] = main.name
    for k, _ in f['v']:
        p = FULL / f'{fid}-{k}.mp4'
        if p.exists(): found.setdefault(k, p.name)
    if (FULL / f'{fid}he.mp4').exists(): found.setdefault('hhe', f'{fid}he.mp4')
    order = [k for k, _ in f['v']] + [k for k in found if k not in label]
    return [{'k': k, 'l': label.get(k, FMT[k]), 'src': f'media/films/full/{found[k]}'} for k in order if k in found]


VERS = {fid: full_versions(fid) for fid in ORDER}
HAS_FULL = {fid for fid in ORDER if VERS[fid]}
LATEST = max(F[i]['date'] for i in ORDER)
NEW_FROM = (datetime.date.fromisoformat(LATEST) - datetime.timedelta(days=6)).isoformat()
TORAH = {fid for s in D['sections'] if s.get('torah') for fid in s['films']}
N = len(ORDER)
TOTAL_MIN = round(sum(F[i]['dur'] for i in ORDER) / 60)
SHORTEST = round(min(F[i]['dur'] for i in ORDER)); LONGEST = round(max(F[i]['dur'] for i in ORDER) / 60)

PLAY = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.6-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5Z"/></svg>'


def mark(text, word):
    return e(text).replace(e(word), f'<span class="mk">{e(word)}</span>', 1) if word and word in text else e(text)


def first_ver(fid):
    return (VERS[fid][0]['k'] if VERS[fid] else F[fid]['v'][0][0])


def media(fid, cls='fm', eager=False):
    f = F[fid]; shape = {'h': '', 'v': ' fm-v', 's': ' fm-s'}[f['loop']]
    label = f'צפייה בסרט {f["title"]} ({mmss(f["dur"])})'
    bg = f'<img class="fbg" src="media/films/{fid}.jpg" alt="" loading="lazy" decoding="async">' if f['loop'] != 'h' else ''
    return (f'<a class="{cls}{shape}" href="?film={fid}" data-film="{fid}" data-ver="{first_ver(fid)}" aria-label="{e(label)}">{bg}'
            f'<video class="floop" muted loop playsinline preload="none" poster="media/films/{fid}.jpg" data-src="media/films/{fid}.mp4" aria-hidden="true" tabindex="-1"></video>'
            f'<span class="fdur">{mmss(f["dur"])}</span><span class="fplay">{PLAY}</span></a>')


def meta(f):
    bits = [f'<span>{LANG[f["lang"]]}</span>', f'<span><bdi dir="ltr">{formats(f)}</bdi></span>']
    if f.get('silent'): bits.append('<span>בלי סאונד</span>')
    return ''.join(bits)


def chip(fid):
    f = F[fid]; new = f['date'] >= NEW_FROM
    return f'<span class="chip{" chip-new" if new else ""}">{"חדש · " if new else ""}{dmy(f["date"])}</span>'


def card(fid):
    f = F[fid]; torah = ' class="torah"' if fid in TORAH else ''
    tech = f'<p class="ftech" dir="ltr">{" · ".join(e(t) for t in f["tech"])}</p>' if f['tech'] else ''
    return f'''
    <article class="fc" id="f-{fid}">
      {media(fid)}
      <div class="fb">{chip(fid)}
        <h3{torah}>{e(f["title"])}</h3>
        <p class="fd">{e(f["desc"])}</p>
        <p class="fmeta">{meta(f)}</p>{tech}
      </div>
    </article>'''


def section(s):
    band = BAND.get(s['id'], 'paper'); n = len(s['films'])
    h2cls = 'h2 torah' if s.get('torah') else 'h2'
    return f'''
<section class="sec {band}" id="{s["id"]}" aria-labelledby="h-{s["id"]}">
  <div class="wrap">
    <div class="sec-row">
      <div class="sec-t">
        <span class="kick">{s["num"]} · {n} FILMS</span>
        <h2 class="{h2cls}" id="h-{s["id"]}">{mark(s["title"], MK.get(s["id"]))}</h2>
        <p class="lede">{e(s["sub"])}</p>
      </div>
    </div>
    <div class="grid">{''.join(card(fid) for fid in s['films'])}
    </div>
  </div>
</section>'''


def featured(fid):
    f = F[fid]
    return f'''
<section class="sec paper feat-band" id="featured" aria-labelledby="h-feat">
  <div class="wrap">
    <article class="feat">
      {media(fid, 'fm feat-m', True)}
      <div class="feat-b">
        <span class="chip">מומלץ · {dmy(f["date"])}</span>
        <h2 class="feat-h" id="h-feat">בוט AI רשמי ל<span class="mk">וואטסאפ</span></h2>
        <p class="feat-d">{e(f["desc"])} שלוש דקות, עם קריינות, על כל מה שצריך לדעת לפני שבונים בוט על ה-API הרשמי.</p>
        <p class="fmeta">{meta(f)}<span><bdi dir="ltr">{mmss(f["dur"])}</bdi></span></p>
        <a class="more" href="?film={fid}" data-film="{fid}" data-ver="{first_ver(fid)}">לצפייה בסרט <span class="arrow">←</span></a>
      </div>
    </article>
  </div>
</section>'''


def data_blob():
    out = {}
    for fid in ORDER:
        f = F[fid]
        out[fid] = {'t': f['title'], 'd': f['desc'], 'dur': mmss(f['dur']), 'torah': fid in TORAH, 'loop': f'media/films/{fid}.mp4',
                    'poster': f'media/films/{fid}.jpg', 'shape': f['loop'], 'v': VERS[fid]}
    return json.dumps(out, ensure_ascii=False, separators=(',', ':')).replace('</', '<\\/')


FONTS = ('https://fonts.googleapis.com/css2?family=Karantina:wght@300;400;700&family=Assistant:wght@400;500;600;700;800&family=Anton'
         '&family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;600;700&family=Gveret+Levin&family=Herr+Von+Muellerhoff'
         '&family=Bona+Nova+SC:ital,wght@0,400;0,700;1,400&display=swap')
SOCIALS = [('yuv.ai', 'https://yuv.ai/he'), ('YouTube', 'https://youtube.com/@yuv-ai'), ('Instagram', 'https://instagram.com/yuval_770'),
           ('TikTok', 'https://www.tiktok.com/@yuval.ai'), ('LinkedIn', 'https://www.linkedin.com/in/yuval-avidani-87081474/'),
           ('X', 'https://x.com/yuvalav'), ('GitHub', 'https://github.com/hoodini'), ('Facebook', 'https://facebook.com/yuval.avidani')]
credits = ''.join(
    f'<li><a href="{e(c["url"])}" target="_blank" rel="noopener"><bdi>{e(c["what"])}</bdi></a> · <bdi dir="ltr">{e(c["license"])}</bdi> · <span>{e(c["where"])}</span></li>'
    for c in D['credits'])
socials = ''.join(f'<li><a href="{u}" target="_blank" rel="noopener">{n}</a></li>' for n, u in SOCIALS)
NAV = [('index.html', 'השיטה'), ('catalog.html', 'הקטלוג'), ('dictionary.html', 'המילון'), ('films.html', 'הסרטים')]
links = ''.join(f'<a href="{h}"{" aria-current=\"page\"" if h == "films.html" else ""}>{t}</a>' for h, t in NAV)
fw, fp, fn = F[HERO_WIDE], F[HERO_PHONE], F[NEWEST]

CSS = '''
:root{--paper:#FFFFFF;--cloud:#F7F6FB;--line:#ECEAF4;--ink:#1C1A4B;--ink-2:#4A4870;--muted:#6B6990;
--pink:#FF2EA0;--pink-deep:#C8106F;--pink-wash:#FFF0F7;--pink-line:#F7DCEB;--pink-soft:#FF8FCC;
--gold:linear-gradient(180deg,#FFD66E 0%,#F4B030 100%);--gold-flat:#FFD66E;--night:#0E0D2A;--night-2:#14123A;--night-3:#1C1A4B;
--on-night-2:#CFCDEB;--on-night-3:#A9A6CF;
--f-head:"Karantina","Assistant",sans-serif;--f-body:"Assistant",system-ui,sans-serif;--f-brand:"Anton",sans-serif;--f-en:"Inter","Assistant",sans-serif;
--f-code:"JetBrains Mono",ui-monospace,Menlo,monospace;--f-torah:"Bona Nova SC","Assistant",serif;color-scheme:light}
@property --a{syntax:'<angle>';inherits:false;initial-value:0deg}
@keyframes spin{to{--a:360deg}}
*,*::before,*::after{box-sizing:border-box}
html{-webkit-text-size-adjust:100%;scroll-padding-top:20px}
body{margin:0;background:var(--paper);color:var(--ink);font:500 18px/1.65 var(--f-body);overflow-x:clip}
p,h1,h2,h3,ul,figure{margin:0}
a{color:inherit}
img,video{display:block;max-width:100%}
:focus-visible{outline:2px solid #C8106F;outline-offset:3px;border-radius:6px}
.night :focus-visible,.hero :focus-visible,.foot :focus-visible,.player :focus-visible{outline-color:#FFC74E}
.wrap{max-width:1280px;margin:0 auto;padding-left:max(20px,env(safe-area-inset-left,0px));padding-right:max(20px,env(safe-area-inset-right,0px))}
.skip{position:absolute;inset-inline-start:12px;top:-60px;z-index:20;background:#fff;color:var(--ink);padding:10px 16px;border-radius:999px;font-weight:700}
.skip:focus{top:12px}
.mk{background:var(--gold);color:var(--ink);border-radius:.12em;padding:0 .12em;-webkit-box-decoration-break:clone;box-decoration-break:clone}
.kick{display:block;font:600 13px/1.3 var(--f-code);letter-spacing:.22em;color:var(--muted);direction:ltr;text-align:right}
.chip{display:inline-flex;align-items:center;min-height:30px;padding:0 13px;border-radius:999px;background:var(--pink-wash);color:var(--pink-deep);font:700 14px/1 var(--f-body);justify-self:start;white-space:nowrap}
.chip-new{background:var(--pink);color:#fff}
.more{font:700 17px/1 var(--f-body);color:var(--pink-deep);text-decoration:none;justify-self:start}
.more:hover{text-decoration:underline;text-underline-offset:4px}
.arrow{font-weight:600}
/* buttons */
.glow{position:relative;display:inline-flex;border-radius:999px;isolation:isolate;max-width:100%}
.glow::before,.glow::after{content:"";position:absolute;inset:-3px;border-radius:inherit;background:conic-gradient(from var(--a),#FF2EA0,#FF8F3A,#FFC74E,#8B6CFF,#5DE4E9,#FF2EA0);z-index:-1;animation:spin 6s linear infinite}
.glow::after{inset:-5px;filter:blur(22px);opacity:.8;z-index:-2;transition:opacity .25s}
.glow:hover::after{opacity:1}
.btn{display:inline-flex;align-items:center;gap:12px;min-height:64px;padding:0 42px;border-radius:999px;font:700 21px/1 var(--f-body);white-space:nowrap;text-decoration:none;cursor:pointer;border:0;transition:transform .2s}
.btn:hover{transform:translateY(-1px)}
.btn svg{width:22px;height:22px;fill:currentColor;flex:none}
.btn-primary{background:var(--pink);color:#fff}
.btn-ghost-dark{background:rgba(255,255,255,.04);color:#fff;box-shadow:inset 0 0 0 2px rgba(255,255,255,.3)}
/* hero */
.hero{position:relative;overflow:hidden;isolation:isolate;color:#fff;background:#0B0A24}
.sky{position:absolute;inset:0;z-index:-2;background:
 radial-gradient(42% 60% at 26% 48%,rgba(255,46,160,.17),transparent 70%),
 radial-gradient(36% 50% at 20% 30%,rgba(139,108,255,.16),transparent 70%),
 radial-gradient(110% 55% at 50% 118%,rgba(255,143,58,.20),transparent 62%),
 linear-gradient(180deg,#0A0922 0%,#15133C 100%)}
.sky::after{content:"";position:absolute;inset:0;opacity:.55;background-image:
 radial-gradient(1.2px 1.2px at 8% 14%,#fff,transparent),radial-gradient(1px 1px at 18% 72%,#fff,transparent),radial-gradient(1.4px 1.4px at 31% 22%,#fff,transparent),
 radial-gradient(1px 1px at 44% 9%,#fff,transparent),radial-gradient(1.2px 1.2px at 57% 64%,#fff,transparent),radial-gradient(1px 1px at 66% 18%,#fff,transparent),
 radial-gradient(1.3px 1.3px at 78% 41%,#fff,transparent),radial-gradient(1px 1px at 88% 12%,#fff,transparent),radial-gradient(1.2px 1.2px at 94% 70%,#fff,transparent),
 radial-gradient(1px 1px at 4% 52%,#fff,transparent),radial-gradient(1px 1px at 51% 38%,#fff,transparent),radial-gradient(1.1px 1.1px at 72% 86%,#fff,transparent)}
.nav{display:flex;align-items:center;gap:28px;padding-block:24px;position:relative;z-index:5}
.brand{display:flex;align-items:center;gap:12px;color:#fff;text-decoration:none;flex:none}
.brand img{width:46px;height:46px}
.brand span{font:400 28px/1 var(--f-brand);letter-spacing:.01em}
.brand small{font:600 11.5px/1 var(--f-code);letter-spacing:.2em;color:var(--on-night-3);direction:ltr}
.links{display:flex;gap:28px;margin-inline-start:auto;font:600 17px/1 var(--f-body);color:var(--on-night-2)}
.links a{text-decoration:none;padding-block:8px}
.links a:hover{color:#fff}
.links a[aria-current="page"]{color:#fff;box-shadow:inset 0 -2px 0 var(--pink)}
.pill-dark{display:inline-flex;align-items:center;min-height:46px;padding:0 22px;border-radius:999px;font:700 16px/1 var(--f-body);text-decoration:none;white-space:nowrap;color:#fff;box-shadow:inset 0 0 0 1.5px rgba(255,255,255,.38)}
.pill-dark:hover{background:rgba(255,255,255,.08)}
.burger{display:none;margin-inline-start:auto;width:48px;height:48px;border-radius:999px;border:0;background:rgba(255,255,255,.06);box-shadow:inset 0 0 0 1px rgba(255,255,255,.22);color:#fff;cursor:pointer;place-items:center}
.burger svg{width:22px;height:22px;stroke:currentColor;stroke-width:2.2;stroke-linecap:round;fill:none}
.menu{display:none}
@media(max-width:940px){.links,.nav .pill-dark{display:none}.burger{display:grid}
 .menu{position:absolute;inset-inline:0;top:94px;z-index:6;margin:0 max(20px,env(safe-area-inset-left,0px));padding:10px;border-radius:26px;background:rgba(20,18,58,.96);box-shadow:inset 0 0 0 1px rgba(255,255,255,.14),0 26px 60px rgba(5,4,20,.5);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px)}
 .menu.open{display:grid}
 .menu a{display:flex;align-items:center;min-height:52px;padding:0 18px;border-radius:18px;color:#fff;text-decoration:none;font:700 19px/1 var(--f-body)}
 .menu a:hover,.menu a[aria-current="page"]{background:rgba(255,46,160,.16)}}
.hero-grid{display:grid;grid-template-columns:minmax(0,1.12fr) minmax(0,.88fr);gap:clamp(32px,5vw,80px);align-items:center;padding-block:20px 84px;position:relative;z-index:1}
.hero-text{display:grid;gap:24px;justify-items:start;min-width:0}
.hero .kick{color:var(--on-night-3)}
.hero-h{font:700 clamp(64px,7.8vw,128px)/.98 var(--f-head);color:#fff;text-wrap:balance;text-shadow:0 2px 30px rgba(11,10,36,.6)}
.hero-sub{font:700 clamp(24px,2.3vw,34px)/1.35 var(--f-body);color:#fff;max-width:20em;text-wrap:balance}
.stats{list-style:none;padding:0;display:flex;flex-wrap:wrap;gap:10px}
.stats li{display:flex;align-items:baseline;gap:10px;min-height:52px;padding:6px 18px 4px;border-radius:999px;background:rgba(255,255,255,.06);box-shadow:inset 0 0 0 1px rgba(255,255,255,.16);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px)}
.stats b{font:700 40px/1 var(--f-head);color:var(--gold-flat)}
.stats span{font:600 16px/1 var(--f-body);color:var(--on-night-2)}
.ctas{display:flex;flex-wrap:wrap;gap:16px;align-items:center;padding-top:6px}
.latest{display:inline-flex;align-items:center;gap:12px;max-width:100%;min-width:0;padding-block:8px;padding-inline:8px 18px;border-radius:999px;background:rgba(255,255,255,.06);box-shadow:inset 0 0 0 1px rgba(255,255,255,.16);color:#fff;text-decoration:none;font:600 16px/1.3 var(--f-body)}
.latest img{width:64px;height:36px;object-fit:cover;border-radius:999px;flex:none}
.latest b{color:var(--pink-soft);font-weight:700;white-space:nowrap}
.latest span{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.latest:hover{background:rgba(255,255,255,.1)}
.hv{position:relative;min-width:0;aspect-ratio:1/0.92}
.hv figure{position:absolute;overflow:hidden;background:var(--night-2)}
.hv video{width:100%;height:100%;object-fit:cover}
.hw{top:4%;inset-inline-start:0;width:88%;aspect-ratio:16/9;border-radius:30px;box-shadow:0 0 0 1px rgba(255,255,255,.1),0 40px 90px rgba(5,4,20,.65)}
.hp{bottom:0;inset-inline-end:0;width:34%;aspect-ratio:9/16;border-radius:30px;box-shadow:0 0 0 4px var(--night),0 0 0 6px rgba(255,46,160,.55),0 40px 90px rgba(5,4,20,.7)}
.hv figcaption{position:absolute;bottom:12px;inset-inline-start:12px;font:600 12px/1 var(--f-code);letter-spacing:.12em;color:#fff;background:rgba(14,13,42,.62);border-radius:999px;padding:7px 11px;direction:ltr;-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px)}
@media(max-width:980px){.hero-grid{grid-template-columns:minmax(0,1fr);padding-block:8px 64px}.hv{max-width:640px;width:100%;margin-inline:auto}}
/* bands */
.sec{padding-block:clamp(64px,7vw,104px)}
.paper{background:var(--paper)}
.cloud{background:var(--cloud)}
.night{background:var(--night-2);color:#fff}
.sec-row{display:flex;flex-wrap:wrap;align-items:end;justify-content:space-between;gap:12px 24px;margin-bottom:40px}
.sec-t{display:grid;gap:10px;min-width:0}
.h2{font:700 clamp(56px,6vw,96px)/1 var(--f-head);color:var(--ink);text-wrap:balance}
.h2.torah{font:700 clamp(42px,4.4vw,70px)/1.12 var(--f-torah)}
.lede{font:500 clamp(18px,1.5vw,21px)/1.6 var(--f-body);color:var(--ink-2);max-width:40em;text-wrap:pretty}
.night .h2{color:#fff}
.night .lede{color:var(--on-night-2)}
.night .kick{color:var(--on-night-3)}
/* cards */
.grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:28px}
@media(max-width:980px){.grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:22px}}
@media(max-width:640px){.grid{grid-template-columns:minmax(0,1fr)}}
.fc{display:grid;align-content:start;gap:16px;background:#fff;border-radius:30px;padding:10px 10px 22px;border:1px solid var(--pink-line);box-shadow:0 18px 40px rgba(255,46,160,.07);transition:transform .25s,box-shadow .25s;min-width:0}
.fc:hover{transform:translateY(-4px);box-shadow:0 0 0 1px rgba(255,46,160,.28),0 26px 54px rgba(255,46,160,.16)}
.fm{position:relative;display:block;aspect-ratio:16/9;border-radius:22px;overflow:hidden;background:var(--night-2);isolation:isolate;text-decoration:none}
.fm .floop{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;transition:transform .5s}
.fc:hover .fm:not(.fm-v):not(.fm-s) .floop{transform:scale(1.03)}
.fm-v .floop,.fm-s .floop{left:50%;right:auto;transform:translateX(-50%);width:auto;aspect-ratio:9/16;box-shadow:0 0 40px rgba(5,4,20,.5)}
.fm-s .floop{aspect-ratio:1}
.fbg{position:absolute;inset:-10%;width:120%;height:120%;object-fit:cover;filter:blur(22px) saturate(1.2) brightness(.6);z-index:-1}
.fdur{position:absolute;top:12px;inset-inline-end:12px;font:600 13px/1 var(--f-code);color:#fff;background:rgba(14,13,42,.72);border-radius:999px;padding:7px 10px;direction:ltr;-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px)}
.fplay{position:absolute;bottom:12px;inset-inline-start:12px;width:54px;height:54px;border-radius:50%;display:grid;place-content:center;background:var(--pink);box-shadow:0 0 0 7px rgba(255,46,160,.22),0 0 26px rgba(255,46,160,.5);transition:transform .2s}
.fplay svg{width:22px;height:22px;fill:#fff;margin-left:3px}
.fm:hover .fplay,.fm:focus-visible .fplay{transform:scale(1.08)}
.fm:focus-visible{outline:3px solid #FFC74E;outline-offset:-3px}
.fb{display:grid;gap:10px;justify-items:start;padding:0 14px;min-width:0}
.fb h3{font:700 22px/1.3 var(--f-body);color:var(--ink);text-wrap:balance}
.fb h3.torah{font:700 22px/1.35 var(--f-torah)}
.fd{font:500 16.5px/1.6 var(--f-body);color:var(--ink-2);text-wrap:pretty}
.fmeta{display:flex;flex-wrap:wrap;gap:4px 12px;font:500 15px/1.3 var(--f-body);color:var(--muted)}
.fmeta span+span::before{content:"·";margin-inline-end:12px;color:var(--pink)}
.ftech{font:500 12.5px/1.4 var(--f-code);color:var(--muted);letter-spacing:.02em;justify-self:start}
/* the night band: video tiles, no white cards */
.night .fc{background:transparent;border:0;box-shadow:none;padding:0;gap:14px}
.night .fc:hover{box-shadow:none}
.night .fm{box-shadow:0 0 0 1px rgba(255,255,255,.1),0 20px 44px rgba(0,0,0,.35)}
.night .fb{padding:0 4px}
.night .fb h3{color:#fff}
.night .fd{color:var(--on-night-2)}
.night .fmeta,.night .ftech{color:var(--on-night-3)}
.night .chip{background:rgba(255,255,255,.08);color:var(--pink-soft);box-shadow:inset 0 0 0 1px rgba(255,143,204,.3)}
/* editor's pick */
.feat{display:grid;grid-template-columns:minmax(0,1.15fr) minmax(0,1fr);gap:clamp(24px,4vw,56px);align-items:center;background:#fff;border:1px solid var(--pink-line);border-radius:34px;padding:12px;box-shadow:0 18px 40px rgba(255,46,160,.07)}
.feat .fm{border-radius:24px}
.feat .fplay{width:72px;height:72px;bottom:16px;inset-inline-start:16px}
.feat .fplay svg{width:28px;height:28px}
.feat-b{display:grid;gap:16px;justify-items:start;padding:20px clamp(8px,2vw,28px) 20px 8px;min-width:0}
.feat-h{font:700 clamp(48px,4.6vw,78px)/1 var(--f-head);color:var(--ink);text-wrap:balance}
.feat-d{font:500 clamp(17px,1.4vw,20px)/1.65 var(--f-body);color:var(--ink-2);text-wrap:pretty}
.feat .more{font-size:19px}
@media(max-width:860px){.feat{grid-template-columns:minmax(0,1fr)}.feat-b{padding:6px 12px 16px}}
.feat-band{padding-block:clamp(48px,5vw,72px)}
/* how + credits */
.how{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:22px}
@media(max-width:900px){.how{grid-template-columns:minmax(0,1fr)}}
.how a{display:grid;gap:10px;align-content:start;background:#fff;border:1px solid var(--pink-line);border-radius:30px;padding:26px 26px 24px;text-decoration:none;color:var(--ink);box-shadow:0 18px 40px rgba(255,46,160,.06);transition:transform .25s,box-shadow .25s}
.how a:hover{transform:translateY(-4px);box-shadow:0 0 0 1px rgba(255,46,160,.28),0 26px 54px rgba(255,46,160,.16)}
.how b{font:700 44px/1 var(--f-head)}
.how span{font:500 17px/1.6 var(--f-body);color:var(--ink-2)}
.how small{font:600 12.5px/1 var(--f-code);color:var(--pink-deep);direction:ltr;justify-self:start;letter-spacing:.04em}
.credits{list-style:none;padding:0;display:grid;gap:10px;font:500 16.5px/1.55 var(--f-body);color:var(--ink-2)}
.credits a{color:var(--pink-deep);font-weight:700;text-decoration:none}
.credits a:hover{text-decoration:underline}
.note{margin-top:22px;font:500 16.5px/1.65 var(--f-body);color:var(--muted);max-width:52em}
/* footer */
.foot{background:var(--night-2);color:#E6E4F5;padding-block:64px 96px}
.foot-grid{display:grid;grid-template-columns:auto minmax(0,1fr);gap:24px 48px;align-items:center}
@media(max-width:760px){.foot-grid{grid-template-columns:minmax(0,1fr)}}
.foot-grid > img{height:84px;width:auto}
.bio{font:500 18px/1.7 var(--f-body);color:var(--on-night-2);max-width:44em}
.socials{list-style:none;padding:0;display:flex;flex-wrap:wrap;gap:10px;margin-top:20px}
.socials a{display:inline-flex;align-items:center;min-height:42px;padding:0 18px;border-radius:999px;color:var(--pink-soft);text-decoration:none;font:700 15px/1 var(--f-body);box-shadow:inset 0 0 0 1px rgba(255,143,204,.38)}
.socials a:hover{background:rgba(255,46,160,.14)}
.legal{margin-top:44px;padding-top:20px;border-top:1px solid rgba(255,255,255,.09);display:flex;flex-wrap:wrap;justify-content:space-between;gap:10px;font:500 14px/1.4 var(--f-body);color:#8F8CB8}
.legal span:last-child{direction:ltr;letter-spacing:.18em;font:600 12px/1.4 var(--f-en);color:#5DE4E9}
/* player */
.player{border:0;padding:0;background:transparent;max-width:100vw;max-height:100dvh;width:100vw;height:100dvh;margin:0;color:#fff}
.player::backdrop{background:rgba(10,9,34,.9);-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px)}
.pwrap{height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;padding:16px max(16px,env(safe-area-inset-left,0px))}
.phead{width:min(1200px,100%);display:flex;align-items:center;gap:12px}
.phead h3{margin:0;flex:1;min-width:0;font:700 clamp(32px,3.4vw,52px)/1 var(--f-head);color:#fff;text-wrap:balance}
.phead h3.torah{font:700 clamp(24px,2.4vw,34px)/1.15 var(--f-torah)}
.pbtn{flex:none;min-height:48px;border-radius:999px;border:0;background:rgba(255,255,255,.04);box-shadow:inset 0 0 0 2px rgba(255,255,255,.3);color:#fff;font:700 16px/1 var(--f-body);padding:0 18px;cursor:pointer}
.pbtn:hover{background:rgba(255,255,255,.1)}
.pclose{width:48px;padding:0;font:700 20px/1 var(--f-en)}
.pshare{display:inline-flex;align-items:center;gap:8px}
.pshare svg{width:20px;height:20px;fill:none;stroke:currentColor;stroke-width:2.2;stroke-linecap:round}
.pframe{position:relative;background:#000;border-radius:24px;overflow:hidden;box-shadow:0 40px 90px rgba(5,4,20,.65);max-width:100%}
.pframe[data-k="h"],.pframe[data-k="hhe"]{width:min(1200px,100%,calc((100dvh - 200px) * 16 / 9));aspect-ratio:16/9}
.pframe[data-k="v"],.pframe[data-k="vhe"]{height:min(calc(100dvh - 200px),1000px);aspect-ratio:9/16}
.pframe[data-k="s"]{height:min(calc(100dvh - 200px),900px);aspect-ratio:1}
.pframe video{position:absolute;inset:0;width:100%;height:100%;object-fit:contain;background:#000}
.pver{display:flex;flex-wrap:wrap;justify-content:center;gap:8px}
.pver[hidden]{display:none}
.pver button{min-height:42px;border:0;background:rgba(255,255,255,.04);box-shadow:inset 0 0 0 2px rgba(255,255,255,.3);color:#fff;border-radius:999px;padding:0 18px;font:700 16px/1 var(--f-body);cursor:pointer}
.pver button[aria-pressed="true"]{background:var(--pink);box-shadow:none}
.pmsg{position:absolute;inset:auto 0 0 0;padding:14px;text-align:center;font:600 17px/1.4 var(--f-body);background:rgba(14,13,42,.82)}
body.pl-open{overflow:hidden}
@media(max-width:560px){.btn{min-height:60px;padding:0 28px;font-size:18.5px;white-space:normal;line-height:1.25;text-align:start}
 .stats li{padding-inline:14px}.stats b{font-size:34px}.stats span{font-size:15px}
 .pframe[data-k="v"],.pframe[data-k="vhe"]{height:calc(100dvh - 190px)}.pshare{width:48px;padding:0;justify-content:center}.pshare span{display:none}}
@media (prefers-reduced-motion: reduce){.glow::before,.glow::after{animation:none}.fc,.btn,.how a,.fm .floop{transition:none}.fc:hover,.btn:hover,.how a:hover{transform:none}}
'''

JS = r'''
(function () { /* nav menu under 940px */
  var b = document.getElementById('burger'), m = document.getElementById('menu');
  b.addEventListener('click', function () { var o = m.classList.toggle('open'); b.setAttribute('aria-expanded', String(o)); });
  document.addEventListener('keydown', function (ev) { if (ev.key === 'Escape' && m.classList.contains('open')) { m.classList.remove('open'); b.setAttribute('aria-expanded', 'false'); b.focus(); } });
  m.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', function () { m.classList.remove('open'); b.setAttribute('aria-expanded', 'false'); }); });
})();
(function () { /* live loops: load and play only while a card is on screen; posters only for reduced motion / data saver */
  var rm = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var save = navigator.connection && navigator.connection.saveData;
  if (rm) document.querySelectorAll('.hloop').forEach(function (v) { v.removeAttribute('autoplay'); v.pause(); });
  if (rm || save || !('IntersectionObserver' in window)) return;
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      var v = e.target;
      if (e.isIntersecting) { if (!v.getAttribute('src')) v.src = v.dataset.src; var p = v.play(); if (p && p.catch) p.catch(function () {}); }
      else if (v.getAttribute('src')) v.pause();
    });
  }, { rootMargin: '120px 0px', threshold: 0.3 });
  document.querySelectorAll('.floop').forEach(function (v) { io.observe(v); });
})();
(function () { /* player: the full film in a native <video>, one button per version, the address bar follows (?film=id) */
  var DATA = JSON.parse(document.getElementById('filmData').textContent);
  var MB = document.getElementById('mb').href;            /* media/ -> absolute (export points it at GitHub Pages) */
  var abs = function (p) { return new URL(p.replace(/^media\//, ''), MB).href; };
  var dlg = document.getElementById('player'), frame = document.getElementById('pFrame'), ver = document.getElementById('pVer'),
      title = document.getElementById('pTitle'), share = document.getElementById('pShare'), opener = null, cur = null;
  if (!dlg.showModal) return;                              /* very old browsers: the ?film= link reloads the page, nothing more */
  function setUrl(id) {
    try { var u = new URL(location.href); if (id) u.searchParams.set('film', id); else u.searchParams.delete('film'); history.replaceState(null, '', u.pathname + u.search + u.hash); } catch (err) {}
  }
  function stop() { var v = frame.querySelector('video'); if (v) { v.pause(); v.removeAttribute('src'); v.load(); } frame.innerHTML = ''; }
  function load(id, k, auto) {
    var f = DATA[id], v = f.v.filter(function (x) { return x.k === k; })[0] || f.v[0];
    stop();
    var el = document.createElement('video'); el.playsInline = true; el.setAttribute('playsinline', ''); el.poster = abs(f.poster);
    if (v) {
      frame.dataset.k = v.k; el.controls = true; el.preload = 'auto'; el.src = abs(v.src); el.setAttribute('aria-label', f.t);
      frame.appendChild(el);
      if (auto) { var p = el.play(); if (p && p.catch) p.catch(function () {}); }
    } else {                                                /* no full copy yet: show the loop and say so */
      frame.dataset.k = f.shape; el.muted = true; el.loop = true; el.autoplay = true; el.src = abs(f.loop);
      frame.appendChild(el); var m = document.createElement('div'); m.className = 'pmsg'; m.textContent = 'הסרט המלא יעלה לכאן בקרוב'; frame.appendChild(m);
    }
    ver.querySelectorAll('button').forEach(function (b) { b.setAttribute('aria-pressed', String(!!v && b.dataset.ver === v.k)); });
  }
  function open(id, k, from, auto) {
    var f = DATA[id]; if (!f) return;
    opener = from || null; cur = id; title.textContent = f.t; title.className = f.torah ? 'torah' : '';
    ver.innerHTML = ''; ver.hidden = f.v.length < 2;
    f.v.forEach(function (x) { var b = document.createElement('button'); b.type = 'button'; b.textContent = x.l; b.dataset.film = id; b.dataset.ver = x.k; b.addEventListener('click', function () { load(id, x.k, true); }); ver.appendChild(b); });
    if (!dlg.open) dlg.showModal(); document.body.classList.add('pl-open'); load(id, k, auto); setUrl(id);
  }
  function close() { stop(); cur = null; document.body.classList.remove('pl-open'); if (dlg.open) dlg.close(); setUrl(null); if (opener) opener.focus(); }
  document.querySelectorAll('a[data-film]').forEach(function (a) {
    a.addEventListener('click', function (ev) {
      if (ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.button === 1) return;   /* new tab: the ?film= link opens it there */
      ev.preventDefault(); open(a.dataset.film, a.dataset.ver, a, true);
    });
  });
  dlg.querySelector('.pclose').addEventListener('click', close);
  dlg.addEventListener('cancel', function (ev) { ev.preventDefault(); close(); });
  dlg.addEventListener('click', function (ev) { if (ev.target === dlg || ev.target.classList.contains('pwrap')) close(); });
  share.addEventListener('click', function () {
    var url = location.origin + location.pathname + '?film=' + cur, lab = share.querySelector('span');
    var done = function () { lab.textContent = 'הקישור הועתק'; setTimeout(function () { lab.textContent = 'העתקת קישור'; }, 2200); };
    if (navigator.share && matchMedia('(pointer:coarse)').matches) { navigator.share({ title: DATA[cur].t, url: url }).catch(function () {}); return; }
    if (navigator.clipboard) navigator.clipboard.writeText(url).then(done, function () { prompt('', url); }); else prompt('', url);
  });
  var q = new URLSearchParams(location.search).get('film');   /* deep link */
  if (q && DATA[q]) { var card = document.querySelector('#f-' + q + ' a[data-film]'); open(q, (DATA[q].v[0] || {}).k, card, true); }
})();
'''

PAGE = f'''<!doctype html>
<html lang="he" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>כל הסרטים שיצרתי עם Claude · YUV.AI</title>
<meta name="description" content="{N} סרטים שיצרתי עם Claude: סרטי השקה בקוד, סרטי הסבר, תניא ועריכות של צילומים שלי. כל הגרפיקה נכתבה כקוד, בלי After Effects.">
<meta property="og:title" content="כל הסרטים שיצרתי עם Claude">
<meta property="og:description" content="{N} סרטים, {TOTAL_MIN} דקות, אפס After Effects. סרטי השקה, סרטי הסבר, תניא ועריכות על צילום. YUV.AI">
<meta property="og:image" content="https://hoodini.github.io/motion-in-code/media/films/og.jpg">
<meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#0E0D2A">
<link rel="icon" type="image/png" href="media/films/brand/phoenix-mark.png">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="{FONTS}" rel="stylesheet">
<style>{CSS}</style>
</head>
<body>
<a class="skip" href="#featured">דילוג לסרטים</a>
<a id="mb" href="media/" hidden tabindex="-1" aria-hidden="true"></a>
<header class="hero">
  <div class="sky" aria-hidden="true"></div>
  <div class="wrap">
    <nav class="nav" aria-label="עמודי המושן">
      <a class="brand" href="https://news.yuv.ai"><img src="media/films/brand/phoenix-mark.png" alt="" width="46" height="46"><span>YUV.AI</span></a>
      <div class="links">{links}</div>
      <a class="pill-dark" href="https://news.yuv.ai">לניוזרום</a>
      <button class="burger" id="burger" type="button" aria-expanded="false" aria-controls="menu" aria-label="תפריט"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg></button>
      <div class="menu" id="menu">{links}<a href="https://news.yuv.ai">לניוזרום</a></div>
    </nav>
    <div class="hero-grid">
      <div class="hero-text">
        <span class="kick">YUV.AI · MOTION FILMS</span>
        <h1 class="hero-h">כל <span class="mk">הסרטים</span> שיצרתי עם Claude</h1>
        <p class="hero-sub">מסרט של {SHORTEST} שניות ועד סיור של {LONGEST} דקות. כל הגרפיקה נכתבה כקוד.</p>
        <ul class="stats">
          <li><b>{N}</b><span>סרטים</span></li>
          <li><b>{TOTAL_MIN}</b><span>דקות</span></li>
          <li><b>0</b><span>After Effects</span></li>
        </ul>
        <div class="ctas">
          <span class="glow"><a class="btn btn-primary" href="?film={FEATURED}" data-film="{FEATURED}" data-ver="{first_ver(FEATURED)}">{PLAY}בוט AI רשמי לוואטסאפ</a></span>
          <a class="btn btn-ghost-dark" href="index.html">איך זה עובד</a>
        </div>
        <a class="latest" href="?film={NEWEST}" data-film="{NEWEST}" data-ver="{first_ver(NEWEST)}"><img src="media/films/{NEWEST}.jpg" alt="" width="64" height="36"><b>חדש בגלריה</b><span>{e(fn["title"])} <span class="arrow">←</span></span></a>
      </div>
      <div class="hv" aria-hidden="true">
        <figure class="hw"><video class="hloop" autoplay muted loop playsinline preload="auto" poster="media/films/{HERO_WIDE}.jpg"><source src="media/films/{HERO_WIDE}.mp4" type="video/mp4"></video></figure>
        <figure class="hp"><video class="hloop" autoplay muted loop playsinline preload="auto" poster="media/films/{HERO_PHONE}.jpg"><source src="media/films/{HERO_PHONE}.mp4" type="video/mp4"></video></figure>
      </div>
    </div>
  </div>
</header>
<main>
{featured(FEATURED)}
{''.join(section(s) for s in D['sections'])}

<section class="sec paper" id="how" aria-labelledby="h-how">
  <div class="wrap">
    <div class="sec-row"><div class="sec-t"><span class="kick">05 · HOW</span><h2 class="h2" id="h-how">איך <span class="mk">עושים</span> את זה</h2>
      <p class="lede">השיטה מפורקת לפירורים, עם קטלוג של אלמנטים מוכנים ומילון של כל המונחים.</p></div></div>
    <div class="how">
      <a href="index.html"><b>השיטה</b><span>איך Claude מייצר סרטי השקה בקוד: seek(t), קפיצים, מורף, ביט ורינדור, עם הדגמות שרצות בדפדפן.</span><small>news.yuv.ai/motion</small></a>
      <a href="catalog.html"><b>הקטלוג</b><span>24 אלמנטים חיים, כל אחד עם הסבר מאפס ופרומפט מלא להעתקה, ובונה פרומפטים.</span><small>/motion/catalog</small></a>
      <a href="dictionary.html"><b>המילון</b><span>איך קוראים לכל רכיב ותנועה בפרומפט, עם משפט מוכן להעתקה.</span><small>/motion/dictionary</small></a>
    </div>
  </div>
</section>

<section class="sec cloud" id="credits" aria-labelledby="h-cred">
  <div class="wrap">
    <div class="sec-row"><div class="sec-t"><span class="kick">06 · CREDITS</span><h2 class="h2" id="h-cred">קרדיטים</h2>
      <p class="lede">היצירות של אחרים שמופיעות בסרטים ודורשות ייחוס.</p></div></div>
    <ul class="credits">{credits}</ul>
    <p class="note">שאר המוזיקה והאפקטים בסרטי הקוד הם מ-Mixkit (רישיון Mixkit) ומ-Kenney (CC0), או שנוצרו במיוחד לסרט. תמונות של אחרים בסרט "שבעה דורות" מוצגות לפי הרישיון שלהן, ופירוט מלא של כל תמונה ועובדה נמצא בדוח המקורות של הסרט.</p>
  </div>
</section>
</main>

<footer class="foot">
  <div class="wrap">
    <div class="foot-grid">
      <img src="media/films/brand/wordmark.png" alt="LET'S FLY HIGH · YUV.AI" width="204" height="84">
      <div>
        <p class="bio">יובל אבידני. טכנולוג ויוצר תוכן טכני, מגיש פינת ה-AI בחדשות 12, ומייסד YUV.AI. GitHub Star כפול ו-AWS GenAI Superstar כפול.</p>
        <ul class="socials">{socials}</ul>
      </div>
    </div>
    <div class="legal"><span>© 2026 יובל אבידני · YUV.AI</span><span>LET'S FLY HIGH</span></div>
  </div>
</footer>

<dialog class="player" id="player" aria-labelledby="pTitle">
  <div class="pwrap">
    <div class="phead"><h3 id="pTitle"></h3>
      <button class="pbtn pshare" id="pShare" type="button" aria-label="העתקת קישור לסרט"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 14a4.5 4.5 0 0 0 6.4 0l3.2-3.2a4.5 4.5 0 0 0-6.4-6.4L12 5.6M14 10a4.5 4.5 0 0 0-6.4 0l-3.2 3.2a4.5 4.5 0 0 0 6.4 6.4l1.2-1.2"/></svg><span>העתקת קישור</span></button>
      <button class="pbtn pclose" type="button" aria-label="סגירה" autofocus>✕</button></div>
    <div class="pframe" id="pFrame" data-k="h"></div>
    <div class="pver" id="pVer" role="group" aria-label="גרסה"></div>
  </div>
</dialog>
<script type="application/json" id="filmData">{data_blob()}</script>
<script>{JS}</script>
</body>
</html>
'''

(ROOT / 'films.html').write_text(PAGE, encoding='utf-8')
missing = [fid for fid in ORDER if fid not in HAS_FULL]
print(f'films.html: {N} films, {TOTAL_MIN} min, {len(HAS_FULL)} with a full copy; no full copy: {" ".join(missing) or "none"}; hidden (no loop yet): {" ".join(PENDING) or "none"}')
