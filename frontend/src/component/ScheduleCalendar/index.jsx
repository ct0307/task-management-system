import React, { useState, useMemo } from 'react';
import { Tag, Typography, Card, Empty } from 'antd';
import { LeftOutlined, RightOutlined, CalendarOutlined } from '@ant-design/icons';
import s from './index.module.less';

const { Text } = Typography;

const WEEKDAYS = ['一', '二', '三', '四', '五', '六', '日'];
const MONTHS = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];

const PRIORITY_CONFIG = {
  high: { bg: '#fce8e6', text: '#ea4335', border: '#ea4335' },
  medium: { bg: '#fef7e0', text: '#e8a400', border: '#f9ab00' },
  low: { bg: '#edf7ed', text: '#34a853', border: '#34a853' }
};

const STATUS_LABEL = { pending: '待处理', in_progress: '进行中', completed: '已完成' };

const ScheduleCalendar = ({ tasks = [] }) => {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState(null);

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const tasksByDate = useMemo(() => {
    const map = {};
    const startOfMonth = new Date(year, month, 1);
    const endOfMonth = new Date(year, month + 1, 0);
    endOfMonth.setHours(23, 59, 59, 999);

    tasks.forEach(t => {
      const d = t.due_date?.split('T')[0];
      if (!d) return;
      // 原始日期
      if (!map[d]) map[d] = []; map[d].push(t);

      // 重复日程：每周/每月虚拟展开
      if (t.recurrence === 'weekly' || t.recurrence === 'monthly') {
        const baseDate = new Date(t.due_date);
        baseDate.setHours(0, 0, 0, 0);

        // 从当月第一天开始，找到所有匹配的日期
        let cursor = new Date(baseDate);
        // 往前推到当月范围内
        while (cursor > startOfMonth) {
          cursor = new Date(cursor);
          cursor.setDate(cursor.getDate() - (t.recurrence === 'weekly' ? 7 : 0));
          if (t.recurrence === 'monthly') {
            cursor.setMonth(cursor.getMonth() - 1);
          }
        }
        // 从当月范围开始往后展开
        let iter = new Date(cursor);
        // 回退到当月
        while (iter < startOfMonth) {
          iter = new Date(iter);
          if (t.recurrence === 'weekly') iter.setDate(iter.getDate() + 7);
          else iter.setMonth(iter.getMonth() + 1);
        }
        // 展开所有当月实例
        while (iter <= endOfMonth && iter <= baseDate) {
          // 只展开 baseDate 之前（含）的实例
          const dateStr = `${iter.getFullYear()}-${String(iter.getMonth() + 1).padStart(2, '0')}-${String(iter.getDate()).padStart(2, '0')}`;
          // 跳过原始日期（已添加）
          if (dateStr !== d) {
            if (!map[dateStr]) map[dateStr] = [];
            map[dateStr].push({ ...t, _virtual: true, due_date: dateStr });
          }
          iter = new Date(iter);
          if (t.recurrence === 'weekly') iter.setDate(iter.getDate() + 7);
          else iter.setMonth(iter.getMonth() + 1);
        }
      }
    });
    return map;
  }, [tasks, year, month]);

  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month, 1).getDay();
    const adjustedFirst = firstDay === 0 ? 6 : firstDay - 1;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrev = new Date(year, month, 0).getDate();
    const cells = [];
    for (let i = adjustedFirst - 1; i >= 0; i--)
      cells.push({ day: daysInPrev - i, month: 'prev', date: `${year}-${String(month).padStart(2, '0')}-${String(daysInPrev - i).padStart(2, '0')}` });
    for (let i = 1; i <= daysInMonth; i++)
      cells.push({ day: i, month: 'current', date: `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}` });
    const remaining = 7 - (cells.length % 7);
    if (remaining < 7)
      for (let i = 1; i <= remaining; i++)
        cells.push({ day: i, month: 'next', date: `${year}-${String(month + 2).padStart(2, '0')}-${String(i).padStart(2, '0')}` });
    return cells;
  }, [year, month]);

  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const selectedTasks = selectedDate ? (tasksByDate[selectedDate] || []) : [];
  const prevMonth = () => setCurrentMonth(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentMonth(new Date(year, month + 1, 1));

  return (
    <Card
      title={<span><CalendarOutlined style={{ marginRight: 8 }} />日程图</span>}
      className={s.calendarCard}
      styles={{ body: { padding: '12px 16px' } }}
    >
      <div className={s.monthNav}>
        <LeftOutlined className={s.navBtn} onClick={prevMonth} />
        <span className={s.monthTitle}>{year}年 {MONTHS[month]}</span>
        <RightOutlined className={s.navBtn} onClick={nextMonth} />
      </div>

      <div className={s.weekHeader}>
        {WEEKDAYS.map(d => <div key={d} className={s.weekDay}>{d}</div>)}
      </div>

      <div className={s.dateGrid}>
        {calendarDays.map((cell, i) => {
          const dayTasks = tasksByDate[cell.date] || [];
          const isOther = cell.month !== 'current';
          const isTodayDate = cell.date === todayStr;
          const isSelected = cell.date === selectedDate;
          const visible = dayTasks.slice(0, 3);
          const overflow = dayTasks.length - 3;

          if (isOther) {
            return <div key={i} className={`${s.dayCell} ${s.otherMonth}`}><span className={s.dayNum}>{cell.day}</span></div>;
          }

          return (
            <div
              key={i}
              className={`${s.dayCell} ${isTodayDate ? s.today : ''} ${isSelected ? s.selected : ''}`}
              onClick={() => setSelectedDate(isSelected ? null : cell.date)}
            >
              <span className={s.dayNum}>{cell.day}</span>
              <div className={s.taskBlocks}>
                {visible.map((t, j) => {
                  const isSchedule = t.recurrence || t._virtual;
                  const p = PRIORITY_CONFIG[t.priority] || PRIORITY_CONFIG.medium;
                  return (
                    <div
                      key={j}
                      className={`${s.taskBlock} ${isSchedule ? s.scheduleBlock : ''}`}
                      style={{
                        background: isSchedule ? '#f9f0ff' : p.bg,
                        borderLeftColor: isSchedule ? '#722ed1' : p.border,
                        color: isSchedule ? '#531dab' : p.text,
                        borderLeftStyle: isSchedule ? 'dashed' : 'solid'
                      }}
                    >
                      {isSchedule && '🔄 '}{t.title}
                    </div>
                  );
                })}
                {overflow > 0 && <div className={s.overflowBadge}>+{overflow} 更多</div>}
              </div>
            </div>
          );
        })}
      </div>

      {selectedDate && selectedTasks.length > 0 && (
        <div className={s.dayTasks}>
          <div className={s.dayTasksHeader}>
            <Text strong>{selectedDate}</Text>
            <Text type="secondary">{selectedTasks.length} 个任务</Text>
          </div>
          <div className={s.taskList}>
            {selectedTasks.map(t => {
              const p = PRIORITY_CONFIG[t.priority] || PRIORITY_CONFIG.medium;
              return (
                <div key={t.id} className={s.taskRow}>
                  <span className={s.priorityBadge} style={{ background: p.bg, color: p.text }}>
                    {t.priority === 'high' ? '高' : t.priority === 'medium' ? '中' : '低'}
                  </span>
                  <span className={s.taskName}>{t.title}</span>
                  <Tag color={t.status === 'completed' ? 'success' : t.status === 'in_progress' ? 'processing' : 'warning'} style={{ margin: 0, fontSize: 11 }}>
                    {STATUS_LABEL[t.status] || t.status}
                  </Tag>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {selectedDate && selectedTasks.length === 0 && (
        <div className={s.dayTasks}>
          <Empty description="当天无任务" image={Empty.PRESENTED_IMAGE_SIMPLE} className={s.miniEmpty} />
        </div>
      )}
    </Card>
  );
};

export default ScheduleCalendar;
