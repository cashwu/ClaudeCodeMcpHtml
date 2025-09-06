/**
 * MCP 指令產生器主要邏輯
 */

class MCPGenerator {
    constructor() {
        this.elements = {};
        this.currentExample = null;
        this.debounceTimer = null;
        
        this.init();
    }

    /**
     * 初始化應用程式
     */
    init() {
        this.bindElements();
        this.bindEvents();
        this.setupExamples();
        this.addInitialEnvVar();
        
        // 初始產生指令
        this.generateCommand();
    }

    /**
     * 綁定 DOM 元素
     */
    bindElements() {
        this.elements = {
            // 輸入元素
            serverName: document.getElementById('serverName'),
            jsonInput: document.getElementById('jsonInput'),
            scope: document.getElementById('scope'),
            autoDetectType: document.getElementById('autoDetectType'),
            serverType: document.getElementById('serverType'),
            manualServerType: document.getElementById('manualServerType'),
            
            // 環境變數區域
            envVars: document.getElementById('envVars'),
            addEnvVar: document.getElementById('addEnvVar'),
            
            // 輸出元素
            commandOutput: document.getElementById('commandOutput'),
            copyCommand: document.getElementById('copyCommand'),
            generateCommand: document.getElementById('generateCommand'),
            
            // 訊息元素
            errorMessage: document.getElementById('errorMessage'),
            successMessage: document.getElementById('successMessage'),
            
            // 範例元素
            tabBtns: document.querySelectorAll('.tab-btn'),
            exampleTabs: document.querySelectorAll('.example-tab'),
            useExampleBtns: document.querySelectorAll('.use-example-btn')
        };
    }

