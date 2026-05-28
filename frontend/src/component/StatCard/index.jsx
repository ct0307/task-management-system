/**
 * StatCard — 统计卡片共享组件
 * 用于仪表盘、任务统计等场景
 */
import React from 'react';
import { Spin } from 'antd';
import s from './index.module.less';

const StatCard = ({ icon, label, title, value, color, bgColor, loading, trend }) => {
  const displayLabel = label || title;
  if (loading) {
    return (
      <div className={s.statCard}>
        <Spin size="small" />
      </div>
    );
  }

  return (
    <div className={s.statCard}>
      <div className={s.statIconWrap} style={{ backgroundColor: bgColor || '#e8f0fe', color: color || '#1a73e8' }}>
        {icon}
      </div>
      <div className={s.statInfo}>
        <span className={s.statLabel}>{displayLabel}</span>
        <span className={s.statValue} style={{ color: color || '#1a73e8' }}>
          {value ?? 0}
        </span>
        {trend !== undefined && (
          <span className={s.statTrend}>{trend > 0 ? `+${trend}` : trend} 本周</span>
        )}
      </div>
    </div>
  );
};

export default StatCard;
