/**
 * 主题切换组件
 * 支持亮色/暗色模式切换，持久化到 localStorage
 */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Button, Tooltip } from 'antd';
import { SunOutlined, MoonOutlined } from '@ant-design/icons';

const THEME_KEY = 'APP_THEME';

// 暗色主题 Ant Design token 覆盖
export const darkThemeToken = {
  colorPrimary: '#4dabf7',
  colorSuccess: '#69db7c',
  colorWarning: '#ffd43b',
  colorError: '#ff6b6b',
  colorInfo: '#4dabf7',
  colorBgBase: '#1a1b1e',
  colorBgContainer: '#25262b',
  colorBgElevated: '#2c2e33',
  colorBgLayout: '#141517',
  colorBorder: '#373a40',
  colorBorderSecondary: '#2c2e33',
  colorText: '#c1c2c5',
  colorTextSecondary: '#909296',
  colorTextTertiary: '#5c5f66',
  colorBgSpotlight: '#373a40',
  borderRadius: 8
};

// 亮色主题 Ant Design token 覆盖
export const lightThemeToken = {
  colorPrimary: '#1a73e8',
  colorBgBase: '#ffffff',
  colorBgContainer: '#ffffff',
  colorBgElevated: '#ffffff',
  colorBgLayout: '#f8f9fa',
  borderRadius: 8
};

// 创建 Theme Context
const ThemeContext = createContext({
  isDark: false,
  toggleTheme: () => {}
});

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(() => {
    try {
      return localStorage.getItem(THEME_KEY) === 'dark';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(THEME_KEY, isDark ? 'dark' : 'light');
    } catch {
      // ignore
    }
    // 更新 body class
    document.body.className = isDark ? 'theme-dark' : 'theme-light';
  }, [isDark]);

  const toggleTheme = useCallback(() => {
    setIsDark(prev => !prev);
  }, []);

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

/**
 * 主题切换按钮组件
 * 可在导航栏等位置使用
 */
const ThemeToggle = () => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <Tooltip title={isDark ? '切换到亮色模式' : '切换到暗色模式'}>
      <Button
        type="text"
        icon={isDark ? <SunOutlined style={{ color: '#ffd43b' }} /> : <MoonOutlined style={{ color: '#5f6368' }} />}
        onClick={toggleTheme}
        style={{
          width: 36,
          height: 36,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 16
        }}
      />
    </Tooltip>
  );
};

export default ThemeToggle;
