$shortcutPath = Join-Path ([Environment]::GetFolderPath('Startup')) 'OpenCode STT.lnk'
Remove-Item $shortcutPath -ErrorAction SilentlyContinue
Write-Host 'OpenCode STT autostart removed.'
