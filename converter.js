/**
 * MCP JSON 設定檔到 Claude Code 指令的轉換器
 * 支援 stdio、SSE、HTTP 三種伺服器類型
 */

class MCPConverter {
    /**
     * 主要轉換方法
     * @param {string} jsonInput - JSON 輸入字串
     * @param {string} serverName - 伺服器名稱
     * @param {Object} options - 額外選項
     * @returns {Object} 轉換結果
     */
    convert(jsonInput, serverName, options = {}) {
        try {
            // 解析 JSON
            const config = this.parseJSON(jsonInput);
            
            // 提取伺服器設定
            const serverConfig = this.extractServerConfig(config, serverName);
            
            // 決定伺服器類型（手動指定優先於自動偵測）
            const serverType = options.manualServerType || this.detectServerType(serverConfig);
            
            // 產生指令
            const command = this.generateCommand(serverName, serverConfig, serverType, options);
            
            return {
                success: true,
                command: command,
                serverType: serverType,
                config: serverConfig
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                command: null
            };
        }
    }

    /**
     * 解析 JSON 輸入
     * @param {string} jsonInput - JSON 字串
     * @returns {Object} 解析後的物件
     */
    parseJSON(jsonInput) {
        if (!jsonInput.trim()) {
            throw new Error('請輸入 JSON 設定');
        }

        try {
            const parsed = JSON.parse(jsonInput);
            return parsed;
        } catch (error) {
            throw new Error(`JSON 格式錯誤: ${error.message}`);
        }
    }

    /**
     * 提取伺服器設定
     * @param {Object} config - 完整設定物件
     * @param {string} serverName - 伺服器名稱（使用者輸入，將用於 Claude Code 指令）
     * @returns {Object} 伺服器設定
     */
    extractServerConfig(config, serverName) {
        // 如果是完整的 .mcp.json 格式
        if (config.mcpServers) {
            const serverKeys = Object.keys(config.mcpServers);
            
            if (serverKeys.length === 0) {
                throw new Error('設定檔中未找到任何伺服器');
            }
            
            if (!serverName) {
                // 如果沒有指定伺服器名稱，使用第一個伺服器的鍵名作為名稱
                const firstServerKey = serverKeys[0];
                return {
                    name: firstServerKey,
                    config: config.mcpServers[firstServerKey]
                };
            }
            
            // 如果使用者指定了伺服器名稱，優先使用使用者的名稱
            // 但如果 JSON 中恰好有匹配的鍵，就使用該設定
            if (config.mcpServers[serverName]) {
                return {
                    name: serverName,
                    config: config.mcpServers[serverName]
                };
            }
            
            // 如果沒有匹配的鍵，但只有一個伺服器，使用該伺服器的設定
            if (serverKeys.length === 1) {
                return {
                    name: serverName, // 使用使用者指定的名稱
                    config: config.mcpServers[serverKeys[0]]
                };
            }
            
            // 如果有多個伺服器且沒有匹配的鍵，提示使用者選擇
            throw new Error(`設定檔中有多個伺服器 (${serverKeys.join(', ')})，請在伺服器名稱中指定其中一個，或使用單一伺服器設定`);
        }

        // 如果是單一伺服器設定
        if (!serverName) {
            throw new Error('單一伺服器設定需要指定伺服器名稱');
        }

        return {
            name: serverName,
            config: config
        };
    }

    /**
     * 偵測伺服器類型
     * @param {Object} serverConfig - 伺服器設定
     * @returns {string} 伺服器類型 (stdio/sse/http)
     */
    detectServerType(serverConfig) {
        const config = serverConfig.config;

        // 明確指定類型
        if (config.type) {
            return config.type.toLowerCase();
        }

        // 有 URL 的是遠端伺服器
        if (config.url) {
            // 改進的自動偵測邏輯
            const url = config.url.toLowerCase();
            if (url.includes('/sse') || url.includes('sse')) {
                return 'sse';
            }
            // 預設為 HTTP（更常見）
            return 'http';
        }

        // 檢查 mcp-remote 模式（URL 在 args 中）
        if (config.command === 'npx' && config.args) {
            const hasRemote = config.args.some(arg => 
                arg === 'mcp-remote' || arg.includes('mcp-remote')
            );
            
            if (hasRemote) {
                const url = this.extractUrlFromArgs(config.args);
                if (url) {
                    // 根據 URL 判斷類型
                    const urlLower = url.toLowerCase();
                    if (urlLower.includes('/sse') || urlLower.endsWith('/sse')) {
                        return 'sse';
                    }
                    return 'http';
                }
            }
        }

        // 有 command 的是 stdio 伺服器
        if (config.command) {
            return 'stdio';
        }

        throw new Error('無法偵測伺服器類型，請檢查設定格式');
    }

