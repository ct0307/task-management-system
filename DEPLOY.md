# 轻量化任务管理系统 — 部署指南

## 准备工作

需要一台 Linux 服务器（Ubuntu 20.04+ / CentOS 7+），安装好：
- Docker 20.x+
- Docker Compose 2.x+

```bash
# 安装 Docker（如未安装）
curl -fsSL https://get.docker.com | sh
```

## 第一步：上传代码到服务器

```bash
# 在服务器上
git clone <你的仓库地址> task-manager
cd task-manager
```

## 第二步：修改密码

```bash
# 复制生产环境配置
cp .env.production .env

# 修改密码（必须改！）
nano .env
```

修改这三个值：
```
DB_PASSWORD=生成一个16位随机密码
JWT_SECRET=生成一个32位随机字符串
CORS_ORIGIN=http://你的域名或IP
```

生成随机密码：`openssl rand -hex 16`

## 第三步：启动服务

```bash
docker compose up -d
```

启动后：
- 前端：`http://你的服务器IP`
- API 文档：`http://你的服务器IP:3000/api/docs`

## 第四步：配置 HTTPS（强烈建议）

使用 Nginx 或 Caddy 做反向代理，自动申请 SSL 证书。

### 方案 A：宿主机 Caddy（推荐，最简单）

```bash
# 安装 Caddy
sudo apt install -y debian-keyring debian-archive-keyring
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
echo "deb [signed-by=/usr/share/keyrings/caddy-stable-archive-keyring.gpg] https://dl.cloudsmith.io/public/caddy/stable/deb/debian any-version main" | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update && sudo apt install caddy

# 编辑 Caddyfile
sudo nano /etc/caddy/Caddyfile
```

Caddyfile 内容（自动 HTTPS）：
```
你的域名.com {
    reverse_proxy localhost:8080
}
```

然后修改 `docker-compose.yml` 中前端端口为 `8080:80`：
```yaml
frontend:
  ports:
    - "8080:80"
```

重启：`docker compose up -d`

### 方案 B：Cloudflare Tunnel（零配置 HTTPS）

如果域名托管在 Cloudflare，创建 Tunnel 直接指向 `localhost:80`，自动获得 HTTPS。

## 第五步：创建管理员账号

```bash
# 方式一：通过注册页面注册，然后在服务器手动设为 admin
docker compose exec backend node -e "
const db = require('./db');
db.query('UPDATE users SET role = ? WHERE username = ?', ['admin', '你的用户名'])
  .then(() => { console.log('已设为管理员'); process.exit(); });
"

# 方式二：部署时通过环境变量自动创建
# 在 .env 中设置 ADMIN_USERNAME 和 ADMIN_PASSWORD，重新 seed
docker compose exec backend node scripts/seed.js
```

## 常用运维命令

```bash
# 查看运行状态
docker compose ps

# 查看日志
docker compose logs -f

# 重启服务
docker compose restart

# 更新代码后重新构建
git pull
docker compose up -d --build

# 备份数据库
docker compose exec backend node scripts/backup-node.js
docker compose cp backend:/app/backups ./backups

# 恢复数据库
docker compose exec -T db mysql -uroot -p"${DB_PASSWORD}" task_system_db < backup.sql

# 停止服务
docker compose down
```

## 更新应用

```bash
cd task-manager
git pull                    # 拉取最新代码
docker compose up -d --build  # 重新构建并启动
docker compose exec backend node scripts/seed.js  # 更新数据库结构（幂等）
```

## 安全建议

1. 修改 `.env` 中所有默认密码
2. 配置防火墙只开放 80/443 端口
3. 定期备份数据库（建议每天凌晨定时任务）：
```
# crontab -e
0 3 * * * cd /path/to/task-manager && docker compose exec -T backend node scripts/backup-node.js && docker compose cp backend:/app/backups ./backups
```
4. 生产环境关闭 Swagger 文档（`ENABLE_SWAGGER=false` 或删除该变量）
