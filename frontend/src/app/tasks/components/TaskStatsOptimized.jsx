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
      color: '#1a73e8',
      bgColor: '#e8f0fe'
    },
    {
      title: '待处理',
      value: stats.byStatus?.pending || 0,
      icon: <ClockCircleOutlined />,
      color: '#f9ab00',
      bgColor: '#fef7e0'
    },
    {
      title: '进行中',
      value: stats.byStatus?.in_progress || 0,
      icon: <ThunderboltOutlined />,
      color: '#1a73e8',
      bgColor: '#e8f0fe'
    },
    {
      title: '已完成',
      value: stats.byStatus?.completed || 0,
      icon: <CheckCircleOutlined />,
      color: '#34a853',
      bgColor: '#e6f4ea'
    },
    {
      title: '高优先级',
      value: stats.byPriority?.high || 0,
      icon: <WarningOutlined />,
      color: '#ea4335',
      bgColor: '#fce8e6'
    },
    {
      title: '已逾期',
      value: stats.overdue || 0,
      icon: <AlertOutlined />,
      color: stats.overdue > 0 ? '#ea4335' : '#34a853',
      bgColor: stats.overdue > 0 ? '#fce8e6' : '#e6f4ea'
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
