/**
 * 系统集成测试
 * 验证所有系统的正确集成和协作
 */
import { GameEngine } from '../src/js/core/GameEngine.js';
import { gameErrorHandler } from '../src/js/core/ErrorHandler.js';
import { performanceManager } from '../src/js/core/PerformanceManager.js';
import { audioManager } from '../src/js/audio/AudioManager.js';
import { musicManager } from '../src/js/audio/MusicManager.js';
import { statisticsManager } from '../src/js/data/StatisticsManager.js';
import { progressManager } from '../src/js/data/ProgressManager.js';

// Mock DOM and browser APIs
global.document = {
    getElementById: jest.fn(() => ({
        getContext: jest.fn(() => ({
            clearRect: jest.fn(),
            fillRect: jest.fn(),
            strokeRect: jest.fn(),
            fillText: jest.fn(),
            strokeText: jest.fn(),
            beginPath: jest.fn(),
            moveTo: jest.fn(),
            lineTo: jest.fn(),
            arc: jest.fn(),
            stroke: jest.fn(),
            fill: jest.fn(),
            save: jest.fn(),
            restore: jest.fn(),
            translate: jest.fn(),
            rotate: jest.fn(),
            scale: jest.fn(),
            drawImage: jest.fn()
        })),
        width: 1200,
        height: 800,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn()
    })),
    createElement: jest.fn(() => ({
        getContext: jest.fn(() => ({})),
        addEventListener: jest.fn(),
        style: {},
        appendChild: jest.fn()
    })),
    body: {
        appendChild: jest.fn()
    },
    head: {
        appendChild: jest.fn()
    },
    addEventListener: jest.fn(),
    removeEventListener: jest.fn()
};

global.window = {
    requestAnimationFrame: jest.fn(cb => setTimeout(cb, 16)),
    cancelAnimationFrame: jest.fn(),
    performance: {
        now: jest.fn(() => Date.now()),
        memory: {
            usedJSHeapSize: 1024 * 1024,
            totalJSHeapSize: 2 * 1024 * 1024,
            jsHeapSizeLimit: 10 * 1024 * 1024
        }
    },
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    AudioContext: jest.fn(() => ({
        createBuffer: jest.fn(() => ({
            getChannelData: jest.fn(() => new Float32Array(1024))
        })),
        createBufferSource: jest.fn(() => ({
            connect: jest.fn(),
            start: jest.fn(),
            stop: jest.fn(),
            buffer: null,
            loop: false
        })),
        createGain: jest.fn(() => ({
            connect: jest.fn(),
            gain: {
                setValueAtTime: jest.fn(),
                linearRampToValueAtTime: jest.fn()
            }
        })),
        destination: {},
        currentTime: 0,
        state: 'running',
        resume: jest.fn(),
        suspend: jest.fn(),
        close: jest.fn(),
        sampleRate: 44100
    })),
    localStorage: {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn()
    }
};

global.navigator = {
    userAgent: 'test-browser',
    vibrate: jest.fn()
};

