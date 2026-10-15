import subprocess, numpy as np, sys, re
for f, (W, H) in [(r'C:\Users\User\Videos\motion-in-code\tanya-line-16x9.mp4', (1920, 1080)), (r'C:\Users\User\Videos\motion-in-code\tanya-line-9x16.mp4', (1080, 1920))]:
    def fr(sel):
        raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', f, '-vf', f'select=eq(n\\,{sel})', '-vsync', '0', '-frames:v', '1', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], capture_output=True).stdout
        return np.frombuffer(raw, np.uint8).reshape(H, W, 3).astype(np.int16)
    a, b = fr(0), fr(3597)
    e = subprocess.run(['ffmpeg', '-hide_banner', '-i', f, '-map', '0:a', '-af', 'ebur128=peak=true', '-f', 'null', '-'], capture_output=True, text=True).stderr
    print(f.split('\\')[-1], 'first-vs-last mean abs diff', round(float(np.abs(a - b).mean()), 4), '| LUFS', re.findall(r'I:\s+(-?[\d.]+) LUFS', e)[-1], 'TP', re.findall(r'Peak:\s+(-?[\d.]+) dBFS', e)[-1])
