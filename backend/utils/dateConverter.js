/**
 * 民國年日期轉換工具
 * 處理民國年與西元年的轉換，以及年齡計算
 */

/**
 * 民國年轉西元年
 * @param {string} rocDate - 民國年日期 YYYMMDD (例: 1141210 = 民國114年12月10日)
 * @returns {Date} JavaScript Date 物件
 * @throws {Error} 如果日期格式無效
 */
function rocToAd(rocDate) {
  if (!rocDate || typeof rocDate !== 'string') {
    throw new Error(`Invalid ROC date: ${rocDate}`);
  }

  // 移除空白並檢查長度
  const dateStr = rocDate.trim();
  if (dateStr.length !== 7) {
    throw new Error(`Invalid ROC date format: ${rocDate}. Expected 7 digits (YYYMMDD)`);
  }

  // 解析民國年、月、日
  const rocYear = parseInt(dateStr.substring(0, 3), 10);
  const month = parseInt(dateStr.substring(3, 5), 10);
  const day = parseInt(dateStr.substring(5, 7), 10);

  // 基本驗證
  if (isNaN(rocYear) || isNaN(month) || isNaN(day)) {
    throw new Error(`Invalid date values in: ${rocDate}`);
  }

  // 轉換為西元年
  const adYear = rocYear + 1911;

  // 建立 Date 物件（month 從 0 開始）
  const date = new Date(adYear, month - 1, day);

  // 驗證日期有效性（處理如 2 月 30 日等無效日期）
  if (
    date.getFullYear() !== adYear ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    throw new Error(`Invalid date: ${rocDate} (Year: ${adYear}, Month: ${month}, Day: ${day})`);
  }

  return date;
}

/**
 * 計算年齡
 * @param {string} birthRocDate - 生日（民國年 YYYMMDD）
 * @returns {number|null} 年齡，如果無效則返回 null
 */
function calculateAge(birthRocDate) {
  if (!birthRocDate || typeof birthRocDate !== 'string') {
    return null;
  }

  const trimmed = birthRocDate.trim();
  if (trimmed === '' || trimmed === '0000000') {
    return null;
  }

  try {
    const birthDate = rocToAd(trimmed);
    const today = new Date();

    // 計算年齡
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    // 未滿週歲需減一
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    // 年齡合理性檢查（0-150 歲）
    if (age < 0 || age > 150) {
      console.warn(`Calculated age ${age} seems invalid for birthdate: ${birthRocDate}`);
      return null;
    }

    return age;
  } catch (error) {
    console.error(`Failed to calculate age for ${birthRocDate}:`, error.message);
    return null;
  }
}

/**
 * 時間格式轉換 HHMMSS → HH:MM
 * @param {string} time - HHMMSS 格式 (例: 140530)
 * @returns {string} HH:MM 格式 (例: 14:05)
 */
function formatTime(time) {
  if (!time || typeof time !== 'string') {
    return '--:--';
  }

  const trimmed = time.trim();
  if (trimmed.length !== 6) {
    return '--:--';
  }

  const hour = trimmed.substring(0, 2);
  const minute = trimmed.substring(2, 4);

  // 驗證時間有效性
  const h = parseInt(hour, 10);
  const m = parseInt(minute, 10);

  if (isNaN(h) || isNaN(m) || h < 0 || h > 23 || m < 0 || m > 59) {
    return '--:--';
  }

  return `${hour}:${minute}`;
}

/**
 * 取得今日民國年日期
 * @returns {string} YYYMMDD 格式
 */
function getTodayROC() {
  const today = new Date();
  const rocYear = today.getFullYear() - 1911;
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');

  return `${String(rocYear).padStart(3, '0')}${month}${day}`;
}

/**
 * 民國年日期轉顯示格式
 * @param {string} rocDate - 民國年日期 YYYMMDD
 * @returns {string} 顯示格式 (例: 114/12/10)
 */
function formatROCDate(rocDate) {
  if (!rocDate || typeof rocDate !== 'string' || rocDate.trim().length !== 7) {
    return '';
  }

  const dateStr = rocDate.trim();
  const year = dateStr.substring(0, 3);
  const month = dateStr.substring(3, 5);
  const day = dateStr.substring(5, 7);

  return `${year}/${month}/${day}`;
}

module.exports = {
  rocToAd,
  calculateAge,
  formatTime,
  getTodayROC,
  formatROCDate
};
