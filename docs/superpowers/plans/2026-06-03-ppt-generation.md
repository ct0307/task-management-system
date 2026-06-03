# 课程答辩 PPT 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为"轻量化任务管理系统"生成一份 12 页深色现代风格的课程答辩 .pptx 文件

**Architecture:** 使用 python-pptx 库直接构建 PPT，深色渐变背景 + 白色/青色文字 + 卡片式布局。每页独立构建函数，统一视觉风格。

**Tech Stack:** Python 3 + python-pptx

---

### Task 1: 环境准备

**Files:**
- Create: `C:/Users/chentao/Desktop/轻量化任务管理系统/ppt/`

- [ ] **Step 1: 安装 python-pptx**

```bash
pip install python-pptx
```

- [ ] **Step 2: 创建输出目录**

```bash
mkdir -p "C:/Users/chentao/Desktop/轻量化任务管理系统/ppt"
```

---

### Task 2: PPT 生成脚本 — 基础框架

**Files:**
- Create: `C:/Users/chentao/Desktop/轻量化任务管理系统/ppt/generate_ppt.py`

- [ ] **Step 1: 创建基础框架脚本**

```python
from pptx import Presentation
from pptx.util import Inches, Pt, Emu
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.enum.shapes import MSO_SHAPE
import os

# 颜色常量
DARK_BG = RGBColor(0x0D, 0x11, 0x1A)       # 深色背景
CARD_BG = RGBColor(0x1A, 0x1F, 0x2E)        # 卡片背景
ACCENT = RGBColor(0x00, 0xBF, 0xFF)         # 青色强调
WHITE = RGBColor(0xFF, 0xFF, 0xFF)
GRAY = RGBColor(0x8A, 0x8F, 0x9A)
GREEN = RGBColor(0x4E, 0xC9, 0xB0)
ORANGE = RGBColor(0xF0, 0x9B, 0x59)
PURPLE = RGBColor(0xA7, 0x8B, 0xFA)

prs = Presentation()
prs.slide_width = Inches(13.333)
prs.slide_height = Inches(7.5)
W = prs.slide_width
H = prs.slide_height
```

- [ ] **Step 2: 定义辅助函数**

在脚本末尾添加辅助函数：

```python
def add_bg(slide):
    """添加深色渐变背景"""
    bg = slide.background
    fill = bg.fill
    fill.solid()
    fill.fore_color.rgb = DARK_BG

def add_accent_bar(slide, top=Inches(0), height=Inches(0.06)):
    """添加顶部青色装饰条"""
    shape = slide.shapes.add_shape(
        MSO_SHAPE.RECTANGLE, Inches(0), top, W, height
    )
    shape.fill.solid()
    shape.fill.fore_color.rgb = ACCENT
    shape.line.fill.background()

def add_title(slide, text, left=Inches(1), top=Inches(0.5), width=None, font_size=Pt(36)):
    """添加页面标题"""
    if width is None:
        width = W - Inches(2)
    txBox = slide.shapes.add_textbox(left, top, width, Inches(0.8))
    tf = txBox.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = text
    p.font.size = font_size
    p.font.color.rgb = WHITE
    p.font.bold = True
    return txBox

def add_subtitle(slide, text, left=Inches(1), top=Inches(1.3)):
    """添加副标题"""
    txBox = slide.shapes.add_textbox(left, top, W - Inches(2), Inches(0.6))
    tf = txBox.text_frame
    p = tf.paragraphs[0]
    p.text = text
    p.font.size = Pt(18)
    p.font.color.rgb = GRAY

def add_card(slide, left, top, width, height, title, desc, accent_color=ACCENT):
    """添加卡片：圆角矩形 + 标题 + 描述"""
    shape = slide.shapes.add_shape(
        MSO_SHAPE.ROUNDED_RECTANGLE, left, top, width, height
    )
    shape.fill.solid()
    shape.fill.fore_color.rgb = CARD_BG
    shape.line.fill.background()
    # 左侧色条
    bar = slide.shapes.add_shape(
        MSO_SHAPE.RECTANGLE, left, top, Inches(0.06), height
    )
    bar.fill.solid()
    bar.fill.fore_color.rgb = accent_color
    bar.line.fill.background()
    # 标题
    txBox = slide.shapes.add_textbox(left + Inches(0.3), top + Inches(0.2), width - Inches(0.5), Inches(0.5))
    tf = txBox.text_frame
    p = tf.paragraphs[0]
    p.text = title
    p.font.size = Pt(20)
    p.font.color.rgb = WHITE
    p.font.bold = True
    # 描述
    txBox2 = slide.shapes.add_textbox(left + Inches(0.3), top + Inches(0.7), width - Inches(0.5), height - Inches(0.9))
    tf2 = txBox2.text_frame
    tf2.word_wrap = True
    p2 = tf2.paragraphs[0]
    p2.text = desc
    p2.font.size = Pt(14)
    p2.font.color.rgb = GRAY
    p2.line_spacing = Pt(22)

def add_page_number(slide, num):
    """添加页码"""
    txBox = slide.shapes.add_textbox(W - Inches(1.5), H - Inches(0.6), Inches(1), Inches(0.4))
    tf = txBox.text_frame
    p = tf.paragraphs[0]
    p.text = str(num)
    p.font.size = Pt(12)
    p.font.color.rgb = GRAY
    p.alignment = PP_ALIGN.RIGHT
```

