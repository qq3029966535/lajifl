/**
 * 集成测试
 * 测试多个系统之间的协作
 */
import { GameEngine } from '../src/js/core/GameEngine.js';
import { GameScene } from '../src/js/scenes/GameScene.js';
import { TrackSystem } from '../src/js/systems/TrackSystem.js';
import { TrashBinSystem } from '../src/js/systems/TrashBinSystem.js';
import { TrashZombieSystem } from '../src/js/systems/TrashZombieSystem.js';
import { CollisionSystem } from '../src/js/systems/CollisionSystem.js';
import { CollectionSystem } from '../src/js/systems/CollectionSystem.js';
import { LevelSystem } from '../src/js/systems/LevelSystem.js';
import { Vector2 } from '../src/js/core/Vector2.js';
import { TrashBinType, TrashType } from '../src/js/config/GameConfig.js';

// Mock DOM elements
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
            scale: jest.fn()
        })),
        width: 1200,
        height: 800
    })),
    createElement: jest.fn(() => ({
        getContext: jest.fn(() => ({}))
    })),
    body: {
        appendChild: jest.fn()
    },
    head: {
        appendChild: jest.fn()
    }
};

global.window = {
    requestAnimationFrame: jest.fn(cb => setTimeout(cb, 16)),
    cancelAnimationFrame: jest.fn(),
    performance: {
        now: jest.fn(() => Date.now())
    },
    addEventListener: jest.fn(),
    AudioContext: jest.fn(() => ({
        createBuffer: jest.fn(),
        createBufferSource: jest.fn(),
        createGain: jest.fn(),
        destination: {},
        currentTime: 0,
        state: 'running',
        resume: jest.fn()
    }))
};

