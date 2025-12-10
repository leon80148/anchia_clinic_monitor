/**
 * 時段篩選元件
 * 提供早、午、晚、全部的時段選擇，並根據當前時間自動選擇預設時段
 */

import React, { useEffect, useRef } from 'react';
import { Card, Radio } from 'antd';
import { ClockCircleOutlined } from '@ant-design/icons';

/**
 * 根據當前時間獲取預設時段
 * 08:00-12:00 → 早
 * 12:00-18:00 → 午
 * 18:00-24:00 → 晚
 */
const getDefaultSession = () => {
  const now = new Date();
  const hour = now.getHours();

  if (hour >= 8 && hour < 12) {
    return '早';
  } else if (hour >= 12 && hour < 18) {
    return '午';
  } else if (hour >= 18 && hour < 24) {
    return '晚';
  } else {
    // 00:00-08:00 默認顯示全部
    return '全部';
  }
};

const SessionFilter = React.memo(({ selectedSession, onSessionChange }) => {
  const initialized = useRef(false);

  // 初始化時根據當前時間設定預設時段（只執行一次）
  useEffect(() => {
    if (!initialized.current && selectedSession === null) {
      initialized.current = true;
      const defaultSession = getDefaultSession();
      onSessionChange(defaultSession);
    }
  }, [selectedSession, onSessionChange]);

  const handleChange = (e) => {
    onSessionChange(e.target.value);
  };

  const options = [
    { label: '早', value: '早' },
    { label: '午', value: '午' },
    { label: '晚', value: '晚' },
    { label: '全部', value: '全部' }
  ];

  return (
    <Card
      size="small"
      title={
        <span>
          <ClockCircleOutlined /> 時段篩選
        </span>
      }
      style={{
        marginBottom: 16,
        borderRadius: 8
      }}
    >
      <Radio.Group
        options={options}
        onChange={handleChange}
        value={selectedSession || '全部'}
        optionType="button"
        buttonStyle="solid"
        size="middle"
      />
    </Card>
  );
});

export default SessionFilter;