---

### Task 3: Slide 1 — 封面

**Files:**
- Modify: `ppt/generate_ppt.py` (追加)

- [ ] **Step 1: 添加封面页**

```python
# Slide 1: 封面
slide = prs.slides.add_slide(prs.slide_layouts[6])  # 空白布局
add_bg(slide)
add_accent_bar(slide)

# 主标题
txBox = slide.shapes.add_textbox(Inches(1.5), Inches(2.0), Inches(10), Inches(1.2))
tf = txBox.text_frame
p = tf.paragraphs[0]
p.text = "轻量化任务管理系统"
p.font.size = Pt(52)
p.font.color.rgb = WHITE
p.font.bold = True
p.alignment = PP_ALIGN.CENTER

# 副标题
txBox2 = slide.shapes.add_textbox(Inches(1.5), Inches(3.3), Inches(10), Inches(0.6))
tf2 = txBox2.text_frame
p2 = tf2.paragraphs[0]
p2.text = "React + Express + MySQL  全栈项目答辩"
p2.font.size = Pt(22)
p2.font.color.rgb = ACCENT
p2.alignment = PP_ALIGN.CENTER

# 标签行
tags = ["React 18", "Express 5", "MySQL 8", "Docker", "Python"]
tag_left_start = (W.inches - len(tags) * 2.2) / 2
for i, tag in enumerate(tags):
    shape = slide.shapes.add_shape(
        MSO_SHAPE.ROUNDED_RECTANGLE,
        Inches(tag_left_start + i * 2.2), Inches(4.2), Inches(1.8), Inches(0.55)
    )
    shape.fill.solid()
    shape.fill.fore_color.rgb = CARD_BG
    shape.line.fill.background()
    tf = shape.text_frame
    tf.paragraphs[0].text = tag
    tf.paragraphs[0].font.size = Pt(14)
    tf.paragraphs[0].font.color.rgb = ACCENT
    tf.paragraphs[0].alignment = PP_ALIGN.CENTER

add_page_number(slide, 1)
```

---

### Task 4: Slide 2 — 目录

**Files:**
- Modify: `ppt/generate_ppt.py` (追加)

- [ ] **Step 1: 添加目录页**

