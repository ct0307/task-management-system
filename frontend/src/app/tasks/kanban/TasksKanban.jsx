import React, { useCallback, useMemo } from 'react';
import { Row, Col, message } from 'antd';
import useTaskStore from '../store/taskStore';
import KanbanColumn from './KanbanColumn';
import s from './index.module.less';

const STATUS_ORDER = ['pending', 'in_progress', 'completed'];

const TasksKanban = () => {
  const {
    tasks,
    tasksLoading,
    openModal,
    deleteTask,
    updateTask,
    reorderTasks,
    fetchTasks,
    fetchStats
  } = useTaskStore();

  // 按状态分组（缓存避免拖拽时重复计算）
  const groupedTasks = useMemo(() => {
    return STATUS_ORDER.reduce((acc, status) => {
      acc[status] = tasks.filter(t => t.status === status);
      return acc;
    }, {});
  }, [tasks]);

  // 跨列拖拽放置处理
  const handleDrop = useCallback(async (e, targetStatus) => {
    try {
      const data = JSON.parse(e.dataTransfer.getData('text/plain'));
      if (data.status !== targetStatus) {
        // 将任务放到目标列末尾
        const targetTasks = tasks.filter(t => t.status === targetStatus);
        const targetIds = targetTasks.map(t => t.id);
        targetIds.push(data.id);

        await reorderTasks(targetStatus, targetIds);
        message.success('任务状态已更新');
        fetchTasks();
        fetchStats();
      }
    } catch (err) {
      message.error('更新状态失败');
    }
  }, [tasks, reorderTasks, fetchTasks, fetchStats]);

  // 列内重排序
  const handleColumnReorder = useCallback(async (status, taskIds) => {
    try {
      await reorderTasks(status, taskIds);
    } catch (err) {
      message.error('排序更新失败');
    }
  }, [reorderTasks]);

  // 删除任务
  const handleDelete = useCallback(async (id) => {
    try {
      await deleteTask(id);
      message.success('任务已删除');
    } catch (err) {
      message.error('删除失败');
    }
  }, [deleteTask]);

  return (
    <div className={s.kanbanView}>
      <Row gutter={[16, 16]} className={s.kanbanRow}>
        {STATUS_ORDER.map((status) => (
          <Col xs={24} lg={8} key={status}>
            <KanbanColumn
              status={status}
              tasks={groupedTasks[status] || []}
              loading={tasksLoading}
              onEdit={openModal}
              onDelete={handleDelete}
              onDrop={handleDrop}
              onColumnReorder={handleColumnReorder}
            />
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default TasksKanban;
