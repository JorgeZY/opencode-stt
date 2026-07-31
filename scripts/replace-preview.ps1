$text = [System.Text.Encoding]::UTF8.GetString([Convert]::FromBase64String($args[0]))
$replace = $args[1] -eq 'replace'
Set-Clipboard -Value $text
$shell = New-Object -ComObject WScript.Shell
if ($replace) { $shell.SendKeys('^z') }
$shell.SendKeys('^v')
