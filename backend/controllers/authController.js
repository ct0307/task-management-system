/**
 * Auth Controller — 认证控制器
 * 处理登录、创建测试用户等业务逻辑
 */

const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const { pool } = require("../db");
const { signToken, JWT_SECRET } = require("../middleware/auth");
const { ErrorCodes } = require("../constants/errorCodes");
const { fail, success } = require("../utils/response");

/**
 * 用户登录
 */
async function login(req, res, next) {
  const { username, password } = req.body || {};

  let conn;
  try {
    conn = await pool.getConnection();

    const [rows] = await conn.query(
      `SELECT id, username, password, role, real_name, created_at
       FROM users
       WHERE username = ?
       LIMIT 1`,
      [username]
    );

    if (rows.length === 0) {
      return fail(res, ErrorCodes.LOGIN_FAILED, "用户名或密码错误", ErrorCodes.UNAUTHORIZED);
    }

    const user = rows[0];

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return fail(res, ErrorCodes.LOGIN_FAILED, "用户名或密码错误", ErrorCodes.UNAUTHORIZED);
    }

    const token = signToken(user);

    success(res, {
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        real_name: user.real_name,
        created_at: user.created_at
      }
    }, "登录成功");
  } catch (err) {
    console.error("Login error:", err);
    next(err);
  } finally {
    if (conn) conn.release();
  }
}

/**
 * 创建测试用户（仅限开发环境）
 */
async function createDevUser(req, res, next) {
  const { username, password, role, real_name } = req.body || {};

  if (!["admin", "user"].includes(role)) {
    return fail(res, ErrorCodes.VALIDATION_ERROR, "角色必须是 admin 或 user", ErrorCodes.VALIDATION_ERROR);
  }

  let conn;
  try {
    conn = await pool.getConnection();

    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await conn.query(
      `INSERT INTO users (username, password, role, real_name)
       VALUES (?, ?, ?, ?)`,
      [username, hashedPassword, role, real_name || null]
    );

    success(res, { id: result.insertId }, "用户创建成功");
  } catch (err) {
    if (String(err.code) === "ER_DUP_ENTRY") {
      return fail(res, ErrorCodes.CONFLICT, "用户名已存在", ErrorCodes.CONFLICT);
    }
    console.error("Dev user creation error:", err);
    next(err);
  } finally {
    if (conn) conn.release();
  }
}

module.exports = { login, createDevUser };
