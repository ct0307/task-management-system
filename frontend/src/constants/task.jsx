import {
  CheckOutlined,
  ClockCircleOutlined,
  ThunderboltOutlined
} from '@ant-design/icons';
import React from 'react';

// 状态配置
export const STATUS_CONFIG = {
  pending: { label: '待处理', color: '#f9ab00', bg: '#fef7e0', icon: <ClockCircleOutlined /> },
  in_progress: { label: '进行中', color: '#1a73e8', bg: '#e8f0fe', icon: <ThunderboltOutlined /> },
  completed: { label: '已完成', color: '#34a853', bg: '#e6f4ea', icon: <CheckOutlined /> }
};

// 优先级配置
export const PRIORITY_CONFIG = {
  low: { label: '低', color: '#34a853', bg: '#e6f4ea' },
  medium: { label: '中', color: '#f9ab00', bg: '#fef7e0' },
  high: { label: '高', color: '#ea4335', bg: '#fce8e6' }
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
