import React, { useState, useCallback } from "react";
import { Form, Input, Button, message, Typography, Card, Checkbox } from "antd";
import { UserOutlined, LockOutlined, RocketOutlined } from "@ant-design/icons";
import { Link, useNavigate } from "react-router-dom";
import { post } from "@/util/request";
import token from "@/util/token.js";
import * as urls from "@/constants/urls";
import s from "./index.module.less";
import useAuthStore from "@/store/authStore";

const { Title, Text } = Typography;

const Login = () => {
  const [loading, setLoading] = useState(false);
  const [guestLoading, setGuestLoading] = useState(false);
  const [guestName, setGuestName] = useState("");
  const [remember, setRemember] = useState(false);
  const [form] = Form.useForm();
  const navigate = useNavigate();

  const setIsLogin = useAuthStore((s) => s.setLogin);
  const setCurrentUser = useAuthStore((s) => s.setCurrentUser);

  const doLogin = useCallback(
    async (values) => {
      const { username, password } = values;
      setLoading(true);
      try {
        const res = await post(
          urls.API_LOGIN,
          { username, password },
          { skipGlobalError: true }
        );

        if (res.code === 200 && res.data) {
          const { token: jwtToken, user } = res.data || {};
          if (!user) {
            message.error("登录响应格式错误");
            setLoading(false);
            return;
          }

          const mergedUser = { ...user, role: user.role || "user" };
          token.saveUser({ token: jwtToken, ...mergedUser }, remember);
          if (remember) localStorage.setItem("REMEMBER_ME", "1");

          setIsLogin(true);
          setCurrentUser(mergedUser);
          window.dispatchEvent(new CustomEvent("auth-change", { detail: { isAuthenticated: true } }));

          message.success(`欢迎回来，${mergedUser.real_name || mergedUser.username}`);
          const hasSeenWelcome = localStorage.getItem("WELCOME_SHOWN");
          navigate(hasSeenWelcome ? "/dashboard" : "/dashboard?welcome=1", { replace: true });
        } else {
          message.error(res.message || "用户名或密码错误");
        }
      } catch (err) {
        const msg = err?.response?.data?.message || err?.message || "网络错误，请稍后重试";
        message.error(msg);
      } finally {
        setLoading(false);
      }
    },
    [navigate, setIsLogin, setCurrentUser, remember]
  );

  // 游客登录
  const handleGuestLogin = useCallback(async () => {
    const name = guestName.trim();
    if (!name || name.length < 2) { message.warning("请输入至少2个字符的用户名"); return; }
    setGuestLoading(true);
    try {
      const res = await post("/api/auth/guest", { username: name }, { skipGlobalError: true });
      if (res.code === 200 && res.data) {
        const { token: jwtToken, user } = res.data;
        token.saveUser({ token: jwtToken, ...user });
        sessionStorage.setItem("IS_GUEST", "1");
        setIsLogin(true);
        setCurrentUser(user);
        window.dispatchEvent(new CustomEvent("auth-change", { detail: { isAuthenticated: true } }));
        message.success(`游客模式 — 欢迎 ${user.username}`);
        navigate("/dashboard?welcome=1", { replace: true });
      } else {
        message.error(res.message || "创建失败");
      }
    } catch (err) {
      message.error(err?.response?.data?.message || "创建失败，请重试");
    } finally {
      setGuestLoading(false);
    }
  }, [guestName, setIsLogin, setCurrentUser, navigate]);

  // 恢复记住的用户名
  React.useEffect(() => {
    const isRemembered = localStorage.getItem("REMEMBER_ME");
    if (isRemembered === "1") {
      setRemember(true);
      const savedUser = token.loadUser();
      if (savedUser?.username) form.setFieldsValue({ username: savedUser.username });
    }
  }, [form]);

  return (
    <div className={s.login}>
      <div className={s.bgGlowTop} />
      <div className={s.bgGlowBottom} />

      <Card className={s.loginCard} variant="borderless">
        {/* Logo + 标题 */}
        <div className={s.brand}>
          <div className={s.logoWrap}>
            <svg className={s.logoMark} viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7v10l10 5 10-5V7L12 2z" />
              <path d="M12 12l-8-4 8-4 8 4-8 4z" />
              <path d="M12 12v10" />
              <path d="M20 16v-6" />
              <path d="M4 16v-6" />
            </svg>
          </div>
          <Title level={3} className={s.title}>轻量化任务管理系统</Title>
          <Text className={s.subtitle}>高效管理你的任务与工作</Text>
        </div>

        {/* 登录表单 */}
        <Form form={form} onFinish={(v) => doLogin(v)} autoComplete="off" layout="vertical" size="large">
          <Form.Item
            name="username"
            rules={[
              { required: true, message: "请输入用户名" },
              { min: 2, message: "用户名至少 2 个字符" },
            ]}
          >
            <Input prefix={<UserOutlined />} placeholder="请输入用户名" allowClear />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[
              { required: true, message: "请输入密码" },
              { min: 4, message: "密码至少 4 个字符" },
            ]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="请输入密码" allowClear />
          </Form.Item>

          <div className={s.formRow}>
            <Checkbox checked={remember} onChange={(e) => setRemember(e.target.checked)}>记住我</Checkbox>
            <Link to="/register" className={s.registerLink}>还没有账号？立即注册</Link>
          </div>

          <Form.Item style={{ marginBottom: 0 }}>
            <Button type="primary" htmlType="submit" loading={loading} block>
              登 录
            </Button>
          </Form.Item>
        </Form>

        {/* 游客入口 */}
        <div className={s.guestSection}>
          <div className={s.guestDivider}><span>或 快速体验</span></div>
          <div className={s.guestRow}>
            <Input
              prefix={<UserOutlined />}
              placeholder="输入昵称即可体验"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              onPressEnter={handleGuestLogin}
              allowClear
              size="large"
            />
            <Button
              type="default"
              icon={<RocketOutlined />}
              loading={guestLoading}
              onClick={handleGuestLogin}
              className={s.guestBtn}
              size="large"
            >
              游客体验
            </Button>
          </div>
          <Text className={s.guestTip}>体验数据不会保存，退出后自动清除</Text>
        </div>
      </Card>
    </div>
  );
};

export default Login;
