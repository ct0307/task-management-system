/**
 * Admin 系统管理控制器
 */
const adminService = require('../../services/admin/adminService');
const { success, fail } = require('../../utils/response');
const { ErrorCodes } = require('../../constants/errorCodes');

/**
 * GET /api/admin/users
 * 获取所有用户
 */
async function getUsers(req, res, next) {
  try {
    const users = await adminService.getAllUsers();
    success(res, users);
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/admin/users/:id
 * 更新用户信息
 */
async function updateUser(req, res, next) {
  try {
    const user = await adminService.updateUser(req.params.id, req.body);
    success(res, user, '用户更新成功');
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/admin/users/:id
 * 删除用户
 */
async function deleteUser(req, res, next) {
  try {
    const result = await adminService.deleteUser(req.params.id);
    success(res, result, '用户删除成功');
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/admin/categories/:id
 * 更新分类
 */
async function updateCategory(req, res, next) {
  try {
    const category = await adminService.updateCategory(req.params.id, req.body);
    success(res, category, '分类更新成功');
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/admin/categories/:id
 * 删除分类
 */
async function deleteCategory(req, res, next) {
  try {
    const result = await adminService.deleteCategory(req.params.id);
    success(res, result, '分类删除成功');
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getUsers,
  updateUser,
  deleteUser,
  updateCategory,
  deleteCategory
};
