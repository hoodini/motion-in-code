"""PORTRAIT = "traditional": portrait.png -> grayscale -> threshold -> skeletonize -> pixel chains -> smooth -> RDP (eps 1.5)
-> greedy stroke order -> ONE continuous line (visible travel joins), plus the authored scene around the bust
(candle, desk, page stack, sleeve + hand + quill) so the dot starts and ends at the candle flame.
usage: py trace.py [--png]   -> fig.json (+ qa/fig_trace.png, qa/fig_overlay.png)"""
import json, sys
import numpy as np
from PIL import Image, ImageDraw
from skimage.morphology import skeletonize, remove_small_objects
from scipy.ndimage import uniform_filter1d

SRC = 'ref/portrait.png'
im = np.asarray(Image.open(SRC).convert('L'), dtype=np.float32)
H, W = im.shape
ink = remove_small_objects(im < 150, 24)
sk = skeletonize(ink)
DESK_Y = 1095
sk[DESK_Y - 8:, :] = False          # below the desk top: hidden behind the desk

# ---------- pixel graph -> chains ----------
ys, xs = np.nonzero(sk)
S = set(zip(ys.tolist(), xs.tolist()))
NB8 = [(-1, -1), (-1, 0), (-1, 1), (0, -1), (0, 1), (1, -1), (1, 0), (1, 1)]
def nbrs(p): y, x = p; return [(y + dy, x + dx) for dy, dx in NB8 if (y + dy, x + dx) in S]
deg = {p: len(nbrs(p)) for p in S}
nodes = {p for p in S if deg[p] != 2}
used = set()
ek = lambda a, b: (a, b) if a < b else (b, a)
def walk(a, b):
    ch = [a, b]; used.add(ek(a, b)); prev, cur = a, b
    while cur not in nodes:
        nx = [q for q in nbrs(cur) if q != prev and ek(cur, q) not in used]
        if not nx: break
        q = min(nx, key=lambda q: abs(q[0] - cur[0]) + abs(q[1] - cur[1])); used.add(ek(cur, q)); ch.append(q); prev, cur = cur, q
    return ch
chains = []
for n in nodes:
    for q in nbrs(n):
        if ek(n, q) not in used: chains.append(walk(n, q))
for p in S:
    for q in nbrs(p):
        if ek(p, q) not in used: chains.append(walk(p, q))

def plen(P): return float(np.hypot(*np.diff(P, axis=0).T).sum()) if len(P) > 1 else 0.0
def rdp(P, eps):
    if len(P) < 3: return P
    a, b = P[0], P[-1]; ab = b - a; L = np.hypot(*ab)
    d = np.abs(ab[0] * (P[:, 1] - a[1]) - ab[1] * (P[:, 0] - a[0])) / L if L > 1e-9 else np.hypot(*(P - a).T)
    i = int(np.argmax(d))
    if d[i] > eps: return np.vstack([rdp(P[:i + 1], eps)[:-1], rdp(P[i:], eps)])
    return np.vstack([a, b])
def smooth(P, k=5):
    if len(P) < k + 2: return P
    Q = uniform_filter1d(P, k, axis=0, mode='nearest'); Q[0], Q[-1] = P[0], P[-1]; return Q

polys = [np.array([(x, y) for y, x in ch], dtype=np.float64) for ch in chains]
polys = [P for P in polys if plen(P) >= 6]

