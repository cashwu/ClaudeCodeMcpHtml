# 🔧 Claude Code MCP 指令產生器

一個用於將 MCP (Model Context Protocol) JSON 設定檔轉換為 Claude Code 安裝指令的網頁工具。輕鬆產生正確的指令格式，支援多種伺服器類型和配置選項。

[![Open in Browser](https://img.shields.io/badge/Open-在線使用-blue?style=for-the-badge)](https://mcp-generator.cashwu.com/)
[![GitHub](https://img.shields.io/github/license/cashwu/ClaudeCodeMcpHtml?style=for-the-badge)](./LICENSE)

## ✨ 功能特色

- 🚀 **即時指令產生** - 輸入 JSON 立即產生對應的 Claude Code 指令
- 🔍 **自動伺服器類型偵測** - 智能識別 stdio、SSE、HTTP 三種類型
- ✅ **完整輸入驗證** - 詳細的錯誤檢查和建議修復
- 🎯 **靈活配置選項** - 支援 local/project/user 範圍設定
- 🌐 **環境變數管理** - 輕鬆設定和管理環境變數
- 📱 **響應式設計** - 支援桌面和行動裝置
- 🌙 **深色主題支援** - 自動偵測系統主題

## 🚀 快速開始

### 線上使用（推薦）

直接在瀏覽器中開啟：[https://mcp-generator.cashwu.com/](https://mcp-generator.cashwu.com/)

### 本地運行

1. **克隆專案**
   ```bash
   git clone https://github.com/cashwu/ClaudeCodeMcpHtml.git
   cd ClaudeCodeMcpHtml
   ```

2. **啟動本地伺服器**
   ```bash
   # 使用 Python
   python3 -m http.server 8000
   
   # 或使用 Node.js
   npx http-server
   
   # 或使用 Live Server (VS Code 擴充)
   ```

3. **開啟瀏覽器**
   前往 `http://localhost:8000`

## 📖 使用說明

### 基本使用流程

1. **輸入設定**：將您的 MCP JSON 設定貼入文字區域
2. **選擇選項**：設定安裝範圍和環境變數
3. **產生指令**：系統自動產生對應的 Claude Code 指令
4. **複製執行**：點擊複製按鈕，在終端機中執行

### 支援的格式

#### ✅ 完整設定檔格式
```json
{
  "mcpServers": {
    "server-name": {
      "command": "npx",
      "args": ["@modelcontextprotocol/server-github"]
    }
  }
}
```

#### ✅ 單一伺服器設定格式
```json
{
  "command": "node",
  "args": ["./custom-server.js"],
  "env": {
    "API_KEY": "your-api-key"
  }
}
```

#### ✅ 遠端伺服器格式
```json
{
  "url": "https://api.example.com/mcp",
  "headers": {
    "Authorization": "Bearer token"
  }
}
```

### 配置選項

- **設定範圍**
  - `local`: 僅當前目錄
  - `project`: 整個專案（團隊共享）
  - `user`: 使用者全域設定

- **伺服器類型**
  - `stdio`: 本地程序（自動偵測 command + args）
  - `sse`: Server-Sent Events（自動偵測 url）
  - `http`: HTTP API（預設）

## 🛠 技術架構

### 純前端實作

本專案採用純前端架構，無需後端伺服器，可直接在瀏覽器中運行。

### 核心模組

| 檔案 | 說明 |
|------|------|
| `converter.js` | MCP JSON 到指令的轉換邏輯 |
| `validator.js` | JSON 格式驗證和錯誤檢查 |
| `script.js` | 主要應用程式邏輯和事件處理 |
| `test-data.js` | 測試資料和範例配置 |

### 檔案結構

```
ClaudeCodeMcpHtml/
├── index.html          # 主要頁面
├── styles.css          # 樣式表
├── script.js           # 主程式邏輯
├── converter.js        # 轉換器
├── validator.js        # 驗證器
├── test-data.js        # 測試資料
├── tests.html          # 測試頁面
├── MCP-RULES.md        # MCP 規則說明
├── CLAUDE.md           # 專案說明
└── README.md           # 本檔案
```

## 📝 範例

### 1. stdio 伺服器（本地程序）
```json
{
  "command": "npx",
  "args": ["@modelcontextprotocol/server-github"],
  "env": {
    "GITHUB_PERSONAL_ACCESS_TOKEN": "your-token"
  }
}
```

**產生的指令**：
```bash
claude mcp add github --scope local --env GITHUB_PERSONAL_ACCESS_TOKEN=your-token -- npx @modelcontextprotocol/server-github
```

### 2. SSE 伺服器（即時推送）
```json
{
  "url": "sse://localhost:3001/events",
  "headers": {
    "Authorization": "Bearer secret-token"
  }
}
```

**產生的指令**：
```bash
claude mcp add --transport sse realtime-server sse://localhost:3001/events --scope local --header "Authorization=Bearer secret-token"
```

### 3. HTTP 伺服器（API 整合）
```json
{
  "url": "https://api.example.com/mcp",
  "headers": {
    "X-API-Key": "api-key-value"
  }
}
```

**產生的指令**：
```bash
claude mcp add --transport http api-server https://api.example.com/mcp --scope local --header "X-API-Key=api-key-value"
```

## 🧪 開發

### 本地開發設置

1. **安裝開發工具**（可選）
   ```bash
   npm install -g live-server
   ```

2. **啟動開發伺服器**
   ```bash
   live-server --port=8000
   ```

### 測試

開啟 `tests.html` 進行功能測試：
```
http://localhost:8000/tests.html
```

測試包含：
- JSON 解析測試
- 指令產生測試
- 驗證邏輯測試
- 邊界情況測試

## 🤝 貢獻指南

歡迎貢獻！請遵循以下步驟：

1. **Fork 專案**
2. **建立功能分支** (`git checkout -b feature/amazing-feature`)
3. **提交變更** (`git commit -m 'Add some amazing feature'`)
4. **推送到分支** (`git push origin feature/amazing-feature`)
5. **開啟 Pull Request**

### 問題回報

如果您發現 bug 或有功能建議，請在 [Issues](https://github.com/cashwu/ClaudeCodeMcpHtml/issues) 中回報。

## 📄 授權

本專案採用 MIT 授權 - 詳見 [LICENSE](./LICENSE) 檔案。

---

<div align="center">

**[🌐 線上使用](https://mcp-generator.cashwu.com/)** | **[📖 MCP 文件](./MCP-RULES.md)** | **[🐛 回報問題](https://github.com/cashwu/ClaudeCodeMcpHtml/issues)**

Made with ❤️ by [Cash Wu](https://github.com/cashwu)

</div>