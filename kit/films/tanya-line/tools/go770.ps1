Set-Location C:\Users\User\yuvwork\tanya-line
$env:PW_PATH = 'C:/Users/User/yuvwork/render/node_modules/playwright'
foreach ($L in 'h','v') { Copy-Item "film_$L`_silent.mp4" "film_$L`_main_silent.mp4" -Force }
foreach ($L in 'h','v') { & .\run.ps1 -Film film.html -L $L -Frames 4048 -Extra 'cut=770'; Move-Item "film_$L`_silent.mp4" "film_$L`_770_silent.mp4" -Force; Copy-Item "film_$L`_main_silent.mp4" "film_$L`_silent.mp4" -Force }
py mix.py cues770.json *> logs\mix770.log
py pops_mp4.py C:\Users\User\Videos\motion-in-code\tanya-line-770-16x9.mp4 *> logs\pops770_h.log
py pops_mp4.py C:\Users\User\Videos\motion-in-code\tanya-line-770-9x16.mp4 *> logs\pops770_v.log
Set-Content logs\GO770_DONE.txt (Get-Date).ToString('s')
