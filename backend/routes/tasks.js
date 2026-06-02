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

// 多格式导入（CSV / Excel / JSON，需登录）
// 前端已做解析，后端接收映射后的数据行
router.post('/import', requireAuth, async (req, res, next) => {
  try {
    const { rows } = req.body;

    // 如果前端通过 FormData 上传文件（兼容旧方式）
    if (!rows) {
      const multer = require('multer');
      const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 1024 * 1024 * 10 } });
      return upload.single('file')(req, res, async (err) => {
        if (err) return res.status(400).json({ code: 400, message: '文件上传失败' });
        if (!req.file) return res.status(400).json({ code: 400, message: '请上传文件' });

        try {
          const result = await parseAndImport(req.file, req.user);
          require('../utils/response').success(res, result, `成功导入 ${result.imported} 条任务`, 201);
        } catch (e) { next(e); }
      });
    }

    // 前端已解析，直接导入映射后的数据
    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ code: 400, message: '无有效数据行' });
    }

    const { pool } = require('../db');
    const statusMap = { '待处理': 'pending', '进行中': 'in_progress', '已完成': 'completed' };
    const priorityMap = { '高': 'high', '中': 'medium', '低': 'low' };

    let imported = 0;
    const batch = [];
    for (const row of rows) {
      const title = row.title;
      if (!title) continue;

      const status = statusMap[row.status] || row.status || 'pending';
      const priority = priorityMap[row.priority] || row.priority || 'medium';
      const description = row.description || '';
      const categoryId = row.category_id || null;
      const dueDate = row.due_date || null;
      const assigneeId = row.assignee_id || null;

      batch.push([title, description, status, priority, categoryId, dueDate, assigneeId, req.user?.id || null]);
      imported++;
    }

    if (batch.length === 0) {
      return res.status(400).json({ code: 400, message: '无有效数据：所有行缺少标题' });
    }

    // 批量插入（每次最多 100 条）
    const BATCH_SIZE = 100;
    for (let i = 0; i < batch.length; i += BATCH_SIZE) {
      const chunk = batch.slice(i, i + BATCH_SIZE);
      const placeholders = chunk.map(() => '(?, ?, ?, ?, ?, ?, ?, ?)').join(', ');
      await pool.query(
        `INSERT INTO tasks (title, description, status, priority, category_id, due_date, assignee_id, created_by) VALUES ${placeholders}`,
        chunk.flat()
      );
    }

    require('../utils/response').success(res, { imported }, `成功导入 ${imported} 条任务`, 201);
  } catch (e) {
    next(e);
  }
});

// 文件解析辅助（兼容旧的 FormData 上传方式）
async function parseAndImport(file, user) {
  const ext = file.originalname.split('.').pop().toLowerCase();
  const { pool } = require('../db');
  let rows = [];

  if (ext === 'csv') {
    const Papa = require('papaparse');
    const result = Papa.parse(file.buffer.toString('utf-8'), { header: true, skipEmptyLines: true });
    rows = result.data.filter(r => Object.values(r).some(v => v));
  } else if (ext === 'xlsx' || ext === 'xls') {
    const XLSX = require('xlsx');
    const wb = XLSX.read(file.buffer, { type: 'buffer' });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
  } else if (ext === 'json') {
    const data = JSON.parse(file.buffer.toString('utf-8'));
    rows = Array.isArray(data) ? data : (data.data || data.tasks || data.rows || []);
  } else {
    throw new Error(`不支持的文件格式: .${ext}`);
  }

  if (rows.length === 0) throw new Error('文件中无可用数据');

  // 智能列映射
  const fieldMap = {
    title: ['标题','title','任务名','名称','name','task'],
    description: ['描述','description','详情','备注','desc','note'],
    status: ['状态','status'],
    priority: ['优先级','priority'],
    due_date: ['截止','due','deadline','日期','date','到期','截止日期'],
    category_id: ['分类','category','类别'],
    assignee_id: ['负责人','assignee','责任人','owner'],
  };

  const headers = Object.keys(rows[0]);
  const colMap = {};
  for (const [field, patterns] of Object.entries(fieldMap)) {
    const h = headers.find(h => patterns.some(p => h.toLowerCase().includes(p.toLowerCase())));
    if (h) colMap[h] = field;
  }

  const statusMap = { '待处理':'pending','进行中':'in_progress','已完成':'completed' };
  const priorityMap = { '高':'high','中':'medium','低':'low' };

  let imported = 0;
  const batch = [];
  for (const row of rows) {
    const title = row[Object.keys(colMap).find(k => colMap[k] === 'title')];
    if (!title) continue;
    const status = statusMap[row[Object.keys(colMap).find(k => colMap[k] === 'status')]] || 'pending';
    const priority = priorityMap[row[Object.keys(colMap).find(k => colMap[k] === 'priority')]] || 'medium';
    batch.push([title, row[Object.keys(colMap).find(k => colMap[k] === 'description')] || '', status, priority, user?.id || null]);
    imported++;
  }

  if (batch.length === 0) throw new Error('所有行缺少标题列');

  const BATCH_SIZE = 100;
  for (let i = 0; i < batch.length; i += BATCH_SIZE) {
    const chunk = batch.slice(i, i + BATCH_SIZE);
    const placeholders = chunk.map(() => '(?, ?, ?, ?, ?)').join(', ');
    await pool.query(`INSERT INTO tasks (title, description, status, priority, created_by) VALUES ${placeholders}`, chunk.flat());
  }

  return { imported };
}

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
router.post('/parse', requireAuth, async (req, res) => {
  const { execFile } = require('child_process');
  const { filepath } = req.body;
  if (!filepath) return res.status(400).json({ code: 400, message: '缺少 filepath' });
  execFile('python3', [
    'C:/Users/chentao/Desktop/轻量化任务管理系统/parse_engine.py',
    filepath
  ], { timeout: 60000, maxBuffer: 10*1024*1024 }, (err, stdout, stderr) => {
    if (err) return res.status(500).json({ code: 500, message: '解析失败: ' + (stderr || err.message) });
    try {
      const result = JSON.parse(stdout);
      res.json({ code: 200, data: result });
    } catch {
      res.json({ code: 200, data: { full_text: stdout } });
    }
  });
});

module.exports = router;
