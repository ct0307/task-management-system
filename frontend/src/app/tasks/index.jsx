/**
 * 任务管理页面
 * 包含任务统计、视图切换和任务列表
 */
import React from 'react';
import { Segmented, Breadcrumb, Switch } from 'antd';
import { TableOutlined, AppstoreOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import TaskStats from './components/TaskStatsOptimized';
import TaskList from './components/TaskListOptimized';
import TasksKanban from './kanban/TasksKanban';
import useTaskStore from '@/store/taskStore';
import { useAuth } from '@/hooks/useAuth';
import s from './index.module.less';

const Tasks = () => {
  const { viewMode, setViewMode, viewAll, setViewAll } = useTaskStore();
  const { isAdmin } = useAuth();

  return (
    <div className={s.tasks}>
      <Breadcrumb style={{ marginBottom: 12 }} items={[
        { title: <Link to="/dashboard">首页</Link> },
        { title: '任务管理' }
      ]} />
      <div className={s.header}>
        <div className={s.headerLeft}>
          <h1 className={s.title}>任务管理</h1>
          <Segmented
            className={s.viewSwitch}
            options={[
              { value: 'table', icon: <TableOutlined />, label: '表格' },
              { value: 'kanban', icon: <AppstoreOutlined />, label: '看板' }
            ]}
            value={viewMode}
            onChange={setViewMode}
          />
          {isAdmin && (
            <span className={s.viewAllSwitch}>
              <Switch
                size="small"
                checked={viewAll}
                onChange={setViewAll}
                checkedChildren="全部"
                unCheckedChildren="我的"
              />
            </span>
          )}
        </div>
      </div>
      <TaskStats />
      {viewMode === 'kanban' ? <TasksKanban /> : <TaskList />}
    </div>
  );
};

export default Tasks;
