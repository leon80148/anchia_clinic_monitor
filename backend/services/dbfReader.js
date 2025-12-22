/**
 * DBF 檔案讀取服務
 * 讀取 CO05T.DBF（本日門診狀態），處理編碼轉換和資料解析
 */

const fs = require('fs');
const iconv = require('iconv-lite');
const { calculateAge, getTodayROC } = require('../utils/dateConverter');

// 有效的看診狀態代碼
// 1=看診中, A=候診中, 0=保留, E=預約, H=取消, F=完診
const VALID_STATUS_CODES = ['1', 'A', '0', 'E', 'H', 'F'];

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
        TDATE: { offset: 170, length: 7 },     // 掛號看診日期
        TROOM: { offset: 177, length: 4 },     // 掛號看診時間
        TSEC: { offset: 214, length: 1 },      // 時段
        TNAME: { offset: 215, length: 10 },    // 姓名
        TIDNO: { offset: 225, length: 10 },    // 身分證字號
        TBIRTHDT: { offset: 235, length: 7 }   // 生日
      };

      // 取得今日民國年日期
      const todayROC = getTodayROC();
      console.log(`今日日期（民國年）: ${todayROC}`);

      const records = [];

      // 讀取每一筆記錄
      let skippedNotToday = 0;
      let skippedInvalidStatus = 0;

      for (let i = 0; i < recordCount; i++) {
        const recordStart = headerSize + (i * recordSize);
        const recordBuffer = buffer.slice(recordStart, recordStart + recordSize);

        // 跳過已刪除的記錄
        if (recordBuffer[0] === 0x2A) { // '*' 表示已刪除
          continue;
        }

        try {
          const patient = this.parseRecordFromBuffer(recordBuffer, fieldOffsets, todayROC);
          if (patient) {
            if (patient._skipReason === 'not_today') {
              skippedNotToday++;
            } else if (patient._skipReason === 'invalid_status') {
              skippedInvalidStatus++;
            } else {
              records.push(patient);
            }
          }
        } catch (error) {
          console.warn(`解析記錄 ${i + 1} 失敗:`, error.message);
        }
      }

      console.log(`跳過非今日資料: ${skippedNotToday} 筆`);
      console.log(`跳過無效狀態資料: ${skippedInvalidStatus} 筆`);

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
   * @param {string} todayROC - 今日民國年日期（YYYMMDD）
   * @returns {Object|null} 解析後的病患資料
   */
  parseRecordFromBuffer(recordBuffer, fieldOffsets, todayROC) {
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

    // 取得掛號看診日期
    const tdate = getField('TDATE');

    // 篩選：只選擇 TDATE 為今日的資料
    if (tdate !== todayROC) {
      return { _skipReason: 'not_today' };
    }

    // 取得狀態碼
    const rawStatus = getField('TSTS');

    // 篩選：只選擇有效狀態代碼的資料（1=看診中, A=候診中, 0=保留, E=預約, H=取消, F=完診）
    if (!VALID_STATUS_CODES.includes(rawStatus)) {
      return { _skipReason: 'invalid_status' };
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
      status: this.parseStatus(rawStatus),

      // 時段
      session: this.parseSession(getField('TSEC')),

      // 開始看診時間
      beginTime: getField('TBEGTIME'),

      // 完診時間
      completeTime: getField('TENDTIME'),

      // 掛號看診日期
      visitDate: tdate,

      // 掛號看診時間
      visitTime: getField('TROOM'),

      // 原始狀態碼
      _rawStatus: rawStatus
    };
  }


  /**
   * 解析狀態碼
   * @param {string} statusCode - 狀態碼
   * @returns {string} 標準化的狀態碼
   */
  parseStatus(statusCode) {
    // 狀態碼映射
    // 1 → I: 看診中（正在看診）
    // A: 候診中（已報到等待看診）
    // 0: 保留
    // E: 預約（尚未報到）
    // H: 取消（取消掛號）
    // F: 完診（看診完成）

    // 將 DBF 中的 '1' 轉換為前端使用的 'I'
    if (statusCode === '1') {
      return 'I';
    }
    return statusCode || '';
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
