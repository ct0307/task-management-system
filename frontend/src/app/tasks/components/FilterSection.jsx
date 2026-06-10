import React from 'react';
import { Input, Select, Space, Button, Tooltip } from 'antd';
import { SearchOutlined, UserOutlined, CalendarOutlined } from '@ant-design/icons';
import { STATUS_CONFIG, PRIORITY_CONFIG } from '@/constants/task';
import useAuthStore from '@/store/authStore';
import s from './index.module.less';

const { Option } = Select;

const DATE_PRESETS = [
  { label: '今天到期', value: 'today' },
  { label: '本周到期', value: 'week' },
  { label: '本月到期', value: 'month' },
  { label: '已逾期', value: 'overdue' },
];

const FilterSection = ({ categories, searchValue, onSearchChange, onSearch, onFilterChange }) => {
  const currentUser = useAuthStore(s => s.currentUser);

  return (
    <div className={s.filters}>
      <Input.Search
        placeholder="搜索任务... (按 / 聚焦)"
        allowClear
        value={searchValue}
        onChange={(e) => onSearchChange(e.target.value)}
        onSearch={(value) => onSearch(value)}
        className={`${s.searchInput} task-search-input`}
        prefix={<SearchOutlined style={{ color: '#a39e98' }} />}
      />

      <Space wrap className={s.filterControls}>
        {/* 我的任务快捷按钮 */}
        <Tooltip title="只看分配给我的任务">
          <Button
            size="small"
            icon={<UserOutlined />}
            onClick={() => { onFilterChange('assignee', currentUser?.id); }}
            style={{ borderRadius: 6 }}
          >
            我的
          </Button>
        </Tooltip>

        <Select
          className={s.filterSelect}
          placeholder="状态"
          allowClear
          onChange={(value) => onFilterChange('status', value)}
        >
          {Object.entries(STATUS_CONFIG).map(([key, config]) => (
            <Option key={key} value={key}>{config.label}</Option>
          ))}
        </Select>

        <Select
          className={s.filterSelect}
          placeholder="优先级"
          allowClear
          onChange={(value) => onFilterChange('priority', value)}
        >
          {Object.entries(PRIORITY_CONFIG).map(([key, config]) => (
            <Option key={key} value={key}>{config.label}</Option>
          ))}
        </Select>

        <Select
          className={s.filterSelect}
          placeholder="分类"
          allowClear
          onChange={(value) => onFilterChange('category', value)}
        >
          {categories.map(cat => (
            <Option key={cat.id} value={cat.id}>{cat.name}</Option>
          ))}
        </Select>

        <Select
          className={s.filterSelect}
          placeholder="到期时间"
          allowClear
          onChange={(value) => onFilterChange('dateRange', value)}
          suffixIcon={<CalendarOutlined />}
        >
          {DATE_PRESETS.map(opt => (
            <Option key={opt.value} value={opt.value}>{opt.label}</Option>
          ))}
        </Select>
      </Space>
    </div>
  );
};

export default React.memo(FilterSection);
