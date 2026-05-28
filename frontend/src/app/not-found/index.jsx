import React from "react";
import { Button, Result } from "antd";
import { useNavigate } from "react-router-dom";
import { HomeOutlined } from "@ant-design/icons";
import s from "./index.module.less";

const NotFound = () => {
  const navigate = useNavigate();
  return (
    <div className={s.container}>
      <div className={s.card}>
        <div className={s.illustration}>
          <svg viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="100" cy="60" r="50" stroke="#e8eaed" strokeWidth="2" fill="none" />
            <circle cx="100" cy="60" r="30" stroke="#dadce0" strokeWidth="2" fill="none" strokeDasharray="6 4" />
            <path d="M100 10 L100 20 M100 100 L100 110 M50 60 L60 60 M140 60 L150 60" stroke="#dadce0" strokeWidth="2" strokeLinecap="round" />
            <circle cx="100" cy="60" r="6" fill="#1a73e8" opacity="0.8" />
            <path d="M100 66 Q100 80 85 85 Q70 90 75 105" stroke="#ea4335" strokeWidth="3" strokeLinecap="round" fill="none" />
            <circle cx="75" cy="115" r="4" fill="#ea4335" />
            <text x="100" y="150" textAnchor="middle" fill="#9aa0a6" fontSize="13" fontFamily="system-ui">404 — 页面迷路了</text>
          </svg>
        </div>
        <Result
          status="404"
          title="404"
          subTitle="抱歉，你访问的页面不存在，可能已被移动或删除"
          extra={null}
        />
        <div className={s.actions}>
          <Button type="primary" icon={<HomeOutlined />} onClick={() => navigate("/dashboard")} size="large">
            返回首页
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
