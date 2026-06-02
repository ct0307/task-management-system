# 日程文件导入最小修复 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 修复日程页文件导入字段映射，让 CSV / Excel / JSON / PDF / 图片解析结果能正确导入为 weekly 日程。

**Architecture:** 保留现有 `ImportModal` 通用解析组件，只扩展字段自动识别；在 `schedules/index.jsx` 中把通用导入结果转换为日程任务。后端和 Python 解析服务本轮不改，避免扩大范围。

**Tech Stack:** React、Ant Design、Vite、现有 ImportModal、现有 `/api/tasks`。

---

## 文件结构

| 文件 | 操作 | 职责 |
|---|---|---|
| `frontend/src/component/ImportModal/index.jsx` | 修改 | 增加课程表字段自动识别：星期、开始时间、结束时间、地点、教师 |
| `frontend/src/app/schedules/index.jsx` | 修改 | 增加课程表字段映射、单列内容解析、导入时写入 start_time/end_time/description |

---

### Task 1: 扩展 ImportModal 自动字段识别

**Files:**
- Modify: `C:/Users/chentao/Desktop/轻量化任务管理系统/frontend/src/component/ImportModal/index.jsx`

- [ ] **Step 1: 修改 FIELD_PATTERNS**

把 `FIELD_PATTERNS` 扩展为：

```js
const FIELD_PATTERNS = {
  title:       ['标题','title','任务名','名称','name','task','任务','课程名','课程','科目','事项','项目','内容'],
  description: ['描述','description','详情','备注','desc','note','说明','摘要','简介','信息'],
  status:      ['状态','status','state','进度','完成状态'],
  priority:    ['优先级','priority','重要程度','level','紧急程度'],
  category:    ['分类','category','类别','type','类型','分组','标签'],
  due_date:    ['截止','due','deadline','日期','date','到期','截止日期','到期日','截止时间','deadline'],
  assignee:    ['负责人','assignee','责任人','处理人','owner','执行人'],
  weekday:     ['星期','周几','weekday','day','上课星期'],
  start_time:  ['开始时间','上课时间','start_time','start','开始','起始时间'],
  end_time:    ['结束时间','下课时间','end_time','end','结束'],
  location:    ['地点','教室','位置','location','场地','上课地点'],
  teacher:     ['教师','老师','任课老师','teacher','授课教师'],
};
```

- [ ] **Step 2: 构建验证**

Run:

```bash
cd /c/Users/chentao/Desktop/轻量化任务管理系统/frontend && npm run build
```

Expected: 构建通过。

---

### Task 2: 修复日程页导入逻辑

**Files:**
- Modify: `C:/Users/chentao/Desktop/轻量化任务管理系统/frontend/src/app/schedules/index.jsx`

- [ ] **Step 1: 在 handleFileImport 前增加辅助函数**

加入：

```js
  const normalizeWeekDay = (value) => {
    const text = String(value || '').trim();
    const map = {
      '星期一': '周一', '星期二': '周二', '星期三': '周三', '星期四': '周四', '星期五': '周五', '星期六': '周六', '星期日': '周日', '星期天': '周日',
      '1': '周一', '2': '周二', '3': '周三', '4': '周四', '5': '周五', '6': '周六', '7': '周日',
      'mon': '周一', 'tue': '周二', 'wed': '周三', 'thu': '周四', 'fri': '周五', 'sat': '周六', 'sun': '周日'
    };
    const lower = text.toLowerCase();
    const direct = WEEKDAYS.find(day => text.includes(day));
    if (direct) return direct;
    const full = Object.keys(map).find(key => lower.includes(key.toLowerCase()));
    return full ? map[full] : '';
  };

  const normalizeTime = (value) => {
    const text = String(value || '').trim();
    const match = text.match(/(\d{1,2})[:：](\d{2})/);
    if (!match) return '';
    return `${match[1].padStart(2, '0')}:${match[2]}`;
  };

  const parseScheduleContent = (text) => {
    const value = String(text || '').trim();
    const weekDay = normalizeWeekDay(value);
    const timeMatch = value.match(/(\d{1,2}[:：]\d{2})\s*[-~—–]\s*(\d{1,2}[:：]\d{2})/);
    const startTime = timeMatch ? normalizeTime(timeMatch[1]) : '';
    const endTime = timeMatch ? normalizeTime(timeMatch[2]) : '';
    const cleaned = value
      .replace(/星期[一二三四五六日天]|周[一二三四五六日]/, '')
      .replace(/\d{1,2}[:：]\d{2}\s*[-~—–]\s*\d{1,2}[:：]\d{2}/, '')
      .replace(/场地[:：]/g, ' ')
      .replace(/教师[:：]/g, ' ')
      .trim();
    const parts = cleaned.split(/\s+/).filter(Boolean);
    const courseName = parts[0] || '';
    const location = parts.find(part => /楼|室|教室|校区|[A-Z]\d{2,}/.test(part)) || '';
    const teacher = parts.find(part => /老师|教师|教授/.test(part)) || '';
    return { weekDay, startTime, endTime, courseName, location, teacher, rawText: value };
  };
```

