# 轻量化任务管理系统 — 优化 PRD

## 项目信息

| 字段 | 值 |
|------|------|
| Language | 中文 |
| 技术栈 | React + Ant Design + Zustand / Express + MySQL |
| Project Name | task_manager_optimization |
| 原始需求 | 基于代码审查发现的 13 项问题，对现有系统进行架构修正、Bug 修复和代码质量提升 |

---

## 产品目标

消除技术债务与架构违规，使系统回归"轻量化"定位——状态管理统一、架构分层清晰、关键交互无 Bug，为后续功能迭代提供可靠基础。

---

## 用户故事

1. **作为开发者**，我希望项目只使用一套状态管理方案（Zustand），以便降低认知负担、避免状态不同步的隐蔽 Bug。
2. **作为用户**，我希望筛选/搜索操作后立即看到正确的结果，以便高效定位目标任务，而不是因为异步时序 Bug 看到旧数据。
3. **作为运维人员**，我希望 JWT_SECRET 不存在硬编码默认值、API 接口有输入校验，以便系统在公网部署时满足基本安全要求。

---

## 需求池

### P0 — 必须修复（阻塞正常使用）

| # | 需求描述 | 验收标准 |
|---|---------|---------|
| P0-1 | **统一状态管理**：移除 Jotai 依赖，将 Login 页面的 `useSetAtom(isLoginAtom)` / `useSetAtom(currentUserAtom)` 迁移到 Zustand `useAuthStore` | 1. `package.json` 中无 `jotai` 依赖；2. 全局搜索 `jotai` 仅出现在 `node_modules`；3. 登录→Dashboard→登出 全流程状态正常同步 |
| P0-2 | **安装缺失依赖**：将 `dayjs` 添加到 `package.json` dependencies | 1. `npm ls dayjs` 无 missing 警告；2. 新环境 `npm install && npm run dev` 无模块找不到报错 |

### P1 — 应该修复（影响架构合规性、安全性和用户体验）

| # | 需求描述 | 验收标准 |
|---|---------|---------|
| P1-1 | **导出路由归入 Service 层**：将 `routes/tasks.js` 中 `/export` 路由的内联 SQL 查询提取到 Service → Controller 调用链 | 1. `routes/tasks.js` 中无直接 `pool.query` 调用；2. 导出功能 JSON/CSV 两种格式输出结果与修改前一致 |
| P1-2 | **修复筛选异步 Bug**：`handleFilterChange` 调用 `setFilters` 后 `fetchTasks` 读取旧值的问题，改为 `fetchTasks` 接受参数或使用 `subscribe`/`getState` 保证读取最新 filter | 1. 选择筛选条件后，任务列表立即反映对应筛选结果；2. 快速连续切换筛选条件无闪烁或回退到旧数据 |
| P1-3 | **搜索防抖**：为搜索输入添加 debounce（300ms），减少不必要的 API 请求 | 1. 快速输入 5 个字符仅触发 1 次请求；2. 停止输入 300ms 后自动发起搜索 |
| P1-4 | **API 输入验证**：在后端路由上启用 `validator` 中间件，对创建/更新任务的必填字段、类型、长度进行校验 | 1. 缺少 `title` 字段时返回 400 + 明确错误信息；2. `priority` 不在枚举范围内返回 400；3. 现有正常请求不受影响 |
| P1-5 | **批量操作 API**：后端新增 `DELETE /api/tasks/batch` 和 `PUT /api/tasks/batch` 接口，前端批量操作改为单次调用 | 1. 选中 10 条任务批量删除仅发送 1 次请求；2. 批量删除失败时返回部分成功/失败明细；3. 逐条删除的旧逻辑保留为 fallback |
| P1-6 | **修复变量遮蔽**：`request.js` 的 `handleAuth` 和 `download` 函数中 `const token = localStorage.getItem(...)` 遮蔽了导入的 `token` 模块，需重命名局部变量 | 1. ESLint `no-shadow` 规则无警告；2. 401 跳转登录功能正常（仍使用 `token.clear()`） |

### P2 — 改进建议（提升可维护性和健壮性）

| # | 需求描述 | 验收标准 |
|---|---------|---------|
| P2-1 | **拆分 TaskList.jsx**：将 818 行的 TaskList.jsx 拆分为独立组件——FilterBar、QuickAdd、TaskTable、TaskDetailDrawer（Drawer 已有目录，需整合） | 1. 单个组件文件 ≤ 250 行；2. 功能行为与拆分前完全一致；3. 无重复渲染或状态丢失 |
| P2-2 | **提取共享统计卡片组件**：Dashboard 和 TaskStats 中重复的统计卡片提取为 `<StatCard>` 共享组件 | 1. Dashboard 和 TaskStats 使用同一组件；2. 样式一致，Props 可配置图标/颜色/标签 |
| P2-3 | **移除 JWT_SECRET 硬编码默认值**：`middleware/auth.js` 中 `process.env.JWT_SECRET || "dev_secret_template_2026"` 改为启动时强制检查，缺失则报错退出 | 1. 不设置环境变量时服务无法启动并输出明确提示；2. `.env.example` 中包含 `JWT_SECRET` 说明 |
| P2-4 | **完善分页元数据**：后端任务列表 API 返回 `{ data: [...], total, page, pageSize }` 格式，前端分页组件可正确显示总数和翻页 | 1. 响应 JSON 包含 `total`、`page`、`pageSize` 字段；2. 前端分页器显示正确的总页数和当前页 |
| P2-5 | **清理 auth.js 兼容层**：`authStore.js` 末尾导出的 `isLoginAtom` / `currentUserAtom` 兼容对象在 Jotai 移除后已无用，应删除 | 1. 文件中无 `isLoginAtom` / `currentUserAtom` 导出；2. 所有引用方使用 `useAuthStore` |

---

## 待确认问题

1. **Jotai 移除范围**：`hooks/useAuth.js` 也使用了 `useAtomValue` 读取 Jotai atom。确认是否一并迁移到 Zustand，还是有其他页面依赖此 hook？
2. **批量操作失败策略**：批量删除/更新部分失败时，倾向"全部回滚"还是"部分成功 + 返回失败列表"？
3. **分页实现方式**：后端分页是在 Service 层拼接 `LIMIT/OFFSET` SQL，还是用 ORM 方式？当前项目无 ORM，需确认是否保持纯 SQL。
4. **验证规则细度**：`validator` 中间件对任务字段的校验规则（如 `title` 最大长度、`description` 是否必填）需要产品侧定义，是否沿用现有前端表单规则？
5. **拆分优先级**：P2-1 拆分 TaskList.jsx 与 P0-1/P1-2 存在交叉（修筛选 Bug 时可能也改到 TaskList），是否优先拆分再修 Bug，还是先修 Bug 后拆分？
