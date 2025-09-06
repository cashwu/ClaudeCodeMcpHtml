/**
 * MCP 指令產生器測試資料
 * 包含各種真實的 MCP 伺服器設定範例
 */

const TEST_DATA = {
    // stdio 伺服器測試案例
    stdio: {
        // 開發工具
        airtable: {
            name: 'airtable',
            displayName: 'Airtable 資料庫',
            category: '資料庫',
            description: '連接 Airtable 資料庫進行資料操作',
            config: {
                command: 'npx',
                args: ['-y', 'airtable-mcp-server'],
                env: {
                    AIRTABLE_API_KEY: '${AIRTABLE_API_KEY}'
                }
            },
            expectedCommand: 'claude mcp add airtable --scope project --env AIRTABLE_API_KEY=${AIRTABLE_API_KEY} -- npx -y airtable-mcp-server',
            scope: 'project'
        },

        sentry: {
            name: 'sentry',
            displayName: 'Sentry 錯誤追蹤',
            category: '開發工具',
            description: '整合 Sentry 錯誤追蹤和監控',
            config: {
                command: 'npx',
                args: ['@sentry/mcp-server'],
                env: {
                    SENTRY_AUTH_TOKEN: '${SENTRY_AUTH_TOKEN}',
                    SENTRY_ORG: '${SENTRY_ORG}'
                }
            },
            expectedCommand: 'claude mcp add sentry --scope project --env SENTRY_AUTH_TOKEN=${SENTRY_AUTH_TOKEN} --env SENTRY_ORG=${SENTRY_ORG} -- npx @sentry/mcp-server',
            scope: 'project'
        },

        github: {
            name: 'github',
            displayName: 'GitHub 整合',
            category: '開發工具',
            description: '與 GitHub 儲存庫和問題追蹤整合',
            config: {
                command: 'npx',
                args: ['github-mcp-server'],
                env: {
                    GITHUB_TOKEN: '${GITHUB_PAT}'
                }
            },
            expectedCommand: 'claude mcp add github --scope user --env GITHUB_TOKEN=${GITHUB_PAT} -- npx github-mcp-server',
            scope: 'user'
        },

        postgres: {
            name: 'postgres',
            displayName: 'PostgreSQL 資料庫',
            category: '資料庫',
            description: '連接 PostgreSQL 資料庫',
            config: {
                command: 'npx',
                args: ['postgres-mcp-server'],
                env: {
                    DATABASE_URL: '${DATABASE_URL}',
                    POSTGRES_SCHEMA: 'public'
                }
            },
            expectedCommand: 'claude mcp add postgres --scope project --env DATABASE_URL=${DATABASE_URL} --env POSTGRES_SCHEMA=public -- npx postgres-mcp-server',
            scope: 'project'
        },

        stripe: {
            name: 'stripe',
            displayName: 'Stripe 支付',
            category: '支付服務',
            description: 'Stripe 支付處理整合',
            config: {
                command: 'npx',
                args: ['stripe-mcp-server'],
                env: {
                    STRIPE_SECRET_KEY: '${STRIPE_SECRET_KEY}'
                }
            },
            expectedCommand: 'claude mcp add stripe --scope project --env STRIPE_SECRET_KEY=${STRIPE_SECRET_KEY} -- npx stripe-mcp-server',
            scope: 'project'
        },

        notion: {
            name: 'notion',
            displayName: 'Notion 工作區',
            category: '文件管理',
            description: '連接 Notion 工作區和頁面',
            config: {
                command: 'npx',
                args: ['notion-mcp-server'],
                env: {
                    NOTION_TOKEN: '${NOTION_TOKEN}'
                }
            },
            expectedCommand: 'claude mcp add notion --scope user --env NOTION_TOKEN=${NOTION_TOKEN} -- npx notion-mcp-server',
            scope: 'user'
        }
    },

    // SSE 伺服器測試案例
    sse: {
        linear: {
            name: 'linear',
            displayName: 'Linear 專案管理',
            category: '專案管理',
            description: 'Linear 問題追蹤和專案管理',
            config: {
                type: 'sse',
                url: 'https://mcp.linear.app/sse',
                headers: {
                    Authorization: 'Bearer ${LINEAR_TOKEN}'
                }
            },
            expectedCommand: 'claude mcp add --transport sse linear https://mcp.linear.app/sse --scope project --header "Authorization: Bearer ${LINEAR_TOKEN}"',
            scope: 'project'
        },

        huggingface: {
            name: 'huggingface',
            displayName: 'Hugging Face',
            category: 'AI/ML',
            description: 'Hugging Face 模型和資料集',
            config: {
                type: 'sse',
                url: 'https://mcp.huggingface.co/sse',
                headers: {
                    Authorization: 'Bearer ${HF_TOKEN}',
                    'User-Agent': 'Claude-MCP-Client'
                }
            },
            expectedCommand: 'claude mcp add --transport sse huggingface https://mcp.huggingface.co/sse --scope user --header "Authorization: Bearer ${HF_TOKEN}" --header "User-Agent: Claude-MCP-Client"',
            scope: 'user'
        }
    },

    // HTTP 伺服器測試案例
    http: {
        atlassian: {
            name: 'atlassian',
            displayName: 'Atlassian 服務',
            category: '專案管理',
            description: 'Jira 和 Confluence 整合',
            config: {
                type: 'http',
                url: 'https://mcp.atlassian.com/api',
                headers: {
                    Authorization: 'Bearer ${ATLASSIAN_TOKEN}',
                    'Content-Type': 'application/json'
                }
            },
            expectedCommand: 'claude mcp add --transport http atlassian https://mcp.atlassian.com/api --scope project --header "Authorization: Bearer ${ATLASSIAN_TOKEN}" --header "Content-Type: application/json"',
            scope: 'project'
        },

        box: {
            name: 'box',
            displayName: 'Box 雲端儲存',
            category: '檔案管理',
            description: 'Box 雲端檔案儲存服務',
            config: {
                type: 'http',
                url: 'https://mcp.box.com/api/v1',
                headers: {
                    Authorization: 'Bearer ${BOX_ACCESS_TOKEN}'
                }
            },
            expectedCommand: 'claude mcp add --transport http box https://mcp.box.com/api/v1 --scope project --header "Authorization: Bearer ${BOX_ACCESS_TOKEN}"',
            scope: 'project'
        }
    },

    // 複雜設定測試案例
    complex: {
        // 多伺服器設定檔
        multiServer: {
            name: 'multi-server',
            displayName: '多伺服器設定',
            category: '測試',
            description: '包含多個伺服器的完整設定檔',
            config: {
                mcpServers: {
                    airtable: {
                        command: 'npx',
                        args: ['-y', 'airtable-mcp-server'],
                        env: {
                            AIRTABLE_API_KEY: '${AIRTABLE_API_KEY}'
                        }
                    },
                    linear: {
                        type: 'sse',
                        url: 'https://mcp.linear.app/sse',
                        headers: {
                            Authorization: 'Bearer ${LINEAR_TOKEN}'
                        }
                    },
                    postgres: {
                        command: 'npx',
                        args: ['postgres-mcp-server'],
                        env: {
                            DATABASE_URL: '${DATABASE_URL}',
                            POSTGRES_SCHEMA: '${POSTGRES_SCHEMA:-public}'
                        }
                    }
                }
            },
            expectedCommand: 'claude mcp add airtable --scope project --env AIRTABLE_API_KEY=${AIRTABLE_API_KEY} -- npx -y airtable-mcp-server',
            scope: 'project'
        },

        // 環境變數預設值測試
        envDefaults: {
            name: 'env-defaults',
            displayName: '環境變數預設值',
            category: '測試',
            description: '測試環境變數預設值語法',
            config: {
                command: 'npx',
                args: ['api-server'],
                env: {
                    API_URL: '${API_URL:-https://api.production.com}',
                    DEBUG: '${DEBUG:-false}',
                    TIMEOUT: '${REQUEST_TIMEOUT:-5000}',
                    PORT: '${SERVER_PORT:-3000}'
                }
            },
            expectedCommand: 'claude mcp add env-defaults --scope project --env API_URL=${API_URL:-https://api.production.com} --env DEBUG=${DEBUG:-false} --env TIMEOUT=${REQUEST_TIMEOUT:-5000} --env PORT=${SERVER_PORT:-3000} -- npx api-server',
            scope: 'project'
        },

        // 複雜參數測試
        complexArgs: {
            name: 'complex-args',
            displayName: '複雜參數設定',
            category: '測試',
            description: '測試複雜的參數組合',
            config: {
                command: '/usr/local/bin/node',
                args: ['/path/to/server.js', '--port', '3000', '--debug', '--timeout', '30000'],
                env: {
                    NODE_ENV: 'production',
                    LOG_LEVEL: 'info',
                    MAX_CONNECTIONS: '100'
                }
            },
            expectedCommand: 'claude mcp add complex-args --scope project --env NODE_ENV=production --env LOG_LEVEL=info --env MAX_CONNECTIONS=100 -- /usr/local/bin/node /path/to/server.js --port 3000 --debug --timeout 30000',
            scope: 'project'
        }
    },

    // 錯誤測試案例
    errors: {
        // 缺少必要欄位
        missingCommand: {
            name: 'missing-command',
            displayName: '缺少 command',
            category: '錯誤測試',
            description: 'stdio 伺服器缺少 command 欄位',
            config: {
                args: ['some-server'],
                env: {
                    API_KEY: 'test'
                }
            },
            expectError: true,
            expectedError: 'stdio 伺服器必須指定 command'
        },

        missingUrl: {
            name: 'missing-url',
            displayName: '缺少 URL',
            category: '錯誤測試',
            description: '遠端伺服器缺少 url 欄位',
            config: {
                type: 'sse',
                headers: {
                    Authorization: 'Bearer token'
                }
            },
            expectError: true,
            expectedError: 'SSE 伺服器必須指定 url'
        },

        invalidJson: {
            name: 'invalid-json',
            displayName: '無效 JSON',
            category: '錯誤測試',
            description: '格式錯誤的 JSON',
            config: '{ "command": "npx", "args": ["server"] }', // 缺少逗號的 JSON 字串
            expectError: true,
            expectedError: 'JSON 格式錯誤'
        },

        mixedConfig: {
            name: 'mixed-config',
            displayName: '混合設定錯誤',
            category: '錯誤測試',
            description: '同時指定 command 和 url',
            config: {
                command: 'npx',
                url: 'https://api.example.com',
                type: 'sse'
            },
            expectError: false, // 這會產生警告而非錯誤
            expectedWarning: '不能同時指定 command 和 url'
        }
    }
};

