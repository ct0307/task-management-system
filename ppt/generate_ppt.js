const pptxgen = require("pptxgenjs");

const pres = new pptxgen();
pres.layout = "LAYOUT_WIDE"; // 13.3" × 7.5"
pres.author = "轻量化任务管理系统";
pres.title = "轻量化任务管理系统 — 课程答辩";

// ── 颜色常量（无 # 前缀）──
const C = {
  darkBg: "0D111A",
  cardBg: "1A1F2E",
  cardBg2: "1E2433",
  accent: "00BFFF",
  white: "FFFFFF",
  gray: "8A8F9A",
  green: "4EC9B0",
  orange: "F09B59",
  purple: "A78BFA",
  red: "EF4444",
  divider: "2A2F3E",
};

// ── 工厂函数（避免 PptxGenJS 复用对象 bug）──
const mkShadow = () => ({ type: "outer", color: "000000", blur: 8, offset: 3, angle: 135, opacity: 0.2 });

function addBg(slide) {
  slide.background = { color: C.darkBg };
}

function addAccentBar(slide, top = 0, height = 0.05) {
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: top, w: 13.3, h: height,
    fill: { color: C.accent },
  });
}

function addTitle(slide, text, y = 0.5) {
  slide.addText(text, {
    x: 1.0, y: y, w: 11.3, h: 0.8,
    fontSize: 36, fontFace: "Arial Black", color: C.white, bold: true,
    margin: 0,
  });
}

function addSubtitle(slide, text, y = 1.25) {
  slide.addText(text, {
    x: 1.0, y: y, w: 11.3, h: 0.5,
    fontSize: 16, fontFace: "Calibri", color: C.gray, margin: 0,
  });
}

function addCard(slide, x, y, w, h, title, descLines, accentColor) {
  // 卡片背景
  slide.addShape(pres.shapes.RECTANGLE, {
    x, y, w, h, fill: { color: C.cardBg }, shadow: mkShadow(),
  });
  // 左侧色条
  slide.addShape(pres.shapes.RECTANGLE, {
    x, y, w: 0.06, h, fill: { color: accentColor },
  });
  // 标题
  if (title) {
    slide.addText(title, {
      x: x + 0.25, y: y + 0.15, w: w - 0.4, h: 0.45,
      fontSize: 20, fontFace: "Arial Black", color: C.white, bold: true, margin: 0,
    });
  }
  // 描述
  if (descLines && descLines.length > 0) {
    const textItems = descLines.map((line, i) => ({
      text: line,
      options: { breakLine: i < descLines.length - 1, color: C.gray, fontSize: 14, fontFace: "Calibri" },
    }));
    slide.addText(textItems, {
      x: x + 0.25, y: y + 0.7, w: w - 0.4, h: h - 0.85,
      valign: "top", margin: 0,
    });
  }
}

function addPageNum(slide, num) {
  slide.addText(String(num), {
    x: 12.0, y: 6.95, w: 1.0, h: 0.35,
    fontSize: 11, fontFace: "Calibri", color: C.gray, align: "right", margin: 0,
  });
}

function addSectionDivider(slide, partNum, partTitle, partDesc) {
  addBg(slide);
  addAccentBar(slide);
  addTitle(slide, `Part ${partNum}`, 2.0);
  slide.addText(partTitle, {
    x: 1.0, y: 2.8, w: 11.3, h: 1.0,
    fontSize: 44, fontFace: "Arial Black", color: C.white, bold: true, margin: 0,
  });
  slide.addText(partDesc, {
    x: 1.0, y: 3.8, w: 11.3, h: 0.5,
    fontSize: 18, fontFace: "Calibri", color: C.gray, margin: 0,
  });
}

