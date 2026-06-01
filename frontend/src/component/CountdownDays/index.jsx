import React, { useState, useMemo } from 'react';
import { Card, Typography, Tag, Segmented } from 'antd';
import { ClockCircleOutlined } from '@ant-design/icons';
import s from './index.module.less';

const { Text } = Typography;

const PRIORITY_COLORS = { high: '#ea4335', medium: '#f9ab00', low: '#34a853' };

const CountdownDays = ({ tasks = [] }) => {
  const [mode, setMode] = useState('countdown'); // 'countdown' | 'elapsed'

  const items = useMemo(() => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    return tasks
      .filter(t => t.due_date && t.status !== 'completed' && !t.recurrence)
      .map(t => {
        const due = new Date(t.due_date); due.setHours(0, 0, 0, 0);
        const created = t.created_at ? new Date(t.created_at) : null;
        created?.setHours(0, 0, 0, 0);

        const remainDays = Math.ceil((due - today) / (1000 * 60 * 60 * 24));
        const elapsedDays = created ? Math.floor((today - created) / (1000 * 60 * 60 * 24)) : null;

        return { ...t, remainDays, elapsedDays };
      })
      .sort((a, b) => {
        if (mode === 'countdown') {
          if (a.remainDays < 0 && b.remainDays >= 0) return -1;
          if (b.remainDays < 0 && a.remainDays >= 0) return 1;
          return a.remainDays - b.remainDays;
        }
        return (b.elapsedDays || 0) - (a.elapsedDays || 0);
      })
      .slice(0, 6);
  }, [tasks, mode]);

  if (items.length === 0) return null;

  return (
    <Card
      title={<span><ClockCircleOutlined style={{ marginRight: 8 }} />倒数日</span>}
      extra={
        <Segmented
          size="small"
          value={mode}
          onChange={setMode}
          options={[
            { value: 'countdown', label: '剩余天数' },
            { value: 'elapsed', label: '已进行' }
          ]}
        />
      }
      className={s.card}
      styles={{ body: { padding: '16px 20px' } }}
    >
      <div className={s.grid}>
        {items.map(t => {
          const isCountdown = mode === 'countdown';
          const days = isCountdown ? t.remainDays : (t.elapsedDays || 0);
          const isOverdue = isCountdown && days < 0;
          const isToday = isCountdown && days === 0;

          let numberColor, unitText, cardClass = s.countdownCard;

          if (isCountdown) {
            if (isOverdue) {
              numberColor = '#b71c1c'; unitText = '天逾期';
              cardClass = `${s.countdownCard} ${s.overdue}`;
            } else if (isToday) {
              numberColor = '#c62828'; unitText = '天截止';
              cardClass = `${s.countdownCard} ${s.today}`;
            } else if (days <= 3) {
              numberColor = '#d32f2f'; unitText = '天';
              cardClass = `${s.countdownCard} ${s.urgent}`;
            } else if (days <= 7) {
              numberColor = '#e65100'; unitText = '天';
              cardClass = `${s.countdownCard} ${s.warning}`;
            } else if (days <= 14) {
              numberColor = '#1a73e8'; unitText = '天';
              cardClass = `${s.countdownCard} ${s.normal}`;
            } else {
              numberColor = '#34a853'; unitText = '天';
              cardClass = `${s.countdownCard} ${s.relaxed}`;
            }
          } else {
            numberColor = '#34a853'; unitText = '天';
            cardClass = `${s.countdownCard} ${s.relaxed}`;
          }

          return (
            <div key={t.id} className={cardClass}>
              <div className={s.numberWrap}>
                <span className={s.number} style={{ color: numberColor }}>
                  {isToday ? '今' : isCountdown ? Math.abs(days) : days}
                </span>
                <span className={s.unit}>{unitText}</span>
              </div>
              <div className={s.info}>
                <span className={s.taskTitle}>{t.title}</span>
                <Tag color={t.status === 'in_progress' ? 'processing' : 'warning'} style={{ margin: 0, fontSize: 11 }}>
                  {t.status === 'in_progress' ? '进行中' : '待处理'}
                </Tag>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};

export default CountdownDays;
