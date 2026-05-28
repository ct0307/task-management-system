/**
 * 数据库备份脚本（纯 Node.js 实现，无需 mysqldump）
 * 用法: node scripts/backup-node.js
 */
const path = require("path");
const fs = require("fs");
require("dotenv").config();
const mysql = require("mysql2/promise");

const DB_NAME = process.env.DB_NAME || "task_system_db";
const BACKUP_DIR = path.join(__dirname, "..", "backups");

async function backup() {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }

  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    multipleStatements: true
  });

  try {
    await conn.query(`USE \`${DB_NAME}\``);

    // 获取所有表
    const [tables] = await conn.query("SHOW TABLES");
    let sql = `-- 数据库备份: ${DB_NAME}\n-- 时间: ${new Date().toISOString()}\n\n`;
    sql += `SET FOREIGN_KEY_CHECKS = 0;\n\n`;

    for (const row of tables) {
      const tableName = Object.values(row)[0];
      console.log(`  备份表: ${tableName}`);

      // 建表语句
      const [createRows] = await conn.query(`SHOW CREATE TABLE \`${tableName}\``);
      sql += createRows[0]["Create Table"] + ";\n\n";

      // 数据
      const [dataRows] = await conn.query(`SELECT * FROM \`${tableName}\``);
      if (dataRows.length > 0) {
        const cols = Object.keys(dataRows[0]);
        const values = dataRows.map(row => {
          const vals = cols.map(col => {
            const val = row[col];
            if (val === null) return "NULL";
            if (val instanceof Date) return `'${val.toISOString().slice(0, 19).replace("T", " ")}'`;
            if (typeof val === "number") return String(val);
            return `'${String(val).replace(/'/g, "''").replace(/\\/g, "\\\\")}'`;
          });
          return `INSERT INTO \`${tableName}\` (\`${cols.join("`, `")}\`) VALUES (${vals.join(", ")});`;
        });
        sql += values.join("\n") + "\n\n";
      }
    }

    sql += "SET FOREIGN_KEY_CHECKS = 1;\n";

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
    const filename = `backup_${DB_NAME}_${timestamp}.sql`;
    const filepath = path.join(BACKUP_DIR, filename);
    fs.writeFileSync(filepath, sql, "utf-8");

    const sizeKB = (fs.statSync(filepath).size / 1024).toFixed(1);
    console.log(`备份成功: ${filename} (${sizeKB} KB)`);

    // 保留最近 7 个
    const files = fs.readdirSync(BACKUP_DIR)
      .filter(f => f.startsWith("backup_") && f.endsWith(".sql"))
      .sort().reverse();
    if (files.length > 7) {
      files.slice(7).forEach(f => {
        fs.unlinkSync(path.join(BACKUP_DIR, f));
        console.log(`  已清理: ${f}`);
      });
    }
    console.log(`备份保留: ${Math.min(files.length, 7)} 个`);
  } finally {
    await conn.end();
  }
}

backup().catch(err => { console.error("备份失败:", err.message); process.exit(1); });
