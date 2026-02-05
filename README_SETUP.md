# ClipixTub - Setup and Running Instructions

## Prerequisites

1. **Python 3.8+** installed
2. **Node.js and npm** installed
3. **FFmpeg** installed (required for MP3 conversion)
   - Windows: Download from https://ffmpeg.org/download.html or use `winget install ffmpeg`
   - Mac: `brew install ffmpeg`
   - Linux: `sudo apt install ffmpeg` (Ubuntu/Debian) or `sudo yum install ffmpeg` (CentOS/RHEL)
4. All dependencies installed

## Quick Start

### Option 1: Using Batch Files (Windows)

1. **Start Backend** - Double-click `START_BACKEND.bat` or run in terminal:
   ```
   START_BACKEND.bat
   ```

2. **Start Frontend** - Open a NEW terminal and double-click `START_FRONTEND.bat` or run:
   ```
   START_FRONTEND.bat
   ```

### Option 2: Manual Setup (Windows/Linux/Mac)

#### Terminal 1 - Backend Server
```powershell
# Navigate to backend folder
cd backend

# Install Python dependencies (first time only)
pip install -r requirements.txt

# Run the backend server
python run_uvicorn.py
```

The backend will start at: **http://localhost:8000**

#### Terminal 2 - Frontend Server
```powershell
# Navigate to project root (if not already there)
cd c:\Users\Yasser\Downloads\ClipixTub

# Install npm dependencies (first time only)
npm install

# Run the frontend dev server
npm run dev
```

The frontend will start at: **http://localhost:3000**

## Access the Application

Once both servers are running:
- **Frontend**: Open http://localhost:3000 in your browser
- **Backend API**: http://localhost:8000
- **Health Check**: http://localhost:8000/health

## Troubleshooting

### Backend won't start
- Make sure Python is installed: `python --version`
- Install dependencies: `pip install -r backend/requirements.txt`
- Check if port 8000 is already in use
- **For MP3 downloads**: Make sure FFmpeg is installed and accessible in your PATH
  - Verify with: `ffmpeg -version`

### Frontend won't start
- Make sure Node.js is installed: `node --version`
- Install dependencies: `npm install`
- Check if port 3000 is already in use

### Connection issues
- Ensure both servers are running
- Check that backend is accessible at http://localhost:8000/health
- Verify `VITE_BACKEND_URL` in `.env` file (if used) matches http://localhost:8000

## Development Notes

- Backend runs on port **8000**
- Frontend runs on port **3000**
- Backend automatically reloads on code changes (if reload=True is set)
- Frontend uses Vite HMR for hot module replacement
