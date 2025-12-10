/**
 * WebSocket 服務
 * 使用 Socket.io 管理客戶端連接，推送候診資料
 */

class SocketService {
  constructor(io, dbfReader) {
    this.io = io;
    this.dbfReader = dbfReader;
    this.connectedClients = new Set();
  }

  /**
   * 初始化 Socket.io 事件監聽
   */
  initialize() {
    this.io.on('connection', (socket) => {
      const clientId = socket.id;
      console.log(`客戶端連接: ${clientId}`);
      this.connectedClients.add(clientId);

      // 初始化客戶端設定
      socket.data.settings = {
        showCancelled: false,
        privacyMode: false
      };

      // 立即發送當前資料
      this.sendDataToClient(socket);

      // 處理客戶端設定變更
      socket.on('updateSettings', (settings) => {
        console.log(`客戶端 ${clientId} 更新設定:`, settings);
        socket.data.settings = {
          showCancelled: Boolean(settings.showCancelled),
          privacyMode: Boolean(settings.privacyMode)
        };

        // 立即發送更新後的資料
        this.sendDataToClient(socket);
      });

      // 處理客戶端請求重新載入資料
      socket.on('requestData', () => {
        console.log(`客戶端 ${clientId} 請求資料`);
        this.sendDataToClient(socket);
      });

      // 處理斷線
      socket.on('disconnect', () => {
        console.log(`客戶端斷線: ${clientId}`);
        this.connectedClients.delete(clientId);
      });
    });

    console.log('Socket.io 服務已初始化');
  }

  /**
   * 發送資料給單一客戶端
   * @param {Object} socket - Socket.io socket 實例
   */
  async sendDataToClient(socket) {
    try {
      const settings = socket.data.settings || { showCancelled: false, privacyMode: false };
      const rawData = await this.dbfReader.getData();
      const processedData = this.processData(rawData, settings);

      socket.emit('clinicData', processedData);
    } catch (error) {
      console.error(`發送資料給客戶端 ${socket.id} 失敗:`, error.message);
      socket.emit('error', {
        type: 'data_error',
        message: '資料讀取失敗，請稍後再試'
      });
    }
  }

  /**
   * 廣播資料給所有連接的客戶端
   */
  async broadcastData() {
    console.log(`廣播資料給 ${this.connectedClients.size} 個客戶端`);

    const sockets = await this.io.fetchSockets();

    for (const socket of sockets) {
      await this.sendDataToClient(socket);
    }
  }

  /**
   * 處理資料：過濾、排序、計算統計
   * @param {Object} rawData - 原始資料
   * @param {Object} settings - 客戶端設定
   * @returns {Object} 處理後的資料
   */
  processData(rawData, settings) {
    let patients = rawData.patients || [];

    // 1. 過濾退掛人員
    if (!settings.showCancelled) {
      patients = patients.filter(p => p.status !== 'H');
    }

    // 2. 隱私保護（遮罩姓名）
    if (settings.privacyMode) {
      patients = patients.map(p => ({
        ...p,
        name: this.maskName(p.name),
        idNumber: '' // 完全隱藏身分證字號
      }));
    }

    // 3. 排序：狀態優先，次序號
    patients = this.sortPatients(patients);

    // 4. 計算統計資訊
    const statistics = this.calculateStatistics(rawData.patients || []);

    return {
      patients,
      statistics,
      timestamp: rawData.timestamp,
      settings
    };
  }

  /**
   * 遮罩姓名（隱私保護）
   * @param {string} name - 姓名
   * @returns {string} 遮罩後的姓名
   */
  maskName(name) {
    if (!name || name.length === 0) {
      return '***';
    }

    // 只顯示第一個字
    return name.charAt(0) + '○○';
  }

  /**
   * 排序病患列表
   * 規則：狀態優先（看診中 → 候診中 → 預約 → 取消 → 完診），次序號
   * @param {Array} patients - 病患陣列
   * @returns {Array} 排序後的病患陣列
   */
  sortPatients(patients) {
    // 狀態優先級
    const statusPriority = {
      '1': 1,  // 看診中（最優先）
      '0': 2,  // 候診中
      'E': 3,  // 預約未到
      'H': 4,  // 取消/退掛
      'F': 5   // 完診（最後）
    };

    return patients.sort((a, b) => {
      // 先比狀態優先級
      const priorityA = statusPriority[a.status] || 99;
      const priorityB = statusPriority[b.status] || 99;

      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }

      // 狀態相同，比序號（TARTIME）
      const queueA = parseInt(a.queueNumber) || 0;
      const queueB = parseInt(b.queueNumber) || 0;

      return queueA - queueB;
    });
  }

  /**
   * 計算統計資訊
   * @param {Array} allPatients - 所有病患（包含退掛）
   * @returns {Object} 統計資訊
   */
  calculateStatistics(allPatients) {
    // 預約未到：TSTS='E'
    const notArrived = allPatients.filter(p => p.status === 'E').length;

    // 掛號人數：總人數 - 退掛人數
    const total = allPatients.filter(p => p.status !== 'H').length;

    // 完診人數：TSTS='F'
    const completed = allPatients.filter(p => p.status === 'F').length;

    // 待診人數：除了 E, F, H 以外的所有狀態
    const waiting = allPatients.filter(p => {
      return p.status !== 'E' && p.status !== 'F' && p.status !== 'H';
    }).length;

    return {
      notArrived,  // 預約未到
      total,       // 掛號人數
      completed,   // 完診人數
      waiting      // 待診人數
    };
  }

  /**
   * 取得當前連接數
   * @returns {number} 連接的客戶端數量
   */
  getConnectedCount() {
    return this.connectedClients.size;
  }
}

module.exports = SocketService;
