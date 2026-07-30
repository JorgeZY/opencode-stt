$text = [System.Text.Encoding]::UTF8.GetString([Convert]::FromBase64String($args[0]))
Set-Clipboard -Value $text
$shell = New-Object -ComObject WScript.Shell
$shell.SendKeys('^v')
