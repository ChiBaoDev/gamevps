@echo off
echo =========================================================
echo GAME VPS - DOCKER DEPLOY SCRIPT (WINDOWS)
echo =========================================================

echo [1/4] Tao thu muc data neu chua co...
if not exist data mkdir data

echo [2/4] Dung container cu...
docker compose down 2>nul

echo [3/4] Build va khoi chay container...
docker compose up -d --build

echo [4/4] Kiem tra trang thai...
timeout /t 3 >nul
docker ps --filter "name=gamevps_app"

echo =========================================================
echo GAME SERVER DA SAN SANG TAI: http://localhost:3000
echo Master Admin Key: KEY-ADMIN-ROOT-9999
echo =========================================================
pause
