const pptxgen = require("pptxgenjs");
const React = require("react");
const ReactDOMServer = require("react-dom/server");
const sharp = require("sharp");

// ── Icon rendering ──
const { FaRocket, FaLightbulb, FaCode, FaBrain, FaCogs, FaTasks, FaCalendarAlt, FaClock, FaShieldAlt, FaLayerGroup, FaBug, FaCheckCircle, FaArrowRight, FaStar, FaGithub } = require("react-icons/fa");

function renderIcon(Icon, color = "#FFFFFF", size = 256) {
  return ReactDOMServer.renderToStaticMarkup(
    React.createElement(Icon, { color, size: String(size) })
  );
}

async function iconToBase64(Icon, color = "#FFFFFF", size = 256) {
  const svg = renderIcon(Icon, color, size);
  const png = await sharp(Buffer.from(svg)).png().toBuffer();
  return "image/png;base64," + png.toString("base64");
}

// ── Build icon cache ──
async function buildIconCache() {
  const icons = {
    rocket: { key: "rocket", color: "00D4FF" },
    lightbulb: { key: "lightbulb", color: "FF8C42" },
    code: { key: "code", color: "00E5A0" },
    brain: { key: "brain", color: "B388FF" },
    cogs: { key: "cogs", color: "FF8C42" },
    tasks: { key: "tasks", color: "00D4FF" },
    calendar: { key: "calendar", color: "00E5A0" },
    clock: { key: "clock", color: "FF8C42" },
    shield: { key: "shield", color: "B388FF" },
    layer: { key: "layer", color: "00D4FF" },
    bug: { key: "bug", color: "FF8C42" },
    check: { key: "check", color: "00E5A0" },
    arrow: { key: "arrow", color: "00D4FF" },
    star: { key: "star", color: "FFD700" },
    github: { key: "github", color: "FFFFFF" },
  };

  const map = {
    rocket: FaRocket, lightbulb: FaLightbulb, code: FaCode,
    brain: FaBrain, cogs: FaCogs, tasks: FaTasks,
    calendar: FaCalendarAlt, clock: FaClock, shield: FaShieldAlt,
    layer: FaLayerGroup, bug: FaBug, check: FaCheckCircle,
    arrow: FaArrowRight, star: FaStar, github: FaGithub,
  };

  const cache = {};
  for (const [name, { color }] of Object.entries(icons)) {
    cache[name] = await iconToBase64(map[name], `#${color}`, 256);
    // White variant
    cache[name + "_white"] = await iconToBase64(map[name], "#FFFFFF", 256);
    // Dark variant
    cache[name + "_dark"] = await iconToBase64(map[name], "#0B0E14", 256);
  }
  return cache;
}

