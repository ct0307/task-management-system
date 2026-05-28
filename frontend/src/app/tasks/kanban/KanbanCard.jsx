import React from 'react';
import { Tag, Typography, Space, Tooltip } from 'antd';
import {
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  EditOutlined,
  DeleteOutlined
} from '@ant-design/icons';
import { PRIORITY_CONFIG } from '@/constant/task';
import s from './index.module.less';

const { Text } = Typography;

const KanbanCard = ({ task, onEdit, onDelete, onDragStart, onDragOver, onDrop, onDragLeave, isDragOver, dropPosition }) => {
  const priorityConfig = PRIORITY_CONFIG[task.priority] || {};
  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'completed';

  const cardClass = [
    s.kanbanCard,
    isDragOver ? s.kanbanCardDragOver : ''
  ].filter(Boolean).join(' ');

  return (
    <div
      className={cardClass}
      draggable
      onDragStart={(e) => onDragStart?.(e, task)}
      onDragOver={(e) => onDragOver?.(e, task)}
      onDrop={(e) => onDrop?.(e, task)}
      onDragLeave={onDragLeave}
    >
      {/* 标题行 */}
      <div className={s.cardHeader}>
        <div className={s.cardTitle}>
          <Text
            ellipsis={{ tooltip: task.title }}
            delete={task.status === 'completed'}
            style={{ fontWeight: 500, fontSize: 14, color: task.status === 'completed' ? '#9aa0a6' : '#202124' }}
          >
            {task.title}
          </Text>
        </div>
        <div className={s.cardActions}>
          <Tooltip title="编辑">
            <EditOutlined className={s.cardAction} onClick={() => onEdit?.(task)} />
          </Tooltip>
          <Tooltip title="删除">
            <DeleteOutlined className={s.cardAction} onClick={() => onDelete?.(task.id)} />
          </Tooltip>
        </div>
      </div>

      {/* 描述 */}
      {task.description && (
        <Text
          className={s.cardDescription}
          ellipsis={{ rows: 2, tooltip: task.description }}
          type="secondary"
        >
          {task.description}
        </Text>
      )}

      {/* 标签行 */}
      <div className={s.cardTags}>
        <Space size={4} wrap>
          {/* 优先级标签 */}
          <Tag
            style={{
              margin: 0,
              fontSize: 11,
              padding: '0 6px',
              lineHeight: '20px',
              borderRadius: 4,
              backgroundColor: priorityConfig.bg,
              color: priorityConfig.color,
              border: 'none'
            }}
          >
            {priorityConfig.label}
          </Tag>

          {/* 分类标签 */}
          {task.category_name && (
            <Tag
              style={{
                margin: 0,
                fontSize: 11,
                padding: '0 6px',
                lineHeight: '20px',
                borderRadius: 4,
                border: 'none',
                background: '#f0f0f0',
                color: '#5f6368'
              }}
            >
              {task.category_name}
            </Tag>
          )}

          {/* 逾期标签 */}
          {isOverdue && (
            <Tag
              color="error"
              style={{
                margin: 0,
                fontSize: 11,
                padding: '0 6px',
                lineHeight: '20px',
                borderRadius: 4
              }}
            >
              <ExclamationCircleOutlined /> 逾期
            </Tag>
          )}
        </Space>
      </div>

      {/* 底部信息 */}
      <div className={s.cardFooter}>
        {task.due_date && (
          <span className={s.dueDate} style={isOverdue ? { color: '#ea4335' } : {}}>
            <ClockCircleOutlined /> {task.due_date.split('T')[0]}
          </span>
        )}
        {task.assignee_name && (
          <span className={s.assignee}>{task.assignee_name}</span>
        )}
      </div>
    </div>
  );
};

export default React.memo(KanbanCard);
