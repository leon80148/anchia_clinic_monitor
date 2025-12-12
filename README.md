# 安家診所候診狀態監控系統

> 即時顯示診所候診狀態的 Web 監控系統

## 📋 專案簡介

本系統透過監控 DBF 檔案變化，即時顯示診所候診狀態，提供診所工作人員和藥局快速查看候診資訊的介面。系統支援隱私保護模式，可在公開場合使用。

### 主要功能

- ✅ **即時資料更新** - 透過 WebSocket 自動推送最新候診資料
- 📊 **統計資訊** - 顯示預約未到、掛號人數、待診人數、完診人數（可依時段篩選）
- ⏰ **時段篩選** - 支援早診/午診/晚診/全部時段切換，自動依當前時間選擇
- 📋 **完整病患資訊** - 顯示姓名、年齡、生日、完診時間、時段等資訊
- 🔒 **隱私保護模式** - 姓名遮罩顯示（例：王○○），自動隱藏生日欄位
- ⚙️ **彈性設定** - 可切換顯示預約病患、退掛人員
- 🎨 **綠色主題** - 舒適的醫療風格介面設計
- 📱 **響應式設計** - 支援桌面、平板、手機瀏覽
- 🐳 **Docker 一鍵部署** - 簡化安裝流程

## 🏗️ 技術架構

### 前端
- **React 18** - 使用 Vite 建置的現代化前端框架
- **Ant Design** - 企業級 UI 元件庫（綠色主題）
- **Zustand** - 輕量化狀態管理
- **Socket.io-client** - WebSocket 客戶端

### 後端
- **Node.js + Express** - RESTful API 服務
- **Socket.io** - WebSocket 即時通訊
- **fs + iconv-lite** - 手動 DBF 檔案解析（Big5 編碼完美支援）
- **chokidar** - 檔案監控（支援 Windows 輪詢模式）
- **ROC 日期轉換** - 民國年轉西元年、年齡計算

### 部署
- **Docker + Docker Compose** - 容器化部署
- **Multi-stage builds** - 優化映像大小

## 🚀 快速開始

### 使用 Docker Compose（推薦）

1. **複製專案**
   ```bash
   git clone <repository-url>
   cd anchia_clinic_monitor
   ```

2. **修改 docker-compose.yml**
   ```yaml
   volumes:
     - C:\your\dbf\path:/data:ro  # 修改為您的 DBF 檔案目錄
   ```

3. **啟動服務**
   ```bash
   docker-compose up -d
   ```

4. **存取系統**
   - 開啟瀏覽器：http://localhost:3001
   - 或從區域網路其他裝置存取：http://<伺服器IP>:3001

詳細部署說明請參閱 [DEPLOYMENT.md](DEPLOYMENT.md)

## 💻 本地開發

### 環境需求
- Node.js 18+
- npm 或 yarn

### 安裝步驟

1. **安裝後端依賴**
   ```bash
   cd backend
   npm install
   ```

2. **安裝前端依賴**
   ```bash
   cd frontend
   npm install
   ```

3. **設定環境變數**

   複製 `backend/.env.example` 為 `backend/.env`，並修改設定：
   ```env
   DBF_FILE_PATH=C:\path\to\CO05T.DBF
   WATCH_INTERVAL=2000
   PORT=3001
   NODE_ENV=development
   CORS_ORIGIN=http://localhost:5173
   ```

4. **啟動後端服務**
   ```bash
   cd backend
   npm run dev
   ```

5. **啟動前端服務**（另開終端）
   ```bash
   cd frontend
   npm run dev
   ```

6. **存取開發環境**
   - 前端：http://localhost:5173
   - 後端 API：http://localhost:3001

## 🔧 環境變數說明

| 變數名稱 | 說明 | 預設值 | 範例 |
|---------|------|--------|------|
| `DBF_FILE_PATH` | DBF 檔案完整路徑 | - | `C:\clinic\CO05T.DBF` |
| `WATCH_INTERVAL` | 檔案監控間隔（毫秒） | `2000` | `2000` |
| `PORT` | 後端服務埠號 | `3001` | `3001` |
| `NODE_ENV` | 執行環境 | `production` | `development`/`production` |
| `CORS_ORIGIN` | 允許的跨域來源 | `*` | `http://localhost:5173` |

## 📦 專案結構

