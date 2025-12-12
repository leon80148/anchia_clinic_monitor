# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 專案概述

安家診所候診狀態監控系統 - 即時顯示診所候診狀態的 Web 監控系統。透過監控 DBF 檔案變化，使用 WebSocket 推送即時候診資料。

## 常用指令

### 開發環境

```bash
# 後端（Express + Socket.io）
cd backend
npm install
npm run dev          # 使用 nodemon 熱重載

# 前端（React + Vite）
cd frontend
npm install
npm run dev          # Vite 開發伺服器 http://localhost:5173
npm run build        # 建置生產版本
```

### Docker 部署

```bash
docker-compose up -d          # 啟動服務
docker-compose logs -f        # 查看日誌
docker-compose down           # 停止服務
```

## 架構說明

### 資料流

```
DBF 檔案 (CO05T.DBF)
    ↓ chokidar 監控
DBFWatcher (backend/services/dbfWatcher.js)
    ↓ 檔案變更事件
DBFReader (backend/services/dbfReader.js)
    ↓ 解析 Big5 編碼 DBF
SocketService (backend/services/socketService.js)
    ↓ WebSocket 廣播
React 前端 (Zustand Store)
    ↓ 狀態更新
PatientTable 元件顯示
```

### 後端架構

- `server.js` - Express 主程式，整合 Socket.io 和檔案監控
- `services/dbfReader.js` - 手動解析 DBF 檔案（使用 iconv-lite 處理 Big5 編碼）
- `services/dbfWatcher.js` - 使用 chokidar 監控檔案變化（Windows 輪詢模式）
- `services/socketService.js` - WebSocket 連線管理與資料廣播
- `utils/dateConverter.js` - 民國年轉西元年、年齡計算

### 前端架構

- `store/useClinicStore.js` - Zustand 全域狀態管理
- `services/socketClient.js` - Socket.io 客戶端封裝
- `components/` - React 元件
  - `PatientTable.jsx` - 候診列表（含狀態排序）
  - `StatisticsPanel.jsx` - 統計面板
  - `SessionFilter.jsx` - 時段篩選（早/午/晚）
  - `SettingsPanel.jsx` - 設定面板（隱私模式等）

### 資料格式

DBF 檔案使用民國年 7 位格式 `YYYMMDD`（如 `1141212` = 2025-12-12）。

**重要欄位**：
- `TDATE` = 掛號看診日期（用於篩選今日資料）
- `TROOM` = 掛號看診時間（HHMM 格式）
- `TBKDT` = 掛號資料最新儲存日期（非看診日期）
- `TBKTIME` = 掛號資料最新儲存時間（非看診時間）

**看診狀態代碼（TSTS）**：
- `I` = 看診中（正在看診）
- `A` = 候診中（已報到等待看診）
- `0` = 保留
- `E` = 預約（尚未報到）
- `H` = 取消（取消掛號）
- `F` = 完診（看診完成）
- 其他值 = 資料錯誤，不顯示

**資料篩選規則**：
1. 只顯示 `TDATE` 為今日的資料
2. 只顯示有效狀態代碼（I, A, 0, E, H, F）的資料

身分別代碼：
- `A` = 健保
- `9` = 其他
- 空白 = 自費

## 環境變數

後端 `.env`：
```
DBF_FILE_PATH=C:\path\to\CO05T.DBF
WATCH_INTERVAL=2000
PORT=3001
CORS_ORIGIN=http://localhost:5173
```

前端 `.env`：
```
VITE_SERVER_URL=http://localhost:3001
```

## 注意事項

- DBF 檔案使用 Big5 編碼，需使用 iconv-lite 轉換
- Windows 環境下 chokidar 需使用輪詢模式 (`usePolling: true`)
- 前端在生產環境會自動使用 `window.location.origin` 連接 WebSocket
- Docker 部署時只需修改 `docker-compose.yml` 的 port 映射，前端會自動適應
