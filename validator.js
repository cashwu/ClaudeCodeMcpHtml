/**
 * MCP JSON 設定檔驗證器
 * 提供詳細的驗證和錯誤訊息
 */

class MCPValidator {
    /**
     * 驗證完整的輸入
     * @param {string} jsonInput - JSON 輸入字串
     * @param {string} serverName - 伺服器名稱
     * @returns {Object} 驗證結果
     */
    validateInput(jsonInput, serverName) {
        const result = {
            valid: true,
            errors: [],
            warnings: [],
            suggestions: []
        };

        try {
            // 驗證 JSON 格式
            const jsonValidation = this.validateJSON(jsonInput);
            if (!jsonValidation.valid) {
                result.valid = false;
                result.errors.push(...jsonValidation.errors);
                return result;
            }

            const config = JSON.parse(jsonInput);

            // 驗證設定結構
            const structureValidation = this.validateStructure(config, serverName);
            result.errors.push(...structureValidation.errors);
            result.warnings.push(...structureValidation.warnings);
            result.suggestions.push(...structureValidation.suggestions);

            // 如果有錯誤，標記為無效
            if (result.errors.length > 0) {
                result.valid = false;
            }

        } catch (error) {
            result.valid = false;
            result.errors.push(`驗證過程發生錯誤: ${error.message}`);
        }

        return result;
    }

    /**
     * 驗證 JSON 格式
     * @param {string} jsonInput - JSON 輸入字串
     * @returns {Object} 驗證結果
     */
    validateJSON(jsonInput) {
        const result = {
            valid: true,
            errors: []
        };

        if (!jsonInput || !jsonInput.trim()) {
            result.valid = false;
            result.errors.push('請輸入 JSON 設定');
            return result;
        }

        try {
            JSON.parse(jsonInput);
        } catch (error) {
            result.valid = false;
            
            // 提供更友善的錯誤訊息
            const errorMessage = error.message.toLowerCase();
            if (errorMessage.includes('unexpected token')) {
                result.errors.push('JSON 格式錯誤：可能有多餘的逗號、缺少引號或括號不匹配');
            } else if (errorMessage.includes('unexpected end')) {
                result.errors.push('JSON 格式錯誤：可能缺少結束的括號或引號');
            } else {
                result.errors.push(`JSON 格式錯誤: ${error.message}`);
            }
        }

        return result;
    }

    /**
     * 驗證設定結構
     * @param {Object} config - 解析後的設定物件
     * @param {string} serverName - 伺服器名稱
     * @returns {Object} 驗證結果
     */
    validateStructure(config, serverName) {
        const result = {
            errors: [],
            warnings: [],
            suggestions: []
        };

        // 先檢查常見錯誤格式
        const formatCheck = this.checkCommonMistakes(config);
        if (!formatCheck.valid) {
            result.errors.push(...formatCheck.errors);
            result.suggestions.push(...formatCheck.suggestions);
            return result;
        }

        // 判斷是完整設定檔還是單一伺服器設定
        if (config.mcpServers) {
            this.validateFullConfig(config, serverName, result);
        } else {
            this.validateSingleServerConfig(config, serverName, result);
        }

        return result;
    }

    /**
     * 檢查常見的格式錯誤
     * @param {Object} config - 設定物件
     * @returns {Object} 檢查結果
     */
    checkCommonMistakes(config) {
        const result = {
            valid: true,
            errors: [],
            suggestions: []
        };

        // 檢查是否錯誤使用了 servers 而非 mcpServers
        if (config.servers) {
            result.valid = false;
            result.errors.push('設定檔使用了錯誤的鍵名 "servers"，應該使用 "mcpServers"');
            result.suggestions.push('請將 JSON 中的 "servers" 改為 "mcpServers"');
            result.suggestions.push('正確格式：{"mcpServers": {...}}');
            return result;
        }

        // 檢查其他常見錯誤變體
        const commonMistakes = ['mcp_servers', 'mcpServer', 'server', 'mcpServers_'];
        for (const mistake of commonMistakes) {
            if (config[mistake]) {
                result.valid = false;
                result.errors.push(`設定檔使用了錯誤的鍵名 "${mistake}"，應該使用 "mcpServers"`);
                result.suggestions.push(`請將 JSON 中的 "${mistake}" 改為 "mcpServers"`);
                return result;
            }
        }

        // 檢查是否為有效的設定格式
        if (!config.mcpServers && !this.isValidSingleServerConfig(config)) {
            // 如果不是完整設定檔，也不是有效的單一伺服器設定
            const keys = Object.keys(config);
            if (keys.length > 0 && !keys.some(key => ['command', 'url', 'type'].includes(key))) {
                result.valid = false;
                result.errors.push('JSON 格式不符合 MCP 規範');
                result.suggestions.push('完整設定檔格式：{"mcpServers": {"server-name": {...}}}');
                result.suggestions.push('單一伺服器設定格式：{"command": "...", "args": [...]} 或 {"url": "...", "type": "..."}');
                return result;
            }
        }

        return result;
    }

