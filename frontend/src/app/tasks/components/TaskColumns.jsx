import React from 'react';
import { Tag, Space, Tooltip, Button, Popconfirm, Typography, Badge, Progress } from 'antd';
import {
  EditOutlined,
  DeleteOutlined,
  CheckOutlined,
  UndoOutlined,
  StarOutlined,
  CopyOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  DownOutlined,
  RightOutlined,
  ApartmentOutlined
} from '@ant-design/icons';
import { STATUS_CONFIG, PRIORITY_CONFIG } from '@/constant/task';
import s from './index.module.less';

const { Text } = Typography;

const renderDueDate = (date) => {
  if (!date) return <Text type="secondary">-</Text>;
  const dateStr = date.split('T')[0];
  const now = new Date();
  const due = new Date(date);
  const diffDays = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
  const isOverdue = diffDays < 0;
  const isToday = diffDays === 0;
  const isTomorrow = diffDays === 1;
  const isDueSoon = diffDays > 1 && diffDays <= 3;

  let color, bg, icon, label;
  if (isOverdue) {
    color = '#ea4335'; bg = '#fce8e6'; icon = <ExclamationCircleOutlined />; label = `逾期${Math.abs(diffDays)}天`;
  } else if (isToday) {
    color = '#f9ab00'; bg = '#fef7e0'; icon = <ClockCircleOutlined />; label = '今天到期';
  } else if (isTomorrow) {
    color = '#f9ab00'; bg = '#fef7e0'; icon = <ClockCircleOutlined />; label = '明天到期';
  } else if (isDueSoon) {
    color = '#1a73e8'; bg = '#e8f0fe'; icon = <ClockCircleOutlined />; label = `${diffDays}天内`;
  } else {
    return <Text type="secondary">{dateStr}</Text>;
  }

  return (
    <Tooltip title={label}>
      <Tag style={{ margin: 0, border: 'none', borderRadius: 12, backgroundColor: bg, color, fontSize: 12, fontWeight: 500, padding: '2px 10px' }}>
        <Space size={4}>
          {icon}
          {dateStr}
        </Space>
      </Tag>
    </Tooltip>
  );
};

export const buildColumns = ({
  handleQuickToggle,
  handleQuickStatus,
  copyTask,
  openDrawer,
  handleDelete,
  expandedRowKeys,
  onExpand
}) => [
  {
    title: '任务标题',
    dataIndex: 'title',
    key: 'title',
    width: '30%',
    sorter: true,
    render: (text, record) => (
      <div className={s.taskTitleCell}>
        {/* 展开/收起子任务按钮 */}
        {record.subtask_count > 0 && (
          <span
            className={s.expandBtn}
            onClick={(e) => { e.stopPropagation(); onExpand?.(record); }}
          >
            {expandedRowKeys?.includes(record.id)
              ? <DownOutlined style={{ fontSize: 10 }} />
              : <RightOutlined style={{ fontSize: 10 }} />
            }
          </span>
        )}
        <Tooltip title={record.description || '暂无描述'}>
          <Text
            ellipsis
            delete={record.status === 'completed'}
            className={s.taskTitle}
            style={{ cursor: 'pointer' }}
            onClick={() => openDrawer(record)}
          >
            {text}
          </Text>
        </Tooltip>
        {/* 子任务标签（搜索时出现） */}
        {record.parent_title && (
          <Tooltip title={`属于：${record.parent_title}`}>
            <Tag className={s.priorityTag} style={{ background: '#f0f5ff', border: '1px solid #adc6ff', color: '#1a73e8' }}>
              <ApartmentOutlined /> {record.parent_title}
            </Tag>
          </Tooltip>
        )}
        {record.priority === 'high' && (
          <Tag color="error" className={s.priorityTag}>
            <StarOutlined /> 高优先
          </Tag>
        )}
      </div>
    )
  },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
    width: 120,
    sorter: true,
    render: (status, record) => {
      const config = STATUS_CONFIG[status];
      return (
        <div
          className={s.statusCell}
          onClick={() => handleQuickStatus(record)}
          style={{ cursor: 'pointer' }}
        >
          <span
            className={s.statusBadge}
            style={{ backgroundColor: config.bg, color: config.color }}
          >
            {config.icon}
            {config.label}
          </span>
        </div>
      );
    }
  },
  {
    title: '优先级',
    dataIndex: 'priority',
    key: 'priority',
    width: 80,
    sorter: true,
    render: (priority) => {
      const config = PRIORITY_CONFIG[priority];
      return (
        <Tag
          className={s.priorityBadge}
          style={{ backgroundColor: config.bg, color: config.color, border: 'none' }}
        >
          {config.label}
        </Tag>
      );
    }
  },
  {
    title: '分类',
    dataIndex: 'category_name',
    key: 'category',
    width: 100,
    render: (text) => text || <Text type="secondary">-</Text>
  },
  {
    title: '子任务',
    dataIndex: 'subtask_count',
    key: 'subtask_progress',
    width: 120,
    render: (count, record) => {
      if (!count || count === 0) return <Text type="secondary">-</Text>;
      // 从父任务数据中获取已完成子任务数
      const done = record.subtask_done || 0;
      const percent = Math.round(done / count * 100);
      return (
        <Tooltip title={`${done}/${count} 已完成`}>
          <div className={s.subtaskProgress}>
            <Progress
              percent={percent}
              size="small"
              strokeColor={percent === 100 ? '#34a853' : '#1a73e8'}
              style={{ margin: 0, width: '100%' }}
            />
          </div>
        </Tooltip>
      );
    }
  },
  {
    title: '创建人',
    dataIndex: 'creator_name',
    key: 'creator',
    width: 80,
    render: (text) => text || <Text type="secondary">-</Text>
  },
  {
    title: '截止日期',
    dataIndex: 'due_date',
    key: 'due_date',
    width: 140,
    sorter: true,
    render: (date) => renderDueDate(date)
  },
  {
    title: '操作',
    key: 'action',
    width: 140,
    render: (_, record) => (
      <Space size="small" className={s.actionButtons}>
        <Tooltip title={`快速${record.status === 'completed' ? '恢复' : '完成'} (C)`}>
          <Button
            type="text"
            size="small"
            icon={record.status === 'completed' ? <UndoOutlined /> : <CheckOutlined />}
            onClick={() => handleQuickToggle(record)}
            className={s.quickActionBtn}
          />
        </Tooltip>
        <Tooltip title="复制任务">
          <Button
            type="text"
            size="small"
            icon={<CopyOutlined />}
            onClick={() => copyTask(record)}
            className={s.quickActionBtn}
          />
        </Tooltip>
        <Tooltip title="编辑 (E)">
          <Button
            type="text"
            size="small"
            icon={<EditOutlined />}
            onClick={() => openDrawer(record)}
            className={s.quickActionBtn}
          />
        </Tooltip>
        <Popconfirm
          title="确定删除？"
          description="删除后不可恢复"
          onConfirm={() => handleDelete(record.id)}
          okText="删除"
          cancelText="取消"
          okButtonProps={{ danger: true }}
        >
          <Tooltip title="删除">
            <Button
              type="text"
              size="small"
              danger
              icon={<DeleteOutlined />}
              className={s.quickActionBtn}
            />
          </Tooltip>
        </Popconfirm>
      </Space>
    )
  }
];
