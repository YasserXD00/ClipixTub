"""Small helper script to run the app with gunicorn + Uvicorn worker.

Run this from the repository root or from any location; the script
changes directory to the `backend/` folder so relative imports and
the config file resolve correctly.

Example (from repo root):
    python backend/run_gunicorn.py

This will execute:
    gunicorn -k uvicorn.workers.UvicornWorker -w 4 server:app -b 0.0.0.0:8000 --config gunicorn_conf.py

You can pass extra args which will be forwarded to gunicorn.
"""
import os
import subprocess
import sys


def main():
    backend_dir = os.path.dirname(os.path.abspath(__file__))
    # Ensure we're running from the backend directory so server:app and config file resolve
    os.chdir(backend_dir)

    port = os.environ.get("PORT", "8000")
    
    # Check if backend_dir has a gunicorn_conf.py, otherwise fallback
    conf_path = "gunicorn_conf.py"
    if not os.path.exists(os.path.join(backend_dir, conf_path)):
        conf_path = os.path.join(os.path.dirname(backend_dir), "gunicorn_conf.py")

    cmd = [
        "gunicorn",
        "-k",
        "uvicorn.workers.UvicornWorker",
        "-w",
        "4",
        "server:app",
        "-b",
        f"0.0.0.0:{port}",
        "--config",
        conf_path,
    ]

    # Append any extra CLI args passed to this script
    if len(sys.argv) > 1:
        cmd.extend(sys.argv[1:])

    try:
        subprocess.run(cmd, check=True)
    except FileNotFoundError:
        print("gunicorn not found. Make sure it's installed in your environment.")
        sys.exit(1)
    except subprocess.CalledProcessError as e:
        print(f"gunicorn exited with code {e.returncode}")
        sys.exit(e.returncode)


if __name__ == "__main__":
    main()
