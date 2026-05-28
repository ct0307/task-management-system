import React, { useState, useCallback, useRef } from 'react';
import { Typography, Spin, Empty } from 'antd';
import KanbanCard from './KanbanCard';
import s from './index.module.less';

const { Text } = Typography;

const STATUS_META = {
  pending: {
    title: '待处理',
    color: '#f9ab00',
    icon: '📋',
    bg: '#fff8e1'
  },
  in_progress: {
    title: '进行中',
    color: '#1a73e8',
    icon: '🔄',
    bg: '#e3f2fd'
  },
  completed: {
    title: '已完成',
    color: '#34a853',
    icon: '✅',
    bg: '#e8f5e9'
  }
};

const KanbanColumn = ({
  status,
  tasks,
  loading,
  onEdit,
  onDelete,
  onDrop,
  onColumnReorder
}) => {
  const meta = STATUS_META[status] || { title: status, color: '#666', icon: '📌', bg: '#f5f5f5' };

  // 拖拽排序状态
  const [dragOverCardId, setDragOverCardId] = useState(null);
  const [dropPosition, setDropPosition] = useState(null); // 'top' | 'bottom'
  const draggedTaskIdRef = useRef(null);

  // 卡片拖拽开始
  const handleCardDragStart = useCallback((e, task) => {
    draggedTaskIdRef.current = task.id;
    e.dataTransfer.setData('text/plain', JSON.stringify({ id: task.id, status: task.status }));
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  // 卡片拖拽经过 — 判断位置
  const handleCardDragOver = useCallback((e, task) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    if (task.id === draggedTaskIdRef.current) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const threshold = rect.height / 2;
    const pos = y < threshold ? 'top' : 'bottom';

    if (dragOverCardId !== task.id || dropPosition !== pos) {
      setDragOverCardId(task.id);
      setDropPosition(pos);
    }
  }, [dragOverCardId, dropPosition]);

  // 卡片上释放
  const handleCardDrop = useCallback((e, targetTask) => {
    e.preventDefault();
    e.stopPropagation();

    const sourceData = JSON.parse(e.dataTransfer.getData('text/plain'));
    const sourceId = Number(sourceData.id);
    const sourceStatus = sourceData.status;

    if (sourceId === targetTask.id) {
      resetDragState();
      return;
    }

    // 构建列内新顺序
    const columnTaskIds = tasks.map(t => t.id);
    const sourceIdx = columnTaskIds.indexOf(sourceId);

    if (sourceIdx !== -1) {
      // 同列重排 — 移除源再插入到目标位置
      columnTaskIds.splice(sourceIdx, 1);
    }
    const targetIdx = columnTaskIds.indexOf(targetTask.id);
    const insertIdx = dropPosition === 'top' ? targetIdx : targetIdx + 1;
    columnTaskIds.splice(insertIdx, 0, sourceId);

    resetDragState();
    onColumnReorder?.(status, columnTaskIds);
  }, [tasks, status, dropPosition, onColumnReorder]);

  // 列体释放（拖到列末尾）
  const handleColumnDrop = useCallback((e) => {
    e.preventDefault();
    const data = JSON.parse(e.dataTransfer.getData('text/plain'));

    if (data.status === status) {
      // 同列拖到末尾 — 不变
      resetDragState();
      return;
    }

    // 跨列拖拽 — 沿用原有逻辑
    resetDragState();
    onDrop?.(e, status);
  }, [status, onDrop]);

  const resetDragState = () => {
    setDragOverCardId(null);
    setDropPosition(null);
  };

  // 拖拽离开卡片
  const handleCardDragLeave = useCallback(() => {
    setDragOverCardId(null);
    setDropPosition(null);
  }, []);

  // 全局拖拽结束清理
  const handleDragEnd = useCallback(() => {
    resetDragState();
    draggedTaskIdRef.current = null;
  }, []);

  return (
    <div
      className={s.kanbanColumn}
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
      }}
      onDrop={handleColumnDrop}
      onDragEnd={handleDragEnd}
    >
      {/* 列头 */}
      <div className={s.columnHeader} style={{ borderTopColor: meta.color }}>
        <div className={s.columnTitle}>
          <span className={s.columnIcon}>{meta.icon}</span>
          <span className={s.columnName}>{meta.title}</span>
          <span className={s.columnCount}>{tasks.length}</span>
        </div>
      </div>

      {/* 任务卡片列表 */}
      <div className={s.columnBody}>
        {loading ? (
          <div className={s.columnLoading}>
            <Spin size="small" />
          </div>
        ) : tasks.length > 0 ? (
          tasks.map((task) => (
            <React.Fragment key={task.id}>
              {/* 顶部插入指示器 */}
              {dragOverCardId === task.id && dropPosition === 'top' && (
                <div className={s.dropIndicator} />
              )}
              <KanbanCard
                task={task}
                onEdit={onEdit}
                onDelete={onDelete}
                onDragStart={handleCardDragStart}
                onDragOver={handleCardDragOver}
                onDrop={handleCardDrop}
                onDragLeave={handleCardDragLeave}
                isDragOver={dragOverCardId === task.id}
                dropPosition={dropPosition}
              />
              {/* 底部插入指示器 */}
              {dragOverCardId === task.id && dropPosition === 'bottom' && (
                <div className={s.dropIndicator} />
              )}
            </React.Fragment>
          ))
        ) : (
          <div className={s.columnEmpty}>
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <Text type="secondary" style={{ fontSize: 12 }}>暂无任务</Text>
              }
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default React.memo(KanbanColumn);
