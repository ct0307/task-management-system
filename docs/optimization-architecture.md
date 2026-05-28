# 轻量化任务管理系统 — 优化架构设计

## 1. 技术栈确认

| 层 | 技术 | 变更 |
|---|------|------|
| 前端 | React 18 + Ant Design 5 + Vite + Zustand | 移除 Jotai |
| 后端 | Express 4 + MySQL 8 (mysql2) | 不变 |
| 新增 npm 包 | dayjs | 前端依赖，用于日期格式化 |

## 2. 修改文件清单

### 前端（10 个文件修改，0 个新建）

| 文件路径 | 改动类型 | 涉及需求 |
|---------|---------|---------|
| `frontend/src/app/login/index.jsx` | 修改 | P0-1: 移除 Jotai `useSetAtom`，改用 Zustand `useAuthStore` |
| `frontend/src/hooks/useAuth.js` | 修改 | P0-1: 移除 Jotai `useAtomValue`，改用 Zustand |
| `frontend/src/app/store/authStore.js` | 修改 | P0-1, P2-5: 移除 Jotai 兼容导出 |
| `frontend/src/util/request.js` | 修改 | P1-6: 修复 `token` 变量遮蔽 |
| `frontend/src/app/tasks/store/taskStore.js` | 修改 | P1-2, P1-3, P2-4: 修复筛选 Bug，添加防抖，完善分页 |
| `frontend/src/app/tasks/components/TaskList.jsx` | 修改 | P2-1: 拆分为 FilterBar/QuickAdd/TaskTable/TaskDetailDrawer |
| `frontend/src/component/Sidebar/index.jsx` | 修改（可能） | P0-1: 如果有 Jotai 引用 |
| `frontend/src/component/Nav/index.jsx` | 修改（可能） | P0-1: 如果有 Jotai 引用 |
| `frontend/src/app/dashboard/index.jsx` | 修改 | P2-2: 提取共享 StatCard 组件 |
| `frontend/src/app/tasks/components/TaskStats.jsx` | 修改 | P2-2: 使用共享 StatCard 组件 |
| `frontend/package.json` | 修改 | P0-2: 添加 dayjs 依赖 |

### 后端（6 个文件修改，0 个新建）

| 文件路径 | 改动类型 | 涉及需求 |
|---------|---------|---------|
| `backend/routes/tasks.js` | 修改 | P1-1, P1-5: 导出路由归入 Service 层，新增批量 API 路由 |
| `backend/services/tasks/taskService.js` | 修改 | P1-1, P1-5, P2-4: 添加 export 方法、批量操作、分页元数据 |
| `backend/controllers/tasks/taskController.js` | 修改 | P1-1, P1-5, P2-4: 添加导出 Controller、批量操作、分页响应 |
| `backend/middleware/validator.js` | 启用（修改） | P1-4: 添加任务创建/更新的校验规则 |
| `backend/app.js` | 修改 | P1-4: 注册 validator 中间件到路由 |
| `backend/middleware/auth.js` | 修改 | P2-3: 移除 JWT_SECRET 硬编码默认值 |
| `backend/.env.example` | 修改 | P2-3: 添加 JWT_SECRET 说明 |

## 3. 新增 API 接口定义

### `DELETE /api/tasks/batch`
批量删除任务。

**请求：**
```json
{
  "ids": [1, 2, 3, 5]
}
```

**响应（完全成功）：**
```json
{
  "success": true,
  "message": "成功删除 4 条任务",
  "deletedCount": 4
}
```

**响应（部分失败）：**
```json
{
  "success": true,
  "message": "成功删除 3 条，失败 1 条",
  "deletedCount": 3,
  "failedIds": [5],
  "errors": ["任务 5 不存在"]
}
```

### `PUT /api/tasks/batch`
批量更新任务（如批量修改状态或优先级）。

**请求：**
```json
{
  "ids": [1, 2, 3],
  "updates": {
    "status": "completed"
  }
}
```

**响应：**
```json
{
  "success": true,
  "message": "成功更新 3 条任务",
  "updatedCount": 3,
  "failedIds": []
}
```

### 分页响应格式（现有 `GET /api/tasks` 改造）
原响应改为：
```json
{
  "data": [...],
  "pagination": {
    "total": 100,
    "page": 1,
    "pageSize": 20
  }
}
```

## 4. 任务列表（按实现顺序）

### 阶段一：P0 — 阻塞问题修复

