/**
 * Admin 系统管理路由
 * 需要 admin 角色权限
 */
const express = require('express');
const router = express.Router();
const { requireAuth, requireRole } = require('../middleware/auth');
const {
  getUsers,
  updateUser,
  deleteUser,
  updateCategory,
  deleteCategory
} = require('../controllers/admin/adminController');
const taskController = require('../controllers/tasks/taskController');

// 所有路由需要登录 + admin 角色
router.use(requireAuth);
router.use(requireRole('admin'));

// 用户管理
router.get('/users', getUsers);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);

// 分类管理
router.get('/categories', taskController.getCategories);
router.post('/categories', taskController.createCategory);
router.put('/categories/:id', updateCategory);
router.delete('/categories/:id', deleteCategory);

module.exports = router;
