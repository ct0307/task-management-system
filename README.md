# 轻量化任务管理系统

[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)](https://react.dev/)
[![Express](https://img.shields.io/badge/Express-5-000000?logo=express)](https://expressjs.com/)
[![MySQL](https://img.shields.io/badge/MySQL-8-4479A1?logo=mysql)](https://www.mysql.com/)
[![Docker](https://img.shields.io/badge/Docker-✓-2496ED?logo=docker)](https://www.docker.com/)

基于 React + Express + MySQL 的全栈任务管理系统，支持任务管理、日程规划、倒数日提醒、课程表导入等功能。

![仪表盘](schedule_page_1.png)

---

## 功能清单

### 任务管理
| 功能 | 说明 |
|------|------|
| 任务 CRUD | 创建、编辑、删除、批量操作 |
| 状态流转 | 待处理 → 进行中 → 已完成 |
| 优先级 | 高 / 中 / 低 |
| 分类标签 | 自定义分类，颜色标记 |
| 筛选搜索 | 按状态、优先级、分类、关键词筛选 |
| 统计概览 | 仪表盘图表展示任务分布 |

### 日程规划
| 功能 | 说明 |
|------|------|
| 日程管理 | 创建、编辑、删除日程 |
| 日历视图 | 月视图 / 周视图切换 |
| 课程表导入 | 图片 / 文件智能解析为结构化日程 |
| 文件解析 | 多格式文件识别，本地解析服务 |

### 倒数日
| 功能 | 说明 |
|------|------|
| 事件管理 | 自定义事件名称和日期 |
| 倒计时 / 正计时 | 自动切换 |
| 进度可视化 | 进度条 + 天数展示 |

### 系统功能
| 功能 | 说明 |
|------|------|
| JWT 认证 | 登录 / 注册 / Token 刷新 |
| 角色权限 | 管理员 / 普通用户 |
| 回收站 | 软删除，可恢复 |
| 评论通知 | 任务评论 + 嵌套回复 + 消息通知 |
| 响应式布局 | 适配桌面和移动端 |

---

## 快速开始

### 本地开发

```bash
# 1. 安装依赖
cd backend  && npm install
cd ../frontend && npm install

# 2. 配置环境变量
cp .env.example .env        # 编辑数据库连接和密钥
cd backend && node scripts/seed.js  # 初始化数据库

# 3. 启动服务
cd ../backend  && npm run dev    # 后端 :3000
cd ../frontend && npm run dev    # 前端 :5173
```

### Docker 部署

```bash
cp .env.example .env        # 编辑 DB_PASSWORD / JWT_SECRET
docker compose up -d
```

详见 [DEPLOY.md](DEPLOY.md)

### 文件解析与 MCP

项目根目录的 `parse_engine.py` 提供统一文件解析入口，支持 PDF、图片和 DOCX。`parse_mcp_server.py` 将解析能力封装为基于标准输入输出的 MCP Server，可供 Claude Code 等支持 MCP 的客户端调用。

| MCP 工具 | 用途 |
|------|------|
| `parse_file` | 自动识别 PDF、图片或 DOCX 并解析 |
| `parse_pdf` | 优先提取 PDF 文字层，必要时降级到 OCR |
| `ocr_image` | 对 PNG、JPG、WEBP、BMP 等图片进行中英文 OCR |
| `parse_docx` | 提取 Word 文档中的段落和表格 |

直接启动 MCP Server：

```bash
python parse_mcp_server.py
```

客户端配置示例（将路径替换为本机项目的绝对路径）：

```json
{
  "mcpServers": {
    "task-file-parser": {
      "command": "python",
      "args": ["C:/path/to/task-management-system/parse_mcp_server.py"]
    }
  }
}
```

解析功能按需加载依赖，未使用的解析类型不会在启动阶段加载对应库：

```bash
pip install pdfplumber python-docx Pillow pytesseract pdf2image
```

图片 OCR 还需要本机安装 Tesseract OCR；扫描 PDF OCR 需要安装 Tesseract OCR 和 Poppler。依赖缺失或文件无法识别时，工具会返回明确错误，不会阻止 MCP Server 启动。

### 验证命令

```bash
# Python 解析与 MCP 协议测试
python -m unittest discover -s tests -v

# 后端测试
cd backend
npm test

# 前端测试、代码检查与生产构建
cd ../frontend
npm test
npm run lint
npm run build
```

---

## 项目结构

```
轻量化任务管理系统/
├── frontend/                  # React 18 + Vite + Ant Design 5
│   └── src/
│       ├── app/               # 页面模块
│       │   ├── tasks/         #   任务管理
│       │   ├── schedules/     #   日程规划
│       │   ├── dashboard/     #   仪表盘
│       │   ├── trash/         #   回收站
│       │   ├── profile/       #   个人中心
│       │   ├── login/         #   登录
│       │   ├── register/      #   注册
│       │   └── admin/         #   系统管理
│       ├── component/         # 通用组件
│       ├── hooks/             # 自定义 Hooks
│       ├── store/             # Zustand 状态管理
│       ├── util/              # 工具函数
│       └── styles/            # 全局样式
│
├── backend/                   # Express 5 + MySQL
│   ├── controllers/           # 控制器
│   ├── services/              # 业务逻辑
│   ├── models/                # 数据访问
│   ├── routes/                # 路由定义
│   ├── middleware/             # 中间件 (auth/validation/rateLimit)
│   ├── scripts/               # 数据库初始化 & 备份脚本
│   └── app.js                 # 入口文件
│
├── parse_engine.py            # 课程表解析引擎
├── parse_service.py           # 解析服务 (API)
├── parse_mcp_server.py        # 解析服务 (MCP)
├── docker-compose.yml         # Docker 编排
└── DEPLOY.md                  # 部署指南
```

---

## 技术栈

| 层级 | 技术 | 说明 |
|------|------|------|
| 前端框架 | React 18 | UI 框架 |
| 构建工具 | Vite 5 | 开发 & 打包 |
| UI 组件 | Ant Design 5 | 组件库 |
| 状态管理 | Zustand | 轻量级状态管理 |
| 路由 | React Router 7 | 前端路由 |
| HTTP | Axios | 请求库 |
| 后端框架 | Express 5 | Web 服务 |
| 数据库 | MySQL 8 | 关系型数据库 |
| 认证 | JWT + bcrypt | Token 鉴权 & 密码加密 |
| 容器化 | Docker Compose | 一键部署 |
| 解析引擎 | Python 3 | 课程表图片/文件解析 |

---

## 文档索引

| 文档 | 内容 |
|------|------|
| [DEPLOY.md](DEPLOY.md) | 服务器部署、HTTPS 配置、运维命令 |
| [backend/docs/api.md](backend/docs/api.md) | API 接口文档 |
| [docs/](docs/) | 设计文档 & 优化记录 |
