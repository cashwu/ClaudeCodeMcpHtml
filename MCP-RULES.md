# Claude Code MCP 完整規則與指令參考

## 目錄
- [MCP 基礎概念](#mcp-基礎概念)
- [指令語法完整說明](#指令語法完整說明)
- [設定範圍與層級](#設定範圍與層級)
- [JSON 設定檔結構](#json-設定檔結構)
- [指令串接規則](#指令串接規則)
- [環境變數處理](#環境變數處理)
- [實用範例集](#實用範例集)
- [常見問題與解決方案](#常見問題與解決方案)

---

## MCP 基礎概念

### 什麼是 MCP？
Model Context Protocol (MCP) 是一個用於 AI 工具整合的開源標準，允許 Claude Code 連接到數百個外部工具和資料來源。

### 三種伺服器類型

#### 1. stdio 伺服器（本地程序）
- 執行本地安裝的程序
- 透過標準輸入/輸出通訊
- 適用於大多數 npm 套件和本地工具

#### 2. SSE 伺服器（Server-Sent Events）
- 連接到遠端 HTTP 伺服器
- 支援即時事件推送
- 適用於即時資料同步

#### 3. HTTP 伺服器（標準 HTTP）
- 標準 HTTP 請求/回應
- 適用於 REST API 整合

---

## 指令語法完整說明

### 基本語法模式

#### 1. stdio 伺服器安裝
```bash
claude mcp add <server-name> [選項] -- <執行指令> [參數...]
```

#### 2. 遠端伺服器安裝（SSE/HTTP）
```bash
claude mcp add --transport <sse|http> <server-name> <URL> [選項]
```

### 完整參數列表

| 參數 | 說明 | 範例 |
|------|------|------|
| `--scope <範圍>` | 設定伺服器範圍：local/project/user | `--scope project` |
| `--env <變數=值>` | 設定環境變數 | `--env API_KEY=xxx` |
| `--transport <類型>` | 指定傳輸類型：stdio/sse/http | `--transport sse` |
| `--header <標頭>` | 添加 HTTP 標頭（僅 HTTP/SSE） | `--header "Auth: Bearer token"` |

### 參數組合規則

1. **範圍參數**：可與任何模式組合使用
2. **環境變數**：可設定多個，使用多個 `--env` 參數
3. **雙破折號 (--)**：stdio 模式中必須放在 Claude 參數和執行指令之間
4. **傳輸類型**：僅用於遠端伺服器，不可與 `--` 組合

---

## 設定範圍與層級

### 三種設定範圍

#### 1. Local（本地）
- **作用範圍**：僅在當前工作目錄
- **設定檔**：不產生設定檔，僅記憶體中
- **使用時機**：測試用途

#### 2. Project（專案）
- **作用範圍**：整個專案（透過 .mcp.json 共享）
- **設定檔路徑**：`<project-root>/.mcp.json`
- **使用時機**：團隊協作，版本控制
- **指令**：`--scope project`

#### 3. User（使用者）
- **作用範圍**：當前使用者的所有專案
- **設定檔路徑**：`~/.claude/mcp.json`
- **使用時機**：個人常用工具
- **指令**：`--scope user`

### 優先級順序
1. Local（最高優先級）
2. Project
3. User（最低優先級）

---

## JSON 設定檔結構

### 基本結構
```json
{
  "mcpServers": {
    "server-name": {
      "command": "執行指令路徑",
      "args": ["參數1", "參數2"],
      "env": {
        "環境變數名": "值"
      }
    }
  }
}
```

### 完整欄位說明

#### stdio 伺服器設定
```json
{
  "mcpServers": {
    "my-server": {
      "command": "/usr/local/bin/node",           // 必填：執行指令
      "args": ["/path/to/server.js", "--flag"],  // 選填：指令參數
      "env": {                                   // 選填：環境變數
        "API_KEY": "${MY_API_KEY}",
        "DEBUG": "true"
      }
    }
  }
}
```

#### SSE 伺服器設定
```json
{
  "mcpServers": {
    "remote-sse": {
      "type": "sse",                            // 必填：伺服器類型
      "url": "https://api.example.com/sse",     // 必填：伺服器 URL
      "headers": {                              // 選填：HTTP 標頭
        "Authorization": "Bearer ${API_TOKEN}",
        "User-Agent": "Claude-MCP-Client"
      }
    }
  }
}
```

#### HTTP 伺服器設定
```json
{
  "mcpServers": {
    "remote-http": {
      "type": "http",                           // 必填：伺服器類型
      "url": "https://api.example.com/mcp",     // 必填：伺服器 URL
      "headers": {                              // 選填：HTTP 標頭
        "Authorization": "Bearer ${API_TOKEN}"
      }
    }
  }
}
```

---

## 指令串接規則

### 雙破折號 (--) 的作用
雙破折號用於分隔 Claude CLI 參數和實際執行的指令，確保參數正確解析。

#### 正確使用
```bash
claude mcp add myserver --env API_KEY=xxx --scope project -- npx my-mcp-server --port 3000
```

#### 錯誤使用
```bash
# ❌ 錯誤：沒有雙破折號分隔
claude mcp add myserver --env API_KEY=xxx npx my-mcp-server

# ❌ 錯誤：雙破折號位置錯誤
claude mcp add myserver -- --env API_KEY=xxx npx my-mcp-server
```

### 複雜指令組合範例

#### 多環境變數 + 專案範圍
```bash
claude mcp add database \
  --env DB_HOST=localhost \
  --env DB_PORT=5432 \
  --env DB_NAME=myapp \
  --scope project \
  -- npx database-mcp-server
```

#### 帶參數的 npm 執行
```bash
claude mcp add webservice \
  --env PORT=8080 \
  --scope user \
  -- npx -y web-mcp-server --debug --timeout 30000
```

---

## 環境變數處理

### 環境變數展開語法

#### 1. 基本展開
```json
{
  "env": {
    "API_KEY": "${MY_SECRET_KEY}"
  }
}
```

#### 2. 預設值展開
```json
{
  "env": {
    "PORT": "${SERVER_PORT:-3000}",
    "DEBUG": "${DEBUG_MODE:-false}"
  }
}
```

#### 3. 可使用環境變數的欄位
- `command`：執行指令路徑
- `args`：指令參數
- `env`：環境變數值
- `url`：伺服器 URL（遠端伺服器）
- `headers`：HTTP 標頭值（遠端伺服器）

### 環境變數設定範例

#### 指令中設定
```bash
claude mcp add airtable \
  --env AIRTABLE_API_KEY=${AIRTABLE_KEY} \
  --env AIRTABLE_BASE_ID=${BASE_ID:-default_base} \
  -- npx airtable-mcp-server
```

#### JSON 中設定
```json
{
  "mcpServers": {
    "stripe": {
      "command": "npx",
      "args": ["stripe-mcp-server"],
      "env": {
        "STRIPE_SECRET_KEY": "${STRIPE_SECRET}",
        "STRIPE_WEBHOOK_SECRET": "${STRIPE_WEBHOOK:-}",
        "ENVIRONMENT": "${NODE_ENV:-development}"
      }
    }
  }
}
```

---

## 實用範例集

### 開發工具整合

#### 1. Sentry 錯誤追蹤
```bash
claude mcp add sentry \
  --env SENTRY_AUTH_TOKEN=your_token \
  --env SENTRY_ORG=your_org \
  --scope project \
  -- npx @sentry/mcp-server
```

#### 2. GitHub 整合
```bash
claude mcp add github \
  --env GITHUB_TOKEN=${GITHUB_PAT} \
  --scope user \
  -- npx github-mcp-server
```

### 專案管理工具

#### 3. Linear 專案管理（SSE）
```bash
claude mcp add --transport sse linear https://mcp.linear.app/sse \
  --header "Authorization: Bearer ${LINEAR_TOKEN}" \
  --scope project
```

#### 4. Jira 整合
```bash
claude mcp add jira \
  --env JIRA_URL=https://company.atlassian.net \
  --env JIRA_USERNAME=user@company.com \
  --env JIRA_API_TOKEN=${JIRA_TOKEN} \
  --scope project \
  -- npx jira-mcp-server
```

### 資料庫與 API

#### 5. Airtable 資料庫
```bash
claude mcp add airtable \
  --env AIRTABLE_API_KEY=${AIRTABLE_KEY} \
  --scope project \
  -- npx -y airtable-mcp-server
```

#### 6. PostgreSQL 資料庫
```bash
claude mcp add postgres \
  --env DATABASE_URL=${DATABASE_URL} \
  --env POSTGRES_SCHEMA=public \
  --scope project \
  -- npx postgres-mcp-server
```

### 支付與商務

#### 7. Stripe 支付整合
```bash
claude mcp add stripe \
  --env STRIPE_SECRET_KEY=${STRIPE_SECRET} \
  --scope project \
  -- npx stripe-mcp-server
```

#### 8. PayPal 支付
```bash
claude mcp add paypal \
  --env PAYPAL_CLIENT_ID=${PAYPAL_CLIENT_ID} \
  --env PAYPAL_CLIENT_SECRET=${PAYPAL_SECRET} \
  --env PAYPAL_MODE=${PAYPAL_ENV:-sandbox} \
  --scope project \
  -- npx paypal-mcp-server
```

### 設計工具

#### 9. Figma 設計協作
```bash
claude mcp add figma \
  --env FIGMA_ACCESS_TOKEN=${FIGMA_TOKEN} \
  --scope user \
  -- npx figma-mcp-server
```

#### 10. Canva 設計工具
```bash
claude mcp add canva \
  --env CANVA_API_KEY=${CANVA_KEY} \
  --scope project \
  -- npx canva-mcp-server
```

---

## 常見問題與解決方案

### 1. 指令執行失敗

#### 問題：找不到執行檔
```
Error: command not found: npx
```

**解決方案**：確保 Node.js 和 npm 已正確安裝
```bash
# 檢查 Node.js 版本
node --version
# 檢查 npm 版本
npm --version
```

#### 問題：權限不足
```
Error: Permission denied
```

**解決方案**：檢查執行權限或使用正確的路徑
```bash
# 使用完整路徑
claude mcp add myserver -- /usr/local/bin/node server.js

# 或給予執行權限
chmod +x /path/to/server
```

### 2. 環境變數問題

#### 問題：環境變數未展開
**解決方案**：確保環境變數語法正確
```bash
# 正確語法
--env API_KEY=${MY_API_KEY}

# 錯誤語法
--env API_KEY=$MY_API_KEY
```

### 3. 設定檔問題

#### 問題：JSON 格式錯誤
**解決方案**：使用 JSON 驗證器檢查格式
```json
{
  "mcpServers": {
    "server-name": {
      "command": "path",
      "args": []  // ← 確保最後沒有逗號
    }
  }
}
```

### 4. 網路連線問題

#### 問題：遠端伺服器連線失敗
**解決方案**：檢查網路和認證設定
```bash
# 測試 URL 連通性
curl -I https://api.example.com/mcp

# 檢查認證標頭格式
claude mcp add --transport sse myserver https://api.example.com/sse \
  --header "Authorization: Bearer valid_token_here"
```

### 5. 團隊協作問題

#### 問題：團隊成員無法使用專案設定
**解決方案**：
1. 確保 `.mcp.json` 已加入版本控制
2. 團隊成員需要設定對應的環境變數
3. 使用環境變數範本檔案 `.env.example`

```bash
# 專案根目錄創建環境變數範本
echo "AIRTABLE_API_KEY=your_key_here" > .env.example
echo "DATABASE_URL=your_db_url_here" >> .env.example
```

---

## 進階用法

### 條件式設定
使用環境變數預設值實現條件式配置：

```json
{
  "mcpServers": {
    "api-server": {
      "command": "npx",
      "args": ["api-mcp-server"],
      "env": {
        "API_URL": "${API_URL:-https://api.production.com}",
        "DEBUG": "${DEBUG:-false}",
        "TIMEOUT": "${REQUEST_TIMEOUT:-5000}"
      }
    }
  }
}
```

### 多伺服器組合
一個專案可以同時使用多個 MCP 伺服器：

```bash
# 添加資料庫伺服器
claude mcp add database --scope project -- npx postgres-mcp-server

# 添加 API 伺服器
claude mcp add api --scope project -- npx rest-api-mcp-server

# 添加監控伺服器
claude mcp add monitoring --scope project -- npx sentry-mcp-server
```

對應的 `.mcp.json`：
```json
{
  "mcpServers": {
    "database": {
      "command": "npx",
      "args": ["postgres-mcp-server"],
      "env": {
        "DATABASE_URL": "${DATABASE_URL}"
      }
    },
    "api": {
      "command": "npx", 
      "args": ["rest-api-mcp-server"],
      "env": {
        "API_KEY": "${API_KEY}"
      }
    },
    "monitoring": {
      "command": "npx",
      "args": ["sentry-mcp-server"],
      "env": {
        "SENTRY_DSN": "${SENTRY_DSN}"
      }
    }
  }
}
```

---

## 總結

這份文件涵蓋了 Claude Code MCP 的所有核心概念、語法規則和實用範例。使用這些資訊，您可以：

1. **理解 MCP 架構**：掌握三種伺服器類型的差異和適用場景
2. **熟練使用指令**：正確組合參數，避免常見錯誤
3. **管理設定層級**：合理選擇 local、project、user 範圍
4. **處理複雜場景**：環境變數展開、多伺服器整合
5. **解決問題**：快速診斷和修復常見問題

建議將此文件作為 MCP 指令產生工具的核心參考資料，確保產生的指令符合官方規範並具備良好的可用性。