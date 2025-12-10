# 資料庫結構說明

> DBF 與 PostgreSQL 結構文件

---

## 目錄

- [DBF 資料表](#dbf-資料表)
- [PostgreSQL 結構](#postgresql-結構)
- [資料同步](#資料同步)
- [欄位對照與代碼說明](#欄位對照與代碼說明)

---

## DBF 資料表

### CO01M - 病患主檔

**用途**：儲存病患基本資料，包含個人識別、聯絡方式等資訊

**主鍵**：`KCSTMR` (病歷號，7 位數字)

| 欄位 | 類型 | 說明 | 必填 | 範例 |
|------|------|------|------|------|
| KCSTMR | String(7) | 病歷號（唯一識別碼） | ✓ | `0000001` |
| MNAME | String(10) | 病患姓名 | ✓ | `王小明` |
| MSTS | String(2) | 病患狀態（業務使用） | | - |
| MSEX | String(1) | 性別（1=男，2=女） | ✓ | `1` |
| MBIRTHDT | String(7) | 生日（民國年 YYYMMDD） | ✓ | `0761015` |
| LABENO | String(9) | 勞保證號 | | - |
| MWORK | String(10) | 職業/工作單位 | | `工程師` |
| MTELH | String(10) | 聯絡電話（住家） | | `02-12345678` |
| MFML | String(13) | 家庭狀況 | | - |
| MPERSONID | String(10) | 身分證字號 | ✓ | `A123456789` |
| MADDR | String(100) | 居住地址 | | `台北市大安區...` |
| MREMARK | String(60) | 備註（自由文字） | | `對藥物過敏` |
| MNOTE | Integer | 備註碼（業務使用） | | - |
| MTELO | String(10) | 其他聯絡電話 | | `0912-345678` |

**關聯**：
- 被 CO02M、CO02F、CO03L、CO05B 透過 `KCSTMR` 關聯

### CO02M - 處方記錄主檔

**用途**：記錄每次就診的處方內容，包含藥品、檢查、處置等醫令項目

**複合鍵**：`KCSTMR` + `IDATE` + `ITIME` + `DNO`（實際使用 record_hash 唯一約束）

| 欄位 | 類型 | 說明 | 必填 | 範例 |
|------|------|------|------|------|
| KCSTMR | String(7) | 病歷號 | ✓ | `0000001` |
| IDATE | String(7) | 就診日期（民國年 YYYMMDD） | ✓ | `1141127` |
| ITIME | String(6) | 就診時間（HHMMSS） | ✓ | `140530` |
| IULDT | String(7) | 上傳日期（健保上傳用） | | - |
| SEQ | String(6) | 項次序號 | | `000001` |
| WICTM | String(80) | 處方內容說明 | | `每日三次飯後服用` |
| DNO | String(12) | **藥品/醫令代碼**（重要欄位） | ✓ | `P1407C` |
| PPS | String(6) | 單價（點數或金額） | | `15` |
| PFQ | String(40) | 用藥頻率 | | `TID`, `BID`, `QD` |
| PTDAY | String(3) | 用藥天數 | | `7` |
| PTQTY | String(7) | 總數量 | | `21` |
| LDRU | String(2) | 藥品類別 | | - |
| SPTQTY | String(7) | 特殊數量 | | - |
| IPK1 | String(20) | 包裝資訊1 | | - |
| IPK2 | String(20) | 包裝資訊2 | | - |
| IPK3 | String(20) | 包裝資訊3 | | - |
| ISGN | String(40) | 醫師簽章 | | - |
| IIDX | String(3) | 項目索引 | | - |

**重要欄位說明**：
- `DNO`: 醫令代碼（核心欄位），包含：
  - 藥品代碼：如 `A123456`
  - 檢查代碼：如 `19009C` (腹部超音波)、`19012C` (甲狀腺超音波)
  - 疾病管理代碼：如 `P1407C` (糖尿病照護)、`P4301C` (慢性腎臟病照護)
- `PFQ`: 常見頻率代碼：
  - `QD` = 每日一次
  - `BID` = 每日兩次
  - `TID` = 每日三次
  - `QID` = 每日四次
  - `PRN` = 需要時使用

**關聯**：
- 關聯至 CO01M (`KCSTMR`)
- 關聯至 CO02F (`KCSTMR` + `IDATE` + `ITIME`)

### CO02F - 處方明細/報告內容

**用途**：儲存檢查報告內容、處方明細等文字資料

**複合鍵**：`KCSTMR` + `FDATE` + `FTIME` + `FNO` + `FSQ`（實際使用 record_hash 唯一約束）

| 欄位 | 類型 | 說明 | 必填 | 範例 |
|------|------|------|------|------|
| KCSTMR | String(7) | 病歷號 | ✓ | `0000001` |
| FDATE | String(7) | 就診日期（民國年 YYYMMDD） | ✓ | `1141127` |
| FTIME | String(6) | 就診時間（HHMMSS） | ✓ | `140530` |
| FNO | String(3) | **報告類型代碼**（重要欄位） | ✓ | `P2` |
| FTEXT | String(250) | 報告內容文字 | ✓ | `Liver: normal...` |
| FSQ | String(2) | 分段序號 | ✓ | `01` |
| FRDAT | String(7) | 回診日期 | | - |
| FRTIM | String(6) | 回診時間 | | - |

**重要欄位說明**：
- `FNO`: 固定報告類型代碼（與 CO02M.DNO 對應）
  - `P1` = 心電圖報告
  - `P2` = 腹部超音波報告
  - `P3` = 甲狀腺超音波報告
  - `P5`, `P6` = 肺功能報告
- `FTEXT`: 報告內容文字，限制 250 字元
- `FSQ`: 分段序號，用於處理超過 250 字元的長報告
  - 同一份報告會拆成多筆記錄（FSQ=01, 02, 03...）
  - 查詢時需按 FSQ 排序後串接

**查詢範例**：
```sql
-- 查詢完整報告
SELECT FTEXT
FROM co02f
WHERE kcstmr='0000001' AND fdate='1141127' AND ftime='140530' AND fno='P2'
ORDER BY fsq
```

**關聯**：
- 關聯至 CO01M (`KCSTMR`)
- 關聯至 CO02M (`KCSTMR` + `FDATE` + `FTIME`)

### CO03L - 就診記錄

**用途**：記錄每次看診的完整資訊，包含身分別、健保資料、預防保健項目等

**複合鍵**：`KCSTMR` + `DATE` + `TIME`（實際使用 record_hash 唯一約束）

| 欄位 | 類型 | 說明 | 必填 | 範例 |
|------|------|------|------|------|
| KCSTMR | String(7) | 病歷號 | ✓ | `0000001` |
| DATE | String(7) | 就診日期（民國年 YYYMMDD） | ✓ | `1141127` |
| BDATE | String(7) | 處方開始日期 | | - |
| CDATE | String(7) | 處方結束日期 | | - |
| LBEG | String(7) | 療程開始日期 | | - |
| LEND | String(7) | 療程結束日期 | | - |
| TIME | String(6) | 掛號時間（HHMMSS） | ✓ | `140530` |
| LPID | String(1) | **身分別**（重要欄位） | | `A` |
| LID | String(1) | 醫師別 | | - |
| LIDS | String(2) | 門診別 | | - |
| LCPNO | String(5) | IC卡號（健保卡） | | - |
| LISNO | String(11) | 健保卡號 | | - |
| LABENO | String(9) | 勞保證號 | | - |
| LAMT | Integer | 就診金額 | | `150` |
| LNO | String(8) | 就診號碼 | | - |
| CASE | String(2) | 病例類別 | | - |
| DAYQTY | Integer | 處方天數 | | `7` |
| LABNO | String(9) | 診斷代碼（ICD） | | `E11` |
| LABDT | String(40) | 診斷日期文字 | | - |
| LISRS | String(3) | **卡序（預防保健代碼）**（重要欄位） | | `3D` |
| LENDDT | String(7) | 預約回診日期 | | - |
| LTIME | String(6) | **完診時間**（重要欄位） | ✓ | `150230` |

**重要欄位說明**：
- `LPID`: 身分別代碼
  - `A` = 健保身分
  - `9` = 其他身分
  - 空白 = 自費
- `LISRS`: 預防保健卡序代碼（用於識別預防保健項目）
  - `3D`, `21`, `22` = 成人健檢一階
  - `3E`, `23`, `24` = 成人健檢二階
  - `85` = 大腸癌篩檢（腸篩）
  - `95` = 口腔癌篩檢（口篩）
  - `AU` = 流感疫苗
  - `VU` = 新冠疫苗
  - `DU` = 肺炎鏈球菌疫苗
- `LTIME`: 完診時間，用於判斷就診是否完成
  - 若為 `000000` 或空值，表示未完診

**關聯**：
- 關聯至 CO01M (`KCSTMR`)
- 對應至 CO02M (`KCSTMR` + `DATE` + `TIME`)

### CO05B - 預約記錄

**用途**：儲存病患掛號與預約資訊

**複合鍵**：`KCSTMR` + `TBKDATE` + `TBKTIME`（實際使用 record_hash 唯一約束）

| 欄位 | 類型 | 說明 | 必填 | 範例 |
|------|------|------|------|------|
| KCSTMR | String(7) | 病歷號 | ✓ | `0000001` |
| TBKDATE | String(7) | 預約日期（民國年 YYYMMDD） | ✓ | `1141127` |
| TBKTIME | String(6) | 預約時間（HHMMSS） | ✓ | `140000` |
| TID | String(1) | 醫師代碼 | | `1` |
| TIDS | String(2) | 診別 | | `01` |
| TSTS | String(1) | 預約時段 | | `A` |
| TARTIME | String(8) | 預約號碼 | | `00001` |
| TNOTE | String(10) | 預約備註 | | `複診` |
| TENDTIME | String(8) | 完診時間 | | `150230` |
| TBKDT | String(7) | 掛號建立日期 | | - |
| LM | String(1) | 特殊標記 | | - |
| TPIDS | String(2) | 病患身分類別 | | - |
| TRCOST | Integer | 掛號費用 | | `150` |
| TRM1 | String(5) | 備註欄位1 | | - |
| TRM2 | String(5) | 備註欄位2 | | - |
| TDUTY | String(6) | 預約者 | | `櫃檯` |
| BNAME | String(10) | 病患姓名（冗餘） | | `王小明` |
| BTIMEC | Integer | 時段代碼 | | - |
| TIDSRM | String(1) | 身分備註標記 | | - |

**重要欄位說明**：
- `TBKTIME`: 預約時間（HHMMSS 格式，如 `140000` = 14:00:00）
- `TID`: 醫師代碼（對應醫師編號）
- `TIDS`: 診別（如早診、午診、晚診等）
- `TSTS`: 預約時段代碼
- `TARTIME`: 預約號碼（當日看診順序號碼）
- `TENDTIME`: 完診時間（看診結束時間）

**關聯**：
- 關聯至 CO01M (`KCSTMR`)

### CO05T - 本日門診狀態

**用途**：記錄當日看診即時狀態，用於門診進度追蹤與叫號系統

**複合鍵**：`KCSTMR` + `TBKDT` + `TBKTIME`（實際使用 record_hash 唯一約束）

| 欄位 | 類型 | 說明 | 必填 | 範例 |
|------|------|------|------|------|
| KCSTMR | String(7) | 病歷號 | ✓ | `0000001` |
| TBKDT | String(7) | 掛號日期（民國年 YYYMMDD） | ✓ | `1141210` |
| TBKTIME | String(6) | 掛號時間（HHMMSS） | ✓ | `090000` |
| TID | String(1) | 醫師別 | | `1` |
| TIDS | String(2) | 診別 | | `01` |
| TSTS | String(1) | **看診狀態**（重要欄位） | ✓ | `1` |
| TSEC | String(2) | 看診時段 | | `A` |
| TARTIME | String(8) | 號碼（看診順序） | | `00015` |
| TNOTE | String(10) | 備註 | | - |
| LM | String(1) | **身分別**（重要欄位） | | `A` |
| TENDTIME | String(8) | 完診時間 | | `093530` |
| TNAME | String(10) | 病患姓名 | ✓ | `王小明` |
| TBIRTHDT | String(7) | 病患生日（民國年 YYYMMDD） | | `0761015` |

**重要欄位說明**：
- `TSTS`: 看診狀態代碼
  - `1` = 看診中（正在看診）
  - `0` = 候診中（已報到等待看診）
  - `E` = 預約（尚未報到）
  - `H` = 取消（取消掛號）
  - `F` = 完診（看診完成）
- `LM`: 身分別代碼
  - `A` = 健保身分
  - `9` = 其他身分
  - 空白 = 自費
- `TARTIME`: 當日看診順序號碼（叫號用）
- `TSEC`: 看診時段（早診/午診/晚診等）

**關聯**：
- 關聯至 CO01M (`KCSTMR`)

**備註**：
- 此表為當日即時狀態表，通常只保留當日資料
- 用於門診叫號系統、候診人數統計等即時功能

---

## PostgreSQL 結構

### 資料表列表

#### co01m - 病患基本資料

```sql
CREATE TABLE IF NOT EXISTS co01m (
    kcstmr VARCHAR(7) PRIMARY KEY,        -- 病歷號
    mname VARCHAR(10),                    -- 姓名
    msts VARCHAR(2),                      -- 狀態
    msex VARCHAR(1),                      -- 性別（1=男, 2=女）
    mbirthdt VARCHAR(7),                  -- 生日（民國年 YYYMMDD）
    labeno VARCHAR(9),                    -- 勞保號
    mwork VARCHAR(10),                    -- 工作
    mtelh VARCHAR(10),                    -- 電話
    mfml VARCHAR(13),                     -- 家庭
    mpersonid VARCHAR(10),                -- 身分證號
    maddr VARCHAR(100),                   -- 地址
    mremark VARCHAR(60),                  -- 備註
    mnote INTEGER,                        -- 備註碼
    mtelo VARCHAR(10),                    -- 其他電話
    record_hash VARCHAR(32),              -- 記錄 Hash（用於差異比對）
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

#### co02m - 處方記錄

```sql
CREATE TABLE IF NOT EXISTS co02m (
    id SERIAL PRIMARY KEY,                -- 自動遞增主鍵
    kcstmr VARCHAR(7),                    -- 病歷號
    idate VARCHAR(7),                     -- 就診日期（民國年）
    itime VARCHAR(6),                     -- 就診時間
    iuldt VARCHAR(7),                     -- 上傳日期
    seq VARCHAR(6),                       -- 序號
    wictm VARCHAR(80),                    -- 處方內容
    ptp VARCHAR(1),                       -- 處方類型
    dno VARCHAR(12),                      -- 藥品/醫令代碼
    pps VARCHAR(6),                       -- 單價
    pfq VARCHAR(40),                      -- 頻率
    ptday VARCHAR(3),                     -- 天數
    ptqty VARCHAR(7),                     -- 數量
    ldru VARCHAR(2),                      -- 藥品類別
    sptqty VARCHAR(7),                    -- 特殊數量
    ipk1 VARCHAR(20),                     -- 包裝1
    ipk2 VARCHAR(20),                     -- 包裝2
    ipk3 VARCHAR(20),                     -- 包裝3
    isgn VARCHAR(40),                     -- 簽章
    iidx VARCHAR(3),                      -- 索引
    record_hash VARCHAR(32) UNIQUE,       -- 記錄 Hash（唯一約束，避免完全重複）
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

**重要說明**：
- 使用 `SERIAL PRIMARY KEY` 自動遞增 ID
- 使用 `record_hash UNIQUE` 避免完全重複的記錄
- `dno` 欄位包含疾病管理代碼（詳見下方「檢核項目代碼」）

#### co02f - 處方明細/報告內容

```sql
CREATE TABLE IF NOT EXISTS co02f (
    id SERIAL PRIMARY KEY,                -- 自動遞增主鍵
    kcstmr VARCHAR(7),                    -- 病歷號
    fdate VARCHAR(7),                     -- 就診日期
    ftime VARCHAR(6),                     -- 就診時間
    fno VARCHAR(3),                       -- 明細/報告類型編號
    ftext VARCHAR(250),                   -- 明細/報告內容
    fsq VARCHAR(2),                       -- 序號
    frdat VARCHAR(7),                     -- 回診日期
    frtim VARCHAR(6),                     -- 回診時間
    record_hash VARCHAR(32) UNIQUE,       -- 記錄 Hash（唯一約束，避免完全重複）
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

**重要說明**：
- `fno` 固定代碼對應檢查類型：
  - `P1` = 心電圖
  - `P2` = 腹部超音波
  - `P3` = 甲狀腺超音波
  - `P5`, `P6` = 肺功能
- `fsq` 序號用於多段報告（超過 250 字元分段儲存）
- 查詢報告時需用 `(kcstmr, fdate, ftime, fno)` 組合，並按 `fsq` 排序合併

#### co03l - 看診記錄

```sql
CREATE TABLE IF NOT EXISTS co03l (
    id SERIAL PRIMARY KEY,                -- 自動遞增主鍵
    kcstmr VARCHAR(7),                    -- 病歷號
    "date" VARCHAR(7),                    -- 就診日期
    bdate VARCHAR(7),                     -- 開始日期
    cdate VARCHAR(7),                     -- 結束日期
    lbeg VARCHAR(7),                      -- 療程開始
    lend VARCHAR(7),                      -- 療程結束
    "time" VARCHAR(6),                    -- 就診時間
    lpid VARCHAR(1),                      -- 身分別
    lid VARCHAR(1),                       -- 就診類別
    lids VARCHAR(2),                      -- 就診身分
    lcpno VARCHAR(5),                     -- IC卡號
    lisno VARCHAR(11),                    -- 健保卡號
    labeno VARCHAR(9),                    -- 勞保號
    lamt INTEGER,                         -- 金額
    lno VARCHAR(8),                       -- 就診號
    "case" VARCHAR(2),                    -- 病例別
    dayqty INTEGER,                       -- 日數
    labno VARCHAR(9),                     -- 診斷代碼
    labdt VARCHAR(40),                    -- 診斷日期
    lisrs VARCHAR(3),                     -- 卡序（預防保健）
    lenddt VARCHAR(7),                    -- 結束日期
    ltime VARCHAR(6),                     -- 完診時間
    record_hash VARCHAR(32) UNIQUE,       -- 記錄 Hash（唯一約束，避免完全重複）
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

**重要說明**：
- `lisrs` 卡序用於預防保健項目識別（詳見下方「檢核項目代碼」）
- 查詢預防保健時查詢範圍為 5 年內

#### co05b - 預約記錄

```sql
CREATE TABLE IF NOT EXISTS co05b (
    id SERIAL PRIMARY KEY,                -- 自動遞增主鍵
    kcstmr VARCHAR(7),                    -- 病歷號
    tbkdate VARCHAR(7),                   -- 預約日期
    tbktime VARCHAR(6),                   -- 預約時間
    tid VARCHAR(1),                       -- 醫師代碼
    tids VARCHAR(2),                      -- 診別
    tsts VARCHAR(1),                      -- 預約時段
    tartime VARCHAR(8),                   -- 預約號碼
    tnote VARCHAR(10),                    -- 預約備註
    tendtime VARCHAR(8),                  -- 完診時間
    tbkdt VARCHAR(7),                     -- 掛號建立日期
    lm VARCHAR(1),                        -- 特殊標記
    tpids VARCHAR(2),                     -- 病患身分類別
    trcost INTEGER,                       -- 掛號費用
    trm1 VARCHAR(5),                      -- 備註欄位1
    trm2 VARCHAR(5),                      -- 備註欄位2
    tduty VARCHAR(6),                     -- 預約者
    bname VARCHAR(10),                    -- 病患姓名
    btimec INTEGER,                       -- 時段代碼
    tidsrm VARCHAR(1),                    -- 身分備註標記
    record_hash VARCHAR(32) UNIQUE,       -- 記錄 Hash（唯一約束，避免完全重複）
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

#### co05t - 本日門診狀態

```sql
CREATE TABLE IF NOT EXISTS co05t (
    id SERIAL PRIMARY KEY,                -- 自動遞增主鍵
    kcstmr VARCHAR(7),                    -- 病歷號
    tbkdt VARCHAR(7),                     -- 掛號日期
    tbktime VARCHAR(6),                   -- 掛號時間
    tid VARCHAR(1),                       -- 醫師別
    tids VARCHAR(2),                      -- 診別
    tsts VARCHAR(1),                      -- 看診狀態（E:預約, H:取消, F:完診, 0:保留, 1:看診中）
    tsec VARCHAR(2),                      -- 看診時段
    tartime VARCHAR(8),                   -- 號碼（看診順序）
    tnote VARCHAR(10),                    -- 備註
    lm VARCHAR(1),                        -- 身分別（A:健保, 9:其他, 空白:自費）
    tendtime VARCHAR(8),                  -- 完診時間
    tname VARCHAR(10),                    -- 病患姓名
    tbirthdt VARCHAR(7),                  -- 病患生日
    record_hash VARCHAR(32) UNIQUE,       -- 記錄 Hash（唯一約束，避免完全重複）
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

**重要說明**：
- `tsts` 看診狀態用於追蹤當日門診進度
- `lm` 身分別與 CO03L.LPID 類似，但命名不同
- 此表通常只保留當日資料，適合用於即時監控

#### sync_log - 同步日誌

```sql
CREATE TABLE IF NOT EXISTS sync_log (
    id SERIAL PRIMARY KEY,
    table_name VARCHAR(50),               -- 表格名稱
    synced_at TIMESTAMP,                  -- 同步時間
    records_synced INTEGER,               -- 同步記錄數
    sync_type VARCHAR(20),                -- 同步類型（initial/incremental）
    error_message TEXT,                   -- 錯誤訊息
    created_at TIMESTAMP DEFAULT NOW()
);
```

### 索引

```sql
-- co02m 索引
CREATE INDEX IF NOT EXISTS idx_co02m_patient_date ON co02m(kcstmr, idate DESC);
CREATE INDEX IF NOT EXISTS idx_co02m_date ON co02m(idate DESC);
CREATE INDEX IF NOT EXISTS idx_co02m_dno ON co02m(dno);

-- co02f 索引
CREATE INDEX IF NOT EXISTS idx_co02f_patient_date ON co02f(kcstmr, fdate DESC);
CREATE INDEX IF NOT EXISTS idx_co02f_date ON co02f(fdate DESC);

-- co03l 索引
CREATE INDEX IF NOT EXISTS idx_co03l_patient_date ON co03l(kcstmr, "date" DESC);
CREATE INDEX IF NOT EXISTS idx_co03l_date ON co03l("date" DESC);
CREATE INDEX IF NOT EXISTS idx_co03l_lisrs ON co03l(lisrs);

-- co05b 索引
CREATE INDEX IF NOT EXISTS idx_co05b_patient_date ON co05b(kcstmr, tbkdate DESC);
CREATE INDEX IF NOT EXISTS idx_co05b_date ON co05b(tbkdate DESC);

-- co05t 索引
CREATE INDEX IF NOT EXISTS idx_co05t_patient_date ON co05t(kcstmr, tbkdt DESC);
CREATE INDEX IF NOT EXISTS idx_co05t_date ON co05t(tbkdt DESC);
CREATE INDEX IF NOT EXISTS idx_co05t_status ON co05t(tsts);

-- sync_log 索引
CREATE INDEX IF NOT EXISTS idx_sync_log_time ON sync_log(synced_at DESC);
```

---

## 資料同步

### 同步流程

```
DBFWatcher（檔案監控）
  ↓ 每 N 分鐘檢查一次
  ↓ 偵測 mtime 變更
  ↓
SyncManager（同步管理）
  ├── 1. readDBF() - 讀取 DBF 檔案
  ├── 2. convertEncoding() - Big5 → UTF-8
  ├── 3. mapFields() - 映射欄位
  ├── 4. filterHotData() - 過濾最近 N 年
  ├── 5. detectChanges() - Hash 比對差異
  ├── 6. batchInsert() - UPSERT 到 PostgreSQL
  └── 7. updateSyncLog() - 記錄同步狀態
```

### Hot Data 策略

**定義**：只同步最近 N 年的資料（預設 5 年）

**目的**：
- 減少資料庫大小
- 加快查詢速度
- 降低記憶體占用

**設定**：
```javascript
// server/sync/sync-manager.js
const syncManager = new SyncManager(db, dbfRoot, {
  hotDataThreshold: 1825  // 5 年 = 365 * 5 天
});
```

**過濾規則**：
- **CO01M**（病患主檔）：無日期欄位，全部同步
- **CO02M**（處方記錄）：依 `idate` 過濾，保留 ≥ 5 年內
- **CO02F**（處方明細）：依 `fdate` 過濾，保留 ≥ 5 年內
- **CO03L**（就診記錄）：依 `date` 過濾，保留 ≥ 5 年內
- **CO05B**（預約記錄）：依 `tbkdate` 過濾，保留 ≥ 5 年內
- **CO05T**（本日門診狀態）：依 `tbkdt` 過濾，僅保留當日資料（建議每日清空）

### 差異偵測（Incremental Sync）

使用 **MD5 Hash** 比對差異：

```javascript
// 計算記錄 Hash
function hashRecord(record) {
  return crypto
    .createHash('md5')
    .update(JSON.stringify(record))
    .digest('hex');
}
```

**UPSERT 策略**：

**CO01M**（使用主鍵）：
```sql
INSERT INTO co01m (kcstmr, mname, ...)
VALUES ('0000001', '王小明', ...)
ON CONFLICT (kcstmr)
DO UPDATE SET
  mname = EXCLUDED.mname,
  record_hash = EXCLUDED.record_hash;
```

**其他表格**（使用 record_hash）：
```sql
INSERT INTO co02m (kcstmr, idate, dno, ...)
VALUES ('0000001', '1141127', 'P1407C', ...)
ON CONFLICT (record_hash)
DO NOTHING;  -- 完全重複則忽略
```

### 批次處理

**批次大小計算**：
```javascript
const fieldCount = Object.keys(records[0]).length;
const MAX_PARAMS = 30000;  // PostgreSQL 參數限制保守值
const BATCH_SIZE = Math.floor(MAX_PARAMS / fieldCount);
```

**去重邏輯**：
- 批次內使用 `record_hash` 去重
- 保留最後出現的記錄

---

## 欄位對照與代碼說明

### 民國年格式轉換

**DBF 格式**：7 位數 `YYYMMDD`
- 範例：`1141127` = 民國 114 年 11 月 27 日

**轉換公式**：
```javascript
function rocToAd(rocDate) {
  const rocYear = parseInt(rocDate.substring(0, 3));
  const year = rocYear + 1911;  // 西元年
  const month = rocDate.substring(3, 5);
  const day = rocDate.substring(5, 7);
  return `${year}-${month}-${day}`;
}

// 1141127 → 2025-11-27
```

**取得民國年日期**：
```javascript
function getROCDate(daysAgo) {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  const rocYear = date.getFullYear() - 1911;
  return String(rocYear).padStart(3, '0') +
         String(date.getMonth() + 1).padStart(2, '0') +
         String(date.getDate()).padStart(2, '0');
}
```

### 性別代碼

| DBF | 說明 |
|-----|------|
| `1` | 男 |
| `2` | 女 |

### 時間格式

**ITIME / FTIME / LTIME 格式**：6 位數 `HHMMSS`
- 範例：`140530` = 14:05:30

**過濾條件**：
```javascript
// 只取有完診時間的記錄
const ltime = record.LTIME?.trim() || '';
if (!ltime || ltime === '000000') {
  return false;  // 過濾掉未完診記錄
}
```

### 預防保健卡序代碼（CO03L.LISRS）

用於識別預防保健項目類型：

| 代碼 | 項目名稱 |
|------|----------|
| `3D`, `21`, `22` | 成人健康檢查一階 |
| `3E`, `23`, `24` | 成人健康檢查二階 |
| `85` | 大腸癌篩檢（腸篩） |
| `95` | 口腔癌篩檢（口篩） |
| `AU` | 流感疫苗 |
| `VU` | 新冠疫苗 |
| `DU` | 肺炎鏈球菌疫苗 |

### 疾病管理代碼（CO02M.DNO）

用於識別疾病管理項目，常見代碼如下：

#### 糖尿病管理

| 代碼 | 名稱 |
|------|------|
| `P1406C` | 糖尿病初診 |
| `P1407C` | 糖尿病照護方案 |
| `P1408C` | 糖尿病定期追蹤 |
| `P1409C` | 糖尿病持續追蹤管理 |
| `P1410C` | 糖尿病出院追蹤 |
| `P7001C` | DKD-複診 |
| `P7002C` | DKD-年度 |

#### 腎臟病管理

| 代碼 | 名稱 |
|------|------|
| `P4301C` | 慢性腎臟病照護服務 |
| `P4302C` | 慢性腎臟病門診追蹤 |

#### 代謝症候群

| 代碼 | 名稱 |
|------|------|
| `P7501C` | 代謝症候群照護 |
| `P7502C` | 代謝症候群追蹤管理 |
| `P7503C` | 代謝症候群定期追蹤 |

### 檢查項目代碼（CO02M.DNO）

用於識別檢查項目，與 CO02F.FNO 報告類型對應：

| 檢查類型 | DNO 代碼 | FNO 報告代碼 |
|---------|---------|-------------|
| 腹部超音波 | `19001C`, `19009C` | `P2` |
| 甲狀腺超音波 | `19012C` | `P3` |
| 肺功能檢查 | `17003C`, `17006C` | `P5`, `P6` |
| 細針穿刺 | `15021C` | （無報告檔） |
| 尿流速檢查 | `21004C` | （無報告檔） |

**報告查詢說明**：
1. 從 CO02M 表查詢檢查記錄（使用 DNO 代碼）
2. 從 CO02F 表查詢對應報告內容（使用 FNO 代碼）
3. 若報告超過 250 字元，需按 FSQ 序號排序後合併

---

## 資料庫架構說明

### 資料流向

```
診所 HIS 系統（DBF 檔案）
  ↓
  檔案監控與同步（DBFWatcher + SyncManager）
  ↓
PostgreSQL 資料庫
  ↓
應用程式查詢介面
```

### 主鍵策略

**CO01M**（病患主檔）：
- 主鍵：`kcstmr`
- UPSERT 策略：`ON CONFLICT (kcstmr) DO UPDATE`

**其他表格**（CO02M, CO02F, CO03L, CO05B, CO05T）：
- 主鍵：`id SERIAL PRIMARY KEY`（自動遞增）
- 唯一約束：`record_hash VARCHAR(32) UNIQUE`
- UPSERT 策略：`ON CONFLICT (record_hash) DO NOTHING`

**優點**：
- 避免複合主鍵複雜度
- 用 Hash 確保記錄唯一性
- 支援增量同步

---

**文件維護**：Anchia Clinic Monitor Development Team
**最後更新**：2025-12-10
**適用版本**：Anchia Clinic Monitor v1.0.0
**相關文件**：
- `server/db/schema.sql` - PostgreSQL Schema 定義
