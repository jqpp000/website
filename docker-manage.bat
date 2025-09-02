@echo off
chcp 65001 >nul
echo ========================================
echo    58信息网 - Docker管理工具
echo ========================================
echo.

:menu
echo 请选择操作：
echo 1. 启动服务
echo 2. 停止服务
echo 3. 重启服务
echo 4. 查看日志
echo 5. 查看状态
echo 6. 进入容器
echo 7. 清理容器
echo 8. 退出
echo.

set /p choice=请输入选择 (1-8): 

if "%choice%"=="1" goto start
if "%choice%"=="2" goto stop
if "%choice%"=="3" goto restart
if "%choice%"=="4" goto logs
if "%choice%"=="5" goto status
if "%choice%"=="6" goto exec
if "%choice%"=="7" goto clean
if "%choice%"=="8" goto exit
goto menu

:start
echo 启动服务...
docker-compose -f docker-simple.yml up -d
goto menu

:stop
echo 停止服务...
docker-compose -f docker-simple.yml down
goto menu

:restart
echo 重启服务...
docker-compose -f docker-simple.yml restart
goto menu

:logs
echo 查看日志...
docker-compose -f docker-simple.yml logs -f
goto menu

:status
echo 查看状态...
docker-compose -f docker-simple.yml ps
goto menu

:exec
echo 进入应用容器...
docker-compose -f docker-simple.yml exec app sh
goto menu

:clean
echo 清理容器和镜像...
docker-compose -f docker-simple.yml down -v
docker system prune -f
goto menu

:exit
echo 退出管理工具
exit
