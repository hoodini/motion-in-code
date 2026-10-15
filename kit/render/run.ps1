# Parallel render of one layout of a kit film, then concat. Windows / PowerShell.
# usage: .\run.ps1 -Film film.html -L h -Frames 943 [-Workers 6] [-Sub 6] [-Extra "theme=phoenix"]
param([string]$Film = 'film.html', [string]$L = 'h', [int]$Frames, [int]$Workers = 6, [int]$Sub = 6, [string]$Extra = '')
$d = (Get-Location).Path
New-Item -ItemType Directory -Force "$d\seg", "$d\logs" | Out-Null
$per = [Math]::Ceiling($Frames / $Workers); $procs = @()
for ($i = 0; $i -lt $Workers; $i++) {
  $a = $i * $per; $b = [Math]::Min($Frames, $a + $per); if ($a -ge $b) { continue }
  $out = "$d\seg\$L`_$i.mp4"
  $procs += Start-Process -FilePath node -ArgumentList "render.js `"$Film`" $L $a $b `"$out`" $Sub $Extra" -WorkingDirectory $d -NoNewWindow -PassThru `
    -RedirectStandardOutput "$d\logs\$L`_$i.log" -RedirectStandardError "$d\logs\$L`_$i.err"
}
$procs | Wait-Process
$list = "$d\seg\list_$L.txt"; Remove-Item $list -ErrorAction SilentlyContinue
for ($i = 0; $i -lt $Workers; $i++) { if (Test-Path "$d\seg\$L`_$i.mp4") { Add-Content $list ("file '" + "$d\seg\$L`_$i.mp4".Replace('\', '/') + "'") } }
ffmpeg -y -v error -f concat -safe 0 -i $list -c copy "$d\film_$L`_silent.mp4"
Set-Content "$d\logs\$L`_ALLDONE.txt" (Get-Date).ToString('s')
