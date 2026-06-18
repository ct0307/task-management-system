/**
 * 任务管理路由
 * RESTful API 设计
 */
const express = require('express');
const multer = require('multer');
const router = express.Router();
const { requireAuth, requireRole } = require('../middleware/auth');
const { success } = require('../utils/response');
const { importTaskRows, importUploadedTaskFile } = require('../services/tasks/taskImportService');
const { parseFileWithEngine } = require('../services/tasks/parseService');
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

// 多格式导入（CSV / Excel / JSON，需登录）
// 前端已做解析，后端接收映射后的数据行
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 1024 * 1024 * 10 } });

router.post('/import', requireAuth, async (req, res, next) => {
  try {
    const { rows } = req.body;

    if (!rows) {
      return upload.single('file')(req, res, async (err) => {
        if (err) return res.status(400).json({ code: 400, message: '文件上传失败' });
        if (!req.file) return res.status(400).json({ code: 400, message: '请上传文件' });

        try {
          const result = await importUploadedTaskFile(req.file, req.user);
          success(res, result, `成功导入 ${result.imported} 条任务`, 201);
        } catch (error) {
          next(error);
        }
      });
    }

    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ code: 400, message: '无有效数据行' });
    }

    const result = await importTaskRows(rows, req.user);
    success(res, result, `成功导入 ${result.imported} 条任务`, 201);
  } catch (error) {
    next(error);
  }
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

// 文件解析（PDF/图片/Word，调用本地 Python 引擎）
router.post('/parse', requireAuth, async (req, res, next) => {
  try {
    const { filepath } = req.body;
    if (!filepath) return res.status(400).json({ code: 400, message: '缺少 filepath' });

    const result = await parseFileWithEngine(filepath);
    res.json({ code: 200, data: result });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