/**
 * 取得所有測試案例
 */
function getAllTestCases() {
    const allCases = [];
    
    Object.entries(TEST_DATA).forEach(([category, cases]) => {
        Object.entries(cases).forEach(([key, testCase]) => {
            allCases.push({
                id: `${category}-${key}`,
                category: category,
                ...testCase
            });
        });
    });
    
    return allCases;
}

/**
 * 取得特定類型的測試案例
 */
function getTestCasesByType(type) {
    return TEST_DATA[type] || {};
}

/**
 * 取得特定測試案例
 */
function getTestCase(category, name) {
    return TEST_DATA[category]?.[name] || null;
}

/**
 * 驗證測試案例
 */
function validateTestCase(testCase, generatedCommand) {
    if (testCase.expectError) {
        return {
            passed: false,
            expected: testCase.expectedError,
            actual: 'No error generated',
            type: 'error'
        };
    }
    
    if (testCase.expectedCommand) {
        const normalizedExpected = testCase.expectedCommand.replace(/\s+/g, ' ').trim();
        const normalizedActual = generatedCommand.replace(/\s+/g, ' ').trim();
        
        return {
            passed: normalizedExpected === normalizedActual,
            expected: normalizedExpected,
            actual: normalizedActual,
            type: 'command'
        };
    }
    
    return {
        passed: true,
        type: 'success'
    };
}