// ── Main ──
async function main() {
  const ICONS = await buildIconCache();

  const pres = new pptxgen();
  pres.layout = "LAYOUT_WIDE"; // 13.3" x 7.5"
  pres.author = "轻量化任务管理系统";
  pres.title = "轻量化任务管理系统 — 课程答辩";

  // ── Colors ──
  const C = {
    bg: "0B0E14",          // deeper dark
    card: "131820",        // slightly lighter card
    cardBorder: "1E2733",  // subtle border
    accent: "00D4FF",      // bright cyan
    white: "FFFFFF",
    gray: "7A828C",
    grayLight: "4A5260",
    green: "00E5A0",
    orange: "FF8C42",
    purple: "B388FF",
    red: "FF5252",
    yellow: "FFD740",
    pink: "FF6E9F",
  };

  // ── Factory functions ──
  const mkShadow = () => ({ type: "outer", color: "000000", blur: 12, offset: 4, angle: 135, opacity: 0.3 });

  function addBg(slide) {
    slide.background = { color: C.bg };
  }

  function addAccentBar(slide, top = 0, h = 0.04) {
    slide.addShape(pres.shapes.RECTANGLE, {
      x: 0, y: top, w: 13.3, h,
      fill: { color: C.accent },
    });
  }

  function addTitle(slide, text, y = 0.5) {
    slide.addText(text, {
      x: 1.0, y, w: 11.3, h: 0.8,
      fontSize: 36, fontFace: "Georgia", color: C.white, bold: true, margin: 0,
    });
  }

  function addSubtitle(slide, text, y = 1.2) {
    slide.addText(text, {
      x: 1.0, y, w: 11.3, h: 0.45,
      fontSize: 15, fontFace: "Calibri", color: C.gray, margin: 0,
    });
  }

  function addPageNum(slide, num) {
    slide.addText(String(num), {
      x: 12.2, y: 7.0, w: 0.8, h: 0.3,
      fontSize: 10, fontFace: "Calibri", color: C.grayLight, align: "right", margin: 0,
    });
  }

  function addCard(slide, x, y, w, h, icon, title, lines, accentColor) {
    // Card bg with subtle border
    slide.addShape(pres.shapes.RECTANGLE, {
      x, y, w, h,
      fill: { color: C.card },
      line: { color: C.cardBorder, width: 0.5 },
      shadow: mkShadow(),
    });
    // Top accent line
    slide.addShape(pres.shapes.RECTANGLE, {
      x: x + 0.3, y: y + 0.02, w: w - 0.6, h: 0.03,
      fill: { color: accentColor, transparency: 60 },
    });
    // Icon (if provided)
    if (icon && ICONS[icon]) {
      slide.addImage({
        data: ICONS[icon],
        x: x + 0.25, y: y + 0.2, w: 0.4, h: 0.4,
      });
    }
    // Title
    const titleX = icon ? x + 0.75 : x + 0.25;
    slide.addText(title, {
      x: titleX, y: y + 0.17, w: w - titleX + x - 0.2, h: 0.45,
      fontSize: 19, fontFace: "Georgia", color: C.white, bold: true, margin: 0,
    });
    // Content
    if (lines && lines.length > 0) {
      const items = lines.map((line, i) => ({
        text: line,
        options: { breakLine: i < lines.length - 1, color: C.gray, fontSize: 13, fontFace: "Calibri", paraSpaceAfter: 4 },
      }));
      slide.addText(items, {
        x: x + 0.25, y: y + 0.7, w: w - 0.5, h: h - 0.85,
        valign: "top", margin: 0,
      });
    }
  }

  function addDecorCircle(slide, x, y, r, color, transparency) {
    slide.addShape(pres.shapes.OVAL, {
      x: x - r, y: y - r, w: r * 2, h: r * 2,
      fill: { color, transparency: transparency || 92 },
    });
  }

  // ═══════════════════════════════════════════
  // SLIDE 1: COVER
  // ═══════════════════════════════════════════
  {
    const slide = pres.addSlide();
    addBg(slide);

    // Decorative circles — dramatic
    addDecorCircle(slide, 11.5, 2.0, 2.5, C.accent, 93);
    addDecorCircle(slide, 10.0, 5.5, 1.8, C.purple, 94);
    addDecorCircle(slide, 2.0, 6.0, 1.5, C.green, 95);
    addDecorCircle(slide, -0.5, -0.5, 2.0, C.orange, 95);

    // Top accent line
    slide.addShape(pres.shapes.RECTANGLE, {
      x: 0, y: 0, w: 13.3, h: 0.05,
      fill: { color: C.accent },
    });

    // Icon
    slide.addImage({
      data: ICONS["rocket"],
      x: 5.9, y: 1.2, w: 1.5, h: 1.5,
    });

    // Main title
    slide.addText("轻量化任务管理系统", {
      x: 1.5, y: 2.9, w: 10.3, h: 1.2,
      fontSize: 56, fontFace: "Georgia", color: C.white, bold: true,
      align: "center", margin: 0,
    });

    // Subtitle
    slide.addText("React + Express + MySQL   全栈项目答辩", {
      x: 1.5, y: 4.1, w: 10.3, h: 0.55,
      fontSize: 22, fontFace: "Calibri", color: C.accent, align: "center", margin: 0,
    });

    // Decorative divider
    slide.addShape(pres.shapes.RECTANGLE, {
      x: 4.5, y: 4.8, w: 4.3, h: 0.015,
      fill: { color: C.grayLight },
    });

    // Tech tags
    const tags = ["React 18", "Express 5", "MySQL 8", "Docker", "Python"];
    const tagW = 1.9, tagH = 0.5, gap = 0.25;
    const totalW = tags.length * tagW + (tags.length - 1) * gap;
    const startX = (13.3 - totalW) / 2;
    tags.forEach((t, i) => {
      const tx = startX + i * (tagW + gap);
      slide.addShape(pres.shapes.RECTANGLE, {
        x: tx, y: 5.1, w: tagW, h: tagH,
        fill: { color: C.card },
        line: { color: C.cardBorder, width: 0.5 },
      });
      slide.addText(t, {
        x: tx, y: 5.1, w: tagW, h: tagH,
        fontSize: 13, fontFace: "Calibri", color: C.accent, align: "center", valign: "middle", margin: 0,
      });
    });

    // Version
    slide.addText("v2.0", {
      x: 5.5, y: 5.9, w: 2.3, h: 0.35,
      fontSize: 12, fontFace: "Calibri", color: C.grayLight, align: "center", margin: 0,
    });

    addPageNum(slide, 1);
  }

  // ═══════════════════════════════════════════
  // SLIDE 2: TOC
  // ═══════════════════════════════════════════
  {
    const slide = pres.addSlide();
    addBg(slide);
    addAccentBar(slide);
    addTitle(slide, "CONTENTS");

    const chapters = [
      { num: "01", title: "项目创意与亮点", sub: "设计初衷 + 核心亮点", icon: "lightbulb", color: C.accent },
      { num: "02", title: "项目功能与特色", sub: "功能模块 + 架构 + 技术特色", icon: "cogs", color: C.green },
      { num: "03", title: "开发难点与解决方案", sub: "3 大技术难点的解决思路", icon: "bug", color: C.orange },
      { num: "04", title: "AI 开发学习心得", sub: "收获 + 不足 + 展望", icon: "brain", color: C.purple },
    ];

    chapters.forEach((ch, i) => {
      const y = 1.6 + i * 1.35;
      // Number
      slide.addText(ch.num, {
        x: 1.2, y, w: 1.0, h: 0.9,
        fontSize: 40, fontFace: "Georgia", color: ch.color, bold: true, valign: "middle", margin: 0,
      });
      // Vertical accent line
      slide.addShape(pres.shapes.RECTANGLE, {
        x: 2.5, y: y + 0.15, w: 0.03, h: 0.65,
        fill: { color: ch.color, transparency: 60 },
      });
      // Icon
      slide.addImage({
        data: ICONS[ch.icon],
        x: 2.8, y: y + 0.1, w: 0.4, h: 0.4,
      });
      // Title
      slide.addText(ch.title, {
        x: 3.4, y: y, w: 5.0, h: 0.5,
        fontSize: 26, fontFace: "Georgia", color: C.white, bold: true, margin: 0,
      });
      // Subtitle
      slide.addText(ch.sub, {
        x: 3.4, y: y + 0.5, w: 5.0, h: 0.35,
        fontSize: 13, fontFace: "Calibri", color: C.gray, margin: 0,
      });
      // Divider
      if (i < 3) {
        slide.addShape(pres.shapes.RECTANGLE, {
          x: 3.4, y: y + 1.1, w: 7.5, h: 0.01,
          fill: { color: C.cardBorder },
        });
      }
    });

    addPageNum(slide, 2);
  }

  // ═══════════════════════════════════════════
  // SLIDE 3: 设计初衷
  // ═══════════════════════════════════════════
  {
    const slide = pres.addSlide();
    addBg(slide);
    addAccentBar(slide);
    addTitle(slide, "设计初衷");
    addSubtitle(slide, "从真实痛点出发，打造自己每天都想用的系统");

    addCard(slide, 1.0, 2.0, 5.3, 4.5, "lightbulb", "  痛点分析", [
      "现有工具 Notion / Todoist 功能过于繁重",
      "上手成本高，学习曲线陡峭",
      "课程表和任务分散在不同 App",
      "频繁切换降低效率",
      "没有工具能同时整合",
      "\"任务 + 课程 + 倒数日\"",
      "部分国外工具国内访问不稳定",
    ], C.orange);

    addCard(slide, 7.0, 2.0, 5.3, 4.5, "rocket", "  设计动机", [
      "做一个真正轻量的个人效率工具",
      "打开即用，零学习成本",
      "React + Express 全栈实战练兵",
      "AI 辅助编程（Claude Code）驱动开发",
      "从需求分析 → 技术选型 → 编码",
      "→ 代码审查 → 优化重构 → 部署上线",
      "完整项目生命周期闭环",
    ], C.accent);

    // Decorative
    addDecorCircle(slide, 13.5, 0, 1.5, C.accent, 95);
    addDecorCircle(slide, -0.5, 7.0, 1.2, C.green, 95);

    addPageNum(slide, 3);
  }

  // ═══════════════════════════════════════════
  // SLIDE 4: 核心亮点
  // ═══════════════════════════════════════════
  {
    const slide = pres.addSlide();
    addBg(slide);
    addAccentBar(slide);
    addTitle(slide, "核心亮点");
    addSubtitle(slide, "三大创新方向，定义项目独特性");

    const cards = [
      { x: 1.0, w: 3.5, icon: "code", title: "  课程表智能解析", lines: [
        "拍照/上传课程表 → OCR 识别文字",
        "智能提取关键字段：",
        "  课程名称 / 上课时间",
        "  教室地点 / 教学周次",
        "自动生成结构化日程数据",
        "支持 PNG / JPG / PDF / Word",
        "pdfplumber + pytesseract 双引擎",
      ], color: C.accent },
      { x: 5.1, w: 3.5, icon: "layer", title: "  文件解析服务", lines: [
        "统一 Python 解析引擎",
        "双协议灵活接入：",
        "  MCP 协议",
        "    Claude Code 编程时直接调用",
        "  HTTP API",
        "    项目后端调用，供前端使用",
        "一次开发，两种场景全覆盖",
      ], color: C.purple },
      { x: 9.2, w: 3.5, icon: "shield", title: "  轻量化全栈", lines: [
        "一行命令部署：",
        "  docker compose up -d",
        "Let's Encrypt 自动 HTTPS",
        "JWT 认证 + 角色权限控制",
        "Zustand 轻量状态管理",
        "代码审查 13 项问题清零",
        "安全加固，无硬编码密钥",
      ], color: C.green },
    ];

    cards.forEach(({ x, w, icon, title, lines, color }) => {
      addCard(slide, x, 2.0, w, 4.8, icon, title, lines, color);
    });

    addPageNum(slide, 4);
  }

  // ═══════════════════════════════════════════
  // SLIDE 5: 功能模块
  // ═══════════════════════════════════════════
  {
    const slide = pres.addSlide();
    addBg(slide);
    addAccentBar(slide);
    addTitle(slide, "功能模块总览");
    addSubtitle(slide, "四大核心模块，覆盖日常效率管理的全部需求");

    const modules = [
      { x: 1.0, icon: "tasks", title: "  任务管理", lines: [
        "CRUD 操作 + 批量处理",
        "状态流转（待处理/进行中/已完成）",
        "优先级 + 自定义分类标签",
        "多条件筛选 + 关键词搜索",
        "仪表盘图表统计概览",
      ], color: C.accent },
      { x: 4.3, icon: "calendar", title: "  日程规划", lines: [
        "日历月视图 / 周视图切换",
        "日程创建、编辑、拖拽调整",
        "课程表智能导入解析",
        "多格式文件批量导入",
        "课程 → 日程自动转换",
      ], color: C.green },
      { x: 7.6, icon: "clock", title: "  倒数日", lines: [
        "自定义事件名称和日期",
        "倒计时 / 正计时自动切换",
        "环形进度条可视化",
        "到期提醒通知",
        "列表 / 卡片双视图模式",
      ], color: C.orange },
      { x: 10.9, icon: "shield", title: "  系统功能", lines: [
        "JWT 登录 / 注册",
        "管理员 / 普通用户角色",
        "回收站（软删除可恢复）",
        "任务评论 + 嵌套回复",
        "响应式布局全设备适配",
      ], color: C.purple },
    ];

    modules.forEach(({ x, icon, title, lines, color }) => {
      addCard(slide, x, 2.0, 2.55, 4.5, icon, title, lines, color);
    });

    addPageNum(slide, 5);
  }

  // ═══════════════════════════════════════════
  // SLIDE 6: 架构
  // ═══════════════════════════════════════════
  {
    const slide = pres.addSlide();
    addBg(slide);
    addAccentBar(slide);
    addTitle(slide, "项目架构");
    addSubtitle(slide, "三层架构 + Python 解析服务，前后端分离，职责清晰");

    const layers = [
      { y: 1.9, icon: "rocket", color: C.accent, title: "  前端层", desc: "React 18 + Vite    Ant Design 5    Zustand 状态管理    React Router 7" },
      { y: 3.1, icon: "cogs", color: C.green, title: "  后端层", desc: "Express 5    JWT + bcrypt 认证    Controller → Service → Model 三层解耦" },
      { y: 4.3, icon: "layer", color: C.orange, title: "  数据层", desc: "MySQL 8    用户 / 任务 / 日程 / 分类 / 评论 / 通知 / 倒数日    共 9 张业务表" },
      { y: 5.5, icon: "code", color: C.purple, title: "  解析服务", desc: "Python 3    MCP Server (stdio) + HTTP API     pdfplumber / pytesseract / python-docx" },
    ];

    layers.forEach(({ y, icon, color, title, desc }, i) => {
      // Card
      slide.addShape(pres.shapes.RECTANGLE, {
        x: 1.2, y, w: 10.9, h: 0.9,
        fill: { color: C.card },
        line: { color: C.cardBorder, width: 0.5 },
        shadow: mkShadow(),
      });
      // Left accent
      slide.addShape(pres.shapes.RECTANGLE, {
        x: 1.2, y, w: 0.05, h: 0.9,
        fill: { color },
      });
      // Icon
      slide.addImage({
        data: ICONS[icon],
        x: 1.6, y: y + 0.2, w: 0.45, h: 0.45,
      });
      // Title
      slide.addText(title, {
        x: 2.3, y: y + 0.1, w: 2.5, h: 0.7,
        fontSize: 17, fontFace: "Georgia", color: color, bold: true, valign: "middle", margin: 0,
      });
      // Description
      slide.addText(desc, {
        x: 4.8, y: y + 0.1, w: 6.8, h: 0.7,
        fontSize: 12, fontFace: "Calibri", color: C.gray, valign: "middle", margin: 0,
      });
      // Arrow between layers
      if (i < 3) {
        slide.addImage({
          data: ICONS["arrow"],
          x: 6.3, y: y + 0.82, w: 0.3, h: 0.3,
        });
      }
    });

    addPageNum(slide, 6);
  }

  // ═══════════════════════════════════════════
  // SLIDE 7: 技术特色
  // ═══════════════════════════════════════════
  {
    const slide = pres.addSlide();
    addBg(slide);
    addAccentBar(slide);
    addTitle(slide, "技术特色");
    addSubtitle(slide, "架构规范 + 用户体验 + 安全加固，全方位工程化实践");

    const features = [
      { x: 1.0, y: 2.0, icon: "shield", title: "JWT 认证鉴权", lines: [
        "Access Token + Refresh Token 双令牌",
        "角色权限控制（admin / user）",
        "bcrypt 密码哈希加密",
        "启动时强制检查 JWT_SECRET",
        "无硬编码密钥，环境变量注入",
      ], color: C.accent },
      { x: 7.0, y: 2.0, icon: "cogs", title: "Zustand 状态管理", lines: [
        "统一状态方案（移除 Jotai）",
        "精准订阅，避免不必要重渲染",
        "各功能模块独立 Store，按需加载",
        "简洁 API，零模板代码",
        "筛选异步 Bug 修复：显式参数传递",
      ], color: C.green },
      { x: 1.0, y: 4.6, icon: "rocket", title: "批量 API + 前端优化", lines: [
        "批量删除/更新，单次 HTTP 请求",
        "搜索输入 300ms 防抖处理",
        "服务端分页：total / page / pageSize",
        "validator 中间件输入校验",
        "部分操作失败返回详细明细",
      ], color: C.orange },
      { x: 7.0, y: 4.6, icon: "check", title: "部署与安全", lines: [
        "Ant Design 响应式布局",
        "Docker Compose 一键部署启动",
        "Let's Encrypt 自动申请 SSL 证书",
        "Nginx 反向代理 + HTTPS 终止",
        "代码审查 13 项优化全部清零",
      ], color: C.purple },
    ];

    features.forEach(({ x, y, icon, title, lines, color }) => {
      addCard(slide, x, y, 5.3, 2.2, icon, title, lines, color);
    });

    addPageNum(slide, 7);
  }

  // ═══════════════════════════════════════════
  // SLIDE 8: 难点1
  // ═══════════════════════════════════════════
  {
    const slide = pres.addSlide();
    addBg(slide);
    addAccentBar(slide);
    addTitle(slide, "难点一：状态管理混乱");
    addSubtitle(slide, "双状态库共存导致数据不同步 → 统一方案并修复异步时序 Bug");

    // Problem card
    slide.addShape(pres.shapes.RECTANGLE, {
      x: 1.0, y: 2.0, w: 5.5, h: 4.6,
      fill: { color: "1A1215" }, // warm dark tint
      line: { color: "2A1A1F", width: 0.5 },
      shadow: mkShadow(),
    });
    slide.addShape(pres.shapes.RECTANGLE, {
      x: 1.0, y: 2.0, w: 5.5, h: 0.04,
      fill: { color: C.red },
    });
    slide.addImage({ data: ICONS["bug"], x: 1.3, y: 2.3, w: 0.4, h: 0.4 });
    slide.addText("  问题诊断", {
      x: 1.8, y: 2.27, w: 4.0, h: 0.45,
      fontSize: 19, fontFace: "Georgia", color: C.red, bold: true, margin: 0,
    });
    slide.addText([
      { text: "Jotai + Zustand 两套状态库并存", options: { breakLine: true, fontSize: 14, color: C.gray, fontFace: "Calibri" } },
      { text: "登录状态用 Jotai，任务状态用 Zustand", options: { breakLine: true, fontSize: 14, color: C.gray, fontFace: "Calibri" } },
      { text: "页面切换时 token 状态不同步 → 偶发 401", options: { breakLine: true, fontSize: 14, color: C.gray, fontFace: "Calibri" } },
      { text: "", options: { breakLine: true, fontSize: 10, color: C.gray, fontFace: "Calibri" } },
      { text: "handleFilterChange 调用 setFilters 后", options: { breakLine: true, fontSize: 14, color: C.orange, fontFace: "Calibri", bold: true } },
      { text: "fetchTasks 仍读到闭包中的旧 state", options: { breakLine: true, fontSize: 14, color: C.gray, fontFace: "Calibri" } },
      { text: "筛选结果与筛选项不匹配", options: { breakLine: true, fontSize: 14, color: C.gray, fontFace: "Calibri" } },
      { text: "", options: { breakLine: true, fontSize: 10, color: C.gray, fontFace: "Calibri" } },
      { text: "影响范围：登录流程、任务筛选、状态同步", options: { fontSize: 13, color: C.red, fontFace: "Calibri", italic: true } },
    ], { x: 1.3, y: 2.9, w: 4.9, h: 3.3, valign: "top", margin: 0 });

    // Solution card
    slide.addShape(pres.shapes.RECTANGLE, {
      x: 7.2, y: 2.0, w: 5.5, h: 4.6,
      fill: { color: "101A15" }, // green dark tint
      line: { color: "1A2A1F", width: 0.5 },
      shadow: mkShadow(),
    });
    slide.addShape(pres.shapes.RECTANGLE, {
      x: 7.2, y: 2.0, w: 5.5, h: 0.04,
      fill: { color: C.green },
    });
    slide.addImage({ data: ICONS["check"], x: 7.5, y: 2.3, w: 0.4, h: 0.4 });
    slide.addText("  解决方案", {
      x: 8.0, y: 2.27, w: 4.0, h: 0.45,
      fontSize: 19, fontFace: "Georgia", color: C.green, bold: true, margin: 0,
    });
    slide.addText([
      { text: "1. 全局搜索 Jotai useSetAtom / useAtomValue", options: { breakLine: true, fontSize: 14, color: C.gray, fontFace: "Calibri", paraSpaceAfter: 4 } },
      { text: "2. 逐一迁移到 Zustand useAuthStore", options: { breakLine: true, fontSize: 14, color: C.gray, fontFace: "Calibri", paraSpaceAfter: 4 } },
      { text: "3. 删除 package.json 中 jotai 依赖", options: { breakLine: true, fontSize: 14, color: C.gray, fontFace: "Calibri", paraSpaceAfter: 4 } },
      { text: "4. 清理 authStore.js 兼容导出层", options: { breakLine: true, fontSize: 14, color: C.gray, fontFace: "Calibri", paraSpaceAfter: 4 } },
      { text: "5. 全局搜索确认 0 处 Jotai 残留", options: { breakLine: true, fontSize: 14, color: C.gray, fontFace: "Calibri", paraSpaceAfter: 8 } },
      { text: "", options: { breakLine: true, fontSize: 6, color: C.gray, fontFace: "Calibri" } },
      { text: "fetchTasks(newFilters) 接受显式参数", options: { breakLine: true, fontSize: 14, color: C.green, fontFace: "Calibri", bold: true } },
      { text: "不再依赖闭包中的旧 state 快照", options: { breakLine: true, fontSize: 14, color: C.green, fontFace: "Calibri", bold: true } },
      { text: "", options: { breakLine: true, fontSize: 10, color: C.gray, fontFace: "Calibri" } },
      { text: "结果：状态统一，筛选准确，零 Jotai 依赖", options: { fontSize: 13, color: C.green, fontFace: "Calibri", italic: true } },
    ], { x: 7.5, y: 2.9, w: 4.9, h: 3.3, valign: "top", margin: 0 });

    addPageNum(slide, 8);
  }

  // ═══════════════════════════════════════════
  // SLIDE 9: 难点2
  // ═══════════════════════════════════════════
  {
    const slide = pres.addSlide();
    addBg(slide);
    addAccentBar(slide);
    addTitle(slide, "难点二：课程表智能解析");
    addSubtitle(slide, "从图片/文件到结构化日程的完整 AI + OCR 处理链路");

    const steps = [
      { x: 1.0, icon: "rocket", title: "  上传", lines: ["PNG / JPG 截图", "PDF 文档", "Word 文档", "拍照上传"], color: C.accent },
      { x: 3.8, icon: "code", title: "  文字提取", lines: ["pdfplumber 文字层", "pytesseract OCR", "扫描件自动降级", "Page 级逐页处理"], color: C.green },
      { x: 6.6, icon: "brain", title: "  智能解析", lines: ["正则 + 规则匹配", "课程名 / 时间", "教室 / 周次 / 教师", "结构化 JSON 输出"], color: C.orange },
      { x: 9.4, icon: "layer", title: "  服务化", lines: ["MCP Server stdio", "Claude Code 调用", "HTTP API", "前端 ImportModal"], color: C.purple },
    ];

    steps.forEach(({ x, icon, title, lines, color }, i) => {
      addCard(slide, x, 2.0, 2.55, 3.0, icon, title, lines, color);
      // Arrow
      if (i < 3) {
        slide.addImage({
          data: ICONS["arrow"],
          x: x + 2.55 + 0.15, y: 3.05, w: 0.35, h: 0.35,
        });
      }
    });

    // Bottom detail
    addCard(slide, 1.0, 5.4, 11.3, 1.3, "code", " 技术细节", [
      "pdfplumber 提取文字层 PDF → 扫描件降级为 pytesseract OCR → 正则 + 规则匹配课程结构 → 输出结构化 JSON",
      "MCP Server (stdio 协议) 供 Claude Code 直接调用；HTTP API (POST /api/parse) 供前端 ImportModal 使用",
    ], C.accent);

    addPageNum(slide, 9);
  }

  // ═══════════════════════════════════════════
  // SLIDE 10: 难点3
  // ═══════════════════════════════════════════
  {
    const slide = pres.addSlide();
    addBg(slide);
    addAccentBar(slide);
    addTitle(slide, "难点三：巨型组件重构");
    addSubtitle(slide, "818 行单文件 God Component → 3 个职责清晰的独立组件");

    // Before
    slide.addShape(pres.shapes.RECTANGLE, {
      x: 1.0, y: 2.0, w: 3.5, h: 4.2,
      fill: { color: C.card }, line: { color: C.cardBorder, width: 0.5 }, shadow: mkShadow(),
    });
    slide.addShape(pres.shapes.RECTANGLE, {
      x: 1.3, y: 2.15, w: 2.9, h: 0.03, fill: { color: C.red, transparency: 60 },
    });
    slide.addImage({ data: ICONS["bug"], x: 1.3, y: 2.35, w: 0.35, h: 0.35 });
    slide.addText("  重构前", {
      x: 1.75, y: 2.33, w: 2.0, h: 0.4,
      fontSize: 18, fontFace: "Georgia", color: C.red, bold: true, margin: 0,
    });
    slide.addText([
      { text: "TaskList.jsx", options: { breakLine: true, fontSize: 22, color: C.white, fontFace: "Georgia", bold: true } },
      { text: "818 行", options: { breakLine: true, fontSize: 36, color: C.red, fontFace: "Georgia", bold: true } },
      { text: "", options: { breakLine: true, fontSize: 10, color: C.gray } },
      { text: "一个文件包含：", options: { breakLine: true, fontSize: 14, color: C.gray, fontFace: "Calibri" } },
      { text: "  筛选栏 + 快速添加表单", options: { breakLine: true, fontSize: 13, color: C.gray, fontFace: "Calibri" } },
      { text: "  任务数据表格", options: { breakLine: true, fontSize: 13, color: C.gray, fontFace: "Calibri" } },
      { text: "  详情抽屉面板", options: { breakLine: true, fontSize: 13, color: C.gray, fontFace: "Calibri" } },
      { text: "  所有 API 调用和状态管理", options: { breakLine: true, fontSize: 13, color: C.gray, fontFace: "Calibri" } },
      { text: "", options: { breakLine: true, fontSize: 10, color: C.gray } },
      { text: "改一处，牵全身", options: { fontSize: 14, color: C.red, fontFace: "Calibri", italic: true } },
    ], { x: 1.3, y: 2.85, w: 2.9, h: 3.0, valign: "top", margin: 0 });

    // Arrow
    slide.addImage({
      data: ICONS["arrow"],
      x: 4.8, y: 3.7, w: 0.6, h: 0.6,
    });

    // After - 3 components
    const parts = [
      { y: 2.0, name: "FilterBar.jsx", lines: "180 行", desc: "搜索框 + 筛选条件 + 快速添加表单" },
      { y: 3.2, name: "TaskTable.jsx", lines: "240 行", desc: "任务数据表格 + 行操作 + 批量选择" },
      { y: 4.4, name: "TaskList.jsx", lines: "355 行", desc: "容器组件 — 编排子组件 + API 调用逻辑" },
    ];

    parts.forEach(({ y, name, lines, desc }) => {
      slide.addShape(pres.shapes.RECTANGLE, {
        x: 5.8, y, w: 6.5, h: 0.9,
        fill: { color: C.card }, line: { color: C.cardBorder, width: 0.5 }, shadow: mkShadow(),
      });
      slide.addShape(pres.shapes.RECTANGLE, {
        x: 5.8, y, w: 0.04, h: 0.9,
        fill: { color: C.green },
      });
      slide.addText(`${name}`, {
        x: 6.1, y: y + 0.05, w: 2.5, h: 0.35,
        fontSize: 15, fontFace: "Georgia", color: C.green, bold: true, margin: 0,
      });
      slide.addText(lines, {
        x: 8.5, y: y + 0.05, w: 1.5, h: 0.35,
        fontSize: 15, fontFace: "Calibri", color: C.white, bold: true, valign: "middle", margin: 0,
      });
      slide.addText(desc, {
        x: 6.1, y: y + 0.5, w: 5.5, h: 0.3,
        fontSize: 12, fontFace: "Calibri", color: C.gray, margin: 0,
      });
    });

    // Bottom principle
    addCard(slide, 1.0, 5.7, 11.3, 1.1, "check", " 重构原则", [
      "共享 StatCard 组件，Dashboard + TaskStats 复用    |    单文件 ≤ 250 行    |    Props 接口清晰    |    功能行为与拆分前完全一致",
    ], C.green);

    addPageNum(slide, 10);
  }

  // ═══════════════════════════════════════════
  // SLIDE 11: 学习收获
  // ═══════════════════════════════════════════
  {
    const slide = pres.addSlide();
    addBg(slide);
    addAccentBar(slide);
    addTitle(slide, "AI 项目开发学习心得");
    addSubtitle(slide, "全流程 AI 辅助开发的收获与实操感悟");

    const gains = [
      { x: 1.0, y: 1.9, icon: "rocket", title: "全栈闭环能力", lines: [
        "需求分析 → 技术选型 → 编码实现",
        "代码审查 → 优化重构 → 部署上线",
        "完整经历了一个项目从 0 到 1",
        "每个环节都有实际交付产出",
        '不再是“写 Demo”而是“做产品”',
      ], color: C.accent },
      { x: 7.0, y: 1.9, icon: "brain", title: "AI 辅助编程实战", lines: [
        "Claude Code 驱动全流程开发",
        "AI 不是替代思考，而是加速执行",
        "关键在于清晰的指令和上下文",
        "MCP 协议扩展了 AI 的能力边界",
        "\"说清楚需求\"本身就是能力",
      ], color: C.green },
      { x: 1.0, y: 4.3, icon: "cogs", title: "工程化思维培养", lines: [
        "代码审查发现 13 项问题并逐项清零",
        "状态管理统一、组件拆分、批量 API",
        "JWT 安全加固、输入校验",
        '从“能跑就行”到“规范化开发”',
        "规范不是束缚，是效率保障",
      ], color: C.orange },
      { x: 7.0, y: 4.3, icon: "star", title: "技术栈广度", lines: [
        "前端：React / Zustand / Ant Design",
        "后端：Express / MySQL / JWT",
        "运维：Docker / Nginx / HTTPS",
        "Python：OCR / 文件解析 / MCP",
        "全链路打通，不再有盲区",
      ], color: C.purple },
    ];

    gains.forEach(({ x, y, icon, title, lines, color }) => {
      addCard(slide, x, y, 5.3, 2.05, icon, title, lines, color);
    });

    addDecorCircle(slide, -0.3, 3.5, 1.0, C.purple, 95);

    addPageNum(slide, 11);
  }

  // ═══════════════════════════════════════════
  // SLIDE 12: 不足与展望
  // ═══════════════════════════════════════════
  {
    const slide = pres.addSlide();
    addBg(slide);
    addAccentBar(slide);

    // Decorative
    addDecorCircle(slide, 6.65, 6.5, 2.0, C.accent, 94);
    addDecorCircle(slide, 12.0, 1.0, 1.5, C.purple, 95);

    // Centered title
    slide.addText("不足与展望", {
      x: 1.5, y: 0.5, w: 10.3, h: 0.8,
      fontSize: 38, fontFace: "Georgia", color: C.white, bold: true, align: "center", margin: 0,
    });
    slide.addText("持续改进，不断迭代", {
      x: 1.5, y: 1.2, w: 10.3, h: 0.45,
      fontSize: 16, fontFace: "Calibri", color: C.gray, align: "center", margin: 0,
    });

    // Divider
    slide.addShape(pres.shapes.RECTANGLE, {
      x: 5.0, y: 1.85, w: 3.3, h: 0.012,
      fill: { color: C.grayLight },
    });

    // Left — 不足
    addCard(slide, 1.0, 2.4, 5.3, 3.5, "bug", "  当前不足", [
      "移动端适配尚不完善",
      "单元测试 & E2E 测试覆盖不足",
      "缺少 CI/CD 自动化部署流水线",
      "通知仅支持站内，无实时推送",
      "课程表解析对非标准格式识别率偏低",
      "代码中部分异常处理不够健壮",
    ], C.orange);

    // Right — 展望
    addCard(slide, 7.0, 2.4, 5.3, 3.5, "rocket", "  后续计划", [
      "PWA 移动端适配，支持离线使用",
      "Vitest + Playwright 构建测试体系",
      "GitHub Actions CI/CD 自动部署",
      "WebSocket 实时通知 + 邮件/微信提醒",
      "课程表解析接入 LLM 提升泛化能力",
      "国际化 i18n 支持英文界面",
    ], C.accent);

    // Thank you
    slide.addText("感谢聆听", {
      x: 2.0, y: 6.2, w: 9.3, h: 0.9,
      fontSize: 46, fontFace: "Georgia", color: C.accent, bold: true,
      align: "center", valign: "middle", margin: 0,
    });

    addPageNum(slide, 12);
  }

  // ── Save ──
  const outPath = "C:/Users/chentao/Desktop/轻量化任务管理系统/ppt/轻量化任务管理系统_答辩PPT.pptx";
  await pres.writeFile({ fileName: outPath });
  console.log("PPT generated: " + outPath);
  console.log("Total slides: " + pres.slides.length);
}

main().catch(err => { console.error(err); process.exit(1); });
