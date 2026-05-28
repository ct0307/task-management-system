import { Suspense, lazy, useEffect, useRef } from "react";
import { HashRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Spin, Layout as AntLayout } from "antd";
import useAuthStore from "@/app/store/authStore";
import { get } from "@/util/request";
import { API_AUTH_ME } from "@/constant/urls";
import token from "@/util/token";
import Nav from "@/component/Nav";
import ErrorBoundary from "@/component/ErrorBoundary";

const Dashboard = lazy(() => import("./app/dashboard"));
const Login = lazy(() => import("./app/login"));
const Admin = lazy(() => import("./app/admin"));
const NotFound = lazy(() => import("./app/not-found"));
const Forbidden = lazy(() => import("./app/forbidden"));
const ServerError = lazy(() => import("./app/server-error"));
const Tasks = lazy(() => import("./app/tasks"));
const Trash = lazy(() => import("./app/trash"));
const Profile = lazy(() => import("./app/profile"));
const Register = lazy(() => import("./app/register"));

const Loading = () => (
  <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
    <Spin size="large" />
  </div>
);

const { Content } = AntLayout;

// 页面过渡包装器
const PageTransition = ({ children }) => {
  const location = useLocation();
  const ref = useRef(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.style.animation = 'none';
      ref.current.offsetHeight; // 触发回流
      ref.current.style.animation = 'fadeInUp 0.35s cubic-bezier(0.22, 1, 0.36, 1) forwards';
    }
  }, [location.pathname]);

  return <div ref={ref} style={{ opacity: 0 }}>{children}</div>;
};

// 布局组件（Nav + 内容）
const Layout = ({ children }) => (
  <div style={{ minHeight: "100vh", background: "#f0f2f5" }}>
    <Nav />
    <AntLayout style={{ minHeight: "calc(100vh - 52px)", background: "#f0f2f5" }}>
      <Content style={{ padding: 24, margin: 0, minHeight: 280 }}>
        <PageTransition>{children}</PageTransition>
      </Content>
    </AntLayout>
  </div>
);

function App() {
  const { isLogin, currentUser, setLogin, setCurrentUser, logout } = useAuthStore();

  // 初始化：从 localStorage 恢复登录状态
  useEffect(() => {
    const initAuth = async () => {
      const savedUser = token.loadUser();
      const savedToken = token.get();

      if (savedUser && savedToken) {
        // Token 有效性二次校验
        try {
          const res = await get(API_AUTH_ME, {}, { skipGlobalError: true });
          const freshUser = res.data?.user || savedUser;
          token.saveUser(freshUser);
          setLogin(true);
          setCurrentUser(freshUser);
        } catch {
          // Token 无效，清除
          token.clear();
          logout();
        }
      } else {
        logout();
      }
    };
    initAuth();
  }, [setLogin, setCurrentUser, logout]);

  // 监听 auth-change 自定义事件
  useEffect(() => {
    const handleAuthChange = (event) => {
      const next = event?.detail?.isAuthenticated;
      if (!next) {
        logout();
      } else {
        const savedUser = token.loadUser();
        if (savedUser) {
          setLogin(true);
          setCurrentUser(savedUser);
        }
      }
    };
    window.addEventListener("auth-change", handleAuthChange);
    return () => window.removeEventListener("auth-change", handleAuthChange);
  }, [setLogin, setCurrentUser, logout]);

  const isAdmin = currentUser?.role === "admin";

  return (
    <ErrorBoundary>
      <Router>
        <Suspense fallback={<Loading />}>
          <Routes>
          {/* 登录页 — 未登录可访问 */}
          <Route
            path="/login"
            element={
              isLogin ? <Navigate to="/tasks" replace /> : <Login />
            }
          />

          {/* 注册页 — 未登录可访问 */}
          <Route
            path="/register"
            element={
              isLogin ? <Navigate to="/tasks" replace /> : <Register />
            }
          />

          {/* 仪表盘 */}
          <Route
            path="/dashboard"
            element={
              isLogin ? (
                <Layout>
                  <Dashboard />
                </Layout>
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />

          {/* 任务管理 */}
          <Route
            path="/tasks"
            element={
              isLogin ? (
                <Layout>
                  <Tasks />
                </Layout>
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />

          {/* 个人设置 */}
          <Route
            path="/profile"
            element={
              isLogin ? (
                <Layout><Profile /></Layout>
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />

          {/* 回收站 */}
          <Route
            path="/trash"
            element={
              isLogin ? (
                <Layout>
                  <Trash />
                </Layout>
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />

          {/* 管理后台 — 仅 admin 角色可访问 */}
          <Route
            path="/admin"
            element={
              isLogin && isAdmin ? (
                <Layout>
                  <Admin />
                </Layout>
              ) : (
                <Navigate to={isLogin ? "/tasks" : "/login"} replace />
              )
            }
          />

          {/* 403 禁止访问 */}
          <Route path="/403" element={<Forbidden />} />

          {/* 500 服务器错误 */}
          <Route path="/500" element={<ServerError />} />

          {/* 默认跳转到任务管理 */}
          <Route path="/" element={<Navigate to="/tasks" replace />} />

          {/* 404 未匹配 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </Router>
    </ErrorBoundary>
  );
}

export default App;
