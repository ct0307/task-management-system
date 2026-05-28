/**
 * 任务管理 Store - 基于 Zustand 的轻量级状态管理
 * 参考实验报告中的 Zustand 页面独立加载方案
 */
import { create } from 'zustand';
import { get, post, put, del } from '@/util/request';
import { API_TASK_LIST, API_TASK_STATS, API_TASK_CATEGORIES, API_TASK_USERS } from '@/constant/urls';

// 简单 TTL 缓存
const cache = {};
const isCacheValid = (key) => cache[key] && Date.now() < cache[key].expiry;
const setCache = (key, data, ttlMs) => {
  cache[key] = { data, expiry: Date.now() + ttlMs };
};
const getCache = (key) => cache[key]?.data;
const invalidateCache = (pattern) => {
  Object.keys(cache).forEach(k => { if (k.startsWith(pattern)) delete cache[k]; });
};

// 缓存 TTL 配置
const CACHE_TASKS = 30_000;      // 任务列表 30 秒
const CACHE_STATS = 30_000;      // 统计数据 30 秒
const CACHE_CATEGORIES = 300_000; // 分类 5 分钟
const CACHE_USERS = 300_000;     // 用户列表 5 分钟

// 批量操作辅助函数
const batchDeleteApi = async (ids) => {
  const response = await del(API_TASK_LIST + '/batch', {}, {
    data: { ids },
    headers: { 'Content-Type': 'application/json' }
  });
  return response;
};

const batchUpdateApi = async (ids, updates) => {
  const response = await put(API_TASK_LIST + '/batch', { ids, updates });
  return response;
};

