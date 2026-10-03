"""Refresh static asset URLs after edits, retaining normal production caching."""
from hashlib import sha256
from pathlib import Path
import re

root = Path(__file__).resolve().parent.parent
page = root / "index.html"


def version(match):
    asset = match[2]
    digest = sha256((root / asset).read_bytes()).hexdigest()[:12]
    return f'{match[1]}="{asset}?v={digest}"'


source = page.read_text(encoding="utf-8")
source = re.sub(r'(href|src)="(\./[^"?]+\.(?:css|js|svg|webp|pdf))(?:\?[^\"]*)?"', version, source)
social_digest = sha256((root / "assets/social-preview.png").read_bytes()).hexdigest()[:12]
source = re.sub(
    r'(content="https://[^"?]+/assets/social-preview\.png)(?:\?[^\"]*)?"',
    lambda match: f'{match[1]}?v={social_digest}"',
    source,
)
page.write_text(source, encoding="utf-8", newline="\n")
print("Updated asset URLs with content hashes.")
