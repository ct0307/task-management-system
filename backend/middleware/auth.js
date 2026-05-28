// middleware/auth.js — JWT 认证中间件（模板化版本）
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { pool } = require("../db");

const JWT_SECRET = process.env.JWT_SECRET;

// 启动时检查 JWT_SECRET
if (!JWT_SECRET) {
  console.error("❌ 错误: JWT_SECRET 环境变量未设置！");
  console.error("   请在 .env 文件中设置 JWT_SECRET，或通过环境变量传入。");
  console.error("   示例: JWT_SECRET=your-secret-key-here");
  process.exit(1);
}

// token 黑名单的内存缓存（避免每次请求都查库）
const blacklistCache = new Set();
let lastCacheRefresh = 0;
const CACHE_TTL = 60_000; // 1 分钟同步一次数据库

async function refreshBlacklistCache() {
  const now = Date.now();
  if (now - lastCacheRefresh < CACHE_TTL) return;
  try {
    const [rows] = await pool.query(
      "SELECT token_hash FROM token_blacklist WHERE expires_at > NOW()"
    );
    blacklistCache.clear();
    for (const row of rows) blacklistCache.add(row.token_hash);
    lastCacheRefresh = now;
  } catch {
    // 数据库不可用时静默降级
  }
}

/**
 * 验证 JWT Token 的中间件
 * 从 Authorization header 中提取 Bearer token 并验证
 */
async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({
      code: 401,
      message: "未登录或 token 已过期"
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    // 计算 token 的 sha256 哈希值，检查是否在黑名单中
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    await refreshBlacklistCache();
    if (blacklistCache.has(tokenHash)) {
      return res.status(401).json({
        code: 401,
        message: "token 已失效，请重新登录"
      });
    }

    req.user = decoded; // 将用户信息挂载到 req 对象
    next();
  } catch (err) {
    return res.status(401).json({
      code: 401,
      message: "token 无效或已过期"
    });
  }
}

/**
 * 角色权限验证中间件
 * @param {...string} roles - 允许的角色列表
 * @returns {Function} Express 中间件
 */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        code: 401,
        message: "未登录"
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        code: 403,
        message: "无权限访问"
      });
    }

    next();
  };
}

/**
 * 生成 JWT Token
 * @param {Object} user - 用户信息对象
 * @returns {string} JWT token
 */
function signToken(user) {
  const payload = {
    id: user.id,
    role: user.role,
    username: user.username,
    real_name: user.real_name || null
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || "7d" });
}

module.exports = { requireAuth, requireRole, signToken, JWT_SECRET };
