# PPT 不足项 P1 完善 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 根据答辩 PPT 第 15 页“不足与改进方向”，完成 P1 阶段：移动端体验优化、PWA 基础能力、关键页面错误/空状态补齐。

**Architecture:** 不新增后端接口，不改数据库，不安装 npm 包。所有改动集中在 React 前端：全局布局/导航、任务页、仪表盘、倒数日、日程页、PWA 静态资源。优先复用现有 Ant Design、CSS Modules/Less、Zustand 和已有 EmptyState 组件。

**Tech Stack:** React 18、Vite 5、Ant Design 5、Less CSS Modules、Zustand、Recharts。

---

## 0. 文件结构与职责

### 需要修改

| 文件 | 职责 |
|---|---|
| `frontend/src/App.jsx` | 全局页面内容区响应式 padding，避免手机端内容被 24px 固定边距挤压。 |
| `frontend/src/component/Nav/index.jsx` | 将当前移动端下拉菜单改成 Ant Design `Drawer`，手机端导航更稳定。 |
| `frontend/src/component/Nav/index.module.less` | 移动端导航按钮、Drawer 菜单、通知弹层宽度适配。 |
| `frontend/src/app/tasks/index.jsx` | 任务页标题区和视图切换在手机端换行，管理员开关不挤压。 |
| `frontend/src/app/tasks/index.module.less` | 任务页响应式布局，筛选/操作按钮一列或换行展示。 |
| `frontend/src/app/tasks/components/FilterSection.jsx` | 筛选控件增加可被 CSS 控制的类名，移动端 Select 宽度 100%。 |
| `frontend/src/app/tasks/components/TaskListOptimized.jsx` | 表格分页、弹窗表单、操作栏增加移动端友好配置。 |
| `frontend/src/app/tasks/components/index.module.less` | 任务列表组件内部移动端细节。 |
| `frontend/src/app/dashboard/index.jsx` | 仪表盘请求失败时显示 `Alert`，趋势图无数据时显示 `Empty`。 |
| `frontend/src/app/dashboard/index.module.less` | 仪表盘手机端卡片、按钮、图表、近期任务换行适配。 |
| `frontend/src/component/CountdownDays/index.jsx` | 无倒数日时显示轻量空状态，而不是直接不渲染。 |
| `frontend/src/component/CountdownDays/index.module.less` | 倒数日手机端头部、分段控件、任务行进一步适配。 |
| `frontend/src/app/schedules/index.jsx` | 日程页请求失败显示 Alert，周视图横向滚动兜底，表格 empty 文案改为 Empty。 |
| `frontend/src/app/schedules/index.module.less` | 日程页快速添加、批量操作、表格、弹窗字段手机端一列。 |
| `frontend/index.html` | 添加 manifest、theme-color、Apple mobile meta。 |

### 需要创建

| 文件 | 职责 |
|---|---|
| `frontend/public/manifest.webmanifest` | PWA 安装元数据。 |
| `frontend/public/icon-192.svg` | 本地简易 PWA 图标。 |
| `frontend/public/icon-512.svg` | 本地简易 PWA 图标。 |

---

## Task 1: PWA 基础元数据

**Files:**
- Modify: `frontend/index.html`
- Create: `frontend/public/manifest.webmanifest`
- Create: `frontend/public/icon-192.svg`
- Create: `frontend/public/icon-512.svg`

- [ ] **Step 1: 创建 manifest**

Create `frontend/public/manifest.webmanifest`:

```json
{
  "name": "轻量化任务管理系统",
  "short_name": "任务管理",
  "description": "轻量化任务管理系统 — 高效管理任务、日程与倒数日",
  "start_url": "/",
  "scope": "/",
  "display": "standalone",
  "orientation": "portrait-primary",
  "theme_color": "#e85d3a",
  "background_color": "#faf8f5",
  "lang": "zh-CN",
  "icons": [
    {
      "src": "/icon-192.svg",
      "sizes": "192x192",
      "type": "image/svg+xml",
      "purpose": "any maskable"
    },
    {
      "src": "/icon-512.svg",
      "sizes": "512x512",
      "type": "image/svg+xml",
      "purpose": "any maskable"
    }
  ]
}
```

