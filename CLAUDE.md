# CLAUDE.md

此檔案為 Claude Code (claude.ai/code) 在此儲存庫中工作時提供指導。

## 專案概述

這是一個用於產生 Claude Code MCP (Model Context Protocol) 指令的網頁工具。此工具旨在簡化 MCP 伺服器配置和指令產生的過程。

## 核心架構

### 前端架構
- 使用現代網頁框架 (建議 React/Vue/Svelte)
- 響應式設計，支援桌面和行動裝置
- 包含 MCP 指令產生器、配置編輯器和預覽功能

### 後端架構 (如需要)
- REST API 或 GraphQL 端點
- MCP 配置驗證和產生邏輯
- 可選的配置儲存功能

### 關鍵模組
- **CommandGenerator**: 負責根據使用者輸入產生 MCP 指令
- **ConfigValidator**: 驗證 MCP 配置檔案格式
- **TemplateManager**: 管理常用的 MCP 伺服器模板
- **ExportHandler**: 處理配置檔案的匯出功能

## 常用指令

### 開發指令
```bash
# 安裝相依套件
npm install

# 啟動開發伺服器
npm run dev

# 建置專案
npm run build

# 執行測試
npm test

# 執行特定測試檔案
npm test -- [test-file-name]

# 程式碼格式化
npm run format

# 程式碼檢查
npm run lint

# 型別檢查 (如使用 TypeScript)
npm run typecheck
```

## 重要設定檔案

- `package.json`: 專案相依性和腳本設定
- `mcp-templates.json`: MCP 伺服器模板定義
- `config-schema.json`: MCP 配置檔案結構定義

## MCP 整合重點

### 支援的 MCP 伺服器類型
- 檔案系統伺服器
- 資料庫連接器
- API 整合工具
- 自訂工具伺服器

### 配置產生邏輯
- 根據使用者選擇的工具類型產生對應的配置
- 驗證必填參數和選填參數
- 提供即時預覽和錯誤檢查

### 匯出格式
- JSON 配置檔案
- 環境變數設定
- CLI 安裝指令

## 開發注意事項

- MCP 配置必須遵循官方規範
- 確保所有產生的配置都經過驗證
- 提供清楚的錯誤訊息和使用指導
- 支援匯入現有的 MCP 配置進行編輯