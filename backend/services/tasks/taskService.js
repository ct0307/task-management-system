/**
 * 任务管理服务层
 * 参考实验报告中的服务层设计（三层架构）
 * 业务逻辑层，调用 Model 层
 */
const Task = require('../../models/Task');
const { pool } = require('../../db');
const { AppError } = require('../../middleware/errorHandler');

/**
 * 审计日志辅助函数（统一入口，供 service 和 controller 复用）
 */
const auditLog = async (taskId, userId, action, field, oldValue, newValue) => {
  try {
    await pool.query(
      'INSERT INTO task_audit_log (task_id, user_id, action, field, old_value, new_value) VALUES (?, ?, ?, ?, ?, ?)',
      [taskId, userId || null, action, field || null, oldValue?.toString().substring(0, 500) || null, newValue?.toString().substring(0, 500) || null]
    );
  } catch { /* 审计日志失败不影响主流程 */ }
};

/**
 * 获取所有任务列表（自动按用户隔离）
 */
async function getAllTasks(filters = {}, user = null) {
  return await Task.findAll({
    ...filters,
    userId: user?.id,
    userRole: user?.role,
    viewAll: filters.viewAll === 'true' || filters.viewAll === true
  });
}

/**
 * 获取单个任务详情
 */
async function getTaskById(id) {
  const task = await Task.findById(id);
  if (!task) {
    throw new AppError('任务不存在', 404);
  }
  return task;
}

/**
 * 创建新任务
 */
async function createTask(taskData) {
  const id = await Task.create(taskData);
  return await getTaskById(id);
}

/**
 * 更新任务
 */
async function updateTask(id, taskData) {
  await getTaskById(id); // 确保任务存在
  await Task.update(id, taskData);
  return await getTaskById(id);
}

/**
 * 软删除任务（移入回收站）
 */
async function deleteTask(id) {
  await getTaskById(id);
  await Task.remove(id);
  return { message: '任务已移入回收站' };
}

/**
 * 恢复已删除任务
 */
async function restoreTask(id) {
  const task = await Task.restore(id);
  if (!task) throw new AppError('任务不存在或未被删除', 404);
  return task;
}

/**
 * 永久删除任务
 */
async function permanentDeleteTask(id) {
  await Task.permanentRemove(id);
  return { message: '任务已永久删除' };
}

/**
 * 获取回收站列表
 */
async function getTrashList(filters = {}) {
  return await Task.findTrash(filters);
}

/**
 * 获取任务统计
 */
async function getTaskStats(user = null) {
  return await Task.getStats(user?.id, user?.role);
}

/**
 * 获取所有分类
 */
async function getAllCategories() {
  return await Task.getAllCategories();
}

/**
 * 创建分类
 */
async function createCategory(data) {
  return await Task.createCategory(data);
}

async function updateCategory(id, data) {
  return await Task.updateCategory(id, data);
}

async function deleteCategory(id) {
  return await Task.deleteCategory(id);
}

/**
 * 导出任务数据
 */
async function exportTasks(type = 'json', filters = {}, user = null) {
  const userFilter = (user?.id && user?.role !== 'admin')
    ? ' AND (t.created_by = ? OR t.assignee_id = ?)' : '';
  const userParams = (user?.id && user?.role !== 'admin') ? [user.id, user.id] : [];

  const [rows] = await pool.query(`
    SELECT t.id, t.title, t.description, t.status, t.priority,
           c.name as category_name, u.real_name as assignee_name,
           t.due_date, t.created_at, t.updated_at
    FROM tasks t
    LEFT JOIN categories c ON t.category_id = c.id
    LEFT JOIN users u ON t.assignee_id = u.id
    WHERE t.deleted_at IS NULL${userFilter}
    ORDER BY t.created_at DESC
  `, userParams);

  if (type === 'csv') {
    // CSV 安全转义：防止 Excel 公式注入
    const safeCSV = (val) => {
      const str = String(val ?? '');
      const escaped = `"${str.replace(/"/g, '""')}"`;
      // 以 = + - @ 开头的值前加 TAB 防止公式执行
      if (/^[=+\-@]/.test(str)) return `"\t${str.replace(/"/g, '""')}"`;
      return escaped;
    };

    const headers = ['ID', '标题', '描述', '状态', '优先级', '分类', '负责人', '截止日期', '创建时间', '更新时间'];
    const statusMap = { pending: '待处理', in_progress: '进行中', completed: '已完成' };
    const priorityMap = { high: '高', medium: '中', low: '低' };

    const csvRows = rows.map(row => [
      row.id,
      safeCSV(row.title),
      safeCSV(row.description),
      statusMap[row.status] || row.status,
      priorityMap[row.priority] || row.priority,
      row.category_name || '',
      row.assignee_name || '',
      row.due_date ? row.due_date.toISOString().split('T')[0] : '',
      row.created_at ? new Date(row.created_at).toLocaleString('zh-CN') : '',
      row.updated_at ? new Date(row.updated_at).toLocaleString('zh-CN') : ''
    ]);

    const csvContent = [
      headers.join(','),
      ...csvRows.map(r => r.join(','))
    ].join('\n');

    return { format: 'csv', content: '\uFEFF' + csvContent, filename: `tasks_export_${Date.now()}.csv` };
  }

  // JSON 导出
  const exportData = rows.map(row => ({
    id: row.id,
    title: row.title,
    description: row.description,
    status: row.status,
    priority: row.priority,
    category: row.category_name,
    assignee: row.assignee_name,
    due_date: row.due_date ? row.due_date.toISOString().split('T')[0] : null,
    created_at: row.created_at,
    updated_at: row.updated_at
  }));

  return { format: 'json', content: exportData, filename: `tasks_export_${Date.now()}.json` };
}

