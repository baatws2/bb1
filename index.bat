@echo off
setlocal
chcp 65001 > nul
cd /d "%~dp0"

if not exist node_modules (
  echo Installing packages...
  npm install
)

echo Starting Metro...
start "Metro" cmd /k npx react-native start -c

echo Running on Android...
npx react-native run-android

echo Done. Close this window to stop.
endlocal
endlocal
