"""Compatibility shim for hosting platforms expecting `main:app`.

Some platforms (Render, default gunicorn configs) try to import `main:app`.
This small module re-exports the FastAPI `app` defined in `server.py`.
"""

from .server import app  # re-export app so `main:app` works


if __name__ == "__main__":
    # Allow local testing: run via `python backend/main.py`
    import uvicorn
    uvicorn.run("server:app", host="0.0.0.0", port=8000)
