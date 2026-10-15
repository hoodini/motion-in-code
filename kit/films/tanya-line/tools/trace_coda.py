"""Two more one-line drawings for the 770 cut.
reb.json: the Lubavitcher Rebbe from ref/lubavitcher-rebbe.png (user's SVG) -> iso-luminance contours (gaussian 2) inside the head
          + an authored hat crown (dark hat on a dark ground has no contour).
770.json: 770 Eastern Parkway authored as strokes over ref/770.png (user's SVG): three gables, bay window, door, windows, steps, fence."""
import json, sys
import numpy as np
from PIL import Image, ImageDraw
from skimage import measure, filters
def plen(P): return float(np.hypot(*np.diff(P, axis=0).T).sum()) if len(P) > 1 else 0
def rdp(P, e):
    if len(P) < 3: return P
    a, b = P[0], P[-1]; ab = b - a; L = np.hypot(*ab)
    d = np.abs(ab[0] * (P[:, 1] - a[1]) - ab[1] * (P[:, 0] - a[0])) / L if L > 1e-9 else np.hypot(*(P - a).T)
    i = int(np.argmax(d)); return np.vstack([rdp(P[:i + 1], e)[:-1], rdp(P[i:], e)]) if d[i] > e else np.vstack([a, b])
def cubic(p0, p1, p2, p3, n=24):
    t = np.linspace(0, 1, n)[:, None]; p0, p1, p2, p3 = map(np.array, (p0, p1, p2, p3))
    return (1 - t) ** 3 * p0 + 3 * (1 - t) ** 2 * t * p1 + 3 * (1 - t) * t * t * p2 + t ** 3 * p3
def poly(pts, n=12):
    out = [np.array(pts[0], float)]
    for a, b in zip(pts[:-1], pts[1:]):
        a, b = np.array(a, float), np.array(b, float); out += [a + (b - a) * k / n for k in range(1, n + 1)]
    return np.array(out)
def join1(strokes, start, fast=False):
    """greedy nearest neighbour; a closed loop is entered at its point nearest to the pen and run back to that point"""
    rest = [np.asarray(P, float) for P in strokes]; cur = np.array(start, float); order = []
    while rest:
        best = None
        for i, P in enumerate(rest):
            closed = np.hypot(*(P[0] - P[-1])) < 3 and len(P) > 4
            d = np.hypot(P[:, 0] - cur[0], P[:, 1] - cur[1])
            if closed: j = int(np.argmin(d)); c = d[j]
            else: j = 0 if d[0] <= d[-1] else -1; c = d[j]
            if best is None or c < best[0]: best = (c, i, j, closed)
        _, i, j, closed = best; P = rest.pop(i)
        if closed: P = np.vstack([P[j:-1], P[:j + 1]])
        elif j == -1: P = P[::-1]
        order.append(P); cur = P[-1]
    if fast:
        pts = []
        for P in order: pts += P.tolist()
        return np.array(pts), len(order)
    return route(order), len(order)
def resamp(P, step=6):
    P = np.asarray(P, float); d = np.r_[0, np.cumsum(np.hypot(*np.diff(P, axis=0).T))]
    if d[-1] < step: return P[[0, -1]]
    s = np.linspace(0, d[-1], int(d[-1] / step) + 1); return np.c_[np.interp(s, d, P[:, 0]), np.interp(s, d, P[:, 1])]
def route(order):
    """join consecutive strokes by the cheapest path over ink already on the page (gap jumps cost 4x), so travel retraces lines"""
    from scipy.sparse import coo_matrix
    from scipy.sparse.csgraph import dijkstra
    from scipy.spatial import cKDTree
    R = [resamp(P) for P in order]; nodes = np.vstack(R); off = np.cumsum([0] + [len(r) for r in R])
    I, J, Wt = [], [], []
    for k, r in enumerate(R):
        a = np.arange(off[k], off[k + 1] - 1); I += list(a); J += list(a + 1); Wt += list(np.hypot(*np.diff(r, axis=0).T) + 1e-3)
    tree = cKDTree(nodes)
    for a, b in tree.query_pairs(40):
        I.append(a); J.append(b); Wt.append(4 * np.hypot(*(nodes[a] - nodes[b])) + 1e-3)
    G = coo_matrix((Wt + Wt, (I + J, J + I)), shape=(len(nodes), len(nodes))).tocsr()
    pts = list(order[0].tolist())
    for k in range(1, len(order)):
        a, b = off[k] - 1, off[k]
        _, pred = dijkstra(G, indices=a, return_predecessors=True)
        path = []; c = b
        while c != a and c >= 0: path.append(c); c = pred[c]
        if c != a: path = [b]
        for q in path[::-1][:-1]: pts.append(nodes[q].tolist())
        pts += order[k].tolist()
    return np.array(pts)
