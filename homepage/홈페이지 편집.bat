@echo off
chcp 949 >nul
title B^&F GLOBAL 홈페이지 편집
cd /d "%~dp0"

echo.
echo  ============================================
echo   B^&F GLOBAL 홈페이지 편집
echo  ============================================
echo.

if not exist node_modules (
  echo  [처음 실행] 준비 중입니다. 2~3분 걸립니다...
  call npm install
  echo.
)

echo  편집 화면을 준비하고 있습니다...
echo  잠시 후 브라우저가 자동으로 열립니다.
echo.
echo  ** 이 검은 창은 편집이 끝날 때까지 닫지 마세요 **
echo.

start "" /b cmd /c "timeout /t 6 >/dev/null & start http://localhost:3000/admin"
call npm run dev

pause