import React, { useEffect, useState, useCallback } from 'react';
import {
  Card,
  Table,
  Button,
  Tag,
  Space,
  Modal,
  Form,
  Input,
  Select,
  message,
  Popconfirm,
  Typography,
  Row,
  Col,
  Statistic,
  Spin,
  Tabs,
  Empty,
  Tooltip
} from 'antd';
import {
  UserOutlined,
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  FolderOutlined,
  ReloadOutlined,
  TeamOutlined,
  FileTextOutlined,
  TagsOutlined
} from '@ant-design/icons';
import { get, post, put, del } from '@/util/request';
import {
  API_ADMIN_USERS,
  API_ADMIN_CATEGORIES,
  API_TASK_STATS
} from '@/constants/urls';
import s from './index.module.less';

const { Title, Text } = Typography;
const { Option } = Select;

/**
 * 用户管理组件
 */
const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [form] = Form.useForm();

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await get(API_ADMIN_USERS);
      setUsers(res.data || []);
    } catch (err) {
      message.error('获取用户列表失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleEdit = (record) => {
    setCurrentUser(record);
    form.setFieldsValue(record);
    setEditModal(true);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      await put(`${API_ADMIN_USERS}/${currentUser.id}`, values);
      message.success('用户更新成功');
      setEditModal(false);
      fetchUsers();
    } catch (err) {
      if (!err.errorFields) {
        message.error(err.message || '更新失败');
      }
    }
  };

  const handleDelete = async (id) => {
    try {
      await del(`${API_ADMIN_USERS}/${id}`);
      message.success('用户已删除');
      fetchUsers();
    } catch (err) {
      message.error(err.message || '删除失败');
    }
  };

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
    { title: '用户名', dataIndex: 'username', key: 'username', width: 120 },
    { title: '姓名', dataIndex: 'real_name', key: 'real_name', width: 120, render: (v) => v || '-' },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      width: 100,
      render: (role) => (
        <Tag color={role === 'admin' ? 'blue' : 'default'}>
          {role === 'admin' ? '管理员' : '普通用户'}
        </Tag>
      )
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 160,
      render: (v) => v ? new Date(v).toLocaleString('zh-CN') : '-'
    },
    {
      title: '操作',
      key: 'action',
      width: 140,
      render: (_, record) => (
        <Space>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Popconfirm title="确定删除该用户？" onConfirm={() => handleDelete(record.id)} okText="删除" cancelText="取消" okButtonProps={{ danger: true }}>
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <div>
      <div className={s.sectionHeader}>
        <Title level={5}><TeamOutlined /> 用户管理</Title>
        <Button icon={<ReloadOutlined />} onClick={fetchUsers} loading={loading}>
          刷新
        </Button>
      </div>
      <Table
        columns={columns}
        dataSource={users}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10, showTotal: (total) => `共 ${total} 个用户` }}
        locale={{ emptyText: <Empty description="暂无用户数据" /> }}
      />

      <Modal
        title="编辑用户"
        open={editModal}
        onOk={handleSave}
        onCancel={() => setEditModal(false)}
        okText="保存"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Form.Item name="real_name" label="姓名">
            <Input placeholder="输入用户姓名" />
          </Form.Item>
          <Form.Item name="role" label="角色" rules={[{ required: true }]}>
            <Select>
              <Option value="user">普通用户</Option>
              <Option value="admin">管理员</Option>
            </Select>
          </Form.Item>
          <Form.Item name="password" label="新密码（不修改则留空）">
            <Input.Password placeholder="留空则不修改密码" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

/**
 * 分类管理组件
 */
