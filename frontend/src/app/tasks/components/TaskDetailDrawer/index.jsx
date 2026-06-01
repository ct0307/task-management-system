/**
 * 任务详情 Drawer 组件
 * 侧滑面板展示任务详细信息，支持行内编辑
 */
import React, { useEffect, useState, useCallback } from 'react';
import {
  Drawer,
  Descriptions,
  Tag,
  Space,
  Button,
  Form,
  Input,
  Select,
  DatePicker,
  message,
  Typography,
  Divider,
  Badge,
  List,
  Popconfirm,
  Tooltip,
  Progress
} from 'antd';
import {
  EditOutlined,
  CloseOutlined,
  CheckOutlined,
  CalendarOutlined,
  UserOutlined,
  FolderOutlined,
  ExclamationCircleOutlined,
  StarOutlined,
  MessageOutlined,
  PlusOutlined,
  DeleteOutlined,
  UserAddOutlined,
  MenuOutlined,
  VerticalAlignTopOutlined,
  HolderOutlined
} from '@ant-design/icons';
import { STATUS_CONFIG, PRIORITY_CONFIG } from '@/constants/task';
import { get, post, put, del } from '@/util/request';
import useTaskStore from '@/store/taskStore';
import useAuthStore from '@/store/authStore';
import dayjs from 'dayjs';

const { TextArea } = Input;
const { Text } = Typography;
const { Option } = Select;