// ═══════════════════════════════════════
// SLIDE 1: 封面
// ═══════════════════════════════════════
(function () {
  const slide = pres.addSlide();
  addBg(slide);
  addAccentBar(slide);

  // 装饰圆形（右上）
  slide.addShape(pres.shapes.OVAL, {
    x: 10.5, y: -1.5, w: 4.0, h: 4.0,
    fill: { color: C.accent, transparency: 90 },
  });
  slide.addShape(pres.shapes.OVAL, {
    x: -1.5, y: 5.0, w: 3.5, h: 3.5,
    fill: { color: C.purple, transparency: 92 },
  });

  // 主标题
  slide.addText("轻量化任务管理系统", {
    x: 1.5, y: 1.8, w: 10.3, h: 1.3,
    fontSize: 54, fontFace: "Arial Black", color: C.white, bold: true,
    align: "center", margin: 0,
  });

  // 副标题
  slide.addText("React + Express + MySQL  全栈项目答辩", {
    x: 1.5, y: 3.2, w: 10.3, h: 0.6,
    fontSize: 22, fontFace: "Calibri", color: C.accent, align: "center", margin: 0,
  });

  // 技术标签
  const tags = ["React 18", "Express 5", "MySQL 8", "Docker", "Python"];
  const tagW = 1.8, tagH = 0.5, gap = 0.3;
  const totalW = tags.length * tagW + (tags.length - 1) * gap;
  const startX = (13.3 - totalW) / 2;
  tags.forEach((tag, i) => {
    slide.addShape(pres.shapes.RECTANGLE, {
      x: startX + i * (tagW + gap), y: 4.2, w: tagW, h: tagH,
      fill: { color: C.cardBg }, shadow: mkShadow(),
    });
    slide.addText(tag, {
      x: startX + i * (tagW + gap), y: 4.2, w: tagW, h: tagH,
      fontSize: 14, fontFace: "Calibri", color: C.accent, align: "center", valign: "middle", margin: 0,
    });
  });

  addPageNum(slide, 1);
})();

// ═══════════════════════════════════════
// SLIDE 2: 目录
// ═══════════════════════════════════════
(function () {
  const slide = pres.addSlide();
  addBg(slide);
  addAccentBar(slide);
  addTitle(slide, "目录");
  addSubtitle(slide, "5 分钟 | 12 页");

  const chapters = [
    { num: "01", title: "项目创意与亮点", desc: "设计初衷 + 核心亮点", color: C.accent },
    { num: "02", title: "项目功能与特色", desc: "功能模块 + 架构 + 技术特色", color: C.green },
    { num: "03", title: "开发难点与解决方案", desc: "3 大技术难点的解决思路", color: C.orange },
    { num: "04", title: "AI 开发学习心得", desc: "收获 + 不足 + 展望", color: C.purple },
  ];

  chapters.forEach((ch, i) => {
    const y = 2.0 + i * 1.25;
    // 编号
    slide.addText(ch.num, {
      x: 1.5, y: y, w: 0.9, h: 0.9,
      fontSize: 36, fontFace: "Arial Black", color: ch.color, bold: true, valign: "middle", margin: 0,
    });
    // 标题
    slide.addText(ch.title, {
      x: 2.7, y: y, w: 6.0, h: 0.5,
      fontSize: 24, fontFace: "Arial Black", color: C.white, bold: true, margin: 0,
    });
    // 描述
    slide.addText(ch.desc, {
      x: 2.7, y: y + 0.5, w: 6.0, h: 0.4,
      fontSize: 14, fontFace: "Calibri", color: C.gray, margin: 0,
    });
    // 分割线
    if (i < 3) {
      slide.addShape(pres.shapes.RECTANGLE, {
        x: 2.7, y: y + 1.05, w: 8.5, h: 0.012,
        fill: { color: C.divider },
      });
    }
  });

  addPageNum(slide, 2);
})();

// ═══════════════════════════════════════
// SLIDE 3: 设计初衷
// ═══════════════════════════════════════
(function () {
  const slide = pres.addSlide();
  addBg(slide);
  addAccentBar(slide);
  addTitle(slide, "设计初衷");
  addSubtitle(slide, "从真实痛点出发，做自己每天都会用的系统");

  addCard(slide, 1.0, 2.2, 5.3, 4.2, "  痛点", [
    "现有工具 Notion / Todoist 功能繁重",
    "课程表和任务分散在不同 App",
    "没有工具能同时管理",
    "\"任务 + 课程 + 倒数日\"",
    "部分工具国内访问不稳定",
  ], C.orange);

  addCard(slide, 7.0, 2.2, 5.3, 4.2, "  动机", [
    "打造真正轻量的个人效率工具",
    "React + Express 全栈实战",
    "AI 辅助编程驱动开发",
    "从需求 → 设计 → 开发 → 部署",
    "完整项目生命周期闭环",
  ], C.green);

  addPageNum(slide, 3);
})();

