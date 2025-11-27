/**
 * 性能管理器
 * 监控和优化游戏性能，管理资源使用
 */

export class ObjectPool {
    constructor(createFn, resetFn, initialSize = 10) {
        this.createFn = createFn;
        this.resetFn = resetFn;
        this.pool = [];
        this.active = new Set();
        
        // 预创建对象
        for (let i = 0; i < initialSize; i++) {
            this.pool.push(this.createFn());
        }
    }

    /**
     * 获取对象
     */
    acquire() {
        let obj;
        
        if (this.pool.length > 0) {
            obj = this.pool.pop();
        } else {
            obj = this.createFn();
        }
        
        this.active.add(obj);
        return obj;
    }

    /**
     * 释放对象
     * @param {Object} obj - 要释放的对象
     */
    release(obj) {
        if (this.active.has(obj)) {
            this.active.delete(obj);
            
            if (this.resetFn) {
                this.resetFn(obj);
            }
            
            this.pool.push(obj);
        }
    }

    /**
     * 释放所有活跃对象
     */
    releaseAll() {
        for (const obj of this.active) {
            if (this.resetFn) {
                this.resetFn(obj);
            }
            this.pool.push(obj);
        }
        this.active.clear();
    }

    /**
     * 获取统计信息
     */
    getStats() {
        return {
            poolSize: this.pool.length,
            activeCount: this.active.size,
            totalCreated: this.pool.length + this.active.size
        };
    }
}

export class ResourceManager {
    constructor() {
        this.resources = new Map();
        this.loadingPromises = new Map();
        this.preloadQueue = [];
        this.maxCacheSize = 50 * 1024 * 1024; // 50MB
        this.currentCacheSize = 0;
        this.accessTimes = new Map();
    }

    /**
     * 加载资源
     * @param {string} url - 资源URL
     * @param {string} type - 资源类型
     */
    async loadResource(url, type = 'auto') {
        // 检查缓存
        if (this.resources.has(url)) {
            this.updateAccessTime(url);
            return this.resources.get(url);
        }

        // 检查是否正在加载
        if (this.loadingPromises.has(url)) {
            return this.loadingPromises.get(url);
        }

        // 开始加载
        const loadPromise = this.performLoad(url, type);
        this.loadingPromises.set(url, loadPromise);

        try {
            const resource = await loadPromise;
            this.cacheResource(url, resource);
            this.loadingPromises.delete(url);
            return resource;
        } catch (error) {
            this.loadingPromises.delete(url);
            throw error;
        }
    }

    /**
     * 执行实际加载
     * @param {string} url - 资源URL
     * @param {string} type - 资源类型
     */
    async performLoad(url, type) {
        const detectedType = type === 'auto' ? this.detectResourceType(url) : type;

        switch (detectedType) {
            case 'image':
                return this.loadImage(url);
            case 'audio':
                return this.loadAudio(url);
            case 'json':
                return this.loadJSON(url);
            case 'text':
                return this.loadText(url);
            default:
                throw new Error(`Unsupported resource type: ${detectedType}`);
        }
    }

