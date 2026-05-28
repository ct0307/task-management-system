import React, { useState, useCallback, useRef } from "react";
import { Form, Input, Button, message, Typography, Card, Progress } from "antd";
import {
  UserOutlined,
  LockOutlined,
  IdcardOutlined,
  CheckCircleFilled,
  CloseCircleFilled,
  LoadingOutlined
} from "@ant-design/icons";
import { Link, useNavigate } from "react-router-dom";
import { get, post } from "@/util/request";
import token from "@/util/token";
import useAuthStore from "@/app/store/authStore";
import s from "../login/index.module.less";

const { Title, Text } = Typography;

// 密码强度计算
const getPasswordStrength = (pwd) => {
  if (!pwd) return { level: 0, label: "", color: "", percent: 0 };
  let score = 0;
  if (pwd.length >= 6) score++;
  if (pwd.length >= 10) score++;
  if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) score++;
  if (/\d/.test(pwd)) score++;
  if (/[^a-zA-Z0-9]/.test(pwd)) score++;

  if (score <= 1) return { level: 1, label: "弱", color: "#ea4335", percent: 25 };
  if (score === 2) return { level: 2, label: "一般", color: "#f9ab00", percent: 50 };
  if (score === 3) return { level: 3, label: "良好", color: "#1a73e8", percent: 75 };
  return { level: 4, label: "强", color: "#34a853", percent: 100 };
};

const Register = () => {
  const [loading, setLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({ level: 0, label: "", color: "", percent: 0 });
  const [usernameStatus, setUsernameStatus] = useState(null); // null | 'checking' | 'available' | 'taken'
  const [usernameMsg, setUsernameMsg] = useState("");
  const checkTimerRef = useRef(null);
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { setLogin, setCurrentUser } = useAuthStore();

  // 用户名实时查重（防抖 500ms）
  const checkUsername = useCallback(async (val) => {
    if (!val || val.trim().length < 2) {
      setUsernameStatus(null);
      setUsernameMsg("");
      return;
    }
    setUsernameStatus("checking");
    setUsernameMsg("");
    try {
      const res = await get("/api/auth/check-username", { username: val.trim() });
      if (res.data?.available) {
        setUsernameStatus("available");
        setUsernameMsg("用户名可用");
      } else {
        setUsernameStatus("taken");
        setUsernameMsg("用户名已被注册");
      }
    } catch {
      setUsernameStatus(null);
    }
  }, []);

  const handleUsernameChange = (e) => {
    const val = e.target.value;
    if (checkTimerRef.current) clearTimeout(checkTimerRef.current);
    checkTimerRef.current = setTimeout(() => checkUsername(val), 500);
  };

  // 密码输入时计算强度
  const handlePasswordChange = (e) => {
    setPasswordStrength(getPasswordStrength(e.target.value));
  };

  const handleRegister = async (values) => {
    if (usernameStatus === "taken") {
      message.error("该用户名已被注册，请更换");
      return;
    }
    setLoading(true);
    try {
      const res = await post("/api/auth/register", {
        username: values.username,
        password: values.password,
        real_name: values.real_name
      });
      // 注册成功自动登录
      token.set(res.data.token);
      token.saveUser(res.data.user);
      setLogin(true);
      setCurrentUser(res.data.user);
      // 新用户标记，触发欢迎引导
      localStorage.setItem("WELCOME_SHOWN", "0");
      message.success("注册成功！");
      setTimeout(() => navigate("/dashboard?welcome=1", { replace: true }), 500);
    } catch (err) {
      message.error(err.response?.data?.message || "注册失败，请重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={s.login}>
      <div className={s.bgGlowTop} />
      <div className={s.bgGlowBottom} />

      <Card className={s.loginCard} style={{ maxWidth: 520 }}>
        <div style={{ padding: "36px 40px" }}>
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <Title level={3} style={{ marginBottom: 6 }}>创建账号</Title>
            <Text type="secondary">注册后即可使用任务管理系统</Text>
          </div>

          <Form form={form} onFinish={handleRegister} autoComplete="off" layout="vertical" size="large">
            {/* 用户名 + 实时查重 */}
            <Form.Item
              name="username"
              rules={[
                { required: true, message: "请输入用户名" },
                { min: 2, message: "用户名至少2个字符" },
                { pattern: /^[a-zA-Z0-9_一-龥]+$/, message: "只允许中英文、数字和下划线" }
              ]}
            >
              <Input
                prefix={<UserOutlined />}
                placeholder="用户名"
                allowClear
                onChange={handleUsernameChange}
                suffix={
                  usernameStatus === "checking" ? <LoadingOutlined style={{ color: "#1a73e8" }} /> :
                  usernameStatus === "available" ? <CheckCircleFilled style={{ color: "#34a853" }} /> :
                  usernameStatus === "taken" ? <CloseCircleFilled style={{ color: "#ea4335" }} /> :
                  null
                }
              />
            </Form.Item>
            {usernameMsg && (
              <div style={{
                marginTop: -18, marginBottom: 14, fontSize: 12,
                color: usernameStatus === "available" ? "#34a853" : "#ea4335"
              }}>
                {usernameMsg}
              </div>
            )}

            {/* 姓名 */}
            <Form.Item
              name="real_name"
              rules={[{ required: true, message: "请输入姓名" }]}
            >
              <Input prefix={<IdcardOutlined />} placeholder="真实姓名" allowClear />
            </Form.Item>

            {/* 密码 + 强度指示器 */}
            <Form.Item
              name="password"
              rules={[
                { required: true, message: "请输入密码" },
                { min: 6, message: "密码至少6个字符" }
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="密码（至少6位）"
                allowClear
                onChange={handlePasswordChange}
              />
            </Form.Item>
            {passwordStrength.level > 0 && (
              <div style={{ marginTop: -18, marginBottom: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Progress
                    percent={passwordStrength.percent}
                    showInfo={false}
                    size="small"
                    strokeColor={passwordStrength.color}
                    trailColor="#f0f0f0"
                    style={{ flex: 1, margin: 0 }}
                  />
                  <Text style={{ fontSize: 12, color: passwordStrength.color, fontWeight: 500, whiteSpace: "nowrap" }}>
                    {passwordStrength.label}
                  </Text>
                </div>
                <div style={{ fontSize: 11, color: "#9aa0a6", marginTop: 4 }}>
                  {passwordStrength.level < 2 && "建议使用大小写字母+数字组合"}
                  {passwordStrength.level === 2 && "可添加特殊字符增强安全性"}
                  {passwordStrength.level >= 3 && "密码强度良好"}
                </div>
              </div>
            )}

            {/* 确认密码 */}
            <Form.Item
              name="confirmPassword"
              dependencies={["password"]}
              rules={[
                { required: true, message: "请确认密码" },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue("password") === value) return Promise.resolve();
                    return Promise.reject(new Error("两次密码不一致"));
                  },
                }),
              ]}
            >
              <Input.Password prefix={<LockOutlined />} placeholder="确认密码" allowClear />
            </Form.Item>

            <Form.Item style={{ marginBottom: 12 }}>
              <Button type="primary" htmlType="submit" loading={loading} block>
                注册
              </Button>
            </Form.Item>
          </Form>

          <div style={{ textAlign: "center" }}>
            <Text type="secondary">
              已有账号？<Link to="/login">立即登录</Link>
            </Text>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Register;
