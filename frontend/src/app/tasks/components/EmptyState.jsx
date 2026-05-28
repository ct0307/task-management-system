/**
 * 空状态组件
 * 引导用户创建第一个任务
 */
import React from 'react';
import { Button, Typography } from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  BulbOutlined,
  FileTextOutlined
} from '@ant-design/icons';
import s from './index.module.less';

const { Text, Title } = Typography;

const EmptyState = ({ onCreate }) => {
  return (
    <div className={s.emptyState}>
      <div className={s.emptyIconWrapper}>
        <div className={s.emptyIconCircle}>
          <FileTextOutlined className={s.emptyIcon} />
        </div>
        <div className={s.emptyIconGlow} />
      </div>

      <Title level={4} className={s.emptyTitle}>
        还没有任务
      </Title>

      <Text type="secondary" className={s.emptyDescription}>
        创建一个新任务，开始管理你的工作吧
      </Text>

      <div className={s.emptyActions}>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={onCreate}
          size="large"
          className="btn-hover-scale"
        >
          创建第一个任务
        </Button>
      </div>

      <div className={s.emptyTips}>
        <div className={s.tipItem}>
          <BulbOutlined className={s.tipIcon} />
          <Text type="secondary" className={s.tipText}>
            按 <span className="kbd">N</span> 可快速新建任务
          </Text>
        </div>
        <div className={s.tipItem}>
          <SearchOutlined className={s.tipIcon} />
          <Text type="secondary" className={s.tipText}>
            按 <span className="kbd">/</span> 可快速搜索
          </Text>
        </div>
      </div>
    </div>
  );
};

export default EmptyState;