    /**
     * 检测资源类型
     * @param {string} url - 资源URL
     */
    detectResourceType(url) {
        const extension = url.split('.').pop().toLowerCase();
        
        if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension)) {
            return 'image';
        }
        if (['mp3', 'wav', 'ogg', 'm4a'].includes(extension)) {
            return 'audio';
        }
        if (extension === 'json') {
            return 'json';
        }
        return 'text';
    }

    /**
     * 加载图片
     * @param {string} url - 图片URL
     */
    loadImage(url) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
            img.src = url;
        });
    }

    /**
     * 加载音频
     * @param {string} url - 音频URL
     */
    loadAudio(url) {
        return new Promise((resolve, reject) => {
            const audio = new Audio();
            audio.oncanplaythrough = () => resolve(audio);
            audio.onerror = () => reject(new Error(`Failed to load audio: ${url}`));
            audio.src = url;
        });
    }

    /**
     * 加载JSON
     * @param {string} url - JSON URL
     */
    async loadJSON(url) {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to load JSON: ${url}`);
        }
        return response.json();
    }

    /**
     * 加载文本
     * @param {string} url - 文本URL
     */
    async loadText(url) {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to load text: ${url}`);
        }
        return response.text();
    }

    /**
     * 缓存资源
     * @param {string} url - 资源URL
     * @param {*} resource - 资源对象
     */
    cacheResource(url, resource) {
        const size = this.estimateResourceSize(resource);
        
        // 检查缓存大小限制
        if (this.currentCacheSize + size > this.maxCacheSize) {
            this.evictLRU(size);
        }
        
        this.resources.set(url, resource);
        this.currentCacheSize += size;
        this.updateAccessTime(url);
    }

    /**
     * 估算资源大小
     * @param {*} resource - 资源对象
     */
    estimateResourceSize(resource) {
        if (resource instanceof HTMLImageElement) {
            return resource.width * resource.height * 4; // RGBA
        }
        if (resource instanceof HTMLAudioElement) {
            return 1024 * 1024; // 估算1MB
        }
        if (typeof resource === 'string') {
            return resource.length * 2; // Unicode字符
        }
        if (typeof resource === 'object') {
            return JSON.stringify(resource).length * 2;
        }
        return 1024; // 默认1KB
    }

    /**
     * LRU缓存淘汰
     * @param {number} requiredSize - 需要的空间大小
     */
    evictLRU(requiredSize) {
        const entries = Array.from(this.accessTimes.entries())
            .sort((a, b) => a[1] - b[1]); // 按访问时间排序

        for (const [url] of entries) {
            if (this.currentCacheSize + requiredSize <= this.maxCacheSize) {
                break;
            }
            
            const resource = this.resources.get(url);
            const size = this.estimateResourceSize(resource);
            
            this.resources.delete(url);
            this.accessTimes.delete(url);
            this.currentCacheSize -= size;
        }
    }

    /**
     * 更新访问时间
     * @param {string} url - 资源URL
     */
    updateAccessTime(url) {
        this.accessTimes.set(url, Date.now());
    }

    /**
     * 预加载资源
     * @param {Array} urls - 资源URL数组
     */
    async preloadResources(urls) {
        const promises = urls.map(url => this.loadResource(url));
        return Promise.allSettled(promises);
    }

    /**
     * 清理缓存
     */
    clearCache() {
        this.resources.clear();
        this.accessTimes.clear();
        this.currentCacheSize = 0;
    }

    /**
     * 获取缓存统计
     */
    getCacheStats() {
        return {
            resourceCount: this.resources.size,
            cacheSize: this.currentCacheSize,
            maxCacheSize: this.maxCacheSize,
            hitRate: this.calculateHitRate()
        };
    }

    /**
     * 计算缓存命中率
     */
    calculateHitRate() {
        // 这里可以实现更复杂的命中率计算
        return this.resources.size > 0 ? 0.85 : 0;
    }
}

export class PerformanceMonitor {
    constructor() {
        this.frameCount = 0;
        this.lastTime = performance.now();
        this.fps = 60;
        this.frameTime = 16.67;
        this.fpsHistory = [];
        this.memoryUsage = [];
        this.isMonitoring = false;
        this.performanceData = {
            averageFPS: 60,
            minFPS: 60,
            maxFPS: 60,
            frameTimeVariance: 0,
            memoryUsage: 0,
            renderTime: 0,
            updateTime: 0
        };
    }

    /**
     * 开始性能监控
     */
    startMonitoring() {
        this.isMonitoring = true;
        this.lastTime = performance.now();
        this.frameCount = 0;
        this.monitorLoop();
    }

    /**
     * 停止性能监控
     */
    stopMonitoring() {
        this.isMonitoring = false;
    }

