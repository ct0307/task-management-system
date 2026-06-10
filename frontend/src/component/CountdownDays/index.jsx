import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Tag, Segmented, Tooltip, Spin, Empty } from 'antd';
import { ClockCircleOutlined, RightOutlined, DownOutlined, FireOutlined, ExportOutlined } from '@ant-design/icons';
import { get } from '@/util/request';
import useTaskStore from '@/store/taskStore';
import s from './index.module.less';

const CountdownDays = ({ tasks = [] }) => {
  const [mode, setMode] = useState('countdown');
  const { openDrawer, categories, fetchCategories } = useTaskStore();
  const [visible, setVisible] = useState(false);
  const containerRef = useRef(null);

  const [expandedIds, setExpandedIds] = useState(new Set());
  const [subtaskCache, setSubtaskCache] = useState({});
  const [loadingMap, setLoadingMap] = useState({});

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleToggleExpand = useCallback(async (taskId, e) => {
    if (e) e.stopPropagation();
    if (expandedIds.has(taskId)) {
      setExpandedIds(prev => { const next = new Set(prev); next.delete(taskId); return next; });
      return;
    }
    setExpandedIds(prev => new Set(prev).add(taskId));
    if (subtaskCache[taskId]) return;
    setLoadingMap(prev => ({ ...prev, [taskId]: true }));
    try {
      const res = await get(`/api/tasks/${taskId}/subtasks`);
      setSubtaskCache(prev => ({ ...prev, [taskId]: res.data || [] }));
    } catch {
      setSubtaskCache(prev => ({ ...prev, [taskId]: [] }));
    } finally {
      setLoadingMap(prev => ({ ...prev, [taskId]: false }));
    }
  }, [expandedIds, subtaskCache]);

  useEffect(() => {
    if (!categories || categories.length === 0) fetchCategories();
  }, []);

  const categoryColorMap = useMemo(() => {
    const map = {};
    categories.forEach(c => { map[c.id] = c.color; });
    return map;
  }, [categories]);

  // 计算某日期的剩余天数
  const calcRemainDays = (dueDateStr) => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const due = new Date(dueDateStr); due.setHours(0, 0, 0, 0);
    return Math.ceil((due - today) / (1000 * 60 * 60 * 24));
  };

  const items = useMemo(() => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const topTasks = tasks.filter(t => !t.parent_id);
    const subtasks = tasks.filter(t => t.parent_id);

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

        let progress = 0;
        if (created && effectiveDue) {
          const total = effectiveDue - created;
          const spent = today - created;
          progress = total > 0 ? Math.min(100, Math.max(0, Math.round((spent / total) * 100))) : 100;
        }

        return { ...t, remainDays, elapsedDays, progress, hasChildDue: !t.due_date && !!childDueMap[t.id] };
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

  if (items.length === 0) {
    return (
      <div className={`${s.root} ${visible ? s.visible : ''}`} ref={containerRef}>
        <div className={s.header}>
          <div className={s.headerLeft}>
            <div className={s.headerIcon}><ClockCircleOutlined /></div>
            <span className={s.headerTitle}>倒数日</span>
          </div>
        </div>
        <div className={s.emptyWrap}>
          <Empty description="暂无即将到期的任务" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        </div>
      </div>
    );
  }

  return (
    <div className={`${s.root} ${visible ? s.visible : ''}`} ref={containerRef}>
      <div className={s.header}>
        <div className={s.headerLeft}>
          <div className={s.headerIcon}>
            <ClockCircleOutlined />
          </div>
          <span className={s.headerTitle}>倒数日</span>
          <span className={s.headerCount}>{items.length}</span>
        </div>
        <Segmented
          size="small"
          value={mode}
          onChange={setMode}
          options={[
            { value: 'countdown', label: '剩余' },
            { value: 'elapsed', label: '已进行' }
          ]}
          className={s.modeSwitch}
        />
      </div>

      <div className={s.timeline}>
        {items.map((t, idx) => {
          const isCountdown = mode === 'countdown';
          const days = isCountdown ? t.remainDays : (t.elapsedDays || 0);
          const isOverdue = isCountdown && days < 0;
          const isToday = isCountdown && days === 0;
          const isUrgent = isCountdown && days >= 1 && days <= 3;
          const hasSubtask = (t.subtask_count || 0) > 0;
          const isExpanded = expandedIds.has(t.id);
          const isLoading = loadingMap[t.id];
          const subtasks = subtaskCache[t.id] || [];

          let tier = 'normal';
          if (isCountdown) {
            if (isOverdue) tier = 'overdue';
            else if (isToday) tier = 'today';
            else if (isUrgent) tier = 'urgent';
            else tier = 'normal';
          } else {
            tier = 'elapsed';
          }

          const progressColor = tier === 'overdue' ? '#d94436'
            : tier === 'today' ? '#e85d3a'
            : tier === 'urgent' ? '#d4972e'
            : tier === 'elapsed' ? '#3d8c5c'
            : '#e85d3a';

          const statusLabel = t.status === 'in_progress' ? '进行中' : '待处理';
          const statusColor = t.status === 'in_progress' ? 'processing' : 'warning';

          // 主区域点击 → 展开/收起子任务；若无子任务则打开抽屉
          const handleMainClick = hasSubtask
            ? (e) => handleToggleExpand(t.id, e)
            : () => openDrawer(t);

          return (
            <div
              key={t.id}
              className={`${s.timelineItem} ${s[`tier${tier.charAt(0).toUpperCase() + tier.slice(1)}`]} ${isExpanded ? s.expandedItem : ''}`}
              style={{ animationDelay: `${idx * 70}ms` }}
            >
              {/* 左侧：大数字 — 点击展开子任务 */}
              <div className={s.numberBlock} onClick={handleMainClick} title={hasSubtask ? '点击展开子任务' : '点击查看详情'}>
                <div className={s.numberRow}>
                  {isOverdue && <span className={s.numberSign}>−</span>}
                  <span className={`${s.numberValue} ${s[`num${tier.charAt(0).toUpperCase() + tier.slice(1)}`]}`}>
                    {isToday ? '今' : Math.abs(days)}
                  </span>
                  <span className={s.numberUnit}>
                    {isOverdue ? '逾期' : isToday ? '天截止' : '天'}
                  </span>
                </div>
                {isOverdue && <FireOutlined className={s.overdueIcon} />}
                {isToday && <span className={s.todayBadge}>TODAY</span>}
                {/* 有子任务时显示展开指示 */}
                {hasSubtask && !isExpanded && (
                  <span className={s.expandHint}>{t.subtask_count}个子任务 ▸</span>
                )}
              </div>

              {/* 右侧：任务信息 — 点击展开子任务 */}
              <div className={s.taskBlock} onClick={handleMainClick} title={hasSubtask ? '点击展开子任务' : '点击查看详情'}>
                <div className={s.progressTrack}>
                  <div
                    className={`${s.progressBar} ${isOverdue || isToday ? s.progressPulse : ''}`}
                    style={{ width: `${t.progress}%`, background: progressColor }}
                  />
                </div>

                <div className={s.taskRow}>
                  {t.category_name && (
                    <span className={s.catDot} style={{ background: categoryColorMap[t.category_id] || '#e85d3a' }} />
                  )}
                  <Tooltip title={t.title}>
                    <span className={s.taskTitle}>{t.title}</span>
                  </Tooltip>
                  <Tag color={statusColor} className={s.statusTag}>{statusLabel}</Tag>
                  {t.priority === 'high' && <span className={s.highPriority}>!!</span>}
                  {t.hasChildDue && <Tag color="default" className={s.childDueTag}>子截止</Tag>}
                  {/* 详情入口小按钮 */}
                  <Tooltip title="查看详情">
                    <span className={s.detailBtn} onClick={(e) => { e.stopPropagation(); openDrawer(t); }}>
                      <ExportOutlined />
                    </span>
                  </Tooltip>
                </div>

                {t.due_date && (
                  <div className={s.dueDateRow}>
                    <CalendarIcon />
                    <span>{new Date(t.due_date).toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'short' })}</span>
                    {isOverdue && <span className={s.overdueSince}>（已逾期 {Math.abs(days)} 天）</span>}
                  </div>
                )}

                {/* 展开态的操作条 */}
                {hasSubtask && (
                  <div
                    className={`${s.expandBtn} ${isExpanded ? s.expanded : ''}`}
                    onClick={(e) => handleToggleExpand(t.id, e)}
                  >
                    <span className={s.expandLine} />
                    <span className={s.expandIcon}>{isExpanded ? <DownOutlined /> : <RightOutlined />}</span>
                    <span>{isExpanded ? '收起' : `${t.subtask_count} 个子任务`}</span>
                    <span className={s.expandLine} />
                  </div>
                )}
              </div>

              {/* 展开的子任务 — 色块+倒数天数 */}
              {isExpanded && hasSubtask && (
                <div className={s.subtaskPanel}>
                  {isLoading ? (
                    <div className={s.subtaskLoading}><Spin size="small" /></div>
                  ) : subtasks.length > 0 ? (
                    <div className={s.subtaskGrid}>
                      {subtasks.map(st => {
                        const done = st.status === 'completed';
                        const stRemain = st.due_date ? calcRemainDays(st.due_date) : null;
                        const isStOverdue = stRemain !== null && stRemain < 0;
                        const isStToday = stRemain === 0;

                        let blockClass = s.sbBlock;
                        if (done) blockClass = `${s.sbBlock} ${s.sbDone}`;
                        else if (isStOverdue) blockClass = `${s.sbBlock} ${s.sbUrgent}`;
                        else if (st.status === 'in_progress') blockClass = `${s.sbBlock} ${s.sbActive}`;

                        return (
                          <div key={st.id} className={blockClass}
                            onClick={(e) => { e.stopPropagation(); openDrawer(st); }}
                            title="点击查看详情"
                          >
                            {/* 倒数天数 — 子任务的核心数字 */}
                            {st.due_date && !done && (
                              <div className={s.sbCountRow}>
                                <span className={`${s.sbCountNum} ${isStOverdue ? s.sbCountOverdue : isStToday ? s.sbCountToday : s.sbCountNormal}`}>
                                  {isStToday ? '今' : isStOverdue ? Math.abs(stRemain) : stRemain}
                                </span>
                                <span className={s.sbCountUnit}>
                                  {isStOverdue ? '逾期' : isStToday ? '天' : '天'}
                                </span>
                              </div>
                            )}
                            {done && (
                              <div className={s.sbCountRow}>
                                <span className={s.sbDoneCheck}>✓</span>
                              </div>
                            )}
                            <span className={s.sbTitle}>{st.title}</span>
                            {st.due_date && (
                              <span className={s.sbDue}>
                                {new Date(st.due_date).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <span className={s.subtaskEmpty}>暂无子任务</span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className={s.footerOrnament} />
    </div>
  );
};

const CalendarIcon = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0 }}>
    <rect x="0.5" y="2" width="11" height="9.5" rx="1.5" stroke="#a39e98" strokeWidth="0.8" />
    <line x1="3" y1="0.5" x2="3" y2="3.5" stroke="#a39e98" strokeWidth="0.8" strokeLinecap="round" />
    <line x1="9" y1="0.5" x2="9" y2="3.5" stroke="#a39e98" strokeWidth="0.8" strokeLinecap="round" />
    <line x1="0.5" y1="5" x2="11.5" y2="5" stroke="#a39e98" strokeWidth="0.6" />
  </svg>
);

export default CountdownDays;