    /**
     * 綁定事件監聽器
     */
    bindEvents() {
        // 輸入變更事件
        this.elements.serverName.addEventListener('input', () => this.onInputChange());
        this.elements.jsonInput.addEventListener('input', () => this.onInputChange());
        this.elements.scope.addEventListener('change', () => this.onInputChange());
        this.elements.autoDetectType.addEventListener('change', () => {
            this.toggleServerTypeSelector();
            this.onInputChange();
        });
        this.elements.serverType.addEventListener('change', () => this.onInputChange());
        
        // 環境變數管理
        this.elements.addEnvVar.addEventListener('click', () => this.addEnvironmentVariable());
        this.elements.envVars.addEventListener('click', (e) => {
            if (e.target.classList.contains('remove-env')) {
                this.removeEnvironmentVariable(e.target);
            }
        });
        this.elements.envVars.addEventListener('input', () => this.onInputChange());
        
        // 按鈕事件
        this.elements.copyCommand.addEventListener('click', () => this.copyToClipboard());
        this.elements.generateCommand.addEventListener('click', () => this.generateCommand());
        
        // 範例標籤事件
        this.elements.tabBtns.forEach(btn => {
            btn.addEventListener('click', () => this.switchTab(btn.dataset.tab));
        });
        
        // 使用範例按鈕事件
        this.elements.useExampleBtns.forEach(btn => {
            btn.addEventListener('click', () => this.useExample(btn.dataset.example));
        });
        
        // 鍵盤快捷鍵
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.generateCommand();
                } else if (e.key === 'k') {
                    e.preventDefault();
                    this.copyToClipboard();
                }
            }
        });
    }

    /**
     * 輸入變更處理（防抖動）
     */
    onInputChange() {
        clearTimeout(this.debounceTimer);
        this.debounceTimer = setTimeout(() => {
            this.generateCommand();
        }, 300);
    }

    /**
     * 切換伺服器類型選擇器顯示/隱藏
     */
    toggleServerTypeSelector() {
        const isAutoDetect = this.elements.autoDetectType.checked;
        this.elements.manualServerType.style.display = isAutoDetect ? 'none' : 'block';
    }

    /**
     * 產生指令
     */
    generateCommand() {
        try {
            this.hideMessages();
            
            const serverName = this.elements.serverName.value.trim();
            const jsonInput = this.elements.jsonInput.value.trim();
            
            if (!jsonInput) {
                this.updateOutput('請輸入 JSON 設定以產生指令...');
                return;
            }

            // 驗證輸入
            const validation = mcpValidator.validateInput(jsonInput, serverName);
            if (!validation.valid) {
                this.showError(this.formatValidationErrors(validation));
                this.updateOutput('輸入有誤，請檢查上方錯誤訊息。');
                return;
            }

            // 顯示警告訊息（如果有）
            if (validation.warnings.length > 0) {
                this.showWarning(validation.warnings.join('\n'));
            }

            // 取得選項
            const options = this.getOptions();
            
            // 轉換指令
            const result = mcpConverter.convert(jsonInput, serverName, options);
            
            if (result.success) {
                this.updateOutput(result.command);
                
                // 顯示伺服器資訊
                this.showServerInfo(result);
            } else {
                this.showError(result.error);
                this.updateOutput('轉換失敗，請檢查輸入格式。');
            }
            
        } catch (error) {
            console.error('產生指令時發生錯誤:', error);
            this.showError(`發生未預期的錯誤: ${error.message}`);
        }
    }

    /**
     * 取得使用者選項
     */
    getOptions() {
        return {
            scope: this.elements.scope.value,
            envVars: this.getEnvironmentVariables(),
            autoDetectType: this.elements.autoDetectType.checked,
            manualServerType: this.elements.autoDetectType.checked ? null : this.elements.serverType.value
        };
    }

    /**
     * 取得環境變數
     */
    getEnvironmentVariables() {
        const envVars = {};
        const envItems = this.elements.envVars.querySelectorAll('.env-var-item');
        
        envItems.forEach(item => {
            const key = item.querySelector('.env-key').value.trim();
            const value = item.querySelector('.env-value').value.trim();
            
            if (key && value) {
                envVars[key] = value;
            }
        });
        
        return envVars;
    }

    /**
     * 更新輸出顯示
     */
    updateOutput(command) {
        // 直接設定為純文字，避免語法高亮造成的問題
        this.elements.commandOutput.textContent = command;
    }

    /**
     * 複製到剪貼簿
     */
    async copyToClipboard() {
        try {
            const command = this.elements.commandOutput.textContent;
            
            if (!command || command.includes('請輸入') || command.includes('輸入有誤')) {
                this.showError('沒有可複製的指令');
                return;
            }

            await navigator.clipboard.writeText(command);
            this.showSuccess('指令已複製到剪貼簿！');
            
            // 視覺反饋
            this.elements.copyCommand.textContent = '✅ 已複製';
            setTimeout(() => {
                this.elements.copyCommand.textContent = '📋 複製指令';
            }, 2000);
            
        } catch (error) {
            console.error('複製失敗:', error);
            this.showError('複製失敗，請手動選取並複製');
        }
    }

    /**
     * 新增環境變數欄位
     */
    addEnvironmentVariable() {
        const envVarItem = document.createElement('div');
        envVarItem.className = 'env-var-item';
        envVarItem.innerHTML = `
            <input type="text" placeholder="變數名" class="env-key" />
            <input type="text" placeholder="變數值" class="env-value" />
            <button type="button" class="remove-env">×</button>
        `;
        
        this.elements.envVars.appendChild(envVarItem);
        
        // 綁定新增的輸入欄位事件
        const inputs = envVarItem.querySelectorAll('input');
        inputs.forEach(input => {
            input.addEventListener('input', () => this.onInputChange());
        });
        
        // 聚焦到新增的欄位
        envVarItem.querySelector('.env-key').focus();
    }

    /**
     * 移除環境變數欄位
     */
    removeEnvironmentVariable(button) {
        const envVarItem = button.parentElement;
        envVarItem.remove();
        this.onInputChange();
    }

    /**
     * 新增初始的環境變數欄位
     */
    addInitialEnvVar() {
        // 如果沒有環境變數欄位，新增一個
        if (this.elements.envVars.children.length === 0) {
            this.addEnvironmentVariable();
        }
    }

    /**
     * 切換範例標籤
     */
    switchTab(tabName) {
        // 更新標籤按鈕狀態
        this.elements.tabBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });
        
        // 更新內容顯示
        this.elements.exampleTabs.forEach(tab => {
            tab.classList.toggle('active', tab.id === `${tabName}-example`);
        });
    }

    /**
     * 使用範例
     */
    useExample(exampleName) {
        const examples = this.getExampleData();
        const example = examples[exampleName];
        
        if (example) {
            this.elements.serverName.value = example.serverName;
            this.elements.jsonInput.value = JSON.stringify(example.config, null, 2);
            
            // 設定環境變數
            if (example.envVars) {
                this.setEnvironmentVariables(example.envVars);
            }
            
            // 設定範圍
            if (example.scope) {
                this.elements.scope.value = example.scope;
            }
            
            this.generateCommand();
            this.showSuccess(`已載入 ${example.displayName} 範例`);
        }
    }

    /**
     * 設定環境變數
     */
    setEnvironmentVariables(envVars) {
        // 清空現有的環境變數
        this.elements.envVars.innerHTML = '';
        
        // 新增環境變數
        Object.entries(envVars).forEach(([key, value]) => {
            this.addEnvironmentVariable();
            const lastItem = this.elements.envVars.lastElementChild;
            lastItem.querySelector('.env-key').value = key;
            lastItem.querySelector('.env-value').value = value;
        });
        
        // 如果沒有環境變數，新增一個空的
        if (Object.keys(envVars).length === 0) {
            this.addEnvironmentVariable();
        }
    }

    /**
     * 取得範例資料
     */
    getExampleData() {
        return {
            airtable: {
                serverName: 'airtable',
                displayName: 'Airtable',
                config: {
                    command: 'npx',
                    args: ['-y', 'airtable-mcp-server'],
                    env: {
                        AIRTABLE_API_KEY: '${AIRTABLE_API_KEY}'
                    }
                },
                scope: 'project',
                envVars: {
                    AIRTABLE_API_KEY: 'your_airtable_api_key'
                }
            },
            linear: {
                serverName: 'linear',
                displayName: 'Linear',
                config: {
                    type: 'sse',
                    url: 'https://mcp.linear.app/sse',
                    headers: {
                        Authorization: 'Bearer ${LINEAR_TOKEN}'
                    }
                },
                scope: 'project',
                envVars: {
                    LINEAR_TOKEN: 'your_linear_token'
                }
            },
            http: {
                serverName: 'api-server',
                displayName: 'HTTP API',
                config: {
                    type: 'http',
                    url: 'https://api.example.com/mcp',
                    headers: {
                        Authorization: 'Bearer ${API_TOKEN}',
                        'Content-Type': 'application/json'
                    }
                },
                scope: 'user',
                envVars: {
                    API_TOKEN: 'your_api_token'
                }
            }
        };
    }

    /**
     * 設定範例
     */
    setupExamples() {
        // 範例已在 HTML 中定義，這裡只需要確保事件綁定正確
        console.log('範例設定完成');
    }

    /**
     * 顯示伺服器資訊
     */
    showServerInfo(result) {
        const info = [
            `伺服器類型: ${result.serverType.toUpperCase()}`,
            result.config.url ? `URL: ${result.config.url}` : null,
            result.config.command ? `指令: ${result.config.command}` : null
        ].filter(Boolean);
        
        console.log('伺服器資訊:', info.join(' | '));
    }

    /**
     * 格式化驗證錯誤訊息
     */
    formatValidationErrors(validation) {
        const messages = [];
        
        if (validation.errors.length > 0) {
            messages.push('錯誤:');
            messages.push(...validation.errors.map(error => `• ${error}`));
        }
        
        if (validation.warnings.length > 0) {
            messages.push('\n警告:');
            messages.push(...validation.warnings.map(warning => `• ${warning}`));
        }
        
        if (validation.suggestions.length > 0) {
            messages.push('\n建議:');
            messages.push(...validation.suggestions.map(suggestion => `• ${suggestion}`));
        }
        
        return messages.join('\n');
    }

    /**
     * 顯示錯誤訊息
     */
    showError(message) {
        this.elements.errorMessage.textContent = message;
        this.elements.errorMessage.style.display = 'block';
        this.elements.successMessage.style.display = 'none';
        
        // 捲動到錯誤訊息
        this.elements.errorMessage.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    /**
     * 顯示警告訊息
     */
    showWarning(message) {
        // 警告訊息顯示在成功訊息區域，使用不同顏色
        this.elements.successMessage.textContent = `⚠️ ${message}`;
        this.elements.successMessage.style.display = 'block';
        this.elements.successMessage.style.background = '#fef3c7';
        this.elements.successMessage.style.borderColor = '#fcd34d';
        this.elements.successMessage.style.color = '#92400e';
    }

    /**
     * 顯示成功訊息
     */
    showSuccess(message) {
        this.elements.successMessage.textContent = `✅ ${message}`;
        this.elements.successMessage.style.display = 'block';
        this.elements.successMessage.style.background = '#f0fdf4';
        this.elements.successMessage.style.borderColor = '#bbf7d0';
        this.elements.successMessage.style.color = '#059669';
        this.elements.errorMessage.style.display = 'none';
        
        // 自動隱藏成功訊息
        setTimeout(() => {
            this.elements.successMessage.style.display = 'none';
        }, 3000);
    }

    /**
     * 隱藏所有訊息
     */
    hideMessages() {
        this.elements.errorMessage.style.display = 'none';
        this.elements.successMessage.style.display = 'none';
    }

    /**
     * 重置表單
     */
    reset() {
        this.elements.serverName.value = '';
        this.elements.jsonInput.value = '';
        this.elements.scope.value = '';
        this.elements.envVars.innerHTML = '';
        this.addInitialEnvVar();
        this.updateOutput('在此處會顯示產生的 Claude Code 指令...');
        this.hideMessages();
    }

    /**
     * 匯出設定為 JSON
     */
    exportConfig() {
        const config = {
            serverName: this.elements.serverName.value,
            jsonInput: this.elements.jsonInput.value,
            scope: this.elements.scope.value,
            envVars: this.getEnvironmentVariables()
        };
        
        const dataStr = JSON.stringify(config, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = 'mcp-generator-config.json';
        link.click();
        
        URL.revokeObjectURL(url);
    }

    /**
     * 匯入設定
     */
    importConfig(config) {
        try {
            this.elements.serverName.value = config.serverName || '';
            this.elements.jsonInput.value = config.jsonInput || '';
            this.elements.scope.value = config.scope || '';
            
            if (config.envVars) {
                this.setEnvironmentVariables(config.envVars);
            }
            
            this.generateCommand();
            this.showSuccess('設定已匯入');
        } catch (error) {
            this.showError(`匯入設定失敗: ${error.message}`);
        }
    }
}

// 當 DOM 載入完成時初始化應用程式
document.addEventListener('DOMContentLoaded', () => {
    window.mcpGenerator = new MCPGenerator();
    console.log('MCP 指令產生器已初始化');
});