/**
 * 診所候診狀態監控系統 - 主應用元件
 * 整合所有子元件，處理 WebSocket 連線和資料更新
 */

import { useEffect, useCallback, useMemo } from 'react';
import { Layout, Typography, Space } from 'antd';
import { HeartOutlined } from '@ant-design/icons';
import useClinicStore from './store/useClinicStore';
import socketClient from './services/socketClient';
import ConnectionStatus from './components/ConnectionStatus';
import SettingsPanel from './components/SettingsPanel';
import SessionFilter from './components/SessionFilter';
import StatisticsPanel from './components/StatisticsPanel';
import PatientTable from './components/PatientTable';
import './App.css';

const { Header, Content, Footer } = Layout;
const { Title } = Typography;

function App() {
  const {
    patients,
    statistics,
    settings,
    selectedSession,
    connectionStatus,
    updateData,
    updateSettings,
    setSelectedSession,
    updateConnectionStatus,
    setReconnecting,
    setError,
    loadSettings
  } = useClinicStore();

  useEffect(() => {
    // 載入設定
    loadSettings();

    // 連接 WebSocket
    // 在生產環境（Docker）中使用當前頁面的 origin
    // 在開發環境中使用環境變數或默認值
    const serverUrl = import.meta.env.MODE === 'production'
      ? window.location.origin
      : (import.meta.env.VITE_SERVER_URL || 'http://localhost:3001');

    console.log('🔌 連接到 WebSocket 伺服器:', serverUrl);
    socketClient.connect(serverUrl);

    // 監聽候診資料更新
    socketClient.on('clinicData', (data) => {
      updateData(data);
    });

    // 監聽連線狀態
    socketClient.on('connectionStatus', (status) => {
      updateConnectionStatus(status);
    });

    // 監聽重連狀態
    socketClient.on('reconnecting', (info) => {
      setReconnecting(info);
    });

    // 監聽連線錯誤
    socketClient.on('connectionError', (error) => {
      setError(error.message);
    });

    // 清理函數
    return () => {
      socketClient.disconnect();
    };
  }, []);

  // 處理設定變更
  const handleSettingsChange = (newSettings) => {
    updateSettings(newSettings);
    // 通知後端設定變更
    socketClient.updateSettings(newSettings);
  };

  // 處理時段變更（使用 useCallback 避免不必要的重渲染）
  const handleSessionChange = useCallback((session) => {
    setSelectedSession(session);
  }, [setSelectedSession]);

  // 使用 useMemo 優化時段篩選計算
  const sessionFilteredPatients = useMemo(() => {
    if (selectedSession && selectedSession !== '全部') {
      return patients.filter(p => p.session === selectedSession);
    }
    return patients;
  }, [patients, selectedSession]);

  // 使用 useMemo 優化統計數字計算
  const filteredStatistics = useMemo(() => {
    return {
      notArrived: sessionFilteredPatients.filter(p => p.status === 'E').length,
      total: sessionFilteredPatients.filter(p => p.status !== 'H').length,
      completed: sessionFilteredPatients.filter(p => p.status === 'F').length,
      waiting: sessionFilteredPatients.filter(p =>
        p.status !== 'E' && p.status !== 'F' && p.status !== 'H'
      ).length
    };
  }, [sessionFilteredPatients]);

  // 使用 useMemo 優化病患列表篩選
  const filteredPatients = useMemo(() => {
    let result = sessionFilteredPatients;

    // 過濾預約病患
    if (!settings.showScheduled) {
      result = result.filter(p => p.status !== 'E');
    }

    // 過濾取消病患
    if (!settings.showCancelled) {
      result = result.filter(p => p.status !== 'H');
    }

    return result;
  }, [sessionFilteredPatients, settings.showScheduled, settings.showCancelled]);

  return (
    <Layout className="app-layout">
      <Header className="app-header">
        <Space>
          <HeartOutlined style={{ fontSize: '24px', color: '#52c41a' }} />
          <Title level={2} style={{ margin: 0, color: 'white' }}>
            安家診所候診狀態一覽表
          </Title>
        </Space>
      </Header>

      <Content className="app-content">
        <div className="content-wrapper">
          {/* 連線狀態 */}
          <ConnectionStatus connectionStatus={connectionStatus} />

          {/* 時段篩選 */}
          <SessionFilter
            selectedSession={selectedSession}
            onSessionChange={handleSessionChange}
          />

          {/* 設定面板 */}
          <SettingsPanel
            settings={settings}
            onSettingsChange={handleSettingsChange}
          />

          {/* 統計面板（根據時段篩選計算） */}
          <StatisticsPanel statistics={filteredStatistics} />

          {/* 候診列表 */}
          <PatientTable patients={filteredPatients} settings={settings} />
        </div>
      </Content>

      <Footer className="app-footer">
        <Space split="|">
          <span>安家診所候診系統 v1.0.0</span>
          <span>© 2024 All Rights Reserved</span>
        </Space>
      </Footer>
    </Layout>
  );
}

export default App;
