"""Composition plan for the v3 music, cut to the film's own structure (read from film.js after the holds are planned).
The track starts at the title cut (film b4); the hook montage before it is built from chops of the first drop (mix3.py).
usage: python music_plan.py > plan.json"""
import json, re
src = open('/home/claude/motion-in-code/kit/films/explainer/film.js', encoding='utf-8').read()
BPM = float(re.search(r'const BPM = ([\d.]+);', src).group(1)); B = 60 / BPM
HOLDS = json.loads(re.search(r'const HOLDS = (\[.*?\]);', src).group(1))
bt = lambda k: (k + sum(n for p, n, _ in HOLDS if k >= p)) * B
A = {'title': bt(4), 'ch03': bt(48), 'ch06': bt(104), 'break': bt(144), 'builder': bt(152), 'finale': bt(192), 'end': bt(208)}
ms = lambda a, b: int(round((A[b] - A[a]) * 1000))
G = ['high-energy 2026 TikTok edit beat', f'exactly {BPM:g} BPM', 'jersey club drums with bouncy kick patterns', 'punchy distorted 808 bass',
     'crisp fast hi-hat rolls', 'bright future bass supersaw chords', 'chopped vocal fx with no words', 'modern loud polished mix', 'instrumental']
NEG = ['lyrics', 'singing', 'rap vocals', 'spoken words', 'acoustic guitar', 'orchestral strings', 'lo-fi', 'slow tempo', 'muddy mix', 'long fade in']
plan = {
  'models': ['music_v1'],
  'composition_plan': {
    'positive_global_styles': G, 'negative_global_styles': NEG,
    'sections': [
      {'section_name': 'Drop A', 'duration_ms': ms('title', 'ch03'), 'lines': [],
       'positive_local_styles': ['starts instantly on a huge drop hit with no intro', 'full drums and 808 from the first beat', 'driving and bouncy'], 'negative_local_styles': ['intro', 'build up', 'quiet start']},
      {'section_name': 'Groove lift', 'duration_ms': ms('ch03', 'ch06'), 'lines': [],
       'positive_local_styles': ['energy lifts with a new synth lead', 'steady driving groove', 'snare fills every eight bars'], 'negative_local_styles': ['breakdown', 'silence']},
      {'section_name': 'Groove B', 'duration_ms': ms('ch06', 'break'), 'lines': [],
       'positive_local_styles': ['variation of the groove with chopped vocal fx', 'kept at full energy', 'riser in the last bar'], 'negative_local_styles': ['breakdown', 'silence']},
      {'section_name': 'Breakdown', 'duration_ms': max(3000, ms('break', 'builder')), 'lines': [],
       'positive_local_styles': ['sudden breakdown', 'drums cut out', 'filtered pad and a rising riser', 'tension before the drop'], 'negative_local_styles': ['kick drum', 'full drums']},
      {'section_name': 'Drop C', 'duration_ms': ms('builder', 'finale'), 'lines': [],
       'positive_local_styles': ['the biggest drop of the track', 'full energy', 'wide supersaws and heavy 808'], 'negative_local_styles': ['quiet', 'sparse']},
      {'section_name': 'Finale', 'duration_ms': ms('finale', 'end') + 1200, 'lines': [],
       'positive_local_styles': ['climax with a final build', 'ends on one big hit and a short tail'], 'negative_local_styles': ['long fade out', 'slow ending']},
    ]},
  'anchors': A, 'bpm': BPM,
}
print(json.dumps(plan, ensure_ascii=False, indent=1))
