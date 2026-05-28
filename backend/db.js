// db.js — MySQL 数据库连接池（模板化版本）
const mysql = require("mysql2/promise");

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "your_password",
  database: process.env.DB_NAME || "template_db",
  connectionLimit: Number(process.env.DB_CONNECTION_LIMIT) || 10,
  charset: "utf8mb4",
  waitForConnections: true,
  queueLimit: 0
});

// 测试连接
pool
  .getConnection()
  .then((conn) => {
    console.log("✅ MySQL 数据库连接池创建成功");
    conn.release();
  })
  .catch((err) => {
    console.error("❌ MySQL 连接错误:", err.message);
  });

/**
 * 执行 SQL 查询的便捷方法
 * @param {string} sql  SQL 语句
 * @param {Array} params  参数数组
 * @returns {Promise<Array>} 查询结果
 */
const execute = async (sql, params = []) => {
  const [rows] = await pool.execute(sql, params);
  return rows;
};

/**
 * 执行 SQL 查询（支持 SELECT 流式结果）
 * @param {string} sql  SQL 语句
 * @param {Array} params  参数数组
 * @returns {Promise<[Array, Array]>} [rows, fields]
 */
const query = async (sql, params = []) => {
  return await pool.query(sql, params);
};

module.exports = { pool, execute, query };
