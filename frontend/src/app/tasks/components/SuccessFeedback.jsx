/**
 * 成功反馈组件
 * 显示操作成功的动画提示
 */
import React, { useEffect, useState } from 'react';
import { CheckCircleOutlined } from '@ant-design/icons';
import s from './index.module.less';

const SuccessFeedback = ({ text }) => {
  const [visible, setVisible] = useState(false);
  const [currentText, setCurrentText] = useState('');

  useEffect(() => {
    if (text) {
      setCurrentText(text);
      setVisible(true);
    } else {
      setVisible(false);
    }
  }, [text]);

  if (!visible) return null;

  return (
    <div className={s.successFeedback}>
      <div className={s.successContent}>
        <CheckCircleOutlined className={s.successIcon} />
        <span className={s.successText}>{currentText}</span>
      </div>
    </div>
  );
};

export default SuccessFeedback;