    /**
     * 檢查是否為有效的單一伺服器設定
     * @param {Object} config - 設定物件
     * @returns {boolean} 是否有效
     */
    isValidSingleServerConfig(config) {
        // 檢查是否有 stdio 伺服器的關鍵欄位
        if (config.command) return true;
        
        // 檢查是否有遠端伺服器的關鍵欄位
        if (config.url) return true;
        
        // 檢查是否有其他有效的 MCP 欄位
        const validFields = ['command', 'args', 'env', 'type', 'url', 'headers'];
        const configKeys = Object.keys(config);
        
        return configKeys.some(key => validFields.includes(key));
    }

    /**
     * 驗證完整的 .mcp.json 設定檔
     * @param {Object} config - 設定物件
     * @param {string} serverName - 伺服器名稱
     * @param {Object} result - 驗證結果物件
     */
    validateFullConfig(config, serverName, result) {
        if (typeof config.mcpServers !== 'object' || config.mcpServers === null) {
            result.errors.push('mcpServers 必須是物件');
            return;
        }

        const serverNames = Object.keys(config.mcpServers);
        
        if (serverNames.length === 0) {
            result.errors.push('mcpServers 不能為空');
            return;
        }

        // 如果指定了伺服器名稱
        if (serverName) {
            // 檢查是否有匹配的伺服器設定
            if (config.mcpServers[serverName]) {
                // 伺服器名稱恰好匹配 JSON 中的鍵名
                this.validateServerEntry(config.mcpServers[serverName], serverName, result);
            } else if (serverNames.length === 1) {
                // 只有一個伺服器，使用該設定（伺服器名稱可以不匹配）
                const serverKey = serverNames[0];
                this.validateServerEntry(config.mcpServers[serverKey], serverName, result);
                result.suggestions.push(`使用設定檔中的 "${serverKey}" 伺服器設定，指令中將使用名稱 "${serverName}"`);
            } else {
                // 多個伺服器但沒有匹配的鍵名
                result.errors.push(`設定檔中有多個伺服器，請指定要使用的伺服器設定`);
                result.suggestions.push(`可用的伺服器設定: ${serverNames.join(', ')}`);
                return;
            }
        } else {
            // 如果沒指定伺服器名稱，驗證第一個
            const firstServerName = serverNames[0];
            this.validateServerEntry(config.mcpServers[firstServerName], firstServerName, result);
            
            if (serverNames.length > 1) {
                result.warnings.push(`設定檔包含多個伺服器，將使用第一個: "${firstServerName}"`);
                result.suggestions.push(`其他可用伺服器: ${serverNames.slice(1).join(', ')}`);
            }
        }
    }

    /**
     * 驗證單一伺服器設定
     * @param {Object} config - 伺服器設定
     * @param {string} serverName - 伺服器名稱
     * @param {Object} result - 驗證結果物件
     */
    validateSingleServerConfig(config, serverName, result) {
        if (!serverName || !serverName.trim()) {
            result.errors.push('使用單一伺服器設定時必須指定伺服器名稱');
            return;
        }

        this.validateServerEntry(config, serverName, result);
    }

    /**
     * 驗證單一伺服器條目
     * @param {Object} serverConfig - 伺服器設定
     * @param {string} serverName - 伺服器名稱
     * @param {Object} result - 驗證結果物件
     */
    validateServerEntry(serverConfig, serverName, result) {
        if (typeof serverConfig !== 'object' || serverConfig === null) {
            result.errors.push(`伺服器 "${serverName}" 的設定必須是物件`);
            return;
        }

        // 偵測伺服器類型並驗證
        const serverType = this.detectServerType(serverConfig);
        
        switch (serverType) {
            case 'stdio':
                this.validateStdioServer(serverConfig, serverName, result);
                break;
            case 'sse':
            case 'http':
                this.validateRemoteServer(serverConfig, serverName, serverType, result);
                break;
            case 'unknown':
                result.errors.push(`無法判斷伺服器 "${serverName}" 的類型`);
                result.suggestions.push('stdio 伺服器需要 command，遠端伺服器需要 url 和 type');
                break;
        }

        // 驗證通用欄位
        this.validateCommonFields(serverConfig, serverName, result);
    }