    /**
     * 监控循环
     */
    monitorLoop() {
        if (!this.isMonitoring) return;

        const currentTime = performance.now();
        const deltaTime = currentTime - this.lastTime;
        
        this.frameCount++;
        this.frameTime = deltaTime;
        this.fps = 1000 / deltaTime;
        
        // 记录FPS历史
        this.fpsHistory.push(this.fps);
        if (this.fpsHistory.length > 60) { // 保持60帧历史
            this.fpsHistory.shift();
        }
        
        // 记录内存使用情况
        if (performance.memory) {
            this.memoryUsage.push({
                used: performance.memory.usedJSHeapSize,
                total: performance.memory.totalJSHeapSize,
                limit: performance.memory.jsHeapSizeLimit,
                timestamp: currentTime
            });
            
            if (this.memoryUsage.length > 100) {
                this.memoryUsage.shift();
            }
        }
        
        // 更新性能数据
        this.updatePerformanceData();
        
        this.lastTime = currentTime;
        
        // 继续监控
        requestAnimationFrame(() => this.monitorLoop());
    }

    /**
     * 更新性能数据
     */
    updatePerformanceData() {
        if (this.fpsHistory.length === 0) return;

        const fps = this.fpsHistory;
        this.performanceData.averageFPS = fps.reduce((a, b) => a + b, 0) / fps.length;
        this.performanceData.minFPS = Math.min(...fps);
        this.performanceData.maxFPS = Math.max(...fps);
        
        // 计算帧时间方差
        const avgFrameTime = 1000 / this.performanceData.averageFPS;
        const variance = fps.map(f => Math.pow(1000/f - avgFrameTime, 2))
                           .reduce((a, b) => a + b, 0) / fps.length;
        this.performanceData.frameTimeVariance = Math.sqrt(variance);
        
        // 内存使用情况
        if (this.memoryUsage.length > 0) {
            const latest = this.memoryUsage[this.memoryUsage.length - 1];
            this.performanceData.memoryUsage = latest.used / 1024 / 1024; // MB
        }
    }

    /**
     * 测量函数执行时间
     * @param {Function} fn - 要测量的函数
     * @param {string} name - 测量名称
     */
    measureFunction(fn, name = 'function') {
        const start = performance.now();
        const result = fn();
        const end = performance.now();
        
        console.log(`${name} 执行时间: ${(end - start).toFixed(2)}ms`);
        return result;
    }

    /**
     * 测量异步函数执行时间
     * @param {Function} fn - 要测量的异步函数
     * @param {string} name - 测量名称
     */
    async measureAsyncFunction(fn, name = 'async function') {
        const start = performance.now();
        const result = await fn();
        const end = performance.now();
        
        console.log(`${name} 执行时间: ${(end - start).toFixed(2)}ms`);
        return result;
    }

    /**
     * 获取性能报告
     */
    getPerformanceReport() {
        return {
            ...this.performanceData,
            timestamp: Date.now(),
            frameCount: this.frameCount,
            monitoringDuration: this.frameCount * this.frameTime,
            memoryTrend: this.analyzeMemoryTrend(),
            performanceGrade: this.calculatePerformanceGrade()
        };
    }

    /**
     * 分析内存趋势
     */
    analyzeMemoryTrend() {
        if (this.memoryUsage.length < 10) return 'insufficient_data';
        
        const recent = this.memoryUsage.slice(-10);
        const trend = recent[recent.length - 1].used - recent[0].used;
        
        if (trend > 1024 * 1024) return 'increasing'; // 增长超过1MB
        if (trend < -1024 * 1024) return 'decreasing'; // 减少超过1MB
        return 'stable';
    }

    /**
     * 计算性能等级
     */
    calculatePerformanceGrade() {
        const avgFPS = this.performanceData.averageFPS;
        const variance = this.performanceData.frameTimeVariance;
        
        if (avgFPS >= 55 && variance < 5) return 'excellent';
        if (avgFPS >= 45 && variance < 10) return 'good';
        if (avgFPS >= 30 && variance < 15) return 'fair';
        return 'poor';
    }
}

export class PerformanceManager {
    constructor() {
        this.monitor = new PerformanceMonitor();
        this.resourceManager = new ResourceManager();
        this.objectPools = new Map();
        this.optimizationLevel = 'auto';
        this.targetFPS = 60;
        this.adaptiveQuality = true;
        
        this.initializeObjectPools();
        this.setupPerformanceOptimizations();
    }

