import subprocess, numpy as np, sys, re
SUF = sys.argv[1] if len(sys.argv) > 1 else ''
for f, (W, H) in [(rf'C:\Users\User\Videos\motion-in-code\tanya-line{SUF}-16x9.mp4', (1920, 1080)), (rf'C:\Users\User\Videos\motion-in-code\tanya-line{SUF}-9x16.mp4', (1080, 1920))]:
    def fr(sel):
        raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', f, '-vf', f'select=eq(n\\,{sel})', '-vsync', '0', '-frames:v', '1', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], capture_output=True).stdout
        return np.frombuffer(raw, np.uint8).reshape(H, W, 3).astype(np.int16)
    n = int(subprocess.run(['ffprobe', '-v', 'error', '-count_frames', '-select_streams', 'v:0', '-show_entries', 'stream=nb_read_frames', '-of', 'csv=p=0', f], capture_output=True, text=True).stdout.strip()); a, b = fr(0), fr(n - 1)
    e = subprocess.run(['ffmpeg', '-hide_banner', '-i', f, '-map', '0:a', '-af', 'ebur128=peak=true', '-f', 'null', '-'], capture_output=True, text=True).stderr
    print(f.split('\\')[-1], 'frames', n, 'first-vs-last mean abs diff', round(float(np.abs(a - b).mean()), 4), '| LUFS', re.findall(r'I:\s+(-?[\d.]+) LUFS', e)[-1], 'TP', re.findall(r'Peak:\s+(-?[\d.]+) dBFS', e)[-1])
