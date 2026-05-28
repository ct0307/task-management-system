/**
 * 共享菜单配置
 * 轻量化任务管理系统菜单
 */
import {
  DashboardOutlined,
  SettingOutlined,
  CheckSquareOutlined,
  DeleteOutlined,
  UserOutlined
} from "@ant-design/icons";

/** 菜单配置 — 按角色分组 */
const menuConfig = {
  admin: [
    { key: "/dashboard", path: "/dashboard", label: "仪表盘", icon: "📊", antdIcon: <DashboardOutlined /> },
    { key: "/tasks", path: "/tasks", label: "任务管理", icon: "✅", antdIcon: <CheckSquareOutlined /> },
    { key: "/trash", path: "/trash", label: "回收站", icon: "🗑️", antdIcon: <DeleteOutlined /> },
    { key: "/admin", path: "/admin", label: "系统管理", icon: "⚙️", antdIcon: <SettingOutlined /> },
    { key: "/profile", path: "/profile", label: "个人设置", icon: "👤", antdIcon: <UserOutlined /> }
  ],
  user: [
    { key: "/dashboard", path: "/dashboard", label: "仪表盘", icon: "📊", antdIcon: <DashboardOutlined /> },
    { key: "/tasks", path: "/tasks", label: "任务管理", icon: "✅", antdIcon: <CheckSquareOutlined /> },
    { key: "/trash", path: "/trash", label: "回收站", icon: "🗑️", antdIcon: <DeleteOutlined /> },
    { key: "/profile", path: "/profile", label: "个人设置", icon: "👤", antdIcon: <UserOutlined /> }
  ]
};

/** 默认角色（无匹配时使用） */
const DEFAULT_ROLE = "user";

/**
 * 根据角色获取可见菜单
 */
export function getMenusByRole(role) {
  return menuConfig[role] || menuConfig[DEFAULT_ROLE];
}

/**
 * 获取所有角色列表
 */
export function getRoles() {
  return Object.keys(menuConfig);
}

export default menuConfig;
