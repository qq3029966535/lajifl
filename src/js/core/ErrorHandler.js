/**
 * 游戏错误处理器
 * 处理各种游戏运行时错误和异常情况
 */

export class GameError extends Error {
    constructor(message, type = 'GAME_ERROR', context = {}) {
        super(message);
        this.name = 'GameError';
        this.type = type;
        this.context = context;
        this.timestamp = Date.now();
    }
}

export class GameErrorHandler {
    constructor() {
        this.errorLog = [];
        this.errorCallbacks = new Map();
        this.fallbackModes = new Map();
        this.isRecovering = false;
        this.maxErrorLogSize = 100;
        
        this.initializeErrorHandling();
        this.setupFallbackModes();
    }

    /**
     * 初始化错误处理
     */
    initializeErrorHandling() {
        // 捕获全局JavaScript错误
        window.addEventListener('error', (event) => {
            this.handleError(new GameError(
                event.message,
                'JAVASCRIPT_ERROR',
                {
                    filename: event.filename,
                    lineno: event.lineno,
                    colno: event.colno,
                    stack: event.error?.stack
                }
            ));
        });

        // 捕获Promise拒绝
        window.addEventListener('unhandledrejection', (event) => {
            this.handleError(new GameError(
                event.reason?.message || 'Unhandled Promise Rejection',
                'PROMISE_REJECTION',
                {
                    reason: event.reason,
                    stack: event.reason?.stack
                }
            ));
        });

        // 捕获资源加载错误
        window.addEventListener('error', (event) => {
            if (event.target !== window) {
                this.handleError(new GameError(
                    `Resource loading failed: ${event.target.src || event.target.href}`,
                    'RESOURCE_ERROR',
                    {
                        element: event.target.tagName,
                        source: event.target.src || event.target.href
                    }
                ));
            }
        }, true);
    }

    /**
     * 设置降级模式
     */
    setupFallbackModes() {
        // 渲染降级：3D失败回退到2D
        this.fallbackModes.set('RENDER_FALLBACK', {
            condition: (error) => error.type === 'WEBGL_ERROR' || error.type === 'THREE_JS_ERROR',
            action: () => this.enableCanvasOnlyMode(),
            description: '3D渲染失败，切换到2D模式'
        });

        // 音频降级：音频失败时静音运行
        this.fallbackModes.set('AUDIO_FALLBACK', {
            condition: (error) => error.type === 'AUDIO_ERROR' || error.type === 'WEB_AUDIO_ERROR',
            action: () => this.enableSilentMode(),
            description: '音频系统失败，切换到静音模式'
        });

        // 存储降级：localStorage失败时使用内存存储
        this.fallbackModes.set('STORAGE_FALLBACK', {
            condition: (error) => error.type === 'STORAGE_ERROR',
            action: () => this.enableMemoryStorageMode(),
            description: '本地存储失败，使用临时存储'
        });

        // 网络降级：网络错误时使用离线模式
        this.fallbackModes.set('NETWORK_FALLBACK', {
            condition: (error) => error.type === 'NETWORK_ERROR',
            action: () => this.enableOfflineMode(),
            description: '网络连接失败，切换到离线模式'
        });
    }

    /**
     * 处理错误
     * @param {Error|GameError} error - 错误对象
     */
    handleError(error) {
        // 转换为GameError
        if (!(error instanceof GameError)) {
            error = new GameError(error.message, 'UNKNOWN_ERROR', { originalError: error });
        }

        // 记录错误
        this.logError(error);

        // 尝试恢复
        this.attemptRecovery(error);

        // 通知错误回调
        this.notifyErrorCallbacks(error);

        // 检查是否需要降级
        this.checkFallbackModes(error);
    }

    /**
     * 记录错误
     * @param {GameError} error - 错误对象
     */
    logError(error) {
        const errorEntry = {
            timestamp: error.timestamp,
            type: error.type,
            message: error.message,
            context: error.context,
            stack: error.stack,
            userAgent: navigator.userAgent,
            url: window.location.href
        };

        this.errorLog.push(errorEntry);

        // 限制错误日志大小
        if (this.errorLog.length > this.maxErrorLogSize) {
            this.errorLog = this.errorLog.slice(-this.maxErrorLogSize);
        }

        // 控制台输出
        console.error(`[GameError] ${error.type}: ${error.message}`, error.context);

        // 发送到分析服务（如果需要）
        this.sendErrorToAnalytics(errorEntry);
    }

    /**
     * 尝试错误恢复
     * @param {GameError} error - 错误对象
     */
    attemptRecovery(error) {
        if (this.isRecovering) return;

        this.isRecovering = true;

        try {
            switch (error.type) {
                case 'CANVAS_ERROR':
                    this.recoverCanvasError();
                    break;

                case 'AUDIO_ERROR':
                    this.recoverAudioError();
                    break;

                case 'STORAGE_ERROR':
                    this.recoverStorageError();
                    break;

                case 'GAME_STATE_ERROR':
                    this.recoverGameStateError();
                    break;

                case 'MEMORY_ERROR':
                    this.recoverMemoryError();
                    break;

                default:
                    this.performGenericRecovery();
                    break;
            }
        } catch (recoveryError) {
            console.error('Recovery failed:', recoveryError);
        } finally {
            this.isRecovering = false;
        }
    }

