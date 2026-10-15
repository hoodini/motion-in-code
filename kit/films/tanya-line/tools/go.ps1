Set-Location C:\Users\User\yuvwork\tanya-line
$env:PW_PATH = 'C:/Users/User/yuvwork/render/node_modules/playwright'
New-Item -ItemType Directory -Force logs | Out-Null
& .\run.ps1 -Film film.html -L h -Frames 3598
& .\run.ps1 -Film film.html -L v -Frames 3598
python mix_cues.py cues.json *> logs\mix.log
py pops_mp4.py C:\Users\User\Videos\motion-in-code\tanya-line-16x9.mp4 *> logs\pops_h.log
py pops_mp4.py C:\Users\User\Videos\motion-in-code\tanya-line-9x16.mp4 *> logs\pops_v.log
Set-Content logs\GO_DONE.txt (Get-Date).ToString('s')