# merge chains meeting end-to-end (junction splits) when the turn is gentle
def merge(polys, tol=3.5, minstraight=0.5):
    while True:
        E = np.array([[*P[0], i, 0] for i, P in enumerate(polys)] + [[*P[-1], i, 1] for i, P in enumerate(polys)])
        best = None
        for a in range(len(E)):
            d = np.hypot(E[:, 0] - E[a, 0], E[:, 1] - E[a, 1]); cand = np.nonzero((d <= tol) & (E[:, 2] != E[a, 2]))[0]
            for b in cand:
                if b <= a: continue
                i, ei, j, ej = int(E[a, 2]), int(E[a, 3]), int(E[b, 2]), int(E[b, 3])
                Pi, Pj = polys[i], polys[j]
                da = (Pi[min(4, len(Pi) - 1)] - Pi[0]) if ei == 0 else (Pi[-1 - min(4, len(Pi) - 1)] - Pi[-1])
                db = (Pj[min(4, len(Pj) - 1)] - Pj[0]) if ej == 0 else (Pj[-1 - min(4, len(Pj) - 1)] - Pj[-1])
                st = -float(da @ db) / (np.hypot(*da) * np.hypot(*db) + 1e-9)
                if st >= minstraight and (best is None or st > best[0]): best = (st, i, ei, j, ej)
        if not best: return polys
        _, i, ei, j, ej = best
        A = polys[i] if ei == 1 else polys[i][::-1]; Bp = polys[j] if ej == 0 else polys[j][::-1]
        polys[i] = np.vstack([A, Bp[1:]]); polys.pop(j)
polys = merge(polys)
FACE = (250, 330, 560, 560)   # eyes, brows, nose: keep their short strokes
def keep(P):
    L = plen(P); c = P.mean(0)
    inface = FACE[0] < c[0] < FACE[2] and FACE[1] < c[1] < FACE[3]
    return L >= (10 if inface else 16)
polys = [rdp(smooth(P), 1.5) for P in polys if keep(P)]

# ---------- authored scene (cubic Beziers, image px). The bust looks left, so the desk work is on the left ----------
def cubic(p0, p1, p2, p3, n=24):
    t = np.linspace(0, 1, n)[:, None]; p0, p1, p2, p3 = map(np.array, (p0, p1, p2, p3))
    return (1 - t) ** 3 * p0 + 3 * (1 - t) ** 2 * t * p1 + 3 * (1 - t) * t * t * p2 + t ** 3 * p3
def path(segs):
    out = [cubic(*s) for s in segs]; return np.vstack([out[0]] + [o[1:] for o in out[1:]])
