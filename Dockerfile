# ====================================
# 階段 1: 前端建置
# ====================================
FROM node:18-alpine AS frontend-builder

WORKDIR /app/frontend

# 複製前端依賴檔案
COPY frontend/package*.json ./

# 安裝依賴（包含 devDependencies，因為 vite 需要用來構建）
RUN npm ci

# 複製前端原始碼
COPY frontend/ ./

# 建置前端靜態檔案
RUN npm run build


# ====================================
# 階段 2: 後端建置
# ====================================
FROM node:18-alpine AS backend-builder

WORKDIR /app/backend

# 複製後端依賴檔案
COPY backend/package*.json ./

# 安裝依賴（僅生產環境）
RUN npm ci --only=production


# ====================================
# 階段 3: 最終執行映像
# ====================================
FROM node:18-alpine

# 設定工作目錄
WORKDIR /app

# 安裝 dumb-init（正確處理 signal）
RUN apk add --no-cache dumb-init

# 建立非 root 使用者
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# 從 backend-builder 複製後端依賴和程式碼
COPY --from=backend-builder --chown=nodejs:nodejs /app/backend/node_modules ./backend/node_modules
COPY --chown=nodejs:nodejs backend ./backend

# 從 frontend-builder 複製前端建置結果
COPY --from=frontend-builder --chown=nodejs:nodejs /app/frontend/dist ./backend/public

# 建立 DBF 檔案掛載目錄
RUN mkdir -p /data && chown nodejs:nodejs /data

# 切換到非 root 使用者
USER nodejs

# 設定環境變數
ENV NODE_ENV=production \
    PORT=3001 \
    DBF_FILE_PATH=/data/CO05T.DBF \
    WATCH_INTERVAL=2000

# 暴露 port
EXPOSE 3001

# 健康檢查
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# 啟動應用
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "backend/server.js"]