// ═══════════════════════════════════════
// SLIDE 4: 核心亮点
// ═══════════════════════════════════════
(function () {
  const slide = pres.addSlide();
  addBg(slide);
  addAccentBar(slide);
  addTitle(slide, "核心亮点");
  addSubtitle(slide, "三大创新点，突出项目独特性");

  const cards = [
    { x: 1.0, c: C.accent, t: "  课程表智能解析", d: [
      "拍照/上传课程表 → OCR 识别",
      "智能提取：课程名/时间/教室/周次",
      "自动生成结构化日程",
      "支持 PNG / JPG / PDF / Word",
      "pdfplumber + pytesseract 双引擎",
    ]},
    { x: 5.1, c: C.purple, t: "  本地文件解析服务", d: [
      "统一 Python 解析引擎",
      "双协议接入：",
      "  MCP 协议 → Claude Code 调用",
      "  HTTP API → 项目后端调用",
      "编程 + 应用，两种场景覆盖",
    ]},
    { x: 9.2, c: C.green, t: "  轻量化全栈", d: [
      "一行命令：docker compose up -d",
      "Let's Encrypt 自动 HTTPS",
      "JWT 认证 + 角色权限控制",
      "Zustand 轻量状态管理",
      "13 项代码审查问题全部清零",
    ]},
  ];

  cards.forEach(({ x, c, t, d }) => {
    addCard(slide, x, 2.0, 3.5, 4.8, t, d, c);
  });

  addPageNum(slide, 4);
})();

// ═══════════════════════════════════════
// SLIDE 5: 功能模块总览
// ═══════════════════════════════════════
(function () {
  const slide = pres.addSlide();
  addBg(slide);
  addAccentBar(slide);
  addTitle(slide, "功能模块总览");
  addSubtitle(slide, "四大核心模块，覆盖日常效率需求");

  const modules = [
    { x: 1.0, c: C.accent, t: "  任务管理", d: [
      "CRUD 操作 + 批量处理",
      "状态流转（待处理/进行中/已完成）",
      "优先级 + 分类标签",
      "多条件筛选搜索",
      "仪表盘统计概览",
    ]},
    { x: 4.2, c: C.green, t: "  日程规划", d: [
      "日历月视图 / 周视图",
      "日程创建、编辑、拖拽调整",
      "课程表智能导入",
      "多格式文件解析",
      "课程 → 日程自动转换",
    ]},
    { x: 7.4, c: C.orange, t: "  倒数日", d: [
      "自定义事件名称和日期",
      "倒计时 / 正计时自动切换",
      "进度条可视化",
      "日期提醒通知",
      "列表 / 卡片双视图",
    ]},
    { x: 10.6, c: C.purple, t: "  系统功能", d: [
      "JWT 登录 / 注册 / Token 刷新",
      "管理员 / 普通用户角色",
      "回收站（软删除可恢复）",
      "任务评论 + 嵌套回复",
      "响应式布局适配",
    ]},
  ];

  modules.forEach(({ x, c, t, d }) => {
    addCard(slide, x, 2.0, 2.55, 4.8, t, d, c);
  });

  addPageNum(slide, 5);
})();

// ═══════════════════════════════════════
// SLIDE 6: 项目架构
// ═══════════════════════════════════════
(function () {
  const slide = pres.addSlide();
  addBg(slide);
  addAccentBar(slide);
  addTitle(slide, "项目架构");
  addSubtitle(slide, "三层架构 + Python 解析服务，前后端分离");

  const layers = [
    { y: 1.7, color: C.accent, title: "  前端层", desc: "React 18 + Vite  |  Ant Design 5  |  Zustand 状态管理  |  React Router 7" },
    { y: 2.9, color: C.green, title: "  后端层", desc: "Express 5  |  JWT + bcrypt 认证  |  Controller → Service → Model 三层架构" },
    { y: 4.1, color: C.orange, title: "  数据层", desc: "MySQL 8  |  用户 / 任务 / 日程 / 分类 / 评论 / 通知 / 倒数日" },
    { y: 5.3, color: C.purple, title: "  解析服务", desc: "Python 3  |  MCP Server (stdio) + HTTP API  |  pdfplumber / pytesseract / python-docx" },
  ];

  layers.forEach(({ y, color, title, desc }, i) => {
    // 卡片
    slide.addShape(pres.shapes.RECTANGLE, {
      x: 1.5, y, w: 10.3, h: 0.95,
      fill: { color: C.cardBg }, shadow: mkShadow(),
    });
    slide.addShape(pres.shapes.RECTANGLE, {
      x: 1.5, y, w: 0.07, h: 0.95,
      fill: { color },
    });
    slide.addText(title, {
      x: 1.9, y: y + 0.1, w: 2.8, h: 0.75,
      fontSize: 18, fontFace: "Arial Black", color, bold: true, valign: "middle", margin: 0,
    });
    slide.addText(desc, {
      x: 4.8, y: y + 0.1, w: 6.5, h: 0.75,
      fontSize: 12, fontFace: "Calibri", color: C.gray, valign: "middle", margin: 0,
    });
    // 箭头（除最后一个）
    if (i < 3) {
      slide.addText("▼", {
        x: 6.3, y: y + 0.88, w: 0.7, h: 0.4,
        fontSize: 18, color: C.gray, align: "center", margin: 0,
      });
    }
  });

  addPageNum(slide, 6);
})();