```python
# Slide 2: 目录
slide = prs.slides.add_slide(prs.slide_layouts[6])
add_bg(slide)
add_accent_bar(slide)
add_title(slide, "目录")
add_subtitle(slide, "5 分钟 | 12 页")

chapters = [
    ("01", "项目创意与亮点", "设计初衷 + 核心亮点"),
    ("02", "项目功能与特色", "功能模块 + 架构 + 技术特色"),
    ("03", "开发难点与解决方案", "3 大技术难点的解决思路"),
    ("04", "AI 开发学习心得", "收获 + 不足 + 展望"),
]
colors = [ACCENT, GREEN, ORANGE, PURPLE]

for i, (num, title, desc) in enumerate(chapters):
    y = Inches(2.0 + i * 1.2)
    # 编号
    txBox = slide.shapes.add_textbox(Inches(1.5), y, Inches(0.8), Inches(0.8))
    tf = txBox.text_frame
    p = tf.paragraphs[0]
    p.text = num
    p.font.size = Pt(32)
    p.font.color.rgb = colors[i]
    p.font.bold = True
    # 标题
    txBox2 = slide.shapes.add_textbox(Inches(2.6), y, Inches(4), Inches(0.5))
    tf2 = txBox2.text_frame
    p2 = tf2.paragraphs[0]
    p2.text = title
    p2.font.size = Pt(24)
    p2.font.color.rgb = WHITE
    p2.font.bold = True
    # 描述
    txBox3 = slide.shapes.add_textbox(Inches(2.6), y + Inches(0.5), Inches(6), Inches(0.4))
    tf3 = txBox3.text_frame
    p3 = tf3.paragraphs[0]
    p3.text = desc
    p3.font.size = Pt(14)
    p3.font.color.rgb = GRAY
    # 分割线
    if i < 3:
        line = slide.shapes.add_shape(
            MSO_SHAPE.RECTANGLE, Inches(2.6), y + Inches(1.05), Inches(8), Inches(0.01)
        )
        line.fill.solid()
        line.fill.fore_color.rgb = RGBColor(0x2A, 0x2F, 0x3E)
        line.line.fill.background()

add_page_number(slide, 2)
```

---

### Task 5: Slide 3 — 设计初衷

**Files:**
- Modify: `ppt/generate_ppt.py` (追加)

- [ ] **Step 1: 添加设计初衷页**

```python
# Slide 3: 设计初衷
slide = prs.slides.add_slide(prs.slide_layouts[6])
add_bg(slide)
add_accent_bar(slide)
add_title(slide, "设计初衷")
add_subtitle(slide, "从真实痛点出发，做自己每天都会用的系统")

# 痛点
add_card(slide, Inches(1), Inches(2.2), Inches(5.2), Inches(4.0),
    " 痛点",
    "现有工具 Notion/Todoist 功能繁重，上手成本高\n"
    "课程表和任务分散在不同 App，切换频繁\n"
    "没有一款工具能同时管理\"任务 + 课程 + 倒数日\"\n"
    "国内网络环境下部分工具访问不稳定",
    ORANGE)

# 动机
add_card(slide, Inches(7), Inches(2.2), Inches(5.2), Inches(4.0),
    " 动机",
    "做一个真正轻量的个人效率工具\n"
    "React + Express 全栈实战项目\n"
    "AI 辅助编程（Claude Code）驱动开发\n"
    "从需求→设计→开发→部署完整闭环",
    GREEN)

add_page_number(slide, 3)
```

---

### Task 6: Slide 4 — 核心亮点

**Files:**
- Modify: `ppt/generate_ppt.py` (追加)

- [ ] **Step 1: 添加核心亮点页**

```python
# Slide 4: 核心亮点
slide = prs.slides.add_slide(prs.slide_layouts[6])
add_bg(slide)
add_accent_bar(slide)
add_title(slide, "核心亮点")
add_subtitle(slide, "三大创新点")

highlights = [
    (" 课程表智能解析",
     "拍照/上传课程表图片\n"
     "→ OCR 识别文字\n"
     "→ 智能提取课程名/时间/教室\n"
     "→ 自动生成结构化日程\n"
     "支持 PNG/JPG/PDF/Word 多格式",
     ACCENT),
    (" 本地文件解析服务",
     "统一 Python 解析引擎\n"
     "双协议接入：\n"
     "• MCP 协议 → Claude Code 编程时调用\n"
     "• HTTP API → 项目后端调用\n"
     "pdfplumber + pytesseract + python-docx",
     PURPLE),
    (" 轻量化全栈",
     "一行命令部署：docker compose up -d\n"
     "Let's Encrypt 自动 HTTPS\n"
     "JWT 认证 + 角色权限\n"
     "Zustand 轻量状态管理\n"
     "13 项代码审查问题全部清零",
     GREEN),
]

for i, (title, desc, color) in enumerate(highlights):
    x = Inches(1 + i * 3.9)
    add_card(slide, x, Inches(2.2), Inches(3.5), Inches(4.2), title, desc, color)

add_page_number(slide, 4)
```

