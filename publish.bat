@echo off
REM Rebuild the site (same as update-site.bat) and upload it to GitHub Pages
cd /d "%~dp0"

python tools\build_site.py
if errorlevel 1 goto fail

echo.
echo [Upload to GitHub]
git add -A
git diff --cached --quiet
if not errorlevel 1 (
  echo   Nothing changed. Nothing to upload.
  goto end
)
git commit -q -m "Site update %date% %time:~0,5%"
git push
if errorlevel 1 goto fail
echo.
echo Done. The site will update in 1-2 minutes: https://ziw215.github.io/iphl/
goto end

:fail
echo.
echo *** ERROR - check the messages above. ***

:end
pause