def L_(a, b): a, b = np.array(a, float), np.array(b, float); return (a, a + (b - a) / 3, a + 2 * (b - a) / 3, b)
CX, DY = -640.0, DESK_Y
FLAME = (CX, 846.0)
candle = path([
    ((CX, 846), (CX + 24, 806), (CX + 6, 776), (CX, 756)),                # flame: right edge up to the tip
    ((CX, 756), (CX - 8, 778), (CX - 28, 808), (CX - 2, 866)),            # left edge down
    L_((CX - 2, 866), (CX, 886)),                                          # wick
    ((CX, 886), (CX - 18, 886), (CX - 28, 886), (CX - 28, 898)),          # top-left
    L_((CX - 28, 898), (CX - 28, 1070)),                                   # left side
    ((CX - 28, 1070), (CX - 66, 1070), (CX - 82, 1078), (CX - 70, DY)),   # dish left
    L_((CX - 70, DY), (CX + 70, DY)),                                      # dish base (on the desk)
    ((CX + 70, DY), (CX + 82, 1078), (CX + 66, 1070), (CX + 28, 1070)),   # dish right
    L_((CX + 28, 1070), (CX + 28, 898)),                                   # right side up
    ((CX + 28, 898), (CX + 28, 886), (CX + 18, 886), (CX, 886)),          # top-right back to the wick
    ((CX, 886), (CX + 18, 886), (CX + 28, 886), (CX + 28, 898)),          # retrace (overlaps: no new ink)
    L_((CX + 28, 898), (CX + 28, 1070)),
    ((CX + 28, 1070), (CX + 66, 1070), (CX + 82, 1078), (CX + 70, DY)),
])
X0D, X1D = -800.0, 960.0
desk = path([
    L_((CX + 70, DY), (X1D - 16, DY)),                                     # top edge, all the way right
    ((X1D - 16, DY), (X1D - 2, DY), (X1D, DY + 6), (X1D, DY + 18)),
    ((X1D, DY + 18), (X1D, DY + 34), (X1D - 4, DY + 42), (X1D - 18, DY + 42)),
    L_((X1D - 18, DY + 42), (X0D + 18, DY + 42)),                          # front edge, all the way left
    ((X0D + 18, DY + 42), (X0D + 4, DY + 42), (X0D, DY + 34), (X0D, DY + 18)),
    ((X0D, DY + 18), (X0D, DY + 6), (X0D + 2, DY), (X0D + 16, DY)),
    L_((X0D + 16, DY), (CX - 70, DY)),                                     # top edge to the dish
    L_((CX - 70, DY), (CX + 70, DY)),                                      # retrace under the dish
    L_((CX + 70, DY), (-470, DY)),                                         # retrace to the page stack
])
PX0, PX1, PFL, PFR, PFY, PNY = -470.0, -150.0, -432.0, -196.0, 992.0, 1066.0
stack = path([
    L_((PX0, DY), (PX0, PNY)),                                             # left side of the stack
    L_((PX0, PNY), (PFL, PFY)),                                            # top page: left edge
    L_((PFL, PFY), (PFR, PFY)),                                            # far edge
    L_((PFR, PFY), (PX1, PNY)),                                            # right edge
    L_((PX1, PNY), (PX0, PNY)),                                            # near edge
    L_((PX0, PNY), (PX0, PNY + 14)),                                       # retrace down the left side
    L_((PX0, PNY + 14), (PX1, PNY + 14)),                                  # a second page edge
    ((PX1, PNY + 14), (PX1 + 5, PNY + 19), (PX1 + 5, PNY + 22), (PX1, DY)),
])
PAGE = [(PX0 + 28, PNY - 12), (PX1 - 40, PNY - 12), (PFR - 22, PFY + 12), (PFL + 16, PFY + 12)]
NIB = (-262.0, 1050.0)
arm = path([
    L_((PX1, DY), (60, DY)),                                               # along the desk (retrace) to the sleeve
    ((60, DY), (-10, 1078), (-90, 1060), (-150, 1050)),                   # sleeve under-edge up to the heel of the hand
    ((-150, 1050), (-170, 1058), (-196, 1058), (-220, 1048)),             # palm
    L_((-220, 1048), NIB),                                                 # nib, below the fingers
    L_(NIB, (-226, 1034)),                                                 # back up the shaft (retrace)
    ((-226, 1034), (-238, 1022), (-226, 1000), (-206, 994)),              # fingers curl over the shaft
    ((-206, 994), (-196, 992), (-188, 992), (-182, 994)),                 # where the shaft leaves the hand
    ((-182, 994), (-160, 950), (-140, 905), (-118, 858)),                 # shaft up to the tip
    ((-118, 858), (-160, 880), (-186, 930), (-178, 972)),                 # feather vane, outer edge
    ((-178, 972), (-160, 940), (-138, 900), (-118, 858)),                 # inner edge back to the tip
    ((-118, 858), (-140, 905), (-160, 950), (-182, 994)),                 # retrace the shaft down
    ((-182, 994), (-170, 998), (-158, 1006), (-156, 1016)),               # knuckles / wrist
    ((-156, 1016), (-120, 930), (-70, 860), (4, 816)),                    # sleeve top edge up to the robe edge
    ((4, 816), (60, 900), (100, 1000), (130, DY)),                        # down the robe to the desk
])
quill = arm[:0]

