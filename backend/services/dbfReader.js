/**
 * DBF 檔案讀取服務
 * 讀取 CO05T.DBF（本日門診狀態），處理編碼轉換和資料解析
 */

const fs = require('fs');
const iconv = require('iconv-lite');
const { calculateAge } = require('../utils/dateConverter');

class DBFReader {
  constructor(filePath) {
    this.filePath = filePath;
    this.cache = null;
    this.cacheTime = null;
    this.cacheDuration = 2000; // 2 秒快取
  }

  /**
   * 讀取 DBF 檔案並返回處理後的資料
   * @returns {Promise<Object>} 包含 patients 陣列的物件
   */
  async getData() {
    const now = Date.now();

    // 檢查快取
    if (this.cache && this.cacheTime && (now - this.cacheTime < this.cacheDuration)) {
      console.log('使用快取資料');
      return this.cache;
    }

    try {
      const patients = await this.readDBF();
      const data = { patients, timestamp: new Date().toISOString() };

      // 更新快取
      this.cache = data;
      this.cacheTime = now;

      return data;
    } catch (error) {
      console.error('讀取 DBF 檔案失敗:', error.message);
      throw error;
    }
  }

  /**
   * 讀取並解析 DBF 檔案
   * @returns {Promise<Array>} 病患資料陣列
   */
  async readDBF() {
    try {
      // 讀取整個 DBF 檔案
      const buffer = fs.readFileSync(this.filePath);

      // 解析 DBF 頭部
      const recordCount = buffer.readUInt32LE(4);
      const headerSize = buffer.readUInt16LE(8);
      const recordSize = buffer.readUInt16LE(10);

      console.log(`開始讀取 DBF 檔案: ${this.filePath}`);
      console.log(`記錄數: ${recordCount}, 記錄大小: ${recordSize} bytes`);

      // 定義欄位偏移量（根據 CO05T.DBF 結構）
      // 注意：記錄的第一個 byte (offset 0) 是刪除標記，實際資料從 offset 1 開始
      const fieldOffsets = {
        KCSTMR: { offset: 1, length: 7 },      // 病歷號
        TSTS: { offset: 30, length: 1 },       // 狀態
        LM: { offset: 31, length: 1 },         // 身分別
        TARTIME: { offset: 98, length: 8 },    // 看診號碼
        TBEGTIME: { offset: 106, length: 6 },  // 開始看診時間
        TENDTIME: { offset: 112, length: 6 },  // 完診時間
        TSEC: { offset: 214, length: 1 },      // 時段
        TNAME: { offset: 215, length: 10 },    // 姓名
        TIDNO: { offset: 225, length: 10 },    // 身分證字號
        TBIRTHDT: { offset: 235, length: 7 }   // 生日
      };

      const records = [];

      // 讀取每一筆記錄
      for (let i = 0; i < recordCount; i++) {
        const recordStart = headerSize + (i * recordSize);
        const recordBuffer = buffer.slice(recordStart, recordStart + recordSize);

        // 跳過已刪除的記錄
        if (recordBuffer[0] === 0x2A) { // '*' 表示已刪除
          continue;
        }

        try {
          const patient = this.parseRecordFromBuffer(recordBuffer, fieldOffsets);
          if (patient) {
            records.push(patient);
          }
        } catch (error) {
          console.warn(`解析記錄 ${i + 1} 失敗:`, error.message);
        }
      }

      console.log(`DBF 讀取完成，共 ${records.length} 筆記錄`);
      return records;

    } catch (error) {
      console.error('讀取 DBF 檔案失敗:', error.message);
      throw error;
    }
  }

  /**
   * 從 Buffer 解析單筆記錄
   * @param {Buffer} recordBuffer - 記錄的 Buffer
   * @param {Object} fieldOffsets - 欄位偏移量定義
   * @returns {Object|null} 解析後的病患資料
   */
  parseRecordFromBuffer(recordBuffer, fieldOffsets) {
    // 讀取並解碼欄位
    const getField = (name) => {
      const field = fieldOffsets[name];
      if (!field) return '';
      const raw = recordBuffer.slice(field.offset, field.offset + field.length);
      return iconv.decode(raw, 'big5').trim();
    };

    const name = getField('TNAME');

    // 跳過空記錄
    if (!name || name.trim() === '') {
      return null;
    }

    return {
      // 病歷號
      patientId: getField('KCSTMR'),

      // 序號（看診號碼）
      queueNumber: getField('TARTIME'),

      // 姓名
      name: name,

      // 年齡
      age: calculateAge(getField('TBIRTHDT')),

      // 生日（原始民國年格式）
      birthDate: getField('TBIRTHDT'),

      // 身分證字號
      idNumber: getField('TIDNO'),

      // 身分別
      identity: this.parseIdentity(getField('LM')),

      // 狀態
      status: this.parseStatus(getField('TSTS')),

      // 時段
      session: this.parseSession(getField('TSEC')),

      // 開始看診時間
      beginTime: getField('TBEGTIME'),

      // 完診時間
      completeTime: getField('TENDTIME'),

      // 原始狀態碼
      _rawStatus: getField('TSTS')
    };
  }


  /**
   * 解析狀態碼
   * @param {string} statusCode - 狀態碼
   * @returns {string} 標準化的狀態碼
   */
  parseStatus(statusCode) {
    if (!statusCode) return '0';

    const code = statusCode.trim();

    // 狀態碼映射
    // 1: 看診中
    // 0: 候診中（已報到等待看診）
    // E: 預約未到
    // H: 取消/退掛
    // F: 完診

    return code || '0';
  }

  /**
   * 解析身分別
   * @param {string} identityCode - 身分別代碼
   * @returns {string} 身分別名稱
   */
  parseIdentity(identityCode) {
    if (!identityCode) return '自費';

    const code = identityCode.trim();

    const identityMap = {
      'A': '健保',
      '9': '其他',
      '': '自費'
    };

    return identityMap[code] || '其他';
  }

  /**
   * 解析時段
   * @param {string} sessionCode - 時段代碼
   * @returns {string} 時段名稱
   */
  parseSession(sessionCode) {
    if (!sessionCode) return '';

    const code = sessionCode.trim();

    // 時段映射（根據實際診所設定）
    const sessionMap = {
      'S': '早',
      'T': '午',
      'U': '晚'
    };

    return sessionMap[code] || code;
  }

  /**
   * 清除快取
   */
  clearCache() {
    this.cache = null;
    this.cacheTime = null;
    console.log('快取已清除');
  }
}

module.exports = DBFReader;
