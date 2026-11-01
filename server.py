#!/usr/bin/env python3
"""
Smart Timetable Generator — Python Bridge Server
Serves the web UI and bridges HTTP ↔ C++ binary
"""

import http.server
import json
import os
import subprocess
import urllib.parse
from pathlib import Path

BASE_DIR = Path(__file__).parent
BIN_PATH = BASE_DIR / "bin" / "timetable"
WEB_DIR  = BASE_DIR / "web"
PORT     = 8080


class TimetableHandler(http.server.SimpleHTTPRequestHandler):

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(WEB_DIR), **kwargs)

    # ── API endpoint ──────────────────────────────────────────────
    def do_POST(self):
        if self.path == "/generate":
            length  = int(self.headers.get("Content-Length", 0))
            body    = self.rfile.read(length)

            try:
                payload = json.loads(body)
            except json.JSONDecodeError as e:
                self._json(400, {"error": f"Invalid JSON: {e}"})
                return

            if not BIN_PATH.exists():
                self._json(500, {"error": "C++ binary not found. Run ./run.sh first."})
                return

            try:
                proc = subprocess.run(
                    [str(BIN_PATH)],
                    input=body,
                    capture_output=True,
                    timeout=30
                )
                if proc.returncode != 0:
                    self._json(500, {"error": proc.stderr.decode()})
                    return

                result = json.loads(proc.stdout)
                self._json(200, result)

            except subprocess.TimeoutExpired:
                self._json(504, {"error": "Generation timed out (>30 s)"})
            except Exception as e:
                self._json(500, {"error": str(e)})

        else:
            self._json(404, {"error": "Not found"})

    # ── Helper ────────────────────────────────────────────────────
    def _json(self, code: int, data: dict):
        body = json.dumps(data).encode()
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def log_message(self, fmt, *args):
        print(f"  [server] {fmt % args}")


if __name__ == "__main__":
    print(f"\n  🚀  Smart Timetable Generator")
    print(f"  📡  Server running at  http://localhost:{PORT}")
    print(f"  🌐  Opening browser …\n")

    # Try to open browser automatically
    import webbrowser
    webbrowser.open(f"http://localhost:{PORT}")

    with http.server.ThreadingHTTPServer(("", PORT), TimetableHandler) as srv:
        try:
            srv.serve_forever()
        except KeyboardInterrupt:
            print("\n  Server stopped.")