| # | 任务 | 依赖 | 涉及文件 | 改动说明 |
|---|------|------|---------|---------|
| 1 | P0-1: 统一状态管理 — 移除 Jotai | 无 | `login/index.jsx`, `hooks/useAuth.js`, `authStore.js`, `Sidebar/index.jsx`, `Nav/index.jsx` | 将 `useSetAtom(isLoginAtom)` 替换为 `useAuthStore(...)`，删除 `authStore.js` 末尾的兼容导出，移除 Jotai import |
| 2 | P0-2: 安装 dayjs 依赖 | 无 | `frontend/package.json` | `npm install dayjs` |

### 阶段二：P1 — 架构合规与 Bug 修复

| # | 任务 | 依赖 | 涉及文件 | 改动说明 |
|---|------|------|---------|---------|
| 3 | P1-1: 导出路由归入 Service 层 | 无 | `routes/tasks.js`, `taskService.js`, `taskController.js` | 从 `routes/tasks.js` 移除内联 SQL，在 `taskService.js` 中添加 `exportTasks(type, filters)`，`taskController.js` 添加 `exportTasks` 方法 |
| 4 | P1-2: 修复筛选异步 Bug | 无 | `taskStore.js`, `TaskList.jsx` | `handleFilterChange` 改为 `setFilters(newFilters)` 后通过 `getState()` 或回调方式确保 fetchTasks 读到最新 filter |
| 5 | P1-3: 搜索防抖 300ms | P1-2 | `taskStore.js` | 在搜索处添加 300ms debounce，减少 API 请求频率 |
| 6 | P1-4: 启用 API 输入验证 | 无 | `validator.js`, `app.js`, `routes/tasks.js` | 在 `validator.js` 中添加任务创建/更新的校验规则（title 必填且≤50字符，priority 枚举），在路由上注册 |
| 7 | P1-5: 新增批量 API | P1-1 | `routes/tasks.js`, `taskService.js`, `taskController.js` | 新增 `DELETE /api/tasks/batch` 和 `PUT /api/tasks/batch`，前端批量操作改为单次调用 |
| 8 | P1-6: 修复变量遮蔽 | 无 | `request.js` | `handleAuth` 和 `download` 中 `const token = ...` 改为 `const accessToken = ...` 或类似名称 |

### 阶段三：P2 — 代码质量提升

| # | 任务 | 依赖 | 涉及文件 | 改动说明 |
|---|------|------|---------|---------|
| 9 | P2-4: 完善分页元数据 | P1-1 | `taskService.js`, `taskController.js`, `taskStore.js` | 后端返回 `{ data, pagination: { total, page, pageSize } }`，前端分页组件显示正确总数 |
| 10 | P2-3: 移除 JWT_SECRET 硬编码 | 无 | `middleware/auth.js`, `.env.example` | 启动时检查 `JWT_SECRET` 环境变量，缺失则报错退出 |
| 11 | P2-5: 清理 authStore 兼容层 | P0-1 | `authStore.js` | 删除末尾的 `isLoginAtom`/`currentUserAtom` 兼容导出 |
| 12 | P2-2: 提取 StatCard 共享组件 | 无 | 新建共享组件 `component/StatCard/index.jsx`，修改 `dashboard/index.jsx`, `TaskStats.jsx` | 提取统计卡片为可配置 Props 的共享组件 |
| 13 | P2-1: 拆分 TaskList.jsx | P1-2, P1-3 | 新建 `FilterBar.jsx`, `TaskTable.jsx`，修改 `TaskList.jsx` | 将 818 行拆分为 ≤250 行的独立组件 |

## 5. 新增 npm 包

| 包名 | 位置 | 用途 |
|-----|------|------|
| dayjs | frontend | 日期格式化（已在使用，但未声明依赖） |

## 6. 共享知识（跨文件约定）

1. **Zustand 命名约定**：Store 统一使用 `useXxxStore` 命名（如 `useAuthStore`, `useTaskStore`）
2. **批量 API 约定**：`DELETE /api/:resource/batch` 和 `PUT /api/:resource/batch` 作为统一模式
3. **分页格式约定**：后端统一返回 `{ data: [], pagination: { total, page, pageSize } }`
4. **错误处理约定**：批量操作返回 `failedIds` 数组标识失败项
5. **防抖参数**：搜索防抖统一使用 300ms
6. **组件拆分规则**：单个组件文件不超过 250 行

## 7. 待明确事项

1. 无（所有设计决策已在 PRD 待确认问题中明确）
