/**
 * 任务统计组件优化版
 * 更美观的统计卡片设计
 */
import React, { useEffect } from 'react';
import { Card, Row, Col } from 'antd';
import {
  FileTextOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  ThunderboltOutlined,
  AlertOutlined
} from '@ant-design/icons';
import StatCard from '@/component/StatCard';
import useTaskStore from '@/store/taskStore';
import s from '../index.module.less';

const TaskStatsOptimized = () => {
  const { stats, statsLoading, fetchStats } = useTaskStore();

  useEffect(() => {
    fetchStats();
  }, []);

  if (statsLoading || !stats) {
    return (
      <Row gutter={[16, 16]} className={s.statsRow}>
        {[...Array(4)].map((_, i) => (
          <Col xs={24} sm={12} lg={6} key={i}>
            <Card loading className="skeleton" style={{ height: 100 }} />
          </Col>
        ))}
      </Row>
    );
  }

  const statCards = [
    {
      title: '任务总数',
      value: stats.total || 0,
      icon: <FileTextOutlined />,
      color: '#e85d3a',
      bgColor: '#fdf0eb'
    },
    {
      title: '待处理',
      value: stats.byStatus?.pending || 0,
      icon: <ClockCircleOutlined />,
      color: '#d4972e',
      bgColor: '#fef5e6'
    },
    {
      title: '进行中',
      value: stats.byStatus?.in_progress || 0,
      icon: <ThunderboltOutlined />,
      color: '#e85d3a',
      bgColor: '#fdf0eb'
    },
    {
      title: '已完成',
      value: stats.byStatus?.completed || 0,
      icon: <CheckCircleOutlined />,
      color: '#3d8c5c',
      bgColor: '#eaf5ee'
    },
    {
      title: '高优先级',
      value: stats.byPriority?.high || 0,
      icon: <WarningOutlined />,
      color: '#d94436',
      bgColor: '#fce8e6'
    },
    {
      title: '已逾期',
      value: stats.overdue || 0,
      icon: <AlertOutlined />,
      color: stats.overdue > 0 ? '#d94436' : '#3d8c5c',
      bgColor: stats.overdue > 0 ? '#fce8e6' : '#eaf5ee'
    }
  ];

  return (
    <Row gutter={[16, 16]} className={s.statsRow}>
      {statCards.map((card, index) => (
        <Col xs={24} sm={12} lg={6} key={card.title}>
          <div
            className="animate-fade-in-up"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <StatCard {...card} />
          </div>
        </Col>
      ))}
    </Row>
  );
};

export default TaskStatsOptimized;