---

### Task 7: Slide 5 — 功能模块总览

**Files:**
- Modify: `ppt/generate_ppt.py` (追加)

- [ ] **Step 1: 添加功能模块页**

```python
# Slide 5: 功能模块总览
slide = prs.slides.add_slide(prs.slide_layouts[6])
add_bg(slide)
add_accent_bar(slide)
add_title(slide, "功能模块总览")
add_subtitle(slide, "四大核心模块，覆盖日常效率需求")

modules = [
    (" 任务管理", "CRUD 操作\n状态流转\n优先级分类\n筛选搜索\n统计概览\n批量操作", ACCENT),
    (" 日程规划", "日历视图\n日程管理\n课程表导入\n文件解析\n月/周切换\n拖拽调整", GREEN),
    (" 倒数日", "自定义事件\n倒计时/正计时\n进度可视化\n日期提醒\n事件分类\n列表/卡片", ORANGE),
    (" 系统功能", "JWT 认证\n角色权限\n回收站\n评论通知\n响应式布局\nDocker 部署", PURPLE),
]

for i, (title, desc, color) in enumerate(modules):
    x = Inches(1 + i * 3.0)
    add_card(slide, x, Inches(2.2), Inches(2.7), Inches(4.5), title, desc, color)

add_page_number(slide, 5)
```

---

### Task 8: Slide 6 — 项目架构

**Files:**
- Modify: `ppt/generate_ppt.py` (追加)

- [ ] **Step 1: 添加项目架构页**

```python
# Slide 6: 项目架构
slide = prs.slides.add_slide(prs.slide_layouts[6])
add_bg(slide)
add_accent_bar(slide)
add_title(slide, "项目架构")
add_subtitle(slide, "三层架构 + Python 解析服务")

# 架构层
layers = [
    (" 前端层", "React 18 + Vite\nAnt Design 5 + Zustand\nReact Router 7 + Axios", ACCENT, 0.5),
    (" 后端层", "Express 5 + MySQL2\nJWT + bcrypt\nController → Service → Model", GREEN, 2.5),
    (" 数据层", "MySQL 8\n用户/任务/日程/分类\n评论/通知/倒数日", ORANGE, 4.5),
    (" 解析服务", "Python 3\nMCP Server + HTTP API\npdfplumber / pytesseract", PURPLE, 6.0),
]

for title, desc, color, top in layers:
    shape = slide.shapes.add_shape(
        MSO_SHAPE.ROUNDED_RECTANGLE, Inches(2.5), Inches(top), Inches(8.5), Inches(1.5)
    )
    shape.fill.solid()
    shape.fill.fore_color.rgb = CARD_BG
    shape.line.fill.background()
    # 左侧色条
    bar = slide.shapes.add_shape(
        MSO_SHAPE.RECTANGLE, Inches(2.5), Inches(top), Inches(0.06), Inches(1.5)
    )
    bar.fill.solid()
    bar.fill.fore_color.rgb = color
    bar.line.fill.background()
    # 标题
    txBox = slide.shapes.add_textbox(Inches(2.9), Inches(top + 0.15), Inches(2.5), Inches(0.4))
    tf = txBox.text_frame
    p = tf.paragraphs[0]
    p.text = title
    p.font.size = Pt(18)
    p.font.color.rgb = color
    p.font.bold = True
    # 描述
    txBox2 = slide.shapes.add_textbox(Inches(5.5), Inches(top + 0.1), Inches(5), Inches(1.3))
    tf2 = txBox2.text_frame
    p2 = tf2.paragraphs[0]
    p2.text = desc
    p2.font.size = Pt(13)
    p2.font.color.rgb = GRAY
    p2.line_spacing = Pt(20)

# 箭头
import math
for top in [Inches(2.0), Inches(4.0), Inches(6.0)]:
    arrow = slide.shapes.add_shape(
        MSO_SHAPE.DOWN_ARROW, Inches(6.4), top, Inches(0.5), Inches(0.5)
    )
    arrow.fill.solid()
    arrow.fill.fore_color.rgb = GRAY
    arrow.line.fill.background()

add_page_number(slide, 6)
```

