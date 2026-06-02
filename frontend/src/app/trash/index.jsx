import React, { useEffect, useState, useCallback } from 'react';
import { Button, Space, Tag, message, Popconfirm, Empty, Spin, Typography, Tooltip } from 'antd';
import { UndoOutlined, DeleteOutlined, InboxOutlined, ClockCircleOutlined, ReloadOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { get, put, del } from '@/util/request';
import { API_TASK_LIST } from '@/constants/urls';
import { STATUS_CONFIG, PRIORITY_CONFIG } from '@/constants/task';
import s from './index.module.less';

const { Text } = Typography;

// 计算距离永久删除的天数（默认30天后自动清理）
const AUTO_CLEAN_DAYS = 30;

const Trash = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchTrash = useCallback(async () => {
    setLoading(true);
    try {
      const res = await get(`${API_TASK_LIST}/trash`, { page: 1, pageSize: 200 });
      setTasks(res.data?.data || []);
    } catch { message.error('获取回收站数据失败'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchTrash(); }, [fetchTrash]);

  // 乐观更新：立即从列表移除，失败时恢复
  const handleRestore = async (id) => {
    const task = tasks.find(t => t.id === id);
    setTasks(prev => prev.filter(t => t.id !== id));
    try {
      await put(`${API_TASK_LIST}/${id}/restore`);
      message.success(`「${task?.title}」已恢复`);
    } catch {
      setTasks(prev => [...prev, task].sort((a, b) => new Date(b.deleted_at) - new Date(a.deleted_at)));
      message.error('恢复失败');
    }
  };

  const handlePermanentDelete = async (id) => {
    const task = tasks.find(t => t.id === id);
    setTasks(prev => prev.filter(t => t.id !== id));
    try {
      await del(`${API_TASK_LIST}/${id}/permanent`);
      message.success('已永久删除');
    } catch {
      setTasks(prev => [...prev, task].sort((a, b) => new Date(b.deleted_at) - new Date(a.deleted_at)));
      message.error('删除失败');
    }
  };

  // 一键清空
  const handleEmptyAll = async () => {
    const ids = tasks.map(t => t.id);
    setTasks([]);
    let failed = 0;
    for (const id of ids) {
      try { await del(`${API_TASK_LIST}/${id}/permanent`); }
      catch { failed++; }
    }
    if (failed > 0) {
      message.warning(`${failed} 条删除失败，请刷新`);
      fetchTrash();
    } else {
      message.success('回收站已清空');
    }
  };

  // 一键恢复全部
  const handleRestoreAll = async () => {
    const ids = tasks.map(t => t.id);
    setTasks([]);
    let failed = 0;
    for (const id of ids) {
      try { await put(`${API_TASK_LIST}/${id}/restore`); }
      catch { failed++; }
    }
    if (failed > 0) {
      message.warning(`${failed} 条恢复失败，请刷新`);
      fetchTrash();
    } else {
      message.success('全部任务已恢复');
    }
  };

  // 按日期分组（deleted_at 空值保护）
  const groups = {};
  tasks.forEach(t => {
    const safeDate = t.deleted_at ? dayjs(t.deleted_at) : dayjs();
    const dateKey = safeDate.format('YYYY-MM-DD');
    if (!groups[dateKey]) groups[dateKey] = [];
    groups[dateKey].push(t);
  });

  const todayStr = dayjs().format('YYYY-MM-DD');
  const yesterdayStr = dayjs().subtract(1, 'day').format('YYYY-MM-DD');

  const getDateLabel = (key) => {
    if (!key || !/^\d{4}-\d{2}-\d{2}$/.test(key)) return '未知';
    if (key === todayStr) return '今天';
    if (key === yesterdayStr) return '昨天';
    const daysAgo = dayjs().diff(dayjs(key), 'day');
    if (daysAgo <= 7) return `${daysAgo} 天前`;
    return dayjs(key).format('M月D日');
  };

  return (
    <div className={s.root}>
      {/* 头部 */}
      <div className={s.header}>
        <div className={s.headerLeft}>
          <div className={s.headerIcon}>
            <InboxOutlined />
          </div>
          <div>
            <h2 className={s.title}>回收站</h2>
            <Text type="secondary" className={s.subtitle}>
              {tasks.length > 0
                ? `${tasks.length} 个任务，${AUTO_CLEAN_DAYS} 天后自动清理`
                : '回收站为空'}
            </Text>
          </div>
        </div>
        <Space>
          {tasks.length > 0 && (
            <>
              <Popconfirm title="恢复回收站中全部任务？" onConfirm={handleRestoreAll} okText="全部恢复">
                <Button icon={<UndoOutlined />}>全部恢复</Button>
              </Popconfirm>
              <Popconfirm title="永久删除回收站中全部任务？此操作不可撤销！" onConfirm={handleEmptyAll}
                okText="全部删除" okButtonProps={{ danger: true }}>
                <Button danger icon={<DeleteOutlined />}>清空回收站</Button>
              </Popconfirm>
            </>
          )}
          <Button icon={<ReloadOutlined />} onClick={fetchTrash} loading={loading}>刷新</Button>
        </Space>
      </div>

      {/* 列表 */}
      {loading ? (
        <div className={s.loadingWrap}><Spin size="large" /></div>
      ) : tasks.length === 0 ? (
        <div className={s.emptyWrap}>
          <InboxOutlined className={s.emptyIcon} />
          <Text type="secondary">回收站空空如也</Text>
        </div>
      ) : (
        <div className={s.list}>
          {Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0])).map(([dateKey, groupItems]) => (
            <div key={dateKey} className={s.group}>
              <div className={s.groupLabel}>
                <span className={s.groupDot} />
                {getDateLabel(dateKey)}
                <span className={s.groupCount}>{groupItems.length}</span>
              </div>
              {groupItems.map(t => {
                const statusCfg = STATUS_CONFIG[t.status];
                const priorityCfg = PRIORITY_CONFIG[t.priority];
                const deletedDate = t.deleted_at ? dayjs(t.deleted_at) : dayjs();
                const autoCleanDate = deletedDate.add(AUTO_CLEAN_DAYS, 'day');
                const daysLeft = autoCleanDate.diff(dayjs(), 'day');
                const isExpiring = daysLeft <= 3;

                return (
                  <div key={t.id} className={s.card}>
                    <div className={s.cardLeft}>
                      <span className={s.cardTitle}>{t.title}</span>
                      <div className={s.cardMeta}>
                        {statusCfg && <Tag color={statusCfg.color} className={s.metaTag}>{statusCfg.label}</Tag>}
                        {priorityCfg && <Tag color={priorityCfg.color} className={s.metaTag}>{priorityCfg.label}</Tag>}
                        {t.category_name && <Tag className={s.metaTag}>{t.category_name}</Tag>}
                      </div>
                    </div>
                    <div className={s.cardRight}>
                      <Tooltip title={`${deletedDate.format('MM-DD HH:mm')} 删除，${autoCleanDate.format('M月D日')} 自动清理`}>
                        <span className={`${s.expireBadge} ${isExpiring ? s.expireSoon : ''}`}>
                          <ClockCircleOutlined style={{ marginRight: 3 }} />
                          {daysLeft <= 0 ? '即将清理' : `${daysLeft}天`}
                        </span>
                      </Tooltip>
                      <Button type="text" size="small" icon={<UndoOutlined />}
                        onClick={() => handleRestore(t.id)} className={s.actionBtn}>
                        恢复
                      </Button>
                      <Popconfirm title="永久删除？" onConfirm={() => handlePermanentDelete(t.id)}
                        okText="删除" okButtonProps={{ danger: true }} placement="topRight">
                        <Button type="text" size="small" danger icon={<DeleteOutlined />}
                          className={s.actionBtn} />
                      </Popconfirm>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Trash;
