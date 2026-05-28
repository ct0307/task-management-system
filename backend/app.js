// app.js — Express 后端入口（模板化版本）
require('dotenv').config();
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const path = require("path");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const { errorHandler } = require("./middleware/errorHandler");
const { requestIdMiddleware, logger } = require("./utils/logger");

// 导入路由
const authRoutes = require("./routes/auth");
const healthRoutes = require("./routes/health");
const taskRoutes = require("./routes/tasks");
const adminRoutes = require("./routes/admin");
const commentRoutes = require("./routes/comments");
const notificationRoutes = require("./routes/notifications");

// Swagger API 文档（非生产环境默认开启）
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./utils/swagger");

const app = express();

// 中间件配置
app.use(requestIdMiddleware); // 请求追踪（生成 requestId）
app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5173', credentials: true }));
app.use(helmet());
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 200, message: { code: 429, message: '请求过于频繁，请稍后重试' } }));
app.use(morgan("dev"));
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

// 请求级日志（带 requestId）
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.originalUrl}`, { ip: req.ip }, req.requestId);
  next();
});

// 静态文件托管（安全：仅在 dist 存在时加载）
const distPath = path.join(__dirname, "dist");
try {
  require("fs").accessSync(distPath, require("fs").constants.F_OK);
  app.use(express.static(distPath));
} catch {
  // dist 不存在时跳过（开发环境）
}

// API 路由挂载
app.use("/api/auth", authRoutes);
app.use("/api/health", healthRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api", commentRoutes);
app.use("/api", notificationRoutes);
app.use("/api/admin", adminRoutes);

// Swagger API 文档
if (process.env.NODE_ENV !== "production" || process.env.ENABLE_SWAGGER === "true") {
  app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customCss: ".swagger-ui .topbar { display: none }",
    customSiteTitle: "任务管理系统 API 文档",
  }));
  console.log("📚 Swagger API 文档：http://localhost:" + (process.env.PORT || 3000) + "/api/docs");
}

// 404 处理
app.use((req, res) => {
  res.status(404).json({ code: 404, message: "接口不存在", data: null });
});

// 统一错误处理
app.use(errorHandler);

// ====== 启动定时任务 ======
const scheduler = require("./utils/scheduler");

// 启动服务器
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 后端服务器运行在端口 ${PORT}`);
  console.log(`📁 静态文件托管路径：${distPath}`);
  console.log(`🔗 API 基础路径：/api`);

  scheduler.start();
});

module.exports = app;
