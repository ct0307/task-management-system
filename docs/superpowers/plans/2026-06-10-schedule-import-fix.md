# 课程表导入体验修复 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 修复日程页课程表文件导入体验，让标准课程表 CSV 上传后自动映射字段并可直接导入。

**Architecture:** 保持现有 `ImportModal` 通用组件结构不变，只修复自动映射的状态时序问题，并在 `mode="schedule"` 时调整字段选项顺序。日程页导入函数返回统计结果，由导入弹窗统一展示结果提示。

**Tech Stack:** React 18、Vite、Ant Design 5、Playwright、现有 Axios 请求封装。

---

## 文件结构

| 文件 | 操作 | 职责 |
|---|---|---|
| `frontend/src/component/ImportModal/index.jsx` | 修改 | 修复自动字段映射、课程表字段优先、统一导入提示、替换 `destroyOnClose` |
| `frontend/src/app/schedules/index.jsx` | 修改 | `handleFileImport` 返回 `{ ok, fail, merged, skipped }`，不直接弹成功提示 |
| `frontend/src/app/login/index.jsx` | 修改 | 替换 `Card bordered={false}` 为 `variant="borderless"` |

---

### Task 1: 修复 ImportModal 自动映射和字段顺序

**Files:**
- Modify: `C:/Users/chentao/Desktop/轻量化任务管理系统/frontend/src/component/ImportModal/index.jsx`

- [ ] **Step 1: 添加纯函数 `buildAutoMap`**

在 `matchField` 函数后加入：

```js
const buildAutoMap = (nextHeaders = []) => {
  const map = {};
  nextHeaders.forEach(h => {
    const field = matchField(h);
    if (field) map[h] = field;
  });
  return map;
};
```

- [ ] **Step 2: 修改 `autoMap` 使用纯函数**

把：

```js
  const autoMap = useMemo(() => {
    const map = {};
    headers.forEach(h => {
      const field = matchField(h);
      if (field) map[h] = field;
    });
    return map;
  }, [headers]);
```

改为：

```js
  const autoMap = useMemo(() => buildAutoMap(headers), [headers]);
```

- [ ] **Step 3: 修复解析完成后使用旧 `autoMap` 的问题**

把 `handleFile` 中：

```js
      setHeaders(result.headers);
      setRows(result.rows);
      setColumnMap(autoMap);
      setStep('preview');
```

改为：

```js
      setHeaders(result.headers);
      setRows(result.rows);
      setColumnMap(buildAutoMap(result.headers));
      setStep('preview');
```

同时把 `handleFile` 的依赖从：

```js
  }, [autoMap]);
```

改为：

```js
  }, []);
```

- [ ] **Step 4: 添加字段选项数组**

在 `const hasTitle = Object.values(columnMap).includes('title');` 后加入：

```js
  const defaultFieldOptions = [
    { value: 'title', label: '📝 标题' },
    { value: 'description', label: '📄 描述' },
    { value: 'status', label: '📊 状态' },
    { value: 'priority', label: '🚩 优先级' },
    { value: 'category', label: '📁 分类' },
    { value: 'due_date', label: '📅 截止日期' },
    { value: 'assignee', label: '👤 负责人' },
  ];

  const scheduleFieldOptions = [
    { value: 'title', label: '📝 课程名' },
    { value: 'weekday', label: '📅 星期' },
    { value: 'start_time', label: '🕘 开始时间' },
    { value: 'end_time', label: '🕙 结束时间' },
    { value: 'location', label: '📍 地点' },
    { value: 'teacher', label: '👨‍🏫 教师' },
    { value: 'description', label: '📄 备注' },
  ];

  const fieldOptions = mode === 'schedule'
    ? scheduleFieldOptions
    : [...defaultFieldOptions, ...extraFields];
```

- [ ] **Step 5: 替换 Select.Option 静态列表**

把预览列 Select 内：

```jsx
            <Select.Option value="title">📝 标题</Select.Option>
            <Select.Option value="description">📄 描述</Select.Option>
            <Select.Option value="status">📊 状态</Select.Option>
            <Select.Option value="priority">🚩 优先级</Select.Option>
            <Select.Option value="category">📁 分类</Select.Option>
            <Select.Option value="due_date">📅 截止日期</Select.Option>
            <Select.Option value="assignee">👤 负责人</Select.Option>
            {extraFields.map(f => <Select.Option key={f.value} value={f.value}>{f.label}</Select.Option>)}
```

替换为：

```jsx
            {fieldOptions.map(f => <Select.Option key={f.value} value={f.value}>{f.label}</Select.Option>)}
```

- [ ] **Step 6: 替换 Modal 废弃属性**

把：

```jsx
      destroyOnClose
```

改为：

```jsx
      destroyOnHidden
```

---

### Task 2: 统一课程表导入结果提示

**Files:**
- Modify: `C:/Users/chentao/Desktop/轻量化任务管理系统/frontend/src/component/ImportModal/index.jsx`
- Modify: `C:/Users/chentao/Desktop/轻量化任务管理系统/frontend/src/app/schedules/index.jsx`

- [ ] **Step 1: 在 ImportModal 添加导入结果文案函数**

在 `ImportModal` 组件定义前加入：