// 创建任务 Store
const useTaskStore = create((set, getState) => ({
  // 任务列表状态
  tasks: [],
  tasksLoading: false,
  tasksError: null,

  // 任务统计状态
  stats: null,
  statsLoading: false,

  // 分类状态
  categories: [],
  categoriesLoading: false,

  // 可分配用户列表
  users: [],
  usersLoading: false,

  // 筛选状态
  filters: {
    status: null,
    category: null,
    priority: null,
    search: ''
  },

  // 分页状态
  pagination: {
    page: 1,
    pageSize: 10,
    total: 0,
    totalPages: 0
  },

  // Modal状态（新建/编辑表单）
  modalVisible: false,
  currentTask: null,

  // Drawer状态（任务详情预览）
  drawerVisible: false,
  currentDrawerTask: null,

  // 视图模式: 'table' | 'kanban'
  viewMode: 'table',

  // 展开的子任务数据 (taskId -> { subtasks: [], loading: bool })
  expandedSubtasks: {},

  // 获取某任务的子任务
  fetchSubtasks: async (taskId) => {
    const state = getState();
    set({
      expandedSubtasks: {
        ...state.expandedSubtasks,
        [taskId]: { ...state.expandedSubtasks[taskId], loading: true }
      }
    });
    try {
      const result = await get(`/api/tasks/${taskId}/subtasks`);
      set({
        expandedSubtasks: {
          ...getState().expandedSubtasks,
          [taskId]: { subtasks: result.data || [], loading: false }
        }
      });
    } catch {
      set({
        expandedSubtasks: {
          ...getState().expandedSubtasks,
          [taskId]: { subtasks: [], loading: false }
        }
      });
    }
  },

  // 获取任务列表（带 30 秒缓存）
  fetchTasks: async (extraParams = {}, overrideFilters = null, forceRefresh = false) => {
    const state = getState();
    const filters = overrideFilters || state.filters;
    const { pagination } = state;
    const params = new URLSearchParams();

    if (filters.status) params.append('status', filters.status);
    if (filters.category) params.append('category', filters.category);
    if (filters.priority) params.append('priority', filters.priority);
    if (filters.search) params.append('search', filters.search);

    const page = extraParams.page || pagination.page;
    const pageSize = extraParams.pageSize || pagination.pageSize;
    params.append('page', page);
    params.append('pageSize', pageSize);

    if (extraParams.limit) params.append('limit', extraParams.limit);
    if (extraParams.sortField) params.append('sortField', extraParams.sortField);
    if (extraParams.sortOrder) params.append('sortOrder', extraParams.sortOrder);

    const queryString = params.toString();
    const cacheKey = `tasks:${queryString}`;

    // 命中缓存则直接返回
    if (!forceRefresh && isCacheValid(cacheKey)) {
      const cached = getCache(cacheKey);
      set({ tasks: cached.tasks, pagination: cached.pagination, tasksLoading: false });
      return;
    }

    set({ tasksLoading: true, tasksError: null });
    try {
      const url = queryString ? `${API_TASK_LIST}?${queryString}` : API_TASK_LIST;
      const result = await get(url);

      if (result.data && result.data.data !== undefined) {
        const taskData = {
          tasks: result.data.data || [],
          pagination: {
            page: result.data.page || page,
            pageSize: result.data.pageSize || pageSize,
            total: result.data.total || 0,
            totalPages: result.data.totalPages || 0
          }
        };
        setCache(cacheKey, taskData, CACHE_TASKS);
        set({ ...taskData, tasksLoading: false });
      } else {
        setCache(cacheKey, { tasks: result.data || [], pagination }, CACHE_TASKS);
        set({ tasks: result.data || [], tasksLoading: false });
      }
    } catch (err) {
      set({ tasksError: err.message, tasksLoading: false });
    }
  },

  // 设置分页
  setPagination: (newPagination) => {
    set({ pagination: { ...getState().pagination, ...newPagination } });
  },

  // 获取任务统计
  fetchStats: async () => {
    set({ statsLoading: true });
    try {
      const data = await get(API_TASK_STATS);
      set({ stats: data.data, statsLoading: false });
    } catch (err) {
      set({
        stats: {
          total: 0,
          byStatus: {},
          byPriority: {},
          byCategory: {},
          overdue: 0
        },
        statsLoading: false
      });
    }
  },

  // 获取分类列表（带 5 分钟缓存）
  fetchCategories: async (forceRefresh = false) => {
    if (!forceRefresh && isCacheValid('categories')) {
      set({ categories: getCache('categories'), categoriesLoading: false });
      return;
    }
    set({ categoriesLoading: true });
    try {
      const data = await get(API_TASK_CATEGORIES);
      const list = data.data || [];
      setCache('categories', list, CACHE_CATEGORIES);
      set({ categories: list, categoriesLoading: false });
    } catch (err) {
      set({ categoriesLoading: false });
    }
  },

  // 获取可分配用户列表（带 5 分钟缓存）
  fetchUsers: async (forceRefresh = false) => {
    if (!forceRefresh && isCacheValid('users')) {
      set({ users: getCache('users'), usersLoading: false });
      return;
    }
    set({ usersLoading: true });
    try {
      const data = await get(API_TASK_USERS);
      const list = data.data || [];
      setCache('users', list, CACHE_USERS);
      set({ users: list, usersLoading: false });
    } catch (err) {
      set({ usersLoading: false });
    }
  },

  // 创建任务
  createTask: async (taskData) => {
    try {
      await post(API_TASK_LIST, taskData);
      return await getState().refreshTasksAndStats();
    } catch (err) {
      throw err;
    }
  },

  // 更新任务
  updateTask: async (id, taskData) => {
    try {
      await put(`${API_TASK_LIST}/${id}`, taskData);
      return await getState().refreshTasksAndStats();
    } catch (err) {
      throw err;
    }
  },

  // 删除任务
  deleteTask: async (id) => {
    try {
      await del(`${API_TASK_LIST}/${id}`);
      return await getState().refreshTasksAndStats();
    } catch (err) {
      throw err;
    }
  },

  // 强制刷新任务和统计（绕过缓存）
  refreshTasksAndStats: async () => {
    invalidateCache('tasks:');
    invalidateCache('stats:');
    const state = getState();
    const filters = state.filters;
    const { pagination } = state;
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.category) params.append('category', filters.category);
    if (filters.priority) params.append('priority', filters.priority);
    if (filters.search) params.append('search', filters.search);
    params.append('page', pagination.page);
    params.append('pageSize', pagination.pageSize);
    const qs = params.toString();
    const url = qs ? `${API_TASK_LIST}?${qs}` : API_TASK_LIST;

    try {
      const [taskResult, statsResult] = await Promise.all([
        get(url),
        get(API_TASK_STATS)
      ]);
      // 处理任务数据
      const taskData = taskResult.data?.data !== undefined
        ? { tasks: taskResult.data.data, pagination: { page: taskResult.data.page, pageSize: taskResult.data.pageSize, total: taskResult.data.total, totalPages: taskResult.data.totalPages } }
        : { tasks: taskResult.data || [], pagination };
      setCache(`tasks:${qs}`, taskData, CACHE_TASKS);
      // 处理统计数据
      setCache('stats:overview', statsResult.data, CACHE_STATS);
      set({ ...taskData, stats: statsResult.data, tasksLoading: false, statsLoading: false });
    } catch (err) {
      set({ tasksError: err.message, tasksLoading: false, statsLoading: false });
      throw err;
    }
  },

  // 批量删除任务
  batchDelete: async (ids) => {
    try {
      const response = await batchDeleteApi(ids);
      await getState().refreshTasksAndStats();
      return response;
    } catch (err) {
      throw err;
    }
  },

  // 批量更新任务
  batchUpdate: async (ids, updates) => {
    try {
      const response = await batchUpdateApi(ids, updates);
      await getState().refreshTasksAndStats();
      return response;
    } catch (err) {
      throw err;
    }
  },

  // 看板拖拽排序
  reorderTasks: async (status, taskIds) => {
    try {
      await put(`${API_TASK_LIST}/reorder`, { status, taskIds });
      await getState().refreshTasksAndStats();
      return true;
    } catch (err) {
      throw err;
    }
  },

  // 更新筛选条件
  setFilters: (newFilters) => {
    set({ filters: { ...getState().filters, ...newFilters } });
  },

  // 切换视图模式
  setViewMode: (mode) => {
    set({ viewMode: mode });
  },

  // 打开创建/编辑Modal
  openModal: (task = null) => {
    set({ modalVisible: true, currentTask: task });
  },

  // 复制任务：打开创建 Modal 并预填数据
  copyTask: (task) => {
    const clone = { ...task };
    delete clone.id;
    delete clone.created_at;
    delete clone.updated_at;
    set({ modalVisible: true, currentTask: clone });
  },

  // 关闭Modal
  closeModal: () => {
    set({ modalVisible: false, currentTask: null });
  },

  // 打开任务详情 Drawer
  openDrawer: (task = null) => {
    set({ drawerVisible: true, currentDrawerTask: task });
  },

  // 关闭任务详情 Drawer
  closeDrawer: () => {
    set({ drawerVisible: false, currentDrawerTask: null });
  }
}));

export default useTaskStore;