    /**
     * 恢复Canvas错误
     */
    recoverCanvasError() {
        console.log('尝试恢复Canvas错误...');
        
        // 重新获取Canvas上下文
        const canvas = document.getElementById('game-canvas');
        if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
                // 清除Canvas并重新初始化
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                console.log('Canvas已重置');
            }
        }
    }

    /**
     * 恢复音频错误
     */
    recoverAudioError() {
        console.log('尝试恢复音频错误...');
        
        // 禁用音频功能
        if (window.audioManager) {
            window.audioManager.setMuted(true);
            console.log('音频已静音');
        }
    }

    /**
     * 恢复存储错误
     */
    recoverStorageError() {
        console.log('尝试恢复存储错误...');
        
        // 切换到内存存储
        this.enableMemoryStorageMode();
    }

    /**
     * 恢复游戏状态错误
     */
    recoverGameStateError() {
        console.log('尝试恢复游戏状态错误...');
        
        // 重置游戏状态到安全状态
        if (window.gameEngine) {
            window.gameEngine.resetToSafeState();
        }
    }

    /**
     * 恢复内存错误
     */
    recoverMemoryError() {
        console.log('尝试恢复内存错误...');
        
        // 清理内存
        this.performMemoryCleanup();
        
        // 强制垃圾回收（如果支持）
        if (window.gc) {
            window.gc();
        }
    }

    /**
     * 执行通用恢复
     */
    performGenericRecovery() {
        console.log('执行通用错误恢复...');
        
        // 清理可能的内存泄漏
        this.performMemoryCleanup();
        
        // 重置关键系统
        this.resetCriticalSystems();
    }

    /**
     * 执行内存清理
     */
    performMemoryCleanup() {
        // 清理事件监听器
        this.cleanupEventListeners();
        
        // 清理定时器
        this.cleanupTimers();
        
        // 清理缓存
        this.cleanupCaches();
    }

    /**
     * 清理事件监听器
     */
    cleanupEventListeners() {
        // 这里可以实现具体的事件监听器清理逻辑
        console.log('清理事件监听器...');
    }

    /**
     * 清理定时器
     */
    cleanupTimers() {
        // 清理可能的定时器泄漏
        const highestTimeoutId = setTimeout(() => {}, 0);
        for (let i = 0; i < highestTimeoutId; i++) {
            clearTimeout(i);
        }
        console.log('清理定时器...');
    }

    /**
     * 清理缓存
     */
    cleanupCaches() {
        // 清理游戏缓存
        if (window.gameEngine && window.gameEngine.clearCaches) {
            window.gameEngine.clearCaches();
        }
        console.log('清理缓存...');
    }

    /**
     * 重置关键系统
     */
    resetCriticalSystems() {
        console.log('重置关键系统...');
        
        // 重置渲染系统
        if (window.renderSystem) {
            window.renderSystem.reset();
        }
        
        // 重置输入系统
        if (window.inputManager) {
            window.inputManager.reset();
        }
    }

    /**
     * 检查降级模式
     * @param {GameError} error - 错误对象
     */
    checkFallbackModes(error) {
        for (const [name, fallback] of this.fallbackModes) {
            if (fallback.condition(error)) {
                console.log(`激活降级模式: ${fallback.description}`);
                fallback.action();
                break;
            }
        }
    }

    /**
     * 启用Canvas-only模式
     */
    enableCanvasOnlyMode() {
        console.log('启用Canvas-only渲染模式');
        
        // 禁用WebGL渲染
        if (window.renderSystem) {
            window.renderSystem.fallbackToCanvas2D();
        }
        
        // 显示用户通知
        this.showUserNotification('已切换到兼容模式以确保游戏正常运行', 'info');
    }

    /**
     * 启用静音模式
     */
    enableSilentMode() {
        console.log('启用静音模式');
        
        // 禁用所有音频
        if (window.audioManager) {
            window.audioManager.setMuted(true);
        }
        
        if (window.musicManager) {
            window.musicManager.stopMusic();
            window.musicManager.stopAmbientSounds();
        }
        
        // 显示用户通知
        this.showUserNotification('音频系统遇到问题，已切换到静音模式', 'warning');
    }

    /**
     * 启用内存存储模式
     */
    enableMemoryStorageMode() {
        console.log('启用内存存储模式');
        
        // 创建内存存储替代
        window.memoryStorage = new Map();
        
        // 重写localStorage方法
        const originalSetItem = localStorage.setItem;
        const originalGetItem = localStorage.getItem;
        
        localStorage.setItem = (key, value) => {
            try {
                originalSetItem.call(localStorage, key, value);
            } catch (error) {
                window.memoryStorage.set(key, value);
            }
        };
        
        localStorage.getItem = (key) => {
            try {
                return originalGetItem.call(localStorage, key);
            } catch (error) {
                return window.memoryStorage.get(key) || null;
            }
        };
        
        // 显示用户通知
        this.showUserNotification('存储功能受限，游戏进度将不会保存', 'warning');
    }

    /**
     * 启用离线模式
     */
    enableOfflineMode() {
        console.log('启用离线模式');
        
        // 禁用网络相关功能
        window.isOfflineMode = true;
        
        // 显示用户通知
        this.showUserNotification('网络连接不稳定，已切换到离线模式', 'info');
    }

    /**
     * 显示用户通知
     * @param {string} message - 通知消息
     * @param {string} type - 通知类型
     */
    showUserNotification(message, type = 'info') {
        // 创建通知元素
        const notification = document.createElement('div');
        notification.className = `error-notification error-notification-${type}`;
        notification.textContent = message;
        
        // 样式
        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '12px 20px',
            borderRadius: '8px',
            color: 'white',
            fontWeight: 'bold',
            zIndex: '10000',
            maxWidth: '300px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            backgroundColor: type === 'error' ? '#F44336' : 
                           type === 'warning' ? '#FF9800' : '#2196F3'
        });
        
        document.body.appendChild(notification);
        
        // 自动移除
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 5000);
    }

    /**
     * 注册错误回调
     * @param {string} type - 错误类型
     * @param {Function} callback - 回调函数
     */
    onError(type, callback) {
        if (!this.errorCallbacks.has(type)) {
            this.errorCallbacks.set(type, []);
        }
        this.errorCallbacks.get(type).push(callback);
    }

    /**
     * 通知错误回调
     * @param {GameError} error - 错误对象
     */
    notifyErrorCallbacks(error) {
        const callbacks = this.errorCallbacks.get(error.type) || [];
        const globalCallbacks = this.errorCallbacks.get('*') || [];
        
        [...callbacks, ...globalCallbacks].forEach(callback => {
            try {
                callback(error);
            } catch (callbackError) {
                console.error('Error callback failed:', callbackError);
            }
        });
    }

    /**
     * 发送错误到分析服务
     * @param {Object} errorEntry - 错误条目
     */
    sendErrorToAnalytics(errorEntry) {
        // 这里可以实现发送错误到分析服务的逻辑
        // 例如发送到Google Analytics、Sentry等
        
        // 示例：只在生产环境发送
        if (process.env.NODE_ENV === 'production') {
            // 发送错误数据
            console.log('发送错误到分析服务:', errorEntry);
        }
    }

    /**
     * 获取错误统计
     */
    getErrorStatistics() {
        const stats = {
            totalErrors: this.errorLog.length,
            errorsByType: {},
            recentErrors: this.errorLog.slice(-10),
            errorRate: 0
        };
        
        // 按类型统计错误
        this.errorLog.forEach(error => {
            stats.errorsByType[error.type] = (stats.errorsByType[error.type] || 0) + 1;
        });
        
        // 计算错误率（最近1小时）
        const oneHourAgo = Date.now() - 3600000;
        const recentErrors = this.errorLog.filter(error => error.timestamp > oneHourAgo);
        stats.errorRate = recentErrors.length;
        
        return stats;
    }

    /**
     * 导出错误日志
     */
    exportErrorLog() {
        return JSON.stringify({
            exportDate: new Date().toISOString(),
            gameVersion: '1.0.0',
            userAgent: navigator.userAgent,
            errors: this.errorLog
        }, null, 2);
    }

    /**
     * 清除错误日志
     */
    clearErrorLog() {
        this.errorLog = [];
        console.log('错误日志已清除');
    }

    /**
     * 销毁错误处理器
     */
    destroy() {
        this.errorCallbacks.clear();
        this.fallbackModes.clear();
        this.clearErrorLog();
    }
}

// 创建全局错误处理器实例
export const gameErrorHandler = new GameErrorHandler();

// 导出错误类型常量
export const ErrorTypes = {
    JAVASCRIPT_ERROR: 'JAVASCRIPT_ERROR',
    PROMISE_REJECTION: 'PROMISE_REJECTION',
    RESOURCE_ERROR: 'RESOURCE_ERROR',
    CANVAS_ERROR: 'CANVAS_ERROR',
    WEBGL_ERROR: 'WEBGL_ERROR',
    THREE_JS_ERROR: 'THREE_JS_ERROR',
    AUDIO_ERROR: 'AUDIO_ERROR',
    WEB_AUDIO_ERROR: 'WEB_AUDIO_ERROR',
    STORAGE_ERROR: 'STORAGE_ERROR',
    NETWORK_ERROR: 'NETWORK_ERROR',
    GAME_STATE_ERROR: 'GAME_STATE_ERROR',
    MEMORY_ERROR: 'MEMORY_ERROR',
    INPUT_ERROR: 'INPUT_ERROR',
    PHYSICS_ERROR: 'PHYSICS_ERROR'
};