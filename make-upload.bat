@echo off
REM Copy only the files the website needs (html, assets, data) into _upload for Netlify Drop etc.
cd /d "%~dp0"
if exist _upload rmdir /s /q _upload
mkdir _upload
copy /y *.html _upload >nul
robocopy assets _upload\assets /e /njh /njs /nfl /ndl >nul
robocopy data _upload\data /e /njh /njs /nfl /ndl >nul
echo.
echo _upload folder is ready. Drag it to https://app.netlify.com/drop
explorer _upload
pause
