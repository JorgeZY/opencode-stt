Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

$payload = [System.Text.Encoding]::UTF8.GetString([Convert]::FromBase64String($args[0])) | ConvertFrom-Json
$form = New-Object System.Windows.Forms.Form
$form.Text = 'OpenCode Voice Task'
$form.Size = New-Object System.Drawing.Size(720, 390)
$form.StartPosition = 'CenterScreen'
$form.TopMost = $true

$promptLabel = New-Object System.Windows.Forms.Label
$promptLabel.Text = 'Recognized text (editable)'
$promptLabel.Location = New-Object System.Drawing.Point(18, 18)
$form.Controls.Add($promptLabel)

$prompt = New-Object System.Windows.Forms.TextBox
$prompt.Multiline = $true
$prompt.ScrollBars = 'Vertical'
$prompt.Text = $payload.text
$prompt.Location = New-Object System.Drawing.Point(18, 42)
$prompt.Size = New-Object System.Drawing.Size(665, 180)
$form.Controls.Add($prompt)

$projectLabel = New-Object System.Windows.Forms.Label
$projectLabel.Text = 'Send to project'
$projectLabel.Location = New-Object System.Drawing.Point(18, 240)
$form.Controls.Add($projectLabel)

$projects = New-Object System.Windows.Forms.ComboBox
$projects.DropDownStyle = 'DropDownList'
$projects.Location = New-Object System.Drawing.Point(18, 264)
$projects.Size = New-Object System.Drawing.Size(665, 28)
foreach ($project in $payload.projects) { [void]$projects.Items.Add($project.directory) }
$projects.SelectedIndex = 0
$form.Controls.Add($projects)

$send = New-Object System.Windows.Forms.Button
$send.Text = 'Send'
$send.Location = New-Object System.Drawing.Point(527, 308)
$send.Add_Click({ $form.Tag = 'send'; $form.Close() })
$form.Controls.Add($send)

$cancel = New-Object System.Windows.Forms.Button
$cancel.Text = 'Cancel'
$cancel.Location = New-Object System.Drawing.Point(608, 308)
$cancel.Add_Click({ $form.Tag = 'cancel'; $form.Close() })
$form.Controls.Add($cancel)

$form.Add_Shown({ $prompt.Focus() })
[void]$form.ShowDialog()
if ($form.Tag -eq 'send' -and -not [string]::IsNullOrWhiteSpace($prompt.Text)) {
  [PSCustomObject]@{ text = $prompt.Text.Trim(); directory = $projects.SelectedItem } | ConvertTo-Json -Compress
}
