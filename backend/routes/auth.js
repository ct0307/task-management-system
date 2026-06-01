// routes/auth.js — 认证路由
const express = require("express");
const rateLimit = require("express-rate-limit");
const { requireAuth, signToken } = require("../middleware/auth");
const { login, createDevUser } = require("../controllers/authController");
const { ErrorCodes } = require("../constants/errorCodes");
const { success, fail } = require("../utils/response");

const router = express.Router();

// 登录接口独立限流：10次/分钟（防暴力破解）
const loginLimiter = rateLimit({
  windowMs: 60_000,
  max: 10,
  message: { code: 429, message: '登录尝试过于频繁，请1分钟后再试' }
});

/**
 * POST /api/auth/login
 * 用户登录接口（限流：10次/分钟）
 */
router.post("/login", loginLimiter, login);

/**
 * GET /api/auth/me
 * 获取当前登录用户完整信息（含 created_at）
 * 需要 Bearer Token 认证
 */
router.get("/me", requireAuth, async (req, res, next) => {
  const { pool } = require("../db");
  try {
    const [rows] = await pool.query(
      "SELECT id, username, real_name, role, created_at FROM users WHERE id = ?",
      [req.user.id]
    );
    if (rows.length === 0) {
      return fail(res, ErrorCodes.NOT_FOUND, "用户不存在");
    }
    success(res, { user: rows[0] });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/auth/logout
 * 退出登录接口
 * 需要 Bearer Token 认证
 */
router.post("/logout", requireAuth, async (req, res, next) => {
  const crypto = require("crypto");
  const { pool } = require("../db");

  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return fail(res, ErrorCodes.UNAUTHORIZED, "未提供 token", ErrorCodes.UNAUTHORIZED);
  }

  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const exp = req.user.exp;
  const expiresAt = exp ? new Date(exp * 1000).toISOString().slice(0, 19).replace("T", " ") : null;

  let conn;
  try {
    conn = await pool.getConnection();
    await conn.query(
      `INSERT INTO token_blacklist (token_hash, expires_at) VALUES (?, ?)`,
      [tokenHash, expiresAt]
    );
    success(res, null, "退出登录成功");
  } catch (err) {
    console.error("Logout error:", err);
    next(err);
  } finally {
    if (conn) conn.release();
  }
});

// 注册接口独立限流：5次/分钟（防恶意注册）
const registerLimiter = rateLimit({
  windowMs: 60_000,
  max: 5,
  message: { code: 429, message: '注册过于频繁，请1分钟后再试' }
});

/**
 * POST /api/auth/register
 * 用户注册（默认角色: user），注册成功自动返回 token
 */
router.post("/register", registerLimiter, async (req, res, next) => {
  const { username, password, real_name } = req.body || {};

  if (!username || username.trim().length < 2) {
    return fail(res, ErrorCodes.VALIDATION_ERROR, "用户名至少2个字符");
  }
  if (!password || password.length < 6) {
    return fail(res, ErrorCodes.VALIDATION_ERROR, "密码至少6个字符");
  }

  const bcrypt = require("bcryptjs");
  const { pool } = require("../db");
  let conn;
  try {
    conn = await pool.getConnection();
    const [existing] = await conn.query("SELECT id FROM users WHERE username = ?", [username.trim()]);
    if (existing.length > 0) {
      return fail(res, ErrorCodes.CONFLICT, "用户名已存在");
    }
    const hashed = await bcrypt.hash(password, 10);
    const [result] = await conn.query(
      "INSERT INTO users (username, password, role, real_name) VALUES (?, ?, ?, ?)",
      [username.trim(), hashed, "user", real_name?.trim() || username.trim()]
    );

    // 注册成功自动签发 token
    const token = signToken({
      id: result.insertId,
      role: "user",
      username: username.trim(),
      real_name: real_name?.trim() || username.trim()
    });

    success(res, {
      token,
      user: {
        id: result.insertId,
        username: username.trim(),
        role: "user",
        real_name: real_name?.trim() || username.trim()
      }
    }, "注册成功", 201);
  } catch (err) {
    next(err);
  } finally {
    if (conn) conn.release();
  }
});

/**
 * PUT /api/auth/profile
 * 更新个人信息（姓名等）
 */
router.put("/profile", requireAuth, async (req, res, next) => {
  const { real_name } = req.body || {};
  if (!real_name || real_name.trim().length === 0) {
    return fail(res, ErrorCodes.VALIDATION_ERROR, "姓名不能为空");
  }
  const { pool } = require("../db");
  try {
    await pool.query("UPDATE users SET real_name = ? WHERE id = ?", [real_name.trim(), req.user.id]);
    const [rows] = await pool.query(
      "SELECT id, username, real_name, role, created_at FROM users WHERE id = ?",
      [req.user.id]
    );
    const token = signToken(rows[0]);
    success(res, { user: rows[0], token }, "个人信息已更新");
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/auth/password
 * 修改当前用户密码
 */
router.put("/password", requireAuth, async (req, res, next) => {
  const { oldPassword, newPassword } = req.body || {};

  if (!oldPassword || !newPassword) {
    return fail(res, ErrorCodes.VALIDATION_ERROR, "请提供旧密码和新密码");
  }
  if (newPassword.length < 4) {
    return fail(res, ErrorCodes.VALIDATION_ERROR, "新密码至少4个字符");
  }

  const bcrypt = require("bcryptjs");
  const { pool } = require("../db");
  let conn;
  try {
    conn = await pool.getConnection();
    const [rows] = await conn.query("SELECT password FROM users WHERE id = ?", [req.user.id]);
    if (rows.length === 0) {
      return fail(res, ErrorCodes.NOT_FOUND, "用户不存在");
    }
    const match = await bcrypt.compare(oldPassword, rows[0].password);
    if (!match) {
      return fail(res, ErrorCodes.VALIDATION_ERROR, "旧密码不正确");
    }
    const hashed = await bcrypt.hash(newPassword, 10);
    await conn.query("UPDATE users SET password = ? WHERE id = ?", [hashed, req.user.id]);
    success(res, null, "密码修改成功");
  } catch (err) {
    next(err);
  } finally {
    if (conn) conn.release();
  }
});

/**
 * GET /api/auth/check-username?username=xxx
 * 检查用户名是否已存在（注册时实时校验）
 */
router.get("/check-username", async (req, res, next) => {
  const { username } = req.query;
  if (!username || username.trim().length < 2) {
    return fail(res, ErrorCodes.VALIDATION_ERROR, "用户名至少2个字符");
  }
  const { pool } = require("../db");
  let conn;
  try {
    conn = await pool.getConnection();
    const [rows] = await conn.query("SELECT id FROM users WHERE username = ?", [username.trim()]);
    success(res, { available: rows.length === 0 }, rows.length === 0 ? "用户名可用" : "用户名已存在");
  } catch (err) {
    next(err);
  } finally {
    if (conn) conn.release();
  }
});

/**
 * POST /api/auth/dev-create-user
 * 仅限开发环境：创建测试用户
 * 生产环境自动禁用
 */
router.post("/dev-create-user", async (req, res, next) => {
  if (process.env.NODE_ENV !== "development") {
    return fail(res, ErrorCodes.FORBIDDEN, "仅限开发环境使用", ErrorCodes.FORBIDDEN);
  }
  await createDevUser(req, res, next);
});

/**
 * POST /api/auth/guest
 * 游客登录 — 创建临时账号，返回 token
 * 游客账号角色为 'guest'，数据不保存，退出时自动清除
 */
router.post("/guest", async (req, res, next) => {
  const { username } = req.body || {};
  if (!username || username.trim().length < 2) {
    return fail(res, ErrorCodes.VALIDATION_ERROR, "用户名至少2个字符");
  }

  const bcrypt = require("bcryptjs");
  const crypto = require("crypto");
  const { pool } = require("../db");
  let conn;
  try {
    conn = await pool.getConnection();
    const [existing] = await conn.query("SELECT id FROM users WHERE username = ?", [username.trim()]);
    if (existing.length > 0) {
      return fail(res, ErrorCodes.CONFLICT, "该用户名已被使用");
    }

    // 随机密码（游客无需知道）
    const randomPass = crypto.randomBytes(16).toString("hex");
    const hashed = await bcrypt.hash(randomPass, 10);
    const [result] = await conn.query(
      "INSERT INTO users (username, password, role, real_name) VALUES (?, ?, ?, ?)",
      [username.trim(), hashed, "guest", username.trim()]
    );

    const user = {
      id: result.insertId,
      username: username.trim(),
      role: "guest",
      real_name: username.trim()
    };
    const token = signToken(user);

    success(res, { token, user }, "游客账号已创建", 201);
  } catch (err) {
    next(err);
  } finally {
    if (conn) conn.release();
  }
});

/**
 * DELETE /api/auth/guest
 * 删除游客账号及其所有关联数据（任务、评论、通知）
 * 仅游客角色可用
 */
router.delete("/guest", requireAuth, async (req, res, next) => {
  if (req.user.role !== "guest") {
    return fail(res, ErrorCodes.FORBIDDEN, "仅游客账号支持此操作");
  }

  const userId = req.user.id;
  const { pool } = require("../db");
  let conn;
  try {
    conn = await pool.getConnection();
    // 按依赖顺序删除：评论 → 通知 → 审计日志 → 任务 → 用户
    await conn.query("DELETE FROM task_comments WHERE user_id = ?", [userId]);
    await conn.query("DELETE FROM notifications WHERE user_id = ?", [userId]);
    await conn.query("DELETE FROM task_audit_log WHERE user_id = ?", [userId]);
    await conn.query("DELETE FROM tasks WHERE created_by = ? OR assignee_id = ?", [userId, userId]);
    await conn.query("DELETE FROM users WHERE id = ?", [userId]);
    success(res, null, "游客数据已清理");
  } catch (err) {
    next(err);
  } finally {
    if (conn) conn.release();
  }
});

module.exports = router;