    /**
     * 偵測伺服器類型
     * @param {Object} serverConfig - 伺服器設定
     * @returns {string} 伺服器類型
     */
    detectServerType(serverConfig) {
        if (serverConfig.type) {
            return serverConfig.type.toLowerCase();
        }

        if (serverConfig.url) {
            return 'sse'; // 預設為 SSE
        }

        if (serverConfig.command) {
            return 'stdio';
        }

        return 'unknown';
    }

    /**
     * 驗證 stdio 伺服器
     * @param {Object} serverConfig - 伺服器設定
     * @param {string} serverName - 伺服器名稱
     * @param {Object} result - 驗證結果物件
     */
    validateStdioServer(serverConfig, serverName, result) {
        // 必要欄位：command
        if (!serverConfig.command) {
            result.errors.push(`stdio 伺服器 "${serverName}" 必須指定 command`);
        } else if (typeof serverConfig.command !== 'string') {
            result.errors.push(`伺服器 "${serverName}" 的 command 必須是字串`);
        }

        // 檢查不應該有的欄位
        if (serverConfig.url) {
            result.warnings.push(`stdio 伺服器 "${serverName}" 不需要 url 欄位`);
        }

        if (serverConfig.headers) {
            result.warnings.push(`stdio 伺服器 "${serverName}" 不需要 headers 欄位`);
        }

        // 驗證 args 欄位
        if (serverConfig.args) {
            if (!Array.isArray(serverConfig.args)) {
                result.errors.push(`伺服器 "${serverName}" 的 args 必須是陣列`);
            } else {
                const invalidArgs = serverConfig.args.filter(arg => typeof arg !== 'string');
                if (invalidArgs.length > 0) {
                    result.errors.push(`伺服器 "${serverName}" 的 args 中包含非字串項目`);
                }
            }
        }
    }

    /**
     * 驗證遠端伺服器 (SSE/HTTP)
     * @param {Object} serverConfig - 伺服器設定
     * @param {string} serverName - 伺服器名稱
     * @param {string} serverType - 伺服器類型
     * @param {Object} result - 驗證結果物件
     */
    validateRemoteServer(serverConfig, serverName, serverType, result) {
        // 必要欄位：url
        if (!serverConfig.url) {
            result.errors.push(`${serverType.toUpperCase()} 伺服器 "${serverName}" 必須指定 url`);
        } else {
            if (typeof serverConfig.url !== 'string') {
                result.errors.push(`伺服器 "${serverName}" 的 url 必須是字串`);
            } else {
                // 驗證 URL 格式
                try {
                    new URL(serverConfig.url);
                } catch (error) {
                    result.errors.push(`伺服器 "${serverName}" 的 url 格式不正確`);
                }
            }
        }

        // 檢查不應該有的欄位
        if (serverConfig.command) {
            result.warnings.push(`遠端伺服器 "${serverName}" 不需要 command 欄位`);
        }

        if (serverConfig.args) {
            result.warnings.push(`遠端伺服器 "${serverName}" 不需要 args 欄位`);
        }

        // 驗證 headers 欄位
        if (serverConfig.headers) {
            this.validateHeaders(serverConfig.headers, serverName, result);
        }

        // 建議指定 type
        if (!serverConfig.type) {
            result.suggestions.push(`建議為遠端伺服器 "${serverName}" 明確指定 type (sse 或 http)`);
        }
    }

    /**
     * 驗證通用欄位
     * @param {Object} serverConfig - 伺服器設定
     * @param {string} serverName - 伺服器名稱
     * @param {Object} result - 驗證結果物件
     */
    validateCommonFields(serverConfig, serverName, result) {
        // 驗證環境變數
        if (serverConfig.env) {
            this.validateEnvironmentVariables(serverConfig.env, serverName, result);
        }

        // 檢查無效的欄位
        const validFields = ['command', 'args', 'env', 'type', 'url', 'headers'];
        const invalidFields = Object.keys(serverConfig).filter(field => !validFields.includes(field));
        
        if (invalidFields.length > 0) {
            result.warnings.push(`伺服器 "${serverName}" 包含未知欄位: ${invalidFields.join(', ')}`);
        }
    }

