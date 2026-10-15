"""QA for any kit film. Renders frames with Playwright (works headless, WebGL via SwiftShader if no GPU).
usage:
  python qa.py <film.html> stills  <beats,comma> [layouts=h,v] [scale=0.5] [out=qa_out]   -> one PNG per beat + a grid
  python qa.py <film.html> sheet   [layouts=h,v] [scale=0.3] [out=qa_out]                 -> one still per beat (contact sheet)
  python qa.py <film.html> pops    [layouts=h,v] [scale=0.25] [out=qa_out]                -> single-frame outliers at 30fps
Fonts: set KIT_FONTS to a folder of @fontsource packages to inline local fonts (offline machines)."""
import sys, io, os, re, json, pathlib
import numpy as np
from PIL import Image
from playwright.sync_api import sync_playwright
film = pathlib.Path(sys.argv[1]).resolve(); mode = sys.argv[2]
args = sys.argv[3:]
beats = [float(b) for b in args.pop(0).split(',')] if mode == 'stills' else None
lays = (args.pop(0) if args else 'h,v').split(',')
scale = float(args.pop(0)) if args else {'stills': 0.5, 'sheet': 0.3, 'pops': 0.25}[mode]
out = pathlib.Path(args.pop(0) if args else 'qa_out'); out.mkdir(parents=True, exist_ok=True)
html = film.read_text(encoding='utf-8'); FS = os.environ.get('KIT_FONTS')
if FS:
    faces = []
    spec = {'rubik': ('Rubik', [700, 800, 900], ['hebrew', 'latin']), 'assistant': ('Assistant', [600, 700, 800], ['hebrew', 'latin']), 'anton': ('Anton', [400], ['latin']), 'jetbrains-mono': ('JetBrains Mono', [400, 500, 700], ['latin', 'greek'])}
    for pkg, (fam, ws, subs) in spec.items():
        for w in ws:
            for s in subs:
                f = pathlib.Path(FS) / pkg / 'files' / f'{pkg}-{s}-{w}-normal.woff2'
                if f.exists(): faces.append(f"@font-face{{font-family:'{fam}';font-weight:{w};src:url('file://{f}') format('woff2');}}")
    html = re.sub(r'<!--FONTS-->.*?<!--/FONTS-->', '<style>' + ''.join(faces) + '</style>', html, flags=re.S)
qa = film.with_name(film.stem + '_qa.html'); qa.write_text(html, encoding='utf-8')
errs = []
def shot(pg): return Image.open(io.BytesIO(pg.locator('canvas').screenshot())).convert('RGB')
with sync_playwright() as p:
    b = p.chromium.launch(args=['--allow-file-access-from-files', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
    for lay in lays:
        W, H = (1920, 1080) if lay == 'h' else (1080, 1920)
        pg = b.new_page(viewport={'width': int(W * scale), 'height': int(H * scale)})
        pg.on('pageerror', lambda e: errs.append(f'{lay} PAGEERROR {e}'))
        pg.on('console', lambda m: errs.append(f'{lay} {m.type}: {m.text}') if m.type == 'error' else None)
        pg.goto(f'file://{qa}?L={lay}&scale={scale}' + ('&' + os.environ['KIT_Q'] if os.environ.get('KIT_Q') else '')); pg.evaluate('window.__ready')
        F = pg.evaluate('({B: FILM.B, DUR: FILM.DUR, NB: FILM.NB || 0})')
        if mode in ('stills', 'sheet'):
            bl = beats if mode == 'stills' else [k + 0.35 for k in range(int(F['NB']))]
            ims = []
            for k in bl:
                pg.evaluate(f'seek({k * F["B"]})'); im = shot(pg); ims.append(im)
                if mode == 'stills': im.save(out / f'{lay}_{k:g}.png')
            tw, th = ims[0].size; cols = (4 if lay == 'h' else 6) if mode == 'stills' else (8 if lay == 'h' else 12); rows = (len(ims) + cols - 1) // cols
            g = Image.new('RGB', (cols * (tw + 6), rows * (th + 6)), 'white')
            for i, im in enumerate(ims): g.paste(im, ((i % cols) * (tw + 6), (i // cols) * (th + 6)))
            g.save(out / f'{mode}_{lay}.jpg', quality=88); print(mode, lay, g.size)
        else:
            n = int(F['DUR'] * 30); fr = []; pops = []
            for i in range(n):
                pg.evaluate(f'seek({i / 30})'); fr.append(np.asarray(shot(pg), dtype=np.int16))
                if len(fr) == 3:
                    a, b_, c = fr; d1, d2, d3 = np.abs(b_ - a).mean(), np.abs(c - b_).mean(), np.abs(c - a).mean()
                    if min(d1, d2) > 3 * max(d3, 0.3) and min(d1, d2) > 1.0: pops.append((i - 1, round((i - 1) / 30 / F['B'], 2), round(float(min(d1, d2)), 2)))
                    fr.pop(0)
            print('pops', lay, pops if pops else 'NONE')
        pg.close()
    b.close()
print('ERRORS:', errs if errs else 'none')
