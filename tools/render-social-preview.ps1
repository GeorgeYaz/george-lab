# Render the portfolio's code-native identity as a static social sharing card.
Add-Type -AssemblyName System.Drawing
$card = New-Object System.Drawing.Bitmap 1200,630
$canvas = [System.Drawing.Graphics]::FromImage($card)
$canvas.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$canvas.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
$canvas.Clear([System.Drawing.ColorTranslator]::FromHtml('#0c0c0c'))
$white = New-Object System.Drawing.SolidBrush ([System.Drawing.ColorTranslator]::FromHtml('#f2f2f2'))
$dark = New-Object System.Drawing.SolidBrush ([System.Drawing.ColorTranslator]::FromHtml('#0c0c0c'))
$gray = New-Object System.Drawing.SolidBrush ([System.Drawing.ColorTranslator]::FromHtml('#a3a3a3'))
$stroke = New-Object System.Drawing.Pen ([System.Drawing.ColorTranslator]::FromHtml('#f2f2f2')),5
$red = New-Object System.Drawing.Pen ([System.Drawing.ColorTranslator]::FromHtml('#df6262')),5
$line = New-Object System.Drawing.Pen ([System.Drawing.ColorTranslator]::FromHtml('#333333')),1
$cyan = New-Object System.Drawing.Pen ([System.Drawing.ColorTranslator]::FromHtml('#04d9ff')),2
$nameFont = New-Object System.Drawing.Font 'Arial',58,([System.Drawing.FontStyle]::Bold),([System.Drawing.GraphicsUnit]::Pixel)
$tagFont = New-Object System.Drawing.Font 'Arial',53,([System.Drawing.FontStyle]::Regular),([System.Drawing.GraphicsUnit]::Pixel)
$monoFont = New-Object System.Drawing.Font 'Consolas',16,([System.Drawing.FontStyle]::Regular),([System.Drawing.GraphicsUnit]::Pixel)
$canvas.DrawLine($stroke,124,160,102,182)
$canvas.DrawLine($stroke,102,182,124,204)
$canvas.DrawLine($red,151,211,172,152)
$canvas.DrawLine($stroke,201,160,223,182)
$canvas.DrawLine($stroke,223,182,201,204)
$canvas.DrawString('GEORGE',$nameFont,$white,266,108)
$canvas.FillRectangle($white,296,178,252,70)
$canvas.DrawString('YAZIJY.',$nameFont,$dark,298,175)
$canvas.DrawString('Engineer by trade.',$tagFont,$white,94,327)
$canvas.DrawString('Curious by nature.',$tagFont,$white,94,391)
$canvas.DrawLine($line,100,510,1100,510)
$canvas.DrawLine($cyan,100,510,225,510)
$canvas.DrawString('/ PERSONAL PORTFOLIO',$monoFont,$gray,96,539)
$card.Save((Join-Path $PSScriptRoot '../assets/social-preview.png'),[System.Drawing.Imaging.ImageFormat]::Png)
$nameFont.Dispose(); $tagFont.Dispose(); $monoFont.Dispose()
$white.Dispose(); $dark.Dispose(); $gray.Dispose()
$stroke.Dispose(); $red.Dispose(); $line.Dispose(); $cyan.Dispose()
$canvas.Dispose(); $card.Dispose()
