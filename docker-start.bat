@echo off
chcp 65001 >nul
echo ========================================
echo    58信息网 - Docker简化部署
echo ========================================
echo.

echo 检查Docker环境...
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker未安装，请先安装Docker Desktop
    pause
    exit /b 1
)
echo ✅ Docker已安装

echo.
echo ========================================
echo 启动Docker服务...
echo ========================================

REM 启动服务
echo 启动MySQL数据库和Node.js应用...
docker-compose -f docker-simple.yml up -d --build

echo 等待服务启动...
timeout /t 20 /nobreak >nul

REM 初始化数据库
echo 初始化数据库...
docker-compose -f docker-simple.yml exec app node scripts/init-database.js

echo.
echo ========================================
echo 🎉 部署完成！
echo ========================================
echo.
echo 访问地址：
echo   前端页面: http://localhost:3003
echo   后台管理: http://localhost:3003/admin
echo   API接口: http://localhost:3003/api/v1
echo.
echo 管理命令：
echo   查看日志: docker-compose -f docker-simple.yml logs
echo   停止服务: docker-compose -f docker-simple.yml down
echo   重启服务: docker-compose -f docker-simple.yml restart
echo   进入容器: docker-compose -f docker-simple.yml exec app sh
echo.
echo ========================================

pause