/**
 * 執行所有測試
 */
function runAllTests() {
    const results = [];
    const testCases = getAllTestCases();
    
    testCases.forEach(testCase => {
        try {
            // 準備測試資料
            const jsonInput = typeof testCase.config === 'string' 
                ? testCase.config 
                : JSON.stringify(testCase.config);
                
            const options = {
                scope: testCase.scope || 'local',
                envVars: {},
                autoDetectType: true
            };
            
            // 執行轉換
            const result = mcpConverter.convert(jsonInput, testCase.name, options);
            
            // 驗證結果
            const validation = validateTestCase(testCase, result.command);
            
            results.push({
                testCase: testCase,
                result: result,
                validation: validation,
                passed: validation.passed
            });
            
        } catch (error) {
            results.push({
                testCase: testCase,
                result: { success: false, error: error.message },
                validation: { passed: false, error: error.message },
                passed: false
            });
        }
    });
    
    return results;
}

/**
 * 產生測試報告
 */
function generateTestReport(results) {
    const passed = results.filter(r => r.passed).length;
    const total = results.length;
    const failed = total - passed;
    
    const report = {
        summary: {
            total: total,
            passed: passed,
            failed: failed,
            passRate: ((passed / total) * 100).toFixed(2) + '%'
        },
        details: results,
        failedTests: results.filter(r => !r.passed)
    };
    
    return report;
}

