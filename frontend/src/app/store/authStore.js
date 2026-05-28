/**
 * 认证状态管理 - Zustand 版本
 * 统一状态管理，替代原有的 Jotai atoms
 */
import { create } from 'zustand';

const useAuthStore = create((set) => ({
  // 是否已登录
  isLogin: false,
  // 当前用户信息
  currentUser: null,
  // 加载状态
  checked: false,

  // 设置登录状态
  setLogin: (isLogin) => set({ isLogin }),

  // 设置当前用户
  setCurrentUser: (user) => set({ currentUser: user }),

  // 设置初始化检查完成
  setChecked: (checked) => set({ checked }),

  // 初始化（从 localStorage 恢复）
  initAuth: (savedUser, savedToken) => set({
    isLogin: !!(savedUser && savedToken),
    currentUser: savedUser || null,
    checked: true
  }),

  // 登出
  logout: () => set({
    isLogin: false,
    currentUser: null
  })
}));

export default useAuthStore;