    /**
     * 驗證環境變數
     * @param {Object} env - 環境變數物件
     * @param {string} serverName - 伺服器名稱
     * @param {Object} result - 驗證結果物件
     */
    validateEnvironmentVariables(env, serverName, result) {
        if (typeof env !== 'object' || env === null) {
            result.errors.push(`伺服器 "${serverName}" 的 env 必須是物件`);
            return;
        }

        for (const [key, value] of Object.entries(env)) {
            if (typeof key !== 'string' || !key.trim()) {
                result.errors.push(`伺服器 "${serverName}" 的環境變數鍵必須是非空字串`);
            }

            if (typeof value !== 'string') {
                result.errors.push(`伺服器 "${serverName}" 的環境變數 "${key}" 值必須是字串`);
            }

            // 檢查環境變數展開語法
            if (typeof value === 'string' && value.includes('${')) {
                const matches = value.match(/\$\{([^}]+)\}/g);
                if (matches) {
                    matches.forEach(match => {
                        const varName = match.slice(2, -1);
                        if (varName.includes(':-')) {
                            // 預設值語法 ${VAR:-default}
                            const [name, defaultVal] = varName.split(':-');
                            if (!name.trim()) {
                                result.errors.push(`環境變數 "${key}" 中的展開語法錯誤：變數名不能為空`);
                            }
                        } else if (!varName.trim()) {
                            result.errors.push(`環境變數 "${key}" 中的展開語法錯誤：變數名不能為空`);
                        }
                    });
                }
            }
        }
    }

    /**
     * 驗證 HTTP 標頭
     * @param {Object} headers - 標頭物件
     * @param {string} serverName - 伺服器名稱
     * @param {Object} result - 驗證結果物件
     */
    validateHeaders(headers, serverName, result) {
        if (typeof headers !== 'object' || headers === null) {
            result.errors.push(`伺服器 "${serverName}" 的 headers 必須是物件`);
            return;
        }

        for (const [key, value] of Object.entries(headers)) {
            if (typeof key !== 'string' || !key.trim()) {
                result.errors.push(`伺服器 "${serverName}" 的標頭鍵必須是非空字串`);
            }

            if (typeof value !== 'string') {
                result.errors.push(`伺服器 "${serverName}" 的標頭 "${key}" 值必須是字串`);
            }

            // 檢查常見標頭格式
            if (key.toLowerCase() === 'authorization' && typeof value === 'string') {
                if (!value.includes('Bearer') && !value.includes('${')) {
                    result.suggestions.push(`標頭 "Authorization" 通常使用 "Bearer token" 格式`);
                }
            }
        }
    }

    /**
     * 驗證伺服器名稱
     * @param {string} serverName - 伺服器名稱
     * @returns {Object} 驗證結果
     */
    validateServerName(serverName) {
        const result = {
            valid: true,
            errors: [],
            warnings: [],
            suggestions: []
        };

        if (!serverName || !serverName.trim()) {
            result.valid = false;
            result.errors.push('請輸入伺服器名稱');
            return result;
        }

        const trimmedName = serverName.trim();

        // 檢查字符
        if (!/^[a-zA-Z0-9_-]+$/.test(trimmedName)) {
            result.warnings.push('伺服器名稱建議只使用字母、數字、底線和連字號');
        }

        // 檢查長度
        if (trimmedName.length > 50) {
            result.warnings.push('伺服器名稱建議不超過50個字符');
        }

        // 檢查是否以數字開頭
        if (/^[0-9]/.test(trimmedName)) {
            result.warnings.push('伺服器名稱建議不要以數字開頭');
        }

        return result;
    }

    /**
     * 取得修復建議
     * @param {Object} validationResult - 驗證結果
     * @returns {Array} 修復建議列表
     */
    getFixSuggestions(validationResult) {
        const suggestions = [];

        validationResult.errors.forEach(error => {
            if (error.includes('必須指定 command')) {
                suggestions.push('為 stdio 伺服器添加 "command" 欄位，例如: "command": "npx"');
            } else if (error.includes('必須指定 url')) {
                suggestions.push('為遠端伺服器添加 "url" 欄位，例如: "url": "https://api.example.com"');
            } else if (error.includes('JSON 格式錯誤')) {
                suggestions.push('檢查 JSON 語法：確保所有括號匹配、字串用引號包圍、最後一個項目後沒有逗號');
            }
        });

        return suggestions;
    }
}

// 建立全域實例
const mcpValidator = new MCPValidator();