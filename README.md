# ClipixTub — YouTube downloader (Python backend + Vite frontend)

ClipixTub is a small app that lets you download YouTube videos using a Python backend and a Vite/React frontend. The backend handles video fetching and processing, while the frontend provides a simple UI to paste a YouTube URL and download the resulting file.

**Not for unauthorized downloads:** Use this tool only for videos you own or have permission to download.

## Features

- Download YouTube videos via a Python backend.
- Simple web UI built with Vite + React.
- Configurable backend (see `backend/`).

## Project structure (important paths)

- backend/: Python server and download logic
- src/ or components/: Frontend React components and views

## Requirements

- Node.js (for frontend development)
- Python 3.10+ (for backend)
- Optional: `ffmpeg` if you need to convert or re-encode downloads

## Quick start

1) Backend (Python)

 - Create and activate a virtual environment:

```powershell
python -m venv .venv
.\.venv\Scripts\activate
```

 - Install backend dependencies:

```powershell
pip install -r backend/requirements.txt
```

 - Run the backend server (this uses `backend/run_uvicorn.py`):

```powershell
python backend/run_uvicorn.py
```

 - The backend will listen on http://0.0.0.0:8000 by default.

2) Frontend (development)

 - Install frontend dependencies and run dev server:

```bash
npm install
npm run dev
```

 - Open the URL shown by Vite (typically http://localhost:5173) and use the UI to paste a YouTube link and start a download.

## How it works

- The frontend sends a request to the Python backend with the YouTube URL.
- The backend fetches the video, optionally processes it (e.g., extract audio, re-encode), and returns a downloadable file or URL.

## Where to look in the code

- Backend entry: `backend/run_uvicorn.py` — starts the server.
- Backend logic: `backend/server.py` and `backend/engine.py`.
- Frontend components: see the `components/` folder (e.g., `VideoCard.tsx`, `DownloadOptions.tsx`).

## Notes

- This project includes a backend that depends on third-party libraries listed in `backend/requirements.txt`.
- If you plan to deploy, secure the backend endpoints and consider usage limits to avoid abuse.

If you want, I can also add a short example of a direct API call (curl) or update the README with environment variable configuration. 

**Production (gunicorn)**

- A gunicorn configuration and helper runner script are included in the `backend/` folder:
	- `backend/gunicorn_conf.py` — gunicorn settings (bind, workers, worker class).
	- `backend/run_gunicorn.py` — helper script that runs gunicorn with `uvicorn.workers.UvicornWorker`.

- To run with gunicorn (from the repository root):

```bash
python backend/run_gunicorn.py
```

- Or run gunicorn directly (from `backend/`):

```bash
gunicorn -k uvicorn.workers.UvicornWorker -w 4 server:app -b 0.0.0.0:8000 --config gunicorn_conf.py
```

Note: `gunicorn` typically runs on Unix-like systems. For local Windows development, continue using `python backend/run_uvicorn.py` or `uvicorn` directly.
