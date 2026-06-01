/**
 * 任务列表优化组件
 * 支持搜索防抖、批量操作、行内快捷操作、乐观更新
 */
import React, { useState, useCallback, useEffect, useRef, memo } from 'react';
import {
  Table,
  Button,
  Tag,
  Space,
  Input,
  Select,
  Modal,
  Form,
  message,
  Popconfirm,
  Tooltip,
  Typography,
  Badge,
  Alert,
  Divider,
  Popover,
  Progress
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckOutlined,
  UndoOutlined,
  DownloadOutlined,
  UploadOutlined,
  UserAddOutlined,
  DownOutlined,
  RightOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import { STATUS_CONFIG, PRIORITY_CONFIG } from '@/constants/task';
import useTaskStore from '@/store/taskStore';
import useKeyboardShortcuts from '@/hooks/useKeyboardShortcuts';
import { post, put, del, get } from '@/util/request';
import token from '@/util/token';
import EmptyState from './EmptyState';
import SuccessFeedback from './SuccessFeedback';
import TaskDetailDrawer from './TaskDetailDrawer';
import FilterSection from './FilterSection';
import { buildColumns } from './TaskColumns';
import s from './index.module.less';

const { Option } = Select;
const { TextArea } = Input;
const { Text } = Typography;

// ====== 递归子任务行组件（独立组件，支持无限嵌套展开） ======
const NestedChildRow = memo(({ child, parentId, depth, onToggle, onDelete, onAdd, onOpenDrawer, updateTask, fetchTasks, messageApi }) => {
  const [expanded, setExpanded] = useState(false);
  const [children, setChildren] = useState(null); // null = 未加载
  const [loading, setLoading] = useState(false);
  const [newTitle, setNewTitle] = useState('');

  const hasChildren = (child.subtask_count || 0) > 0;

  const handleExpand = async () => {
    if (!expanded) {
      setExpanded(true);
      if (children === null) {
        setLoading(true);
        try {
          const res = await get(`/api/tasks/${child.id}/subtasks`);
          setChildren(res.data || []);
        } catch { setChildren([]); }
        finally { setLoading(false); }
      }
    } else {
      setExpanded(false);
    }
  };

  const handleLocalToggle = async () => {
    const newStatus = child.status === 'completed' ? 'pending' : 'completed';
    try {
      await updateTask(child.id, { status: newStatus });
      onToggle(parentId);
    } catch { messageApi.error('操作失败'); }
  };

  const handleLocalAdd = async () => {
    if (!newTitle.trim()) return;
    try {
      await post(`/api/tasks/${child.id}/subtasks`, { title: newTitle.trim() });
      setNewTitle('');
      const res = await get(`/api/tasks/${child.id}/subtasks`);
      setChildren(res.data || []);
      fetchTasks({}, null, true);
    } catch { messageApi.error('添加失败'); }
  };

  const handleLocalDelete = async () => {
    try {
      await del(`/api/tasks/${child.id}`);
      messageApi.success('已删除');
      onDelete(parentId);
      fetchTasks({}, null, true);
    } catch { messageApi.error('删除失败'); }
  };

  const done = children ? children.filter(c => c.status === 'completed').length : 0;

  return (
    <div>
      <div className={s.inlineSubtaskItem} style={{ paddingLeft: depth * 20 }}>
        {hasChildren ? (
          <span className={s.expandBtn} onClick={handleExpand} style={{ flexShrink: 0 }}>
            {expanded ? <DownOutlined style={{ fontSize: 10 }} /> : <RightOutlined style={{ fontSize: 10 }} />}
          </span>
        ) : (
          <span style={{ width: 18, flexShrink: 0 }} />
        )}

        <span onClick={handleLocalToggle} className={s.inlineCheckbox} style={{
          borderColor: child.status === 'completed' ? '#34a853' : '#d9d9d9',
          background: child.status === 'completed' ? '#34a853' : 'transparent'
        }}>
          {child.status === 'completed' && <CheckOutlined style={{ fontSize: 9, color: '#fff' }} />}
        </span>

        <Text className={s.inlineSubtaskTitle} delete={child.status === 'completed'}
          style={{ flex: 1, fontSize: 13, color: child.status === 'completed' ? '#bfbfbf' : '#303030', cursor: 'pointer' }}
          onClick={() => onOpenDrawer(child)}>
          {child.title}
        </Text>

        {child.assignee_name && <Tag style={{ fontSize: 11, margin: 0 }}>{child.assignee_name}</Tag>}
        <Badge color={PRIORITY_CONFIG[child.priority]?.color || '#f9ab00'} style={{ flexShrink: 0 }} />
        {child.due_date && (
          <Text type="secondary" style={{ fontSize: 11, whiteSpace: 'nowrap', flexShrink: 0 }}>
            <ClockCircleOutlined style={{ marginRight: 2 }} />
            {child.due_date.split('T')[0].slice(5)}
          </Text>
        )}
        <DeleteOutlined className={s.inlineDelete} onClick={handleLocalDelete} />
      </div>

      {/* 展开子层级 */}
      {expanded && (
        loading ? (
          <div style={{ padding: '8px 0', paddingLeft: 24 + depth * 20 }}>
            <Text type="secondary" style={{ fontSize: 12 }}>加载中...</Text>
          </div>
        ) : children && children.length > 0 ? (
          <div style={{ marginTop: 2 }}>
            <div style={{ paddingLeft: 24 + depth * 20, marginBottom: 4 }}>
              <Progress percent={Math.round(done / children.length * 100)} size="small"
                strokeColor="#34a853" format={() => `${done}/${children.length}`}
                style={{ margin: 0, maxWidth: 160 }} />
            </div>
            {children.map(gc => (
              <NestedChildRow key={gc.id}
                child={gc} parentId={child.id} depth={depth + 1}
                onToggle={onToggle} onDelete={onDelete} onAdd={onAdd}
                onOpenDrawer={onOpenDrawer}
                updateTask={updateTask} fetchTasks={fetchTasks}
                messageApi={messageApi} />
            ))}
            <div style={{ display: 'flex', gap: 6, padding: '4px 0 0', paddingLeft: 24 + depth * 20 }}>
              <Input size="small" placeholder="添加子任务..." value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                onPressEnter={handleLocalAdd}
                style={{ flex: 1, maxWidth: 260 }} />
              <Button size="small" type="link" icon={<PlusOutlined />} onClick={handleLocalAdd} />
            </div>
          </div>
        ) : (
          <div style={{ padding: '4px 0', paddingLeft: 42 + depth * 20 }}>
            <div style={{ display: 'flex', gap: 6 }}>
              <Input size="small" placeholder="添加子任务..." value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                onPressEnter={handleLocalAdd}
                style={{ flex: 1, maxWidth: 260 }} />
              <Button size="small" type="link" icon={<PlusOutlined />} onClick={handleLocalAdd} />
            </div>
          </div>
        )
      )}
    </div>
  );
});
NestedChildRow.displayName = 'NestedChildRow';

const TaskListOptimized = () => {
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [successFeedback, setSuccessFeedback] = useState(null);
  const [searchValue, setSearchValue] = useState('');
  const [batchLoading, setBatchLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [shortcutHelpOpen, setShortcutHelpOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [expandedRowKeys, setExpandedRowKeys] = useState([]);
  // 顶层展开的子任务数据，key = 父任务 ID
  const [childrenMap, setChildrenMap] = useState({});
  const [childrenLoading, setChildrenLoading] = useState({});
  const [newChildInput, setNewChildInput] = useState({});
  const fileInputRef = useRef(null);
  const debounceTimer = useRef(null);

  const {
    tasks,
    tasksLoading,
    tasksError,
    categories,
    filters,
    pagination,
    modalVisible,
    currentTask,
    users,
    fetchTasks,
    fetchCategories,
    fetchUsers,
    createTask,
    updateTask,
    deleteTask,
    batchDelete,
    batchUpdate,
    setFilters,
    setPagination,
    openModal,
    closeModal,
    openDrawer,
    copyTask
  } = useTaskStore();

  // 初始化数据
  useEffect(() => {
    fetchTasks();
    fetchCategories();
    fetchUsers();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // 搜索防抖
  const debouncedSearch = useCallback((value) => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      setFilters({ search: value });
      fetchTasks({ page: 1 });
    }, 300);
  }, [fetchTasks, setFilters]);

  useEffect(() => {
    return () => { if (debounceTimer.current) clearTimeout(debounceTimer.current); };
  }, []);

  // 搜索 + 筛选处理
  const handleSearchChange = useCallback((value) => {
    setSearchValue(value);
    debouncedSearch(value);
  }, [debouncedSearch]);

  const handleSearch = useCallback((value) => {
    setFilters({ search: value });
    fetchTasks({ page: 1 });
  }, [fetchTasks, setFilters]);

  const handleFilterChange = useCallback((key, value) => {
    setFilters({ [key]: value });
    fetchTasks({ page: 1 });
  }, [fetchTasks, setFilters]);

  // Modal 打开时同步表单
  useEffect(() => {
    if (modalVisible) {
      currentTask ? form.setFieldsValue(currentTask) : form.resetFields();
    }
  }, [modalVisible, currentTask]);

  // 操作函数（传给 TaskColumns）
  const handleQuickToggle = useCallback(async (task) => {
    const previousStatus = task.status;
    const newStatus = task.status === 'completed' ? 'pending' : 'completed';
    try {
      await updateTask(task.id, { status: newStatus });
      messageApi.open({
        content: newStatus === 'completed' ? '任务已完成' : '任务已恢复',
        duration: 5,
        btn: (
          <Button type="link" size="small" onClick={async () => {
            try { await updateTask(task.id, { status: previousStatus }); fetchTasks(); }
            catch { messageApi.error('撤销失败'); }
          }}>
            撤销
          </Button>
        )
      });
    } catch (err) {
      messageApi.error(err.message || '操作失败');
    }
  }, [updateTask, fetchTasks]);

  const handleQuickStatus = useCallback((task) => {
    handleQuickToggle(task);
  }, [handleQuickToggle]);

  const handleDeleteRecord = useCallback(async (id) => {
    const taskTitle = tasks.find(t => t.id === id)?.title || '';
    try {
      await deleteTask(id);
      messageApi.open({
        content: `「${taskTitle}」已移入回收站`,
        duration: 5,
        btn: (
          <Button type="link" size="small" onClick={async () => {
            try { await put(`/api/tasks/${id}/restore`); fetchTasks(); }
            catch { messageApi.error('恢复失败'); }
          }}>
            撤销
          </Button>
        )
      });
    } catch (err) {
      messageApi.error(err.message || '删除失败');
    }
  }, [deleteTask, fetchTasks, tasks]);

  // 加载任意任务的子任务（通用，支持多层级）
  const fetchChildren = useCallback(async (taskId) => {
    setChildrenLoading(prev => ({ ...prev, [taskId]: true }));
    try {
      const res = await get(`/api/tasks/${taskId}/subtasks`);
      setChildrenMap(prev => ({ ...prev, [taskId]: res.data || [] }));
    } catch {
      setChildrenMap(prev => ({ ...prev, [taskId]: [] }));
    } finally {
      setChildrenLoading(prev => ({ ...prev, [taskId]: false }));
    }
  }, []);

  // 表格顶层行展开/收起
  const handleExpandRow = useCallback((record) => {
    setExpandedRowKeys(prev => {
      if (prev.includes(record.id)) {
        return prev.filter(k => k !== record.id);
      }
      if (!childrenMap[record.id]) fetchChildren(record.id);
      return [...prev, record.id];
    });
  }, [childrenMap, fetchChildren]);

  // 行内：刷新某父级的子任务列表（toggle 已在 NestedChildRow 中完成）
  const handleInlineToggle = useCallback(async (parentId) => {
    try {
      const res = await get(`/api/tasks/${parentId}/subtasks`);
      const updated = res.data || [];
      setChildrenMap(prev => ({ ...prev, [parentId]: updated }));

      if (updated.length > 0 && updated.every(s => s.status === 'completed')) {
        const parentTask = tasks.find(t => t.id === parentId);
        if (parentTask && parentTask.status !== 'completed') {
          messageApi.open({
            content: '所有子任务已完成！要同时完成父任务吗？',
            duration: 5,
            btn: (
              <Button size="small" type="primary" onClick={async () => {
                try { await updateTask(parentId, { status: 'completed' }); messageApi.success('已完成 ✓'); fetchTasks({}, null, true); }
                catch { messageApi.error('操作失败'); }
              }}>完成</Button>
            )
          });
        }
      }
    } catch { messageApi.error('操作失败'); }
  }, [updateTask, fetchTasks, tasks]);

  // 行内：添加子任务
  const handleInlineAdd = useCallback(async (parentId) => {
    const title = (newChildInput[parentId] || '').trim();
    if (!title) return;
    try {
      await post(`/api/tasks/${parentId}/subtasks`, { title });
      setNewChildInput(prev => ({ ...prev, [parentId]: '' }));
      const res = await get(`/api/tasks/${parentId}/subtasks`);
      setChildrenMap(prev => ({ ...prev, [parentId]: res.data || [] }));
      fetchTasks({}, null, true);
    } catch { messageApi.error('添加失败'); }
  }, [newChildInput, fetchTasks]);

  // 行内：刷新某父级的子任务列表
  const handleInlineDelete = useCallback(async (parentId) => {
    try {
      const res = await get(`/api/tasks/${parentId}/subtasks`);
      setChildrenMap(prev => ({ ...prev, [parentId]: res.data || [] }));
    } catch { /* ignore */ }
  }, []);

  const showSuccessFeedback = (text) => {
    setSuccessFeedback(text);
    setTimeout(() => setSuccessFeedback(null), 2000);
  };

  // 创建/更新任务
  const handleSubmit = async () => {
    try {
      const rawValues = await form.validateFields();
      const values = Object.fromEntries(
        Object.entries(rawValues)
          .map(([k, v]) => [k, v === '' || v === undefined ? null : v])
          .filter(([_, v]) => v !== null)
      );
      if (currentTask?.id) {
        await updateTask(currentTask.id, values);
        showSuccessFeedback('任务更新成功');
      } else {
        await createTask(values);
        showSuccessFeedback(currentTask ? '任务复制成功' : '任务创建成功');
      }
      closeModal();
      form.resetFields();
    } catch (err) {
      if (err.errorFields) return;
      const errMsg = err.response?.data?.message || err.message || '操作失败';
      messageApi.open({
        type: 'error',
        content: `操作失败：${errMsg}`,
        duration: 8,
        btn: <Button size="small" danger onClick={() => handleSubmit()}>重试</Button>
      });
    }
  };

  // 内联新增分类
  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    try {
      await post('/api/tasks/categories', { name: newCategoryName.trim() });
      messageApi.success('分类已添加');
      setNewCategoryName('');
      await fetchCategories(true);
    } catch (err) {
      messageApi.error(err.response?.data?.message || '添加失败');
    }
  };

  // 内联删除分类
  const handleDeleteCategory = async (catId) => {
    try {
      await del(`/api/tasks/categories/${catId}`);
      messageApi.success('分类已删除');
      await fetchCategories(true);
    } catch (err) {
      messageApi.error(err.response?.data?.message || '删除失败');
    }
  };

  // 内联新增负责人
  const handleAddUser = async () => {
    if (!newUserName.trim()) return;
    try {
      await post('/api/tasks/users', { username: newUserName.trim(), real_name: newUserName.trim() });
      messageApi.success('负责人已添加（默认密码 123456）');
      setNewUserName('');
      await fetchUsers(true);
    } catch (err) {
      messageApi.error(err.response?.data?.message || '添加失败');
    }
  };

  // 批量操作
  const handleBatchDelete = async () => {
    setBatchLoading(true);
    try {
      await batchDelete(selectedRowKeys);
      setSelectedRowKeys([]);
      showSuccessFeedback(`已删除 ${selectedRowKeys.length} 个任务`);
    } catch (err) {
      messageApi.error('批量删除失败');
    } finally {
      setBatchLoading(false);
    }
  };

  const handleBatchStatus = async (newStatus) => {
    setBatchLoading(true);
    try {
      await batchUpdate(selectedRowKeys, { status: newStatus });
      setSelectedRowKeys([]);
      const label = STATUS_CONFIG[newStatus]?.label || newStatus;
      showSuccessFeedback(`已将 ${selectedRowKeys.length} 个任务设为「${label}」`);
    } catch (err) {
      messageApi.error('批量更新状态失败');
    } finally {
      setBatchLoading(false);
    }
  };

  const handleBatchPriority = async (newPriority) => {
    setBatchLoading(true);
    try {
      await batchUpdate(selectedRowKeys, { priority: newPriority });
      setSelectedRowKeys([]);
      const label = PRIORITY_CONFIG[newPriority]?.label || newPriority;
      showSuccessFeedback(`已将 ${selectedRowKeys.length} 个任务设为「${label}优先级」`);
    } catch (err) {
      messageApi.error('批量更新优先级失败');
    } finally {
      setBatchLoading(false);
    }
  };

  // 导出
  // CSV 导入
  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const accessToken = token.get();
      const response = await fetch('/api/tasks/import', {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
        body: formData
      });
      const result = await response.json();
      if (response.ok) {
        messageApi.success(result.message || `已导入 ${result.data?.imported || 0} 条任务`);
        fetchTasks();
        fetchStats();
      } else {
        messageApi.error(result.message || '导入失败');
      }
    } catch {
      messageApi.error('导入失败');
    } finally {
      setImportLoading(false);
      e.target.value = '';
    }
  };

  const handleExport = async (format) => {
    setExportLoading(true);
    try {
      const accessToken = token.get();
      const response = await fetch(`/api/tasks/export?format=${format}`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (!response.ok) throw new Error('导出失败');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `tasks_export_${Date.now()}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      messageApi.success(`已导出 ${format.toUpperCase()} 文件`);
    } catch (err) {
      messageApi.error(err.message || '导出失败');
    } finally {
      setExportLoading(false);
    }
  };

  // 表格变化
  const handleTableChange = useCallback((pag, _filters, sorter) => {
    setPagination({ page: pag.current, pageSize: pag.pageSize });
    const sortParams = {};
    if (sorter.field && sorter.order) {
      sortParams.sortField = sorter.field;
      sortParams.sortOrder = sorter.order;
    }
    fetchTasks({ page: pag.current, pageSize: pag.pageSize, ...sortParams });
  }, [fetchTasks, setPagination]);

  // 快捷键
  const handleFocusSearch = useCallback(() => {
    document.querySelector('.task-search-input input')?.focus();
  }, []);

  useKeyboardShortcuts([
    { key: 'n', handler: () => openModal(), description: '新建任务' },
    { key: '/', handler: handleFocusSearch, description: '搜索' },
    { key: '?', handler: () => setShortcutHelpOpen(true), description: '快捷键帮助' },
    {
      key: 'e',
      handler: () => {
        if (selectedRowKeys.length === 1) {
          const task = tasks.find(t => t.id === selectedRowKeys[0]);
          if (task) openDrawer(task);
        }
      },
      description: '编辑选中任务'
    }
  ]);

  // 行样式
  const getRowClass = (record) => {
    const isOverdue = record.due_date && new Date(record.due_date) < new Date() && record.status !== 'completed';
    return [
      s.tableRow,
      record.status === 'completed' ? s.tableRowCompleted : '',
      isOverdue ? s.tableRowOverdue : ''
    ].filter(Boolean).join(' ');
  };

  // 列定义
  const columns = buildColumns({
    handleQuickToggle,
    handleQuickStatus,
    copyTask,
    openDrawer,
    handleDelete: handleDeleteRecord,
    expandedRowKeys,
    onExpand: handleExpandRow
  });

  // 展开行渲染：顶层子任务列表（使用 NestedChildRow 组件递归渲染）
  const expandedRowRender = useCallback((record) => {
    const subs = childrenMap[record.id];
    const loading = childrenLoading[record.id];
    if (loading) return <div style={{ padding: 12, textAlign: 'center' }}><Text type="secondary">加载中...</Text></div>;
    if (!subs || subs.length === 0) {
      return (
        <div className={s.expandedRow}>
          <div className={s.expandedRowHeader}>
            <Text type="secondary">暂无子任务</Text>
          </div>
          <div style={{ display: 'flex', gap: 6, padding: '0 0 8px' }}>
            <Input size="small" placeholder="添加子任务..."
              value={newChildInput[record.id] || ''}
              onChange={(e) => setNewChildInput(prev => ({ ...prev, [record.id]: e.target.value }))}
              onPressEnter={() => handleInlineAdd(record.id)}
              style={{ flex: 1, maxWidth: 320 }} />
            <Button size="small" type="link" icon={<PlusOutlined />} onClick={() => handleInlineAdd(record.id)}>
              添加</Button>
          </div>
        </div>
      );
    }
    const done = subs.filter(s => s.status === 'completed').length;
    return (
      <div className={s.expandedRow}>
        <div className={s.expandedRowHeader}>
          <Progress percent={Math.round(done / subs.length * 100)} size="small"
            strokeColor="#34a853" format={() => `${done}/${subs.length} 已完成`}
            style={{ margin: 0, flex: 1, maxWidth: 200 }} />
          <Button size="small" type="link" onClick={() => openDrawer(record)}>在详情页管理</Button>
        </div>
        <div className={s.inlineSubtaskList}>
          {subs.map(st => (
            <NestedChildRow key={st.id}
              child={st} parentId={record.id} depth={0}
              onToggle={handleInlineToggle} onDelete={handleInlineDelete}
              onAdd={handleInlineAdd} onOpenDrawer={openDrawer}
              updateTask={updateTask} fetchTasks={fetchTasks}
              messageApi={messageApi} />
          ))}
        </div>
        <div style={{ display: 'flex', gap: 6, padding: '4px 0 0' }}>
          <Input size="small" placeholder="添加子任务..."
            value={newChildInput[record.id] || ''}
            onChange={(e) => setNewChildInput(prev => ({ ...prev, [record.id]: e.target.value }))}
            onPressEnter={() => handleInlineAdd(record.id)}
            style={{ flex: 1, maxWidth: 320 }} />
          <Button size="small" type="link" icon={<PlusOutlined />} onClick={() => handleInlineAdd(record.id)}>
            添加</Button>
        </div>
      </div>
    );
  }, [childrenMap, childrenLoading, newChildInput, openDrawer, handleInlineToggle, handleInlineDelete, handleInlineAdd, updateTask, fetchTasks, messageApi]);

  return (
    <div className={`${s.taskList} animate-fade-in`}>
      {contextHolder}
      <SuccessFeedback text={successFeedback} />

      {/* 筛选区域 */}
      <FilterSection
        categories={categories}
        searchValue={searchValue}
        onSearchChange={handleSearchChange}
        onSearch={handleSearch}
        onFilterChange={handleFilterChange}
      />

      {/* 错误提示 */}
      {tasksError && (
        <Alert
          message="数据加载失败"
          description={tasksError}
          type="error"
          showIcon
          closable
          style={{ marginBottom: 16 }}
          action={<Button size="small" onClick={() => fetchTasks()}>重试</Button>}
        />
      )}

      {/* 操作栏 */}
      <div className={s.actions}>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal()} className={s.newTaskBtn}>
          新建任务
        </Button>

        <Select
          placeholder="导出数据"
          style={{ width: 110 }}
          onChange={handleExport}
          value={undefined}
          loading={exportLoading}
          suffixIcon={<DownloadOutlined />}
        >
          <Option value="json">导出 JSON</Option>
          <Option value="csv">导出 CSV</Option>
        </Select>

        <input ref={fileInputRef} type="file" accept=".csv" onChange={handleImport} style={{ display: 'none' }} />
        <Button icon={<UploadOutlined />} loading={importLoading} onClick={() => fileInputRef.current?.click()}>
          导入 CSV
        </Button>

        {selectedRowKeys.length > 0 && (
          <Space wrap>
            <Text type="secondary">已选择 {selectedRowKeys.length} 项</Text>
            <Select
              placeholder="更改状态"
              style={{ width: 120 }}
              onChange={handleBatchStatus}
              value={undefined}
              loading={batchLoading}
              disabled={batchLoading}
            >
              {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                <Option key={key} value={key}>
                  <Space><span style={{ color: config.color }}>{config.icon}</span>{config.label}</Space>
                </Option>
              ))}
            </Select>
            <Select
              placeholder="更改优先级"
              style={{ width: 120 }}
              onChange={handleBatchPriority}
              value={undefined}
              loading={batchLoading}
              disabled={batchLoading}
            >
              {Object.entries(PRIORITY_CONFIG).map(([key, config]) => (
                <Option key={key} value={key}>
                  <Space><Badge color={config.color} />{config.label}优先级</Space>
                </Option>
              ))}
            </Select>
            <Popconfirm
              title={`确定删除选中的 ${selectedRowKeys.length} 个任务？`}
              onConfirm={handleBatchDelete}
              okText="删除"
              cancelText="取消"
              okButtonProps={{ danger: true, loading: batchLoading }}
            >
              <Button danger icon={<DeleteOutlined />} loading={batchLoading}>批量删除</Button>
            </Popconfirm>
            <Button onClick={() => setSelectedRowKeys([])}>取消选择</Button>
          </Space>
        )}
      </div>

      {/* 任务列表 */}
      <Table
        columns={columns}
        dataSource={tasks}
        rowKey="id"
        loading={tasksLoading}
        expandable={{
          expandedRowRender,
          expandedRowKeys,
          onExpand: (expanded, record) => handleExpandRow(record),
          showExpandColumn: false,
          rowExpandable: (record) => (record.subtask_count || 0) > 0
        }}
        virtual={false}
        scroll={{ x: 900 }}
        rowSelection={{
          selectedRowKeys,
          onChange: setSelectedRowKeys,
          preserveSelectedRowKeys: true
        }}
        onRow={(record) => ({
          className: getRowClass(record)
        })}
        locale={{ emptyText: <EmptyState onCreate={() => openModal()} /> }}
        pagination={{
          current: pagination.page,
          pageSize: pagination.pageSize,
          total: pagination.total,
          defaultPageSize: 10,
          showSizeChanger: true,
          showTotal: (total) => `共 ${total} 条任务`,
          showQuickJumper: true,
          onChange: (page, pageSize) => {
            setPagination({ page, pageSize });
            fetchTasks({ page, pageSize });
          }
        }}
        onChange={handleTableChange}
      />

      {/* 创建/编辑 Modal */}
      <Modal
        title={
          <div className={s.modalTitle}>
            {currentTask?.id ? <EditOutlined /> : <PlusOutlined />}
            {currentTask?.id ? '编辑任务' : currentTask ? '复制任务' : '新建任务'}
          </div>
        }
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => { closeModal(); form.resetFields(); }}
        okText={currentTask?.id ? '保存修改' : '创建任务'}
        cancelText="取消"
        width={560}
        destroyOnClose
        className={s.taskModal}
      >
        <Form form={form} layout="vertical" initialValues={{ status: 'pending', priority: 'medium' }}>
          <Form.Item name="title" label="任务标题" rules={[{ required: true, message: '请输入任务标题' }]}>
            <Input placeholder="输入任务标题" autoFocus />
          </Form.Item>
          <Form.Item name="description" label="任务描述">
            <TextArea rows={3} placeholder="详细描述任务内容（可选）" showCount maxLength={500} />
          </Form.Item>
          <Space size="middle" style={{ width: '100%' }}>
            <Form.Item name="status" label="状态" style={{ flex: 1 }}>
              <Select>
                {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                  <Option key={key} value={key}>
                    <Space><span style={{ color: config.color }}>{config.icon}</span>{config.label}</Space>
                  </Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item name="priority" label="优先级" style={{ flex: 1 }}>
              <Select>
                {Object.entries(PRIORITY_CONFIG).map(([key, config]) => (
                  <Option key={key} value={key}>
                    <Space><Badge color={config.color} />{config.label}</Space>
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Space>
          <Space size="middle" style={{ width: '100%' }}>
            <Form.Item name="category_id" label="分类" style={{ flex: 1 }}>
              <Select
                placeholder="选择分类（可选）"
                allowClear
                dropdownRender={(menu) => (
                  <div>
                    {menu}
                    <Divider style={{ margin: '4px 0' }} />
                    <div style={{ display: 'flex', padding: '0 8px 4px', gap: 4 }}>
                      <Input
                        size="small"
                        placeholder="新分类名"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        onPressEnter={handleAddCategory}
                        style={{ flex: 1 }}
                      />
                      <Button size="small" type="link" icon={<PlusOutlined />} onClick={handleAddCategory}>
                        添加
                      </Button>
                    </div>
                    <div style={{ padding: '0 8px 8px' }}>
                      {categories.map(cat => (
                        <span key={cat.id} style={{
                          display: 'inline-flex', alignItems: 'center', marginRight: 8, marginTop: 4,
                          padding: '0 6px', fontSize: 11, borderRadius: 4,
                          background: '#f0f0f0', cursor: 'default'
                        }}>
                          {cat.name}
                          <DeleteOutlined
                            style={{ marginLeft: 4, fontSize: 10, color: '#999', cursor: 'pointer' }}
                            onClick={(e) => { e.stopPropagation(); handleDeleteCategory(cat.id); }}
                          />
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              >
                {categories.map(cat => (
                  <Option key={cat.id} value={cat.id}>{cat.name}</Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item name="assignee_id" label="负责人" style={{ flex: 1 }}>
              <Select
                placeholder="选择负责人（可选）"
                allowClear
                dropdownRender={(menu) => (
                  <div>
                    {menu}
                    <Divider style={{ margin: '4px 0' }} />
                    <div style={{ display: 'flex', padding: '0 8px 8px', gap: 4 }}>
                      <Input
                        size="small"
                        placeholder="输入用户名添加"
                        value={newUserName}
                        onChange={(e) => setNewUserName(e.target.value)}
                        onPressEnter={handleAddUser}
                        style={{ flex: 1 }}
                      />
                      <Button size="small" type="link" icon={<UserAddOutlined />} onClick={handleAddUser}>
                        添加
                      </Button>
                    </div>
                  </div>
                )}
              >
                {users.map(u => (
                  <Option key={u.id} value={u.id}>{u.real_name || u.username}</Option>
                ))}
              </Select>
            </Form.Item>
          </Space>
          <Form.Item name="due_date" label="截止日期">
            <Input type="date" style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>

      {/* 任务详情侧滑面板 */}
      <TaskDetailDrawer />

      {/* 快捷键帮助弹窗 */}
      <Modal
        title="键盘快捷键"
        open={shortcutHelpOpen}
        onCancel={() => setShortcutHelpOpen(false)}
        footer={null}
        width={400}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            { key: 'N', desc: '新建任务' },
            { key: '/', desc: '聚焦搜索框' },
            { key: 'E', desc: '编辑选中任务' },
            { key: 'Delete', desc: '删除选中任务' },
            { key: '?', desc: '显示此帮助' },
            { key: 'Esc', desc: '关闭弹窗/抽屉' },
            { key: 'Ctrl+A', desc: '全选任务' },
          ].map(item => (
            <div key={item.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#5f6368' }}>{item.desc}</span>
              <kbd style={{
                display: 'inline-block',
                padding: '2px 10px',
                background: '#f1f3f4',
                border: '1px solid #dadce0',
                borderRadius: 4,
                fontSize: 12,
                fontFamily: 'monospace',
                fontWeight: 600,
                color: '#202124'
              }}>{item.key}</kbd>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
};

export default TaskListOptimized;
