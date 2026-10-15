import sys, glob, os
from PIL import Image, ImageDraw
# py grid.py <out.jpg> <cols> <files...>
out, cols, files = sys.argv[1], int(sys.argv[2]), sys.argv[3:]
ims = [Image.open(f).convert('RGB') for f in files]; tw, th = ims[0].size
s = min(1.0, 1900 / (cols * tw)); tw2, th2 = int(tw * s), int(th * s)
rows = (len(ims) + cols - 1) // cols; g = Image.new('RGB', (cols * (tw2 + 4), rows * (th2 + 22)), 'white'); d = ImageDraw.Draw(g)
for i, (f, im) in enumerate(zip(files, ims)):
    x, y = (i % cols) * (tw2 + 4), (i // cols) * (th2 + 22); g.paste(im.resize((tw2, th2)), (x, y + 18)); d.text((x + 4, y + 3), os.path.basename(f), fill='black')
g.save(out, quality=85); print(out, g.size)
