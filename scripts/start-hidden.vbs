Set shell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
root = fso.GetParentFolderName(fso.GetParentFolderName(WScript.ScriptFullName))
logPath = fso.BuildPath(root, "opencode-stt.log")
quote = Chr(34)
command = "cmd.exe /d /c " & quote & "cd /d " & quote & root & quote & " && npm start >> " & quote & logPath & quote & " 2>&1" & quote
shell.Run command, 0, False