/**
 * 批量删除任务
 */
async function batchDelete(ids) {
  if (ids.length === 0) return { deletedCount: 0, failedIds: [], errors: [] };

  const [res] = await pool.query('DELETE FROM tasks WHERE id IN (?)', [ids]);
  return { deletedCount: res.affectedRows, failedIds: [], errors: [] };
}

/**
 * 批量更新任务
 */
async function batchUpdate(ids, updates) {
  if (ids.length === 0) throw new AppError('ID 列表不能为空', 400);

  const allowedFields = ['status', 'priority', 'category_id', 'assignee_id'];
  const filteredUpdates = {};
  for (const key of allowedFields) {
    if (updates[key] !== undefined) filteredUpdates[key] = updates[key];
  }

  if (Object.keys(filteredUpdates).length === 0) {
    throw new AppError('没有需要更新的有效字段', 400);
  }

  const setClauses = Object.keys(filteredUpdates).map(k => `${k} = ?`).join(', ');
  const values = [...Object.values(filteredUpdates), ids];

  const [res] = await pool.query(
    `UPDATE tasks SET ${setClauses} WHERE id IN (?)`,
    values
  );

  return { updatedCount: res.affectedRows, failedIds: [], errors: [] };
}

/**
 * 看板列内重排序
 */
async function reorderTasks(status, taskIds) {
  if (!Array.isArray(taskIds) || taskIds.length === 0) {
    throw new AppError('任务 ID 列表不能为空', 400);
  }
  // 更新排序（事务内）
  await Task.updateSortOrder(taskIds);
  // 统一更新状态（处理跨列拖拽）
  await pool.query('UPDATE tasks SET status = ? WHERE id IN (?)', [status, taskIds]);
  return { reorderedCount: taskIds.length };
}

/**
 * 获取完成任务趋势
 */
async function getCompletionTrend(days, user = null) {
  return await Task.getCompletionTrend(days, user?.id, user?.role);
}

/**
 * 获取可分配用户列表（供任务创建/编辑时选择负责人）
 */
async function getAssignableUsers(userId) {
  // 只返回：自己 + 自己创建的成员（默认只有自己）
  const [rows] = await pool.query(
    'SELECT id, username, real_name, role FROM users WHERE id = ? OR created_by = ? ORDER BY role DESC, username',
    [userId, userId]
  );
  return rows;
}

async function createAssignableUser({ username, real_name, createdBy }) {
  return await Task.createAssignableUser({ username, real_name, createdBy });
}

// ====== 子任务 ======

async function getSubtasks(taskId) {
  return await Task.findSubtasks(taskId);
}

async function createSubtask({ parent_id, title, priority, due_date, created_by }) {
  const id = await Task.createSubtask({ parent_id, title, priority, due_date, created_by });
  const [rows] = await pool.query(
    `SELECT t.*, c.name as category_name, u.real_name as assignee_name
     FROM tasks t LEFT JOIN categories c ON t.category_id = c.id
     LEFT JOIN users u ON t.assignee_id = u.id WHERE t.id = ?`, [id]
  );
  return rows[0];
}

async function batchCreateSubtasks(parentId, titles, createdBy) {
  const ids = await Task.batchCreateSubtasks(parentId, titles, createdBy);
  // 返回所有创建的子任务
  const [rows] = await pool.query(
    `SELECT t.*, c.name as category_name, u.real_name as assignee_name
     FROM tasks t LEFT JOIN categories c ON t.category_id = c.id
     LEFT JOIN users u ON t.assignee_id = u.id
     WHERE t.id IN (?) ORDER BY t.sort_order ASC`, [ids]
  );
  return rows;
}

async function updateSubtask(id, updates) {
  await Task.updateSubtask(id, updates);
  const [rows] = await pool.query(
    `SELECT t.*, c.name as category_name, u.real_name as assignee_name
     FROM tasks t LEFT JOIN categories c ON t.category_id = c.id
     LEFT JOIN users u ON t.assignee_id = u.id WHERE t.id = ?`, [id]
  );
  return rows[0] || null;
}

async function reorderSubtasks(parentId, taskIds) {
  return await Task.reorderSubtasks(parentId, taskIds);
}

async function promoteSubtask(id) {
  return await Task.promoteSubtask(id);
}

async function demoteToSubtask(id, parentId) {
  return await Task.demoteToSubtask(id, parentId);
}

module.exports = {
  auditLog,
  auditLog,
  getAllTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  restoreTask,
  permanentDeleteTask,
  getTrashList,
  getTaskStats,
  getCompletionTrend,
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  createAssignableUser,
  exportTasks,
  batchDelete,
  batchUpdate,
  reorderTasks,
  getSubtasks,
  createSubtask,
  batchCreateSubtasks,
  updateSubtask,
  reorderSubtasks,
  promoteSubtask,
  demoteToSubtask,
  getAssignableUsers
};
