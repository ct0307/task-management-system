import React, { useState, useEffect, useCallback } from 'react';
import { Table, Button, Modal, Form, Input, Select, Space, Popconfirm, message, Card, Tag, Typography, Upload, Divider, Tabs, TimePicker } from 'antd';
import { PlusOutlined, DeleteOutlined, EditOutlined, CalendarOutlined, UploadOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { get, post, put, del } from '@/util/request';
import { API_TASK_LIST } from '@/constants/urls';
import dayjs from 'dayjs';
import ImportModal from '@/component/ImportModal';
import s from './index.module.less';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const WEEKDAYS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
const WEEKDAY_OFFSET = { '周一': 1, '周二': 2, '周三': 3, '周四': 4, '周五': 5, '周六': 6, '周日': 0 };
const DAY_NAMES = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

const getScheduleDay = (task) => {
  if (!task?.due_date) return '';
  return DAY_NAMES[new Date(task.due_date).getDay()] || '';
};

const timeToMinutes = (time) => {
  const match = String(time || '').match(/^(\d{1,2}):(\d{2})/);
  if (!match) return Number.MAX_SAFE_INTEGER;
  return Number(match[1]) * 60 + Number(match[2]);
};

const compareSchedule = (a, b) => {
  const dayDiff = WEEKDAYS.indexOf(getScheduleDay(a)) - WEEKDAYS.indexOf(getScheduleDay(b));
  if (dayDiff !== 0) return dayDiff;
  const startDiff = timeToMinutes(a.start_time) - timeToMinutes(b.start_time);
  if (startDiff !== 0) return startDiff;
  return String(a.title || '').localeCompare(String(b.title || ''), 'zh-CN');
};

const normalizeCourseTitle = (title) => String(title || '').replace(/\s+/g, '').trim();

const mergeSameNameSchedules = (items) => {
  const mergedMap = new Map();
  items.forEach(item => {
    const day = getScheduleDay(item);
    const titleKey = normalizeCourseTitle(item.title);
    if (!day || !titleKey) return;
    const key = `${day}|${titleKey}`;
    const prev = mergedMap.get(key);
    if (!prev) {
      mergedMap.set(key, { ...item, childIds: [item.id] });
      return;
    }

    const prevStart = timeToMinutes(prev.start_time);
    const nextStart = timeToMinutes(item.start_time);
    const prevEnd = timeToMinutes(prev.end_time);
    const nextEnd = timeToMinutes(item.end_time);
    const description = Array.from(new Set([prev.description, item.description].filter(Boolean))).join('；');

    mergedMap.set(key, {
      ...prev,
      start_time: nextStart < prevStart ? item.start_time : prev.start_time,
      end_time: nextEnd > prevEnd ? item.end_time : prev.end_time,
      description,
      childIds: [...(prev.childIds || [prev.id]), item.id],
    });
  });
  return Array.from(mergedMap.values()).sort(compareSchedule);
};

// 计算某周几的最近日期
const nextWeekdayDate = (weekday) => {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const todayDay = today.getDay(); // 0=Sun
  const target = WEEKDAY_OFFSET[weekday] ?? 0;
  let diff = target - todayDay;
  if (diff < 0) diff += 7;
  if (diff === 0 && today.getDay() !== target) diff = 0;
  const d = new Date(today); d.setDate(d.getDate() + diff);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const Schedules = () => {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  // 快速添加状态
  const [quickName, setQuickName] = useState('');
  const [quickDay, setQuickDay] = useState('周一');
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [quickAdding, setQuickAdding] = useState(false);

  // 批量粘贴
  const [batchText, setBatchText] = useState('');
  const [batchLoading, setBatchLoading] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);

  const fetchSchedules = useCallback(async () => {
    setLoading(true);
    try {
      const res = await get(`${API_TASK_LIST}?limit=200&includeSchedules=1`);
      const all = res.data?.data || res.data || [];
      setSchedules(mergeSameNameSchedules(all.filter(t => t.recurrence)));
    } catch { }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchSchedules(); }, [fetchSchedules]);

  // 按星期几分组
  const byDay = {};
  WEEKDAYS.forEach(d => { byDay[d] = []; });
  schedules.forEach(t => {
    const day = getScheduleDay(t);
    if (byDay[day]) byDay[day].push(t);
  });
  WEEKDAYS.forEach(day => {
    byDay[day].sort(compareSchedule);
  });

  // 快速添加
  const handleQuickAdd = async () => {
    if (!quickName.trim()) { message.warning('请输入课程名'); return; }
    setQuickAdding(true);
    try {
      await post('/api/tasks', {
        title: quickName.trim(),
        due_date: nextWeekdayDate(quickDay),
        recurrence: 'weekly',
        status: 'pending'
      });
      message.success(`已添加：${quickName.trim()}（${quickDay}）`);
      setQuickName('');
      fetchSchedules();
    } catch (err) {
      message.error(err.response?.data?.message || '添加失败');
    } finally { setQuickAdding(false); }
  };

  // 批量粘贴解析 — 支持多种分隔符和格式
  const handleBatchImport = async () => {
    const text = batchText.trim();
    if (!text) { message.warning('请粘贴课程表内容'); return; }
    const lines = text.split('\n').filter(l => l.trim());

    // 星期映射：数字、英文缩写、全称
    const DAY_MAP = {
      '1': '周一', '2': '周二', '3': '周三', '4': '周四', '5': '周五', '6': '周六', '7': '周日',
      'mon': '周一', 'tue': '周二', 'wed': '周三', 'thu': '周四', 'fri': '周五', 'sat': '周六', 'sun': '周日',
      '星期一': '周一', '星期二': '周二', '星期三': '周三', '星期四': '周四', '星期五': '周五', '星期六': '周六', '星期日': '周日',
    };

    const courses = [];
    for (const line of lines) {
      // 用逗号、Tab、中文空格、英文空格分割
      const parts = line.split(/[,\t，\s]+/).map(s => s.trim()).filter(Boolean);
      if (parts.length < 2) continue;

      let day = parts[0];
      // 尝试直接匹配
      if (WEEKDAYS.includes(day)) { /* ok */ }
      // 尝试映射
      else if (DAY_MAP[day.toLowerCase()]) { day = DAY_MAP[day.toLowerCase()]; }
      // 尝试提取周X
      else {
        const m = day.match(/周[一二三四五六日]/);
        if (m) day = m[0];
        else continue;
      }

      const title = parts.slice(1).join(' ').trim();
      if (title) courses.push({ day, title });
    }

    if (courses.length === 0) { message.error('未识别到有效行。支持格式：周一 高数 / 1,高数 / Mon,Math'); return; }

    setBatchLoading(true);
    let ok = 0, fail = 0;
    for (const c of courses) {
      try {
        await post('/api/tasks', {
          title: c.title,
          due_date: nextWeekdayDate(c.day),
          recurrence: 'weekly',
          status: 'pending'
        });
        ok++;
      } catch { fail++; }
    }
    setBatchLoading(false);
    message.success(`导入完成：成功 ${ok} 条${fail > 0 ? `，失败 ${fail} 条` : ''}`);
    setBatchText('');
    fetchSchedules();
  };

  const normalizeWeekDay = (value) => {
    const text = String(value || '').trim();
    const map = {
      '星期一': '周一', '星期二': '周二', '星期三': '周三', '星期四': '周四', '星期五': '周五', '星期六': '周六', '星期日': '周日', '星期天': '周日',
      '1': '周一', '2': '周二', '3': '周三', '4': '周四', '5': '周五', '6': '周六', '7': '周日',
      'mon': '周一', 'tue': '周二', 'wed': '周三', 'thu': '周四', 'fri': '周五', 'sat': '周六', 'sun': '周日'
    };
    const lower = text.toLowerCase();
    const direct = WEEKDAYS.find(day => text.includes(day));
    if (direct) return direct;
    const full = Object.keys(map).find(key => lower.includes(key.toLowerCase()));
    return full ? map[full] : '';
  };

  const normalizeTime = (value) => {
    const text = String(value || '').trim();
    const match = text.match(/^(\d{1,2})[:：](\d{2})$/) || text.match(/(\d{1,2})[:：](\d{2})/);
    if (!match) return '';
    const hour = Number(match[1]);
    const minute = Number(match[2]);
    if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return '';
    return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
  };

  const parseScheduleContent = (text) => {
    const value = String(text || '').trim();
    const weekDay = normalizeWeekDay(value);
    const timeMatch = value.match(/(\d{1,2}[:：]\d{2})\s*[-~—–]\s*(\d{1,2}[:：]\d{2})/);
    const startTime = timeMatch ? normalizeTime(timeMatch[1]) : '';
    const endTime = timeMatch ? normalizeTime(timeMatch[2]) : '';
    const cleaned = value
      .replace(/星期[一二三四五六日天]|周[一二三四五六日]/, '')
      .replace(/\d{1,2}[:：]\d{2}\s*[-~—–]\s*\d{1,2}[:：]\d{2}/, '')
      .replace(/场地[:：]/g, ' ')
      .replace(/教师[:：]/g, ' ')
      .trim();
    const parts = cleaned.split(/\s+/).filter(Boolean);
    const courseName = parts[0] || '';
    const location = parts.find(part => /楼|室|教室|校区|[A-Z]\d{2,}/.test(part)) || '';
    const teacher = parts.find(part => /老师|教师|教授/.test(part)) || '';
    return { weekDay, startTime, endTime, courseName, location, teacher, rawText: value };
  };

  // 文件导入（通用 ImportModal，支持 CSV/Excel/JSON/PDF/图片）
  const handleFileImport = async (mappedRows) => {
    const importMap = new Map();
    let skipped = 0;

    for (const row of mappedRows) {
      const contentParsed = parseScheduleContent(row.title || row.description || '');
      const weekDay = normalizeWeekDay(row.weekday) || contentParsed.weekDay || quickDay;
      const courseName = (row.title && !normalizeWeekDay(row.title) ? row.title : '') || contentParsed.courseName || row.description || '';
      const startTime = normalizeTime(row.start_time) || contentParsed.startTime;
      const endTime = normalizeTime(row.end_time) || contentParsed.endTime;
      const location = row.location || contentParsed.location || '';
      const teacher = row.teacher || contentParsed.teacher || '';

      if (!courseName.trim() || !weekDay || !WEEKDAYS.includes(weekDay)) { skipped++; continue; }

      const descriptionParts = [];
      if (location) descriptionParts.push(`地点：${location}`);
      if (teacher) descriptionParts.push(`教师：${teacher}`);
      if (contentParsed.rawText && contentParsed.rawText !== courseName) descriptionParts.push(contentParsed.rawText);

      const key = `${weekDay}|${normalizeCourseTitle(courseName)}`;
      const prev = importMap.get(key);
      const next = {
        title: courseName.trim(),
        description: descriptionParts.join('；'),
        due_date: nextWeekdayDate(weekDay),
        recurrence: 'weekly',
        status: 'pending',
        start_time: startTime || undefined,
        end_time: endTime || undefined,
        weekDay,
      };

      if (!prev) {
        importMap.set(key, next);
        continue;
      }

      importMap.set(key, {
        ...prev,
        start_time: timeToMinutes(next.start_time) < timeToMinutes(prev.start_time) ? next.start_time : prev.start_time,
        end_time: timeToMinutes(next.end_time) > timeToMinutes(prev.end_time) ? next.end_time : prev.end_time,
        description: Array.from(new Set([prev.description, next.description].filter(Boolean))).join('；'),
      });
    }

    let ok = 0, fail = 0, merged = mappedRows.length - importMap.size - skipped;
    for (const item of importMap.values()) {
      const existing = schedules.find(t => getScheduleDay(t) === item.weekDay && normalizeCourseTitle(t.title) === normalizeCourseTitle(item.title));
      try {
        const payload = {
          title: item.title,
          description: item.description,
          due_date: item.due_date,
          recurrence: item.recurrence,
          status: item.status,
          start_time: item.start_time,
          end_time: item.end_time,
        };
        if (existing) {
          await put(`/api/tasks/${existing.id}`, {
            ...payload,
            start_time: timeToMinutes(payload.start_time) < timeToMinutes(existing.start_time) ? payload.start_time : existing.start_time,
            end_time: timeToMinutes(payload.end_time) > timeToMinutes(existing.end_time) ? payload.end_time : existing.end_time,
          });
          merged++;
        } else {
          await post('/api/tasks', payload);
        }
        ok++;
      } catch (err) {
        console.warn('日程导入失败：', item.title, err.response?.data?.message || err.message);
        fail++;
      }
    }
    message.success(`导入完成：成功 ${ok} 条${merged > 0 ? `，合并 ${merged} 条` : ''}${fail > 0 ? `，失败 ${fail} 条` : ''}${skipped > 0 ? `，跳过 ${skipped} 条` : ''}`);
    fetchSchedules();
  };

  // 编辑/删除
  const openEdit = (record) => {
    setEditing(record);
    form.setFieldsValue({
      title: record.title,
      due_date: record.due_date?.split('T')[0] || '',
      recurrence: record.recurrence,
      start_time: record.start_time ? dayjs(record.start_time, 'HH:mm:ss') : null,
      end_time: record.end_time ? dayjs(record.end_time, 'HH:mm:ss') : null,
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    const values = await form.validateFields();
    setSubmitting(true);
    try {
      if (editing) {
        await put(`/api/tasks/${editing.id}`, {
          ...values,
          start_time: values.start_time ? values.start_time.format('HH:mm') : undefined,
          end_time: values.end_time ? values.end_time.format('HH:mm') : undefined,
        });
        message.success('已更新');
      }
      else {
        await post('/api/tasks', {
          ...values,
          status: 'pending',
          start_time: values.start_time ? values.start_time.format('HH:mm') : undefined,
          end_time: values.end_time ? values.end_time.format('HH:mm') : undefined,
        });
        message.success('已创建');
      }
      setModalOpen(false); form.resetFields(); fetchSchedules();
    } catch (err) { if (!err.errorFields) message.error(err.response?.data?.message || '操作失败'); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async (id) => {
    await del(`/api/tasks/${id}`);
    message.success('已删除');
    setSelectedRowKeys(prev => prev.filter(k => k !== id));
    fetchSchedules();
  };

  const handleBatchDelete = async () => {
    let ok = 0, fail = 0;
    for (const id of selectedRowKeys) {
      try { await del(`/api/tasks/${id}`); ok++; }
      catch { fail++; }
    }
    message.success(`删除完成：${ok} 条${fail > 0 ? `，失败 ${fail} 条` : ''}`);
    setSelectedRowKeys([]);
    fetchSchedules();
  };

  const columns = [
    { title: '课程/日程', dataIndex: 'title', key: 'title', ellipsis: true,
      render: (text, r) => {
        const dn = getScheduleDay(r);
        return <span>{text}<Tag style={{ marginLeft: 8 }} color="volcano">{dn}</Tag></span>;
      }
    },
    { title: '操作', key: 'actions', width: 120,
      render: (_, record) => (
        <Space>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openEdit(record)} />
          <Popconfirm title="删除？" onConfirm={() => handleDelete(record.id)}>
            <Button type="link" size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      )}
  ];

  return (
    <div className={s.page}>
      <div className={s.header}>
        <div>
          <Title level={3} className={s.title}><CalendarOutlined style={{ marginRight: 8 }} />日程管理</Title>
          <Text type="secondary">管理课程表和重复日程</Text>
        </div>
      </div>

      <div className={s.layout}>
        {/* 左侧：周视图 */}
        <Card title="📋 本周课程表" className={s.weekCard} styles={{ body: { padding: 8 } }}>
          <div className={s.weekGrid}>
            {WEEKDAYS.map(day => (
              <div key={day} className={s.dayCol}>
                <div className={s.dayHead}>{day}</div>
                <div className={s.dayBody}>
                  {byDay[day]?.map(t => {
                    const timeStr = t.start_time
                      ? `${t.start_time?.substring(0, 5)} - ${t.end_time?.substring(0, 5) || ''}`
                      : '';
                    return (
                      <div key={t.id} className={s.courseItem}>
                        <span>{t.title}</span>
                        {timeStr && <span className={s.courseTime}>{timeStr.replace(/\s*-\s*$/, '')}</span>}
                      </div>
                    );
                  })}
                  {(!byDay[day] || byDay[day].length === 0) && (
                    <div className={s.emptyDay}>—</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* 右侧：导入 + 列表 */}
        <div className={s.rightPanel}>
          {/* 快速导入 */}
          <Card title={<span><ThunderboltOutlined style={{ marginRight: 6 }} />快速导入课程表</span>} className={s.importCard} styles={{ body: { padding: 16 } }}>
            <Tabs
              size="small"
              items={[
                {
                  key: 'single',
                  label: '逐条添加',
                  children: (
                    <div className={s.quickRow}>
                      <Select value={quickDay} onChange={setQuickDay} style={{ width: 80 }}>
                        {WEEKDAYS.map(d => <Option key={d} value={d}>{d}</Option>)}
                      </Select>
                      <Input placeholder="课程名" value={quickName} onChange={e => setQuickName(e.target.value)}
                        onPressEnter={handleQuickAdd} style={{ flex: 1 }} />
                      <Button type="primary" icon={<PlusOutlined />} loading={quickAdding} onClick={handleQuickAdd}>添加</Button>
                    </div>
                  )
                },
                {
                  key: 'batch',
                  label: '批量粘贴',
                  children: (
                    <div>
                      <TextArea
                        rows={5}
                        value={batchText}
                        onChange={e => setBatchText(e.target.value)}
                        placeholder={`周一 高等数学\n周二 大学英语\n周三 数据结构\n周四 体育\n周五 线性代数`}
                        className={s.batchInput}
                      />
                      <div className={s.batchActions}>
                        <Text type="secondary" style={{ fontSize: 12 }}>每行格式：周X 课程名</Text>
                        <Button type="primary" size="small" onClick={handleBatchImport} loading={batchLoading}>解析导入</Button>
                      </div>
                    </div>
                  )
                },
                {
                  key: 'file',
                  label: '上传文件',
                  children: (
                    <div>
                      <Button icon={<UploadOutlined />} onClick={() => setImportModalOpen(true)} block>
                        选择文件（CSV / Excel / JSON / PDF / 图片）
                      </Button>
                      <Text type="secondary" style={{ display: 'block', marginTop: 8, fontSize: 12 }}>
                        支持 .csv .xlsx .xls .json .pdf .png .jpg，建议包含「星期」和「课程名」列
                      </Text>
                    </div>
                  )
                }
              ]}
            />
          </Card>

          {/* 日程列表 */}
          <Card
            title={`全部日程（${schedules.length}）`}
            className={s.listCard}
            extra={
              <Space size={8}>
                {selectedRowKeys.length > 0 && (
                  <Popconfirm title={`删除 ${selectedRowKeys.length} 个日程？`} onConfirm={handleBatchDelete}>
                    <Button size="small" danger icon={<DeleteOutlined />}>
                      删除 ({selectedRowKeys.length})
                    </Button>
                  </Popconfirm>
                )}
                <Button type="primary" size="small" icon={<PlusOutlined />}
                  onClick={() => { setEditing(null); form.resetFields(); setModalOpen(true); }}>
                  新建
                </Button>
              </Space>
            }
            styles={{ body: { padding: '0 16px' } }}
          >
            <Table
              dataSource={[...schedules].sort(compareSchedule)}
              columns={columns}
              rowKey="id"
              loading={loading}
              size="small"
              rowSelection={{
                selectedRowKeys,
                onChange: setSelectedRowKeys,
              }}
              pagination={{ pageSize: 15, showTotal: t => `${t} 条` }}
              locale={{ emptyText: '暂无日程' }}
            />
          </Card>
        </div>
      </div>

      {/* 编辑弹窗 */}
      <Modal title={editing ? '编辑日程' : '新建日程'} open={modalOpen}
        onCancel={() => { setModalOpen(false); form.resetFields(); }}
        onOk={handleSubmit} confirmLoading={submitting} width={440}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="title" label="标题" rules={[{ required: true }]}>
            <Input placeholder="日程标题" />
          </Form.Item>
          <Form.Item name="due_date" label="日期" rules={[{ required: true }]}>
            <Input type="date" style={{ width: '100%' }} />
          </Form.Item>
          <Space size="middle" style={{ width: '100%' }}>
            <Form.Item name="start_time" label="开始时间" style={{ flex: 1 }}>
              <TimePicker format="HH:mm" minuteStep={5} style={{ width: '100%' }} placeholder="08:30" />
            </Form.Item>
            <Form.Item name="end_time" label="结束时间" style={{ flex: 1 }}>
              <TimePicker format="HH:mm" minuteStep={5} style={{ width: '100%' }} placeholder="10:00" />
            </Form.Item>
          </Space>
          <Form.Item name="recurrence" label="重复周期" rules={[{ required: true }]}>
            <Select>
              <Option value="weekly">🔄 每周</Option>
              <Option value="monthly">🔄 每月</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* 文件导入弹窗 */}
      <ImportModal
        open={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        onImport={handleFileImport}
        title="导入课程表"
        mode="schedule"
        extraFields={[
          { label: '📅 星期', value: 'weekday' },
          { label: '🕘 开始时间', value: 'start_time' },
          { label: '🕙 结束时间', value: 'end_time' },
          { label: '📍 地点', value: 'location' },
          { label: '👨‍🏫 教师', value: 'teacher' },
        ]}
      />
    </div>
  );
};

export default Schedules;