describe('Game Integration Tests', () => {
    let gameEngine;
    let gameScene;
    let trackSystem;
    let trashBinSystem;
    let zombieSystem;
    let collisionSystem;
    let collectionSystem;
    let levelSystem;

    beforeEach(() => {
        // 初始化游戏引擎
        gameEngine = new GameEngine();
        
        // 初始化系统
        trackSystem = new TrackSystem();
        trackSystem.initializeTracks(3);
        
        trashBinSystem = new TrashBinSystem(trackSystem);
        zombieSystem = new TrashZombieSystem(trackSystem);
        collisionSystem = new CollisionSystem();
        collectionSystem = new CollectionSystem(trashBinSystem);
        levelSystem = new LevelSystem();
        
        // 初始化游戏场景
        gameScene = new GameScene();
        gameScene.trackSystem = trackSystem;
        gameScene.trashBinSystem = trashBinSystem;
        gameScene.zombieSystem = zombieSystem;
        gameScene.collisionSystem = collisionSystem;
        gameScene.collectionSystem = collectionSystem;
        gameScene.levelSystem = levelSystem;
    });

    afterEach(() => {
        if (zombieSystem) {
            zombieSystem.destroy();
        }
        if (gameEngine) {
            gameEngine.destroy();
        }
    });

    test('should complete full game flow', () => {
        // 开始关卡
        levelSystem.startLevel(1);
        expect(levelSystem.isLevelActive).toBe(true);
        
        // 放置垃圾桶
        const binPosition = new Vector2(500, 200);
        const placementResult = trashBinSystem.placeBin(TrashBinType.KITCHEN_WASTE, binPosition);
        expect(placementResult.success).toBe(true);
        
        // 生成垃圾僵尸
        const zombie = zombieSystem.spawnZombie(TrashType.KITCHEN_WASTE, 1);
        expect(zombie).toBeTruthy();
        expect(zombieSystem.activeZombies).toContain(zombie);
        
        // 移动僵尸到垃圾桶附近
        zombie.position.set(binPosition.x, binPosition.y);
        
        // 检测碰撞
        const bin = trashBinSystem.placedBins[0];
        const collision = collisionSystem.checkCollision(zombie, bin);
        expect(collision).toBe(true);
        
        // 执行收集
        const collectionResult = collectionSystem.performCollection(zombie, bin);
        expect(collectionResult.success).toBe(true);
        expect(collectionResult.correct).toBe(true);
        
        // 验证僵尸被收集
        expect(zombie.isCollected).toBe(true);
        
        // 验证分数增加
        expect(levelSystem.currentScore).toBeGreaterThan(0);
    });

    test('should handle incorrect classification with retry', () => {
        levelSystem.startLevel(1);
        
        // 放置错误类型的垃圾桶
        const binPosition = new Vector2(500, 200);
        trashBinSystem.placeBin(TrashBinType.HAZARDOUS, binPosition);
        
        // 生成不匹配的垃圾
        const zombie = zombieSystem.spawnZombie(TrashType.KITCHEN_WASTE, 1);
        zombie.position.set(binPosition.x, binPosition.y);
        
        // 执行错误收集
        const bin = trashBinSystem.placedBins[0];
        const collectionResult = collectionSystem.performCollection(zombie, bin);
        
        expect(collectionResult.success).toBe(true);
        expect(collectionResult.correct).toBe(false);
        expect(zombie.isInRetryMode).toBe(true);
        expect(zombie.isCollected).toBe(false);
        
        // 验证可以重试
        expect(zombie.canRetry()).toBe(true);
    });

    test('should handle zombie reaching track end', () => {
        levelSystem.startLevel(1);
        
        const zombie = zombieSystem.spawnZombie(TrashType.KITCHEN_WASTE, 1);
        const track = trackSystem.tracks[0];
        
        // 移动僵尸到轨道终点
        zombie.position.set(track.endPoint.x, track.endPoint.y);
        
        // 检查是否到达终点
        const reachedEnd = zombie.position.x <= track.endPoint.x;
        expect(reachedEnd).toBe(true);
        
        // 触发失败
        levelSystem.onZombieReachedEnd();
        expect(levelSystem.isLevelFailed()).toBe(true);
    });

    test('should handle multiple zombies and bins', () => {
        levelSystem.startLevel(2); // 使用有多条轨道的关卡
        
        // 放置多个垃圾桶
        trashBinSystem.placeBin(TrashBinType.KITCHEN_WASTE, new Vector2(400, 200));
        trashBinSystem.placeBin(TrashBinType.RECYCLABLE, new Vector2(600, 320));
        
        // 生成多个僵尸
        const zombie1 = zombieSystem.spawnZombie(TrashType.KITCHEN_WASTE, 1);
        const zombie2 = zombieSystem.spawnZombie(TrashType.RECYCLABLE, 2);
        
        expect(zombieSystem.activeZombies).toHaveLength(2);
        expect(trashBinSystem.placedBins).toHaveLength(2);
        
        // 模拟正确收集
        zombie1.position.set(400, 200);
        zombie2.position.set(600, 320);
        
        const result1 = collectionSystem.performCollection(zombie1, trashBinSystem.placedBins[0]);
        const result2 = collectionSystem.performCollection(zombie2, trashBinSystem.placedBins[1]);
        
        expect(result1.correct).toBe(true);
        expect(result2.correct).toBe(true);
        expect(levelSystem.correctCount).toBe(2);
    });

    test('should handle level completion', () => {
        levelSystem.startLevel(1);
        
        const levelConfig = levelSystem.getCurrentLevelConfig();
        const requiredZombies = levelConfig.zombieCount;
        
        // 模拟收集所有垃圾
        for (let i = 0; i < requiredZombies; i++) {
            levelSystem.onZombieCollected(true);
        }
        
        expect(levelSystem.isLevelComplete()).toBe(true);
        expect(levelSystem.getProgress()).toBe(100);
    });

    test('should handle time limit', () => {
        levelSystem.startLevel(1);
        
        // 模拟时间流逝
        const timeLimit = levelSystem.getCurrentLevelConfig().timeLimit;
        levelSystem.remainingTime = 1; // 剩余1秒
        
        // 更新系统，时间耗尽
        levelSystem.update(1000); // 1秒后
        
        expect(levelSystem.remainingTime).toBeLessThanOrEqual(0);
        expect(levelSystem.isLevelFailed()).toBe(true);
    });

    test('should track statistics correctly', () => {
        levelSystem.startLevel(1);
        
        // 模拟游戏过程
        levelSystem.onZombieCollected(true);  // 正确
        levelSystem.onZombieCollected(false); // 错误
        levelSystem.onZombieCollected(true);  // 正确
        levelSystem.addScore(30);
        
        const stats = levelSystem.getLevelStats();
        
        expect(stats.correctCount).toBe(2);
        expect(stats.errorCount).toBe(1);
        expect(stats.totalCount).toBe(3);
        expect(stats.accuracy).toBeCloseTo(66.67, 1);
        expect(stats.score).toBe(30);
    });

    test('should handle system cleanup', () => {
        levelSystem.startLevel(1);
        
        // 添加一些游戏对象
        trashBinSystem.placeBin(TrashBinType.KITCHEN_WASTE, new Vector2(400, 200));
        zombieSystem.spawnZombie(TrashType.KITCHEN_WASTE, 1);
        
        expect(trashBinSystem.placedBins).toHaveLength(1);
        expect(zombieSystem.activeZombies).toHaveLength(1);
        
        // 重置关卡
        levelSystem.resetLevel();
        trashBinSystem.clearAllBins();
        zombieSystem.clearAllZombies();
        
        expect(trashBinSystem.placedBins).toHaveLength(0);
        expect(zombieSystem.activeZombies).toHaveLength(0);
        expect(levelSystem.isLevelActive).toBe(false);
    });

    test('should handle pause and resume', () => {
        levelSystem.startLevel(1);
        
        expect(levelSystem.isPaused).toBe(false);
        
        // 暂停游戏
        levelSystem.pauseLevel();
        expect(levelSystem.isPaused).toBe(true);
        
        // 恢复游戏
        levelSystem.resumeLevel();
        expect(levelSystem.isPaused).toBe(false);
    });

    test('should validate bin placement rules', () => {
        // 测试垃圾桶放置规则
        const position1 = new Vector2(400, 200);
        const position2 = new Vector2(410, 200); // 太近的位置
        
        const result1 = trashBinSystem.placeBin(TrashBinType.KITCHEN_WASTE, position1);
        expect(result1.success).toBe(true);
        
        const result2 = trashBinSystem.placeBin(TrashBinType.RECYCLABLE, position2);
        expect(result2.success).toBe(false); // 应该失败，因为太近
        
        // 测试轨道外放置
        const offTrackPosition = new Vector2(100, 100);
        const result3 = trashBinSystem.placeBin(TrashBinType.HAZARDOUS, offTrackPosition);
        expect(result3.success).toBe(false); // 应该失败，因为不在轨道上
    });
});