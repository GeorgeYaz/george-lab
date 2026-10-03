# Render the portfolio's code-native social sharing card.
# Requires Python with Pillow: python -m pip install Pillow
$ErrorActionPreference = 'Stop'
python (Join-Path $PSScriptRoot 'render_social_preview.py')
if ($LASTEXITCODE -ne 0) { throw 'Social preview rendering failed.' }
python (Join-Path $PSScriptRoot 'version_assets.py')
if ($LASTEXITCODE -ne 0) { throw 'Asset version update failed.' }