修复箭头导入问题，把 `import math` 移到文件顶部。

---

### Task 9: Slide 7 — 技术特色

**Files:**
- Modify: `ppt/generate_ppt.py` (追加)

- [ ] **Step 1: 添加技术特色页**

```python
# Slide 7: 技术特色
slide = prs.slides.add_slide(prs.slide_layouts[6])
add_bg(slide)
add_accent_bar(slide)
add_title(slide, "技术特色")
add_subtitle(slide, "架构规范 + 用户体验 + 安全加固")

features = [
    ("JWT 认证鉴权", "Token 刷新机制\n角色权限控制\nbcrypt 密码加密\n无硬编码密钥", ACCENT),
    ("Zustand 状态管理", "统一状态方案（移除 Jotai）\n精准订阅避免重渲染\n各模块独立 Store\n简洁 API，零模板代码", GREEN),
    ("批量 API + 防抖", "批量删除/更新单次请求\n搜索 300ms 防抖\n分页服务端实现\n输入 validator 校验", ORANGE),
    ("响应式 + 部署", "Ant Design 响应式布局\nDocker Compose 一键部署\nHTTPS 自动证书\n安全加固 13 项清零", PURPLE),
]

for i, (title, desc, color) in enumerate(features):
    row = i // 2
    col = i % 2
    x = Inches(1.2 + col * 5.7)
    y = Inches(2.0 + row * 2.5)
    add_card(slide, x, y, Inches(5.3), Inches(2.2), title, desc, color)

add_page_number(slide, 7)
```

---

### Task 10: Slide 8 — 难点1：状态管理混乱

**Files:**
- Modify: `ppt/generate_ppt.py` (追加)

- [ ] **Step 1: 添加难点1页**

```python
# Slide 8: 难点1
slide = prs.slides.add_slide(prs.slide_layouts[6])
add_bg(slide)
add_accent_bar(slide)
add_title(slide, "难点一：状态管理混乱")
add_subtitle(slide, "双状态库共存 → 统一方案 → 修异步 Bug")

# 左侧：问题
add_card(slide, Inches(1), Inches(2.0), Inches(5.5), Inches(4.5),
    " 问题",
    "Jotai 和 Zustand 两套状态库并存\n"
    "登录状态用 Jotai，任务状态用 Zustand\n"
    "切换页面时 token 不同步，偶发 401\n"
    "handleFilterChange 调用 setFilters 后\n"
    "fetchTasks 仍读到旧值，筛选结果错乱",
    ORANGE)

# 右侧：解决
add_card(slide, Inches(7.2), Inches(2.0), Inches(5.5), Inches(4.5),
    " 解决方案",
    "1. 全局搜索 Jotai 引用，逐一迁到 Zustand\n"
    "2. 删除 package.json 中 jotai 依赖\n"
    "3. handleFilterChange 改为 fetchTasks 接受\n"
    "   显式参数，不再依赖闭包中的旧 state\n"
    "4. 全局搜索确认 0 处 Jotai 残留",
    GREEN)

add_page_number(slide, 8)
```

---

### Task 11: Slide 9 — 难点2：课程表智能解析

**Files:**
- Modify: `ppt/generate_ppt.py` (追加)

- [ ] **Step 1: 添加难点2页**

