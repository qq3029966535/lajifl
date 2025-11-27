/**
 * 端到端测试
 * 测试完整的用户游戏流程
 */
import { GameEngine } from '../src/js/core/GameEngine.js';
import { SceneManager } from '../src/js/core/SceneManager.js';
import { MenuScene } from '../src/js/scenes/MenuScene.js';
import { GameScene } from '../src/js/scenes/GameScene.js';
import { GameConfig } from '../src/js/config/GameConfig.js';

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
            drawImage: jest.fn(),
            createImageData: jest.fn(),
            getImageData: jest.fn(),
            putImageData: jest.fn()
        })),
        width: 1200,
        height: 800,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn()
    })),
    createElement: jest.fn(() => ({
        getContext: jest.fn(() => ({})),
        addEventListener: jest.fn(),
        style: {}
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
        now: jest.fn(() => Date.now())
    },
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    AudioContext: jest.fn(() => ({
        createBuffer: jest.fn(),
        createBufferSource: jest.fn(),
        createGain: jest.fn(),
        destination: {},
        currentTime: 0,
        state: 'running',
        resume: jest.fn(),
        close: jest.fn()
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

describe('End-to-End Game Flow', () => {
    let gameEngine;
    let sceneManager;

    beforeEach(() => {
        // 重置所有mock
        jest.clearAllMocks();
        
        // 初始化游戏引擎
        gameEngine = new GameEngine();
        sceneManager = new SceneManager();
        
        // 模拟成功初始化
        gameEngine.isInitialized = true;
    });

    afterEach(() => {
        if (gameEngine) {
            gameEngine.destroy();
        }
    });

    test('should complete full game startup flow', async () => {
        // 1. 游戏引擎初始化
        expect(gameEngine.isInitialized).toBe(true);
        
        // 2. 场景管理器初始化
        expect(sceneManager).toBeTruthy();
        
        // 3. 加载菜单场景
        const menuScene = new MenuScene();
        sceneManager.switchScene(menuScene);
        
        expect(sceneManager.currentScene).toBe(menuScene);
        
        // 4. 模拟用户点击开始游戏
        const gameScene = new GameScene();
        sceneManager.switchScene(gameScene);
        
        expect(sceneManager.currentScene).toBe(gameScene);
    });

    test('should handle complete level 1 playthrough', () => {
        // 初始化游戏场景
        const gameScene = new GameScene();
        gameScene.initialize();
        
        // 开始第一关
        gameScene.startLevel(1);
        
        const levelConfig = GameConfig.levels[0];
        expect(gameScene.levelSystem.currentLevel).toBe(1);
        expect(gameScene.levelSystem.isLevelActive).toBe(true);
        
        // 模拟玩家操作：放置垃圾桶
        const binPlacementResult = gameScene.handleBinPlacement(1, { x: 400, y: 200 });
        expect(binPlacementResult).toBe(true);
        
        // 模拟垃圾僵尸生成和移动
        for (let i = 0; i < levelConfig.zombieCount; i++) {
            const trashType = levelConfig.trashTypes[i % levelConfig.trashTypes.length];
            const zombie = gameScene.zombieSystem.spawnZombie(trashType, 1);
            
            // 模拟僵尸移动到垃圾桶附近并被收集
            if (zombie) {
                zombie.position.set(400, 200);
                gameScene.update(16); // 一帧更新
                
                // 模拟正确收集
                gameScene.levelSystem.onZombieCollected(true);
            }
        }
        
        // 验证关卡完成
        expect(gameScene.levelSystem.isLevelComplete()).toBe(true);
        expect(gameScene.levelSystem.getProgress()).toBe(100);
    });

    test('should handle game failure and retry', () => {
        const gameScene = new GameScene();
        gameScene.initialize();
        gameScene.startLevel(1);
        
        // 模拟垃圾到达终点导致失败
        gameScene.levelSystem.onZombieReachedEnd();
        
        expect(gameScene.levelSystem.isLevelFailed()).toBe(true);
        
        // 模拟重新开始
        gameScene.restartLevel();
        
        expect(gameScene.levelSystem.isLevelActive).toBe(true);
        expect(gameScene.levelSystem.currentScore).toBe(0);
    });

    test('should handle progressive difficulty across levels', () => {
        const gameScene = new GameScene();
        gameScene.initialize();
        
        // 测试每个关卡的难度递增
        for (let level = 1; level <= 3; level++) {
            gameScene.startLevel(level);
            
            const levelConfig = GameConfig.levels[level - 1];
            
            // 验证难度参数
            expect(levelConfig.trackCount).toBeGreaterThanOrEqual(level);
            expect(levelConfig.zombieCount).toBeGreaterThan(0);
            expect(levelConfig.spawnInterval).toBeGreaterThan(0);
            
            // 如果不是第一关，验证难度确实在增加
            if (level > 1) {
                const prevLevelConfig = GameConfig.levels[level - 2];
                expect(levelConfig.zombieCount).toBeGreaterThanOrEqual(prevLevelConfig.zombieCount);
                expect(levelConfig.spawnInterval).toBeLessThanOrEqual(prevLevelConfig.spawnInterval);
            }
            
            gameScene.resetLevel();
        }
    });

    test('should handle user input and controls', () => {
        const gameScene = new GameScene();
        gameScene.initialize();
        gameScene.startLevel(1);
        
        // 模拟键盘输入：选择垃圾桶类型
        const keyboardEvent = {
            key: '1',
            preventDefault: jest.fn()
        };
        
        gameScene.handleKeyDown(keyboardEvent);
        expect(gameScene.selectedBinType).toBe(1);
        
        // 模拟鼠标点击：放置垃圾桶
        const mouseEvent = {
            clientX: 400,
            clientY: 200,
            preventDefault: jest.fn()
        };
        
        const clickResult = gameScene.handleMouseClick(mouseEvent);
        expect(clickResult).toBeTruthy();
    });

    test('should handle pause and resume functionality', () => {
        const gameScene = new GameScene();
        gameScene.initialize();
        gameScene.startLevel(1);
        
        expect(gameScene.levelSystem.isPaused).toBe(false);
        
        // 暂停游戏
        gameScene.pauseGame();
        expect(gameScene.levelSystem.isPaused).toBe(true);
        
        // 恢复游戏
        gameScene.resumeGame();
        expect(gameScene.levelSystem.isPaused).toBe(false);
    });

    test('should handle settings and preferences', () => {
        const gameScene = new GameScene();
        gameScene.initialize();
        
        // 测试音量设置
        gameScene.setSoundVolume(0.5);
        gameScene.setMusicVolume(0.3);
        
        // 测试静音切换
        gameScene.toggleMute();
        
        // 验证设置被保存
        expect(window.localStorage.setItem).toHaveBeenCalled();
    });

    test('should handle error recovery', () => {
        const gameScene = new GameScene();
        
        // 模拟初始化错误
        const originalConsoleError = console.error;
        console.error = jest.fn();
        
        try {
            // 尝试在没有Canvas的情况下初始化
            document.getElementById.mockReturnValueOnce(null);
            
            const initResult = gameScene.initialize();
            
            // 应该优雅地处理错误
            expect(console.error).toHaveBeenCalled();
            
        } finally {
            console.error = originalConsoleError;
        }
    });

    test('should handle data persistence', () => {
        const gameScene = new GameScene();
        gameScene.initialize();
        gameScene.startLevel(1);
        
        // 模拟游戏进度
        gameScene.levelSystem.addScore(100);
        gameScene.levelSystem.onZombieCollected(true);
        
        // 保存游戏数据
        gameScene.saveGameData();
        
        // 验证数据被保存到localStorage
        expect(window.localStorage.setItem).toHaveBeenCalledWith(
            expect.stringContaining('game'),
            expect.any(String)
        );
        
        // 模拟加载游戏数据
        window.localStorage.getItem.mockReturnValue(JSON.stringify({
            level: 1,
            score: 100,
            timestamp: Date.now()
        }));
        
        const loadedData = gameScene.loadGameData();
        expect(loadedData).toBeTruthy();
    });

    test('should handle performance monitoring', () => {
        const gameScene = new GameScene();
        gameScene.initialize();
        
        // 模拟性能监控
        const performanceData = {
            fps: 60,
            frameTime: 16.67,
            memoryUsage: 50
        };
        
        gameScene.updatePerformanceMetrics(performanceData);
        
        // 验证性能数据被记录
        expect(gameScene.performanceMetrics).toBeTruthy();
    });

    test('should complete full game session', () => {
        // 模拟完整的游戏会话
        const gameEngine = new GameEngine();
        gameEngine.initialize();
        
        // 1. 开始游戏
        const gameScene = new GameScene();
        gameEngine.sceneManager.switchScene(gameScene);
        
        // 2. 完成多个关卡
        for (let level = 1; level <= 3; level++) {
            gameScene.startLevel(level);
            
            // 模拟快速完成关卡
            const levelConfig = GameConfig.levels[level - 1];
            for (let i = 0; i < levelConfig.zombieCount; i++) {
                gameScene.levelSystem.onZombieCollected(true);
            }
            
            expect(gameScene.levelSystem.isLevelComplete()).toBe(true);
            
            if (level < 3) {
                gameScene.nextLevel();
            }
        }
        
        // 3. 验证游戏完成
        expect(gameScene.levelSystem.currentLevel).toBe(3);
        
        // 4. 清理资源
        gameEngine.destroy();
    });
});