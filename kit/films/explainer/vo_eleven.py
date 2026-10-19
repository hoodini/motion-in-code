# vo_eleven.py — narration for the "סרטון = קוד" explainer (ElevenLabs, voice Omer, eleven_v4).
# Run on your PC:   py vo_eleven.py        (paste the API key when asked; it is not saved anywhere)
# Output: vo\S01.mp3 … vo\S28.mp3 + vo\manifest.json, zipped to vo_explainer.zip next to this file.
# Only the Python standard library is used. ~1,800 characters in total (about 1,800 credits on eleven_v4).
import json, os, sys, time, zipfile, getpass, urllib.request, urllib.error, urllib.parse

VOICE = "k77ZRVqAFg9Hd0ltAuON"   # Omer - Confident, Upbeat Ad (Hebrew)
MODEL = "eleven_v4"
FALLBACK_MODEL = "eleven_v3"
API = os.environ.get("ELEVEN_API_BASE", "https://api.elevenlabs.io")
SEGMENTS = [
 {
  "id": "S01",
  "at": 0.4,
  "text": "[curious] איך עושים סרטון — רק מקוד?"
 },
 {
  "id": "S02",
  "at": 4.2,
  "text": "[confident] פשוט: סרטון — זה קוד."
 },
 {
  "id": "S03",
  "at": 6.3,
  "text": "[warmly] סרטון הוא בסך הכל שישים תמונות בשנייה."
 },
 {
  "id": "S04",
  "at": 9.9,
  "text": "וכל תמונה — היא פונקציה של הזמן."
 },
 {
  "id": "S05",
  "at": 12.4,
  "text": "[curious] אז איך קלוד מצייר מֶתֶג? מלבן, עיגול, צבע."
 },
 {
  "id": "S06",
  "at": 14.55,
  "text": "[warmly] בקו ישר — זה רובוטי. [excited] עם קפיץ — זה חי!"
 },
 {
  "id": "S07",
  "at": 18.1,
  "text": "[confident] אין פה קסם — רק מספרים בקפיץ."
 },
 {
  "id": "S08",
  "at": 21.7,
  "text": "ואת כל הקוד הזה — קלוד כותב."
 },
 {
  "id": "S09",
  "at": 24.4,
  "text": "הכלל הכי חשוב: משנים צורה, לא מעלימים."
 },
 {
  "id": "S10",
  "at": 26.6,
  "text": "כפתור מציף את המסך... נסגר לצַמְצָם... ודוחף את הסצנה הבאה."
 },
 {
  "id": "S11",
  "at": 32.4,
  "text": "[warmly] המוזיקה היא השעון: כל ביט — חצי שנייה, ועל כל ביט משהו קורה."
 },
 {
  "id": "S12",
  "at": 36.2,
  "text": "והסאונד מתחיל רגע לפני — כדי שהשיא ינחת בדיוק על הביט."
 },
 {
  "id": "S13",
  "at": 40.4,
  "text": "[curious] ואיך מבקשים את זה מקלוד? [confident] בפרומפט של שישה בלוקים."
 },
 {
  "id": "S14",
  "at": 44.4,
  "text": "ובמקום תְּאָרִים — מספרים. לא \"מהר\", אלא כמה שניות בדיוק."
 },
 {
  "id": "S15",
  "at": 48.4,
  "text": "ורשימה של מה שאסור — שמוחקת את הממוצע."
 },
 {
  "id": "S16",
  "at": 52.4,
  "text": "[warmly] כדי לבקש מדויק, צריך לדעת איך קוראים לכל דבר."
 },
 {
  "id": "S17",
  "at": 56.3,
  "text": "בשביל זה יש מילון: שם מדויק — פרומפט מדויק."
 },
 {
  "id": "S18",
  "at": 60.4,
  "text": "[curious] מי מצייר את הפיקסלים? מְעַבֵּד רגיל — כמה ליבות. כרטיס מסך — אלפים, במקביל."
 },
 {
  "id": "S19",
  "at": 65.0,
  "text": "[excited] שיידר מצייר כל פיקסל בנפרד — ועל ווב ג'י פי יו, מאתיים אלף חלקיקים."
 },
 {
  "id": "S20",
  "at": 68.4,
  "text": "[warmly] ואפילו עולם אמיתי: מפה, תמונה, ומודל תלת ממדי."
 },
 {
  "id": "S21",
  "at": 72.8,
  "text": "[softly] ועכשיו... בונים לבד."
 },
 {
  "id": "S22",
  "at": 76.4,
  "text": "[warmly] בבונה הפרומפטים בוחרים אלמנטים, והוא כותב את כל הפרומפט — סצנה אחרי סצנה, על הביט."
 },
 {
  "id": "S23",
  "at": 81.7,
  "text": "מעתיקים, ונותנים לקלוד."
 },
 {
  "id": "S24",
  "at": 84.4,
  "text": "[confident] ואז — רינדור. דפדפן מצלם כל פריים, ומחברים את כולם לסרטון."
 },
 {
  "id": "S25",
  "at": 88.5,
  "text": "כל פריים הוא בעצם שישה צילומים — וזה המושן בלר החלק."
 },
 {
  "id": "S26",
  "at": 92.3,
  "text": "ובסוף — סאונד, בדיוק על הביט."
 },
 {
  "id": "S27",
  "at": 96.2,
  "text": "[confident] אנחנו כותבים את הבימוי... קלוד כותב את הקוד."
 },
 {
  "id": "S28",
  "at": 99.8,
  "text": "[warmly] כל השיטה מחכה באתר. בואו נעוף גבוה."
 }
]

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "vo")

