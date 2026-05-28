/**
 * 健康检查路由
 * GET /api/health — 检查服务运行状态和数据库连接
 */
const express = require("express");
const router = express.Router();
const { pool } = require("../db");

router.get("/", async (req, res) => {
  let dbStatus = "disconnected";
  try {
    const conn = await pool.getConnection();
    await conn.ping();
    conn.release();
    dbStatus = "connected";
  } catch {
    dbStatus = "disconnected";
  }

  res.json({
    code: 200,
    message: "ok",
    data: {
      status: "running",
      database: dbStatus,
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    }
  });
});

module.exports = router;
