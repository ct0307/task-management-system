/**
 * 任务管理控制器
 * 参考实验报告中的控制器设计模式
 */
const taskService = require('../../services/tasks/taskService');
const { success, fail } = require('../../utils/response');
const { ErrorCodes } = require('../../constants/errorCodes');
const { pool } = require('../../db');

const { auditLog } = taskService;

/**
 * GET /api/tasks
 * 获取任务列表（支持分页和limit参数）
 */
async function getTasks(req, res, next) {
  try {
    const filters = {
      status: req.query.status,
      category: req.query.category,
      priority: req.query.priority,
      search: req.query.search,
      assignee: req.query.assignee,
      dateRange: req.query.dateRange,
      page: req.query.page,
      pageSize: req.query.pageSize,
      limit: req.query.limit,
      sortField: req.query.sortField,
      sortOrder: req.query.sortOrder,
      includeSubtasks: req.query.includeSubtasks === '1' || req.query.includeSubtasks === 'true'
    };
    const tasks = await taskService.getAllTasks(filters, req.user);
    success(res, tasks);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/tasks/:id
 * 获取单个任务
 */
async function getTask(req, res, next) {
  try {
    const task = await taskService.getTaskById(req.params.id);
    success(res, task);
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/tasks
 * 创建新任务
 */
async function createTask(req, res, next) {
  try {
    const { title, description, status, priority, category_id, assignee_id, due_date } = req.body;
    
    if (!title || title.trim() === '') {
      return fail(res, ErrorCodes.VALIDATION_ERROR, '任务标题不能为空');
    }

    const task = await taskService.createTask({
      title, description, status, priority, category_id, assignee_id, due_date,
      created_by: req.user?.id
    });
    auditLog(task.id, req.user?.id, 'create', null, null, title);
    // 任务分配通知
    if (assignee_id && assignee_id !== req.user?.id) {
      const { pool } = require('../../db');
      await pool.query(
        'INSERT INTO notifications (user_id, type, task_id, message) VALUES (?, ?, ?, ?)',
        [assignee_id, 'assigned', task.id, `你被分配了任务「${title}」`]
      );
    }
    success(res, task, '任务创建成功', 201);
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/tasks/:id
 * 更新任务
 */
async function updateTask(req, res, next) {
  try {
    const oldTask = await taskService.getTaskById(req.params.id);
    const task = await taskService.updateTask(req.params.id, req.body);
    // 记录变更字段
    for (const key of ['status', 'priority', 'title', 'category_id', 'assignee_id', 'due_date']) {
      if (req.body[key] !== undefined && String(oldTask[key]) !== String(req.body[key])) {
        auditLog(req.params.id, req.user?.id, 'update', key, oldTask[key], req.body[key]);
      }
    }
    success(res, task, '任务更新成功');
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/tasks/:id
 * 删除任务
 */
async function deleteTask(req, res, next) {
  try {
    const result = await taskService.deleteTask(req.params.id);
    auditLog(req.params.id, req.user?.id, 'delete', null, null, null);
    success(res, result, '任务已移入回收站');
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/tasks/stats/overview
 * 获取任务统计
 */
async function getStats(req, res, next) {
  try {
    const stats = await taskService.getTaskStats(req.user);
    success(res, stats);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/tasks/categories
 * 获取所有分类
 */
async function getCategories(req, res, next) {
  try {
    const categories = await taskService.getAllCategories();
    success(res, categories);
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/tasks/categories
 * 创建分类
 */
async function createCategory(req, res, next) {
  try {
    const { name, color } = req.body;
    if (!name || name.trim() === '') {
      return fail(res, ErrorCodes.VALIDATION_ERROR, '分类名称不能为空');
    }
    const category = await taskService.createCategory({ name, color });
    success(res, category, '分类创建成功', 201);
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/tasks/categories/:id
 * 更新分类
 */
async function updateCategory(req, res, next) {
  try {
    const { name, color } = req.body;
    const category = await taskService.updateCategory(req.params.id, { name, color });
    success(res, category, '分类更新成功');
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/tasks/categories/:id
 * 删除分类（将相关任务 category_id 置空）
 */
async function deleteCategory(req, res, next) {
  try {
    await taskService.deleteCategory(req.params.id);
    success(res, null, '分类已删除');
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/tasks/users
 * 创建可分配的用户账号（简化注册，供任务分配使用）
 */
async function createUser(req, res, next) {
  try {
    const { username, real_name } = req.body;
    if (!username || username.trim().length < 2) {
      return fail(res, ErrorCodes.VALIDATION_ERROR, '用户名至少2个字符');
    }
    const user = await taskService.createAssignableUser({ username: username.trim(), real_name: real_name?.trim() || username.trim(), createdBy: req.user?.id });
    success(res, user, '用户创建成功', 201);
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/tasks/reorder
 * 看板列内重排序
 */
async function reorderTasks(req, res, next) {
  try {
    const { status, taskIds } = req.body;
    if (!status || !Array.isArray(taskIds) || taskIds.length === 0) {
      return fail(res, ErrorCodes.VALIDATION_ERROR, '请提供状态和任务 ID 列表');
    }
    const result = await taskService.reorderTasks(status, taskIds);
    success(res, result, '排序更新成功');
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/tasks/export
 * 导出任务数据
 */
async function exportTasks(req, res, next) {
  try {
    const type = req.query.format || 'json';
    const result = await taskService.exportTasks(type, req.query, req.user);

    if (result.format === 'csv') {
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
      res.send(result.content);
    } else {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
      res.json(result.content);
    }
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/tasks/batch
 * 批量删除任务
 */
async function batchDelete(req, res, next) {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return fail(res, ErrorCodes.VALIDATION_ERROR, '请提供要删除的任务 ID 列表');
    }
    const result = await taskService.batchDelete(ids);

    if (result.failedIds.length > 0) {
      success(res, result, `成功删除 ${result.deletedCount} 条，失败 ${result.failedIds.length} 条`);
    } else {
      success(res, result, `成功删除 ${result.deletedCount} 条任务`);
    }
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/tasks/batch
 * 批量更新任务
 */
async function batchUpdate(req, res, next) {
  try {
    const { ids, updates } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return fail(res, ErrorCodes.VALIDATION_ERROR, '请提供要更新的任务 ID 列表');
    }
    if (!updates || typeof updates !== 'object') {
      return fail(res, ErrorCodes.VALIDATION_ERROR, '请提供更新字段');
    }
    const result = await taskService.batchUpdate(ids, updates);

    if (result.failedIds.length > 0) {
      success(res, result, `成功更新 ${result.updatedCount} 条，失败 ${result.failedIds.length} 条`);
    } else {
      success(res, result, `成功更新 ${result.updatedCount} 条任务`);
    }
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/tasks/users
 * 获取可分配用户列表
 */
async function getAssignableUsers(req, res, next) {
  try {
    const users = await taskService.getAssignableUsers(req.user?.id);
    success(res, users);
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/tasks/:id/restore
 * 恢复已删除任务
 */
async function restoreTask(req, res, next) {
  try {
    const task = await taskService.restoreTask(req.params.id);
    success(res, task, '任务已恢复');
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/tasks/:id/permanent
 * 永久删除任务
 */
async function permanentDeleteTask(req, res, next) {
  try {
    const result = await taskService.permanentDeleteTask(req.params.id);
    success(res, result, '任务已永久删除');
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/tasks/stats/trend
 * 获取完成任务趋势
 */
async function getCompletionTrend(req, res, next) {
  try {
    const days = parseInt(req.query.days) || 14;
    const trend = await taskService.getCompletionTrend(Math.min(days, 90), req.user);
    success(res, trend);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/tasks/trash
 * 获取回收站列表
 */
async function getTrashList(req, res, next) {
  try {
    const { page, pageSize } = req.query;
    const data = await taskService.getTrashList({
      page, pageSize,
      userId: req.user.id,
      userRole: req.user.role
    });
    success(res, data);
  } catch (err) {
    next(err);
  }
}

// ====== 子任务 ======

async function getSubtasks(req, res, next) {
  try {
    const subtasks = await taskService.getSubtasks(req.params.id);
    success(res, subtasks);
  } catch (err) {
    next(err);
  }
}

async function createSubtask(req, res, next) {
  try {
    const { title, priority, due_date } = req.body;
    if (!title || title.trim() === '') {
      return fail(res, ErrorCodes.VALIDATION_ERROR, '子任务标题不能为空');
    }
    const subtask = await taskService.createSubtask({
      parent_id: parseInt(req.params.id),
      title: title.trim(),
      priority: priority || undefined,
      due_date: due_date || undefined,
      created_by: req.user?.id
    });
    success(res, subtask, '子任务创建成功', 201);
  } catch (err) {
    next(err);
  }
}

async function batchCreateSubtasks(req, res, next) {
  try {
    const { titles } = req.body;
    if (!titles || !Array.isArray(titles) || titles.length === 0) {
      return fail(res, ErrorCodes.VALIDATION_ERROR, '请提供子任务标题列表');
    }
    const validTitles = titles.map(t => (typeof t === 'string' ? t.trim() : '')).filter(Boolean);
    if (validTitles.length === 0) {
      return fail(res, ErrorCodes.VALIDATION_ERROR, '子任务标题不能为空');
    }
    const subtasks = await taskService.batchCreateSubtasks(
      parseInt(req.params.id), validTitles, req.user?.id
    );
    success(res, subtasks, `成功创建 ${subtasks.length} 个子任务`, 201);
  } catch (err) {
    next(err);
  }
}

async function updateSubtask(req, res, next) {
  try {
    const subtask = await taskService.updateSubtask(req.params.subtaskId, req.body);
    if (!subtask) return fail(res, ErrorCodes.NOT_FOUND, '子任务不存在');
    success(res, subtask, '子任务已更新');
  } catch (err) {
    next(err);
  }
}

async function reorderSubtasks(req, res, next) {
  try {
    const { taskIds } = req.body;
    if (!Array.isArray(taskIds) || taskIds.length === 0) {
      return fail(res, ErrorCodes.VALIDATION_ERROR, '请提供排序列表');
    }
    await taskService.reorderSubtasks(parseInt(req.params.id), taskIds);
    success(res, null, '排序已更新');
  } catch (err) {
    next(err);
  }
}

async function promoteSubtask(req, res, next) {
  try {
    const task = await taskService.promoteSubtask(req.params.subtaskId);
    success(res, task, '子任务已提升为独立任务');
  } catch (err) {
    next(err);
  }
}

async function demoteToSubtask(req, res, next) {
  try {
    const task = await taskService.demoteToSubtask(req.params.id, req.body.parent_id);
    success(res, task, '任务已转为子任务');
  } catch (err) {
    next(err);
  }
}

module.exports = {
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
};