    /**
     * 從 args 陣列中提取 URL
     * @param {Array} args - 參數陣列
     * @returns {string|null} 找到的 URL 或 null
     */
    extractUrlFromArgs(args) {
        if (!Array.isArray(args)) return null;
        
        // 尋找 HTTP/HTTPS URL
        for (const arg of args) {
            if (typeof arg === 'string' && (arg.startsWith('http://') || arg.startsWith('https://'))) {
                return arg;
            }
        }
        
        return null;
    }

    /**
     * 產生 Claude Code 指令
     * @param {string} serverName - 伺服器名稱
     * @param {Object} serverConfig - 伺服器設定
     * @param {string} serverType - 伺服器類型
     * @param {Object} options - 額外選項
     * @returns {string} 完整指令
     */
    generateCommand(serverName, serverConfig, serverType, options) {
        const config = serverConfig.config;
        const parts = ['claude', 'mcp', 'add'];

        // 檢查是否為 mcp-remote 模式（即使 serverType 是 stdio）
        const isMcpRemote = config.command === 'npx' && 
                           config.args && 
                           config.args.some(arg => arg === 'mcp-remote' || arg.includes('mcp-remote'));

        if (isMcpRemote && (serverType === 'sse' || serverType === 'http')) {
            // mcp-remote 模式，產生遠端伺服器指令
            const url = this.extractUrlFromArgs(config.args);
            if (url) {
                return this.generateMcpRemoteCommand(parts, serverName, url, serverType, options);
            }
        }

        switch (serverType) {
            case 'stdio':
                return this.generateStdioCommand(parts, serverName, config, options);
            case 'sse':
            case 'http':
                return this.generateRemoteCommand(parts, serverName, config, options, serverType);
            default:
                throw new Error(`不支援的伺服器類型: ${serverType}`);
        }
    }

    /**
     * 產生 mcp-remote 模式指令
     * @param {Array} parts - 指令部分
     * @param {string} serverName - 伺服器名稱
     * @param {string} url - 伺服器 URL
     * @param {string} serverType - 伺服器類型
     * @param {Object} options - 額外選項
     * @returns {string} 完整指令
     */
    generateMcpRemoteCommand(parts, serverName, url, serverType, options) {
        // 添加傳輸類型
        parts.push('--transport', serverType);

        // 添加伺服器名稱
        parts.push(serverName);

        // 添加 URL
        parts.push(url);

        // 添加選項
        this.addCommonOptions(parts, options);

        // 添加環境變數
        this.addEnvironmentVariables(parts, {}, options.envVars);

        return this.formatCommand(parts);
    }

    /**
     * 產生 stdio 伺服器指令
     * @param {Array} parts - 指令部分
     * @param {string} serverName - 伺服器名稱
     * @param {Object} config - 設定物件
     * @param {Object} options - 額外選項
     * @returns {string} 完整指令
     */
    generateStdioCommand(parts, serverName, config, options) {
        // 添加伺服器名稱
        parts.push(serverName);

        // 添加選項
        this.addCommonOptions(parts, options);
        
        // 添加環境變數
        this.addEnvironmentVariables(parts, config.env, options.envVars);

        // 添加雙破折號分隔符
        parts.push('--');

        // 添加執行指令
        if (!config.command) {
            throw new Error('stdio 伺服器必須指定 command');
        }
        
        parts.push(config.command);

        // 添加參數
        if (config.args && Array.isArray(config.args)) {
            parts.push(...config.args);
        }

        return this.formatCommand(parts);
    }

    /**
     * 產生遠端伺服器指令 (SSE/HTTP)
     * @param {Array} parts - 指令部分
     * @param {string} serverName - 伺服器名稱
     * @param {Object} config - 設定物件
     * @param {Object} options - 額外選項
     * @param {string} serverType - 伺服器類型
     * @returns {string} 完整指令
     */
    generateRemoteCommand(parts, serverName, config, options, serverType) {
        // 添加傳輸類型
        parts.push('--transport', serverType);

        // 添加伺服器名稱
        parts.push(serverName);

        // 添加 URL
        if (!config.url) {
            throw new Error(`${serverType.toUpperCase()} 伺服器必須指定 url`);
        }
        parts.push(config.url);

        // 添加選項
        this.addCommonOptions(parts, options);

        // 添加環境變數
        this.addEnvironmentVariables(parts, config.env, options.envVars);

        // 添加 HTTP 標頭
        this.addHeaders(parts, config.headers);

        return this.formatCommand(parts);
    }

