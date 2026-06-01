import { API_SERVER } from "./apis";

// 认证相关 API
export const API_LOGIN = API_SERVER + "/api/auth/login";
export const API_AUTH_ME = API_SERVER + "/api/auth/me";
export const API_DEV_CREATE_USER = API_SERVER + "/api/auth/dev-create-user";
export const API_LOGOUT = API_SERVER + "/api/auth/logout";

// 任务管理 API
export const API_TASKS = API_SERVER + "/api/tasks";
export const API_TASK_LIST = API_SERVER + "/api/tasks";
export const API_TASK_STATS = API_SERVER + "/api/tasks/stats/overview";
export const API_TASK_TREND = API_SERVER + "/api/tasks/stats/trend";
export const API_TASK_CATEGORIES = API_SERVER + "/api/tasks/categories";
export const API_TASK_USERS = API_SERVER + "/api/tasks/users";

// Admin 管理 API
export const API_ADMIN_USERS = API_SERVER + "/api/admin/users";
export const API_ADMIN_CATEGORIES = API_SERVER + "/api/admin/categories";
