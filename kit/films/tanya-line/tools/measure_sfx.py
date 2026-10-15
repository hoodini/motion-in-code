import json, glob, os, sys
exec(open('analyze.py').read().split("out = {'music'")[0].split('def music')[0])
src = open('analyze.py').read(); ns = {}
exec(src.split("out = {'music'")[0], ns)
A = json.load(open('analysis.json'))
for f in sorted(glob.glob('sfx/*.mp3')):
    k = os.path.basename(f)[:-4]
    if k not in A['sfx']: A['sfx'][k] = ns['sfx'](f); print(k, A['sfx'][k])
json.dump(A, open('analysis.json', 'w'), indent=1)
