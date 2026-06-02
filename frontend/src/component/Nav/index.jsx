import React, { useState, useEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import cls from "classnames";
import s from "./index.module.less";
import logo from "@/assets/logo.svg";
import token from "@/util/token";
import { get, post, put, del } from "@/util/request";
import * as urls from "@/constants/urls";
import { getMenusByRole } from "@/constants/menu";
import { Button, Modal, Space, Tooltip, Badge, Popover, List, Typography } from "antd";
import {
  LogoutOutlined,
  LoginOutlined,
  BellOutlined,
  MenuOutlined,
  CloseOutlined
} from "@ant-design/icons";
import ThemeToggle from "@/component/ThemeToggle";
import dayjs from "dayjs";

const { Text } = Typography;

const Nav = () => {
  const nav = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  const user = token.loadUser();
  const displayName = user?.real_name || user?.username || "用户";

  // 通知状态
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await get('/api/notifications/unread-count');
      setUnreadCount(res.data?.count || 0);
    } catch { /* ignore */ }
  }, []);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await get('/api/notifications', { limit: 20 });
      setNotifications(res.data || []);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    if (user) {
      fetchUnreadCount();
      const interval = setInterval(fetchUnreadCount, 60000); // 每分钟刷新
      return () => clearInterval(interval);
    }
  }, [user, fetchUnreadCount]);

  // 请求浏览器通知权限
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const notifyBrowser = useCallback((title, body) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body, icon: '/ans.svg' });
    }
  }, []);

  const handleNotifOpen = (open) => {
    setNotifOpen(open);
    if (open) fetchNotifications();
  };

  // 收到新通知时弹出浏览器通知
  useEffect(() => {
    if (notifications.length > 0 && !notifOpen) {
      const latest = notifications[0];
      if (!latest.is_read) {
        notifyBrowser('任务管理系统', latest.message);
      }
    }
  }, [notifications.length, notifOpen]);

  const handleMarkRead = async (id, taskId) => {
    try { await put(`/api/notifications/${id}/read`); } catch { /* ignore */ }
    setUnreadCount(c => Math.max(0, c - 1));
    setNotifOpen(false);
    if (taskId) nav(`/tasks`);
  };

  const handleMarkAllRead = async () => {
    try { await put('/api/notifications/read-all'); } catch { /* ignore */ }
    setUnreadCount(0);
    setNotifications(ns => ns.map(n => ({ ...n, is_read: 1 })));
  };

  const handleLogout = () => setOpen(true);

  const confirmLogout = async () => {
    // 游客账号：退出时自动删除
    if (sessionStorage.getItem("IS_GUEST") === "1") {
      try { await del("/api/auth/guest"); } catch { /* ignore */ }
    }
    try {
      await post(urls.API_LOGOUT);
    } catch {
      // API 调用失败不影响本地退出
    }
    token.clear();
    sessionStorage.removeItem("IS_GUEST");
    window.dispatchEvent(
      new CustomEvent("auth-change", {
        detail: { isAuthenticated: false }
      })
    );
    nav("/login", { replace: true });
    setOpen(false);
  };

  const navItems = getMenusByRole(user?.role);

  return (
    <div className={s.nav}>
      <div className={s.left} onClick={() => nav("/dashboard")}>
        <div className={s.logo}>
          <img src={logo} alt="logo" />
        </div>
        <span className={s.brand}>轻量化任务管理</span>
      </div>

      {/* 移动端汉堡菜单按钮 */}
      <div className={s.mobileToggle} onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
        {mobileMenuOpen ? <CloseOutlined /> : <MenuOutlined />}
      </div>

      {/* 导航菜单 */}
      <div className={s.menu}>
        {navItems.map((item) => (
          <span
            key={item.path}
            className={cls(s.menuItem, { [s.menuItemActive]: location.pathname === item.path })}
            onClick={() => nav(item.path)}
          >
            {item.antdIcon} {item.label}
          </span>
        ))}
      </div>

      {/* 移动端下拉菜单 */}
      {mobileMenuOpen && (
        <div className={s.mobileMenu}>
          {navItems.map((item) => (
            <div
              key={item.path}
              className={cls(s.mobileMenuItem, { [s.mobileMenuItemActive]: location.pathname === item.path })}
              onClick={() => { nav(item.path); setMobileMenuOpen(false); }}
            >
              {item.antdIcon} {item.label}
            </div>
          ))}
        </div>
      )}

      {/* 右侧：主题切换 + 用户信息和退出 */}
      <div className={s.right}>
        {/* 通知铃铛 */}
        <Popover
          open={notifOpen}
          onOpenChange={handleNotifOpen}
          trigger="click"
          placement="bottomRight"
          title={
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>消息通知</span>
              {unreadCount > 0 && (
                <Button type="link" size="small" onClick={handleMarkAllRead}>全部已读</Button>
              )}
            </div>
          }
          content={
            <div style={{ width: 320, maxHeight: 400, overflow: 'auto' }}>
              {notifications.length === 0 ? (
                <Text type="secondary" style={{ display: 'block', textAlign: 'center', padding: 20 }}>暂无通知</Text>
              ) : (
                <List
                  dataSource={notifications}
                  renderItem={(item) => (
                    <List.Item
                      style={{
                        padding: '8px 0',
                        cursor: 'pointer',
                        backgroundColor: item.is_read ? 'transparent' : '#fdf0eb',
                        borderRadius: 6,
                        paddingLeft: 8,
                        paddingRight: 4,
                        marginBottom: 4
                      }}
                      onClick={() => handleMarkRead(item.id, item.task_id)}
                    >
                      <div>
                        <Text style={{ fontSize: 13, fontWeight: item.is_read ? 400 : 600 }}>
                          {item.message}
                        </Text>
                        <br />
                        <Text type="secondary" style={{ fontSize: 11 }}>
                          {dayjs(item.created_at).format('MM-DD HH:mm')}
                        </Text>
                      </div>
                    </List.Item>
                  )}
                />
              )}
            </div>
          }
        >
          <Badge count={unreadCount} size="small" offset={[-2, 2]}>
            <BellOutlined style={{ fontSize: 18, cursor: 'pointer', color: '#5f6368' }} />
          </Badge>
        </Popover>

        <ThemeToggle />
        {user ? (
          <div className={s.userInfo}>
            <div className={s.avatar}>
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div className={s.userMeta}>
              <div className={s.userName}>{displayName}</div>
              <div className={s.role}>{user.role === "admin" ? "管理员" : "普通用户"}</div>
            </div>
            <Tooltip title="退出登录">
              <Button
                type="text"
                size="small"
                icon={<LogoutOutlined />}
                onClick={handleLogout}
                className={s.logoutBtn}
              />
            </Tooltip>
          </div>
        ) : (
          <Button type="primary" size="small" icon={<LoginOutlined />} onClick={() => nav("/login")}>
            登录
          </Button>
        )}
      </div>

      {/* 退出确认弹窗 */}
      <Modal
        title="确认退出登录？"
        open={open}
        onOk={confirmLogout}
        onCancel={() => setOpen(false)}
        okText="确定"
        cancelText="取消"
        zIndex={2000}
        width={380}
        okButtonProps={{ danger: true }}
      >
        <div style={{ padding: "8px 0", color: "#5f6368" }}>
          退出后需要重新登录才能使用系统。
        </div>
      </Modal>
    </div>
  );
};

export default Nav;
