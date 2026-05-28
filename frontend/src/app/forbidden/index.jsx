import React from "react";
import { Button, Result } from "antd";
import { useNavigate } from "react-router-dom";
import { HomeOutlined } from "@ant-design/icons";
import s from "./index.module.less";

const Forbidden = () => {
  const navigate = useNavigate();
  return (
    <div className={s.container}>
      <div className={s.card}>
        <div className={s.illustration}>
          <svg viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="60" y="30" width="80" height="100" rx="8" stroke="#e8eaed" strokeWidth="2" fill="none" />
            <rect x="65" y="35" width="70" height="8" rx="4" fill="#e8eaed" />
            <circle cx="100" cy="55" r="12" fill="none" stroke="#f9ab00" strokeWidth="2" />
            <path d="M100 59 L100 68 M100 72 L100 74" stroke="#ea4335" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M80 95 L120 95" stroke="#dadce0" strokeWidth="2" strokeLinecap="round" />
            <path d="M80 103 L110 103" stroke="#dadce0" strokeWidth="2" strokeLinecap="round" />
            <path d="M80 111 L100 111" stroke="#dadce0" strokeWidth="2" strokeLinecap="round" />
            <text x="100" y="150" textAnchor="middle" fill="#9aa0a6" fontSize="13" fontFamily="system-ui">403 — 权限不足</text>
          </svg>
        </div>
        <Result
          status="403"
          title="403"
          subTitle="抱歉，你没有权限访问此页面，请联系管理员"
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

export default Forbidden;
