/**
 * 任务管理路由
 * RESTful API 设计
 */
const express = require('express');
const router = express.Router();
const { requireAuth, requireRole } = require('../middleware/auth');
const {
  getTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
  restoreTask,
  permanentDeleteTask,
  getTrashList,
  getStats,
  getCompletionTrend,
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  createUser,
  exportTasks,
  batchDelete,
  batchUpdate,
  reorderTasks,
  getAssignableUsers,
  getSubtasks,
  createSubtask,
  batchCreateSubtasks,
  updateSubtask,
  reorderSubtasks,
  promoteSubtask,
  demoteToSubtask
} = require('../controllers/tasks/taskController');
const { validate } = require('../middleware/validator');

// 可分配用户列表（需登录，放在 /:id 路由之前）
router.get('/users', requireAuth, getAssignableUsers);

// 任务统计（需登录）
router.get('/stats/overview', requireAuth, getStats);
router.get('/stats/trend', requireAuth, getCompletionTrend);

// 分类管理（需登录，所有用户可增删改）
router.get('/categories', requireAuth, getCategories);
router.post('/categories', requireAuth, createCategory);
router.put('/categories/:id', requireAuth, updateCategory);
router.delete('/categories/:id', requireAuth, deleteCategory);

// 简化用户创建（需登录，供任务分配使用）
router.post('/users', requireAuth, createUser);

// 导出任务数据（需登录）
router.get('/export', requireAuth, exportTasks);

// CSV 导入（需登录）
router.post('/import', requireAuth, async (req, res, next) => {
  const multer = require('multer');
  const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 1024 * 1024 * 5 } });
  upload.single('file')(req, res, async (err) => {
    if (err) return res.status(400).json({ code: 400, message: '文件上传失败' });
    if (!req.file) return res.status(400).json({ code: 400, message: '请上传CSV文件' });

    try {
      const csvText = req.file.buffer.toString('utf-8');
      const lines = csvText.split('\n').filter(l => l.trim());
      if (lines.length < 2) return res.status(400).json({ code: 400, message: 'CSV无数据行' });

      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      const titleIdx = headers.findIndex(h => h === '标题' || h === 'title');
      if (titleIdx < 0) return res.status(400).json({ code: 400, message: '缺少标题列' });

      const statusMap = { '待处理': 'pending', '进行中': 'in_progress', '已完成': 'completed' };
      const priorityMap = { '高': 'high', '中': 'medium', '低': 'low' };
      const { pool } = require('../db');

      let imported = 0;
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',').map(c => c.trim().replace(/^"|"$/g, ''));
        const title = cols[titleIdx];
        if (!title) continue;

        const status = cols[headers.indexOf('状态')] ? (statusMap[cols[headers.indexOf('状态')]] || 'pending') : 'pending';
        const priority = cols[headers.indexOf('优先级')] ? (priorityMap[cols[headers.indexOf('优先级')]] || 'medium') : 'medium';
        const description = cols[headers.findIndex(h => h === '描述' || h === 'description')] || '';

        await pool.query(
          'INSERT INTO tasks (title, description, status, priority, created_by) VALUES (?, ?, ?, ?, ?)',
          [title, description, status, priority, req.user?.id || null]
        );
        imported++;
      }

      require('../utils/response').success(res, { imported }, `成功导入 ${imported} 条任务`, 201);
    } catch (e) {
      next(e);
    }
  });
});

// 批量操作（需登录）
router.delete('/batch', requireAuth, batchDelete);
router.put('/batch', requireAuth, batchUpdate);

// 看板列内排序（需登录，放在 /:id 之前防止被 id 匹配）
router.put('/reorder', requireAuth, reorderTasks);

// 回收站（放在 /:id 之前）
router.get('/trash', requireAuth, getTrashList);

// 任务 CRUD（需登录）
router.get('/', requireAuth, getTasks);
router.get('/:id', requireAuth, getTask);
router.post('/', requireAuth, validate({
  title: 'required|string',
  priority: 'priority'
}), createTask);
router.put('/:id', requireAuth, validate({
  title: 'string',
  priority: 'priority',
  status: 'status'
}), updateTask);
router.delete('/:id', requireAuth, deleteTask);

// 回收站操作
router.put('/:id/restore', requireAuth, restoreTask);
router.delete('/:id/permanent', requireAuth, permanentDeleteTask);

// 子任务
router.get('/:id/subtasks', requireAuth, getSubtasks);
router.post('/:id/subtasks', requireAuth, createSubtask);
router.post('/:id/subtasks/batch', requireAuth, batchCreateSubtasks);
router.put('/:id/subtasks/reorder', requireAuth, reorderSubtasks);
router.put('/:id/subtasks/:subtaskId', requireAuth, updateSubtask);
router.put('/:id/subtasks/:subtaskId/promote', requireAuth, promoteSubtask);
router.put('/:id/demote', requireAuth, demoteToSubtask);

module.exports = router;