const TaskDetailDrawer = () => {
  const [form] = Form.useForm();
  const {
    drawerVisible,
    currentDrawerTask,
    categories,
    users,
    fetchUsers,
    fetchCategories,
    closeDrawer,
    updateTask,
    fetchTasks,
    fetchStats
  } = useTaskStore();

  useEffect(() => {
    if (drawerVisible) {
      fetchUsers();
      if (currentDrawerTask) {
        form.setFieldsValue({
          ...currentDrawerTask,
          due_date: currentDrawerTask.due_date ? dayjs(currentDrawerTask.due_date) : null
        });
      }
    }
  }, [drawerVisible, currentDrawerTask, form]);

  // 评论状态
  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const currentUser = useAuthStore(s => s.currentUser);

  const fetchComments = useCallback(async () => {
    if (!currentDrawerTask?.id) return;
    setCommentsLoading(true);
    try {
      const res = await get(`/api/tasks/${currentDrawerTask.id}/comments`);
      setComments(res.data || []);
    } catch { /* ignore */ }
    finally { setCommentsLoading(false); }
  }, [currentDrawerTask?.id]);

  useEffect(() => {
    if (currentDrawerTask?.id) fetchComments();
  }, [currentDrawerTask?.id, fetchComments]);

  // @提及自动补全
  const [mentionSearch, setMentionSearch] = useState('');
  const [mentionVisible, setMentionVisible] = useState(false);
  const [drawerNewCategory, setDrawerNewCategory] = useState('');
  const [drawerNewUser, setDrawerNewUser] = useState('');
  // 子任务
  const [subtasks, setSubtasks] = useState([]);
  const [subtaskLoading, setSubtaskLoading] = useState(false);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [batchMode, setBatchMode] = useState(false);
  const [batchText, setBatchText] = useState('');
  const [editingSubtaskId, setEditingSubtaskId] = useState(null);
  const [editSubtaskTitle, setEditSubtaskTitle] = useState('');
  const [dragOverSubtaskId, setDragOverSubtaskId] = useState(null);
  const [newSubtaskPriority, setNewSubtaskPriority] = useState('medium');
  const [newSubtaskDueDate, setNewSubtaskDueDate] = useState(null);

  const fetchSubtasks = useCallback(async () => {
    if (!currentDrawerTask?.id) return;
    setSubtaskLoading(true);
    try {
      const res = await get(`/api/tasks/${currentDrawerTask.id}/subtasks`);
      setSubtasks(res.data || []);
    } catch { /* ignore */ }
    finally { setSubtaskLoading(false); }
  }, [currentDrawerTask?.id]);

  useEffect(() => {
    if (currentDrawerTask?.id) fetchSubtasks();
  }, [currentDrawerTask?.id, fetchSubtasks]);

  const handleAddSubtask = async () => {
    if (!newSubtaskTitle.trim()) return;
    try {
      await post(`/api/tasks/${currentDrawerTask.id}/subtasks`, {
        title: newSubtaskTitle.trim(),
        priority: newSubtaskPriority,
        due_date: newSubtaskDueDate ? newSubtaskDueDate.format('YYYY-MM-DD') : undefined
      });
      message.success('子任务已添加');
      setNewSubtaskTitle('');
      setNewSubtaskDueDate(null);
      fetchSubtasks();
      fetchTasks({}, null, true);
    } catch (err) {
      message.error(err.response?.data?.message || '添加失败');
    }
  };

  // 修改子任务截止日期
  const handleChangeSubtaskDueDate = async (subtaskId, dateStr) => {
    try {
      await put(`/api/tasks/${currentDrawerTask.id}/subtasks/${subtaskId}`, {
        due_date: dateStr || null
      });
      fetchSubtasks();
      fetchTasks({}, null, true);
    } catch { message.error('修改截止日期失败'); }
  };

  // 批量添加子任务（按行分割）
  const handleBatchAddSubtasks = async () => {
    const titles = batchText.split('\n').map(t => t.trim()).filter(Boolean);
    if (titles.length === 0) return;
    try {
      await post(`/api/tasks/${currentDrawerTask.id}/subtasks/batch`, { titles });
      message.success(`已添加 ${titles.length} 个子任务`);
      setBatchText('');
      setBatchMode(false);
      fetchSubtasks();
      fetchTasks({}, null, true);
    } catch (err) {
      message.error(err.response?.data?.message || '批量添加失败');
    }
  };

  // 行内编辑子任务
  const handleStartEditSubtask = (subtask) => {
    setEditingSubtaskId(subtask.id);
    setEditSubtaskTitle(subtask.title);
  };

  const handleSaveEditSubtask = async (subtaskId) => {
    if (!editSubtaskTitle.trim()) return;
    try {
      await put(`/api/tasks/${currentDrawerTask.id}/subtasks/${subtaskId}`, { title: editSubtaskTitle.trim() });
      setEditingSubtaskId(null);
      setEditSubtaskTitle('');
      fetchSubtasks();
      fetchTasks({}, null, true);
    } catch { message.error('编辑失败'); }
  };

  const handleCancelEditSubtask = () => {
    setEditingSubtaskId(null);
    setEditSubtaskTitle('');
  };

  // 拖拽排序子任务
  const handleDragStartSubtask = (e, subtask) => {
    e.dataTransfer.setData('text/plain', JSON.stringify({ id: subtask.id }));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOverSubtask = (e, subtask) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverSubtaskId(subtask.id);
  };

  const handleDragLeaveSubtask = () => {
    setDragOverSubtaskId(null);
  };

  const handleDropSubtask = async (e, targetSubtask) => {
    e.preventDefault();
    setDragOverSubtaskId(null);
    try {
      const data = JSON.parse(e.dataTransfer.getData('text/plain'));
      if (data.id === targetSubtask.id) return;
      const reordered = [...subtasks];
      const fromIdx = reordered.findIndex(s => s.id === data.id);
      const toIdx = reordered.findIndex(s => s.id === targetSubtask.id);
      if (fromIdx === -1 || toIdx === -1) return;
      const [moved] = reordered.splice(fromIdx, 1);
      reordered.splice(toIdx, 0, moved);
      setSubtasks(reordered);
      await put(`/api/tasks/${currentDrawerTask.id}/subtasks/reorder`, {
        taskIds: reordered.map(s => s.id)
      });
    } catch { message.error('排序失败'); }
  };

  // 提升子任务为独立任务
  const handlePromoteSubtask = async (subtaskId) => {
    try {
      await put(`/api/tasks/${currentDrawerTask.id}/subtasks/${subtaskId}/promote`);
      message.success('子任务已提升为独立任务');
      fetchSubtasks();
      fetchTasks({}, null, true);
      fetchStats();
    } catch { message.error('操作失败'); }
  };

  const handleToggleSubtask = async (subtask) => {
    const newStatus = subtask.status === 'completed' ? 'pending' : 'completed';
    try {
      await put(`/api/tasks/${currentDrawerTask.id}/subtasks/${subtask.id}`, { status: newStatus });
      const res = await get(`/api/tasks/${currentDrawerTask.id}/subtasks`);
      const updatedSubtasks = res.data || [];
      setSubtasks(updatedSubtasks);
      fetchTasks({}, null, true);

      // 所有子任务完成时，提示完成父任务
      if (newStatus === 'completed' && updatedSubtasks.length > 0 &&
          updatedSubtasks.every(s => s.status === 'completed') &&
          currentDrawerTask.status !== 'completed') {
        message.info({
          content: '所有子任务已完成！要同时完成父任务吗？',
          duration: 5,
          btn: (
            <Button size="small" type="primary" onClick={async () => {
              try {
                await put(`/api/tasks/${currentDrawerTask.id}`, { status: 'completed' });
                message.success('父任务已完成');
                fetchTasks({}, null, true);
                fetchStats();
              } catch { message.error('操作失败'); }
            }}>
              完成父任务
            </Button>
          )
        });
      }
    } catch { message.error('操作失败'); }
  };

  // 修改子任务优先级
  const handleChangeSubtaskPriority = async (subtaskId, priority) => {
    try {
      await put(`/api/tasks/${currentDrawerTask.id}/subtasks/${subtaskId}`, { priority });
      fetchSubtasks();
      fetchTasks({}, null, true);
    } catch { message.error('修改优先级失败'); }
  };

  const handleDeleteSubtask = async (id) => {
    try {
      await del(`/api/tasks/${id}`);
      message.success('子任务已删除');
      fetchSubtasks();
      fetchTasks({}, null, true);
    } catch { message.error('删除失败'); }
  };

  const handleCommentChange = (e) => {
    const val = e.target.value;
    setCommentText(val);
    const atIdx = val.lastIndexOf('@');
    if (atIdx >= 0 && (atIdx === 0 || val[atIdx - 1] === ' ')) {
      setMentionSearch(val.slice(atIdx + 1).split(' ')[0]);
      setMentionVisible(true);
    } else {
      setMentionVisible(false);
    }
  };

  const filteredUsers = mentionSearch
    ? users.filter(u =>
        (u.real_name || u.username).toLowerCase().includes(mentionSearch.toLowerCase())
      ).slice(0, 5)
    : [];

  const insertMention = (user) => {
    const atIdx = commentText.lastIndexOf('@');
    setCommentText(commentText.slice(0, atIdx) + `@${user.real_name || user.username} `);
    setMentionVisible(false);
  };

  const handleAddComment = async () => {
    if (!commentText.trim()) return;
    try {
      await post(`/api/tasks/${currentDrawerTask.id}/comments`, {
        content: commentText.trim(),
        parent_id: replyTo
      });
      setCommentText('');
      setReplyTo(null);
      fetchComments();
    } catch (err) {
      message.error('评论失败');
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await del(`/api/comments/${commentId}`);
      fetchComments();
    } catch { message.error('删除失败'); }
  };

  if (!currentDrawerTask) return null;

  const task = currentDrawerTask;
  const statusConfig = STATUS_CONFIG[task.status] || {};
  const priorityConfig = PRIORITY_CONFIG[task.priority] || {};
  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'completed';

  // 内联分类管理
  const handleDrawerAddCategory = async () => {
    if (!drawerNewCategory.trim()) return;
    try {
      await post('/api/tasks/categories', { name: drawerNewCategory.trim() });
      message.success('分类已添加');
      setDrawerNewCategory('');
      await fetchCategories(true);
    } catch (err) {
      message.error(err.response?.data?.message || '添加失败');
    }
  };

  const handleDrawerDeleteCategory = async (catId) => {
    try {
      await del(`/api/tasks/categories/${catId}`);
      message.success('分类已删除');
      await fetchCategories(true);
    } catch (err) {
      message.error(err.response?.data?.message || '删除失败');
    }
  };

  // 内联新增负责人
  const handleDrawerAddUser = async () => {
    if (!drawerNewUser.trim()) return;
    try {
      await post('/api/tasks/users', { username: drawerNewUser.trim(), real_name: drawerNewUser.trim() });
      message.success('负责人已添加（默认密码 123456）');
      setDrawerNewUser('');
      await fetchUsers(true);
    } catch (err) {
      message.error(err.response?.data?.message || '添加失败');
    }
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      const submitData = {
        ...values,
        due_date: values.due_date ? values.due_date.format('YYYY-MM-DD') : null
      };
      await updateTask(task.id, submitData);
      message.success('任务已更新');
      closeDrawer();
    } catch (err) {
      if (!err.errorFields) {
        message.error(err.message || '保存失败');
      }
    }
  };

  const handleQuickToggle = async () => {
    const newStatus = task.status === 'completed' ? 'pending' : 'completed';
    try {
      await updateTask(task.id, { status: newStatus });
      message.success(newStatus === 'completed' ? '任务已完成 ✓' : '任务已恢复');
      closeDrawer();
    } catch (err) {
      message.error(err.message || '操作失败');
    }
  };

  return (
    <Drawer
      title={
        <Space>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 28,
            height: 28,
            borderRadius: 6,
            backgroundColor: statusConfig.bg,
            color: statusConfig.color
          }}>
            {statusConfig.icon}
          </span>
          <span style={{ fontSize: 16, fontWeight: 600 }}>{task.title}</span>
        </Space>
      }
      placement="right"
      width={520}
      open={drawerVisible}
      onClose={closeDrawer}
      extra={
        <Space>
          <Button onClick={handleQuickToggle}>
            {task.status === 'completed' ? <CloseOutlined /> : <CheckOutlined />}
            {task.status === 'completed' ? '恢复' : '完成'}
          </Button>
          <Button type="primary" icon={<EditOutlined />} onClick={handleSave}>
            保存修改
          </Button>
        </Space>
      }
      destroyOnClose
    >
      {/* 状态标签行 */}
      <div style={{ marginBottom: 16 }}>
        <Space size={8}>
          <Badge status={
            task.status === 'completed' ? 'success' :
            task.status === 'in_progress' ? 'processing' : 'warning'
          } />
          <Text style={{ color: statusConfig.color, fontWeight: 500 }}>{statusConfig.label}</Text>
          <Divider type="vertical" />
          <Tag color={priorityConfig.color} style={{ margin: 0, border: 'none' }}>
            {priorityConfig.label}优先级
          </Tag>
          {task.priority === 'high' && <StarOutlined style={{ color: '#ea4335' }} />}
          {isOverdue && <Tag color="error" style={{ margin: 0 }}><ExclamationCircleOutlined /> 已逾期</Tag>}
        </Space>
      </div>

      <Divider style={{ margin: '0 0 16px' }} />

      {/* 基本信息 */}
      <Descriptions column={2} size="small" style={{ marginBottom: 16 }}>
        <Descriptions.Item label={<><FolderOutlined /> 分类</>}>
          {task.category_name || <Text type="secondary">未分类</Text>}
        </Descriptions.Item>
        <Descriptions.Item label={<><UserOutlined /> 负责人</>}>
          {task.assignee_name || <Text type="secondary">未分配</Text>}
        </Descriptions.Item>
        <Descriptions.Item label={<><CalendarOutlined /> 创建时间</>}>
          {task.created_at ? new Date(task.created_at).toLocaleString('zh-CN') : '-'}
        </Descriptions.Item>
        <Descriptions.Item label={<><CalendarOutlined /> 更新时间</>}>
          {task.updated_at ? new Date(task.updated_at).toLocaleString('zh-CN') : '-'}
        </Descriptions.Item>
      </Descriptions>

      <Divider style={{ margin: '0 0 16px' }} />

      {/* 编辑表单 */}
      <Form
        form={form}
        layout="vertical"
        size="small"
      >
        <Form.Item name="title" label="任务标题" rules={[{ required: true, message: '请输入标题' }]}>
          <Input placeholder="输入任务标题" />
        </Form.Item>

        <Form.Item name="description" label="任务描述">
          <TextArea rows={3} placeholder="详细描述任务内容（可选）" showCount maxLength={500} />
        </Form.Item>

        <Space size="middle" style={{ width: '100%' }}>
          <Form.Item name="status" label="状态" style={{ flex: 1 }}>
            <Select>
              {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                <Option key={key} value={key}>
                  <Space>
                    <span style={{ color: config.color }}>{config.icon}</span>
                    {config.label}
                  </Space>
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="priority" label="优先级" style={{ flex: 1 }}>
            <Select>
              {Object.entries(PRIORITY_CONFIG).map(([key, config]) => (
                <Option key={key} value={key}>
                  <Space>
                    <Badge color={config.color} />
                    {config.label}
                  </Space>
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Space>

        <Space size="middle" style={{ width: '100%' }}>
          <Form.Item name="category_id" label="分类" style={{ flex: 1 }}>
            <Select
              placeholder="选择分类"
              allowClear
              dropdownRender={(menu) => (
                <div>
                  {menu}
                  <Divider style={{ margin: '4px 0' }} />
                  <div style={{ display: 'flex', padding: '0 8px 4px', gap: 4 }}>
                    <Input size="small" placeholder="新增分类"
                      value={drawerNewCategory}
                      onChange={(e) => setDrawerNewCategory(e.target.value)}
                      onPressEnter={handleDrawerAddCategory}
                      style={{ flex: 1 }} />
                    <Button size="small" type="link" icon={<PlusOutlined />} onClick={handleDrawerAddCategory}>添加</Button>
                  </div>
                  <div style={{ padding: '0 8px 8px' }}>
                    {categories.map(cat => (
                      <span key={cat.id} style={{ display: 'inline-flex', alignItems: 'center', marginRight: 8, marginTop: 4, padding: '0 6px', fontSize: 11, borderRadius: 4, background: '#f0f0f0' }}>
                        {cat.name}
                        <DeleteOutlined style={{ marginLeft: 4, fontSize: 10, color: '#999', cursor: 'pointer' }}
                          onClick={(e) => { e.stopPropagation(); handleDrawerDeleteCategory(cat.id); }} />
                      </span>
                    ))}
                  </div>
                </div>
              )}
            >
              {categories.map(cat => (
                <Option key={cat.id} value={cat.id}>
                  <Space>
                    <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', backgroundColor: cat.color || '#1890ff' }} />
                    {cat.name}
                  </Space>
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="assignee_id" label="负责人" style={{ flex: 1 }}>
            <Select
              placeholder="选择负责人"
              allowClear
              dropdownRender={(menu) => (
                <div>
                  {menu}
                  <Divider style={{ margin: '4px 0' }} />
                  <div style={{ display: 'flex', padding: '0 8px 8px', gap: 4 }}>
                    <Input size="small" placeholder="输入用户名添加"
                      value={drawerNewUser}
                      onChange={(e) => setDrawerNewUser(e.target.value)}
                      onPressEnter={handleDrawerAddUser}
                      style={{ flex: 1 }} />
                    <Button size="small" type="link" icon={<UserAddOutlined />} onClick={handleDrawerAddUser}>添加</Button>
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
          <DatePicker style={{ width: '100%' }} placeholder="选择日期" />
        </Form.Item>
      </Form>

      {/* 子任务区域 */}
      <Divider style={{ margin: '16px 0' }} />
      <div style={{ marginBottom: 4 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <CheckOutlined style={{ color: '#34a853' }} />
            <Text strong>子任务 ({subtasks.length})</Text>
          </div>
          <Button size="small" type="link" onClick={() => setBatchMode(!batchMode)}>
            {batchMode ? '单个添加' : '批量添加'}
          </Button>
        </div>

        {/* 已完成/未完成子任务统计 */}
        {subtasks.length > 0 && (
          <div style={{ marginBottom: 8 }}>
            <Progress
              percent={Math.round(subtasks.filter(s => s.status === 'completed').length / subtasks.length * 100)}
              size="small"
              strokeColor="#34a853"
              format={() => `${subtasks.filter(s => s.status === 'completed').length}/${subtasks.length}`}
            />
          </div>
        )}

        {/* 子任务列表 */}
        <div style={{ marginBottom: 8 }}>
          {subtasks.map(st => (
            <div key={st.id}
              draggable
              onDragStart={(e) => handleDragStartSubtask(e, st)}
              onDragOver={(e) => handleDragOverSubtask(e, st)}
              onDragLeave={handleDragLeaveSubtask}
              onDrop={(e) => handleDropSubtask(e, st)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '6px 4px',
                borderBottom: '1px solid #f5f5f5',
                borderRadius: 4,
                background: dragOverSubtaskId === st.id ? '#e8f0fe' : 'transparent',
                transition: 'background 0.15s'
              }}
            >
              {/* 拖拽手柄 */}
              <HolderOutlined style={{ fontSize: 12, color: '#bfbfbf', cursor: 'grab', flexShrink: 0 }} />

              {/* 完成复选框 */}
              <span
                onClick={() => handleToggleSubtask(st)}
                style={{
                  width: 16, height: 16, borderRadius: 4, cursor: 'pointer', flexShrink: 0,
                  border: `2px solid ${st.status === 'completed' ? '#34a853' : '#d9d9d9'}`,
                  background: st.status === 'completed' ? '#34a853' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.2s'
                }}
              >
                {st.status === 'completed' && <CheckOutlined style={{ fontSize: 10, color: '#fff' }} />}
              </span>

              {/* 标题（双击进入编辑） */}
              {editingSubtaskId === st.id ? (
                <Input
                  size="small"
                  value={editSubtaskTitle}
                  onChange={(e) => setEditSubtaskTitle(e.target.value)}
                  onPressEnter={() => handleSaveEditSubtask(st.id)}
                  onBlur={handleCancelEditSubtask}
                  autoFocus
                  style={{ flex: 1, fontSize: 13 }}
                />
              ) : (
                <Text
                  onDoubleClick={() => handleStartEditSubtask(st)}
                  style={{
                    flex: 1, fontSize: 13,
                    textDecoration: st.status === 'completed' ? 'line-through' : 'none',
                    color: st.status === 'completed' ? '#bfbfbf' : '#303030',
                    cursor: 'text', userSelect: 'none'
                  }}
                >
                  {st.title}
                </Text>
              )}

              {/* 优先级选择 */}
              <Select
                size="small"
                value={st.priority || 'medium'}
                onChange={(val) => handleChangeSubtaskPriority(st.id, val)}
                style={{ width: 72, flexShrink: 0 }}
                dropdownStyle={{ minWidth: 100 }}
              >
                {Object.entries(PRIORITY_CONFIG).map(([key, config]) => (
                  <Option key={key} value={key}>
                    <Space size={4}>
                      <Badge color={config.color} />
                      {config.label}
                    </Space>
                  </Option>
                ))}
              </Select>

              {/* 截止日期 */}
              <DatePicker
                size="small"
                value={st.due_date ? dayjs(st.due_date) : null}
                onChange={(date) => handleChangeSubtaskDueDate(
                  st.id, date ? date.format('YYYY-MM-DD') : null
                )}
                placeholder="截止"
                style={{ width: 110, flexShrink: 0 }}
                format="MM-DD"
                allowClear
              />

              {/* 提升为独立任务 */}
              <Tooltip title="提升为独立任务">
                <VerticalAlignTopOutlined
                  style={{ fontSize: 12, color: '#bfbfbf', cursor: 'pointer' }}
                  onClick={() => handlePromoteSubtask(st.id)}
                />
              </Tooltip>

              {/* 删除 */}
              <Popconfirm title="删除此子任务？" onConfirm={() => handleDeleteSubtask(st.id)} okText="删除" cancelText="取消">
                <DeleteOutlined
                  style={{ fontSize: 12, color: '#bfbfbf', cursor: 'pointer' }}
                />
              </Popconfirm>
            </div>
          ))}
        </div>

        {/* 新增子任务输入 */}
        {batchMode ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <TextArea
              rows={3}
              placeholder="每行一个子任务，回车分隔"
              value={batchText}
              onChange={(e) => setBatchText(e.target.value)}
              maxLength={1000}
            />
            <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
              <Button size="small" onClick={() => { setBatchMode(false); setBatchText(''); }}>
                取消
              </Button>
              <Button size="small" type="primary" icon={<PlusOutlined />}
                onClick={handleBatchAddSubtasks} disabled={!batchText.trim()}>
                批量添加
              </Button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 6 }}>
            <Input
              size="small"
              placeholder="添加子任务..."
              value={newSubtaskTitle}
              onChange={(e) => setNewSubtaskTitle(e.target.value)}
              onPressEnter={handleAddSubtask}
              style={{ flex: 1, minWidth: 0 }}
            />
            <Select
              size="small"
              value={newSubtaskPriority}
              onChange={setNewSubtaskPriority}
              style={{ width: 60, flexShrink: 0 }}
            >
              {Object.entries(PRIORITY_CONFIG).map(([key, config]) => (
                <Option key={key} value={key}>
                  <Badge color={config.color} />
                </Option>
              ))}
            </Select>
            <DatePicker
              size="small"
              value={newSubtaskDueDate}
              onChange={setNewSubtaskDueDate}
              placeholder="截止"
              format="MM-DD"
              allowClear
              style={{ width: 100, flexShrink: 0 }}
            />
            <Button size="small" type="link" icon={<PlusOutlined />} onClick={handleAddSubtask} style={{ flexShrink: 0 }}>
              添加
            </Button>
          </div>
        )}
      </div>

      <Divider style={{ margin: '16px 0' }} />
      <div style={{ marginTop: 4 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
          <MessageOutlined style={{ color: '#1a73e8' }} />
          <Text strong>评论 ({comments.length})</Text>
        </div>

        {/* 评论输入 */}
        <div style={{ marginBottom: 12 }}>
          {replyTo && (
            <div style={{ marginBottom: 4, fontSize: 12, color: '#5f6368' }}>
              回复中...
              <Button type="link" size="small" onClick={() => setReplyTo(null)}>取消</Button>
            </div>
          )}
          <div style={{ position: 'relative' }}>
            <Input.TextArea
              rows={2}
              value={commentText}
              onChange={handleCommentChange}
              placeholder={replyTo ? '输入回复内容（@人名可提及）...' : '添加评论（@人名可提及）...'}
              maxLength={500}
            />
            {mentionVisible && filteredUsers.length > 0 && (
              <div style={{
                position: 'absolute', bottom: '100%', left: 0, background: '#fff',
                border: '1px solid #e8e8e8', borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                zIndex: 10, minWidth: 160, maxHeight: 200, overflow: 'auto', marginBottom: 4
              }}>
                {filteredUsers.map(u => (
                  <div key={u.id}
                    onClick={() => insertMention(u)}
                    style={{
                      padding: '6px 12px', cursor: 'pointer', fontSize: 13,
                      borderBottom: '1px solid #f0f0f0'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = '#e8f0fe'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    {u.real_name || u.username}
                    <span style={{ color: '#9aa0a6', fontSize: 11, marginLeft: 6 }}>@{u.username}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <Button
            type="primary"
            size="small"
            onClick={handleAddComment}
            disabled={!commentText.trim()}
            style={{ marginTop: 8 }}
          >
            {replyTo ? '回复' : '评论'}
          </Button>
        </div>

        {/* 评论列表 */}
        <List
          loading={commentsLoading}
          dataSource={comments}
          locale={{ emptyText: <Text type="secondary">暂无评论</Text> }}
          renderItem={(comment) => (
            <div style={{ marginBottom: 12, paddingBottom: 12, borderBottom: '1px solid #f0f0f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Space size={6}>
                  <Text strong style={{ fontSize: 13 }}>
                    {comment.real_name || comment.username}
                  </Text>
                  {comment.role === 'admin' && <Tag color="blue" style={{ fontSize: 10, lineHeight: '16px', padding: '0 4px' }}>管理员</Tag>}
                  <Text type="secondary" style={{ fontSize: 11 }}>
                    {dayjs(comment.created_at).format('MM-DD HH:mm')}
                  </Text>
                </Space>
                {(comment.user_id === currentUser?.id || currentUser?.role === 'admin') && (
                  <Popconfirm title="删除这条评论？" onConfirm={() => handleDeleteComment(comment.id)} okText="删除" cancelText="取消">
                    <Button type="link" size="small" danger style={{ padding: 0, fontSize: 12 }}>删除</Button>
                  </Popconfirm>
                )}
              </div>
              <div style={{ marginTop: 4, fontSize: 13, color: '#202124', lineHeight: 1.5 }}>
                {comment.content}
              </div>
              <Button
                type="link"
                size="small"
                style={{ padding: 0, fontSize: 11 }}
                onClick={() => setReplyTo(comment.id)}
              >
                回复
              </Button>

              {/* 子回复 */}
              {comment.replies?.length > 0 && (
                <div style={{ marginTop: 8, marginLeft: 20, paddingLeft: 12, borderLeft: '2px solid #e8f0fe' }}>
                  {comment.replies.map(reply => (
                    <div key={reply.id} style={{ marginBottom: 8, paddingBottom: 8, borderBottom: '1px solid #f5f5f5' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Space size={6}>
                          <Text strong style={{ fontSize: 12 }}>{reply.real_name || reply.username}</Text>
                          <Text type="secondary" style={{ fontSize: 10 }}>
                            {dayjs(reply.created_at).format('MM-DD HH:mm')}
                          </Text>
                        </Space>
                        {(reply.user_id === currentUser?.id || currentUser?.role === 'admin') && (
                          <Popconfirm title="删除？" onConfirm={() => handleDeleteComment(reply.id)} okText="删除" cancelText="取消">
                            <Button type="link" size="small" danger style={{ padding: 0, fontSize: 11 }}>删除</Button>
                          </Popconfirm>
                        )}
                      </div>
                      <div style={{ fontSize: 12, color: '#202124', marginTop: 2 }}>{reply.content}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        />
      </div>
    </Drawer>
  );
};

export default TaskDetailDrawer;
