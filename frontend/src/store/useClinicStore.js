/**
 * 診所狀態管理 Store
 * 使用 Zustand 管理全域狀態
 */

import { create } from 'zustand';

const useClinicStore = create((set) => ({
  // 病患列表
  patients: [],

  // 統計資訊
  statistics: {
    notArrived: 0,  // 預約未到
    total: 0,       // 掛號人數
    waiting: 0,     // 待診人數
    completed: 0    // 完診人數
  },

  // 設定
  settings: {
    showCancelled: false,  // 顯示退掛人員
    showScheduled: true,   // 顯示預約病患
    privacyMode: false     // 隱私保護模式
  },

  // 時段篩選（早、午、晚、全部）
  selectedSession: null,  // null 表示尚未初始化，將根據當前時間自動設定

  // 連線狀態
  connectionStatus: {
    connected: false,
    lastUpdate: null,
    error: null,
    reconnecting: false,
    reconnectAttempt: 0
  },

  /**
   * 更新候診資料
   * @param {Object} data - 從伺服器接收的資料
   */
  updateData: (data) => set((state) => ({
    patients: data.patients || [],
    statistics: data.statistics || state.statistics,
    connectionStatus: {
      ...state.connectionStatus,
      connected: true,
      lastUpdate: new Date(data.timestamp || Date.now()),
      error: null,
      reconnecting: false
    }
  })),

  /**
   * 更新設定
   * @param {Object} settings - 新設定
   */
  updateSettings: (settings) => set((state) => {
    const newSettings = { ...state.settings, ...settings };

    // 儲存到 localStorage
    try {
      localStorage.setItem('clinicSettings', JSON.stringify(newSettings));
    } catch (error) {
      console.warn('無法儲存設定到 localStorage:', error);
    }

    return { settings: newSettings };
  }),

  /**
   * 從 localStorage 載入設定
   */
  loadSettings: () => set((state) => {
    try {
      const saved = localStorage.getItem('clinicSettings');
      if (saved) {
        const settings = JSON.parse(saved);
        return { settings: { ...state.settings, ...settings } };
      }
    } catch (error) {
      console.warn('無法從 localStorage 載入設定:', error);
    }
    return {};
  }),

  /**
   * 更新連線狀態
   * @param {Object} status - 連線狀態
   */
  updateConnectionStatus: (status) => set((state) => ({
    connectionStatus: {
      ...state.connectionStatus,
      ...status
    }
  })),

  /**
   * 設定重連狀態
   * @param {Object} reconnectInfo - 重連資訊 { attempt, max }
   */
  setReconnecting: (reconnectInfo) => set((state) => ({
    connectionStatus: {
      ...state.connectionStatus,
      reconnecting: true,
      reconnectAttempt: reconnectInfo.attempt || 0
    }
  })),

  /**
   * 設定錯誤狀態
   * @param {string} error - 錯誤訊息
   */
  setError: (error) => set((state) => ({
    connectionStatus: {
      ...state.connectionStatus,
      error,
      connected: false
    }
  })),

  /**
   * 設定時段篩選
   * @param {string} session - 時段 ('早', '午', '晚', '全部')
   */
  setSelectedSession: (session) => set({ selectedSession: session }),

  /**
   * 重置狀態
   */
  reset: () => set({
    patients: [],
    statistics: {
      notArrived: 0,
      total: 0,
      waiting: 0,
      completed: 0
    },
    connectionStatus: {
      connected: false,
      lastUpdate: null,
      error: null,
      reconnecting: false,
      reconnectAttempt: 0
    }
  })
}));

export default useClinicStore;
