"""Validate static Pages assets and serve-test root and project URLs (stdlib only)."""
from hashlib import sha256
from html.parser import HTMLParser
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from tempfile import TemporaryDirectory
from threading import Thread
from urllib.parse import urljoin, urlsplit
from urllib.request import urlopen
from functools import partial
import shutil
import struct

ROOT = Path(__file__).resolve().parent.parent

class Page(HTMLParser):
    def __init__(self):
        super().__init__()
        self.ids = []
        self.refs = []

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if 'id' in attrs:
            self.ids.append(attrs['id'])
        for key in ('href', 'src'):
            if key in attrs:
                self.refs.append(attrs[key])

class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass

def main():
    source = (ROOT / 'index.html').read_text(encoding='utf-8')
    page = Page()
    page.feed(source)
    assert len(page.ids) == len(set(page.ids)), 'Duplicate HTML IDs'
    assert (ROOT / '.nojekyll').is_file(), 'Missing .nojekyll'
    assets = []
    for ref in page.refs:
        if ref.startswith('#'):
            assert ref[1:] in page.ids, f'Missing section: {ref}'
        elif ref.startswith('./'):
            parsed = urlsplit(ref)
            relative = Path(parsed.path)
            assert '..' not in relative.parts, 'Asset escapes publishing directory'
            current = ROOT
            for part in relative.parts:
                assert part in {p.name for p in current.iterdir()}, f'Case-sensitive path missing: {ref}'
                current /= part
            assert current.is_file(), f'Missing asset: {ref}'
            assert parsed.query == 'v=' + sha256(current.read_bytes()).hexdigest()[:12], f'Stale asset version: {ref}'
            assets.append((ref, current, relative))
        else:
            assert urlsplit(ref).scheme in {'https', 'mailto'}, f'Nonportable URL: {ref}'
    # The public portrait should not carry embedded personal metadata.
    photo = (ROOT / 'assets/george.webp').read_bytes()
    offset = 12
    while offset + 8 <= len(photo):
        kind = photo[offset:offset + 4]
        size = struct.unpack('<I', photo[offset + 4:offset + 8])[0]
        assert kind not in (b'EXIF', b'XMP '), 'Portrait contains metadata'
        offset += 8 + size + (size % 2)
    with TemporaryDirectory(prefix='portfolio-pages-') as temp:
        staging = Path(temp)
        for folder in (staging, staging / 'g-portfolio'):
            folder.mkdir(exist_ok=True)
            shutil.copyfile(ROOT / 'index.html', folder / 'index.html')
            shutil.copyfile(ROOT / '.nojekyll', folder / '.nojekyll')
            for _, asset, relative in assets:
                destination = folder / relative
                destination.parent.mkdir(parents=True, exist_ok=True)
                shutil.copyfile(asset, destination)
        server = ThreadingHTTPServer(('127.0.0.1', 0), partial(QuietHandler, directory=str(staging)))
        thread = Thread(target=server.serve_forever, daemon=True)
        thread.start()
        try:
            for prefix in ('/', '/g-portfolio/'):
                base = f'http://127.0.0.1:{server.server_port}{prefix}'
                with urlopen(base) as response:
                    assert response.status == 200
                    assert response.read().decode('utf-8') == source
                for ref, asset, _ in assets:
                    with urlopen(urljoin(base, ref)) as response:
                        assert response.status == 200
                        assert response.read() == asset.read_bytes()
        finally:
            server.shutdown()
            server.server_close()
            thread.join()
    print(f'Passed: {len(assets)} assets, section links, filename case, hashes, portrait metadata, and HTTP root/project URLs.')

if __name__ == '__main__':
    main()