- [ ] **Step 2: 创建 192 图标**

Create `frontend/public/icon-192.svg`:

```xml
<svg xmlns="http://www.w3.org/2000/svg" width="192" height="192" viewBox="0 0 192 192" role="img" aria-label="轻量化任务管理系统图标">
  <rect width="192" height="192" rx="44" fill="#e85d3a"/>
  <rect x="44" y="48" width="104" height="96" rx="18" fill="#fff7ed" opacity="0.96"/>
  <path d="M68 78h56" stroke="#e85d3a" stroke-width="10" stroke-linecap="round"/>
  <path d="M68 104h38" stroke="#d4972e" stroke-width="10" stroke-linecap="round"/>
  <path d="M68 130h48" stroke="#3d8c5c" stroke-width="10" stroke-linecap="round"/>
  <circle cx="132" cy="130" r="12" fill="#3d8c5c"/>
  <path d="M126 130l4 4 8-9" stroke="#fff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
```

- [ ] **Step 3: 创建 512 图标**

Create `frontend/public/icon-512.svg` using the same SVG geometry but `width="512" height="512" viewBox="0 0 192 192"`.

```xml
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 192 192" role="img" aria-label="轻量化任务管理系统图标">
  <rect width="192" height="192" rx="44" fill="#e85d3a"/>
  <rect x="44" y="48" width="104" height="96" rx="18" fill="#fff7ed" opacity="0.96"/>
  <path d="M68 78h56" stroke="#e85d3a" stroke-width="10" stroke-linecap="round"/>
  <path d="M68 104h38" stroke="#d4972e" stroke-width="10" stroke-linecap="round"/>
  <path d="M68 130h48" stroke="#3d8c5c" stroke-width="10" stroke-linecap="round"/>
  <circle cx="132" cy="130" r="12" fill="#3d8c5c"/>
  <path d="M126 130l4 4 8-9" stroke="#fff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
```

- [ ] **Step 4: 更新 HTML meta**

Modify `frontend/index.html` head to include these lines after favicon:

```html
<link rel="manifest" href="/manifest.webmanifest" />
<meta name="theme-color" content="#e85d3a" />
<meta name="mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-title" content="任务管理" />
<meta name="apple-mobile-web-app-status-bar-style" content="default" />
```

- [ ] **Step 5: 验证构建能识别静态资源**

Run:

```bash
cd frontend && npm run build
```

Expected: Vite build exits 0. No missing `/manifest.webmanifest` or icon path errors.

- [ ] **Step 6: Commit**

```bash
git add frontend/index.html frontend/public/manifest.webmanifest frontend/public/icon-192.svg frontend/public/icon-512.svg
git commit -m "feat: 添加PWA基础元数据"
```

---

## Task 2: 全局布局与移动端 Drawer 导航

**Files:**
- Modify: `frontend/src/App.jsx`
- Modify: `frontend/src/component/Nav/index.jsx`
- Modify: `frontend/src/component/Nav/index.module.less`

- [ ] **Step 1: 修改 App 内容区 padding**

In `frontend/src/App.jsx`, replace inline `Content` style with responsive class.

Add import:

```jsx
import "./styles/responsive-layout.less";
```

Change:

```jsx
<Content style={{ padding: 24, margin: 0, minHeight: 280 }}>
```

To:

```jsx
<Content className="app-content">
```

- [ ] **Step 2: 创建全局响应式布局样式**

Create `frontend/src/styles/responsive-layout.less`:

```less
.app-content {
  padding: 24px;
  margin: 0;
  min-height: 280px;
}

@media (max-width: 768px) {
  .app-content {
    padding: 16px 12px;
  }
}

@media (max-width: 480px) {
  .app-content {
    padding: 12px 8px;
  }
}
```

- [ ] **Step 3: Nav 使用 Drawer 替代 fixed 下拉菜单**

In `frontend/src/component/Nav/index.jsx`, update Ant Design import:

```jsx
import { Button, Modal, Space, Tooltip, Badge, Popover, List, Typography, Drawer } from "antd";
```

Replace the mobile menu block:

```jsx
{mobileMenuOpen && (
  <div className={s.mobileMenu}>...</div>
)}
```

