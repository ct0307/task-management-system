#!/bin/sh
set -e

# ============================================
# 轻量化任务管理系统 — Docker 启动脚本
# 1. 等待 MySQL 就绪
# 2. 初始化数据库表结构 + 测试数据
# 3. 启动 Express 服务
# ============================================

echo ""
echo "  🚀 轻量化任务管理系统 — 后端启动中..."
echo "  ========================================"

# 等待数据库就绪（最多等待 60 秒）
echo "  ⏳ 等待数据库连接..."
MAX_RETRIES=30
RETRY_COUNT=0

until node -e "
  const mysql = require('mysql2/promise');
  mysql.createConnection({
    host: '${DB_HOST:-db}',
    port: ${DB_PORT:-3306},
    user: '${DB_USER:-root}',
    password: '${DB_PASSWORD}',
    connectTimeout: 3000
  }).then(c => { c.end(); process.exit(0); })
  .catch(() => process.exit(1));
" 2>/dev/null; do
  RETRY_COUNT=$((RETRY_COUNT + 1))
  if [ $RETRY_COUNT -ge $MAX_RETRIES ]; then
    echo "  ❌ 数据库连接超时，请检查 MySQL 服务状态"
    exit 1
  fi
  echo "    重试 $RETRY_COUNT/$MAX_RETRIES ..."
  sleep 2
done

echo "  ✅ 数据库已就绪"

# 初始化数据库（幂等操作：IF NOT EXISTS + INSERT IGNORE）
echo "  📦 初始化数据库表结构和测试数据..."
node scripts/seed.js

echo "  ✅ 数据库初始化完成"
echo "  ========================================"
echo "  🌐 启动 API 服务 (端口 ${PORT:-3000})..."
echo ""

# 启动 Node 应用
exec node app.js
