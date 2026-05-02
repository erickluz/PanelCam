#!/usr/bin/env bash
set -euo pipefail

# RTSP Camera Dashboard startup script for Linux/macOS
# 1. Start go2rtc gateway via Docker Compose
# 2. Start Electron + Vite app

if [[ ! -d node_modules ]]; then
  echo "node_modules nao encontrado, instalando dependencias..."
  npm install
fi

echo "Iniciando go2rtc com Docker Compose..."
docker compose up -d

echo "Iniciando aplicacao Electron..."
npm run dev
