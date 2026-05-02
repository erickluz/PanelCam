@echo off
REM RTSP Camera Dashboard startup script for Windows
REM 1. Start go2rtc gateway via Docker Compose
REM 2. Start Electron + Vite app

REM Optional: install dependencies if missing
IF NOT EXIST node_modules (
  echo node_modules nao encontrado, instalando dependencias...
  call npm install
)

necho Iniciando go2rtc com Docker Compose...
docker compose up -d
IF ERRORLEVEL 1 (
  echo Erro ao iniciar docker compose. Verifique se o Docker esta instalado e em execucao.
  exit /b 1
)
echo Iniciando applicacao Electron...
call npm run dev
