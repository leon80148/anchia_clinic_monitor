/**
 * DBF 檔案監控服務
 * 使用 chokidar 監控 DBF 檔案變更，觸發資料更新
 */

const chokidar = require('chokidar');
const EventEmitter = require('events');
const fs = require('fs');

class DBFWatcher extends EventEmitter {
  constructor(filePath, options = {}) {
    super();

    this.filePath = filePath;
    this.watchInterval = options.interval || 3000; // 預設 3 秒
    this.watcher = null;
    this.debounceTimer = null;
    this.isWatching = false;
  }

  /**
   * 開始監控檔案
   */
  start() {
    // 檢查檔案是否存在
    if (!fs.existsSync(this.filePath)) {
      const error = new Error(`DBF 檔案不存在: ${this.filePath}`);
      console.error(error.message);
      this.emit('error', error);
      return;
    }

    console.log(`開始監控檔案: ${this.filePath}`);
    console.log(`監控間隔: ${this.watchInterval}ms`);

    this.watcher = chokidar.watch(this.filePath, {
      persistent: true,
      usePolling: true, // Windows 環境建議使用 polling
      interval: this.watchInterval,
      awaitWriteFinish: {
        stabilityThreshold: 500, // 檔案穩定後 500ms 才觸發
        pollInterval: 100
      },
      ignoreInitial: false // 初始時也觸發一次
    });

    // 檔案變更事件
    this.watcher.on('change', (path) => {
      console.log(`檔案變更偵測: ${path}`);
      this.debounceRead();
    });

    // 檔案新增事件（初始讀取）
    this.watcher.on('add', (path) => {
      console.log(`檔案初始讀取: ${path}`);
      this.debounceRead();
    });

    // 錯誤事件
    this.watcher.on('error', (error) => {
      console.error('檔案監控錯誤:', error);
      this.emit('error', error);
    });

    // 就緒事件
    this.watcher.on('ready', () => {
      console.log('檔案監控就緒');
      this.isWatching = true;
      this.emit('ready');
    });
  }

  /**
   * 防抖讀取：避免短時間內多次觸發
   */
  debounceRead() {
    // 清除之前的計時器
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    // 設定新的計時器（500ms 後觸發）
    this.debounceTimer = setTimeout(() => {
      console.log('觸發資料重新讀取事件');
      this.emit('fileChanged');
      this.debounceTimer = null;
    }, 500);
  }

  /**
   * 停止監控
   */
  stop() {
    if (this.watcher) {
      this.watcher.close();
      console.log('檔案監控已停止');
      this.isWatching = false;
      this.emit('stopped');
    }

    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
  }

  /**
   * 檢查監控狀態
   * @returns {boolean} 是否正在監控
   */
  isActive() {
    return this.isWatching;
  }

  /**
   * 手動觸發檔案變更事件（用於測試）
   */
  triggerChange() {
    console.log('手動觸發檔案變更事件');
    this.emit('fileChanged');
  }
}

module.exports = DBFWatcher;
