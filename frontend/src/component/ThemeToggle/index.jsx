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
  colorPrimary: '#ff7a52',
  colorSuccess: '#5da87c',
  colorWarning: '#e8b34a',
  colorError: '#e8685a',
  colorInfo: '#ff7a52',
  colorBgBase: '#1a1817',
  colorBgContainer: '#252220',
  colorBgElevated: '#2e2a26',
  colorBgLayout: '#141211',
  colorBorder: '#3a3631',
  colorBorderSecondary: '#2e2a26',
  colorText: '#c9c3bc',
  colorTextSecondary: '#9a948d',
  colorTextTertiary: '#65605a',
  colorBgSpotlight: '#3a3631',
  borderRadius: 8
};

// 亮色主题 Ant Design token 覆盖
export const lightThemeToken = {
  colorPrimary: '#e85d3a',
  colorBgBase: '#ffffff',
  colorBgContainer: '#ffffff',
  colorBgElevated: '#ffffff',
  colorBgLayout: '#faf8f5',
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
        icon={isDark ? <SunOutlined style={{ color: '#e8b34a' }} /> : <MoonOutlined style={{ color: '#78736d' }} />}
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
