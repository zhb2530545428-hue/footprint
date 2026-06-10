@echo off
setlocal

:: Use junction path to avoid space-in-path issue with MinGW
cd /d D:\footprint-dev

:: Point Rust build artifacts to path without spaces
set CARGO_TARGET_DIR=D:\cargo-targets\footprint

:: Launch Tauri desktop (starts Next.js dev server automatically)
echo Starting Footprint...
start "" /B npm run desktop:dev
