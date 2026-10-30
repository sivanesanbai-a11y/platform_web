
$exclude = @('.next', 'node_modules', '.git', '*.zip', '.vercel')
Get-ChildItem -Path 'C:\Users\NUNES\Desktop\NUNES_OPERATIONS_WORKSPACE\platform_web' -Exclude $exclude | Compress-Archive -DestinationPath 'C:\Users\NUNES\Desktop\nunes-operations-platform.zip' -Force
Write-Host "ZIP Created Successfully"
