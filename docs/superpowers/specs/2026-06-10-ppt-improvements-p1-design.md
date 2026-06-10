# PPT 不足项 P1 完善设计

日期：2026-06-10
项目：轻量化任务管理系统
来源：`C:/Users/chentao/Desktop/答辩ppt.pptx` 第 15 页“不足与改进方向”

## 1. 背景

PPT 中列出的主要不足包括：

1. 移动端适配不完善，小屏幕体验一般。
2. 单元测试与 E2E 测试覆盖不足。
3. 缺少 CI/CD 自动化部署流水线。
4. 通知仅支持站内，没有实时推送。
5. 课程表解析对非标准格式识别率偏低。
6. 缺少国际化支持。

本设计只覆盖第一阶段 P1：先完善用户能直接感知的体验问题，并补上 PWA 基础能力。测试、CI、实时通知、课程表解析增强、国际化放到后续阶段单独设计和实施。

## 2. 目标

P1 阶段目标：

| 优先级 | 目标 | 验收方式 |
|---|---|---|
| P1 | 手机端导航可用，不再依赖固定侧边栏 | 视口宽度 375px 下可以打开菜单并切换页面 |
| P1 | 任务页在小屏幕下可读可操作 | 筛选、快速添加、任务列表不横向撑爆页面 |
| P1 | 仪表盘、倒数日、日程页小屏幕布局更自然 | 卡片一列展示，按钮可换行或纵向排列 |
| P1 | PWA 基础可安装 | 浏览器能识别 manifest，页面包含 theme-color 等基础 meta |
| P1 | 常见空状态、错误状态更清晰 | 列表无数据时使用 Ant Design Empty/Alert/Spin 风格 |

## 3. 非目标

本阶段不做以下内容：

| 暂不做 | 原因 |
|---|---|
| WebSocket 实时通知 | 涉及后端长连接、Nginx 代理和通知状态同步，单独作为 P3 阶段 |
| Claude API / LLM 课程表解析 | 涉及 API Key、费用、安全审计和隐私风险，需要单独确认 |
| 完整中英文国际化 | 会触及大量前端文案，适合作为独立阶段 |
| 大规模 E2E 测试 | 需要先稳定页面结构，P2 阶段再补 Vitest/Playwright |
| 安装新的 npm 包 | 本阶段使用现有 React、Ant Design、Less、Vite 能力完成 |

## 4. 设计方案

### 4.1 全局布局与导航

当前项目使用 Ant Design 风格布局，导航集中在 `frontend/src/component/Nav/`，页面入口在 `frontend/src/App.jsx`。

设计：

1. 使用 Ant Design `Grid.useBreakpoint()` 或 CSS 媒体查询判断小屏幕。
2. 桌面端保持现有侧边/导航体验，避免破坏原本布局。
3. 手机端增加一个菜单按钮，点击后使用 `Drawer` 展示导航菜单。
4. 手机端 Drawer 菜单选择页面后自动关闭。
5. 保留当前用户信息、主题切换、退出登录等入口，不让手机端功能缩水。

边界：如果现有 `Nav` 不是侧边栏结构，则只在其内部增加小屏幕折叠逻辑，不重写路由结构。

### 4.2 任务页移动端优化

涉及文件预计集中在：

- `frontend/src/app/tasks/components/TaskList.jsx`
- `frontend/src/app/tasks/components/FilterBar.jsx`
- `frontend/src/app/tasks/components/TaskTable.jsx`
- `frontend/src/app/tasks/index.module.less`

设计：

1. 筛选区域在小屏幕下改为纵向排列，输入框和选择器宽度为 100%。
2. 快速添加表单在小屏幕下单列展示，按钮单独占一行。
3. 表格区域避免强行横向撑开页面：
   - 优先使用 Ant Design Table 的 `scroll={{ x: ... }}` 兜底；
   - 如果现有结构容易支持，则增加移动端卡片列表展示。
4. 批量操作按钮允许换行，避免按钮挤压。
5. 空数据时显示清晰 Empty 文案，例如“暂无任务，点击上方添加任务”。

### 4.3 仪表盘、倒数日、日程页响应式

涉及文件预计包括：