def call(method, path, key, body=None, accept="application/json"):
    data = json.dumps(body).encode("utf-8") if body is not None else None
    req = urllib.request.Request(API + path, data=data, method=method,
                                 headers={"xi-api-key": key, "Content-Type": "application/json", "Accept": accept})
    try:
        with urllib.request.urlopen(req, timeout=180) as r:
            return r.status, r.read()
    except urllib.error.HTTPError as e:
        return e.code, e.read()

def err_text(raw):
    try:
        j = json.loads(raw.decode("utf-8"))
        d = j.get("detail", j)
        return json.dumps(d, ensure_ascii=False)
    except Exception:
        return raw[:400].decode("utf-8", "replace")

def main():
    key = os.environ.get("ELEVENLABS_API_KEY") or getpass.getpass("ElevenLabs API key (hidden): ").strip()
    if not key:
        sys.exit("No key given.")
    os.makedirs(OUT, exist_ok=True)
    chars = sum(len(s["text"]) for s in SEGMENTS)
    st, raw = call("GET", "/v1/user/subscription", key)
    if st == 200:
        sub = json.loads(raw)
        left = sub.get("character_limit", 0) - sub.get("character_count", 0)
        print(f"Credits left: {left:,}  ·  this run needs about {chars:,}")
        if left < chars:
            sys.exit("Not enough credits on this key. Nothing was generated.")
    else:
        print(f"(could not read the subscription: {st} {err_text(raw)}; continuing)")

    voice, model, fmt = VOICE, MODEL, "mp3_44100_192"
    manifest = []
    for s in SEGMENTS:
        path = os.path.join(OUT, s["id"] + ".mp3")
        if os.path.exists(path) and os.path.getsize(path) > 2000:
            print(s["id"], "already there, skipped"); manifest.append({**s, "file": s["id"] + ".mp3", "model": model}); continue
        for attempt in range(6):
            body = {"text": s["text"], "model_id": model, "voice_settings": {"stability": 0.5, "similarity_boost": 0.8}}
            st, raw = call("POST", f"/v1/text-to-speech/{voice}?output_format={fmt}", key, body, accept="audio/mpeg")
            if st == 200 and len(raw) > 2000:
                open(path, "wb").write(raw); break
            msg = err_text(raw)
            low = msg.lower()
            if ("output_format" in low or "format" in low) and fmt != "mp3_44100_128":
                fmt = "mp3_44100_128"; print("  falling back to 128 kbps"); continue
            if "voice_not_found" in low or (st == 404 and "voice" in low):
                print("  the voice is not in this account yet, adding it from the Voice Library…")
                q = urllib.parse.urlencode({"search": "Omer", "language": "he", "page_size": 50})
                st2, raw2 = call("GET", f"/v1/shared-voices?{q}", key)
                hit = None
                if st2 == 200:
                    for v in json.loads(raw2).get("voices", []):
                        if v.get("voice_id") == VOICE: hit = v; break
                if not hit: sys.exit("Could not find Omer in the Voice Library from this key: " + err_text(raw2))
                st3, raw3 = call("POST", f"/v1/voices/add/{hit['public_owner_id']}/{VOICE}", key, {"new_name": "Omer (YUV.AI)"})
                if st3 != 200: sys.exit("Could not add the voice: " + err_text(raw3))
                voice = json.loads(raw3).get("voice_id", VOICE); continue
            if ("model" in low and ("not found" in low or "invalid" in low or "does not exist" in low)) and model != FALLBACK_MODEL:
                print(f"  {model} is not available on this key, using {FALLBACK_MODEL}"); model = FALLBACK_MODEL; continue
            if st in (429, 500, 502, 503, 504):
                time.sleep(4 * (attempt + 1)); continue
            sys.exit(f"{s['id']} failed: {st} {msg}")
        else:
            sys.exit(f"{s['id']} failed after retries")
        print(f"{s['id']}  {os.path.getsize(path)/1024:.0f} KB  ({model})")
        manifest.append({**s, "file": s["id"] + ".mp3", "model": model, "voice": voice, "format": fmt})
        time.sleep(0.3)
    json.dump(manifest, open(os.path.join(OUT, "manifest.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    zpath = os.path.join(HERE, "vo_explainer.zip")
    with zipfile.ZipFile(zpath, "w", zipfile.ZIP_DEFLATED) as z:
        for f in sorted(os.listdir(OUT)):
            z.write(os.path.join(OUT, f), arcname=f)
    print("\nDone:", zpath)
    print("Attach this zip in the chat with Claude.")

if __name__ == "__main__":
    main()
