$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot
$startup = [Environment]::GetFolderPath('Startup')
$shortcutPath = Join-Path $startup 'OpenCode STT.lnk'
$launcher = Join-Path $PSScriptRoot 'start-hidden.vbs'

$shell = New-Object -ComObject WScript.Shell
$shortcut = $shell.CreateShortcut($shortcutPath)
$shortcut.TargetPath = 'wscript.exe'
$shortcut.Arguments = '"' + $launcher + '"'
$shortcut.WorkingDirectory = $root
$shortcut.Description = 'Start the OpenCode voice input helper'
$shortcut.Save()

Write-Host "Autostart installed: $shortcutPath"
