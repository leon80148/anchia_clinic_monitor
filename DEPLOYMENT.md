# 部署指南

本文件詳細說明如何將「安家診所候診狀態監控系統」部署到生產環境。

## 📋 目錄

- [部署前準備](#部署前準備)
- [方式一：Docker Compose 部署（推薦）](#方式一docker-compose-部署推薦)
- [方式二：手動部署](#方式二手動部署)
- [部署後驗證](#部署後驗證)
- [維護與監控](#維護與監控)
- [故障排除](#故障排除)

---

## 部署前準備

### 系統需求

#### 硬體需求
- **CPU**: 2 核心或以上
- **記憶體**: 2GB 或以上
- **硬碟空間**: 至少 1GB 可用空間
- **網路**: 區域網路連線

#### 軟體需求
- **作業系統**:
  - Windows Server 2019+ / Windows 10+
  - Ubuntu 20.04+ / CentOS 8+
- **Docker**: 20.10+ 和 Docker Compose 1.29+（Docker 部署時）
- **Node.js**: 18.x+（手動部署時）

### 前置作業

1. **確認 DBF 檔案位置**
   - 找到 CO05T.DBF 檔案的完整路徑
   - 確保系統有讀取該檔案的權限

2. **準備部署環境**
   - 確認伺服器可從診所電腦存取
   - 記錄伺服器 IP 位址
   - 確認防火牆允許 3001 埠（或您自訂的埠號）

---

## 方式一：Docker Compose 部署（推薦）

### 步驟 1：安裝 Docker

#### Windows
1. 下載 [Docker Desktop for Windows](https://www.docker.com/products/docker-desktop)
2. 執行安裝程式並完成安裝
3. 啟動 Docker Desktop
4. 開啟 PowerShell 驗證安裝：
   ```powershell
   docker --version
   docker-compose --version
   ```

#### Linux (Ubuntu)
```bash
# 更新套件列表
sudo apt update

# 安裝 Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# 安裝 Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 將使用者加入 docker 群組
sudo usermod -aG docker $USER

# 驗證安裝
docker --version
docker-compose --version
```

### 步驟 2：取得專案檔案

```bash
# 方式 A：使用 Git（如果已安裝）
git clone <repository-url>
cd anchia_clinic_monitor

# 方式 B：下載 ZIP 並解壓縮
# 下載後解壓縮到任意目錄，例如 C:\clinic\anchia_clinic_monitor
```

### 步驟 3：配置 docker-compose.yml

編輯 `docker-compose.yml` 檔案，修改 volumes 路徑：

**Windows 範例**：
```yaml
volumes:
  - C:\clinic_data\CO05T.DBF:/data/CO05T.DBF:ro
  # 或掛載整個目錄
  # - C:\clinic_data:/data:ro
```

**Linux 範例**：
```yaml
volumes:
  - /opt/clinic_data/CO05T.DBF:/data/CO05T.DBF:ro
  # 或掛載整個目錄
  # - /opt/clinic_data:/data:ro
```

### 步驟 4：建置並啟動容器

#### Windows (PowerShell)
```powershell
# 導航到專案目錄
cd C:\clinic\anchia_clinic_monitor

# 建置映像
docker-compose build

# 啟動服務（背景執行）
docker-compose up -d

# 查看日誌
docker-compose logs -f
```

#### Linux
```bash
# 導航到專案目錄
cd /opt/anchia_clinic_monitor

# 建置映像
docker-compose build

# 啟動服務（背景執行）
docker-compose up -d

# 查看日誌
docker-compose logs -f
```

### 步驟 5：設定開機自動啟動

#### Windows
1. 開啟「工作排程器」
2. 建立基本工作
3. 觸發程序：「電腦啟動時」
4. 動作：「啟動程式」
   - 程式：`docker-compose.exe`
   - 引數：`up -d`
   - 開始於：`C:\clinic\anchia_clinic_monitor`

#### Linux (使用 systemd)
建立服務檔案 `/etc/systemd/system/clinic-monitor.service`：

```ini
[Unit]
Description=Clinic Monitor Service
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/opt/anchia_clinic_monitor
ExecStart=/usr/local/bin/docker-compose up -d
ExecStop=/usr/local/bin/docker-compose down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
```

啟用服務：
```bash
sudo systemctl daemon-reload
sudo systemctl enable clinic-monitor.service
sudo systemctl start clinic-monitor.service
```

---

## 方式二：手動部署

### 步驟 1：安裝 Node.js

#### Windows
1. 下載 [Node.js 18.x LTS](https://nodejs.org/)
2. 執行安裝程式
3. 驗證安裝：
   ```powershell
   node --version
   npm --version
   ```

#### Linux (Ubuntu)
```bash
# 使用 NodeSource 安裝 Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 驗證安裝
node --version
npm --version
```

### 步驟 2：建置前端

```bash
cd frontend

# 安裝依賴
npm ci

# 建置（生成靜態檔案到 dist 目錄）
npm run build

# 複製建置結果到後端 public 目錄
# Windows:
xcopy /E /I /Y dist ..\backend\public

# Linux:
cp -r dist/* ../backend/public/
```

### 步驟 3：安裝後端依賴

```bash
cd backend
npm ci --only=production
```

### 步驟 4：設定環境變數

建立 `backend/.env` 檔案：

```env
NODE_ENV=production
PORT=3001
DBF_FILE_PATH=C:\clinic_data\CO05T.DBF
WATCH_INTERVAL=2000
CORS_ORIGIN=*
```

### 步驟 5：使用 PM2 執行（推薦）

#### 安裝 PM2
```bash
npm install -g pm2
```

#### 啟動應用
```bash
cd backend
pm2 start server.js --name clinic-monitor

# 儲存 PM2 配置
pm2 save

# 設定開機自動啟動
pm2 startup
# 依照提示執行對應的指令
```

#### PM2 常用指令
```bash
pm2 list                    # 列出所有應用
pm2 logs clinic-monitor     # 查看日誌
pm2 restart clinic-monitor  # 重啟應用
pm2 stop clinic-monitor     # 停止應用
pm2 delete clinic-monitor   # 刪除應用
```

---

## 部署後驗證

### 1. 檢查服務狀態

#### Docker 部署
```bash
# 查看容器狀態
docker-compose ps

# 查看健康檢查狀態
docker inspect --format='{{.State.Health.Status}}' anchia-clinic-monitor
```

#### 手動部署
```bash
# 查看 PM2 狀態
pm2 status

# 查看應用日誌
pm2 logs clinic-monitor --lines 50
```

### 2. 測試 API 端點

```bash
# 健康檢查
curl http://localhost:3001/api/health

# 預期回應：
# {
#   "status": "ok",
#   "timestamp": "2024-12-10T...",
#   "dbfPath": "...",
#   "connectedClients": 0
# }
```

### 3. 存取 Web 介面

開啟瀏覽器，前往：
- 本機：http://localhost:3001
- 區域網路：http://\<伺服器IP\>:3001

應該看到候診狀態一覽表介面。

### 4. 測試即時更新

1. 手動修改 DBF 檔案（或等待診所系統更新）
2. 觀察 Web 介面是否自動更新
3. 檢查瀏覽器開發者工具的 Network 分頁，確認 WebSocket 連線正常

---

## 維護與監控

### 日誌管理

#### Docker
```bash
# 查看即時日誌
docker-compose logs -f

# 查看最近 100 行日誌
docker-compose logs --tail=100

# 清理舊日誌（Docker 會自動輪替，見 docker-compose.yml）
```

#### PM2
```bash
# 查看日誌
pm2 logs clinic-monitor

# 清空日誌
pm2 flush

# 輪替日誌
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

### 更新部署

#### Docker
```bash
# 停止容器
docker-compose down

# 拉取最新程式碼
git pull

# 重新建置並啟動
docker-compose build
docker-compose up -d
```

#### 手動部署
```bash
# 停止應用
pm2 stop clinic-monitor

# 更新程式碼
git pull

# 重新建置前端
cd frontend
npm ci
npm run build
cp -r dist/* ../backend/public/

# 更新後端依賴
cd ../backend
npm ci --only=production

# 重啟應用
pm2 restart clinic-monitor
```

### 備份

建議定期備份：
1. **配置檔案**：`.env`, `docker-compose.yml`
2. **專案原始碼**（如有修改）
3. **DBF 檔案**（由診所系統自行備份）

---

## 故障排除

### 問題 1：容器無法啟動

**症狀**：`docker-compose up` 失敗

**解決方案**：
```bash
# 查看詳細錯誤訊息
docker-compose logs

# 檢查 DBF 檔案路徑是否正確
# 檢查 Docker 是否有權限讀取該檔案

# Windows 特別注意：路徑格式
# 正確：C:\clinic_data:/data:ro
# 錯誤：C:/clinic_data:/data:ro
```

### 問題 2：無法讀取 DBF 檔案

**症狀**：日誌顯示「ENOENT: no such file or directory」

**解決方案**：
1. 確認 DBF_FILE_PATH 路徑正確
2. 確認檔案權限（chmod 644 或更寬鬆）
3. 確認 volume 掛載正確
4. 檢查檔案是否存在：
   ```bash
   # Docker
   docker-compose exec clinic-monitor ls -la /data

   # 手動部署
   ls -la /path/to/dbf/file
   ```

### 問題 3：WebSocket 連線失敗

**症狀**：前端顯示「未連線」

**解決方案**：
1. 檢查防火牆是否阻擋 3001 埠
   ```bash
   # Windows
   netsh advfirewall firewall add rule name="Clinic Monitor" dir=in action=allow protocol=TCP localport=3001

   # Linux (Ubuntu)
   sudo ufw allow 3001
   ```

2. 檢查後端是否正常運行
   ```bash
   curl http://localhost:3001/api/health
   ```

3. 檢查瀏覽器主控台錯誤訊息

### 問題 4：資料沒有自動更新

**症狀**：DBF 檔案變更後，介面沒有更新

**解決方案**：
1. 檢查檔案監控是否正常：
   ```bash
   # 查看日誌中是否有「檔案變更」訊息
   docker-compose logs -f | grep "檔案變更"
   ```

2. 調整 WATCH_INTERVAL（減少間隔）
3. Windows 系統確認 polling 模式已啟用（chokidar 配置）

### 問題 5：中文顯示亂碼

**症狀**：病患姓名顯示為亂碼

**解決方案**：
- DBF 編碼問題：確認 `dbfReader.js` 使用 Big5 解碼
- 瀏覽器編碼：確認 HTML meta charset 為 UTF-8

### 問題 6：記憶體不足

**症狀**：容器頻繁重啟或 OOM killed

**解決方案**：
1. 調整 docker-compose.yml 記憶體限制：
   ```yaml
   resources:
     limits:
       memory: 1G  # 增加到 1GB
   ```

2. 檢查是否有記憶體洩漏
3. 定期重啟容器（可設定 cron job）

---

## 安全性建議

1. **網路隔離**
   - 僅在內部網路開放服務
   - 不要將服務暴露到公網

2. **檔案權限**
   - DBF 檔案設為唯讀（:ro）
   - 容器使用非 root 使用者執行

3. **定期更新**
   - 定期更新 Docker 映像
   - 定期更新 Node.js 依賴套件

4. **監控與備份**
   - 定期檢查日誌
   - 備份配置檔案

---

## 效能優化

1. **啟用快取**
   - DBF 讀取已實作 2 秒快取
   - 可調整 `dbfReader.js` 中的 `CACHE_DURATION`

2. **調整監控間隔**
   - 預設 2 秒，可依需求調整 WATCH_INTERVAL

3. **資源限制**
   - 適當設定 Docker 資源限制
   - 避免過度分配或限制過嚴

---

## 附錄：完整配置範例

### docker-compose.yml（生產環境）

```yaml
version: '3.8'

services:
  clinic-monitor:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: anchia-clinic-monitor
    image: anchia-clinic-monitor:latest

    environment:
      - NODE_ENV=production
      - PORT=3001
      - DBF_FILE_PATH=/data/CO05T.DBF
      - WATCH_INTERVAL=2000
      - TZ=Asia/Taipei

    ports:
      - "3001:3001"

    volumes:
      - C:\clinic_data:/data:ro

    restart: unless-stopped

    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 512M
        reservations:
          cpus: '0.25'
          memory: 128M

    networks:
      - clinic-network

    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

networks:
  clinic-network:
    driver: bridge
```

---

**文件版本**: v1.0.0
**最後更新**: 2024-12
**維護者**: 系統管理員