def join(strokes, start, band=None, tries=40):
    """multi-start greedy: keep the ordering with the least visible travel"""
    cands = [start] + [np.asarray(P, float)[0] for P in strokes][:tries]
    best = None
    for c in cands:
        pts, n = join1(strokes, c, fast=True); L = plen(pts); ink = sum(plen(np.asarray(P, float)) for P in strokes)
        if best is None or L - ink < best[0]: best = (L - ink, pts, n, c)
    print('  travel', round(best[0])); return join1(strokes, best[3])

def save(name, pts, W, H, n):
    x0, y0 = pts.min(0); x1, y1 = pts.max(0)
    json.dump({'pts': [round(v, 1) for v in pts.ravel().tolist()], 'box': [float(x0), float(y0), float(x1), float(y1)]}, open(name + '.json', 'w'))
    img = Image.new('RGB', (W, H), (175, 203, 239)); d = ImageDraw.Draw(img); d.line([tuple(p) for p in pts], fill=(18, 22, 63), width=2); img.save(f'qa/{name}_trace.png')
    print(name, 'strokes', n, 'points', len(pts), 'length', round(plen(pts)))

# ---------- the Rebbe ----------
rgb = np.asarray(Image.open('ref/lubavitcher-rebbe.png').convert('RGB'), dtype=np.float32) / 255
Lm = filters.gaussian(rgb.mean(2), 2.0); H, W = Lm.shape
S = []
for lv in (0.30, 0.45, 0.62):
    for c in measure.find_contours(Lm, lv):
        P = c[:, ::-1]; cx, cy = P.mean(0)
        if plen(P) < 60 or not (70 < cx < 600 and 110 < cy < 700) or P[:, 0].max() > (650 if cy < 260 else 600): continue
        S.append(rdp(P, 1.2))
S.append(poly([(36, 112), (60, 96), (120, 84), (150, 70)]))                                     # brim, left
S.append(np.vstack([cubic((150, 70), (160, 20), (220, 4), (300, 4)), cubic((300, 4), (400, 2), (480, 12), (505, 70))[1:]]))   # crown
S.append(cubic((505, 70), (520, 110), (560, 150), (636, 236)))                                 # down to the brim tip
S.append(np.vstack([cubic((36, 114), (70, 150), (120, 170), (230, 162)), cubic((230, 162), (360, 156), (520, 200), (636, 238))[1:]]))   # under the brim
reb, n = join(S, (W / 2, H)); save('reb', reb, W, H, n)

# ---------- 770 Eastern Parkway ----------
R = lambda x0, y0, x1, y1: poly([(x0, y0), (x1, y0), (x1, y1), (x0, y1), (x0, y0)])
def win(x0, y0, x1, y1, cols):  # window with mullions
    out = [R(x0, y0, x1, y1)]
    for k in range(1, cols): x = x0 + (x1 - x0) * k / cols; out.append(poly([(x, y0), (x, y1)]))
    return out
S7 = [
  poly([(20, 1000), (880, 1000)]),                                                    # pavement line
  poly([(55, 915), (55, 420), (205, 248), (345, 420), (345, 915)]),                     # left wing + gable
  poly([(345, 435), (437, 330), (530, 435)]),                                          # centre gable
  poly([(540, 915), (540, 420), (668, 245), (800, 420), (800, 915)]),                  # right wing + gable
  poly([(70, 330), (70, 290), (100, 290), (100, 330)]), poly([(758, 330), (758, 280), (793, 280), (793, 330)]),   # chimneys
  poly([(437, 330), (437, 306)]), poly([(668, 245), (668, 228)]), poly([(205, 248), (205, 232)]),               # finials
  poly([(345, 435), (345, 870)]), poly([(530, 435), (530, 870)]),                       # centre bay walls
  poly([(374, 585), (392, 548), (482, 548), (500, 585), (500, 690), (476, 712), (398, 712), (374, 690), (374, 585)]),   # bay window
  poly([(410, 585), (410, 690)]), poly([(464, 585), (464, 690)]),
  poly([(410, 870), (410, 790), (437, 772), (465, 790), (465, 870)]),                   # door (pointed arch)
  poly([(360, 890), (540, 890)]), poly([(360, 925), (540, 925)]), poly([(360, 960), (540, 960)]),               # steps
  poly([(20, 915), (345, 915)]), poly([(540, 915), (880, 915)]),                        # garden wall
  poly([(330, 890), (330, 1000)]), poly([(565, 890), (565, 1000)]),                     # gate posts
] + win(395, 460, 480, 535, 3) + win(150, 450, 255, 530, 3) + win(150, 595, 255, 680, 3) + win(130, 740, 275, 855, 4) \
  + win(610, 445, 728, 530, 3) + win(610, 585, 728, 683, 3) + win(595, 735, 740, 855, 4) + [R(652, 340, 688, 372)]
p770, n = join(S7, (450, 1000), band=80); save('770', p770, 899, 1199, n)
