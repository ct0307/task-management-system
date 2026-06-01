/**
 * 任务 Model 层
 * 职责：封装所有任务相关的 SQL 操作
 * 不含业务辑，仅数据访问
 */
const { pool } = require('../db');

/**
 * 获取所有任务（支持筛选）
 */
const SORTABLE_FIELDS = {
  title: 't.title', status: 't.status', priority: 't.priority',
  due_date: 't.due_date', created_at: 't.created_at', updated_at: 't.updated_at',
  category_name: 'c.name'
};

async function findAll({ status, category, priority, search, assignee, dateRange, page, pageSize, limit, sortField, sortOrder, includeDeleted, includeSubtasks, userId, userRole } = {}) {
  const hasSearch = search && search.trim() !== '';
  let query = `
    SELECT t.*, c.name as category_name, u.real_name as assignee_name,
    creator.real_name as creator_name,
    parent.title as parent_title,
    (SELECT COUNT(*) FROM tasks sub WHERE sub.parent_id = t.id AND sub.deleted_at IS NULL) as subtask_count,
    (SELECT COUNT(*) FROM tasks sub WHERE sub.parent_id = t.id AND sub.deleted_at IS NULL AND sub.status = 'completed') as subtask_done
    FROM tasks t
    LEFT JOIN categories c ON t.category_id = c.id
    LEFT JOIN users u ON t.assignee_id = u.id
    LEFT JOIN users creator ON t.created_by = creator.id
    LEFT JOIN tasks parent ON t.parent_id = parent.id
    WHERE 1=1
  `;
  const params = [];

  // 未搜索且未明确要求含子任务时，只看顶层任务
  if (!hasSearch && !includeSubtasks) {
    query += ' AND t.parent_id IS NULL';
  }

  // 用户数据隔离
  if (userId && userRole !== 'admin') {
    query += ' AND (t.created_by = ? OR t.assignee_id = ?)';
    params.push(userId, userId);
  }

  if (!includeDeleted) { query += ' AND t.deleted_at IS NULL'; }
  if (status) { query += ' AND t.status = ?'; params.push(status); }
  if (category) { query += ' AND t.category_id = ?'; params.push(category); }
  if (priority) { query += ' AND t.priority = ?'; params.push(priority); }
  if (assignee) { query += ' AND t.assignee_id = ?'; params.push(Number(assignee)); }
  if (hasSearch) { query += ' AND (t.title LIKE ? OR t.description LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }

  // 日期范围筛选
  if (dateRange === 'today') { query += ' AND DATE(t.due_date) = CURDATE()'; }
  else if (dateRange === 'week') { query += ' AND t.due_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY)'; }
  else if (dateRange === 'month') { query += ' AND t.due_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY)'; }
  else if (dateRange === 'overdue') { query += ' AND t.due_date < CURDATE() AND t.status != \'completed\''; }

  const orderCol = SORTABLE_FIELDS[sortField] || 't.sort_order';
  const orderDir = sortOrder === 'ascend' ? 'ASC' : sortOrder === 'descend' ? 'DESC' : 'ASC';
  query += ` ORDER BY ${orderCol} ${orderDir}, t.created_at DESC`;

  if (limit) {
    query += ' LIMIT ?';
    params.push(Number(limit));
    const [rows] = await pool.query(query, params);
    return rows;
  }

  if (page && pageSize) {
    const countParams = [...params];
    let countQuery = `SELECT COUNT(*) as total FROM tasks t
       LEFT JOIN categories c ON t.category_id = c.id
       LEFT JOIN users u ON t.assignee_id = u.id
       WHERE 1=1`;
    // 用户数据隔离（count 查询也需同步）
    if (userId && userRole !== 'admin') {
      countQuery += ' AND (t.created_by = ? OR t.assignee_id = ?)';
    }
    if (!includeDeleted) countQuery += ' AND t.deleted_at IS NULL';
    if (!hasSearch) countQuery += ' AND t.parent_id IS NULL'; // 非搜索时只统计顶层任务
    if (status) countQuery += ' AND t.status = ?';
    if (category) countQuery += ' AND t.category_id = ?';
    if (priority) countQuery += ' AND t.priority = ?';
    if (search) countQuery += ' AND (t.title LIKE ? OR t.description LIKE ?)';
    const countResult = await pool.query(countQuery, countParams);
    const total = countResult[0][0].total;

    const pageNum = Number(page);
    const sizeNum = Number(pageSize);
    const offset = (pageNum - 1) * sizeNum;
    query += ' LIMIT ? OFFSET ?';
    params.push(sizeNum, offset);
    const [rows] = await pool.query(query, params);
    return {
      data: rows,
      total,
      page: pageNum,
      pageSize: sizeNum,
      totalPages: Math.ceil(total / sizeNum)
    };
  }

  const [rows] = await pool.query(query, params);
  return rows;
}

/**
 * 根据 ID 查询单个任务
 */
async function findById(id) {
  const [rows] = await pool.query(`
    SELECT t.*, c.name as category_name, u.real_name as assignee_name,
    (SELECT COUNT(*) FROM tasks sub WHERE sub.parent_id = t.id AND sub.deleted_at IS NULL) as subtask_count
    FROM tasks t
    LEFT JOIN categories c ON t.category_id = c.id
    LEFT JOIN users u ON t.assignee_id = u.id
    WHERE t.id = ?
  `, [id]);
  return rows.length > 0 ? rows[0] : null;
}

/**
 * 创建任务
 */
async function create({ title, description, status, priority, category_id, assignee_id, due_date, created_by, recurrence }) {
  // 获取当前状态下的最大 sort_order
  const [maxRows] = await pool.query(
    'SELECT COALESCE(MAX(sort_order), 0) + 1 AS next_order FROM tasks WHERE status = ?',
    [status || 'pending']
  );
  const sortOrder = maxRows[0].next_order;

  const [result] = await pool.query(`
    INSERT INTO tasks (title, description, status, priority, category_id, assignee_id, due_date, sort_order, created_by, recurrence)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [title, description || '', status || 'pending', priority || 'medium', category_id || null, assignee_id || null, due_date || null, sortOrder, created_by || null, recurrence || null]);
  return result.insertId;
}

/**
 * 更新任务
 */
async function update(id, updates) {
  const allowedFields = ['title', 'description', 'status', 'priority', 'category_id', 'assignee_id', 'due_date', 'recurrence'];
  const fields = [];
  const params = [];

  for (const field of allowedFields) {
    if (updates[field] !== undefined) {
      fields.push(`${field} = ?`);
      params.push(updates[field]);
    }
  }

  if (fields.length === 0) return false;

  params.push(id);
  await pool.query(`UPDATE tasks SET ${fields.join(', ')} WHERE id = ?`, params);
  return true;
}

/**
 * 批量更新排序（事务内逐条更新）
 */
async function updateSortOrder(taskIds) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    for (let i = 0; i < taskIds.length; i++) {
      await conn.query('UPDATE tasks SET sort_order = ? WHERE id = ?', [i, taskIds[i]]);
    }
    await conn.commit();
    return true;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

/**
 * 软删除任务
 */
async function remove(id) {
  await pool.query('UPDATE tasks SET deleted_at = NOW() WHERE id = ? AND deleted_at IS NULL', [id]);
  return true;
}

/**
 * 恢复已删除任务
 */
async function restore(id) {
  await pool.query('UPDATE tasks SET deleted_at = NULL WHERE id = ?', [id]);
  const [rows] = await pool.query(
    `SELECT t.*, c.name as category_name, u.real_name as assignee_name
     FROM tasks t LEFT JOIN categories c ON t.category_id = c.id
     LEFT JOIN users u ON t.assignee_id = u.id WHERE t.id = ?`, [id]
  );
  return rows[0] || null;
}

/**
 * 永久删除任务（物理删除）
 */
async function permanentRemove(id) {
  await pool.query('DELETE FROM tasks WHERE id = ? AND deleted_at IS NOT NULL', [id]);
  return true;
}

/**
 * 获取回收站列表
 */
async function findTrash({ page = 1, pageSize = 20, userId, userRole } = {}) {
  const userFilter = (userId && userRole !== 'admin')
    ? ' AND (t.created_by = ? OR t.assignee_id = ?)' : '';
  const userParams = (userId && userRole !== 'admin') ? [userId, userId] : [];

  const countParams = userRole !== 'admin' ? userParams : [];
  const countResult = await pool.query(
    `SELECT COUNT(*) as total FROM tasks t WHERE t.deleted_at IS NOT NULL${userFilter}`,
    countParams
  );
  const total = countResult[0][0].total;
  const offset = (Number(page) - 1) * Number(pageSize);

  let query = `
    SELECT t.*, c.name as category_name, u.real_name as assignee_name
    FROM tasks t
    LEFT JOIN categories c ON t.category_id = c.id
    LEFT JOIN users u ON t.assignee_id = u.id
    WHERE t.deleted_at IS NOT NULL${userFilter}
    ORDER BY t.deleted_at DESC
    LIMIT ? OFFSET ?
  `;
  const params = [...(userRole !== 'admin' ? userParams : []), Number(pageSize), offset];
  const [rows] = await pool.query(query, params);
  return { data: rows, total, page: Number(page), pageSize: Number(pageSize) };
}

/**
 * 获取任务统计
 */
async function getStats(userId, userRole) {
  const userFilter = (userId && userRole !== 'admin')
    ? ' AND (t.created_by = ? OR t.assignee_id = ?)' : '';
  const recurrenceFilter = ' AND t.recurrence IS NULL';
  const userParams = (userId && userRole !== 'admin') ? [userId, userId] : [];
  // 排除父任务（有子任务的视为容器，不计入总数）
  const noParentFilter = ' AND NOT EXISTS (SELECT 1 FROM tasks sub WHERE sub.parent_id = t.id AND sub.deleted_at IS NULL)';

  const [total] = await pool.query(
    `SELECT COUNT(*) as count FROM tasks t WHERE t.deleted_at IS NULL${userFilter}${noParentFilter}${recurrenceFilter}`,
    userParams
  );
  const [byStatus] = await pool.query(
    `SELECT t.status, COUNT(*) as count FROM tasks t WHERE t.deleted_at IS NULL${userFilter}${noParentFilter}${recurrenceFilter} GROUP BY t.status`,
    userParams
  );
  const [byPriority] = await pool.query(
    `SELECT t.priority, COUNT(*) as count FROM tasks t WHERE t.deleted_at IS NULL${userFilter}${noParentFilter}${recurrenceFilter} GROUP BY t.priority`,
    userParams
  );
  const [byCategory] = await pool.query(
    `SELECT c.name, c.color, COUNT(t.id) as count
     FROM categories c
     LEFT JOIN (
       SELECT * FROM tasks WHERE deleted_at IS NULL AND recurrence IS NULL
       ${userFilter ? `AND (created_by = ? OR assignee_id = ?)` : ''}
       AND NOT EXISTS (SELECT 1 FROM tasks sub WHERE sub.parent_id = tasks.id AND sub.deleted_at IS NULL)
     ) t ON c.id = t.category_id
     GROUP BY c.id, c.name, c.color`,
    userParams
  );
  const [overdue] = await pool.query(
    `SELECT COUNT(*) as count
     FROM tasks t
     WHERE t.due_date < CURDATE() AND t.status != 'completed' AND t.deleted_at IS NULL${userFilter}${noParentFilter}${recurrenceFilter}`,
    userParams
  );

  return {
    total: total[0].count,
    byStatus: byStatus.reduce((acc, row) => ({ ...acc, [row.status]: row.count }), {}),
    byPriority: byPriority.reduce((acc, row) => ({ ...acc, [row.priority]: row.count }), {}),
    byCategory: byCategory.reduce((acc, row) => ({ ...acc, [row.name]: { name: row.name, color: row.color, count: row.count } }), {}),
    overdue: overdue[0].count
  };
}

/**
 * 获取完成任务趋势（最近 N 天每天完成数）
 */
async function getCompletionTrend(days = 14, userId, userRole) {
  const userFilter = (userId && userRole !== 'admin')
    ? ' AND (created_by = ? OR assignee_id = ?)' : '';
  const userParams = (userId && userRole !== 'admin') ? [userId, userId] : [];

  const [rows] = await pool.query(`
    SELECT DATE(updated_at) as date, COUNT(*) as count
    FROM tasks
    WHERE status = 'completed' AND deleted_at IS NULL AND recurrence IS NULL
      AND updated_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
      ${userFilter}
    GROUP BY DATE(updated_at)
    ORDER BY date ASC
  `, [days, ...userParams]);

  // 填充没有数据的日期为 0
  const result = [];
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const found = rows.find(r => {
      const rd = new Date(r.date);
      return rd.toISOString().split('T')[0] === dateStr;
    });
    result.push({ date: dateStr, count: found ? found.count : 0 });
  }
  return result;
}

/**
 * 获取所有分类
 */
async function getAllCategories() {
  const [rows] = await pool.query('SELECT * FROM categories ORDER BY name');
  return rows;
}

/**
 * 创建分类
 */
async function createCategory({ name, color }) {
  const [result] = await pool.query(
    'INSERT INTO categories (name, color) VALUES (?, ?)',
    [name, color || '#1890ff']
  );
  const [rows] = await pool.query('SELECT * FROM categories WHERE id = ?', [result.insertId]);
  return rows[0];
}

async function updateCategory(id, { name, color }) {
  const fields = [];
  const params = [];
  if (name !== undefined) { fields.push('name = ?'); params.push(name); }
  if (color !== undefined) { fields.push('color = ?'); params.push(color); }
  if (fields.length === 0) return null;
  params.push(id);
  await pool.query(`UPDATE categories SET ${fields.join(', ')} WHERE id = ?`, params);
  const [rows] = await pool.query('SELECT * FROM categories WHERE id = ?', [id]);
  return rows[0] || null;
}

async function deleteCategory(id) {
  // 将引用此分类的任务置空
  await pool.query('UPDATE tasks SET category_id = NULL WHERE category_id = ?', [id]);
  await pool.query('DELETE FROM categories WHERE id = ?', [id]);
  return true;
}

async function createAssignableUser({ username, real_name, createdBy }) {
  const bcrypt = require('bcryptjs');
  const hashed = await bcrypt.hash('123456', 10);
  const [result] = await pool.query(
    'INSERT INTO users (username, password, role, real_name, created_by) VALUES (?, ?, ?, ?, ?)',
    [username, hashed, 'user', real_name || username, createdBy || null]
  );
  return { id: result.insertId, username, role: 'user', real_name: real_name || username };
}

// ====== 子任务 ======

async function findSubtasks(taskId) {
  const [rows] = await pool.query(`
    SELECT t.*, c.name as category_name, u.real_name as assignee_name,
    (SELECT COUNT(*) FROM tasks sub WHERE sub.parent_id = t.id AND sub.deleted_at IS NULL) as subtask_count,
    (SELECT COUNT(*) FROM tasks sub WHERE sub.parent_id = t.id AND sub.deleted_at IS NULL AND sub.status = 'completed') as subtask_done
    FROM tasks t
    LEFT JOIN categories c ON t.category_id = c.id
    LEFT JOIN users u ON t.assignee_id = u.id
    WHERE t.parent_id = ? AND t.deleted_at IS NULL
    ORDER BY t.sort_order ASC, t.created_at ASC
  `, [taskId]);
  return rows;
}

async function createSubtask({ parent_id, title, priority, due_date, created_by }) {
  // 查询父任务获取默认值
  const [[parent]] = await pool.query(
    'SELECT priority, due_date FROM tasks WHERE id = ?', [parent_id]
  );
  // 有指定则用指定的，否则继承父任务
  const finalPriority = priority || parent?.priority || 'medium';
  const finalDueDate = due_date || parent?.due_date || null;
  const [result] = await pool.query(
    'INSERT INTO tasks (parent_id, title, status, priority, due_date, created_by) VALUES (?, ?, ?, ?, ?, ?)',
    [parent_id, title, 'pending', finalPriority, finalDueDate, created_by || null]
  );
  return result.insertId;
}

async function getSubtaskCount(taskId) {
  const [[{ count }]] = await pool.query(
    'SELECT COUNT(*) as count FROM tasks WHERE parent_id = ? AND deleted_at IS NULL', [taskId]
  );
  return count;
}

// 批量创建子任务
async function batchCreateSubtasks(parentId, titles, createdBy) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    // 继承父任务优先级和截止日期
    const [[parent]] = await conn.query(
      'SELECT priority, due_date FROM tasks WHERE id = ?', [parentId]
    );
    const priority = parent?.priority || 'medium';
    const dueDate = parent?.due_date || null;
    // 获取当前最大 sort_order
    const [[{ maxOrder }]] = await conn.query(
      'SELECT COALESCE(MAX(sort_order), -1) + 1 AS maxOrder FROM tasks WHERE parent_id = ?', [parentId]
    );
    const ids = [];
    for (let i = 0; i < titles.length; i++) {
      const [result] = await conn.query(
        'INSERT INTO tasks (parent_id, title, status, priority, due_date, sort_order, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [parentId, titles[i], 'pending', priority, dueDate, maxOrder + i, createdBy || null]
      );
      ids.push(result.insertId);
    }
    await conn.commit();
    return ids;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

// 更新子任务（支持 title, status, priority, assignee_id, due_date）
async function updateSubtask(id, updates) {
  return update(id, updates);
}

// 子任务排序
async function reorderSubtasks(parentId, taskIds) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    for (let i = 0; i < taskIds.length; i++) {
      await conn.query(
        'UPDATE tasks SET sort_order = ? WHERE id = ? AND parent_id = ?',
        [i, taskIds[i], parentId]
      );
    }
    await conn.commit();
    return true;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

// 将子任务提升为独立任务
async function promoteSubtask(id) {
  await pool.query(
    'UPDATE tasks SET parent_id = NULL, sort_order = 0 WHERE id = ?', [id]
  );
  return findById(id);
}

// 将任务降级为子任务
async function demoteToSubtask(id, parentId) {
  // 防止循环引用
  if (id === parentId) throw new Error('不能将任务设为自己的子任务');
  await pool.query(
    'UPDATE tasks SET parent_id = ?, sort_order = (SELECT COALESCE(MAX(sort_order), -1) + 1 FROM (SELECT sort_order FROM tasks WHERE parent_id = ?) AS t) WHERE id = ?',
    [parentId, parentId, id]
  );
  return findById(id);
}

module.exports = {
  findAll,
  findById,
  create,
  update,
  updateSortOrder,
  remove,
  restore,
  permanentRemove,
  findTrash,
  getStats,
  getCompletionTrend,
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  createAssignableUser,
  findSubtasks,
  createSubtask,
  getSubtaskCount,
  batchCreateSubtasks,
  updateSubtask,
  reorderSubtasks,
  promoteSubtask,
  demoteToSubtask
};
