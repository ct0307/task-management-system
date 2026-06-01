import React, { useState, useEffect, useCallback } from 'react';
import { Table, Button, Modal, Form, Input, Select, Space, Popconfirm, message, Card, Tag, Typography, Upload, Divider, Tabs } from 'antd';
import { PlusOutlined, DeleteOutlined, EditOutlined, CalendarOutlined, UploadOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { get, post, put, del } from '@/util/request';
import { API_TASK_LIST } from '@/constants/urls';
import s from './index.module.less';

const { Title, Text, TextArea } = Typography;
const { Option } = Select;

const WEEKDAYS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
const WEEKDAY_OFFSET = { '周一': 1, '周二': 2, '周三': 3, '周四': 4, '周五': 5, '周六': 6, '周日': 0 };

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
  const [quickAdding, setQuickAdding] = useState(false);

  // 批量粘贴
  const [batchText, setBatchText] = useState('');
  const [batchLoading, setBatchLoading] = useState(false);

  const fetchSchedules = useCallback(async () => {
    setLoading(true);
    try {
      const res = await get(`${API_TASK_LIST}?limit=200`);
      const all = res.data?.data || res.data || [];
      setSchedules(all.filter(t => t.recurrence));
    } catch { }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchSchedules(); }, [fetchSchedules]);

  // 按星期几分组
  const byDay = {};
  WEEKDAYS.forEach(d => { byDay[d] = []; });
  schedules.forEach(t => {
    if (!t.due_date) return;
    const d = new Date(t.due_date);
    const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    const day = dayNames[d.getDay()];
    if (byDay[day]) byDay[day].push(t);
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

  // 批量粘贴解析
  const handleBatchImport = async () => {
    const text = batchText.trim();
    if (!text) { message.warning('请粘贴课程表内容'); return; }
    // 格式：每行 "周X 课程名" 或 "周X 课程名 教室"
    const lines = text.split('\n').filter(l => l.trim());
    const courses = [];
    for (const line of lines) {
      const match = line.match(/^(周[一二三四五六日])\s+(.+)/);
      if (match) courses.push({ day: match[1], title: match[2].trim() });
    }
    if (courses.length === 0) { message.error('未识别到有效行，格式：周X 课程名'); return; }

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

  // CSV 文件上传解析
  const handleFileUpload = async (file) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target.result;
      const lines = text.split('\n').filter(l => l.trim());
      const courses = [];
      for (let i = 1; i < lines.length; i++) { // 跳过表头
        const parts = lines[i].split(',').map(s => s.trim().replace(/"/g, ''));
        if (parts.length >= 2) {
          const day = parts[0];
          const title = parts[1];
          if (WEEKDAYS.includes(day)) courses.push({ day, title });
        }
      }
      if (courses.length === 0) { message.error('CSV 格式：第一列星期，第二列课程名'); return; }
      let ok = 0;
      for (const c of courses) {
        try {
          await post('/api/tasks', { title: c.title, due_date: nextWeekdayDate(c.day), recurrence: 'weekly', status: 'pending' });
          ok++;
        } catch { }
      }
      message.success(`CSV 导入完成：${ok}/${courses.length} 条`);
      fetchSchedules();
    };
    reader.readAsText(file);
    return false; // 阻止自动上传
  };

  // 编辑/删除
  const openEdit = (record) => {
    setEditing(record);
    form.setFieldsValue({ title: record.title, due_date: record.due_date?.split('T')[0] || '', recurrence: record.recurrence });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    const values = await form.validateFields();
    setSubmitting(true);
    try {
      if (editing) { await put(`/api/tasks/${editing.id}`, values); message.success('已更新'); }
      else { await post('/api/tasks', { ...values, status: 'pending' }); message.success('已创建'); }
      setModalOpen(false); form.resetFields(); fetchSchedules();
    } catch (err) { if (!err.errorFields) message.error(err.response?.data?.message || '操作失败'); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async (id) => { await del(`/api/tasks/${id}`); message.success('已删除'); fetchSchedules(); };

  const columns = [
    { title: '课程/日程', dataIndex: 'title', key: 'title', ellipsis: true,
      render: (text, r) => {
        const d = new Date(r.due_date);
        const dn = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][d.getDay()];
        return <span>{text}<Tag style={{ marginLeft: 8 }} color="purple">{dn}</Tag></span>;
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
                  {byDay[day]?.map(t => (
                    <div key={t.id} className={s.courseItem}>
                      {t.title}
                    </div>
                  ))}
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
                  key: 'csv',
                  label: '上传CSV',
                  children: (
                    <div>
                      <Upload accept=".csv" beforeUpload={handleFileUpload} showUploadList={false}>
                        <Button icon={<UploadOutlined />}>选择 .csv 文件</Button>
                      </Upload>
                      <Text type="secondary" style={{ display: 'block', marginTop: 8, fontSize: 12 }}>
                        CSV 格式：第一列星期，第二列课程名（首行为表头）
                      </Text>
                    </div>
                  )
                }
              ]}
            />
          </Card>

          {/* 日程列表 */}
          <Card title={`全部日程（${schedules.length}）`} className={s.listCard}
            extra={<Button type="primary" size="small" icon={<PlusOutlined />} onClick={() => { setEditing(null); form.resetFields(); setModalOpen(true); }}>新建</Button>}
            styles={{ body: { padding: '0 16px' } }}
          >
            <Table
              dataSource={schedules}
              columns={columns}
              rowKey="id"
              loading={loading}
              size="small"
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
          <Form.Item name="due_date" label="起始日期" rules={[{ required: true }]}>
            <Input type="date" style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="recurrence" label="重复周期" rules={[{ required: true }]}>
            <Select>
              <Option value="weekly">🔄 每周</Option>
              <Option value="monthly">🔄 每月</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Schedules;
