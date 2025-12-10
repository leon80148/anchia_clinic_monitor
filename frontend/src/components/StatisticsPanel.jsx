/**
 * 統計面板元件
 * 顯示候診統計資訊：預約未到、掛號人數、待診人數、完診人數
 */

import React from 'react';
import { Row, Col, Card, Statistic } from 'antd';
import {
  ClockCircleOutlined,
  UserOutlined,
  HourglassOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';

const StatisticsPanel = React.memo(({ statistics }) => {
  return (
    <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
      {/* 預約未到 */}
      <Col xs={24} sm={12} lg={6}>
        <Card className="statistics-card">
          <Statistic
            title="預約未到"
            value={statistics.notArrived}
            prefix={<ClockCircleOutlined />}
            valueStyle={{ color: '#faad14' }}
          />
        </Card>
      </Col>

      {/* 掛號人數 */}
      <Col xs={24} sm={12} lg={6}>
        <Card className="statistics-card">
          <Statistic
            title="掛號人數"
            value={statistics.total}
            prefix={<UserOutlined />}
            valueStyle={{ color: '#1890ff' }}
          />
        </Card>
      </Col>

      {/* 待診人數 */}
      <Col xs={24} sm={12} lg={6}>
        <Card className="statistics-card">
          <Statistic
            title="待診人數"
            value={statistics.waiting}
            prefix={<HourglassOutlined />}
            valueStyle={{ color: '#ff4d4f' }}
          />
        </Card>
      </Col>

      {/* 完診人數 */}
      <Col xs={24} sm={12} lg={6}>
        <Card className="statistics-card">
          <Statistic
            title="完診人數"
            value={statistics.completed}
            prefix={<CheckCircleOutlined />}
            valueStyle={{ color: '#52c41a' }}
          />
        </Card>
      </Col>
    </Row>
  );
});

export default StatisticsPanel;
