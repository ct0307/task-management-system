@echo off
chcp 65001 >nul
REM ============================================
REM 轻量化任务管理系统 — Windows 启动脚本
REM 用法:
REM   start.bat          本地开发模式
REM   start.bat docker   Docker 部署模式
REM   start.bat stop     停止 Docker 服务
REM ============================================

if "%1"=="docker" goto docker
if "%1"=="stop" goto stop
goto dev

:docker
echo.
echo   🐳 Docker 部署模式
echo   ==================
echo.
if not exist .env (
    echo   ⚠️  未找到 .env 文件，从 .env.example 复制...
    copy .env.example .env
    echo   📝 请编辑 .env 修改密码和密钥后重新运行
    pause
    exit /b 1
)
echo   🔨 构建镜像...
docker-compose build
echo   🚀 启动服务...
docker-compose up -d
echo.
echo   ✅ 启动完成！
echo   📍 访问地址: http://localhost
echo   🔑 管理员: admin / admin123
echo   👤 普通用户: user1 / 123456
echo.
echo   管理命令:
echo     docker-compose logs -f    查看日志
echo     docker-compose down       停止并删除
echo     docker-compose restart    重启服务
goto end

:stop
echo   🛑 停止 Docker 服务...
docker-compose down
echo   ✅ 已停止
goto end

:dev
echo.
echo   💻 本地开发模式
echo   ================
echo.
echo   请分别启动前后端：
echo.
echo   # 终端 1 — 后端
echo   cd backend
echo   npm install
echo   npm run dev
echo.
echo   # 终端 2 — 前端
echo   cd frontend
echo   npm install
echo   npm run dev
echo.
echo   📍 访问地址: http://localhost:5173

:end
