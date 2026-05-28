/**
 * 通知管理路由
 */
const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { pool } = require('../db');
const { success } = require('../utils/response');

// GET /notifications — 获取通知列表
router.get('/notifications', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { limit = 50 } = req.query;
    const [rows] = await pool.query(
      `SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT ?`,
      [userId, Number(limit)]
    );
    success(res, rows);
  } catch (err) {
    next(err);
  }
});

// GET /notifications/unread-count — 获取未读数量
router.get('/notifications/unread-count', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const [rows] = await pool.query(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0',
      [userId]
    );
    success(res, { count: rows[0].count });
  } catch (err) {
    next(err);
  }
});

// PUT /notifications/:id/read — 标记为已读
router.put('/notifications/:id/read', requireAuth, async (req, res, next) => {
  try {
    await pool.query('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    success(res, null, '已标记为已读');
  } catch (err) {
    next(err);
  }
});

// PUT /notifications/read-all — 全部已读
router.put('/notifications/read-all', requireAuth, async (req, res, next) => {
  try {
    await pool.query('UPDATE notifications SET is_read = 1 WHERE user_id = ?', [req.user.id]);
    success(res, null, '全部已读');
  } catch (err) {
    next(err);
  }
});

module.exports = router;
