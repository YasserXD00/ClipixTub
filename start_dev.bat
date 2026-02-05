@echo off
wt --window 0 new-tab --title "ClipixTub Frontend" -d "%~dp0" cmd /k "npm run dev" ; split-pane --title "ClipixTub Backend" -d "%~dp0backend" cmd /k "..\.venv\Scripts\python.exe run_uvicorn.py"
