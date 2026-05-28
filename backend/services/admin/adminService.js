/**
 * Admin 系统管理服务层
 */
const { pool } = require('../../db');
const { AppError } = require('../../middleware/errorHandler');
const bcrypt = require('bcryptjs');

/**
 * 获取所有用户列表
 */
async function getAllUsers() {
  const [rows] = await pool.query(
    'SELECT id, username, role, real_name, created_at, updated_at FROM users ORDER BY created_at DESC'
  );
  return rows;
}

/**
 * 更新用户信息
 */
async function updateUser(id, data) {
  const [existing] = await pool.query('SELECT id FROM users WHERE id = ?', [id]);
  if (existing.length === 0) {
    throw new AppError('用户不存在', 404);
  }

  const updates = [];
  const params = [];
  const allowedFields = ['role', 'real_name'];

  for (const field of allowedFields) {
    if (data[field] !== undefined) {
      updates.push(`${field} = ?`);
      params.push(data[field]);
    }
  }

  if (data.password) {
    const hashedPassword = bcrypt.hashSync(data.password, 10);
    updates.push('password = ?');
    params.push(hashedPassword);
  }

  if (updates.length === 0) {
    return getUserById(id);
  }

  params.push(id);
  await pool.query(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, params);
  return getUserById(id);
}

/**
 * 删除用户
 */
async function deleteUser(id) {
  const [existing] = await pool.query('SELECT id FROM users WHERE id = ?', [id]);
  if (existing.length === 0) {
    throw new AppError('用户不存在', 404);
  }
  await pool.query('DELETE FROM users WHERE id = ?', [id]);
  return { message: '用户删除成功' };
}

/**
 * 更新分类
 */
async function updateCategory(id, data) {
  const [existing] = await pool.query('SELECT id FROM categories WHERE id = ?', [id]);
  if (existing.length === 0) {
    throw new AppError('分类不存在', 404);
  }

  const { name, color } = data;
  if (!name || name.trim() === '') {
    throw new AppError('分类名称不能为空', 400);
  }

  await pool.query('UPDATE categories SET name = ?, color = ? WHERE id = ?', [name, color || '#1890ff', id]);
  const [rows] = await pool.query('SELECT * FROM categories WHERE id = ?', [id]);
  return rows[0] || null;
}

/**
 * 删除分类
 */
async function deleteCategory(id) {
  const [existing] = await pool.query('SELECT id FROM categories WHERE id = ?', [id]);
  if (existing.length === 0) {
    throw new AppError('分类不存在', 404);
  }
  await pool.query('DELETE FROM categories WHERE id = ?', [id]);
  return { message: '分类删除成功' };
}

/**
 * 根据ID获取用户
 */
async function getUserById(id) {
  const [rows] = await pool.query(
    'SELECT id, username, role, real_name, created_at, updated_at FROM users WHERE id = ?',
    [id]
  );
  return rows[0] || null;
}

module.exports = {
  getAllUsers,
  updateUser,
  deleteUser,
  updateCategory,
  deleteCategory
};
