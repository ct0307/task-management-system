import React, { useState, useEffect, useMemo } from 'react';
import { Card, Typography, Tag, Segmented, Tooltip } from 'antd';
import { ClockCircleOutlined } from '@ant-design/icons';
import useTaskStore from '@/store/taskStore';
import s from './index.module.less';

const { Text } = Typography;

const CountdownDays = ({ tasks = [] }) => {
  const [mode, setMode] = useState('countdown'); // 'countdown' | 'elapsed'
  const { openDrawer, categories, fetchCategories } = useTaskStore();

  // 确保分类数据已加载
  useEffect(() => {
    if (!categories || categories.length === 0) fetchCategories();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // 分类颜色映射
  const categoryColorMap = useMemo(() => {
    const map = {};
    categories.forEach(c => { map[c.id] = c.color; });
    return map;
  }, [categories]);

  const items = useMemo(() => {
    const today = new Date(); today.setHours(0, 0, 0, 0);

    // 分离顶层任务和子任务
    const topTasks = tasks.filter(t => !t.parent_id);
    const subtasks = tasks.filter(t => t.parent_id);

    // 按 parent_id 分组的子任务截止日期映射
    const childDueMap = {};
    subtasks.forEach(st => {
      if (!st.due_date || st.status === 'completed') return;
      const due = new Date(st.due_date); due.setHours(0, 0, 0, 0);
      if (!childDueMap[st.parent_id] || due < childDueMap[st.parent_id]) {
        childDueMap[st.parent_id] = due;
      }
    });

    return topTasks
      .filter(t => t.status !== 'completed' && !t.recurrence)
      .map(t => {
        // 有效截止日期：父任务 或 最早子任务
        let effectiveDue = null;
        if (t.due_date) {
          effectiveDue = new Date(t.due_date);
          effectiveDue.setHours(0, 0, 0, 0);
        } else if (childDueMap[t.id]) {
          effectiveDue = childDueMap[t.id];
        }
        if (!effectiveDue) return null;

        const created = t.created_at ? new Date(t.created_at) : null;
        created?.setHours(0, 0, 0, 0);

        const remainDays = Math.ceil((effectiveDue - today) / (1000 * 60 * 60 * 24));
        const elapsedDays = created ? Math.floor((today - created) / (1000 * 60 * 60 * 24)) : null;

        return { ...t, remainDays, elapsedDays, hasChildDue: !t.due_date && !!childDueMap[t.id] };
      })
      .filter(Boolean)
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

          // 颜色：剩余<7天（含逾期）红色，≥7天蓝色；已进行全部绿色
          let numberColor, unitText, cardClass = s.countdownCard;

          if (isCountdown) {
            if (isOverdue || isToday || days < 7) {
              numberColor = '#ea4335';
              unitText = isOverdue ? '天逾期' : isToday ? '天截止' : '天';
              cardClass = `${s.countdownCard} ${s.urgent}`;
            } else {
              numberColor = '#1a73e8';
              unitText = '天';
              cardClass = `${s.countdownCard} ${s.normal}`;
            }
          } else {
            numberColor = '#34a853';
            unitText = '天';
            cardClass = `${s.countdownCard} ${s.elapsed}`;
          }

          return (
            <div
              key={t.id}
              className={cardClass}
              onClick={() => openDrawer(t)}
              title="点击查看详情"
            >
              <div className={s.numberWrap}>
                <span className={s.number} style={{ color: numberColor }}>
                  {isToday ? '今' : isCountdown ? Math.abs(days) : days}
                </span>
                <span className={s.unit}>{unitText}</span>
              </div>
              <div className={s.info}>
                <Tooltip title={t.title}>
                  <span className={s.taskTitle}>
                    {t.category_name && (
                      <span className={s.catDot} style={{ background: categoryColorMap[t.category_id] || '#1890ff' }} />
                    )}
                    {t.title}
                  </span>
                </Tooltip>
                <div className={s.tags}>
                  <Tag color={t.status === 'in_progress' ? 'processing' : 'warning'} style={{ margin: 0, fontSize: 11 }}>
                    {t.status === 'in_progress' ? '进行中' : '待处理'}
                  </Tag>
                  {t.hasChildDue && (
                    <Tag color="default" style={{ margin: 0, fontSize: 10 }}>子任务截止</Tag>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};

export default CountdownDays;
