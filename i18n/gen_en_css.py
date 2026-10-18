#!/usr/bin/env python3
"""Generate catalog/en.css: the English edition's type and direction overrides.

Why this exists: the Hebrew pages are tuned for Karantina (a very condensed Hebrew face with a
small x-height), so every Karantina size is ~1.35x larger than an English face needs. Instead of
hand-copying ~70 rules, this script reads site.css + catalog.css, finds every rule whose font is
var(--he) / var(--heD) / var(--body), and emits the same rule under html[lang=en] with the size
scaled for the English face. @media context is preserved.

Roles (English brand: Anton uppercase for the one display headline per surface, Inter for the rest):
  D  h1 / h2            -> Anton 400, uppercase, letter-spacing 0, line-height >= 1.0, size x0.60
  T  other Karantina    -> Inter (same weight), size x0.72, line-height >= 1.1
  B  Assistant body     -> Inter, size x0.94
"""
import re, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = [ROOT / 'catalog' / 'site.css', ROOT / 'catalog' / 'catalog.css']
OUT = ROOT / 'catalog' / 'en.css'

ANTON = {'h1', 'h2', '.hero-top h1'}
F = {'D': 0.60, 'T': 0.72, 'B': 0.94}
# rules that set only font-size on an element whose family comes from elsewhere
SIZE_ONLY = {'.hero-top .deck': 'T', '.tldr li': 'B', '.tr': 'B', '.src li': 'B', 'footer .bio': 'B', 'footer .credit': 'B',
             'body': 'B', '.legend div': 'B', '.step>.sub': 'T', '.el-h h3': 'T', '.el-cols h4': 'T', '.el-cols p': 'B',
             '.el-cols ul': 'B', '.fit>div': 'B', '.el .def b:first-child': 'T', '.ctrl-row .btn': 'T',
             '.is-failed .stage::after': 'B', '.layers-btn': 'B', '.vec-grid figcaption': 'B', '.cost-note': 'B',
             '.clk-note': 'B', '.ui-steps li': 'B', '.tools td': 'B', '.tools td:first-child': 'T', '.bar .home': 'T', '.navbtn': 'T'}

def scale(expr, k):
    # scale px / vw / rem numbers; leave em and % alone (they follow the parent, already scaled)
    return re.sub(r'(-?\d*\.?\d+)(px|vw|vh|rem)', lambda m: f'{float(m.group(1)) * k:.4g}{m.group(2)}', expr)

def blocks(css):
    """yield (media_prefix, selector, body) with @media nesting kept (one level is all these files use)"""
    css = re.sub(r'/\*.*?\*/', '', css, flags=re.S)
    i, n = 0, len(css)
    while i < n:
        j = css.find('{', i)
        if j < 0: break
        head = css[i:j].strip()
        if head.startswith('@media') or head.startswith('@supports'):
            depth, k = 1, j + 1
            while depth and k < n:
                depth += {'{': 1, '}': -1}.get(css[k], 0); k += 1
            for _, s, b in blocks(css[j + 1:k - 1]): yield head, s, b
            i = k
        elif head.startswith('@'):   # @property, @keyframes, @font-face: skip the whole block
            depth, k = 1, j + 1
            while depth and k < n:
                depth += {'{': 1, '}': -1}.get(css[k], 0); k += 1
            i = k
        else:
            k = css.find('}', j)
            yield None, head, css[j + 1:k]
            i = k + 1

FONT = re.compile(r'font:\s*(?:(italic)\s+)?(\d{3}|bold|normal)?\s*([^\s/;]+)(?:/([^\s;]+))?\s+var\(--(he|heD|body)\)')

def en_sel(sel):
    return ','.join('html[lang=en] ' + s.strip() if not s.strip().startswith('html') else s.strip().replace('html', 'html[lang=en]', 1)
                    for s in sel.split(','))

def rules():
    out = []
    for f in SRC:
        for media, sel, body in blocks(f.read_text()):
            decl = None
            m = FONT.search(body)
            if m:
                _, w, size, lh, fam = m.groups()
                role = 'B' if fam == 'body' else ('D' if sel in ANTON else 'T')
                d = [f'font-size:{scale(size, F[role])}']
                if role == 'D':
                    d += ['font-family:var(--disp)', 'font-weight:400', 'text-transform:uppercase', 'letter-spacing:0']
                    d.append(f'line-height:{max(1.0, float(lh)) if lh and re.fullmatch(r"[\d.]+", lh) else 1.0}')
                elif role == 'T' and lh and re.fullmatch(r'[\d.]+', lh) and float(lh) < 1.1:
                    d.append('line-height:1.1')
                decl = ';'.join(d)
            elif sel in SIZE_ONLY:
                sm = re.search(r'font-size:\s*([^;]+)', body)
                if sm: decl = f'font-size:{scale(sm.group(1).strip(), F[SIZE_ONLY[sel]])}'
            if decl:
                r = f'{en_sel(sel)}{{{decl}}}'
                out.append(f'{media}{{{r}}}' if media else r)
    return out

MANUAL = r"""
/* ---- fonts: Inter replaces Karantina/Assistant, Anton is the display face ---- */
html[lang=en]{--he:'Inter',system-ui,sans-serif;--heD:'Inter',system-ui,sans-serif;--body:'Inter',system-ui,sans-serif;--disp:'Anton',Impact,sans-serif}
html[lang=en] h1 .hl,html[lang=en] h2 .hl{padding:.08em .4em;letter-spacing:.01em}
html[lang=en] h3,html[lang=en] h4{letter-spacing:-.01em}
/* ---- left to right: mirror what the Hebrew layout placed on purpose ---- */
html[lang=en] .hero::before,html[lang=en] .sec::before{left:auto;right:-.035em}
html[lang=en] footer::before{left:auto;right:-.03em}
html[lang=en] .hs-wide{left:auto;right:-3%;transform:rotate(-3deg)}
html[lang=en] .hs-phone{right:auto;left:0;transform:rotate(4deg)}
html[lang=en] .hmono,html[lang=en] footer .blogs small,html[lang=en] .idx a small,html[lang=en] .idx a span,html[lang=en] .tools td small{text-align:left}
html[lang=en] .fbar label,html[lang=en] .pipe .st{direction:ltr}
html[lang=en] .fxn-go{transform:none}
html[lang=en] .tr::before{content:"Translation"}
"""

if __name__ == '__main__':
    rs = rules()
    OUT.write_text('/* generated by i18n/gen_en_css.py: do not edit by hand */\n' + MANUAL.strip() + '\n/* ---- sizes scaled from the Hebrew rules ---- */\n' + '\n'.join(rs) + '\n')
    print(f'{OUT.relative_to(ROOT)}: {len(rs)} scaled rules')