// ═══════════════════════════════════════
// SLIDE 7: 技术特色
// ═══════════════════════════════════════
(function () {
  const slide = pres.addSlide();
  addBg(slide);
  addAccentBar(slide);
  addTitle(slide, "技术特色");
  addSubtitle(slide, "架构规范 + 用户体验 + 安全加固");

  const features = [
    { x: 1.0, y: 2.0, c: C.accent, t: "JWT 认证鉴权", d: [
      "Token 刷新机制",
      "角色权限控制（admin/user）",
      "bcrypt 密码加密",
      "启动时强制检查 JWT_SECRET",
      "无硬编码密钥",
    ]},
    { x: 7.0, y: 2.0, c: C.green, t: "Zustand 状态管理", d: [
      "统一状态方案（移除 Jotai）",
      "精准订阅，避免不必要重渲染",
      "各功能模块独立 Store",
      "简洁 API，零模板代码",
      "筛选 Bug 修复：显式参数传递",
    ]},
    { x: 1.0, y: 4.8, c: C.orange, t: "批量 API + 防抖", d: [
      "批量删除/更新，单次请求",
      "搜索输入 300ms 防抖",
      "服务端分页，返回 total/page/pageSize",
      "validator 中间件输入校验",
      "部分失败返回失败明细",
    ]},
    { x: 7.0, y: 4.8, c: C.purple, t: "响应式 + 部署", d: [
      "Ant Design 响应式布局",
      "Docker Compose 一键部署",
      "Let's Encrypt 自动 HTTPS",
      "Nginx 反向代理",
      "代码审查 13 项优化清零",
    ]},
  ];

  features.forEach(({ x, y, c, t, d }) => {
    addCard(slide, x, y, 5.3, 2.2, t, d, c);
  });

  addPageNum(slide, 7);
})();

// ═══════════════════════════════════════
// SLIDE 8: 难点1 — 状态管理混乱
// ═══════════════════════════════════════
(function () {
  const slide = pres.addSlide();
  addBg(slide);
  addAccentBar(slide);
  addTitle(slide, "难点一：状态管理混乱");
  addSubtitle(slide, "双状态库共存 → 统一方案 → 修复异步 Bug");

  addCard(slide, 1.0, 2.0, 5.5, 4.5, "  问题", [
    "Jotai 和 Zustand 两套状态库并存",
    "登录状态用 Jotai，任务状态用 Zustand",
    "页面切换时 token 状态不同步",
    "偶发 401 认证失败",
    "",
    "handleFilterChange 调用 setFilters 后",
    "fetchTasks 仍读到闭包中的旧值",
    "导致筛选结果与实际筛选条件不匹配",
  ], C.orange);

  addCard(slide, 7.2, 2.0, 5.5, 4.5, "  解决方案", [
    "1. 全局搜索所有 Jotai useSetAtom / useAtomValue",
    "2. 逐一迁移到 Zustand useAuthStore",
    "3. 删除 package.json 中 jotai 依赖",
    "4. 清理 authStore.js 兼容导出层",
    "5. 全局搜索确认 0 处 Jotai 残留",
    "",
    "fetchTasks 改为接受显式 filter 参数",
    "不再依赖闭包中的旧 state 快照",
  ], C.green);

  addPageNum(slide, 8);
})();

