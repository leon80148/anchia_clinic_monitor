/**
 * WebSocket 客戶端封裝
 * 使用 Socket.io-client 連接後端，處理自動重連
 */

import { io } from 'socket.io-client';

class SocketClient {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
    this.url = null;
  }

  /**
   * 連接到 WebSocket 伺服器
   * @param {string} url - 伺服器 URL
   */
  connect(url = 'http://localhost:3001') {
    this.url = url;

    console.log(`正在連接到 WebSocket 伺服器: ${url}`);

    this.socket = io(url, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: this.maxReconnectAttempts,
      timeout: 10000,
      transports: ['websocket', 'polling']
    });

    // 連接成功
    this.socket.on('connect', () => {
      console.log('✓ WebSocket 已連接');
      this.reconnectAttempts = 0;
      this.emit('connectionStatus', { connected: true, error: null });
    });

    // 斷線
    this.socket.on('disconnect', (reason) => {
      console.log('✗ WebSocket 斷線:', reason);
      this.emit('connectionStatus', { connected: false, reason });
    });

    // 重連嘗試
    this.socket.on('reconnect_attempt', (attemptNumber) => {
      console.log(`→ 重連嘗試 ${attemptNumber}/${this.maxReconnectAttempts}`);
      this.reconnectAttempts = attemptNumber;
      this.emit('reconnecting', { attempt: attemptNumber, max: this.maxReconnectAttempts });
    });

    // 重連成功
    this.socket.on('reconnect', (attemptNumber) => {
      console.log(`✓ 重連成功（嘗試 ${attemptNumber} 次）`);
    });

    // 重連失敗
    this.socket.on('reconnect_failed', () => {
      console.error('✗ 重連失敗，已達最大嘗試次數');
      this.emit('connectionError', {
        message: '無法連接到伺服器，請檢查網路連線或聯絡系統管理員'
      });
    });

    // 連接錯誤
    this.socket.on('connect_error', (error) => {
      console.error('✗ 連接錯誤:', error.message);
    });

    // 監聽伺服器資料推送
    this.socket.on('clinicData', (data) => {
      // console.log('← 收到候診資料');
      this.emit('clinicData', data);
    });

    // 監聽伺服器錯誤
    this.socket.on('error', (error) => {
      console.error('✗ 伺服器錯誤:', error);
      this.emit('serverError', error);
    });

    return this;
  }

  /**
   * 監聽事件
   * @param {string} event - 事件名稱
   * @param {Function} callback - 回調函數
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  /**
   * 移除事件監聽
   * @param {string} event - 事件名稱
   * @param {Function} callback - 回調函數
   */
  off(event, callback) {
    if (!this.listeners.has(event)) return;

    const callbacks = this.listeners.get(event);
    const index = callbacks.indexOf(callback);
    if (index > -1) {
      callbacks.splice(index, 1);
    }
  }

  /**
   * 觸發事件（內部使用）
   * @param {string} event - 事件名稱
   * @param {any} data - 資料
   */
  emit(event, data) {
    const callbacks = this.listeners.get(event) || [];
    callbacks.forEach(cb => {
      try {
        cb(data);
      } catch (error) {
        console.error(`事件處理錯誤 (${event}):`, error);
      }
    });
  }

  /**
   * 更新設定
   * @param {Object} settings - 設定物件 { showCancelled, privacyMode }
   */
  updateSettings(settings) {
    if (this.socket && this.socket.connected) {
      console.log('→ 更新設定:', settings);
      this.socket.emit('updateSettings', settings);
    } else {
      console.warn('✗ 未連接，無法更新設定');
    }
  }

  /**
   * 請求重新載入資料
   */
  requestData() {
    if (this.socket && this.socket.connected) {
      console.log('→ 請求重新載入資料');
      this.socket.emit('requestData');
    } else {
      console.warn('✗ 未連接，無法請求資料');
    }
  }

  /**
   * 斷開連接
   */
  disconnect() {
    if (this.socket) {
      console.log('→ 斷開 WebSocket 連接');
      this.socket.disconnect();
      this.socket = null;
    }
  }

  /**
   * 檢查連接狀態
   * @returns {boolean} 是否已連接
   */
  isConnected() {
    return this.socket && this.socket.connected;
  }
}

// 建立單例
const socketClient = new SocketClient();

export default socketClient;
