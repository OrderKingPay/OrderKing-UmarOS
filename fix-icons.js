const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const apps = ['orderking-customers', 'orderking-partners', 'orderking-riders', 'HDmaster', 'Apps-integration-'];

const psScript = `
Add-Type -AssemblyName System.Drawing
$bmp192 = New-Object System.Drawing.Bitmap 192, 192
$g192 = [System.Drawing.Graphics]::FromImage($bmp192)
$rect192 = New-Object System.Drawing.Rectangle 0, 0, 192, 192
$rectF192 = New-Object System.Drawing.RectangleF 0, 0, 192, 192
$color1 = [System.Drawing.Color]::FromArgb(255, 255, 215, 0)
$color2 = [System.Drawing.Color]::FromArgb(255, 255, 140, 0)
$brush = New-Object System.Drawing.Drawing2D.LinearGradientBrush($rect192, $color1, $color2, [float]45.0)
$g192.FillRectangle($brush, $rect192)
$font = New-Object System.Drawing.Font("Segoe UI Emoji", 72)
$white = [System.Drawing.Color]::White
$whiteBrush = New-Object System.Drawing.SolidBrush($white)
$stringFormat = New-Object System.Drawing.StringFormat
$stringFormat.Alignment = [System.Drawing.StringAlignment]::Center
$stringFormat.LineAlignment = [System.Drawing.StringAlignment]::Center
$g192.DrawString("👑", $font, $whiteBrush, $rectF192, $stringFormat)
$bmp192.Save("icon-192.png", [System.Drawing.Imaging.ImageFormat]::Png)

$bmp512 = New-Object System.Drawing.Bitmap 512, 512
$g512 = [System.Drawing.Graphics]::FromImage($bmp512)
$rect512 = New-Object System.Drawing.Rectangle 0, 0, 512, 512
$rectF512 = New-Object System.Drawing.RectangleF 0, 0, 512, 512
$brush512 = New-Object System.Drawing.Drawing2D.LinearGradientBrush($rect512, $color1, $color2, [float]45.0)
$g512.FillRectangle($brush512, $rect512)
$font512 = New-Object System.Drawing.Font("Segoe UI Emoji", 192)
$g512.DrawString("👑", $font512, $whiteBrush, $rectF512, $stringFormat)
$bmp512.Save("icon-512.png", [System.Drawing.Imaging.ImageFormat]::Png)

$bmp192.Dispose()
$bmp512.Dispose()
$g192.Dispose()
$g512.Dispose()
`;

fs.writeFileSync('create-icons.ps1', psScript);
execSync('powershell.exe -ExecutionPolicy Bypass -File create-icons.ps1', { stdio: 'inherit' });

for (const app of apps) {
    const pubDir = path.join(__dirname, app, 'public');
    if (!fs.existsSync(pubDir)) continue;

    fs.copyFileSync('icon-192.png', path.join(pubDir, 'icon-192.png'));
    fs.copyFileSync('icon-512.png', path.join(pubDir, 'icon-512.png'));
    fs.copyFileSync('icon-192.png', path.join(pubDir, 'favicon.ico'));

    const manifestPath = path.join(pubDir, 'manifest.json');
    if (fs.existsSync(manifestPath)) {
        let manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
        manifest.icons = [
            {
                src: "/icon-192.png",
                sizes: "192x192",
                type: "image/png"
            },
            {
                src: "/icon-512.png",
                sizes: "512x512",
                type: "image/png"
            }
        ];
        fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    }

    const rootTsxPath = path.join(__dirname, app, 'src', 'routes', '__root.tsx');
    if (fs.existsSync(rootTsxPath)) {
        let rootTsx = fs.readFileSync(rootTsxPath, 'utf8');
        rootTsx = rootTsx.replace(/favicon\.svg/g, 'icon-192.png');
        rootTsx = rootTsx.replace(/href:.*?'\/favicon\.ico'/g, "href: '/favicon.ico'");
        fs.writeFileSync(rootTsxPath, rootTsx);
    }
}

console.log("Done");
