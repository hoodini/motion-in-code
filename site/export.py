#!/usr/bin/env python3
"""Publish the motion pages to their two homes, and keep the GitHub Pages copy pointing at them.

  Hebrew  -> news.yuv.ai/motion  + /motion/catalog + /motion/dictionary   (repo hoodini/yuvai-newsroom,   Next.js on Vercel)
  English -> yuv.ai/motion       + /motion/catalog + /motion/dictionary   (repo hoodini/yuv-ai-portfolio, Next.js on Fly.io)
  GitHub Pages (hoodini.github.io/motion-in-code) -> redirects each page to its new address.

Each site gets the same files under public/motion/:
  motion/index.html            the method page
  motion/catalog/index.html    the catalog
  motion/dictionary/index.html the interface dictionary
  motion/assets/...            the catalog's CSS + JS bundle (chunks load relative to main.js)
Media (88 MB of video) stays on GitHub Pages and is referenced by absolute URL, so it is stored once.

Usage:  python3 site/export.py --repo-pages                       # only refresh the head block in this repo's 6 pages
        python3 site/export.py --news ../yuvai-newsroom --yuv ../yuv-ai-portfolio
"""
import argparse, re, shutil, sys, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
PAGES = 'https://hoodini.github.io/motion-in-code'
KINDS = ('index', 'catalog', 'dictionary', 'films')
HAS_EN = ('index', 'catalog', 'dictionary')   # films (the gallery) is Hebrew-only for now: no English page, no hreflang to one
HOST = {'he': 'https://news.yuv.ai', 'en': 'https://yuv.ai'}
URL = {(lang, kind): HOST[lang] + '/motion' + ('' if kind == 'index' else '/' + kind) for lang in HOST for kind in KINDS if lang == 'he' or kind in HAS_EN}
SRC = {(lang, kind): kind + ('' if lang == 'he' else '.en') + '.html' for (lang, kind) in URL}
GA_YUV = 'G-PB2NQPQ242'          # yuv.ai's GA4 property (components/google-analytics.tsx in yuv-ai-portfolio)
HEAD_RE = re.compile(r'\n?<!-- motion:head -->.*?<!-- /motion:head -->', re.S)


def head_block(lang, kind, mode):
    other = 'en' if lang == 'he' else 'he'
    me = URL[(lang, kind)]
    lines = ['<!-- motion:head -->', f'<link rel="canonical" href="{me}">']
    if kind in HAS_EN:
        lines += [
        f'<link rel="alternate" hreflang="he" href="{URL[("he", kind)]}">',
        f'<link rel="alternate" hreflang="en" href="{URL[("en", kind)]}">',
        f'<link rel="alternate" hreflang="x-default" href="{URL[("en", kind)]}">']
    lines += [
        f'<meta property="og:url" content="{me}">',
        f'<meta property="og:type" content="article"><meta property="og:site_name" content="YUV.AI">',
        f'<meta property="og:locale" content="{"he_IL" if lang == "he" else "en_US"}"><meta property="og:locale:alternate" content="{"en_US" if lang == "he" else "he_IL"}">',
    ]
    if mode == 'pages':   # the GitHub Pages copy moved: send people (and the hash they came with) to the new address
        lines.append(f"<script>if (/github\\.io$/.test(location.hostname)) location.replace('{me}' + location.search + location.hash);</script>")
    elif mode == 'news':
        lines.append('<script defer src="/motion-track.js"></script>')
    else:
        lines.append('<script defer src="/motion/assets/track.js"></script>')
    lines.append('<!-- /motion:head -->')
    return '\n'.join(lines)


def with_head(html, block):
    html = HEAD_RE.sub('', html)
    anchor = '<meta name="viewport" content="width=device-width,initial-scale=1">'
    assert html.count(anchor) == 1, 'viewport meta anchor not found'
    return html.replace(anchor, anchor + '\n' + block)


