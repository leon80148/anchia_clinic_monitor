/**
 * React 應用進入點
 * 配置 Ant Design 主題（綠色系）並渲染 App 元件
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import { ConfigProvider } from 'antd';
import zhTW from 'antd/locale/zh_TW';
import App from './App.jsx';
import './index.css';

// 綠色主題配置
const theme = {
  token: {
    colorPrimary: '#52c41a',      // 主色：綠色
    colorSuccess: '#52c41a',      // 成功色：綠色
    colorInfo: '#1890ff',         // 資訊色：藍色
    colorWarning: '#faad14',      // 警告色：橙色
    colorError: '#ff4d4f',        // 錯誤色：紅色
    borderRadius: 8,              // 圓角
    fontSize: 14,                 // 基礎字體大小
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Microsoft JhengHei", sans-serif'
  },
  components: {
    Table: {
      headerBg: '#f0f9ff',        // 表頭背景
      headerColor: '#262626',     // 表頭文字
      rowHoverBg: '#f6ffed',      // 行懸停背景（淺綠）
    },
    Card: {
      headerBg: '#fafafa',        // 卡片標題背景
    },
    Layout: {
      headerBg: '#52c41a',        // Layout Header 背景（綠色）
      bodyBg: '#f5f5f5',          // Layout Body 背景
      footerBg: '#ffffff',        // Layout Footer 背景
    }
  }
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ConfigProvider locale={zhTW} theme={theme}>
      <App />
    </ConfigProvider>
  </React.StrictMode>
);