```
anchia_clinic_monitor/
├── backend/                 # 後端服務
│   ├── config/             # 配置檔
│   ├── services/           # 核心服務
│   │   ├── dbfReader.js    # DBF 檔案讀取
│   │   ├── dbfWatcher.js   # 檔案監控
│   │   └── socketService.js # WebSocket 服務
│   ├── utils/              # 工具函數
│   │   └── dateConverter.js # 民國年轉換
│   ├── server.js           # 主程式
│   └── package.json
├── frontend/               # 前端應用
│   ├── src/
│   │   ├── components/     # React 元件
│   │   ├── services/       # 服務層
│   │   ├── store/          # 狀態管理
│   │   ├── App.jsx         # 主元件
│   │   └── main.jsx        # 進入點
│   └── package.json
├── docker-compose.yml      # Docker Compose 配置
├── Dockerfile              # Docker 映像建置
└── README.md
```

## 🎯 使用說明

### 時段篩選

系統會根據當前時間自動選擇時段：
- **早診（早）**：08:00-12:00
- **午診（午）**：12:00-18:00
- **晚診（晚）**：18:00-24:00
- **全部**：00:00-08:00 或手動選擇

統計數字會根據選擇的時段動態更新。

### 顯示設定

- **顯示預約病患**：勾選後會顯示已預約但尚未報到的病患（預設顯示）
- **顯示退掛人員**：勾選後會顯示已退掛的病患（預設不顯示）
- **隱私保護模式**：啟用後姓名顯示為「王○○」格式，並隱藏生日欄位，適合公開場合使用

### 候診狀態說明

| 狀態 | 代碼 | 顏色 | 排序優先級 | 說明 |
|-----|------|------|-----------|------|
| 看診中 | I | 藍色底 | 1（最高） | 目前正在看診的病患 |
| 保留 | 0 | - | 2 | 保留中 |
| 候診中 | A | 黃色底 | 3 | 已報到等待看診 |
| 預約未到 | E | - | 4 | 已預約但尚未報到 |
| 已取消 | H | 灰色刪除線 | 5 | 已取消掛號 |
| 已完診 | F | 綠色 | 6（最低） | 看診完成 |

### 顯示欄位

- **序號**：掛號順序
- **姓名**：病患姓名（隱私模式下僅顯示首字）
- **生日**：民國年轉西元年顯示（YYYY/MM/DD）
- **年齡**：由生日自動計算
- **身分**：健保/自費/其他
- **狀態**：目前看診狀態
- **完診時間**：完成看診的時間（HH:MM:SS）
- **時段**：早/午/晚

## ❓ 常見問題

### 1. DBF 檔案路徑如何設定？

**Windows 範例**：
```yaml
volumes:
  - C:\clinic_data:/data:ro
```

**Linux 範例**：
```yaml
volumes:
  - /home/user/clinic_data:/data:ro
```

### 2. 如何修改監控埠號？

修改 `docker-compose.yml` 中的 port 映射（只需修改左邊的主機端口）：
```yaml
ports:
  - "7777:3001"  # 改為 7777 端口，通過 http://localhost:7777 訪問
```

**說明：**
- 格式：`"主機端口:容器端口"`
- 只修改左邊的數字即可
- **不需要修改任何環境變數或前端配置**
- 前端會自動檢測並連接到正確的端口

### 3. 資料沒有自動更新？

1. 檢查 DBF 檔案路徑是否正確
2. 確認容器有讀取檔案的權限
3. 查看容器日誌：`docker-compose logs -f`

### 4. 如何停止服務？

```bash
docker-compose down
```

### 5. 如何查看容器狀態？

```bash
docker-compose ps
docker-compose logs -f clinic-monitor
```

## 📝 授權

本專案僅供內部使用，未經授權不得複製、散布或修改。

## 🔗 相關資源

- [Docker 官方文件](https://docs.docker.com/)
- [React 官方文件](https://react.dev/)
- [Ant Design 文件](https://ant.design/)
- [Socket.io 文件](https://socket.io/)

## 📧 聯絡資訊

如有問題或建議，請聯絡系統管理員。

---

**版本**: v1.0.0
**最後更新**: 2025-12-10

## 🎉 功能特色

### v1.0.0 (2025-12-10)
- ✅ 完整的即時候診監控系統
- ✅ 時段篩選功能（早/午/晚診自動切換）
- ✅ 動態統計數字（依時段計算）
- ✅ 完診時間顯示
- ✅ 生日欄位與年齡計算
- ✅ 三種顯示模式（預約/取消/隱私）
- ✅ WebSocket 連線優化（防止斷線）
- ✅ React.memo + useMemo 性能優化
- ✅ Docker 容器化部署（145MB）
- ✅ 手動 DBF 解析（Big5 編碼完美支援）
