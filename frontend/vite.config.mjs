import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: [],
  },
  server: {
    sourcemap: true, // 确保此项为 true（Vite 4.0+，这也是默认值）
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true
      },
      "/dev-api": {
        target: "http://localhost:3000",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/dev-api/, "")
      }
    }
  },
  plugins: [react()],
  css: {
    modules: {
      localsConvention: "camelCaseOnly"
    },
    preprocessorOptions: {
      less: {
        javascriptEnabled: true,
        modifyVars: {
          "primary-color": "#e85d3a",
          "success-color": "#3d8c5c",
          "warning-color": "#d4972e",
          "error-color": "#d94436",
          "border-radius-base": "8px"
        }
      }
    }
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      "@app": path.resolve(__dirname, "src/app"),
      "@util": path.resolve(__dirname, "src/util"),
      "@constants": path.resolve(__dirname, "src/constants"),
      "@component": path.resolve(__dirname, "src/component"),
      "@store": path.resolve(__dirname, "src/store"),
    }
  },
  build: {
    rollupOptions: {
      output: {
        entryFileNames: "js/[name]-[hash].js",
        chunkFileNames: "js/[name]-[hash].js",

        assetFileNames: (assetInfo) => {
          const fileName = assetInfo.name || "";
          if (fileName.endsWith(".css")) return "css/[name]-[hash][extname]";
          const imgExts = [".png", ".jpg", ".jpeg", ".gif", ".svg", ".webp"];
          if (imgExts.some((ext) => fileName.endsWith(ext))) return "images/[name]-[hash][extname]";
          const fontExts = [".woff", ".woff2", ".ttf", ".eot"];
          if (fontExts.some((ext) => fileName.endsWith(ext))) return "fonts/[name]-[hash][extname]";
          return "assets/[name]-[hash][extname]";
        },

        // Vendor 代码拆分：减小首屏 bundle 体积
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-antd': ['antd', '@ant-design/icons'],
          'vendor-charts': ['recharts'],
        }
      }
    }
  }
});