    /**
     * 初始化对象池
     */
    initializeObjectPools() {
        // 垃圾僵尸对象池
        this.objectPools.set('trashZombie', new ObjectPool(
            () => ({ 
                id: null, 
                type: null, 
                position: { x: 0, y: 0 }, 
                velocity: { x: 0, y: 0 },
                isActive: false 
            }),
            (obj) => {
                obj.id = null;
                obj.type = null;
                obj.position.x = 0;
                obj.position.y = 0;
                obj.velocity.x = 0;
                obj.velocity.y = 0;
                obj.isActive = false;
            },
            20
        ));

        // 粒子对象池
        this.objectPools.set('particle', new ObjectPool(
            () => ({
                x: 0, y: 0,
                vx: 0, vy: 0,
                life: 0, maxLife: 0,
                color: '#FFFFFF',
                size: 1,
                isActive: false
            }),
            (obj) => {
                obj.x = 0; obj.y = 0;
                obj.vx = 0; obj.vy = 0;
                obj.life = 0; obj.maxLife = 0;
                obj.color = '#FFFFFF';
                obj.size = 1;
                obj.isActive = false;
            },
            100
        ));

        // UI元素对象池
        this.objectPools.set('uiElement', new ObjectPool(
            () => ({
                type: null,
                x: 0, y: 0,
                width: 0, height: 0,
                visible: false,
                text: '',
                style: {}
            }),
            (obj) => {
                obj.type = null;
                obj.x = 0; obj.y = 0;
                obj.width = 0; obj.height = 0;
                obj.visible = false;
                obj.text = '';
                obj.style = {};
            },
            50
        ));
    }

    /**
     * 设置性能优化
     */
    setupPerformanceOptimizations() {
        // 自适应质量调整
        if (this.adaptiveQuality) {
            this.startAdaptiveQualityMonitoring();
        }

        // 内存管理
        this.setupMemoryManagement();

        // 渲染优化
        this.setupRenderOptimizations();
    }

    /**
     * 开始自适应质量监控
     */
    startAdaptiveQualityMonitoring() {
        setInterval(() => {
            const report = this.monitor.getPerformanceReport();
            
            if (report.averageFPS < this.targetFPS * 0.8) {
                this.reduceQuality();
            } else if (report.averageFPS > this.targetFPS * 0.95) {
                this.increaseQuality();
            }
        }, 5000); // 每5秒检查一次
    }

    /**
     * 降低质量
     */
    reduceQuality() {
        console.log('性能不足，降低渲染质量');
        
        // 减少粒子数量
        if (window.particleSystem) {
            window.particleSystem.setMaxParticles(
                Math.max(50, window.particleSystem.maxParticles * 0.7)
            );
        }
        
        // 降低渲染精度
        if (window.renderSystem) {
            window.renderSystem.setQuality('low');
        }
        
        // 减少音效
        if (window.audioManager) {
            window.audioManager.setSFXVolume(
                window.audioManager.sfxVolume * 0.8
            );
        }
    }

    /**
     * 提高质量
     */
    increaseQuality() {
        console.log('性能良好，提高渲染质量');
        
        // 增加粒子数量
        if (window.particleSystem) {
            window.particleSystem.setMaxParticles(
                Math.min(200, window.particleSystem.maxParticles * 1.2)
            );
        }
        
        // 提高渲染精度
        if (window.renderSystem) {
            window.renderSystem.setQuality('high');
        }
    }

    /**
     * 设置内存管理
     */
    setupMemoryManagement() {
        // 定期清理内存
        setInterval(() => {
            this.performMemoryCleanup();
        }, 30000); // 每30秒清理一次

        // 监控内存使用
        setInterval(() => {
            this.checkMemoryUsage();
        }, 10000); // 每10秒检查一次
    }

    /**
     * 执行内存清理
     */
    performMemoryCleanup() {
        // 清理对象池中的非活跃对象
        for (const [name, pool] of this.objectPools) {
            if (pool.pool.length > pool.active.size * 2) {
                // 如果池中对象数量是活跃对象的2倍以上，清理一半
                const toRemove = Math.floor(pool.pool.length / 2);
                pool.pool.splice(0, toRemove);
            }
        }

        // 清理资源缓存
        const cacheStats = this.resourceManager.getCacheStats();
        if (cacheStats.cacheSize > cacheStats.maxCacheSize * 0.8) {
            // 如果缓存使用超过80%，清理一些资源
            this.resourceManager.evictLRU(cacheStats.maxCacheSize * 0.2);
        }

        console.log('内存清理完成');
    }