With:

```jsx
<Drawer
  title="轻量化任务管理"
  placement="left"
  open={mobileMenuOpen}
  onClose={() => setMobileMenuOpen(false)}
  width={280}
  className={s.mobileDrawer}
>
  <div className={s.mobileMenuList}>
    {navItems.map((item) => (
      <button
        type="button"
        key={item.path}
        className={cls(s.mobileMenuItem, { [s.mobileMenuItemActive]: location.pathname === item.path })}
        onClick={() => { nav(item.path); setMobileMenuOpen(false); }}
      >
        <span className={s.mobileMenuIcon}>{item.antdIcon}</span>
        <span>{item.label}</span>
      </button>
    ))}
  </div>
</Drawer>
```

- [ ] **Step 4: 通知 Popover 移动端宽度适配**

In `frontend/src/component/Nav/index.jsx`, change notification content wrapper:

```jsx
<div className={s.notificationPanel}>
```

instead of:

```jsx
<div style={{ width: 320, maxHeight: 400, overflow: 'auto' }}>
```

- [ ] **Step 5: 更新 Nav Less**

In `frontend/src/component/Nav/index.module.less`:

1. Remove `.mobileMenu` fixed dropdown styles.
2. Add:

```less
.notificationPanel {
  width: 320px;
  max-height: 400px;
  overflow: auto;
}

.mobileDrawer {
  :global(.ant-drawer-body) {
    padding: 12px;
  }
}

.mobileMenuList {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.mobileMenuItem {
  width: 100%;
  border: 0;
  background: transparent;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  border-radius: 10px;
  color: #1e1b18;
  font-size: 15px;
  text-align: left;
  cursor: pointer;

  &:hover {
    background: rgba(232, 93, 58, 0.08);
    color: #e85d3a;
  }
}

.mobileMenuIcon {
  display: inline-flex;
  width: 18px;
  justify-content: center;
}

.mobileMenuItemActive {
  background: rgba(232, 93, 58, 0.12);
  color: #e85d3a;
  font-weight: 600;
}

@media (max-width: 480px) {
  .nav {
    .right {
      gap: 2px;
    }

    .right .userInfo {
      padding-right: 0;
    }
  }

  .notificationPanel {
    width: min(320px, calc(100vw - 48px));
  }
}
```

- [ ] **Step 6: 验证 lint**

Run:

```bash
cd frontend && npm run lint
```

Expected: no new lint errors from `App.jsx` or `Nav`.

- [ ] **Step 7: Commit**

```bash
git add frontend/src/App.jsx frontend/src/styles/responsive-layout.less frontend/src/component/Nav/index.jsx frontend/src/component/Nav/index.module.less
git commit -m "feat: 优化移动端导航布局"
```

---

## Task 3: 任务页手机端可读可操作

**Files:**
- Modify: `frontend/src/app/tasks/index.jsx`
- Modify: `frontend/src/app/tasks/index.module.less`
- Modify: `frontend/src/app/tasks/components/FilterSection.jsx`
- Modify: `frontend/src/app/tasks/components/TaskListOptimized.jsx`
- Modify: `frontend/src/app/tasks/components/index.module.less`

- [ ] **Step 1: 给任务页管理员开关加类名**

In `frontend/src/app/tasks/index.jsx`, replace inline admin wrapper:

```jsx
<span style={{ marginLeft: 12, fontSize: 13, color: '#666' }}>
```

With:

```jsx
<span className={s.viewAllSwitch}>
```

- [ ] **Step 2: 过滤区控件加移动端类名**

In `frontend/src/app/tasks/components/FilterSection.jsx`, change:

```jsx
<Space wrap className={s.filterControls}>
```

To:

```jsx
<Space wrap className={s.filterControls}>
```

Then add `className={s.filterSelect}` to each Select and replace inline widths with `popupMatchSelectWidth={false}` where helpful:

```jsx
<Select className={s.filterSelect} placeholder="状态" allowClear onChange={(value) => onFilterChange('status', value)}>
```

Apply the same pattern to priority/category/dateRange selects.

- [ ] **Step 3: 操作栏用 Space 包裹，便于换行**

