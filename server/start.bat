@echo off
echo ========================================
echo    58信息网 - 后端服务器启动脚本
echo ========================================
echo.

REM 检查 node_modules 是否存在
if not exist "node_modules" (
    echo 首次运行，正在安装依赖...
    echo.
    call npm install
    echo.
    echo 依赖安装完成！
    echo.
)

echo 正在启动开发服务器...
echo.
echo 服务器地址: http://localhost:3003
echo API 地址: http://localhost:3003/api/v1
echo.
echo 按 Ctrl+C 停止服务器
echo ========================================
echo.

REM 启动开发服务器
npm run dev

pause