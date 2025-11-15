@echo off
REM ============================================
REM One-Shot Deployment Script for Windows
REM ============================================

echo.
echo ========================================
echo   HTML to PDF - Google Cloud Deploy
echo ========================================
echo.

REM Check if gcloud is in PATH
where gcloud >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    set GCLOUD_CMD=gcloud
    goto :gcloud_found
)

REM If not in PATH, try common installation locations
echo [INFO] gcloud not in PATH, searching...

set "GCLOUD_PATH_1=%LOCALAPPDATA%\Google\Cloud SDK\google-cloud-sdk\bin"
set "GCLOUD_PATH_2=C:\Program Files (x86)\Google\Cloud SDK\google-cloud-sdk\bin"
set "GCLOUD_PATH_3=C:\Program Files\Google\Cloud SDK\google-cloud-sdk\bin"

if exist "%GCLOUD_PATH_1%\gcloud.cmd" (
    set "GCLOUD_CMD=%GCLOUD_PATH_1%\gcloud.cmd"
    echo [FOUND] Using gcloud from: %GCLOUD_PATH_1%
    goto :gcloud_found
)

if exist "%GCLOUD_PATH_2%\gcloud.cmd" (
    set "GCLOUD_CMD=%GCLOUD_PATH_2%\gcloud.cmd"
    echo [FOUND] Using gcloud from: %GCLOUD_PATH_2%
    goto :gcloud_found
)

if exist "%GCLOUD_PATH_3%\gcloud.cmd" (
    set "GCLOUD_CMD=%GCLOUD_PATH_3%\gcloud.cmd"
    echo [FOUND] Using gcloud from: %GCLOUD_PATH_3%
    goto :gcloud_found
)

echo [ERROR] Google Cloud CLI not found!
echo.
echo Please install it from:
echo https://cloud.google.com/sdk/docs/install
echo.
echo Or add it to your PATH and restart Command Prompt
echo.
pause
exit /b 1

:gcloud_found

echo [1/5] Checking Google Cloud login...
echo.
call "%GCLOUD_CMD%" auth list --filter=status:ACTIVE --format="value(account)" >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [INFO] Not logged in. Opening browser for login...
    echo.
    call "%GCLOUD_CMD%" auth login
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] Login failed!
        pause
        exit /b 1
    )
) else (
    echo [SUCCESS] Already logged in!
)

echo.
echo [2/5] Setting up project...
set /p PROJECT_ID="Enter your Project ID (or press Enter for 'html-to-pdf-service'): "
if "%PROJECT_ID%"=="" set PROJECT_ID=html-to-pdf-service

echo Checking if project exists...
call "%GCLOUD_CMD%" projects describe %PROJECT_ID% >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [WARNING] Project '%PROJECT_ID%' does not exist!
    echo.
    set /p CREATE_PROJECT="Would you like to create it? (Y/N): "
    if /i "%CREATE_PROJECT%"=="Y" (
        echo Creating project...
        call "%GCLOUD_CMD%" projects create %PROJECT_ID% --name="HTML to PDF Service"
        if %ERRORLEVEL% NEQ 0 (
            echo [ERROR] Failed to create project!
            echo.
            echo You can create it manually at:
            echo https://console.cloud.google.com/projectcreate
            echo.
            pause
            exit /b 1
        )
        echo [SUCCESS] Project created!
        timeout /t 2 >nul
    ) else (
        echo.
        echo Please create the project manually or use an existing one.
        echo Visit: https://console.cloud.google.com/projectcreate
        echo.
        pause
        exit /b 1
    )
)

echo Setting project to: %PROJECT_ID%
call "%GCLOUD_CMD%" config set project %PROJECT_ID%

echo.
echo [3/5] Enabling required APIs...
call "%GCLOUD_CMD%" services enable cloudbuild.googleapis.com run.googleapis.com

echo.
echo [4/5] Deploying to Cloud Run...
echo This may take 3-5 minutes...
echo.

call "%GCLOUD_CMD%" run deploy html-to-pdf ^
  --source . ^
  --platform managed ^
  --region us-central1 ^
  --allow-unauthenticated ^
  --memory 2Gi ^
  --cpu 2 ^
  --timeout 300 ^
  --max-instances 10 ^
  --min-instances 0

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo   ✅ DEPLOYMENT SUCCESSFUL!
    echo ========================================
    echo.
    echo Your service URL:
    call "%GCLOUD_CMD%" run services describe html-to-pdf --region us-central1 --format="value(status.url)"
    echo.
) else (
    echo.
    echo ========================================
    echo   ❌ DEPLOYMENT FAILED
    echo ========================================
    echo.
    echo Check the errors above and try again.
    echo.
)

pause

