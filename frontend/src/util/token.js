const USER_KEY = "APP_USER";
const TOKEN_KEY = "AUTH_TOKEN";

const token = {
  // 默认用 sessionStorage（每个标签页独立），remember 时用 localStorage
  _storage(remember) {
    return remember ? localStorage : sessionStorage;
  },

  saveUser(user, remember = false) {
    if (!user) return;
    try {
      const s = this._storage(remember);
      s.setItem(USER_KEY, JSON.stringify(user));
      if (user.token) s.setItem(TOKEN_KEY, user.token);
    } catch (_) {}
  },

  loadUser() {
    // 优先读 sessionStorage（当前标签页会话），再读 localStorage（记住我）
    try {
      const u = sessionStorage.getItem(USER_KEY) || localStorage.getItem(USER_KEY);
      return u ? JSON.parse(u) : null;
    } catch (_) {
      return null;
    }
  },

  get() {
    return sessionStorage.getItem(TOKEN_KEY) || localStorage.getItem(TOKEN_KEY);
  },

  clear() {
    [sessionStorage, localStorage].forEach((s) => {
      s.removeItem(USER_KEY);
      s.removeItem(TOKEN_KEY);
    });
  }
};

export default token;
