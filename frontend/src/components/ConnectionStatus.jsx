/**
 * 連線狀態元件
 * 顯示 WebSocket 連線狀態、最後更新時間和錯誤訊息
 */

import React from 'react';
import { Alert, Space, Typography } from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  SyncOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';

const { Text } = Typography;

const ConnectionStatus = React.memo(({ connectionStatus }) => {
  const { connected, lastUpdate, error, reconnecting, reconnectAttempt } = connectionStatus;

  // 格式化時間
  const formatTime = (date) => {
    if (!date) return '-';
    const d = new Date(date);
    return d.toLocaleTimeString('zh-TW', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  // 決定顯示的狀態
  let statusType = 'info';
  let statusMessage = '連線中...';
  let statusIcon = <SyncOutlined spin />;

  if (error) {
    statusType = 'error';
    statusMessage = `連線錯誤: ${error}`;
    statusIcon = <CloseCircleOutlined />;
  } else if (reconnecting) {
    statusType = 'warning';
    statusMessage = `正在重新連線... (第 ${reconnectAttempt} 次嘗試)`;
    statusIcon = <SyncOutlined spin />;
  } else if (connected) {
    statusType = 'success';
    statusMessage = '已連線';
    statusIcon = <CheckCircleOutlined />;
  } else {
    statusType = 'warning';
    statusMessage = '未連線';
    statusIcon = <CloseCircleOutlined />;
  }

  return (
    <Alert
      type={statusType}
      icon={statusIcon}
      message={
        <Space split="|" size="large">
          <Text strong>{statusMessage}</Text>
          {lastUpdate && (
            <Text type="secondary">
              <ClockCircleOutlined /> 最後更新: {formatTime(lastUpdate)}
            </Text>
          )}
        </Space>
      }
      style={{ marginBottom: 16 }}
      banner
    />
  );
});

export default ConnectionStatus;
