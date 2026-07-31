$text = [System.Text.Encoding]::UTF8.GetString([Convert]::FromBase64String($args[0]))
$previousLength = [int]$args[1]
Set-Clipboard -Value $text
$shell = New-Object -ComObject WScript.Shell
if ($previousLength -gt 0) { $shell.SendKeys('{BACKSPACE ' + $previousLength + '}') }
$shell.SendKeys('^v')
