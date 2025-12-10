/**
 * 門診狀態一覽表系統 - 後端主程式
 * 整合 Express、Socket.io、DBF 讀取與檔案監控
 */

const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');

// 載入配置
const config = require('./config/default');

// 載入服務
const DBFReader = require('./services/dbfReader');
const DBFWatcher = require('./services/dbfWatcher');
const SocketService = require('./services/socketService');

// 建立 Express 應用
const app = express();
const httpServer = createServer(app);

// 建立 Socket.io 伺服器
const io = new Server(httpServer, {
  cors: {
    origin: config.corsOrigin,
    methods: ['GET', 'POST']
  }
});

// 中介軟體
app.use(cors({ origin: config.corsOrigin }));
app.use(express.json());

// 健康檢查端點
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    dbfPath: config.dbfFilePath,
    connectedClients: socketService ? socketService.getConnectedCount() : 0
  });
});

// 靜態檔案服務（生產環境）
if (config.nodeEnv === 'production') {
  const publicPath = path.join(__dirname, 'public');
  app.use(express.static(publicPath));

  app.get('*', (req, res) => {
    res.sendFile(path.join(publicPath, 'index.html'));
  });
}

// 初始化服務
console.log('=================================');
console.log('門診狀態一覽表系統 - 後端啟動中');
console.log('=================================');
console.log(`環境: ${config.nodeEnv}`);
console.log(`DBF 檔案: ${config.dbfFilePath}`);
console.log(`監控間隔: ${config.watchInterval}ms`);
console.log(`埠號: ${config.port}`);
console.log('=================================');

// 建立 DBF 讀取器
const dbfReader = new DBFReader(config.dbfFilePath);

// 建立 Socket.io 服務
const socketService = new SocketService(io, dbfReader);
socketService.initialize();

// 建立檔案監控器
const dbfWatcher = new DBFWatcher(config.dbfFilePath, {
  interval: config.watchInterval
});

// 監控器事件處理
dbfWatcher.on('ready', () => {
  console.log('✓ 檔案監控就緒');
});

dbfWatcher.on('fileChanged', async () => {
  console.log('→ 檔案變更，觸發資料推送');

  try {
    // 清除快取以強制重新讀取
    dbfReader.clearCache();

    // 廣播更新給所有客戶端
    await socketService.broadcastData();
    console.log('✓ 資料推送完成');
  } catch (error) {
    console.error('✗ 資料推送失敗:', error.message);
  }
});

dbfWatcher.on('error', (error) => {
  console.error('✗ 檔案監控錯誤:', error.message);
});

// 啟動檔案監控
dbfWatcher.start();

// 錯誤處理
process.on('uncaughtException', (error) => {
  console.error('未捕獲的異常:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('未處理的 Promise 拒絕:', reason);
});

// 優雅關閉
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

function shutdown() {
  console.log('\n正在關閉伺服器...');

  // 停止檔案監控
  dbfWatcher.stop();

  // 關閉 HTTP 伺服器
  httpServer.close(() => {
    console.log('伺服器已關閉');
    process.exit(0);
  });

  // 強制關閉（10 秒後）
  setTimeout(() => {
    console.error('強制關閉伺服器');
    process.exit(1);
  }, 10000);
}

// 啟動伺服器
httpServer.listen(config.port, () => {
  console.log('=================================');
  console.log(`✓ 伺服器運行於: http://localhost:${config.port}`);
  console.log('=================================\n');
});
