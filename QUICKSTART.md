# 快速開始指南

## 步驟 1：建立測試資料目錄

```powershell
# 在專案根目錄建立 data 資料夾
mkdir data

# 將您的 CO05T.DBF 檔案複製到 data 目錄
# 或建立符號連結指向實際的 DBF 檔案位置
```

## 步驟 2：安裝後端依賴

```powershell
cd backend

# 複製環境變數範例檔案
Copy-Item .env.example .env

# 編輯 .env 檔案，修改 DBF 檔案路徑
# DBF_FILE_PATH=D:\programing\github\anchia_clinic_monitor\data\CO05T.DBF

# 安裝依賴
npm install

# 如果遇到網路問題，可以嘗試：
# npm install --registry https://registry.npmmirror.com
```

## 步驟 3：安裝前端依賴

```powershell
cd ..\frontend

# 複製環境變數範例檔案
Copy-Item .env.example .env

# 安裝依賴
npm install

# 如果遇到網路問題，可以嘗試：
# npm install --registry https://registry.npmmirror.com
```

## 步驟 4：啟動後端服務

```powershell
cd ..\backend

# 啟動開發服務器
npm run dev
```

## 步驟 5：啟動前端服務（新開終端）

```powershell
cd frontend

# 啟動開發服務器
npm run dev
```

## 步驟 6：存取系統

開啟瀏覽器，前往：http://localhost:5173

## 疑難排解

### 問題 1：找不到 .env.example

確保您在正確的目錄中執行指令：
- 後端：`D:\programing\github\anchia_clinic_monitor\backend`
- 前端：`D:\programing\github\anchia_clinic_monitor\frontend`

### 問題 2：npm install 失敗

嘗試以下解決方案：

```powershell
# 清除 npm 快取
npm cache clean --force

# 刪除 node_modules 和 package-lock.json
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json

# 重新安裝
npm install
```

### 問題 3：找不到 DBF 檔案

編輯 `backend/.env` 檔案，確保 DBF_FILE_PATH 指向正確的檔案路徑：

```env
# 絕對路徑
DBF_FILE_PATH=D:\programing\github\anchia_clinic_monitor\data\CO05T.DBF

# 或您實際的 DBF 檔案位置
DBF_FILE_PATH=C:\clinic\data\CO05T.DBF
```

### 問題 4：Port 已被佔用

如果 3001 或 5173 埠被佔用，可以修改設定：

**後端** (`backend/.env`)：
```env
PORT=3002
```

**前端** (`frontend/vite.config.js`)：
```js
server: {
  port: 5174,  // 改為其他埠號
  ...
}
```

## 測試 DBF 檔案（可選）

如果您沒有真實的 DBF 檔案，可以暫時使用空檔案測試系統啟動：

```powershell
# 建立空的測試檔案
New-Item -ItemType File -Path .\data\CO05T.DBF -Force
```

注意：空檔案無法顯示資料，僅用於測試系統是否能正常啟動。