const CategoryManagement = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [currentCategory, setCurrentCategory] = useState(null);
  const [form] = Form.useForm();

  const PRESET_COLORS = [
    '#1890ff', '#52c41a', '#faad14', '#722ed1', '#eb2f96',
    '#13c2c2', '#fa8c16', '#a0d911', '#f5222d', '#2f54eb'
  ];

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const res = await get(API_ADMIN_CATEGORIES);
      setCategories(res.data || []);
    } catch (err) {
      message.error('获取分类列表失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleCreate = () => {
    setCurrentCategory(null);
    form.resetFields();
    form.setFieldsValue({ color: PRESET_COLORS[0] });
    setEditModal(true);
  };

  const handleEdit = (record) => {
    setCurrentCategory(record);
    form.setFieldsValue(record);
    setEditModal(true);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      if (currentCategory) {
        await put(`${API_ADMIN_CATEGORIES}/${currentCategory.id}`, values);
        message.success('分类更新成功');
      } else {
        await post(API_ADMIN_CATEGORIES, values);
        message.success('分类创建成功');
      }
      setEditModal(false);
      fetchCategories();
    } catch (err) {
      if (!err.errorFields) {
        message.error(err.message || '操作失败');
      }
    }
  };

  const handleDelete = async (id) => {
    try {
      await del(`${API_ADMIN_CATEGORIES}/${id}`);
      message.success('分类已删除');
      fetchCategories();
    } catch (err) {
      message.error(err.message || '删除失败');
    }
  };

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <Space>
          <span style={{
            display: 'inline-block',
            width: 12,
            height: 12,
            borderRadius: 3,
            backgroundColor: record.color || '#1890ff'
          }} />
          {text}
        </Space>
      )
    },
    {
      title: '颜色',
      dataIndex: 'color',
      key: 'color',
      render: (color) => (
        <Tag color={color}>{color}</Tag>
      )
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 160,
      render: (v) => v ? new Date(v).toLocaleString('zh-CN') : '-'
    },
    {
      title: '操作',
      key: 'action',
      width: 140,
      render: (_, record) => (
        <Space>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Popconfirm title="确定删除该分类？" onConfirm={() => handleDelete(record.id)} okText="删除" cancelText="取消" okButtonProps={{ danger: true }}>
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <div>
      <div className={s.sectionHeader}>
        <Title level={5}><TagsOutlined /> 分类管理</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
          新增分类
        </Button>
      </div>
      <Table
        columns={columns}
        dataSource={categories}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10, showTotal: (total) => `共 ${total} 个分类` }}
        locale={{ emptyText: <Empty description="暂无分类数据" /> }}
      />

      <Modal
        title={currentCategory ? '编辑分类' : '新增分类'}
        open={editModal}
        onOk={handleSave}
        onCancel={() => setEditModal(false)}
        okText="保存"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="分类名称" rules={[{ required: true, message: '请输入分类名称' }]}>
            <Input placeholder="输入分类名称" />
          </Form.Item>
          <Form.Item name="color" label="颜色">
            <Select>
              {PRESET_COLORS.map(color => (
                <Option key={color} value={color}>
                  <Space>
                    <span style={{
                      display: 'inline-block',
                      width: 16,
                      height: 16,
                      borderRadius: 4,
                      backgroundColor: color
                    }} />
                    {color}
                  </Space>
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

/**
 * Admin 主页面
 */
const Admin = () => {
  const [systemStats, setSystemStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await get(API_TASK_STATS);
        setSystemStats(res.data);
      } catch {
        // ignore
      } finally {
        setStatsLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className={s.admin}>
      <Title level={2} className={s.title}>系统管理</Title>

      {/* 系统概览 */}
      <Row gutter={[16, 16]} className={s.statsRow}>
        <Col xs={12} sm={6} lg={6}>
          <Card className={s.statCard} loading={statsLoading}>
            <Statistic
              title="任务总数"
              value={systemStats?.total || 0}
              prefix={<FileTextOutlined style={{ color: '#e85d3a' }} />}
              valueStyle={{ color: '#e85d3a' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6} lg={6}>
          <Card className={s.statCard} loading={statsLoading}>
            <Statistic
              title="已完成"
              value={systemStats?.byStatus?.completed || 0}
              prefix={<FileTextOutlined style={{ color: '#3d8c5c' }} />}
              valueStyle={{ color: '#3d8c5c' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6} lg={6}>
          <Card className={s.statCard} loading={statsLoading}>
            <Statistic
              title="逾期任务"
              value={systemStats?.overdue || 0}
              prefix={<FileTextOutlined style={{ color: '#d94436' }} />}
              valueStyle={{ color: systemStats?.overdue > 0 ? '#d94436' : '#3d8c5c' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6} lg={6}>
          <Card className={s.statCard} loading={statsLoading}>
            <Statistic
              title="高优先级"
              value={systemStats?.byPriority?.high || 0}
              prefix={<FileTextOutlined style={{ color: '#d94436' }} />}
              valueStyle={{ color: '#d94436' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 标签页：用户管理 + 分类管理 */}
      <Card className={s.contentCard}>
        <Tabs
          defaultActiveKey="users"
          items={[
            {
              key: 'users',
              label: <span><TeamOutlined /> 用户管理</span>,
              children: <UserManagement />
            },
            {
              key: 'categories',
              label: <span><TagsOutlined /> 分类管理</span>,
              children: <CategoryManagement />
            }
          ]}
        />
      </Card>
    </div>
  );
};

export default Admin;
