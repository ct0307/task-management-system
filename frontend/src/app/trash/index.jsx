import React, { useEffect, useState, useCallback } from 'react';
import { Table, Button, Space, Tag, message, Popconfirm, Typography, Empty } from 'antd';
import { UndoOutlined, DeleteOutlined, ReloadOutlined, InboxOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { get, put, del } from '@/util/request';
import { API_TASK_LIST } from '@/constant/urls';
import { STATUS_CONFIG, PRIORITY_CONFIG } from '@/constant/task';

const { Title, Text } = Typography;

const Trash = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 20, total: 0 });

  const fetchTrash = useCallback(async (page = 1, pageSize = 20) => {
    setLoading(true);
    try {
      const res = await get(`${API_TASK_LIST}/trash`, { page, pageSize });
      const data = res.data;
      setTasks(data.data || []);
      setPagination({ page: data.page, pageSize: data.pageSize, total: data.total });
    } catch {
      message.error('获取回收站数据失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTrash(); }, [fetchTrash]);

  const handleRestore = async (id) => {
    try {
      await put(`${API_TASK_LIST}/${id}/restore`);
      message.success('任务已恢复');
      fetchTrash(pagination.page, pagination.pageSize);
    } catch {
      message.error('恢复失败');
    }
  };

  const handlePermanentDelete = async (id) => {
    try {
      await del(`${API_TASK_LIST}/${id}/permanent`);
      message.success('任务已永久删除');
      fetchTrash(pagination.page, pagination.pageSize);
    } catch {
      message.error('删除失败');
    }
  };

  const columns = [
    {
      title: '任务标题', dataIndex: 'title', key: 'title', ellipsis: true,
      render: (text) => <Text delete>{text}</Text>
    },
    {
      title: '状态', dataIndex: 'status', key: 'status', width: 100,
      render: (s) => {
        const cfg = STATUS_CONFIG[s];
        return cfg ? <Tag color={cfg.color}>{cfg.label}</Tag> : '-';
      }
    },
    {
      title: '优先级', dataIndex: 'priority', key: 'priority', width: 80,
      render: (p) => {
        const cfg = PRIORITY_CONFIG[p];
        return cfg ? <Tag color={cfg.color}>{cfg.label}</Tag> : '-';
      }
    },
    {
      title: '删除时间', dataIndex: 'deleted_at', key: 'deleted_at', width: 170,
      render: (v) => v ? dayjs(v).format('YYYY-MM-DD HH:mm:ss') : '-'
    },
    {
      title: '操作', key: 'action', width: 200,
      render: (_, record) => (
        <Space>
          <Button type="link" size="small" icon={<UndoOutlined />} onClick={() => handleRestore(record.id)}>
            恢复
          </Button>
          <Popconfirm
            title="永久删除后不可恢复，确定？"
            onConfirm={() => handlePermanentDelete(record.id)}
            okText="永久删除"
            cancelText="取消"
            okButtonProps={{ danger: true }}
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              永久删除
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <div style={{ padding: 0 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <Title level={2} style={{ margin: 0 }}>
          <InboxOutlined style={{ marginRight: 8 }} />回收站
        </Title>
        <Button icon={<ReloadOutlined />} onClick={() => fetchTrash()} loading={loading}>刷新</Button>
      </div>

      <Table
        columns={columns}
        dataSource={tasks}
        rowKey="id"
        loading={loading}
        pagination={{
          current: pagination.page,
          pageSize: pagination.pageSize,
          total: pagination.total,
          showTotal: (total) => `共 ${total} 个已删除任务`,
          onChange: (page, pageSize) => fetchTrash(page, pageSize)
        }}
        locale={{ emptyText: <Empty description="回收站为空" image={Empty.PRESENTED_IMAGE_SIMPLE} /> }}
      />
    </div>
  );
};

export default Trash;