```python
# Slide 9: 难点2
slide = prs.slides.add_slide(prs.slide_layouts[6])
add_bg(slide)
add_accent_bar(slide)
add_title(slide, "难点二：课程表智能解析")
add_subtitle(slide, "图片/文件 → OCR → 结构化日程  完整链路")

# 流程步骤
steps = [
    ("上传", "PNG/JPG\nPDF/Word\n截图/拍照", ACCENT),
    (" 提取", "pdfplumber\n文字层提取\npytesseract\nOCR 降级", GREEN),
    (" 解析", "正则匹配\n课程名/时间\n教室/周次\n结构化输出", ORANGE),
    (" 服务化", "MCP Server\nClaude Code 调用\nHTTP API\n项目后端调用", PURPLE),
]

for i, (title, desc, color) in enumerate(steps):
    x = Inches(1 + i * 3.1)
    add_card(slide, x, Inches(2.2), Inches(2.7), Inches(3.0), title, desc, color)
    # 箭头（除最后一个）
    if i < 3:
        arrow = slide.shapes.add_shape(
            MSO_SHAPE.RIGHT_ARROW, Inches(x.inches + 2.85), Inches(3.4), Inches(0.4), Inches(0.3)
        )
        arrow.fill.solid()
        arrow.fill.fore_color.rgb = GRAY
        arrow.line.fill.background()

# 底部说明
add_card(slide, Inches(1), Inches(5.6), Inches(11.3), Inches(1.2),
    " 技术细节",
    "pdfplumber 提取文字层 PDF → 扫描件降级为 pytesseract OCR → 正则+规则匹配课程结构 → JSON 输出\n"
    "MCP Server (stdio 协议) 供 Claude Code 直接调用；HTTP API (POST /api/parse) 供前端 ImportModal 调用",
    ACCENT)

add_page_number(slide, 9)
```

---

### Task 12: Slide 10 — 难点3：巨型组件重构

**Files:**
- Modify: `ppt/generate_ppt.py` (追加)

- [ ] **Step 1: 添加难点3页**

```python
# Slide 10: 难点3
slide = prs.slides.add_slide(prs.slide_layouts[6])
add_bg(slide)
add_accent_bar(slide)
add_title(slide, "难点三：巨型组件重构")
add_subtitle(slide, "818 行单文件 → 拆分为 3 个 ≤250 行的独立组件")

# 左边：拆分前
add_card(slide, Inches(1), Inches(2.2), Inches(3.5), Inches(4.0),
    " 拆分前",
    "TaskList.jsx\n818 行\n\n包含：\n筛选栏 + 快速添加\n+ 任务表格 + 详情抽屉\n+ 状态管理逻辑\n\n改一处，牵全身",
    ORANGE)

# 中间大箭头
arrow = slide.shapes.add_shape(
    MSO_SHAPE.RIGHT_ARROW, Inches(4.8), Inches(3.8), Inches(0.8), Inches(0.6)
)
arrow.fill.solid()
arrow.fill.fore_color.rgb = ACCENT
arrow.line.fill.background()

# 右边：拆分后
components = [
    ("FilterBar.jsx", "180 行", "搜索框 + 筛选条件 + 快速添加"),
    ("TaskTable.jsx", "240 行", "任务表格 + 行操作 + 批量选择"),
    ("TaskList.jsx", "355 行", "容器组件 + 编排逻辑 + API 调用"),
]
for i, (name, lines, desc) in enumerate(components):
    y = Inches(2.2 + i * 1.4)
    shape = slide.shapes.add_shape(
        MSO_SHAPE.ROUNDED_RECTANGLE, Inches(6.2), y, Inches(6), Inches(0.9)
    )
    shape.fill.solid()
    shape.fill.fore_color.rgb = CARD_BG
    shape.line.fill.background()
    txBox = slide.shapes.add_textbox(Inches(6.5), y + Inches(0.1), Inches(5.5), Inches(0.7))
    tf = txBox.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = f"{name}  ({lines})"
    p.font.size = Pt(16)
    p.font.color.rgb = GREEN
    p.font.bold = True
    p2 = tf.add_paragraph()
    p2.text = desc
    p2.font.size = Pt(12)
    p2.font.color.rgb = GRAY

# 底部
add_card(slide, Inches(1), Inches(5.9), Inches(11.3), Inches(0.9),
    " 原则",
    "共享 StatCard 组件提取（Dashboard + TaskStats 复用） | 单文件 ≤ 250 行 | Props 接口清晰 | 功能行为不变",
    GREEN)

add_page_number(slide, 10)
```

---

### Task 13: Slide 11 — 学习收获

