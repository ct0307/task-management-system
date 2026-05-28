const USER_KEY = "APP_USER";
const TOKEN_KEY = "AUTH_TOKEN";

const token = {
  saveUser(user) {
    if (!user) return;
    try {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      if (user.token) localStorage.setItem(TOKEN_KEY, user.token);
    } catch (_) {
      // 写入失败（无痕模式/配额满），静默忽略
    }
  },

  loadUser() {
    try {
      const u = localStorage.getItem(USER_KEY);
      return u ? JSON.parse(u) : null;
    } catch (_) {
      return null;
    }
  },

  get() {
    return localStorage.getItem(TOKEN_KEY);
  },

  clear() {
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(TOKEN_KEY);
  }
};

export default token;
