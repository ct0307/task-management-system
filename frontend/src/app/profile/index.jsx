/**
 * 个人设置页面
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  Card, Form, Input, Button, message, Typography, Space, Tag,
  Modal, Skeleton, Divider
} from 'antd';
import {
  LockOutlined, UserOutlined, EditOutlined,
  CheckCircleOutlined, ClockCircleOutlined, ThunderboltOutlined,
  ExclamationCircleOutlined, CalendarOutlined, CrownOutlined,
  MailOutlined
} from '@ant-design/icons';
import { put, get } from '@/util/request';
import useAuthStore from '@/store/authStore';
import token from '@/util/token';
import dayjs from 'dayjs';
import s from './index.module.less';

const { Title, Text } = Typography;

const Profile = () => {
  const [loading, setLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, byStatus: {}, overdue: 0 });
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editForm] = Form.useForm();
  const [pwdForm] = Form.useForm();

  const currentUser = useAuthStore(s => s.currentUser);
  const setCurrentUser = useAuthStore(s => s.setCurrentUser);
  const user = token.loadUser();

  // 加载任务统计
  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const res = await get('/api/tasks/stats/overview');
      setStats(res.data || { total: 0, byStatus: {}, overdue: 0 });
    } catch { /* ignore */ }
    finally { setStatsLoading(false); }
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  // 编辑个人信息
  const handleOpenEdit = () => {
    editForm.setFieldsValue({ real_name: user?.real_name || '' });
    setEditModalOpen(true);
  };

  const handleSaveProfile = async (values) => {
    setLoading(true);
    try {
      const res = await put('/api/auth/profile', { real_name: values.real_name.trim() });
      // 更新 localStorage 中的用户信息
      token.saveUser({ ...res.data.user, token: res.data.token });
      setCurrentUser(res.data.user);
      message.success('个人信息已更新');
      setEditModalOpen(false);
    } catch (err) {
      message.error(err.response?.data?.message || '更新失败');
    } finally {
      setLoading(false);
    }
  };

  // 修改密码
  const handleChangePassword = async (values) => {
    setLoading(true);
    try {
      await put('/api/auth/password', {
        oldPassword: values.oldPassword,
        newPassword: values.newPassword
      });
      message.success('密码修改成功，下次登录时请使用新密码');
      pwdForm.resetFields();
    } catch (err) {
      message.error(err.response?.data?.message || '修改失败');
    } finally {
      setLoading(false);
    }
  };

  const initials = (user?.real_name || user?.username || '?').slice(0, 2).toUpperCase();
  const roleName = user?.role === 'admin' ? '管理员' : '普通用户';
  const statusColor = {
    total: '#e85d3a', completed: '#3d8c5c',
    in_progress: '#e85d3a', pending: '#d4972e', overdue: '#d94436'
  };

  return (
    <div className={s.profile}>
      <Title level={2} className={s.pageTitle}>
        <UserOutlined />个人设置
      </Title>

      {/* 用户卡片 */}
      <div className={s.userCard}>
        <div className={s.avatar}>{initials}</div>
        <div className={s.userInfo}>
          <div className={s.name}>{user?.real_name || user?.username}</div>
          <div className={s.meta}>
            <span><MailOutlined style={{ marginRight: 4 }} />{user?.username}</span>
            <span><CrownOutlined style={{ marginRight: 4 }} />{roleName}</span>
            <span><CalendarOutlined style={{ marginRight: 4 }} />
              {user?.created_at ? dayjs(user.created_at).format('YYYY-MM-DD') : '-'} 加入
            </span>
          </div>
        </div>
        <Button ghost className={s.editBtn} icon={<EditOutlined />} onClick={handleOpenEdit}>
          编辑资料
        </Button>
      </div>

      {/* 统计卡片 */}
      {statsLoading ? (
        <div className={s.statsGrid}>
          {[...Array(4)].map((_, i) => (
            <div key={i} className={s.statCard}><Skeleton active paragraph={false} /></div>
          ))}
        </div>
      ) : (
        <div className={s.statsGrid}>
          <div className={s.statCard}>
            <div className={s.statNum} style={{ color: statusColor.total }}>{stats.total || 0}</div>
            <div className={s.statLabel}>总任务数</div>
          </div>
          <div className={s.statCard}>
            <div className={s.statNum} style={{ color: statusColor.completed }}>
              {stats.byStatus?.completed || 0}
            </div>
            <div className={s.statLabel}><CheckCircleOutlined /> 已完成</div>
          </div>
          <div className={s.statCard}>
            <div className={s.statNum} style={{ color: statusColor.in_progress }}>
              {stats.byStatus?.in_progress || 0}
            </div>
            <div className={s.statLabel}><ThunderboltOutlined /> 进行中</div>
          </div>
          <div className={s.statCard}>
            <div className={s.statNum} style={{ color: statusColor.overdue }}>{stats.overdue || 0}</div>
            <div className={s.statLabel}><ExclamationCircleOutlined /> 已逾期</div>
          </div>
        </div>
      )}

      {/* 账号详情 */}
      <Card className={s.sectionCard} title={<Space><UserOutlined />账号详情</Space>}>
        <div className={s.detailItem}>
          <span className={s.detailLabel}>用户名</span>
          <span className={s.detailValue}>{user?.username || '-'}</span>
        </div>
        <div className={s.detailItem}>
          <span className={s.detailLabel}>姓名</span>
          <span className={s.detailValue}>{user?.real_name || '-'}</span>
        </div>
        <div className={s.detailItem}>
          <span className={s.detailLabel}>角色</span>
          <span className={s.detailValue}>
            <Tag color={user?.role === 'admin' ? 'blue' : 'default'}>{roleName}</Tag>
          </span>
        </div>
        <div className={s.detailItem}>
          <span className={s.detailLabel}>注册时间</span>
          <span className={s.detailValue}>
            {user?.created_at ? dayjs(user.created_at).format('YYYY-MM-DD HH:mm') : '-'}
          </span>
        </div>
      </Card>

      {/* 修改密码 */}
      <Card className={s.sectionCard} title={<Space><LockOutlined />修改密码</Space>}>
        <div className={s.formWidth}>
          <Form form={pwdForm} layout="vertical" onFinish={handleChangePassword}>
            <Form.Item
              name="oldPassword"
              label="当前密码"
              rules={[{ required: true, message: '请输入当前密码' }]}
            >
              <Input.Password placeholder="输入当前密码" />
            </Form.Item>
            <Form.Item
              name="newPassword"
              label="新密码"
              rules={[
                { required: true, message: '请输入新密码' },
                { min: 4, message: '密码至少4个字符' }
              ]}
            >
              <Input.Password placeholder="输入新密码" />
            </Form.Item>
            <Form.Item
              name="confirmPassword"
              label="确认新密码"
              dependencies={['newPassword']}
              rules={[
                { required: true, message: '请确认新密码' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('newPassword') === value) return Promise.resolve();
                    return Promise.reject(new Error('两次密码不一致'));
                  }
                })
              ]}
            >
              <Input.Password placeholder="再次输入新密码" />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" loading={loading}>修改密码</Button>
            </Form.Item>
          </Form>
        </div>
      </Card>

      {/* 编辑资料弹窗 */}
      <Modal
        title={<Space><EditOutlined />编辑个人资料</Space>}
        open={editModalOpen}
        onOk={() => editForm.submit()}
        onCancel={() => setEditModalOpen(false)}
        confirmLoading={loading}
        okText="保存"
        cancelText="取消"
        destroyOnClose
      >
        <Form form={editForm} layout="vertical" onFinish={handleSaveProfile} style={{ marginTop: 16 }}>
          <Form.Item label="用户名">
            <Input value={user?.username || ''} disabled />
            <Text type="secondary" style={{ fontSize: 12 }}>用户名不可修改</Text>
          </Form.Item>
          <Form.Item
            name="real_name"
            label="姓名"
            rules={[{ required: true, message: '请输入姓名' }]}
          >
            <Input placeholder="输入你的姓名" maxLength={20} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Profile;