**Files:**
- Modify: `ppt/generate_ppt.py` (追加)

- [ ] **Step 1: 添加学习收获页**

```python
# Slide 11: 学习收获
slide = prs.slides.add_slide(prs.slide_layouts[6])
add_bg(slide)
add_accent_bar(slide)
add_title(slide, "AI 项目开发学习心得")
add_subtitle(slide, "收获 + 感悟")

gains = [
    (" 全栈闭环", "从需求分析 → 技术选型 → 编码实现\n→ 代码审查 → 优化重构 → 部署上线\n完整经历了一个项目的生命周期", ACCENT),
    (" AI 辅助编程", "Claude Code 驱动开发\nAI 不是替代思考，而是加速执行\n关键：清晰的指令 + 上下文管理\nMCP 协议扩展了 AI 的能力边界", GREEN),
    (" 工程化思维", "代码审查 13 项问题 → 架构优化\n状态管理统一、组件拆分、批量 API\nJWT 安全加固、输入校验\n从\"能跑\"到\"规范\"的跨越", ORANGE),
    (" 技术广度", "前端：React/Zustand/Ant Design\n后端：Express/MySQL/JWT\n运维：Docker/Nginx/HTTPS\nPython：OCR/文件解析/MCP", PURPLE),
]

for i, (title, desc, color) in enumerate(gains):
    row = i // 2
    col = i % 2
    x = Inches(1.2 + col * 5.7)
    y = Inches(1.8 + row * 2.6)
    add_card(slide, x, y, Inches(5.3), Inches(2.3), title, desc, color)

add_page_number(slide, 11)
```

---

### Task 14: Slide 12 — 不足与展望

**Files:**
- Modify: `ppt/generate_ppt.py` (追加)

- [ ] **Step 1: 添加不足与展望页**

```python
# Slide 12: 不足与展望
slide = prs.slides.add_slide(prs.slide_layouts[6])
add_bg(slide)
add_accent_bar(slide)
add_title(slide, "不足与展望")
add_subtitle(slide, "持续改进，不断迭代")

# 不足
add_card(slide, Inches(1), Inches(2.2), Inches(5.2), Inches(3.5),
    " 当前不足",
    "移动端适配不完善\n"
    "单元测试 & E2E 测试覆盖不足\n"
    "缺少 CI/CD 自动部署流水线\n"
    "通知仅支持站内，无 WebSocket 实时推送\n"
    "课程表解析对非标准格式识别率待提升",
    ORANGE)

# 展望
add_card(slide, Inches(7), Inches(2.2), Inches(5.2), Inches(3.5),
    " 后续计划",
    "PWA 移动端适配，支持离线使用\n"
    "Vitest + Playwright 测试体系\n"
    "GitHub Actions CI/CD 自动部署\n"
    "WebSocket 实时通知 + 邮件提醒\n"
    "课程表解析接入 LLM 提升泛化能力",
    GREEN)

# 底部感谢
txBox = slide.shapes.add_textbox(Inches(1.5), Inches(6.2), Inches(10), Inches(0.8))
tf = txBox.text_frame
p = tf.paragraphs[0]
p.text = "感谢聆听"
p.font.size = Pt(40)
p.font.color.rgb = ACCENT
p.font.bold = True
p.alignment = PP_ALIGN.CENTER

add_page_number(slide, 12)
```

---

### Task 15: 保存文件

**Files:**
- Modify: `ppt/generate_ppt.py` (追加末尾)

- [ ] **Step 1: 添加保存逻辑**

```python
# 保存
output_path = os.path.join(os.path.dirname(__file__), "轻量化任务管理系统_答辩PPT.pptx")
prs.save(output_path)
print(f"PPT 已生成: {output_path}")
print(f"共 {len(prs.slides)} 页")
```

- [ ] **Step 2: 运行脚本生成 PPT**

```bash
cd "C:/Users/chentao/Desktop/轻量化任务管理系统/ppt" && python generate_ppt.py
```

Expected output:
```
PPT 已生成: ...\ppt\轻量化任务管理系统_答辩PPT.pptx
共 12 页
```
