import React from "react";
import { Button, Result } from "antd";
import { useNavigate } from "react-router-dom";
import { ReloadOutlined } from "@ant-design/icons";
import s from "./index.module.less";

const ServerError = () => {
  const navigate = useNavigate();
  return (
    <div className={s.container}>
      <div className={s.card}>
        <div className={s.illustration}>
          <svg viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="40" y="50" width="120" height="80" rx="8" stroke="#e8eaed" strokeWidth="2" fill="none" />
            <rect x="40" y="50" width="120" height="16" rx="8" fill="#fce8e6" />
            <circle cx="100" cy="56" r="3" fill="#ea4335" />
            <path d="M70 80 L100 80 M70 88 L95 88 M70 96 L90 96" stroke="#dadce0" strokeWidth="2" strokeLinecap="round" />
            <path d="M125 75 L135 65 M135 75 L125 65" stroke="#ea4335" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M125 95 L135 85 M135 95 L125 85" stroke="#ea4335" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M120 116 Q140 126 160 116" stroke="#f9ab00" strokeWidth="2" fill="none" strokeLinecap="round" strokeDasharray="4 3" />
            <path d="M40 116 Q20 126 0 116" stroke="#f9ab00" strokeWidth="2" fill="none" strokeLinecap="round" strokeDasharray="4 3" />
            <text x="100" y="150" textAnchor="middle" fill="#9aa0a6" fontSize="13" fontFamily="system-ui">500 — 服务器开小差了</text>
          </svg>
        </div>
        <Result
          status="500"
          title="500"
          subTitle="服务器出了点问题，请稍后重试"
          extra={null}
        />
        <div className={s.actions}>
          <Button type="primary" icon={<ReloadOutlined />} onClick={() => window.location.reload()} size="large">
            刷新页面
          </Button>
          <Button onClick={() => navigate("/dashboard")} size="large" style={{ marginLeft: 12 }}>
            返回首页
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ServerError;