In `TaskListOptimized.jsx`, wrap the first four action buttons in:

```jsx
<Space wrap className={s.primaryActions}>
  <Button ...>新建任务</Button>
  <Button ...>管理分类</Button>
  <Select ...>...</Select>
  <Button ...>导入数据</Button>
</Space>
```

Keep selected batch operation as separate `Space wrap` and add `className={s.batchActions}`.

- [ ] **Step 4: Modal 中双列表单手机端改为 class 控制**

Replace the two `Space size="middle" style={{ width: '100%' }}` wrappers in task modal with:

```jsx
<Space size="middle" className={s.formTwoCols}>
```

- [ ] **Step 5: 更新任务页 Less**

In `frontend/src/app/tasks/index.module.less`, inside `@media (max-width: 768px)` add:

```less
.tasks {
  .headerLeft {
    width: 100%;
    flex-wrap: wrap;
    gap: 10px;
  }

  .title {
    width: 100%;
    font-size: 20px;
  }

  .viewSwitch {
    max-width: 100%;
  }

  .viewAllSwitch {
    margin-left: 0;
    font-size: 13px;
    color: #666;
  }
}
```

- [ ] **Step 6: 更新任务组件 Less**

In `frontend/src/app/tasks/components/index.module.less`, add:

```less
.filterSelect {
  min-width: 110px;
}

.primaryActions,
.batchActions,
.formTwoCols {
  display: flex;
}

@media (max-width: 768px) {
  .filters {
    flex-direction: column;
    align-items: stretch;
  }

  .searchInput {
    width: 100%;
  }

  .filterControls {
    width: 100%;

    :global(.ant-space-item) {
      flex: 1 1 140px;
    }
  }

  .filterSelect {
    width: 100%;
  }

  .actions {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }

  .primaryActions,
  .batchActions {
    width: 100%;

    :global(.ant-space-item) {
      flex: 1 1 140px;
    }

    :global(.ant-btn),
    :global(.ant-select) {
      width: 100%;
    }
  }

  .formTwoCols {
    width: 100%;
    flex-direction: column;

    :global(.ant-space-item) {
      width: 100%;
    }
  }

  :global(.ant-table-wrapper) {
    overflow-x: auto;
  }

  :global(.ant-pagination) {
    justify-content: center;
  }
}
```

- [ ] **Step 7: 验证任务页构建**

Run:

```bash
cd frontend && npm run build
```

Expected: build exits 0.

- [ ] **Step 8: Commit**

```bash
git add frontend/src/app/tasks/index.jsx frontend/src/app/tasks/index.module.less frontend/src/app/tasks/components/FilterSection.jsx frontend/src/app/tasks/components/TaskListOptimized.jsx frontend/src/app/tasks/components/index.module.less
git commit -m "feat: 优化任务页移动端体验"
```

---

## Task 4: 仪表盘错误/空状态与响应式细节

**Files:**
- Modify: `frontend/src/app/dashboard/index.jsx`
- Modify: `frontend/src/app/dashboard/index.module.less`

- [ ] **Step 1: 增加 error 状态**

In `Dashboard`, add state:

```jsx
const [error, setError] = useState('');
```

In fetchData:

```jsx
setError('');
```

Before requests, and in catch:

```jsx
} catch (err) {
  setError(err.response?.data?.message || err.message || '仪表盘数据加载失败');
} finally {
  setLoading(false);
}
```

- [ ] **Step 2: 引入 Alert**

Change import:

```jsx
import { Card, Row, Col, Typography, Button, List, Tag, Space, Empty, Modal, Alert } from "antd";
```

- [ ] **Step 3: 页面顶部显示错误提示**

After header block, add:

```jsx
{error && (
  <Alert
    type="error"
    showIcon
    closable
    className={s.errorAlert}
    message="仪表盘数据加载失败"
    description={error}
    action={<Button size="small" onClick={() => window.location.reload()}>刷新</Button>}
  />
)}
```

- [ ] **Step 4: 趋势图无数据时显示 Empty**

Replace conditional trend block:

```jsx
{trend.length > 0 && (...)}
```

With always-rendered card containing:

