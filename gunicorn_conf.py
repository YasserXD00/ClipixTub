# Gunicorn configuration for running the FastAPI app with Uvicorn workers.
# Use this config file when calling gunicorn from the `backend/` directory,
# or pass an absolute path to this file.

bind = "0.0.0.0:8000"
workers = 4
worker_class = "uvicorn.workers.UvicornWorker"
timeout = 120

# Logs to stdout/stderr (useful for container logs)
accesslog = "-"
errorlog = "-"
