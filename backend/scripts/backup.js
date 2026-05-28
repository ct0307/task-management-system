/**
 * 数据库备份脚本
 * 用法: node scripts/backup.js
 * 备份文件保存在 backend/backups/ 目录下
 */
const { exec } = require("child_process");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

const DB_HOST = process.env.DB_HOST || "localhost";
const DB_PORT = process.env.DB_PORT || 3306;
const DB_USER = process.env.DB_USER || "root";
const DB_PASSWORD = process.env.DB_PASSWORD || "";
const DB_NAME = process.env.DB_NAME || "task_system_db";

const BACKUP_DIR = path.join(__dirname, "..", "backups");

// 确保备份目录存在
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
const filename = `backup_${DB_NAME}_${timestamp}.sql`;
const filepath = path.join(BACKUP_DIR, filename);

const cmd = `mysqldump -h${DB_HOST} -P${DB_PORT} -u${DB_USER} -p"${DB_PASSWORD}" --single-transaction --routines --triggers ${DB_NAME} > "${filepath}"`;

console.log(`开始备份数据库 ${DB_NAME}...`);
exec(cmd, (err, stdout, stderr) => {
  if (err) {
    console.error("备份失败:", err.message);
    // 删除空文件
    try { fs.unlinkSync(filepath); } catch {}
    process.exit(1);
  }
  if (stderr && !stderr.includes("Warning")) {
    console.warn("备份警告:", stderr);
  }
  const stats = fs.statSync(filepath);
  const sizeKB = (stats.size / 1024).toFixed(1);
  console.log(`备份成功: ${filename} (${sizeKB} KB)`);

  // 保留最近 7 天的备份，删除旧的
  const files = fs.readdirSync(BACKUP_DIR)
    .filter(f => f.startsWith("backup_") && f.endsWith(".sql"))
    .sort()
    .reverse();

  if (files.length > 7) {
    files.slice(7).forEach(f => {
      fs.unlinkSync(path.join(BACKUP_DIR, f));
      console.log(`  已清理旧备份: ${f}`);
    });
  }

  console.log(`当前备份数: ${Math.min(files.length, 7)} (保留最近7个)`);
  process.exit(0);
});
