@echo off
echo Creating server directory structure...

REM Create directories
mkdir server
mkdir server\config
mkdir server\controllers
mkdir server\models
mkdir server\routes
mkdir server\middleware
mkdir server\utils
mkdir server\tests
mkdir server\public
mkdir server\uploads
mkdir server\logs

echo.
echo Directories created successfully!
echo.
echo Please follow these steps:
echo 1. Navigate to server directory: cd server
echo 2. Initialize npm: npm init -y
echo 3. Install dependencies:
echo    npm install express cors helmet morgan body-parser dotenv express-validator compression express-rate-limit
echo 4. Install dev dependencies:
echo    npm install --save-dev nodemon
echo.
echo Then copy the JavaScript files from the provided source code.
echo.
pause