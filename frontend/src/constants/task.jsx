import {
  CheckOutlined,
  ClockCircleOutlined,
  ThunderboltOutlined
} from '@ant-design/icons';
import React from 'react';

// 状态配置
export const STATUS_CONFIG = {
  pending: { label: '待处理', color: '#d4972e', bg: '#fef5e6', icon: <ClockCircleOutlined /> },
  in_progress: { label: '进行中', color: '#e85d3a', bg: '#fdf0eb', icon: <ThunderboltOutlined /> },
  completed: { label: '已完成', color: '#3d8c5c', bg: '#eaf5ee', icon: <CheckOutlined /> }
};

// 优先级配置
export const PRIORITY_CONFIG = {
  low: { label: '低', color: '#3d8c5c', bg: '#eaf5ee' },
  medium: { label: '中', color: '#d4972e', bg: '#fef5e6' },
  high: { label: '高', color: '#d94436', bg: '#fce8e6' }
};

// 状态选项（Select 用）
export const STATUS_OPTIONS = Object.entries(STATUS_CONFIG).map(([value, config]) => ({
  value,
  label: config.label
}));

// 优先级选项（Select 用）
export const PRIORITY_OPTIONS = Object.entries(PRIORITY_CONFIG).map(([value, config]) => ({
  value,
  label: config.label
}));
