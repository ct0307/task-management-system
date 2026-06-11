# 课程表导入体验修复设计

日期：2026-06-10

## 背景

日程页课程表导入功能实测发现：标准 CSV 文件能解析出预览表格，但自动字段映射为 0，导致“确认导入”按钮禁用。用户必须手动映射 6 个字段后才能导入。该体验不符合“课程表导入完善好用”的目标。

## 目标

1. 标准课程表文件上传后自动映射关键字段。
2. 课程表模式下优先展示课程表字段，降低手动修正成本。
3. 导入完成后只显示一条清晰结果提示。
4. 顺手清理本次涉及的 Ant Design 废弃 API 警告。

## 范围

修改前端两个文件：

- `frontend/src/component/ImportModal/index.jsx`
- `frontend/src/app/login/index.jsx`

不修改后端、不新增依赖、不改数据库结构。

## 设计

### 1. 自动字段映射

`ImportModal` 当前在文件解析完成后调用：

```js
setHeaders(result.headers);
setRows(result.rows);
setColumnMap(autoMap);
```

`autoMap` 依赖 React 状态 `headers`，此时仍是旧值，因此新文件表头无法被映射。

改为引入纯函数：

```js
const buildAutoMap = (nextHeaders) => { ... }
```

解析完成后直接用 `result.headers` 计算：

```js
setColumnMap(buildAutoMap(result.headers));
```

### 2. 课程表字段优先

`mode === 'schedule'` 时，下拉选项优先展示：

1. 标题/课程名
2. 星期
3. 开始时间
4. 结束时间
5. 地点
6. 教师
7. 描述/备注

普通任务导入模式保持现有字段顺序。

### 3. 导入结果反馈

`ImportModal` 调用 `onImport(mapped, rows, headers)` 后读取返回值：

```js
{ ok, fail, merged, skipped }
```

如果调用方返回统计结果，则展示：

```text
导入完成：成功 X 条，合并 Y 条，失败 Z 条，跳过 N 条
```

如果调用方没有返回值，保留原来的兜底提示。

`schedules/index.jsx` 的 `handleFileImport` 不再直接 `message.success`，改为返回统计对象。

### 4. 废弃警告清理

- `Modal destroyOnClose` 改为 `destroyOnHidden`。
- 登录页 `Card bordered={false}` 改为 `variant="borderless"`。

`message` context 警告属于全局 Ant Design App 包裹问题，本轮不扩散处理。

## 验收标准

使用真实浏览器验证：

1. 上传标准 CSV：`星期,课程名,开始时间,结束时间,地点,教师`。
2. 预览应显示 6 个字段已映射。
3. 不手动映射，直接确认导入成功。
4. 周视图显示导入课程和时间。
5. 重复导入不新增重复课程，并显示合并提示。
6. `.txt` 非法文件仍显示明确错误。
7. 控制台不再出现 `destroyOnClose`、`bordered` 废弃警告。
