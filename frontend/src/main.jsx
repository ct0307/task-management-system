import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ConfigProvider } from "antd";
import zhCN from "antd/locale/zh_CN";
import App from "./App.jsx";
import ErrorBoundary from "@/component/ErrorBoundary";
import { ThemeProvider, useTheme, darkThemeToken, lightThemeToken } from "@/component/ThemeToggle";

import "./index.less";
import "./var.less";
import "./styles/theme.less";
import "./styles/animations.less";
import "./styles/global.less";
import "./styles/dark.less";

// Ant Design 主题配置 - 支持亮色/暗色切换
const ThemedApp = () => {
  const { isDark } = useTheme();

  const themeConfig = {
    token: isDark ? darkThemeToken : {
      ...lightThemeToken,
      fontFamily: "\"PingFang SC\", \"Microsoft YaHei\", \"Inter\", system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    },
    components: {
      Button: {
        borderRadius: 8,
        controlHeight: 38,
      },
      Input: {
        borderRadius: 8,
        controlHeight: 38,
      },
      InputNumber: {
        borderRadius: 8,
        controlHeight: 38,
      },
      Select: {
        borderRadius: 8,
        controlHeight: 38,
      },
      Table: {
        borderRadius: 12,
      },
      Card: {
        borderRadius: 12,
      },
      Modal: {
        borderRadius: 16,
      },
      Menu: {
        borderRadius: 8,
        itemBorderRadius: 8,
      },
    },
  };

  return (
    <ConfigProvider theme={themeConfig} locale={zhCN}>
      <App />
    </ConfigProvider>
  );
};

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ErrorBoundary>
      <ThemeProvider>
        <ThemedApp />
      </ThemeProvider>
    </ErrorBoundary>
  </StrictMode>
);
