/**
 * 任务评论路由
 */
const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { pool } = require('../db');
const { success, fail } = require('../utils/response');
const { ErrorCodes } = require('../constants/errorCodes');
const { AppError } = require('../middleware/errorHandler');

// GET /tasks/:taskId/comments
router.get('/tasks/:taskId/comments', requireAuth, async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const [rows] = await pool.query(`
      SELECT c.*, u.username, u.real_name, u.role
      FROM task_comments c
      LEFT JOIN users u ON c.user_id = u.id
      WHERE c.task_id = ?
      ORDER BY c.created_at ASC
    `, [taskId]);

    // 构建嵌套结构: 顶层评论 + 子回复
    const topLevel = [];
    const replies = {};
    for (const r of rows) {
      if (r.parent_id) {
        if (!replies[r.parent_id]) replies[r.parent_id] = [];
        replies[r.parent_id].push(r);
      } else {
        topLevel.push(r);
      }
    }
    for (const c of topLevel) {
      c.replies = replies[c.id] || [];
    }

    success(res, topLevel);
  } catch (err) {
    next(err);
  }
});

// POST /tasks/:taskId/comments
router.post('/tasks/:taskId/comments', requireAuth, async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const { content, parent_id } = req.body;
    if (!content || content.trim() === '') {
      return fail(res, ErrorCodes.VALIDATION_ERROR, '评论内容不能为空');
    }

    // 校验任务存在
    const [tasks] = await pool.query('SELECT id FROM tasks WHERE id = ?', [taskId]);
    if (tasks.length === 0) throw new AppError('任务不存在', 404);

    // 校验父评论
    if (parent_id) {
      const [parent] = await pool.query('SELECT id, task_id FROM task_comments WHERE id = ?', [parent_id]);
      if (parent.length === 0) throw new AppError('父评论不存在', 404);
      if (parent[0].task_id !== Number(taskId)) throw new AppError('父评论不属于此任务', 400);
    }

    const userId = req.user.id;
    const [result] = await pool.query(
      'INSERT INTO task_comments (task_id, user_id, content, parent_id) VALUES (?, ?, ?, ?)',
      [taskId, userId, content.trim(), parent_id || null]
    );

    const [rows] = await pool.query(`
      SELECT c.*, u.username, u.real_name, u.role
      FROM task_comments c LEFT JOIN users u ON c.user_id = u.id
      WHERE c.id = ?
    `, [result.insertId]);

    // 给任务负责人发送通知（如果不是自己评论自己的任务）
    const [task] = await pool.query('SELECT assignee_id, title FROM tasks WHERE id = ?', [taskId]);
    if (task.length > 0 && task[0].assignee_id && task[0].assignee_id !== userId) {
      await pool.query(
        'INSERT INTO notifications (user_id, type, task_id, message) VALUES (?, ?, ?, ?)',
        [task[0].assignee_id, 'comment', taskId, `任务「${task[0].title}」有新评论`]
      );
    }

    success(res, rows[0], '评论成功', 201);
  } catch (err) {
    next(err);
  }
});

// DELETE /comments/:id — 删除评论
router.delete('/comments/:id', requireAuth, async (req, res, next) => {
  try {
    const [existing] = await pool.query('SELECT * FROM task_comments WHERE id = ?', [req.params.id]);
    if (existing.length === 0) throw new AppError('评论不存在', 404);

    const comment = existing[0];
    if (comment.user_id !== req.user.id && req.user.role !== 'admin') {
      return fail(res, ErrorCodes.FORBIDDEN, '只能删除自己的评论');
    }

    await pool.query('DELETE FROM task_comments WHERE id = ?', [req.params.id]);
    success(res, null, '评论已删除');
  } catch (err) {
    next(err);
  }
});

module.exports = router;