def rewrite(html, lang, kind):
    """repo-relative links -> site paths; media -> GitHub Pages; language switch -> the other domain"""
    other = 'en' if lang == 'he' else 'he'
    html = re.sub(r'<a class="lang" href="(index|catalog|dictionary)(?:\.en)?\.html"', lambda m: f'<a class="lang" href="{URL[(other, m.group(1))]}"', html)
    html = re.sub(r'href="catalog(?:\.en)?\.html', 'href="/motion/catalog', html)
    html = re.sub(r'href="dictionary(?:\.en)?\.html', 'href="/motion/dictionary', html)
    html = re.sub(r'href="films\.html', 'href="/motion/films', html)
    html = re.sub(r'href="index(?:\.en)?\.html', 'href="/motion', html)
    html = re.sub(r'(src|href|poster)="media/', rf'\1="{PAGES}/media/', html)
    html = re.sub(r'(src|href)="catalog/', r'\1="/motion/assets/', html)
    host = URL[(lang, 'index')].replace('https://', '')
    html = html.replace('<small>catalog.html</small>', f'<small>{host}/catalog</small>').replace('<small>dictionary.html</small>', f'<small>{host}/dictionary</small>').replace('<small>motion-in-code</small>', f'<small>{host}</small>')
    left = re.findall(r'(?:src|href|poster)="(?!https?://|#|/|data:|mailto:|\$\{)[^"]*"', html)
    if left: sys.exit(f'{lang}/{kind}: unrewritten relative refs: {left[:5]}')
    return html


def repo_pages():
    for (lang, kind), f in SRC.items():
        p = ROOT / f
        p.write_text(with_head(p.read_text(), head_block(lang, kind, 'pages')))
    print('repo pages: head block refreshed (canonical, hreflang, GitHub Pages redirect)')


def publish(repo, lang, mode):
    repo = pathlib.Path(repo).resolve()
    out = repo / 'public' / 'motion'
    if out.exists(): shutil.rmtree(out)
    for d in KINDS[1:]:
        if (lang, d) in SRC: (out / d).mkdir(parents=True)
    assets = out / 'assets'
    shutil.copytree(ROOT / 'catalog', assets, ignore=shutil.ignore_patterns('*.map'))
    for kind in KINDS:
        if (lang, kind) not in SRC: continue
        html = (ROOT / SRC[(lang, kind)]).read_text()
        html = rewrite(with_head(html, head_block(lang, kind, mode)), lang, kind)
        (out / ('index.html' if kind == 'index' else kind + '/index.html')).write_text(html)
    track = (ROOT / 'site' / 'track.js').read_text()
    assert '`' not in track and '${' not in track, 'track.js must stay template-literal safe'
    if mode == 'yuv':
        (assets / 'track.js').write_text(track.replace("'__SITE__'", "'yuv'").replace("'__GA__'", f"'{GA_YUV}'").replace("'__FB__'", "''"))
    else:
        # the newsroom keeps its GA4 / Meta Pixel ids in Vercel env vars: a static route bakes them in at build time
        route = repo / 'src' / 'app' / 'motion-track.js' / 'route.ts'
        route.parent.mkdir(parents=True, exist_ok=True)
        route.write_text(
            '// Generated by hoodini/motion-in-code site/export.py. Do not edit here: edit site/track.js there and re-export.\n'
            '// Serves the reading tracker for the static pages in public/motion (news.yuv.ai/motion, /motion/catalog, /motion/dictionary).\n'
            '// It posts to /api/track in the same format and with the same visitor id (yuv_vid) as components/Tracker.tsx,\n'
            '// and loads GA4 / Meta Pixel only when NEXT_PUBLIC_GA_ID / NEXT_PUBLIC_FB_PIXEL_ID are set, like SiteAnalytics.tsx.\n'
            'export const dynamic = "force-static";\n\n'
            'const SRC = String.raw`' + track.replace("'__SITE__'", "'news'") + '`;\n\n'
            'export function GET() {\n'
            '  const js = SRC\n'
            '    .replace("\'__GA__\'", JSON.stringify(process.env.NEXT_PUBLIC_GA_ID ?? ""))\n'
            '    .replace("\'__FB__\'", JSON.stringify(process.env.NEXT_PUBLIC_FB_PIXEL_ID ?? ""));\n'
            '  return new Response(js, {\n'
            '    headers: { "Content-Type": "application/javascript; charset=utf-8", "Cache-Control": "public, max-age=300, s-maxage=3600" },\n'
            '  });\n'
            '}\n')
    n = sum(1 for _ in out.rglob('*') if _.is_file())
    print(f'{repo.name}: public/motion ({n} files, {lang})' + (' + src/app/motion-track.js/route.ts' if mode == 'news' else ''))


if __name__ == '__main__':
    ap = argparse.ArgumentParser()
    ap.add_argument('--news'); ap.add_argument('--yuv'); ap.add_argument('--repo-pages', action='store_true')
    a = ap.parse_args()
    repo_pages()
    if a.news: publish(a.news, 'he', 'news')
    if a.yuv: publish(a.yuv, 'en', 'yuv')
