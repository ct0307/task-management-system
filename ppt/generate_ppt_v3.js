const pptxgen = require("pptxgenjs");

// ═══════════════════════════════════════════════════════════
// 轻量化任务管理系统 — 答辩 PPT v3
// 浅色学术风格，16 页，含架构图、流程图、UI 布局图
// ═══════════════════════════════════════════════════════════

async function main() {
  const pres = new pptxgen();
  pres.layout = "LAYOUT_WIDE"; // 13.3" x 7.5"
  pres.author = "轻量化任务管理系统";
  pres.title = "轻量化任务管理系统 — 期末答辩";

  // ── Color palette ──
  const C = {
    bg: "FAFBFC",
    white: "FFFFFF",
    primary: "2563EB",
    primaryDark: "1E40AF",
    primaryLight: "DBEAFE",
    accent: "0D9488",
    accentLight: "CCFBF1",
    warm: "D97706",
    warmLight: "FEF3C7",
    purple: "7C3AED",
    purpleLight: "EDE9FE",
    red: "DC2626",
    redLight: "FEE2E2",
    green: "059669",
    greenLight: "D1FAE5",
    title: "0F172A",
    body: "334155",
    muted: "64748B",
    border: "E2E8F0",
    divider: "CBD5E1",
  };

  // ── Helper: slide background ──
  function bg(slide) {
    slide.background = { color: C.bg };
  }

  // ── Helper: top accent stripe ──
  function topBar(slide) {
    slide.addShape(pres.shapes.RECTANGLE, {
      x: 0, y: 0, w: 13.3, h: 0.06,
      fill: { color: C.primary },
    });
  }

  // ── Helper: page number ──
  function pageNum(slide, n) {
    slide.addText(String(n), {
      x: 12.3, y: 7.05, w: 0.7, h: 0.3,
      fontSize: 9, fontFace: "Arial", color: C.muted, align: "right",
    });
  }

  // ── Helper: section title ──
  function sectionTitle(slide, title, subtitle) {
    topBar(slide);
    slide.addText(title, {
      x: 0.8, y: 0.35, w: 11.7, h: 0.65,
      fontSize: 30, fontFace: "Arial", color: C.title, bold: true,
    });
    if (subtitle) {
      slide.addText(subtitle, {
        x: 0.8, y: 0.95, w: 11.7, h: 0.35,
        fontSize: 13, fontFace: "Arial", color: C.muted,
      });
    }
    // Bottom divider
    slide.addShape(pres.shapes.RECTANGLE, {
      x: 0.8, y: 1.4, w: 11.7, h: 0.012,
      fill: { color: C.border },
    });
  }

  // ── Helper: card with left accent bar ──
  function card(slide, x, y, w, h, accentColor, title, lines, opts = {}) {
    // Card bg
    slide.addShape(pres.shapes.RECTANGLE, {
      x, y, w, h,
      fill: { color: C.white },
      shadow: { type: "outer", blur: 6, offset: 2, angle: 90, color: "000000", opacity: 0.06 },
    });
    // Left accent
    slide.addShape(pres.shapes.RECTANGLE, {
      x, y, w: 0.06, h,
      fill: { color: accentColor },
    });
    // Title
    slide.addText(title, {
      x: x + 0.25, y: y + 0.15, w: w - 0.5, h: 0.35,
      fontSize: 16, fontFace: "Arial", color: accentColor, bold: true,
    });
    // Body
    if (lines && lines.length > 0) {
      const items = lines.map((line, i) => ({
        text: line,
        options: {
          breakLine: i < lines.length - 1,
          color: C.body, fontSize: 12, fontFace: "Arial",
          bullet: opts.bullet || false,
          paraSpaceAfter: 3,
        },
      }));
      slide.addText(items, {
        x: x + 0.25, y: y + 0.55, w: w - 0.5, h: h - 0.75,
        valign: "top",
      });
    }
  }

  // ── Helper: icon text block (numbered circle) ──
  function numCircle(slide, x, y, num, color) {
    slide.addShape(pres.shapes.OVAL, {
      x, y, w: 0.5, h: 0.5,
      fill: { color },
    });
    slide.addText(String(num), {
      x, y, w: 0.5, h: 0.5,
      fontSize: 18, fontFace: "Arial", color: "FFFFFF", bold: true,
      align: "center", valign: "middle",
    });
  }

  // ═══════════════════════════════════════════════════
  // SLIDE 1 — 封面
  // ═══════════════════════════════════════════════════
  {
    const s = pres.addSlide();
    s.background = { color: C.primary };

    // Decorative shapes
    s.addShape(pres.shapes.OVAL, {
      x: -2.0, y: -2.0, w: 6, h: 6,
      fill: { color: C.primaryDark, transparency: 60 },
    });
    s.addShape(pres.shapes.OVAL, {
      x: 10.5, y: 4.5, w: 5, h: 5,
      fill: { color: C.primaryDark, transparency: 70 },
    });
    s.addShape(pres.shapes.RECTANGLE, {
      x: 0, y: 7.2, w: 13.3, h: 0.08,
      fill: { color: "FFFFFF", transparency: 40 },
    });

    // Main title
    s.addText("轻量化任务管理系统", {
      x: 1.5, y: 1.6, w: 10.3, h: 1.4,
      fontSize: 52, fontFace: "Arial", color: "FFFFFF", bold: true,
      align: "center",
    });

    // Subtitle
    s.addText("Web 程序设计课程 — 面向 AI 编程期末答辩", {
      x: 2.0, y: 3.1, w: 9.3, h: 0.6,
      fontSize: 20, fontFace: "Arial", color: "DBEAFE", align: "center",
    });

    // Divider line
    s.addShape(pres.shapes.RECTANGLE, {
      x: 5.0, y: 3.9, w: 3.3, h: 0.015,
      fill: { color: "93C5FD" },
    });

    // Tech tags
    const tags = [
      { t: "React 18", c: "60A5FA" },
      { t: "Express 5", c: "34D399" },
      { t: "MySQL 8", c: "FBBF24" },
      { t: "Docker", c: "60A5FA" },
      { t: "Python", c: "A78BFA" },
    ];
    const tagW = 1.6, tagH = 0.45, gap = 0.22;
    const totalW = tags.length * tagW + (tags.length - 1) * gap;
    const startX = (13.3 - totalW) / 2;
    tags.forEach(({ t, c }, i) => {
      const tx = startX + i * (tagW + gap);
      s.addShape(pres.shapes.RECTANGLE, {
        x: tx, y: 4.2, w: tagW, h: tagH,
        fill: { color: "FFFFFF", transparency: 88 },
      });
      s.addText(t, {
        x: tx, y: 4.2, w: tagW, h: tagH,
        fontSize: 12, fontFace: "Arial", color: c, align: "center", valign: "middle",
      });
    });

    // Bottom info
    s.addText("部署地址：qlhrwglxt.top  |  服务器：118.31.4.12", {
      x: 2.5, y: 5.8, w: 8.3, h: 0.4,
      fontSize: 12, fontFace: "Arial", color: "93C5FD", align: "center",
    });
    s.addText("v2.0  ·  2026-06-03", {
      x: 5.0, y: 6.3, w: 3.3, h: 0.35,
      fontSize: 11, fontFace: "Arial", color: "60A5FA", align: "center",
    });
  }

  // ═══════════════════════════════════════════════════
  // SLIDE 2 — 目录
  // ═══════════════════════════════════════════════════
  {
    const s = pres.addSlide();
    bg(s);
    topBar(s);
    s.addText("答辩提纲", {
      x: 0.8, y: 0.4, w: 5, h: 0.7,
      fontSize: 32, fontFace: "Arial", color: C.title, bold: true,
    });

    const chapters = [
      { num: "01", title: "项目创意与亮点", desc: "设计初衷 · 创新思路 · 核心亮点", color: C.primary },
      { num: "02", title: "项目功能与特色", desc: "功能模块 · 系统架构 · 技术特点", color: C.accent },
      { num: "03", title: "开发难点与解决方案", desc: "三大技术难点的诊断与攻克", color: C.warm },
      { num: "04", title: "AI 开发学习心得", desc: "收获感悟 · 不足反思 · 改进方向", color: C.purple },
    ];

    chapters.forEach((ch, i) => {
      const y = 1.8 + i * 1.3;
      // Number
      s.addText(ch.num, {
        x: 1.2, y, w: 1.2, h: 0.8,
        fontSize: 42, fontFace: "Arial", color: ch.color, bold: true, valign: "middle",
      });
      // Vertical line
      s.addShape(pres.shapes.RECTANGLE, {
        x: 2.6, y: y + 0.1, w: 0.04, h: 0.65,
        fill: { color: ch.color, transparency: 50 },
      });
      // Title
      s.addText(ch.title, {
        x: 3.0, y: y + 0.05, w: 6.0, h: 0.45,
        fontSize: 24, fontFace: "Arial", color: C.title, bold: true,
      });
      // Description
      s.addText(ch.desc, {
        x: 3.0, y: y + 0.55, w: 6.0, h: 0.3,
        fontSize: 13, fontFace: "Arial", color: C.muted,
      });
      // Divider
      if (i < 3) {
        s.addShape(pres.shapes.RECTANGLE, {
          x: 3.0, y: y + 1.05, w: 8.0, h: 0.008,
          fill: { color: C.border },
        });
      }
    });

    pageNum(s, 2);
  }

  // ═══════════════════════════════════════════════════
  // SLIDE 3 — 设计初衷
  // ═══════════════════════════════════════════════════
  {
    const s = pres.addSlide();
    bg(s);
    sectionTitle(s, "设计初衷", "从真实痛点出发，打造自己每天都想用的效率工具");

    card(s, 0.8, 1.8, 5.5, 4.8, C.warm, "痛点分析", [
      "现有工具（Notion / Todoist）学习成本高，功能繁重",
      "课程表、任务管理、倒计时分散在不同 App 中",
      "频繁切换工具降低效率，无法统一管理",
      "部分国外效率工具国内访问不稳定",
      "没有一个工具能同时整合「任务 + 日程 + 倒数日」",
    ], { bullet: true });

    card(s, 7.0, 1.8, 5.5, 4.8, C.primary, "设计目标", [
      "做一个真正「轻量化」的个人效率管理系统",
      "打开即用，零学习成本，无需阅读文档",
      "React + Express 全栈实战练兵，完整项目闭环",
      "以 AI 辅助编程（Claude Code）驱动全流程开发",
      "从需求分析 → 技术选型 → 编码 → 审查 → 部署上线",
    ], { bullet: true });

    pageNum(s, 3);
  }

  // ═══════════════════════════════════════════════════
  // SLIDE 4 — 核心亮点
  // ═══════════════════════════════════════════════════
  {
    const s = pres.addSlide();
    bg(s);
    sectionTitle(s, "核心亮点", "三大创新方向，定义项目独特性");

    card(s, 0.8, 1.8, 3.7, 5.0, C.purple, "课程表智能解析", [
      "拍照/上传课程表图片",
      "OCR 识别 → 智能提取",
      "课程名 / 时间 / 教室 / 周次",
      "自动生成结构化日程",
      "支持 PNG / JPG / PDF / Word",
      "pdfplumber + pytesseract",
      "双引擎文字提取",
    ], { bullet: true });

    card(s, 4.8, 1.8, 3.7, 5.0, C.accent, "文件解析服务化", [
      "Python 解析引擎统一封装",
      "AI调用接口（MCP协议）",
      "  → AI编程助手直接调用",
      "网页接口（HTTP API）",
      "  → 前端 ImportModal 调用",
      "一次开发，两种场景覆盖",
    ], { bullet: true });

    card(s, 8.8, 1.8, 3.7, 5.0, C.primary, "工程化全栈实践", [
      "Docker Compose 一键部署",
      "自动安全证书（Let's Encrypt）",
      "JWT 认证 + 角色权限控制",
      "轻量级页面数据共享（Zustand）",
      "请求转发服务（Nginx） + 域名配置",
      "代码审查 13 项问题清零",
      "安全加固，零硬编码密钥",
    ], { bullet: true });

    pageNum(s, 4);
  }

  // ═══════════════════════════════════════════════════
  // SLIDE 5 — 功能模块总览
  // ═══════════════════════════════════════════════════
  {
    const s = pres.addSlide();
    bg(s);
    sectionTitle(s, "功能模块总览", "四大核心模块，覆盖日常效率管理的完整需求");

    const modules = [
      { x: 0.8, color: C.primary, title: "任务管理", items: [
        "完整 CRUD + 批量操作", "状态流转（待处理 → 进行中 → 已完成）",
        "三级优先级 + 自定义分类标签", "多条件筛选 + 防抖搜索",
        "看板拖拽视图 (Kanban)", "子任务嵌套系统",
      ]},
      { x: 3.9, color: C.accent, title: "日程规划", items: [
        "月视图 / 周视图日历切换", "日程创建、编辑、拖拽调整",
        "课程表智能导入解析", "多格式文件批量导入",
        "课程结构自动转日程", "即将到期提醒通知",
      ]},
      { x: 7.0, color: C.warm, title: "倒数日", items: [
        "自定义事件名称和日期", "倒计时 / 正计时自动切换",
        "环形进度条可视化展示", "列表 / 卡片双视图模式",
        "到期提醒通知推送", "剩余天数实时更新",
      ]},
      { x: 10.1, color: C.purple, title: "系统功能", items: [
        "JWT 登录 / 注册 / 游客模式", "admin / user 角色权限",
        "回收站软删除可恢复", "任务评论 + 嵌套回复",
        "文件导入 / 导出", "亮色/暗色主题切换",
      ]},
    ];

    modules.forEach(({ x, color, title, items }) => {
      // Card
      s.addShape(pres.shapes.RECTANGLE, {
        x, y: 1.8, w: 2.7, h: 5.0,
        fill: { color: C.white },
        shadow: { type: "outer", blur: 5, offset: 2, angle: 90, color: "000000", opacity: 0.05 },
        });
      // Top colored bar
      s.addShape(pres.shapes.RECTANGLE, {
        x: x + 0.25, y: 1.8, w: 2.2, h: 0.045,
        fill: { color, transparency: 40 },
      });
      // Title
      s.addText(title, {
        x, y: 2.0, w: 2.7, h: 0.5,
        fontSize: 16, fontFace: "Arial", color, bold: true, align: "center",
      });
      // Items
      s.addText(items.map((t, i) => ({
        text: t,
        options: { breakLine: i < items.length - 1, bullet: true, color: C.body, fontSize: 10, fontFace: "Arial", paraSpaceAfter: 4 },
      })), {
        x: x + 0.2, y: 2.65, w: 2.3, h: 3.8, valign: "top",
      });
    });

    pageNum(s, 5);
  }

  // ═══════════════════════════════════════════════════
  // SLIDE 6 — 核心功能深解：任务管理 + 看板
  // ═══════════════════════════════════════════════════
  {
    const s = pres.addSlide();
    bg(s);
    sectionTitle(s, "核心功能：任务管理与看板", "CRUD + 状态流转 + 多维度筛选 + 看板拖拽");

    // Left: Task list features
    card(s, 0.8, 1.7, 5.8, 2.3, C.primary, "列表视图功能", [
      "多条件筛选：状态 / 优先级 / 分类 / 关键词 / 负责人 / 日期范围",
      "服务端分页 + 可排序列，搜索 300ms 防抖",
      "批量选择 + 批量删除/更新，单次 HTTP 请求完成",
      "快速创建：行内表单直接添加，无需弹窗",
    ], { bullet: true });

    // Right: Kanban features
    card(s, 7.0, 1.7, 5.5, 2.3, C.accent, "看板视图功能", [
      "三列状态列：待处理 / 进行中 / 已完成",
      "拖拽卡片改变任务状态和排序",
      "同一任务数据，列表和看板双视图切换",
      "拖拽后自动保存，无需手动提交",
    ], { bullet: true });

    // Bottom: Sub-tasks
    card(s, 0.8, 4.3, 5.8, 2.3, C.warm, "子任务系统", [
      "支持嵌套子任务层级，批量创建子任务",
      "子任务支持独立的优先级和截止日期",
      "可通过操作升级为独立任务 或 降级为子任务",
      "子任务排序调整，灵活组织任务结构",
    ], { bullet: true });

    // Bottom right: Import/Export
    card(s, 7.0, 4.3, 5.5, 2.3, C.purple, "数据导入导出", [
      "导入：支持 CSV / Excel / JSON 格式",
      "智能列映射（自动识别字段对应关系）",
      "导出：JSON / CSV，含 文件安全导出（CSV注入防护）",
      "批量迁移数据，降低工具切换成本",
    ], { bullet: true });

    pageNum(s, 6);
  }

  // ═══════════════════════════════════════════════════
  // SLIDE 7 — 日程 + 倒数日 + 仪表盘
  // ═══════════════════════════════════════════════════
  {
    const s = pres.addSlide();
    bg(s);
    sectionTitle(s, "日程规划 · 倒数日 · 仪表盘", "时间管理 + 可视化统计，全面掌控效率数据");

    card(s, 0.8, 1.7, 5.8, 2.2, C.accent, "日程规划日历", [
      "月视图 / 周视图自由切换，直观查看时间分布",
      "点击日期创建日程，拖拽调整时间范围",
      "课程表导入后自动生成对应日程条目",
      "即将到期日程提前通知提醒",
    ], { bullet: true });

    card(s, 7.0, 1.7, 5.5, 2.2, C.warm, "倒数日组件", [
      "自定义事件：考试倒计时 / 项目截止日 / 纪念日",
      "自动切换倒计时（未来事件）与正计时（已过事件）",
      "环形进度条 + 天数可视化，一目了然",
      "支持列表视图和卡片视图双模式展示",
    ], { bullet: true });

    card(s, 0.8, 4.20, 11.7, 2.5, C.primary, "仪表盘数据看板", [
      "任务总览统计：总数 / 各状态数量 / 各优先级分布 / 分类分布 / 逾期数量",
      "完成任务趋势图：最近 N 天（默认 14 天）的完成量变化趋势，Recharts 图表渲染",
      "四大统计维度同时呈现：状态饼图 + 优先级柱状图 + 分类分布 + 趋势折线，一屏掌握全局",
    ], { bullet: true });

    pageNum(s, 7);
  }

  // ═══════════════════════════════════════════════════
  // SLIDE 8 — 系统架构图
  // ═══════════════════════════════════════════════════
  {
    const s = pres.addSlide();
    bg(s);
    sectionTitle(s, "系统架构", "三层架构 + Python 解析服务，前后端分离，职责清晰");

    // Draw architecture diagram
    const layers = [
      { y: 1.9, label: "请求转发服务（Nginx）", sub: "静态资源转发 · API 代理 · Gzip 压缩 · 域名配置", color: C.primary },
      { y: 2.95, label: "React 18 前端层", sub: "Ant Design 5 · Zustand · React Router 7 · Recharts · Tesseract.js", color: C.primaryDark },
      { y: 4.0, label: "Express 5 后端层", sub: "Controller → Service → Model 三层解耦 · JWT 认证 · 参数校验 · 速率限制", color: C.accent },
      { y: 5.05, label: "MySQL 8 数据层", sub: "用户 / 任务 / 日程 / 分类 / 评论 / 通知 / 倒数日 · 共 9 张业务表", color: C.warm },
      { y: 6.1, label: "Python 解析服务", sub: "AI调用接口（MCP）+ 网页接口（HTTP） · pdfplumber · pytesseract · python-docx", color: C.purple },
    ];

    layers.forEach(({ y, label, sub, color }) => {
      // Box
      s.addShape(pres.shapes.RECTANGLE, {
        x: 1.0, y, w: 11.3, h: 0.85,
        fill: { color: C.white },
        shadow: { type: "outer", blur: 4, offset: 2, angle: 90, color: "000000", opacity: 0.05 },
        });
      // Left color strip
      s.addShape(pres.shapes.RECTANGLE, {
        x: 1.0, y, w: 0.06, h: 0.85,
        fill: { color },
      });
      // Label
      s.addText(label, {
        x: 1.4, y: y + 0.05, w: 4.0, h: 0.4,
        fontSize: 16, fontFace: "Arial", color, bold: true, valign: "middle",
      });
      // Description
      s.addText(sub, {
        x: 5.5, y: y + 0.05, w: 6.3, h: 0.75,
        fontSize: 11, fontFace: "Arial", color: C.muted, valign: "middle",
      });

      // Down arrow (except last)
      if (y < 6.0) {
        s.addText("▼", {
          x: 6.2, y: y + 0.82, w: 0.8, h: 0.3,
          fontSize: 14, fontFace: "Arial", color: C.divider, align: "center",
        });
      }
    });

    // Side annotations
    card(s, 0.8, 1.9, 0.0, 0.0, C.primary, "", [], {}); // placeholder
    s.addText("客户端", {
      x: 0.2, y: 1.95, w: 0.7, h: 0.8,
      fontSize: 10, fontFace: "Arial", color: C.primary, bold: true, align: "center", valign: "middle",
    });
    s.addText("服务端", {
      x: 0.2, y: 4.0, w: 0.7, h: 1.0,
      fontSize: 10, fontFace: "Arial", color: C.accent, bold: true, align: "center", valign: "middle",
    });
    s.addText("外部服务", {
      x: 0.2, y: 6.1, w: 0.7, h: 0.85,
      fontSize: 10, fontFace: "Arial", color: C.purple, bold: true, align: "center", valign: "middle",
    });

    pageNum(s, 8);
  }

  // ═══════════════════════════════════════════════════
  // SLIDE 9 — 技术特色
  // ═══════════════════════════════════════════════════
  {
    const s = pres.addSlide();
    bg(s);
    sectionTitle(s, "技术特色", "安全 · 性能 · 架构 · 体验，全方位工程化实践");

    card(s, 0.8, 1.7, 5.8, 2.35, C.primary, "认证与安全", [
      "登录令牌机制（JWT）：7天有效期 + 登出自动失效",
      "密码加密保护（bcrypt），启动时强制检查 JWT_SECRET",
      "安全防护配置（helmet） + 请求频率限制（rate-limit）（登录10次/分，注册5次/分）",
      "游客登录模式：关闭页面自动清理用户数据，零残留",
    ], { bullet: true });

    card(s, 7.0, 1.7, 5.5, 2.35, C.accent, "状态管理优化", [
      "全项目统一 Zustand 方案（移除冗余的 Jotai）",
      "authStore + taskStore 精准订阅，避免不必要重渲染",
      "修复异步闭包 Bug：修复：fetchTasks直接传参，不依赖过时变量",
      "HTTP 缓存策略：任务30s / 统计30s / 分类5min / 用户5min",
    ], { bullet: true });

    card(s, 0.8, 4.3, 5.8, 2.35, C.warm, "API 性能优化", [
      "批量 API：批量删除/更新，单次 HTTP 请求完成",
      "服务端分页：total / page / pageSize，减少数据传输量",
      "部分操作失败时返回详细错误明细（而非全盘回滚）",
      "validator 中间件统一输入校验，减少无效请求",
    ], { bullet: true });

    card(s, 7.0, 4.3, 5.5, 2.35, C.purple, "部署与运维", [
      "Docker Compose 四服务编排：nginx + frontend + backend + db",
      "自动安全证书（Let's Encrypt），全站加密连接",
      "域名 qlhrwglxt.top + 请求转发服务（Nginx） + 客户端上传限制 50m",
      "自动化部署流程（CI/CD）：代码检查 + 构建验证 + 自动测试",
    ], { bullet: true });

    pageNum(s, 9);
  }

  // ═══════════════════════════════════════════════════
  // SLIDE 10 — 难点一：状态管理混乱
  // ═══════════════════════════════════════════════════
  {
    const s = pres.addSlide();
    bg(s);
    sectionTitle(s, "难点一：状态管理混乱", "双状态库共存导致数据不同步 → 统一迁移方案 + 修复异步时序 Bug");

    // Problem
    s.addShape(pres.shapes.RECTANGLE, {
      x: 0.8, y: 1.7, w: 5.5, h: 3.2,
      fill: { color: C.redLight },
    });
    s.addText("问题诊断", {
      x: 1.1, y: 1.85, w: 5.0, h: 0.35,
      fontSize: 16, fontFace: "Arial", color: C.red, bold: true,
    });
    s.addText([
      { text: "Jotai + Zustand 两套状态库并存", options: { breakLine: true, bullet: true, fontSize: 12, fontFace: "Arial", color: C.body, paraSpaceAfter: 6 } },
      { text: "登录状态用 Jotai（useSetAtom），任务用 Zustand", options: { breakLine: true, bullet: true, fontSize: 12, fontFace: "Arial", color: C.body, paraSpaceAfter: 6 } },
      { text: "页面切换时 token 状态不同步 → 偶发 401 未授权", options: { breakLine: true, bullet: true, fontSize: 12, fontFace: "Arial", color: C.body, paraSpaceAfter: 6 } },
      { text: "handleFilterChange 调用 setFilters 后，fetchTasks 仍读到过时的变量值（闭包） → 筛选结果与筛选项不匹配", options: { breakLine: true, bullet: true, fontSize: 11, fontFace: "Arial", color: C.red, paraSpaceAfter: 6, bold: true } },
      { text: "影响范围：登录流程、任务筛选、页面状态同步", options: { breakLine: true, fontSize: 11, fontFace: "Arial", color: C.red, italic: true } },
    ], { x: 1.1, y: 2.35, w: 4.9, h: 2.3, valign: "top" });

    // Arrow
    s.addText("→", {
      x: 6.1, y: 2.8, w: 1.0, h: 0.8,
      fontSize: 40, fontFace: "Arial", color: C.green, bold: true, align: "center", valign: "middle",
    });

    // Solution
    s.addShape(pres.shapes.RECTANGLE, {
      x: 7.0, y: 1.7, w: 5.5, h: 3.2,
      fill: { color: C.greenLight },
    });
    s.addText("解决方案", {
      x: 7.3, y: 1.85, w: 5.0, h: 0.35,
      fontSize: 16, fontFace: "Arial", color: C.green, bold: true,
    });
    s.addText([
      { text: "全局搜索 useSetAtom / useAtomValue", options: { breakLine: true, bullet: true, fontSize: 12, fontFace: "Arial", color: C.body, paraSpaceAfter: 4 } },
      { text: "逐一迁移到 useAuthStore（Zustand）", options: { breakLine: true, bullet: true, fontSize: 12, fontFace: "Arial", color: C.body, paraSpaceAfter: 4 } },
      { text: "删除 package.json 中 jotai 依赖项", options: { breakLine: true, bullet: true, fontSize: 12, fontFace: "Arial", color: C.body, paraSpaceAfter: 4 } },
      { text: "清理 authStore.js 兼容导出层", options: { breakLine: true, bullet: true, fontSize: 12, fontFace: "Arial", color: C.body, paraSpaceAfter: 4 } },
      { text: "fetchTasks(newFilters) 改为直接传参", options: { breakLine: true, bullet: true, fontSize: 12, fontFace: "Arial", color: C.green, bold: true, paraSpaceAfter: 4 } },
      { text: "全局搜索确认 0 处 Jotai 残留引用", options: { breakLine: true, bullet: true, fontSize: 12, fontFace: "Arial", color: C.green, bold: true } },
    ], { x: 7.3, y: 2.35, w: 4.9, h: 2.3, valign: "top" });

    // Key takeaway
    card(s, 0.8, 5.2, 11.7, 1.3, C.primary, "关键收获", [
      "状态管理库必须统一，多库并存是项目初期最大的技术债  |  异步操作中的变量作用域问题（闭包）是 Zustand/React 常见坑点：永远用显式参数而非闭包中的 state",
    ], { bullet: true });

    pageNum(s, 10);
  }

  // ═══════════════════════════════════════════════════
  // SLIDE 11 — 难点二：课程表智能解析
  // ═══════════════════════════════════════════════════
  {
    const s = pres.addSlide();
    bg(s);
    sectionTitle(s, "难点二：课程表智能解析", "图片/文件 → OCR 文字提取 → 结构化日程，完整处理链路");

    // Flow chart
    const steps = [
      { x: 0.8, w: 2.2, h: 2.8, color: C.primary, num: "1", title: "文件上传", lines: [
        "PNG / JPG 截图",
        "PDF 课程表文档",
        "Word 文档 (.docx)",
        "拍照上传",
      ]},
      { x: 3.3, w: 2.2, h: 2.8, color: C.accent, num: "2", title: "文字提取", lines: [
        "pdfplumber 提取文字层",
        "扫描件降级为 pytesseract",
        "Pillow 图像预处理",
        "逐页处理多页文档",
      ]},
      { x: 5.8, w: 2.2, h: 2.8, color: C.warm, num: "3", title: "智能解析", lines: [
        "正则 + 坐标规则匹配",
        "课程名称识别",
        "时间/教室/周次/教师",
        "结构化 JSON 输出",
      ]},
      { x: 8.3, w: 2.2, h: 2.8, color: C.purple, num: "4", title: "服务化接入", lines: [
        "MCP Server (stdio)",
        "HTTP API (REST)",
        "前端 ImportModal",
        "批量导入日程",
      ]},
    ];

    steps.forEach(({ x, w, h, color, num, title, lines }) => {
      s.addShape(pres.shapes.RECTANGLE, {
        x, y: 1.8, w, h,
        fill: { color: C.white },
        shadow: { type: "outer", blur: 5, offset: 2, angle: 90, color: "000000", opacity: 0.06 },
        });
      // Top bar
      s.addShape(pres.shapes.RECTANGLE, {
        x: x + 0.2, y: 1.8, w: w - 0.4, h: 0.04,
        fill: { color },
      });
      // Number
      numCircle(s, x + 0.85, 2.0, num, color);
      // Title
      s.addText(title, {
        x, y: 2.7, w, h: 0.4,
        fontSize: 15, fontFace: "Arial", color: C.title, bold: true, align: "center",
      });
      // Lines
      s.addText(lines.map((t, i) => ({
        text: t,
        options: { breakLine: i < lines.length - 1, bullet: true, color: C.muted, fontSize: 11, fontFace: "Arial", paraSpaceAfter: 3 },
      })), {
        x: x + 0.2, y: 3.2, w: w - 0.4, h: 1.2, valign: "top",
      });
      // Arrow
      if (x < 8.0) {
        s.addText("▶", {
          x: x + w + 0.05, y: 2.85, w: 0.25, h: 0.4,
          fontSize: 16, fontFace: "Arial", color: C.divider, align: "center", valign: "middle",
        });
      }
    });

    // Bottom details
    card(s, 0.8, 4.9, 11.7, 1.8, C.purple, "技术关键点", [
      "双引擎降级策略：先尝试 pdfplumber 提取文字层 PDF，失败则降级为 pytesseract OCR 识别扫描件图片",
      "MCP Server 供 Claude Code 编程助手直接调用；HTTP API 供前端 ImportModal 通过后端代理调用",
      "坐标定位 + 正则命名组提取 + 课程合并规则：一套规则引擎完成从非结构化文本到结构化 JSON 的全流程",
    ], { bullet: true });

    pageNum(s, 11);
  }

  // ═══════════════════════════════════════════════════
  // SLIDE 12 — 难点三：巨型组件重构
  // ═══════════════════════════════════════════════════
  {
    const s = pres.addSlide();
    bg(s);
    sectionTitle(s, "难点三：巨型组件重构", "818 行单文件 God Component → 3 个职责清晰的独立组件");

    // Before box
    s.addShape(pres.shapes.RECTANGLE, {
      x: 0.8, y: 1.8, w: 4.5, h: 4.8,
      fill: { color: C.redLight },
    });
    s.addShape(pres.shapes.RECTANGLE, {
      x: 1.2, y: 1.95, w: 3.7, h: 0.04,
      fill: { color: C.red, transparency: 50 },
    });
    s.addText("重构前", {
      x: 1.2, y: 2.15, w: 3.7, h: 0.35,
      fontSize: 17, fontFace: "Arial", color: C.red, bold: true, align: "center",
    });
    s.addText("TaskList.jsx", {
      x: 1.2, y: 2.6, w: 3.7, h: 0.4,
      fontSize: 20, fontFace: "Arial", color: C.title, bold: true, align: "center",
    });
    s.addText("818 行", {
      x: 1.2, y: 3.0, w: 3.7, h: 0.6,
      fontSize: 44, fontFace: "Arial", color: C.red, bold: true, align: "center",
    });
    s.addText([
      { text: "一个文件包含：", options: { breakLine: true, fontSize: 13, fontFace: "Arial", color: C.muted, align: "center", paraSpaceAfter: 6 } },
      { text: "筛选栏 + 快速添加表单", options: { breakLine: true, bullet: true, fontSize: 12, fontFace: "Arial", color: C.body, paraSpaceAfter: 3 } },
      { text: "任务数据表格 + 行操作", options: { breakLine: true, bullet: true, fontSize: 12, fontFace: "Arial", color: C.body, paraSpaceAfter: 3 } },
      { text: "详情抽屉 + 编辑面板", options: { breakLine: true, bullet: true, fontSize: 12, fontFace: "Arial", color: C.body, paraSpaceAfter: 3 } },
      { text: "全部 API 调用 + 状态管理 + 逻辑", options: { breakLine: true, bullet: true, fontSize: 12, fontFace: "Arial", color: C.body, paraSpaceAfter: 6 } },
      { text: "", options: { breakLine: true, fontSize: 6 } },
      { text: "改一处，牵全身", options: { fontSize: 14, fontFace: "Arial", color: C.red, italic: true, align: "center" } },
    ], { x: 1.2, y: 3.75, w: 3.7, h: 2.5, valign: "top" });

    // Arrow
    s.addText("→", {
      x: 5.0, y: 3.8, w: 1.5, h: 0.8,
      fontSize: 48, fontFace: "Arial", color: C.green, bold: true, align: "center", valign: "middle",
    });

    // After
    const newComps = [
      { y: 1.8, file: "FilterBar.jsx", lines: "180 行", desc: "搜索框 + 筛选条件组 + 快速添加表单" },
      { y: 3.1, file: "TaskTable.jsx", lines: "240 行", desc: "任务数据表格 + 行内操作 + 批量选择 + 排序" },
      { y: 4.4, file: "TaskList.jsx", lines: "355 行", desc: "容器组件：编排子组件 + API 调用 + 状态管理" },
    ];
    newComps.forEach(({ y, file, lines, desc }) => {
      s.addShape(pres.shapes.RECTANGLE, {
        x: 6.8, y, w: 5.7, h: 1.05,
        fill: { color: C.greenLight },
      });
      s.addShape(pres.shapes.RECTANGLE, {
        x: 6.8, y, w: 0.05, h: 1.05,
        fill: { color: C.green },
      });
      s.addText(file, {
        x: 7.1, y: y + 0.08, w: 2.8, h: 0.35,
        fontSize: 15, fontFace: "Arial", color: C.green, bold: true,
      });
      s.addText(lines, {
        x: 10.0, y: y + 0.08, w: 2.0, h: 0.35,
        fontSize: 15, fontFace: "Arial", color: C.title, bold: true, valign: "middle",
      });
      s.addText(desc, {
        x: 7.1, y: y + 0.55, w: 5.0, h: 0.35,
        fontSize: 11, fontFace: "Arial", color: C.muted,
      });
    });

    // Bottom principle
    card(s, 0.8, 5.8, 11.7, 0.85, C.primary, "重构原则", [
      "每个文件 ≤ 250 行  |  Props 接口清晰  |  职责单一：一个组件只做一件事  |  行为与拆分前完全一致",
    ], { bullet: false });

    pageNum(s, 12);
  }

  // ═══════════════════════════════════════════════════
  // SLIDE 13 — AI 开发心得（上）
  // ═══════════════════════════════════════════════════
  {
    const s = pres.addSlide();
    bg(s);
    sectionTitle(s, "AI 项目开发学习心得", "全流程 AI 辅助编程的收获与实操感悟");

    card(s, 0.8, 1.7, 5.8, 2.5, C.primary, "全栈闭环能力", [
      "完整经历：需求分析 → 技术选型 → 编码实现 → 代码审查 → 优化重构 → 部署上线",
      "每个环节都有实际交付产出，不再是「写 Demo」而是「做产品」",
      "前后端全链路打通，不再有盲区：从 React 界面到 MySQL 数据库再到 Docker 部署",
    ], { bullet: true });

    card(s, 7.0, 1.7, 5.5, 2.5, C.accent, "AI 辅助编程实战", [
      "以 Claude Code 作为主驱动，完成代码生成、审查、重构、文档撰写",
      "AI 不是替代思考，而是加速执行：关键决策需要人来判断，重复劳动交给 AI",
      "清晰的需求描述和上下文是 AI 辅助编程的核心竞争力：「说清楚需求」本身就是一种能力",
    ], { bullet: true });

    card(s, 0.8, 4.5, 5.8, 2.5, C.warm, "工程化思维培养", [
      "代码审查发现 13 项问题（状态管理、组件拆分、批量 API、安全加固）并逐项清零",
      "从「能跑就行」到「规范化开发」：统一代码风格、组件结构、错误处理模式",
      "规范不是束缚，是效率的保障：良好架构让后续功能开发效率翻倍",
    ], { bullet: true });

    card(s, 7.0, 4.5, 5.5, 2.5, C.purple, "MCP 协议（AI调用标准）实战", [
      "开发 Python MCP Server 扩展 AI 能力边界：Claude Code 可调用本地的 OCR 和文件解析",
      "MCP 让 AI 不再局限于纯文本，能处理图片、PDF、Word 等二进制内容",
      "一次开发，双重用途：MCP 供 AI 调用 + HTTP API 供前端调用",
    ], { bullet: true });

    pageNum(s, 13);
  }

  // ═══════════════════════════════════════════════════
  // SLIDE 14 — AI 开发心得（下）：技术栈广度
  // ═══════════════════════════════════════════════════
  {
    const s = pres.addSlide();
    bg(s);
    sectionTitle(s, "技术栈广度与工具链", "从零到一掌握现代 Web 全栈开发技术体系");

    // Tech stack tree
    const areas = [
      { x: 0.8, label: "前端", color: C.primary, techs: ["React 18", "Vite 5", "Ant Design 5", "Zustand", "React Router 7", "Recharts", "Tesseract.js", "pdfjs-dist"] },
      { x: 4.3, label: "后端", color: C.accent, techs: ["Express 5", "JWT + bcrypt", "mysql2", "helmet", "rate-limit", "morgan", "swagger-jsdoc"] },
      { x: 7.8, label: "运维", color: C.warm, techs: ["Docker Compose", "Nginx", "Let's Encrypt", "GitHub Actions", "域名 + DNS", "Linux 服务器"] },
      { x: 11.3, label: "Python", color: C.purple, techs: ["pdfplumber", "pytesseract", "python-docx", "Pillow", "MCP SDK", "Flask (HTTP API)"] },
    ];

    areas.forEach(({ x, label, color, techs }) => {
      s.addShape(pres.shapes.RECTANGLE, {
        x, y: 1.8, w: 2.9, h: 4.0,
        fill: { color: C.white },
        shadow: { type: "outer", blur: 5, offset: 2, angle: 90, color: "000000", opacity: 0.05 },
        });
      s.addShape(pres.shapes.RECTANGLE, {
        x, y: 1.8, w: 2.9, h: 0.05,
        fill: { color },
      });
      s.addText(label, {
        x, y: 2.0, w: 2.7, h: 0.5,
        fontSize: 18, fontFace: "Arial", color, bold: true, align: "center",
      });
      s.addText(techs.map((t, i) => ({
        text: t,
        options: { breakLine: i < techs.length - 1, bullet: true, color: C.body, fontSize: 11, fontFace: "Arial", paraSpaceAfter: 6 },
      })), {
        x: x + 0.3, y: 2.7, w: 2.3, h: 2.8, valign: "top",
      });
    });

    // Bottom note
    s.addText("共计 24 个核心依赖 / 库 / 工具，覆盖前端、后端、运维、数据处理四大领域", {
      x: 0.8, y: 6.1, w: 11.7, h: 0.4,
      fontSize: 13, fontFace: "Arial", color: C.muted, align: "center",
    });

    pageNum(s, 14);
  }

  // ═══════════════════════════════════════════════════
  // SLIDE 15 — 不足与改进
  // ═══════════════════════════════════════════════════
  {
    const s = pres.addSlide();
    bg(s);
    sectionTitle(s, "不足与改进方向", "持续迭代，不断优化");

    // Shortcomings
    s.addShape(pres.shapes.RECTANGLE, {
      x: 0.8, y: 1.8, w: 5.5, h: 4.0,
      fill: { color: C.white },
      shadow: { type: "outer", blur: 5, offset: 2, angle: 90, color: "000000", opacity: 0.05 },
    });
    s.addShape(pres.shapes.RECTANGLE, {
      x: 0.8, y: 1.8, w: 5.5, h: 0.05,
      fill: { color: C.warm },
    });
    s.addText("当前不足", {
      x: 1.1, y: 2.0, w: 5.0, h: 0.4,
      fontSize: 18, fontFace: "Arial", color: C.warm, bold: true,
    });
    s.addText([
      { text: "移动端适配尚不完善，小屏幕体验一般", options: { breakLine: true, bullet: true, fontSize: 13, fontFace: "Arial", color: C.body, paraSpaceAfter: 8 } },
      { text: "单元测试 & E2E 测试覆盖不足", options: { breakLine: true, bullet: true, fontSize: 13, fontFace: "Arial", color: C.body, paraSpaceAfter: 8 } },
      { text: "缺少 CI/CD 自动化部署流水线（现为手动部署）", options: { breakLine: true, bullet: true, fontSize: 13, fontFace: "Arial", color: C.body, paraSpaceAfter: 8 } },
      { text: "通知仅支持站内，无实时推送（WebSocket）", options: { breakLine: true, bullet: true, fontSize: 13, fontFace: "Arial", color: C.body, paraSpaceAfter: 8 } },
      { text: "课程表解析对非标准格式（手写/复杂排版）识别率低", options: { breakLine: true, bullet: true, fontSize: 13, fontFace: "Arial", color: C.body, paraSpaceAfter: 8 } },
      { text: "部分异常处理不够健壮，需增强边界情况覆盖", options: { breakLine: true, bullet: true, fontSize: 13, fontFace: "Arial", color: C.body } },
    ], { x: 1.1, y: 2.55, w: 4.9, h: 3.0, valign: "top" });

    // Planned improvements
    s.addShape(pres.shapes.RECTANGLE, {
      x: 7.0, y: 1.8, w: 5.5, h: 4.0,
      fill: { color: C.primaryLight },
    });
    s.addShape(pres.shapes.RECTANGLE, {
      x: 7.0, y: 1.8, w: 5.5, h: 0.05,
      fill: { color: C.primary },
    });
    s.addText("后续改进计划", {
      x: 7.3, y: 2.0, w: 5.0, h: 0.4,
      fontSize: 18, fontFace: "Arial", color: C.primary, bold: true,
    });
    s.addText([
      { text: "手机网页应用（PWA），支持离线使用", options: { breakLine: true, bullet: true, fontSize: 13, fontFace: "Arial", color: C.title, paraSpaceAfter: 8 } },
      { text: "Vitest + Playwright 构建完整测试体系", options: { breakLine: true, bullet: true, fontSize: 13, fontFace: "Arial", color: C.title, paraSpaceAfter: 8 } },
      { text: "GitHub Actions CI/CD 自动构建 → 推送 → 部署", options: { breakLine: true, bullet: true, fontSize: 13, fontFace: "Arial", color: C.title, paraSpaceAfter: 8 } },
      { text: "WebSocket 实时通知 + 邮件/微信推送提醒", options: { breakLine: true, bullet: true, fontSize: 13, fontFace: "Arial", color: C.title, paraSpaceAfter: 8 } },
      { text: "课程表解析接入 LLM（如 Claude API），提升泛化识别能力", options: { breakLine: true, bullet: true, fontSize: 13, fontFace: "Arial", color: C.title, paraSpaceAfter: 8 } },
      { text: "国际化 i18n 支持英文界面，扩大用户范围", options: { breakLine: true, bullet: true, fontSize: 13, fontFace: "Arial", color: C.title } },
    ], { x: 7.3, y: 2.55, w: 4.9, h: 3.0, valign: "top" });

    // Bottom
    card(s, 0.8, 6.1, 11.7, 0.7, C.primary, "", [
      "从 0 到 1 的学习过程：先让系统能跑起来，再逐步规范化、工程化、安全化。这是一个持续迭代、不断完善的过程。",
    ], {});

    pageNum(s, 15);
  }

  // ═══════════════════════════════════════════════════
  // SLIDE 16 — 致谢
  // ═══════════════════════════════════════════════════
  {
    const s = pres.addSlide();
    s.background = { color: C.primary };

    // Decorative
    s.addShape(pres.shapes.OVAL, {
      x: -1.5, y: 3.5, w: 5, h: 5,
      fill: { color: C.primaryDark, transparency: 50 },
    });
    s.addShape(pres.shapes.OVAL, {
      x: 10.0, y: -1.5, w: 5, h: 5,
      fill: { color: C.primaryDark, transparency: 60 },
    });

    // Thank you
    s.addText("感谢聆听", {
      x: 1.5, y: 1.8, w: 10.3, h: 1.2,
      fontSize: 56, fontFace: "Arial", color: "FFFFFF", bold: true, align: "center",
    });

    s.addText("轻量化任务管理系统", {
      x: 1.5, y: 3.0, w: 10.3, h: 0.7,
      fontSize: 24, fontFace: "Arial", color: "DBEAFE", align: "center",
    });

    // Divider
    s.addShape(pres.shapes.RECTANGLE, {
      x: 5.5, y: 3.9, w: 2.3, h: 0.015,
      fill: { color: "93C5FD" },
    });

    s.addText("部署地址  qlhrwglxt.top  ·  服务器  118.31.4.12", {
      x: 2.5, y: 4.2, w: 8.3, h: 0.45,
      fontSize: 14, fontFace: "Arial", color: "93C5FD", align: "center",
    });

    // Tech stack recap
    const tags = ["React 18", "Express 5", "MySQL 8", "Docker", "Python"];
    const tagW = 1.6, tagH = 0.45, gap = 0.22;
    const totalW = tags.length * tagW + (tags.length - 1) * gap;
    const startX = (13.3 - totalW) / 2;
    tags.forEach((t, i) => {
      const tx = startX + i * (tagW + gap);
      s.addShape(pres.shapes.RECTANGLE, {
        x: tx, y: 4.9, w: tagW, h: tagH,
        fill: { color: "FFFFFF", transparency: 85 },
      });
      s.addText(t, {
        x: tx, y: 4.9, w: tagW, h: tagH,
        fontSize: 12, fontFace: "Arial", color: "DBEAFE", align: "center", valign: "middle",
      });
    });

    // Version
    s.addText("v2.0  ·  2026-06-03  ·  Web 程序设计课程", {
      x: 2.0, y: 6.3, w: 9.3, h: 0.35,
      fontSize: 12, fontFace: "Arial", color: "60A5FA", align: "center",
    });
  }

  // ── Save ──
  const outPath = "C:/Users/chentao/Desktop/轻量化任务管理系统/ppt/轻量化任务管理系统_答辩PPT.pptx";
  await pres.writeFile({ fileName: outPath });
  console.log("PPT generated: " + outPath);
  console.log("Total slides: " + pres.slides.length);
}

main().catch(err => { console.error(err); process.exit(1); });
