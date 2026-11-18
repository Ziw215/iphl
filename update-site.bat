@echo off
REM Rebuild people photos, news and gallery (people-src, news-src, gallery-src)
cd /d "%~dp0"
python tools\build_site.py
pause
