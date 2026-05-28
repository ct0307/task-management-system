import { describe, it, expect, beforeEach } from 'vitest';
import useAuthStore from '../app/store/authStore';

describe('authStore', () => {
  beforeEach(() => {
    useAuthStore.setState({
      isLogin: false,
      currentUser: null,
      checked: false
    });
  });

  it('初始状态应为未登录', () => {
    const state = useAuthStore.getState();
    expect(state.isLogin).toBe(false);
    expect(state.currentUser).toBeNull();
    expect(state.checked).toBe(false);
  });

  it('setLogin 应正确设置登录状态', () => {
    useAuthStore.getState().setLogin(true);
    expect(useAuthStore.getState().isLogin).toBe(true);
  });

  it('setCurrentUser 应正确设置用户信息', () => {
    const user = { id: 1, username: 'admin', role: 'admin' };
    useAuthStore.getState().setCurrentUser(user);
    expect(useAuthStore.getState().currentUser).toEqual(user);
  });

  it('logout 应清除登录状态', () => {
    useAuthStore.setState({ isLogin: true, currentUser: { id: 1 } });
    useAuthStore.getState().logout();
    expect(useAuthStore.getState().isLogin).toBe(false);
    expect(useAuthStore.getState().currentUser).toBeNull();
  });

  it('initAuth 应在有用户和 token 时设为已登录', () => {
    const user = { id: 1, username: 'admin', role: 'admin' };
    useAuthStore.getState().initAuth(user, 'test-token');
    const state = useAuthStore.getState();
    expect(state.isLogin).toBe(true);
    expect(state.currentUser).toEqual(user);
    expect(state.checked).toBe(true);
  });

  it('initAuth 应在无 token 时不设为已登录', () => {
    useAuthStore.getState().initAuth({ id: 1 }, null);
    const state = useAuthStore.getState();
    expect(state.isLogin).toBe(false);
    expect(state.checked).toBe(true);
  });
});
