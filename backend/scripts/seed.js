/**
 * 轻量化任务管理系统数据库初始化脚本
 * 创建任务管理相关表和测试数据
 *
 * 使用方法: node scripts/seed.js
 */

const mysql = require("mysql2/promise");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const DB_CONFIG = {
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  multipleStatements: true
};

const DB_NAME = process.env.DB_NAME || "task_system_db";

async function run() {
  let conn;
  try {
    // 连接 MySQL
    conn = await mysql.createConnection(DB_CONFIG);
    console.log(`✅ 已连接到 MySQL (${DB_CONFIG.host}:${DB_CONFIG.port})`);

    // 创建数据库
    await conn.query(
      `CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` DEFAULT CHARSET utf8mb4`
    );
    console.log(`✅ 数据库 "${DB_NAME}" 已就绪`);

    // 使用数据库
    await conn.query(`USE \`${DB_NAME}\``);

    // ====== 用户表（保留原模板）======
    await conn.query(`
      CREATE TABLE IF NOT EXISTS users (
        id          INT PRIMARY KEY AUTO_INCREMENT,
        username    VARCHAR(50)  NOT NULL UNIQUE,
        password    VARCHAR(100) NOT NULL,
        role        VARCHAR(20)  NOT NULL DEFAULT 'user',
        real_name   VARCHAR(50)  DEFAULT NULL,
        created_by  INT          DEFAULT NULL,
        created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
        updated_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    console.log('✅ 表 "users" 已就绪');

    // 兼容已有数据库：添加 created_by 列
    try {
      await conn.query('ALTER TABLE users ADD COLUMN created_by INT DEFAULT NULL AFTER real_name');
      console.log('  ↳ 已添加 created_by 列');
    } catch (_) { /* 列已存在 */ }

    // token黑名单表
    await conn.query(`
      CREATE TABLE IF NOT EXISTS token_blacklist (
        token_hash  VARCHAR(64)  PRIMARY KEY,
        expires_at  DATETIME(3)  NOT NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    console.log('✅ 表 "token_blacklist" 已就绪');

    // ====== 任务分类表（新增）======
    await conn.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id          INT PRIMARY KEY AUTO_INCREMENT,
        name        VARCHAR(50)  NOT NULL,
        color       VARCHAR(20)  DEFAULT '#1890ff',
        created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
        updated_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    console.log('✅ 表 "categories" 已就绪');

    // ====== 任务表（新增）======
    await conn.query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id          INT PRIMARY KEY AUTO_INCREMENT,
        title       VARCHAR(200) NOT NULL,
        description TEXT,
        status      VARCHAR(20)  NOT NULL DEFAULT 'pending',
        priority    VARCHAR(20)  NOT NULL DEFAULT 'medium',
        category_id INT,
        assignee_id INT,
        due_date    DATE,
        sort_order  INT          DEFAULT 0,
        created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
        updated_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
        FOREIGN KEY (assignee_id) REFERENCES users(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    console.log('✅ 表 "tasks" 已就绪');

    // 兼容已有数据库：添加 sort_order 列（若不存在）
    try {
      await conn.query('ALTER TABLE tasks ADD COLUMN sort_order INT DEFAULT 0 AFTER due_date');
      console.log('  ↳ 已添加 sort_order 列');
    } catch (_) { /* 列已存在 */ }
    try {
      await conn.query(`
        UPDATE tasks t
        JOIN (SELECT id, ROW_NUMBER() OVER (PARTITION BY status ORDER BY created_at ASC) AS rn FROM tasks) s
        ON t.id = s.id SET t.sort_order = s.rn WHERE t.sort_order = 0
      `);
    } catch (_) { /* 窗口函数不支持 */ }

    // 兼容已有数据库：添加 deleted_at 列（软删除）
    try {
      await conn.query('ALTER TABLE tasks ADD COLUMN deleted_at DATETIME DEFAULT NULL AFTER updated_at');
      console.log('  ↳ 已添加 deleted_at 列（软删除）');
    } catch (_) { /* 列已存在 */ }
    try {
      await conn.query('ALTER TABLE tasks ADD COLUMN created_by INT DEFAULT NULL AFTER assignee_id');
      console.log('  ↳ 已添加 created_by 列（创建人）');
    } catch (_) { /* 列已存在 */ }
    try {
      await conn.query('ALTER TABLE tasks ADD COLUMN parent_id INT DEFAULT NULL AFTER id');
      console.log('  ↳ 已添加 parent_id 列（父任务）');
    } catch (_) { /* 列已存在 */ }

    // ====== 数据库索引优化 ======
    try { await conn.query('CREATE INDEX idx_tasks_status ON tasks(status)'); } catch (_) {}
    try { await conn.query('CREATE INDEX idx_tasks_priority ON tasks(priority)'); } catch (_) {}
    try { await conn.query('CREATE INDEX idx_tasks_deleted_at ON tasks(deleted_at)'); } catch (_) {}
    try { await conn.query('CREATE INDEX idx_tasks_due_date ON tasks(due_date)'); } catch (_) {}
    try { await conn.query('CREATE INDEX idx_tasks_assignee ON tasks(assignee_id)'); } catch (_) {}
    try { await conn.query('CREATE INDEX idx_token_blacklist_expires ON token_blacklist(expires_at)'); } catch (_) {}
    try { await conn.query('CREATE INDEX idx_notifications_user ON notifications(user_id, is_read)'); } catch (_) {}
    try { await conn.query('CREATE INDEX idx_comments_task ON task_comments(task_id)'); } catch (_) {}
    console.log('  ↳ 数据库索引已优化');

    // ====== 任务评论表 ======
    await conn.query(`
      CREATE TABLE IF NOT EXISTS task_comments (
        id         INT PRIMARY KEY AUTO_INCREMENT,
        task_id    INT NOT NULL,
        user_id    INT NOT NULL,
        content    TEXT NOT NULL,
        parent_id  INT DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
        FOREIGN KEY (parent_id) REFERENCES task_comments(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    console.log('✅ 表 "task_comments" 已就绪');

    // ====== 审计日志表 ======
    await conn.query(`
      CREATE TABLE IF NOT EXISTS task_audit_log (
        id         INT PRIMARY KEY AUTO_INCREMENT,
        task_id    INT NOT NULL,
        user_id    INT,
        action     VARCHAR(30) NOT NULL,
        field      VARCHAR(50),
        old_value  VARCHAR(500),
        new_value  VARCHAR(500),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    console.log('✅ 表 "task_audit_log" 已就绪');

    // ====== 索引优化 ======
    await conn.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id         INT PRIMARY KEY AUTO_INCREMENT,
        user_id    INT NOT NULL,
        type       VARCHAR(30),
        task_id    INT,
        message    VARCHAR(300),
        is_read    TINYINT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    console.log('✅ 表 "notifications" 已就绪');

    // ====== 初始化管理员（通过环境变量 ADMIN_USERNAME/ADMIN_PASSWORD 配置）======
    const adminUser = process.env.ADMIN_USERNAME || "admin";
    const adminPass = process.env.ADMIN_PASSWORD;
    if (adminPass) {
      const hashedPassword = bcrypt.hashSync(adminPass, 10);
      await conn.query(
        `INSERT IGNORE INTO users (username, password, role, real_name) VALUES (?, ?, ?, ?)`,
        [adminUser, hashedPassword, "admin", "管理员"]
      );
      console.log(`  👤 管理员 "${adminUser}" 已创建`);
    } else {
      console.log('  ⚠️ 未设置 ADMIN_PASSWORD 环境变量，跳过管理员创建');
      console.log('    请通过注册页面创建账号后，手动在数据库中设置 role="admin"');
    }

    // ====== 插入默认分类 ======
    const defaultCategories = [
      { name: "工作", color: "#1890ff" },
      { name: "学习", color: "#52c41a" },
      { name: "生活", color: "#faad14" },
      { name: "项目", color: "#722ed1" }
    ];

    for (const c of defaultCategories) {
      await conn.query(
        `INSERT IGNORE INTO categories (name, color) VALUES (?, ?)`,
        [c.name, c.color]
      );
      console.log(`  📁 分类 "${c.name}" 已就绪`);
    }

    console.log(`\n🎉 数据库初始化完成！`);
    if (!adminPass) {
      console.log(`\n📋 首次使用:`);
      console.log(`   1. 访问系统注册账号`);
      console.log(`   2. 在服务器执行以下命令设为管理员：`);
      console.log(`      docker compose exec backend node -e "const db=require('./db');db.query('UPDATE users SET role=? WHERE username=?',['admin','你的用户名']).then(()=>{console.log('ok');process.exit()})"`);
    }

  } catch (err) {
    console.error("❌ 初始化失败:", err.message);
    process.exit(1);
  } finally {
    if (conn) await conn.end();
  }
}

run();
