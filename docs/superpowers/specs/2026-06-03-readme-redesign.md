# README 重写设计

**日期**: 2026-06-03
**状态**: 已确认

## 目标

将 README.md 重写为功能展示型文档，适合公开发布，同时保留开发查阅价值。清理所有敏感信息。

## 结构

```
1. 标题 + 徽章 (React 18 / Express 5 / MySQL / Docker)
2. 截图展示 (2张并排: 仪表盘 + 日程页)
3. 功能清单 (按模块分表格: 任务/日程/倒数日/系统)
4. 快速开始 (本地开发 3 步 + Docker 一行命令)
5. 项目结构 (精简版目录树, 2层深度)
6. 技术栈 (前后端合并一张表)
7. 文档索引 (DEPLOY.md / api.md / docs/)
```

## 红线

- 不出现 IP、端口、密码、账号名
- 不出现服务器路径
- .env 示例用 `your_xxx` 占位
- 部署引导指向 DEPLOY.md, 不重复内容

## 从当前 README 移除

| 内容 | 去向 |
|------|------|
| API 接口表 | 已有 backend/docs/api.md, 加链接 |
| 数据库表结构 | 后续可建 docs/database.md |
| Docker 部署步骤 | 已在 DEPLOY.md |
| Nginx/Certbot 配置 | 已在 DEPLOY.md |
| 开发笔记 (架构/状态管理/Git Hooks) | 后续可建 docs/development.md |

## 修复的 Bug

- 第 293 行乱码 `2.` → 修复
- 第 278 行重复标题 "Docker 部署" → 删除
