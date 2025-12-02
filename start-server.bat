@echo off
echo Starting local server...
python -m http.server 8000 --bind 0.0.0.0
start http://localhost:8000
pause