describe('System Integration Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('should initialize all core systems', () => {
        // 验证所有核心系统都能正确初始化
        expect(gameErrorHandler).toBeDefined();
        expect(performanceManager).toBeDefined();
        expect(audioManager).toBeDefined();
        expect(musicManager).toBeDefined();
        expect(statisticsManager).toBeDefined();
        expect(progressManager).toBeDefined();
    });

    test('should handle error propagation between systems', () => {
        const errorCallback = jest.fn();
        gameErrorHandler.onError('TEST_ERROR', errorCallback);
        
        // 模拟系统错误
        const testError = new Error('Test system error');
        testError.type = 'TEST_ERROR';
        
        gameErrorHandler.handleError(testError);
        
        expect(errorCallback).toHaveBeenCalledWith(testError);
    });

    test('should integrate performance monitoring with game systems', () => {
        // 启动性能监控
        performanceManager.startMonitoring();
        
        expect(performanceManager.monitor.isMonitoring).toBe(true);
        
        // 获取性能报告
        const report = performanceManager.getPerformanceReport();
        
        expect(report).toHaveProperty('averageFPS');
        expect(report).toHaveProperty('memoryUsage');
        expect(report).toHaveProperty('objectPools');
        
        // 停止监控
        performanceManager.stopMonitoring();
        expect(performanceManager.monitor.isMonitoring).toBe(false);
    });

    test('should integrate audio systems correctly', () => {
        // 测试音频管理器初始化
        expect(audioManager.audioContext).toBeTruthy();
        expect(audioManager.sounds.size).toBeGreaterThan(0);
        
        // 测试音乐管理器
        expect(musicManager.audioContext).toBeTruthy();
        
        // 测试音效播放
        audioManager.playSuccessSound();
        audioManager.playErrorSound();
        
        // 测试音乐播放
        musicManager.switchToMenuMusic();
        musicManager.switchToGameMusic();
    });

    test('should integrate statistics and progress systems', () => {
        // 开始新的游戏会话
        statisticsManager.startLevel(1);
        progressManager.updateLevelProgress(1, {
            score: 100,
            accuracy: 85,
            correctCount: 17,
            errorCount: 3,
            timeRemaining: 30
        });
        
        // 验证统计数据
        const sessionStats = statisticsManager.getSessionStats();
        expect(sessionStats.score).toBeGreaterThan(0);
        
        // 验证进度数据
        const playerLevel = progressManager.getPlayerLevel();
        expect(playerLevel).toHaveProperty('level');
        expect(playerLevel).toHaveProperty('title');
        
        const progressPercentage = progressManager.getProgressPercentage();
        expect(progressPercentage).toBeGreaterThanOrEqual(0);
        expect(progressPercentage).toBeLessThanOrEqual(100);
    });

    test('should handle data persistence across systems', () => {
        // 模拟游戏数据
        statisticsManager.recordCorrectClassification('kitchen_waste', 1, 10);
        progressManager.updateLevelProgress(1, {
            score: 50,
            accuracy: 90,
            correctCount: 9,
            errorCount: 1
        });
        
        // 保存数据
        statisticsManager.saveStats();
        progressManager.savePlayerData();
        
        // 验证localStorage被调用
        expect(window.localStorage.setItem).toHaveBeenCalled();
    });

    test('should handle system cleanup and resource management', () => {
        // 启动系统
        performanceManager.startMonitoring();
        musicManager.switchToGameMusic();
        
        // 创建一些对象
        const trashZombiePool = performanceManager.getObjectPool('trashZombie');
        const zombie1 = trashZombiePool.acquire();
        const zombie2 = trashZombiePool.acquire();
        
        expect(trashZombiePool.active.size).toBe(2);
        
        // 清理资源
        performanceManager.performMemoryCleanup();
        
        // 销毁系统
        performanceManager.destroy();
        audioManager.destroy();
        musicManager.destroy();
        
        expect(performanceManager.monitor.isMonitoring).toBe(false);
    });

    test('should handle cross-system event communication', () => {
        // 模拟游戏事件流
        
        // 1. 开始关卡
        statisticsManager.startLevel(1);
        
        // 2. 玩家操作导致正确分类
        statisticsManager.recordCorrectClassification('kitchen_waste', 1, 10);
        audioManager.playSuccessSound();
        
        // 3. 检查成就解锁
        const achievements = progressManager.checkAchievements();
        
        // 4. 更新统计
        const stats = statisticsManager.getSessionStats();
        expect(stats.correctClassifications).toBe(1);
        expect(stats.score).toBe(10);
        
        // 5. 完成关卡
        progressManager.updateLevelProgress(1, {
            score: stats.score,
            accuracy: stats.accuracy,
            correctCount: stats.correctClassifications,
            errorCount: stats.incorrectClassifications
        });
    });

    test('should handle system error recovery', () => {
        // 模拟音频系统错误
        const audioError = new Error('Audio context failed');
        audioError.type = 'AUDIO_ERROR';
        
        gameErrorHandler.handleError(audioError);
        
        // 验证降级模式被激活
        expect(audioManager.muted).toBe(true);
        
        // 模拟渲染错误
        const renderError = new Error('WebGL context lost');
        renderError.type = 'WEBGL_ERROR';
        
        gameErrorHandler.handleError(renderError);
        
        // 验证错误被记录
        const errorStats = gameErrorHandler.getErrorStatistics();
        expect(errorStats.totalErrors).toBeGreaterThan(0);
    });

    test('should maintain system state consistency', () => {
        // 初始化系统状态
        statisticsManager.startLevel(1);
        performanceManager.startMonitoring();
        
        // 执行一系列操作
        for (let i = 0; i < 10; i++) {
            statisticsManager.recordCorrectClassification('kitchen_waste', 1, 10);
        }
        
        // 验证状态一致性
        const sessionStats = statisticsManager.getSessionStats();
        expect(sessionStats.correctClassifications).toBe(10);
        expect(sessionStats.score).toBe(100);
        expect(sessionStats.accuracy).toBe(100);
        
        const performanceReport = performanceManager.getPerformanceReport();
        expect(performanceReport.objectPools).toBeDefined();
    });

    test('should handle concurrent system operations', async () => {
        // 模拟并发操作
        const operations = [
            () => statisticsManager.recordCorrectClassification('kitchen_waste', 1, 10),
            () => audioManager.playSuccessSound(),
            () => performanceManager.performMemoryCleanup(),
            () => progressManager.checkAchievements(),
            () => musicManager.playAmbientSounds(['bird', 'water'])
        ];
        
        // 并发执行操作
        const promises = operations.map(op => Promise.resolve(op()));
        
        await Promise.all(promises);
        
        // 验证系统仍然正常工作
        const stats = statisticsManager.getSessionStats();
        expect(stats.correctClassifications).toBe(1);
    });

    test('should validate system configuration and settings', () => {
        // 验证性能管理器配置
        performanceManager.setOptimizationLevel('high');
        expect(performanceManager.optimizationLevel).toBe('high');
        expect(performanceManager.targetFPS).toBe(60);
        
        // 验证音频配置
        audioManager.setMasterVolume(0.8);
        expect(audioManager.masterVolume).toBe(0.8);
        
        musicManager.setMusicVolume(0.6);
        expect(musicManager.musicVolume).toBe(0.6);
        
        // 验证错误处理配置
        const errorStats = gameErrorHandler.getErrorStatistics();
        expect(errorStats).toHaveProperty('totalErrors');
        expect(errorStats).toHaveProperty('errorsByType');
    });
});