// 範例資料（用於 UI）
const EXAMPLE_CONFIGS = {
    stdio: {
        simple: {
            title: '簡單 stdio 伺服器',
            config: {
                command: 'npx',
                args: ['my-mcp-server'],
                env: {
                    API_KEY: '${MY_API_KEY}'
                }
            }
        },
        
        complex: {
            title: '複雜 stdio 伺服器',
            config: {
                command: '/usr/local/bin/node',
                args: ['/path/to/server.js', '--debug', '--port', '3000'],
                env: {
                    NODE_ENV: '${NODE_ENV:-development}',
                    LOG_LEVEL: '${LOG_LEVEL:-info}',
                    DATABASE_URL: '${DATABASE_URL}'
                }
            }
        }
    },
    
    sse: {
        simple: {
            title: '簡單 SSE 伺服器',
            config: {
                type: 'sse',
                url: 'https://api.example.com/sse',
                headers: {
                    Authorization: 'Bearer ${API_TOKEN}'
                }
            }
        },
        
        complex: {
            title: '複雜 SSE 伺服器',
            config: {
                type: 'sse',
                url: 'https://api.example.com/sse',
                headers: {
                    Authorization: 'Bearer ${API_TOKEN}',
                    'User-Agent': 'Claude-MCP-Client',
                    'Content-Type': 'application/json'
                }
            }
        }
    },
    
    http: {
        simple: {
            title: '簡單 HTTP 伺服器',
            config: {
                type: 'http',
                url: 'https://api.example.com/mcp'
            }
        },
        
        complex: {
            title: '複雜 HTTP 伺服器',
            config: {
                type: 'http',
                url: 'https://api.example.com/mcp',
                headers: {
                    Authorization: 'Bearer ${API_TOKEN}',
                    'X-API-Version': '2024-01-01',
                    'Content-Type': 'application/json'
                }
            }
        }
    }
};

// 匯出給其他檔案使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        TEST_DATA,
        EXAMPLE_CONFIGS,
        getAllTestCases,
        getTestCasesByType,
        getTestCase,
        validateTestCase,
        runAllTests,
        generateTestReport
    };
}