// ═══════════════════════════════════════
// SLIDE 9: 难点2 — 课程表智能解析
// ═══════════════════════════════════════
(function () {
  const slide = pres.addSlide();
  addBg(slide);
  addAccentBar(slide);
  addTitle(slide, "难点二：课程表智能解析");
  addSubtitle(slide, "图片/文件 → OCR 识别 → 结构化日程，完整链路");

  // 步骤流程
  const steps = [
    { x: 1.0, t: "  上传", d: ["PNG / JPG", "PDF / Word", "截图 / 拍照"], c: C.accent },
    { x: 3.8, t: "  提取", d: ["pdfplumber", "文字层提取", "pytesseract", "OCR 降级"], c: C.green },
    { x: 6.6, t: "  解析", d: ["正则匹配", "课程名/时间", "教室/周次", "JSON 输出"], c: C.orange },
    { x: 9.4, t: "  服务化", d: ["MCP Server", "Claude Code", "HTTP API", "项目后端"], c: C.purple },
  ];

  steps.forEach(({ x, t, d, c }, i) => {
    addCard(slide, x, 2.0, 2.55, 2.8, t, d, c);
    // 箭头
    if (i < 3) {
      slide.addText("▶", {
        x: x + 2.55, y: 2.8, w: 0.5, h: 0.8,
        fontSize: 22, color: C.gray, align: "center", valign: "middle", margin: 0,
      });
    }
  });

  // 底部细节
  addCard(slide, 1.0, 5.3, 11.3, 1.5, " 技术细节", [
    "pdfplumber 提取文字层 PDF → 扫描件降级为 pytesseract OCR → 正则 + 规则匹配课程结构 → 结构化 JSON",
    "MCP Server（stdio 协议）供 Claude Code 直接调用；HTTP API（POST /api/parse）供前端 ImportModal 使用",
  ], C.accent);

  addPageNum(slide, 9);
})();

// ═══════════════════════════════════════
// SLIDE 10: 难点3 — 巨型组件重构
// ═══════════════════════════════════════
(function () {
  const slide = pres.addSlide();
  addBg(slide);
  addAccentBar(slide);
  addTitle(slide, "难点三：巨型组件重构");
  addSubtitle(slide, "818 行单文件 → 拆分为 3 个独立组件，各 ≤ 250 行");

  // 左侧：拆分前
  addCard(slide, 1.0, 2.0, 3.8, 4.5, "  拆分前", [
    "TaskList.jsx",
    "818 行单文件",
    "",
    "包含：",
    "  筛选栏 + 快速添加",
    "  任务表格",
    "  详情抽屉",
    "  所有状态管理逻辑",
    "",
    "改一处，牵全身",
  ], C.red);

  // 中间箭头
  slide.addText("▶", {
    x: 5.0, y: 3.8, w: 0.8, h: 0.8,
    fontSize: 36, color: C.accent, align: "center", valign: "middle", margin: 0,
  });

  // 右侧：拆分后
  const parts = [
    { y: 2.0, name: "FilterBar.jsx", lines: "180 行", desc: "搜索框 + 筛选条件 + 快速添加" },
    { y: 3.2, name: "TaskTable.jsx", lines: "240 行", desc: "任务表格 + 行操作 + 批量选择" },
    { y: 4.4, name: "TaskList.jsx", lines: "355 行", desc: "容器组件：编排逻辑 + API 调用" },
  ];

  parts.forEach(({ y, name, lines, desc }) => {
    slide.addShape(pres.shapes.RECTANGLE, {
      x: 6.2, y, w: 6.0, h: 0.9,
      fill: { color: C.cardBg }, shadow: mkShadow(),
    });
    slide.addShape(pres.shapes.RECTANGLE, {
      x: 6.2, y, w: 0.06, h: 0.9,
      fill: { color: C.green },
    });
    slide.addText(`${name}  (${lines})`, {
      x: 6.5, y: y + 0.05, w: 5.5, h: 0.4,
      fontSize: 16, fontFace: "Arial Black", color: C.green, bold: true, margin: 0,
    });
    slide.addText(desc, {
      x: 6.5, y: y + 0.45, w: 5.5, h: 0.35,
      fontSize: 12, fontFace: "Calibri", color: C.gray, margin: 0,
    });
  });

  // 底部原则
  addCard(slide, 1.0, 5.6, 11.3, 1.2, " 原则", [
    "共享 StatCard 组件（Dashboard + TaskStats 复用）  |  单文件 ≤ 250 行  |  Props 接口清晰  |  功能行为与拆分前完全一致",
  ], C.green);

  addPageNum(slide, 10);
})();