```jsx
{trend.length > 0 ? (
  <ResponsiveContainer ...>...</ResponsiveContainer>
) : (
  <Empty description="暂无完成趋势数据" image={Empty.PRESENTED_IMAGE_SIMPLE} />
)}
```

- [ ] **Step 5: 仪表盘 Less 手机端补齐**

In `frontend/src/app/dashboard/index.module.less`, add:

```less
.errorAlert {
  margin-bottom: 16px;
}

@media (max-width: 768px) {
  .dashboard {
    .headerLeft {
      align-items: flex-start;
    }

    .headerActions {
      :global(.ant-space) {
        width: 100%;
      }

      :global(.ant-space-item) {
        flex: 1;
      }

      :global(.ant-btn) {
        width: 100%;
      }
    }

    .statCard {
      min-height: 86px;
    }

    .chartCard {
      :global(.ant-card-head) {
        padding: 0 14px;
      }

      :global(.ant-card-body) {
        padding: 14px 8px !important;
      }
    }

    .taskTitle {
      white-space: normal;
    }
  }
}

@media (max-width: 480px) {
  .dashboard {
    .pieLegend,
    .progressStats {
      width: 100%;
    }
  }
}
```

- [ ] **Step 6: 验证 lint/build**

Run:

```bash
cd frontend && npm run lint && npm run build
```

Expected: exits 0.

- [ ] **Step 7: Commit**

```bash
git add frontend/src/app/dashboard/index.jsx frontend/src/app/dashboard/index.module.less
git commit -m "feat: 优化仪表盘响应式和状态提示"
```

---

## Task 5: 倒数日与日程页状态补齐

**Files:**
- Modify: `frontend/src/component/CountdownDays/index.jsx`
- Modify: `frontend/src/component/CountdownDays/index.module.less`
- Modify: `frontend/src/app/schedules/index.jsx`
- Modify: `frontend/src/app/schedules/index.module.less`

- [ ] **Step 1: CountdownDays 空状态不直接 return null**

Change import:

```jsx
import { Tag, Segmented, Tooltip, Spin, Empty } from 'antd';
```

Replace:

```jsx
if (items.length === 0) return null;
```

With:

```jsx
if (items.length === 0) {
  return (
    <div className={`${s.root} ${visible ? s.visible : ''}`} ref={containerRef}>
      <div className={s.header}>
        <div className={s.headerLeft}>
          <div className={s.headerIcon}><ClockCircleOutlined /></div>
          <span className={s.headerTitle}>倒数日</span>
        </div>
      </div>
      <div className={s.emptyWrap}>
        <Empty description="暂无即将到期的任务" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: CountdownDays Less 增加空状态与头部换行**

Add:

```less
.emptyWrap {
  padding: 20px;
}

@media (max-width: 480px) {
  .header {
    align-items: flex-start;
    gap: 10px;
    flex-direction: column;
  }

  .modeSwitch {
    width: 100%;
  }
}
```

- [ ] **Step 3: Schedules 增加 error 状态**

In `Schedules`, add:

```jsx
const [error, setError] = useState('');
```

Change `fetchSchedules` catch:

```jsx
} catch (err) {
  setError(err.response?.data?.message || err.message || '日程加载失败');
} finally {
  setLoading(false);
}
```

Before request:

```jsx
setError('');
```

- [ ] **Step 4: Schedules 引入 Alert 和 Empty**

Change import:

```jsx
import { Table, Button, Modal, Form, Input, Select, Space, Popconfirm, message, Card, Tag, Typography, Upload, Divider, Tabs, TimePicker, Alert, Empty } from 'antd';
```

Remove unused `Upload` import if lint reports it unused.

- [ ] **Step 5: Schedules 顶部显示错误提示**

After header block add:

```jsx
{error && (
  <Alert
    type="error"
    showIcon
    closable
    className={s.errorAlert}
    message="日程加载失败"
    description={error}
    action={<Button size="small" onClick={fetchSchedules}>重试</Button>}
  />
)}
```

- [ ] **Step 6: 周视图包一层横向滚动容器**

Wrap `weekGrid`:

```jsx
<div className={s.weekScroll}>
  <div className={s.weekGrid}>...</div>
