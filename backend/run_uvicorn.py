import uvicorn
import sys
import os

# Get the backend directory
backend_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(backend_dir)

# Add project root to Python path
if project_root not in sys.path:
    sys.path.insert(0, project_root)

# Change to backend directory to ensure relative imports work
os.chdir(backend_dir)

def main():
    # Import server module directly (works from any location now)
    import server
    uvicorn.run("server:app", host="0.0.0.0", port=8000, reload=False)


if __name__ == "__main__":
    main()
