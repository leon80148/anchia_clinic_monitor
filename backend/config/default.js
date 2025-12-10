/**
 * 預設配置
 */

require('dotenv').config();

module.exports = {
  // DBF 檔案路徑
  dbfFilePath: process.env.DBF_FILE_PATH || 'D:/programing/github/anchia_clinic_monitor/data/CO05T.DBF',

  // 檔案監控間隔（毫秒）
  watchInterval: parseInt(process.env.WATCH_INTERVAL) || 3000,

  // 伺服器埠號
  port: parseInt(process.env.PORT) || 3001,

  // CORS 設定
  corsOrigin: process.env.CORS_ORIGIN || '*',

  // Node 環境
  nodeEnv: process.env.NODE_ENV || 'development',

  // 預設設定
  defaults: {
    privacyMode: process.env.DEFAULT_PRIVACY_MODE === 'true',
    showCancelled: process.env.DEFAULT_SHOW_CANCELLED === 'true'
  }
};