# ---------- bust order: bands bottom -> top (it starts at the desk and finishes on the hat) ----------
BAND = 110
def band(P): return int(max(P[0][1], P[-1][1]) // BAND)
bands = {}
for P in polys: bands.setdefault(band(P), []).append(P)
order = [('candle', candle), ('desk', desk), ('stack', stack), ('arm', arm)]
cur = arm[-1]
for n, bi in enumerate(sorted(bands, reverse=True)):
    rest = bands[bi]
    # boustrophedon: the band is swept left->right or right->left, whichever end is nearer to the pen
    xs_ = [P[:, 0].mean() for P in rest]
    ltr = abs(min(xs_) - cur[0]) <= abs(max(xs_) - cur[0])
    rest = [P for _, P in sorted(zip(xs_, rest), key=lambda z: z[0] if ltr else -z[0])]
    while rest:
        # among the next few in sweep order, take the nearest start (keeps joins short without long back-jumps)
        best, k, rev = 1e18, -1, False
        for i, P in enumerate(rest[:1]):
            for r, e in ((False, P[0]), (True, P[-1])):
                c = (e[0] - cur[0]) ** 2 + (e[1] - cur[1]) ** 2
                if c < best: best, k, rev = c, i, r
        P = rest.pop(k); P = P[::-1] if rev else P; order.append(('bust', P)); cur = P[-1]# home: down his back to the desk, along the desk (already-drawn ink) to the candle, up its side to the flame
BACK = (899.0, 852.0)
home = np.vstack([cubic(tuple(cur), (cur[0] + 260, cur[1] + 60), (BACK[0] + 40, BACK[1] - 300), BACK),
                  cubic(BACK, (BACK[0] + 30, 940), (930, 1040), (930, DY))[1:],
                  cubic(*L_((930, DY), (CX + 28, DY)), n=60)[1:],
                  cubic(*L_((CX + 28, DY), (CX + 28, 898)))[1:], cubic((CX + 28, 898), (CX + 28, 886), (CX + 18, 886), (CX, 886))[1:],
                  cubic(*L_((CX, 886), (CX - 2, 866)))[1:], cubic((CX - 2, 866), (CX - 4, 860), (CX - 2, 852), FLAME)[1:]])
order.append(('home', home))
pts, breaks, kinds = [], [], []
for k, P in order:
    if pts:
        last = np.array(pts[-1]); d = np.hypot(*(P[0] - last))
        if d > 0.5: pts.extend(cubic(*L_(tuple(last), tuple(P[0])), n=max(3, int(d / 6)))[1:-1].tolist())   # visible travel join
    breaks.append(len(pts)); kinds.append(k); pts.extend(P.tolist())
pts = np.array(pts)
x0, y0 = pts.min(0); x1, y1 = pts.max(0)
print('bust strokes', len(polys), 'strokes', len(order), 'points', len(pts), 'length', round(plen(pts)), 'box', [round(v) for v in (x0, y0, x1, y1)])
json.dump({'pts': [round(v, 1) for v in pts.ravel().tolist()], 'breaks': breaks, 'kinds': kinds, 'box': [float(x0), float(y0), float(x1), float(y1)],
           'flame': FLAME, 'nib': NIB, 'page': PAGE, 'length': plen(pts)}, open('fig.json', 'w'))
if '--png' in sys.argv:
    s = 0.8; ox, oy = -x0 + 20, -y0 + 20; size = (int((x1 - x0 + 40) * s), int((y1 - y0 + 40) * s))
    img = Image.new('RGB', size, (18, 22, 63)); dr = ImageDraw.Draw(img)
    dr.line([((x + ox) * s, (y + oy) * s) for x, y in pts], fill=(255, 143, 58), width=2); img.save('qa/fig_trace.png')
    ov = Image.new('RGB', size, (255, 255, 255)); ov.paste(Image.open(SRC).convert('RGB').resize((int(W * s), int(H * s))), (int(ox * s), int(oy * s)))
    d2 = ImageDraw.Draw(ov); d2.line([((x + ox) * s, (y + oy) * s) for x, y in pts], fill=(255, 60, 30), width=1); ov.save('qa/fig_overlay.png')
    print('wrote qa/fig_trace.png', size)