// ═══════════════════════════════════════
// SLIDE 11: 学习收获
// ═══════════════════════════════════════
(function () {
  const slide = pres.addSlide();
  addBg(slide);
  addAccentBar(slide);
  addTitle(slide, "AI 项目开发学习心得");
  addSubtitle(slide, "收获 + 实操感悟，AI 辅助开发的完整体验");

  const gains = [
    { x: 1.0, y: 1.9, c: C.accent, t: "  全栈闭环能力", d: [
      "需求分析 → 技术选型 → 编码实现",
      "代码审查 → 优化重构 → 部署上线",
      "完整经历了一个项目的生命周期",
      "从 0 到 1 的实际交付能力",
    ]},
    { x: 7.0, y: 1.9, c: C.green, t: "  AI 辅助编程", d: [
      "Claude Code 驱动开发全流程",
      "AI 不是替代思考，而是加速执行",
      "关键在于清晰的指令和上下文管理",
      "MCP 协议扩展了 AI 的能力边界",
    ]},
    { x: 1.0, y: 4.2, c: C.orange, t: "  工程化思维", d: [
      "代码审查发现 13 项问题并清零",
      "状态管理统一、组件拆分、批量 API",
      "JWT 安全加固、输入校验",
      '从"能跑就行"到"规范化开发"',
    ]},
    { x: 7.0, y: 4.2, c: C.purple, t: "  技术广度", d: [
      "前端：React / Zustand / Ant Design",
      "后端：Express / MySQL / JWT",
      "运维：Docker / Nginx / HTTPS",
      "Python：OCR / 文件解析 / MCP",
    ]},
  ];

  gains.forEach(({ x, y, c, t, d }) => {
    addCard(slide, x, y, 5.3, 2.0, t, d, c);
  });

  addPageNum(slide, 11);
})();

// ═══════════════════════════════════════
// SLIDE 12: 不足与展望
// ═══════════════════════════════════════
(function () {
  const slide = pres.addSlide();
  addBg(slide);
  addAccentBar(slide);

  // 标题居中
  slide.addText("不足与展望", {
    x: 1.0, y: 0.5, w: 11.3, h: 0.8,
    fontSize: 36, fontFace: "Arial Black", color: C.white, bold: true, align: "center", margin: 0,
  });
  slide.addText("持续改进，不断迭代", {
    x: 1.0, y: 1.25, w: 11.3, h: 0.5,
    fontSize: 16, fontFace: "Calibri", color: C.gray, align: "center", margin: 0,
  });

  // 不足
  addCard(slide, 1.0, 2.2, 5.3, 3.2, "  当前不足", [
    "移动端适配不完善",
    "单元测试 & E2E 测试覆盖不足",
    "缺少 CI/CD 自动部署流水线",
    "通知仅站内，无实时推送",
    "课程表解析对非标准格式识别率低",
  ], C.orange);

  // 展望
  addCard(slide, 7.0, 2.2, 5.3, 3.2, "  后续计划", [
    "PWA 移动端适配，支持离线使用",
    "Vitest + Playwright 测试体系",
    "GitHub Actions CI/CD 自动部署",
    "WebSocket 实时通知 + 邮件提醒",
    "课程表解析接入 LLM 提升泛化能力",
  ], C.green);

  // 感谢
  slide.addText("感谢聆听", {
    x: 1.5, y: 5.9, w: 10.3, h: 1.0,
    fontSize: 44, fontFace: "Arial Black", color: C.accent, bold: true, align: "center", valign: "middle", margin: 0,
  });

  addPageNum(slide, 12);
})();

// ── 保存 ──
const outPath = "C:/Users/chentao/Desktop/轻量化任务管理系统/ppt/轻量化任务管理系统_答辩PPT.pptx";
pres.writeFile({ fileName: outPath }).then(() => {
  console.log("PPT 已生成: " + outPath);
  console.log("共 " + pres.slides.length + " 页");
});
