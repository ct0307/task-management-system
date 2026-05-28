FROM node:20-alpine

WORKDIR /app

# 安装 dumb-init 以正确处理信号
RUN apk add --no-cache dumb-init

# 复制依赖文件并安装
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# 复制源码
COPY . .

# 启动脚本权限
RUN chmod +x docker-entrypoint.sh

EXPOSE 3000

ENTRYPOINT ["dumb-init", "--"]
CMD ["./docker-entrypoint.sh"]
