const { describe, it, after } = require('node:test');
const assert = require('node:assert/strict');

const Task = require('../models/Task');
const taskService = require('../services/tasks/taskService');
const { pool } = require('../db');

after(async () => {
  await pool.end();
});

describe('taskService user isolation options', () => {
  it('普通用户查询任务时把 userId 和 userRole 传给模型层', async () => {
    const originalFindAll = Task.findAll;
    let receivedFilters;

    Task.findAll = async (filters) => {
      receivedFilters = filters;
      return [];
    };

    try {
      await taskService.getAllTasks({ status: 'pending' }, { id: 9, role: 'user' });
      assert.equal(receivedFilters.status, 'pending');
      assert.equal(receivedFilters.userId, 9);
      assert.equal(receivedFilters.userRole, 'user');
      assert.equal(receivedFilters.viewAll, false);
    } finally {
      Task.findAll = originalFindAll;
    }
  });

  it('管理员 viewAll=true 时传递全局查看意图', async () => {
    const originalFindAll = Task.findAll;
    let receivedFilters;

    Task.findAll = async (filters) => {
      receivedFilters = filters;
      return [];
    };

    try {
      await taskService.getAllTasks({ viewAll: 'true' }, { id: 1, role: 'admin' });
      assert.equal(receivedFilters.userId, 1);
      assert.equal(receivedFilters.userRole, 'admin');
      assert.equal(receivedFilters.viewAll, true);
    } finally {
      Task.findAll = originalFindAll;
    }
  });
});

describe('taskService CRUD behavior', () => {
  it('createTask 创建后返回新任务详情', async () => {
    const originalCreate = Task.create;
    const originalFindById = Task.findById;

    Task.create = async (data) => {
      assert.equal(data.title, '写计划');
      assert.equal(data.created_by, 5);
      return 42;
    };
    Task.findById = async (id) => ({ id, title: '写计划' });

    try {
      const task = await taskService.createTask({ title: '写计划', created_by: 5 });
      assert.deepEqual(task, { id: 42, title: '写计划' });
    } finally {
      Task.create = originalCreate;
      Task.findById = originalFindById;
    }
  });

  it('deleteTask 删除前校验任务存在', async () => {
    const originalFindById = Task.findById;
    const originalRemove = Task.remove;
    const calls = [];

    Task.findById = async (id) => {
      calls.push(`find:${id}`);
      return { id, title: '待删除任务' };
    };
    Task.remove = async (id) => {
      calls.push(`remove:${id}`);
      return true;
    };

    try {
      const result = await taskService.deleteTask(8);
      assert.deepEqual(calls, ['find:8', 'remove:8']);
      assert.deepEqual(result, { message: '任务已移入回收站' });
    } finally {
      Task.findById = originalFindById;
      Task.remove = originalRemove;
    }
  });
});
