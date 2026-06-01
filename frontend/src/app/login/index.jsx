import React, { useState, useCallback } from "react";
import { Form, Input, Button, message, Typography, Card, Checkbox } from "antd";
import {
  UserOutlined,
  LockOutlined,
} from "@ant-design/icons";
import { Link, useNavigate } from "react-router-dom";
import { post } from "@/util/request";
import token from "@/util/token.js";
import * as urls from "@/constants/urls";
import s from "./index.module.less";
import useAuthStore from "@/store/authStore";

const { Title, Text } = Typography;

const Login = () => {
  const [loading, setLoading] = useState(false);
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

          const mergedUser = {
            ...user,
            role: user.role || "user"
          };

          // 记住我：持久化存储，否则 sessionStorage
          token.saveUser({ token: jwtToken, ...mergedUser });
          if (remember) {
            localStorage.setItem("REMEMBER_ME", "1");
          }

          setIsLogin(true);
          setCurrentUser(mergedUser);

          window.dispatchEvent(
            new CustomEvent("auth-change", {
              detail: { isAuthenticated: true }
            })
          );

          message.success(`欢迎回来，${mergedUser.real_name || mergedUser.username}`);
          // 跳转到仪表盘，视觉效果更好
          const hasSeenWelcome = localStorage.getItem("WELCOME_SHOWN");
          if (!hasSeenWelcome) {
            navigate("/dashboard?welcome=1", { replace: true });
          } else {
            navigate("/dashboard", { replace: true });
          }
        } else {
          message.error(res.message || "用户名或密码错误");
        }
      } catch {
        message.error("网络错误，请稍后重试");
      } finally {
        setLoading(false);
      }
    },
    [navigate, setIsLogin, setCurrentUser, remember]
  );

  const handleLogin = useCallback(
    (values) => doLogin(values),
    [doLogin]
  );

  // 恢复记住的用户名
  React.useEffect(() => {
    const isRemembered = localStorage.getItem("REMEMBER_ME");
    if (isRemembered === "1") {
      setRemember(true);
      const savedUser = token.loadUser();
      if (savedUser?.username) {
        form.setFieldsValue({ username: savedUser.username });
      }
    }
  }, [form]);

  return (
    <div className={s.login}>
      <div className={s.bgGlowTop} />
      <div className={s.bgGlowBottom} />

      <Card className={s.loginCard}>
        <div className={s.loginLayout}>
          {/* 左侧：品牌信息 */}
          <div className={s.leftPanel}>
            <div className={s.header}>
              <div className={s.logoWrap}>
                <div className={s.logoBadge}>
                  <svg className={s.logoMark} viewBox="0 0 24 24" fill="none">
                    <path d="M12 2L2 7v10l10 5 10-5V7L12 2z" />
                    <path d="M12 12l-8-4 8-4 8 4-8 4z" />
                    <path d="M12 12v10" />
                    <path d="M20 16v-6" />
                    <path d="M4 16v-6" />
                  </svg>
                </div>
              </div>
              <Title level={3} className={s.title}>
                轻量化任务管理系统
              </Title>
              <Text className={s.subtitle}>高效管理你的任务与工作</Text>
            </div>
          </div>

          {/* 右侧：登录表单 */}
          <div className={s.rightPanel}>
            <div className={s.formHeader}>
              <Text className={s.formTitle}>账号登录</Text>
              <Text className={s.formTip}>请输入账号密码开始使用</Text>
            </div>

            <Form form={form} onFinish={handleLogin} autoComplete="off" layout="vertical" size="large">
              <div className={s.formField}>
                <Form.Item
                  name="username"
                  rules={[
                    { required: true, message: "请输入用户名" },
                    { min: 2, message: "用户名至少 2 个字符" }
                  ]}
                >
                  <Input prefix={<UserOutlined />} placeholder="请输入用户名" allowClear />
                </Form.Item>
              </div>

              <div className={s.formField} style={{ animationDelay: '0.08s' }}>
                <Form.Item
                  name="password"
                  rules={[
                    { required: true, message: "请输入密码" },
                    { min: 4, message: "密码至少 4 个字符" }
                  ]}
                >
                  <Input.Password prefix={<LockOutlined />} placeholder="请输入密码" allowClear />
                </Form.Item>
              </div>

              <div className={s.formField} style={{ animationDelay: '0.12s' }}>
                <Checkbox
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  style={{ marginBottom: 16 }}
                >
                  记住我
                </Checkbox>
              </div>

              <div className={s.formField} style={{ animationDelay: '0.15s' }}>
                <Form.Item>
                  <Button type="primary" htmlType="submit" loading={loading} block>
                    登录
                  </Button>
                </Form.Item>
              </div>
            </Form>

            <div className={s.footer}>
              <Text className={s.footerText}>
                系统自动根据账号权限分配管理功能
                <br />
                没有账号？<Link to="/register">立即注册</Link>
              </Text>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Login;
