Add-Type -AssemblyName System.Drawing
$img = [System.Drawing.Image]::FromFile('C:\Users\hasan\.gemini\antigravity\brain\717975bd-ae77-4dde-b8b2-f6559ff4020a\luxury_crown_logo_1791317459002.jpg')
$img.Save('C:\Users\hasan\OrderKing\icon.png', [System.Drawing.Imaging.ImageFormat]::Png)