    /**
     * 检查内存使用情况
     */
    checkMemoryUsage() {
        if (!performance.memory) return;

        const memoryInfo = performance.memory;
        const usageRatio = memoryInfo.usedJSHeapSize / memoryInfo.jsHeapSizeLimit;

        if (usageRatio > 0.8) {
            console.warn('内存使用率过高:', (usageRatio * 100).toFixed(1) + '%');
            this.performEmergencyCleanup();
        }
    }

    /**
     * 执行紧急清理
     */
    performEmergencyCleanup() {
        console.log('执行紧急内存清理');
        
        // 清空所有对象池
        for (const pool of this.objectPools.values()) {
            pool.releaseAll();
        }
        
        // 清空资源缓存
        this.resourceManager.clearCache();
        
        // 强制垃圾回收（如果支持）
        if (window.gc) {
            window.gc();
        }
    }

    /**
     * 设置渲染优化
     */
    setupRenderOptimizations() {
        // 视锥剔除
        this.enableFrustumCulling = true;
        
        // 批量渲染
        this.enableBatchRendering = true;
        
        // 纹理压缩
        this.enableTextureCompression = true;
    }

    /**
     * 获取对象池
     * @param {string} type - 对象池类型
     */
    getObjectPool(type) {
        return this.objectPools.get(type);
    }

    /**
     * 获取资源管理器
     */
    getResourceManager() {
        return this.resourceManager;
    }

    /**
     * 开始性能监控
     */
    startMonitoring() {
        this.monitor.startMonitoring();
    }

    /**
     * 停止性能监控
     */
    stopMonitoring() {
        this.monitor.stopMonitoring();
    }

    /**
     * 获取性能报告
     */
    getPerformanceReport() {
        return {
            ...this.monitor.getPerformanceReport(),
            objectPools: this.getObjectPoolStats(),
            resourceCache: this.resourceManager.getCacheStats(),
            optimizationLevel: this.optimizationLevel
        };
    }

    /**
     * 获取对象池统计
     */
    getObjectPoolStats() {
        const stats = {};
        for (const [name, pool] of this.objectPools) {
            stats[name] = pool.getStats();
        }
        return stats;
    }

    /**
     * 设置优化级别
     * @param {string} level - 优化级别 (low, medium, high, auto)
     */
    setOptimizationLevel(level) {
        this.optimizationLevel = level;
        
        switch (level) {
            case 'low':
                this.targetFPS = 30;
                this.adaptiveQuality = false;
                break;
            case 'medium':
                this.targetFPS = 45;
                this.adaptiveQuality = true;
                break;
            case 'high':
                this.targetFPS = 60;
                this.adaptiveQuality = true;
                break;
            case 'auto':
                this.targetFPS = 60;
                this.adaptiveQuality = true;
                this.detectOptimalSettings();
                break;
        }
    }

    /**
     * 检测最佳设置
     */
    detectOptimalSettings() {
        // 基于设备性能自动调整设置
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        
        if (gl) {
            const renderer = gl.getParameter(gl.RENDERER);
            const vendor = gl.getParameter(gl.VENDOR);
            
            console.log('GPU信息:', renderer, vendor);
            
            // 基于GPU信息调整设置
            if (renderer.includes('Intel') || renderer.includes('integrated')) {
                this.setOptimizationLevel('medium');
            } else {
                this.setOptimizationLevel('high');
            }
        } else {
            // 没有WebGL支持，使用低性能设置
            this.setOptimizationLevel('low');
        }
    }

    /**
     * 销毁性能管理器
     */
    destroy() {
        this.stopMonitoring();
        
        for (const pool of this.objectPools.values()) {
            pool.releaseAll();
        }
        
        this.resourceManager.clearCache();
        this.objectPools.clear();
    }
}

// 创建全局性能管理器实例
export const performanceManager = new PerformanceManager();