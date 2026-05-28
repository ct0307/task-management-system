/**
 * 定时任务调度器
 * 每30分钟检查到期/逾期任务，生成通知
 */

const { pool } = require('../db');
const { logger } = require('./logger');

async function checkDueNotifications() {
  try {
    // 24小时内到期的任务 → due_soon 通知
    const [dueSoon] = await pool.query(`
      SELECT t.id, t.title, t.assignee_id FROM tasks t
      WHERE t.due_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 1 DAY)
        AND t.status != 'completed' AND t.deleted_at IS NULL AND t.assignee_id IS NOT NULL
    `);
    for (const task of dueSoon) {
      await pool.query(
        `INSERT IGNORE INTO notifications (user_id, type, task_id, message)
         SELECT ?, 'due_soon', ?, CONCAT('任务「', ?, '」即将到期')
         WHERE NOT EXISTS (SELECT 1 FROM notifications WHERE task_id=? AND type='due_soon' AND created_at > DATE_SUB(NOW(), INTERVAL 1 DAY))`,
        [task.assignee_id, task.id, task.title, task.id]
      );
    }

    // 已逾期的任务 → overdue 通知
    const [overdue] = await pool.query(`
      SELECT t.id, t.title, t.assignee_id FROM tasks t
      WHERE t.due_date < CURDATE() AND t.status != 'completed'
        AND t.deleted_at IS NULL AND t.assignee_id IS NOT NULL
    `);
    for (const task of overdue) {
      await pool.query(
        `INSERT IGNORE INTO notifications (user_id, type, task_id, message)
         SELECT ?, 'overdue', ?, CONCAT('任务「', ?, '」已逾期')
         WHERE NOT EXISTS (SELECT 1 FROM notifications WHERE task_id=? AND type='overdue' AND created_at > DATE_SUB(NOW(), INTERVAL 1 DAY))`,
        [task.assignee_id, task.id, task.title, task.id]
      );
    }
  } catch (err) {
    logger.error('到期通知定时任务执行失败:', err.message);
  }
}

/**
 * 启动定时任务
 * @param {number} intervalMs - 执行间隔（毫秒），默认30分钟
 * @returns {{ stop: Function }} 返回停止函数
 */
function start(intervalMs = 30 * 60 * 1000) {
  logger.info(`⏰ 到期通知定时任务已启动（每${intervalMs / 60000}分钟）`);
  checkDueNotifications(); // 立即执行一次
  const timer = setInterval(checkDueNotifications, intervalMs);
  return {
    stop: () => {
      clearInterval(timer);
      logger.info('定时任务已停止');
    }
  };
}

module.exports = { start, checkDueNotifications };