</div>
```

- [ ] **Step 7: 表格 Empty 文案换成 Ant Design Empty**

Change:

```jsx
locale={{ emptyText: '暂无日程' }}
```

To:

```jsx
locale={{ emptyText: <Empty description="暂无日程，先添加一门课程吧" image={Empty.PRESENTED_IMAGE_SIMPLE} /> }}
```

- [ ] **Step 8: Schedules Less 手机端补齐**

Add:

```less
.errorAlert {
  margin-bottom: 16px;
}

.weekScroll {
  overflow-x: auto;
}

@media (max-width: 640px) {
  .header {
    margin-bottom: 16px;
  }

  .weekScroll {
    padding-bottom: 4px;
  }

  .weekGrid {
    min-width: 560px;
  }

  .quickRow,
  .batchActions {
    flex-direction: column;
    align-items: stretch;
  }

  .quickRow {
    :global(.ant-select),
    :global(.ant-input),
    :global(.ant-btn) {
      width: 100% !important;
    }
  }

  .batchActions {
    gap: 8px;

    :global(.ant-btn) {
      width: 100%;
    }
  }

  .listCard {
    :global(.ant-card-extra) {
      margin-left: 0;
      width: 100%;
    }

    :global(.ant-card-head-wrapper) {
      flex-direction: column;
      align-items: stretch;
      gap: 8px;
    }

    :global(.ant-table-wrapper) {
      overflow-x: auto;
    }
  }
}
```

- [ ] **Step 9: 验证 lint/build**

Run:

```bash
cd frontend && npm run lint && npm run build
```

Expected: exits 0.

- [ ] **Step 10: Commit**

```bash
git add frontend/src/component/CountdownDays/index.jsx frontend/src/component/CountdownDays/index.module.less frontend/src/app/schedules/index.jsx frontend/src/app/schedules/index.module.less
git commit -m "feat: 优化倒数日和日程页移动端状态"
```

---

## Task 6: 浏览器实测与最终验证

**Files:**
- No required source edits unless verification finds issues.

- [ ] **Step 1: 运行 lint**

```bash
cd frontend && npm run lint
```

Expected: exits 0.

- [ ] **Step 2: 运行 build**

```bash
cd frontend && npm run build
```

Expected: exits 0.

- [ ] **Step 3: 启动前端开发服务器**

```bash
cd frontend && npm run dev -- --host 127.0.0.1
```

Expected: Vite prints a local URL, usually `http://127.0.0.1:5173/`.

- [ ] **Step 4: 浏览器检查 3 种宽度**

Use browser devtools or Playwright/manual browser:

| 宽度 | 检查项 |
|---|---|
| 375px | 顶部菜单按钮可打开 Drawer，任务页筛选/按钮不溢出，日程周视图可横向滚动。 |
| 768px | 仪表盘卡片和图表换行自然，按钮不重叠。 |
| 1440px | 桌面端原布局不明显退化。 |

- [ ] **Step 5: 检查 PWA manifest**

Open browser devtools Application > Manifest, verify:

```text
name = 轻量化任务管理系统
short_name = 任务管理
start_url = /
display = standalone
icons = /icon-192.svg, /icon-512.svg
```

- [ ] **Step 6: 后端回归测试（未改后端也运行一次）**

```bash
cd backend && npm test
```

Expected: If database/env unavailable, record exact failure. Do not claim backend tests pass unless command exits 0.

- [ ] **Step 7: Final commit if verification fixes were needed**

If verification required fixes:

```bash
git add <fixed-files>
git commit -m "fix: 修复P1响应式验证问题"
```

- [ ] **Step 8: Final status check**

```bash
git status --short --branch
git log -5 --oneline
```

Expected: working tree clean or only intentionally untracked ignored files; recent commits reflect P1 tasks.

---

## Self-Review

- Spec coverage: PWA、移动端导航、任务页、仪表盘、倒数日、日程页、错误/空状态、验证计划均有对应任务。
- No placeholders: 未使用 TODO/TBD/待定；每个代码改动步骤都有具体片段或明确替换位置。
- Type consistency: React 组件、CSS module 类名、Ant Design 组件名与当前项目一致。
- Scope check: 未引入新依赖，未改后端接口，未触碰数据库，符合 P1 范围。
