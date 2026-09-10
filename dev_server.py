"""Local-only preview that always serves fresh files. Run: python dev_server.py"""
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path


class PreviewHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(Path(__file__).parent), **kwargs)

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def do_GET(self):
        # Ignore validators from a previously cached development response.
        for name in ("If-Modified-Since", "If-None-Match"):
            if name in self.headers:
                del self.headers[name]
        super().do_GET()


if __name__ == "__main__":
    print("Portfolio preview: http://127.0.0.1:4173/ (caching disabled)", flush=True)
    ThreadingHTTPServer(("127.0.0.1", 4173), PreviewHandler).serve_forever()