- [ ] **Step 2: 替换 handleFileImport**

把现有 `handleFileImport` 替换为：

```js
  const handleFileImport = async (mappedRows) => {
    let ok = 0, fail = 0;
    for (const row of mappedRows) {
      const contentParsed = parseScheduleContent(row.title || row.description || '');
      const weekDay = normalizeWeekDay(row.weekday) || contentParsed.weekDay || quickDay;
      const courseName = (row.title && !normalizeWeekDay(row.title) ? row.title : '') || contentParsed.courseName || row.description || '';
      const startTime = normalizeTime(row.start_time) || contentParsed.startTime;
      const endTime = normalizeTime(row.end_time) || contentParsed.endTime;
      const location = row.location || contentParsed.location || '';
      const teacher = row.teacher || contentParsed.teacher || '';

      if (!courseName.trim()) { fail++; continue; }
      if (!weekDay || !WEEKDAYS.includes(weekDay)) { fail++; continue; }

      const descriptionParts = [];
      if (location) descriptionParts.push(`地点：${location}`);
      if (teacher) descriptionParts.push(`教师：${teacher}`);
      if (contentParsed.rawText && contentParsed.rawText !== courseName) descriptionParts.push(contentParsed.rawText);

      try {
        await post('/api/tasks', {
          title: courseName.trim(),
          description: descriptionParts.join('；'),
          due_date: nextWeekdayDate(weekDay),
          recurrence: 'weekly',
          status: 'pending',
          start_time: startTime || undefined,
          end_time: endTime || undefined,
        });
        ok++;
      } catch { fail++; }
    }
    message.success(`导入完成：成功 ${ok} 条${fail > 0 ? `，失败 ${fail} 条` : ''}`);
    fetchSchedules();
  };
```

- [ ] **Step 3: 给 ImportModal 传课程表字段**

把页面底部的 `ImportModal` 调用改为：

```jsx
      <ImportModal
        open={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        onImport={handleFileImport}
        title="导入课程表"
        mode="schedule"
        extraFields={[
          { label: '📅 星期', value: 'weekday' },
          { label: '🕘 开始时间', value: 'start_time' },
          { label: '🕙 结束时间', value: 'end_time' },
          { label: '📍 地点', value: 'location' },
          { label: '👨‍🏫 教师', value: 'teacher' },
        ]}
      />
```

- [ ] **Step 4: 更新按钮文案**

把：

```jsx
选择文件（CSV / Excel / JSON）
```

改为：

```jsx
选择文件（CSV / Excel / JSON / PDF / 图片）
```

把说明改为：

```jsx
支持 .csv .xlsx .xls .json .pdf .png .jpg，建议包含「星期」和「课程名」列
```

- [ ] **Step 5: 构建验证**

Run:

```bash
cd /c/Users/chentao/Desktop/轻量化任务管理系统/frontend && npm run build
```

Expected: 构建通过。

---

## 自查结果

| 检查项 | 结果 |
|---|---|
| Spec 覆盖 | 覆盖字段映射、单列内容解析、按钮文案 |
| 占位扫描 | 无占位内容 |
| 类型一致性 | `weekday/start_time/end_time/location/teacher` 在 ImportModal 和 schedules 页一致 |
| 范围控制 | 不修改后端，不新增依赖 |
