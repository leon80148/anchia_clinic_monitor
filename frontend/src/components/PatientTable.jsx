/**
 * 候診列表表格元件
 * 顯示候診病患資訊，包含狀態顏色標記
 */

import React from 'react';
import { Table, Tag, Badge } from 'antd';

const PatientTable = React.memo(({ patients, settings = {} }) => {
  // 狀態配置
  // I: 看診中, A: 候診中, 0: 保留, E: 預約, H: 取消, F: 完診
  const statusConfig = {
    'I': { text: '看診中', badge: 'processing', color: 'processing' },
    'A': { text: '候診中', badge: 'warning', color: 'warning' },
    '0': { text: '保留', badge: 'default', color: 'default' },
    'E': { text: '預約未到', badge: 'default', color: 'default' },
    'H': { text: '已取消', badge: 'default', color: 'default' },
    'F': { text: '已完診', badge: 'success', color: 'success' }
  };

  // 身分別配置
  const identityConfig = {
    '健保': { color: 'blue' },
    '自費': { color: 'default' },
    '其他': { color: 'orange' }
  };

  // 格式化生日顯示（民國年轉西元年）
  const formatBirthDate = (birthDate) => {
    if (!birthDate || birthDate.length < 7) return '-';
    try {
      const rocYear = parseInt(birthDate.substring(0, 3), 10);
      const month = birthDate.substring(3, 5);
      const day = birthDate.substring(5, 7);
      const adYear = rocYear + 1911;
      return `${adYear}/${month}/${day}`;
    } catch (error) {
      return birthDate;
    }
  };

  // 格式化時間顯示（HHMMSS → HH:MM:SS）
  const formatTime = (timeStr) => {
    if (!timeStr || timeStr.length !== 6) return '-';
    try {
      const hour = timeStr.substring(0, 2);
      const minute = timeStr.substring(2, 4);
      const second = timeStr.substring(4, 6);
      return `${hour}:${minute}:${second}`;
    } catch (error) {
      return timeStr;
    }
  };

  // 表格欄位定義（根據隱私模式動態調整）
  const columns = [
    {
      title: '序號',
      dataIndex: 'queueNumber',
      key: 'queueNumber',
      width: 100,
      align: 'center',
      render: (text) => (
        <span className="queue-number" style={{ fontSize: '18px', fontWeight: 'bold' }}>
          {text || '-'}
        </span>
      ),
      fixed: 'left'
    },
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
      width: 120,
      render: (text) => text || '-'
    },
    // 生日欄位（僅在非隱私模式顯示）
    ...(settings.privacyMode ? [] : [{
      title: '生日',
      dataIndex: 'birthDate',
      key: 'birthDate',
      width: 120,
      align: 'center',
      render: (birthDate) => formatBirthDate(birthDate)
    }]),
    {
      title: '年齡',
      dataIndex: 'age',
      key: 'age',
      width: 80,
      align: 'center',
      render: (age) => age ? `${age}歲` : '-'
    },
    {
      title: '身分',
      dataIndex: 'identity',
      key: 'identity',
      width: 100,
      render: (identity) => {
        const config = identityConfig[identity] || identityConfig['其他'];
        return <Tag color={config.color}>{identity}</Tag>;
      }
    },
    {
      title: '狀態',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status) => {
        const config = statusConfig[status] || statusConfig['A'];
        return <Badge status={config.badge} text={config.text} />;
      }
    },
    {
      title: '完診時間',
      dataIndex: 'completeTime',
      key: 'completeTime',
      width: 100,
      align: 'center',
      render: (completeTime) => formatTime(completeTime)
    },
    {
      title: '時段',
      dataIndex: 'session',
      key: 'session',
      width: 100,
      align: 'center',
      render: (session) => session || '-'
    }
  ];

  return (
    <div className="patient-table">
      <Table
        columns={columns}
        dataSource={patients}
        rowKey={(record) => record.patientId + record.queueNumber}
        pagination={false}
        scroll={{ y: 600, x: 'max-content' }}
        virtual={patients.length > 100}
        size="middle"
        bordered
        rowClassName={(record) => {
          // 根據狀態添加不同的行樣式
          // I: 看診中, A: 候診中, 0: 保留, E: 預約, H: 取消, F: 完診
          if (record.status === 'I') return 'row-current'; // 看診中
          if (record.status === 'A') return 'row-waiting'; // 候診中
          if (record.status === '0') return 'row-reserved'; // 保留
          if (record.status === 'F') return 'row-completed'; // 完診
          if (record.status === 'H') return 'row-cancelled'; // 取消
          return '';
        }}
      />
    </div>
  );
});

export default PatientTable;
