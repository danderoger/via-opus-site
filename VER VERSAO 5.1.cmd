@echo off
chcp 65001 >nul
title VIA OPUS - Versao 5.1
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Instale o Node.js LTS em https://nodejs.org/ e abra este arquivo novamente.
  pause
  exit /b 1
)
echo Gerando a versao 5.1 com o conteudo atual...
node scripts/build-v51.mjs
if errorlevel 1 (
  echo Nao foi possivel gerar a versao 5.1. Leia a mensagem acima.
  pause
  exit /b 1
)
node serve-v51.cjs --open
pause