```js
const formatImportResult = (result, fallbackCount) => {
  if (!result || typeof result !== 'object') return `成功导入 ${fallbackCount} 条记录`;
  const parts = [];
  if (typeof result.ok === 'number') parts.push(`成功 ${result.ok} 条`);
  if (result.merged > 0) parts.push(`合并 ${result.merged} 条`);
  if (result.fail > 0) parts.push(`失败 ${result.fail} 条`);
  if (result.skipped > 0) parts.push(`跳过 ${result.skipped} 条`);
  return parts.length ? `导入完成：${parts.join('，')}` : `成功导入 ${fallbackCount} 条记录`;
};
```

- [ ] **Step 2: 修改 ImportModal 导入成功提示**

把 `handleConfirmImport` 中：

```js
      await onImport(mapped, rows, headers);
      clearInterval(progressTimer);
      setImportProgress(100);
      message.success(`成功导入 ${mapped.length} 条记录`);
      setTimeout(() => handleClose(), 400);
```

改为：

```js
      const result = await onImport(mapped, rows, headers);
      clearInterval(progressTimer);
      setImportProgress(100);
      message.success(formatImportResult(result, mapped.length));
      setTimeout(() => handleClose(), 600);
```

- [ ] **Step 3: 修改 schedules 页导入函数返回统计对象**

在 `frontend/src/app/schedules/index.jsx` 的 `handleFileImport` 末尾，把：

```js
    message.success(`导入完成：成功 ${ok} 条${merged > 0 ? `，合并 ${merged} 条` : ''}${fail > 0 ? `，失败 ${fail} 条` : ''}${skipped > 0 ? `，跳过 ${skipped} 条` : ''}`);
    fetchSchedules();
```

改为：

```js
    fetchSchedules();
    return { ok, fail, merged, skipped };
```

---

### Task 3: 清理登录页 Card 废弃属性

**Files:**
- Modify: `C:/Users/chentao/Desktop/轻量化任务管理系统/frontend/src/app/login/index.jsx`

- [ ] **Step 1: 替换 Card 属性**

把：

```jsx
      <Card className={s.loginCard} bordered={false}>
```

改为：

```jsx
      <Card className={s.loginCard} variant="borderless">
```

---

### Task 4: 真实浏览器验证

**Files:**
- Temporary: `C:/Users/chentao/AppData/Local/Temp/claude_schedule_import_sample.csv`
- Temporary: `C:/Users/chentao/AppData/Local/Temp/claude_schedule_bad.txt`
- Temporary: `C:/Users/chentao/AppData/Local/Temp/claude_verify_schedule_import_fixed.py`

- [ ] **Step 1: 启动后端**

Run:

```bash
cd /c/Users/chentao/Desktop/轻量化任务管理系统/backend && npm run dev
```

Expected:

```text
后端服务器运行在端口 3000
MySQL 数据库连接池创建成功
```

- [ ] **Step 2: 启动前端**

Run:

```bash
cd /c/Users/chentao/Desktop/轻量化任务管理系统/frontend && npm run dev -- --host 127.0.0.1
```

Expected: Vite 输出可访问地址，例如 `http://127.0.0.1:5174/`。

- [ ] **Step 3: 创建标准 CSV 测试文件**

Create `C:/Users/chentao/AppData/Local/Temp/claude_schedule_import_sample.csv`:

```csv
星期,课程名,开始时间,结束时间,地点,教师
周一,验证高等数学,08:00,09:40,A101,张老师
周三,验证大学英语,10:00,11:40,B202,李老师
```

- [ ] **Step 4: 创建 Playwright 验证脚本**

Create `C:/Users/chentao/AppData/Local/Temp/claude_verify_schedule_import_fixed.py`，脚本需要验证：

1. 游客登录。
2. 进入 `/#/schedules`。
3. 上传 CSV。
4. 断言预览中出现 `6 字段已映射`。
5. 不手动映射，直接点击确认导入。
6. 断言页面出现 `验证高等数学`、`08:00 - 09:40`、`验证大学英语`、`10:00 - 11:40`。
7. 重复导入，断言总数仍为 2 条。
8. 上传 `.txt`，断言出现“不支持的文件格式”。

- [ ] **Step 5: 运行验证脚本**

Run:

```bash
PYTHONIOENCODING=utf-8 python C:/Users/chentao/AppData/Local/Temp/claude_verify_schedule_import_fixed.py
```

Expected:

```text
PASS auto mapping
PASS direct import
PASS duplicate merge
PASS invalid file error
```

- [ ] **Step 6: 清理临时文件**

Run:

```bash
rm -f /c/Users/chentao/AppData/Local/Temp/claude_schedule_import_sample.csv /c/Users/chentao/AppData/Local/Temp/claude_schedule_bad.txt /c/Users/chentao/AppData/Local/Temp/claude_verify_schedule_import_fixed.py
```

---

## 自查结果

| 检查项 | 结果 |
|---|---|
| Spec 覆盖 | 覆盖自动映射、字段优先、统一提示、废弃属性清理、真实浏览器验证 |
| 占位扫描 | 无 TBD/TODO/稍后处理 |
| 类型一致性 | `ok/fail/merged/skipped` 在调用方和展示方一致 |
| 范围控制 | 不改后端、不新增依赖、不改数据库 |
