"""Compatibility shim for hosting platforms expecting `main:app`.

Some platforms (Render, default gunicorn configs) try to import `main:app`.
This small module re-exports the FastAPI `app` defined in `server.py`.
"""

import os
import sys

# Ensure current directory is in sys.path
current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)

from server import app
  # re-export app so `main:app` works


if __name__ == "__main__":
    # Allow local testing: run via `python backend/main.py`
    import uvicorn
    port = int(os.environ.get("PORT", "8000"))
    uvicorn.run("server:app", host="0.0.0.0", port=port)

