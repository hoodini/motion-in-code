"""ElevenLabs for the v3 explainer: narration with word timings, and the music track.
In a cloud session the key is a network secret: the agent proxy adds it to requests for api.elevenlabs.io, so no key is read here.
On a PC, set ELEVENLABS_API_KEY and it is sent as the xi-api-key header.
usage:
  python eleven.py check                     → subscription / credits
  python eleven.py vo  vo_script.json outdir → outdir/Sxx.mp3 + outdir/Sxx.json (character alignment), skips lines already done
  python eleven.py music plan.json out.mp3   → one composed track from a composition plan
Standard library only."""
import json, os, sys, time, base64, urllib.request, urllib.error

API = os.environ.get('ELEVEN_API_BASE', 'https://api.elevenlabs.io')
KEY = os.environ.get('ELEVENLABS_API_KEY')
VOICE = 'k77ZRVqAFg9Hd0ltAuON'          # Omer - Confident, Upbeat Ad (Hebrew)


def call(method, path, body=None, accept='application/json', timeout=300):
    h = {'Content-Type': 'application/json', 'Accept': accept}
    if KEY: h['xi-api-key'] = KEY
    data = json.dumps(body).encode('utf-8') if body is not None else None
    req = urllib.request.Request(API + path, data=data, method=method, headers=h)
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r: return r.status, r.read()
    except urllib.error.HTTPError as e: return e.code, e.read()


def detail(raw):
    try: j = json.loads(raw.decode('utf-8')); return json.dumps(j.get('detail', j), ensure_ascii=False)[:600]
    except Exception: return raw[:400].decode('utf-8', 'replace')


def check():
    st, raw = call('GET', '/v1/user/subscription')
    if st != 200: sys.exit(f'subscription: {st} {detail(raw)}')
    s = json.loads(raw); left = s.get('character_limit', 0) - s.get('character_count', 0)
    print(f"tier {s.get('tier')} · credits left {left:,} of {s.get('character_limit', 0):,}"); return left


def vo(script, out):
    d = json.load(open(script, encoding='utf-8')); os.makedirs(out, exist_ok=True)
    model, speed, fmt = d.get('model', 'eleven_v4'), d.get('speed'), 'mp3_44100_192'
    for s in d['segments']:
        mp3, js = os.path.join(out, s['id'] + '.mp3'), os.path.join(out, s['id'] + '.json')
        if os.path.exists(mp3) and os.path.exists(js): print(s['id'], 'done'); continue
        for attempt in range(6):
            vs = {'stability': 0.5, 'similarity_boost': 0.8}
            if speed: vs['speed'] = speed
            st, raw = call('POST', f'/v1/text-to-speech/{VOICE}/with-timestamps?output_format={fmt}', {'text': s['text'], 'model_id': model, 'voice_settings': vs})
            if st == 200:
                j = json.loads(raw); open(mp3, 'wb').write(base64.b64decode(j['audio_base64']))
                json.dump({'text': s['text'], 'model': model, 'speed': speed, 'alignment': j.get('alignment'), 'normalized_alignment': j.get('normalized_alignment')},
                          open(js, 'w', encoding='utf-8'), ensure_ascii=False)
                print(f"{s['id']} {os.path.getsize(mp3) // 1024} KB ({model}{', speed ' + str(speed) if speed else ''})"); break
            m = detail(raw).lower()
            if 'speed' in m and speed: print('  speed not accepted, retrying without it'); speed = None; continue
            if 'format' in m and fmt != 'mp3_44100_128': fmt = 'mp3_44100_128'; continue
            if st in (429, 500, 502, 503, 504): time.sleep(4 * (attempt + 1)); continue
            sys.exit(f"{s['id']}: {st} {detail(raw)}")
        else: sys.exit(f"{s['id']}: failed after retries")


def music(plan_path, out):
    plan = json.load(open(plan_path, encoding='utf-8'))
    body = {k: v for k, v in plan.items() if k in ('composition_plan', 'prompt', 'music_length_ms', 'force_instrumental', 'seed')}
    for model in plan.get('models', ['music_v1']):
        b = dict(body, model_id=model)
        st, raw = call('POST', '/v1/music?output_format=mp3_44100_192', b, accept='audio/mpeg', timeout=900)
        if st == 200 and len(raw) > 10000:
            open(out, 'wb').write(raw); print(f'{out} {len(raw) // 1024} KB ({model})'); return
        print(f'  {model}: {st} {detail(raw)}')
    sys.exit('music generation failed')


if __name__ == '__main__':
    cmd = sys.argv[1] if len(sys.argv) > 1 else 'check'
    if cmd == 'check': check()
    elif cmd == 'vo': vo(sys.argv[2], sys.argv[3])
    elif cmd == 'music': music(sys.argv[2], sys.argv[3])