    /**
     * 添加通用選項
     * @param {Array} parts - 指令部分
     * @param {Object} options - 選項
     */
    addCommonOptions(parts, options) {
        // 添加範圍設定
        if (options.scope && options.scope !== 'local') {
            parts.push('--scope', options.scope);
        }
    }

    /**
     * 添加環境變數
     * @param {Array} parts - 指令部分
     * @param {Object} configEnv - 設定檔中的環境變數
     * @param {Object} optionsEnv - 額外的環境變數
     */
    addEnvironmentVariables(parts, configEnv, optionsEnv) {
        const allEnvVars = { ...configEnv };

        // 合併額外的環境變數
        if (optionsEnv) {
            Object.assign(allEnvVars, optionsEnv);
        }

        // 添加環境變數參數
        for (const [key, value] of Object.entries(allEnvVars)) {
            if (key && value) {
                parts.push('--env', `${key}=${value}`);
            }
        }
    }

    /**
     * 添加 HTTP 標頭
     * @param {Array} parts - 指令部分
     * @param {Object} headers - 標頭物件
     */
    addHeaders(parts, headers) {
        if (headers && typeof headers === 'object') {
            for (const [key, value] of Object.entries(headers)) {
                if (key && value) {
                    parts.push('--header', `"${key}: ${value}"`);
                }
            }
        }
    }

    /**
     * 格式化指令輸出
     * @param {Array} parts - 指令部分
     * @returns {string} 格式化後的指令
     */
    formatCommand(parts) {
        // 處理需要引號的參數
        const formatted = parts.map(part => {
            // 如果包含空格或特殊字符，添加引號
            if (typeof part === 'string' && (part.includes(' ') || part.includes('$'))) {
                // 檢查是否已經有引號
                if (!part.startsWith('"') && !part.endsWith('"')) {
                    return `"${part}"`;
                }
            }
            return part;
        });

        return formatted.join(' ');
    }

    /**
     * 驗證設定格式
     * @param {Object} config - 設定物件
     * @returns {Object} 驗證結果
     */
    validateConfig(config) {
        const issues = [];

        if (!config) {
            issues.push('設定不能為空');
            return { valid: false, issues };
        }

        // 檢查是否為完整的 .mcp.json 格式
        if (config.mcpServers) {
            if (typeof config.mcpServers !== 'object') {
                issues.push('mcpServers 必須是物件');
            } else if (Object.keys(config.mcpServers).length === 0) {
                issues.push('mcpServers 不能為空');
            }
        } else {
            // 單一伺服器設定驗證
            this.validateSingleServerConfig(config, issues);
        }

        return {
            valid: issues.length === 0,
            issues: issues
        };
    }

    /**
     * 驗證單一伺服器設定
     * @param {Object} config - 伺服器設定
     * @param {Array} issues - 問題列表
     */
    validateSingleServerConfig(config, issues) {
        const hasCommand = config.command;
        const hasUrl = config.url;
        const hasType = config.type;

        if (!hasCommand && !hasUrl) {
            issues.push('必須指定 command（stdio伺服器）或 url（遠端伺服器）');
        }

        if (hasUrl && !hasType) {
            issues.push('遠端伺服器建議指定 type (sse 或 http)');
        }

        if (hasCommand && hasUrl) {
            issues.push('不能同時指定 command 和 url');
        }

        // 驗證環境變數格式
        if (config.env && typeof config.env !== 'object') {
            issues.push('env 必須是物件');
        }

        // 驗證標頭格式
        if (config.headers && typeof config.headers !== 'object') {
            issues.push('headers 必須是物件');
        }

        // 驗證參數格式
        if (config.args && !Array.isArray(config.args)) {
            issues.push('args 必須是陣列');
        }
    }

    /**
     * 取得伺服器資訊摘要
     * @param {Object} config - 設定物件
     * @param {string} serverName - 伺服器名稱
     * @returns {Object} 伺服器資訊
     */
    getServerInfo(config, serverName) {
        try {
            const serverConfig = this.extractServerConfig(config, serverName);
            const serverType = this.detectServerType(serverConfig);
            
            return {
                name: serverConfig.name,
                type: serverType,
                hasEnvVars: !!(serverConfig.config.env && Object.keys(serverConfig.config.env).length > 0),
                hasHeaders: !!(serverConfig.config.headers && Object.keys(serverConfig.config.headers).length > 0),
                hasArgs: !!(serverConfig.config.args && serverConfig.config.args.length > 0),
                url: serverConfig.config.url || null,
                command: serverConfig.config.command || null
            };
        } catch (error) {
            return {
                error: error.message
            };
        }
    }
}

// 建立全域實例
const mcpConverter = new MCPConverter();