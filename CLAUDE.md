# CLAUDE.md

## 项目概况
- 项目：轻量化任务管理系统
- 技术栈：React 18 + Vite 5 + Ant Design 5 + Zustand + Express 5 + MySQL 8
- 主要功能：任务管理、日程规划、倒数日、课程表导入、JWT 登录注册、回收站、评论通知

## 目录说明
- `frontend/`：React 前端
- `backend/`：Express 后端 API
- `parse_engine.py`、`parse_service.py`、`parse_mcp_server.py`：课程表解析相关能力
- `docs/`：设计文档和优化记录
- `DEPLOY.md`：部署说明

## 常用命令
| 场景 | 命令 |
|---|---|
| 启动后端 | `cd backend && npm run dev` |
| 启动前端 | `cd frontend && npm run dev` |
| 后端测试 | `cd backend && npm test` |
| 前端构建 | `cd frontend && npm run build` |
| 前端 lint | `cd frontend && npm run lint` |
| Docker 启动 | `docker compose up -d` |

## 开发要求
- 修改前端 UI 后，优先启动前端并用浏览器验证页面效果。
- 修改 API、数据库、认证、权限相关代码后，至少运行后端测试。
- 修改前后端联动逻辑时，同时检查接口返回格式和前端错误提示。
- 不要提交 `.env`、数据库备份、临时脚本、构建产物。
- 安装新的 npm 依赖前，先提醒进行安全审计和必要性确认。

## 后端注意事项
- 后端入口：`backend/app.js`
- 数据库连接：`backend/db.js`
- 路由目录：`backend/routes/`
- 控制器目录：`backend/controllers/`
- 数据访问目录：`backend/models/`
- 通用响应工具：`backend/utils/response.js`

## 前端注意事项
- 页面模块集中在 `frontend/src/app/`
- 通用组件在 `frontend/src/component/`
- 状态管理在 `frontend/src/store/`
- API 请求和工具函数在 `frontend/src/util/`
- UI 修改保持 Ant Design 风格一致，避免引入额外 UI 库。

## 验证优先级
| 优先级 | 验证项 |
|---|---|
| P1 | 登录、任务 CRUD、日程规划、课程表导入 |
| P2 | 倒数日、回收站、评论通知、权限控制 |
| P3 | 响应式布局、边界空状态、加载和错误提示 |
