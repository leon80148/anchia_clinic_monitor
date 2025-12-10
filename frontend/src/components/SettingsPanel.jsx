/**
 * 設定面板元件
 * 提供隱私模式和顯示退掛人員的切換選項
 */

import React from 'react';
import { Card, Checkbox, Space, Tooltip } from 'antd';
import { SettingOutlined } from '@ant-design/icons';

const SettingsPanel = React.memo(({ settings, onSettingsChange }) => {
  const handleShowScheduledChange = (e) => {
    onSettingsChange({
      ...settings,
      showScheduled: e.target.checked
    });
  };

  const handleShowCancelledChange = (e) => {
    onSettingsChange({
      ...settings,
      showCancelled: e.target.checked
    });
  };

  const handlePrivacyModeChange = (e) => {
    onSettingsChange({
      ...settings,
      privacyMode: e.target.checked
    });
  };

  return (
    <Card
      size="small"
      title={
        <span>
          <SettingOutlined /> 顯示設定
        </span>
      }
      style={{
        marginBottom: 16,
        borderRadius: 8
      }}
    >
      <Space direction="vertical" style={{ width: '100%' }}>
        <Checkbox
          checked={settings.showScheduled}
          onChange={handleShowScheduledChange}
        >
          顯示預約病患
        </Checkbox>

        <Checkbox
          checked={settings.showCancelled}
          onChange={handleShowCancelledChange}
        >
          顯示退掛人員
        </Checkbox>

        <Checkbox
          checked={settings.privacyMode}
          onChange={handlePrivacyModeChange}
        >
          <Tooltip title="啟用後姓名將顯示為「王○○」格式，保護病患隱私">
            隱私保護模式
          </Tooltip>
        </Checkbox>
      </Space>
    </Card>
  );
});

export default SettingsPanel;