- `frontend/src/app/dashboard/index.jsx`
- `frontend/src/app/dashboard/index.module.less`
- `frontend/src/component/CountdownDays/`
- `frontend/src/app/schedules/`
- `frontend/src/component/ScheduleCalendar/`

设计：

1. 仪表盘统计卡片在手机端改为一列，图表容器宽度自适应。
2. 倒数日卡片在手机端一列展示，标题、日期、操作按钮保持可读。
3. 日程页按钮区域允许换行，表单/弹窗字段单列展示。
4. 日历组件若无法完全适配 375px，则保留横向滚动兜底，不让页面整体溢出。

### 4.4 PWA 基础能力

涉及文件预计包括：

- `frontend/index.html`
- `frontend/public/manifest.webmanifest`
- `frontend/public/icon-192.svg` 或使用现有图标资源
- `frontend/public/icon-512.svg` 或使用现有图标资源

设计：

1. 新增 `manifest.webmanifest`，包含：
   - `name`: 轻量化任务管理系统
   - `short_name`: 任务管理
   - `start_url`: `/`
   - `display`: `standalone`
   - `theme_color`: 与项目主色一致
   - `background_color`: 白色或当前布局背景色
2. `index.html` 增加 `link rel="manifest"`、`meta name="theme-color"`、移动端视口设置检查。
3. 图标使用本地简易 SVG，不引入外部资源。
4. 本阶段不做 Service Worker 离线缓存，避免缓存旧接口和开发环境调试问题。

### 4.5 错误、加载、空状态

设计：

1. 保留现有请求逻辑，不重构 API 层。
2. 在页面层补充明确状态：
   - 加载中：`Spin` 或按钮 loading；
   - 无数据：`Empty`；
   - 请求失败：`Alert` 或 message 提示。
3. 优先覆盖任务页、日程页、倒数日、仪表盘这些 PPT 展示高频页面。

## 5. 数据流

P1 阶段不新增后端接口，不改变数据库结构。

数据流保持现状：

```text
用户操作页面
  → 前端 Zustand / 组件状态
  → frontend/src/util/request.js
  → 后端 REST API
  → 页面根据 loading/error/data 渲染 Spin/Alert/Empty/内容
```

PWA manifest 只影响浏览器安装元数据，不参与业务数据流。

## 6. 错误处理

| 场景 | 处理 |
|---|---|
| 请求失败 | 页面显示 Alert 或 message，不吞错 |
| 数据为空 | 使用 Empty 解释下一步动作 |
| 小屏幕溢出 | 容器加 `overflow-x: auto` 兜底 |
| PWA 图标加载失败 | 不影响业务功能，构建时通过静态资源路径检查发现 |

## 7. 验证计划

实施后必须执行：

| 优先级 | 命令/动作 | 目的 |
|---|---|---|
| P1 | `cd frontend && npm run lint` | 检查前端代码规范 |
| P1 | `cd frontend && npm run build` | 检查 Vite 构建与静态资源引用 |
| P1 | 启动前端并浏览器检查 375px/768px/桌面宽度 | 验证 UI 响应式效果 |
| P2 | `cd backend && npm test` | 如果未改后端，可作为回归验证；若环境缺数据库需如实记录 |

如果无法启动浏览器或服务，最终报告必须明确说明“未完成 UI 实测”。

## 8. 实施边界

1. 不安装新的 npm 包。
2. 不改数据库。
3. 不改部署脚本。
4. 不删除用户文件。
5. 每个阶段单独提交，便于回滚。

## 9. 后续阶段路线

这些不是本 P1 的实施内容，只作为后续路线：

| 阶段 | 内容 |
|---|---|
| P2 | 补充 Vitest 单测、CI 校验完善 |
| P3 | 实时通知，优先评估 SSE，再考虑 WebSocket |
| P4 | 课程表解析人工修正入口、i18n 基础框架 |

## 10. 自查结果

- 未发现未完成项。
- 本阶段范围聚焦前端体验和 PWA 基础，不包含高风险外部 API 或后端长连接。
- 验收标准明确到页面和命令。
- 未引入新依赖，符合项目“安装外部 npm 包前需确认”的要求。
