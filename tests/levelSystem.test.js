/**
 * 关卡系统测试
 */
import { LevelSystem } from '../src/js/systems/LevelSystem.js';
import { GameConfig } from '../src/js/config/GameConfig.js';

describe('Level System', () => {
    let levelSystem;

    beforeEach(() => {
        levelSystem = new LevelSystem();
    });

    test('should initialize with level 1', () => {
        expect(levelSystem.currentLevel).toBe(1);
        expect(levelSystem.isLevelActive).toBe(false);
        expect(levelSystem.isPaused).toBe(false);
    });

    test('should start level correctly', () => {
        levelSystem.startLevel(1);
        
        expect(levelSystem.isLevelActive).toBe(true);
        expect(levelSystem.currentLevel).toBe(1);
        expect(levelSystem.levelStartTime).toBeTruthy();
        expect(levelSystem.remainingTime).toBe(GameConfig.levels[0].timeLimit);
    });

    test('should not start invalid level', () => {
        const result = levelSystem.startLevel(999);
        
        expect(result).toBe(false);
        expect(levelSystem.isLevelActive).toBe(false);
    });

    test('should pause and resume level', () => {
        levelSystem.startLevel(1);
        
        levelSystem.pauseLevel();
        expect(levelSystem.isPaused).toBe(true);
        
        levelSystem.resumeLevel();
        expect(levelSystem.isPaused).toBe(false);
    });

    test('should complete level when all zombies collected', () => {
        levelSystem.startLevel(1);
        
        const levelConfig = GameConfig.levels[0];
        
        // 模拟收集所有垃圾
        for (let i = 0; i < levelConfig.zombieCount; i++) {
            levelSystem.onZombieCollected(true); // 正确收集
        }
        
        expect(levelSystem.isLevelComplete()).toBe(true);
    });

    test('should fail level when zombie reaches end', () => {
        levelSystem.startLevel(1);
        
        levelSystem.onZombieReachedEnd();
        
        expect(levelSystem.isLevelFailed()).toBe(true);
        expect(levelSystem.isLevelActive).toBe(false);
    });

    test('should fail level when time runs out', () => {
        levelSystem.startLevel(1);
        
        // 模拟时间耗尽
        levelSystem.remainingTime = 0;
        levelSystem.update(16);
        
        expect(levelSystem.isLevelFailed()).toBe(true);
        expect(levelSystem.isLevelActive).toBe(false);
    });

    test('should calculate level statistics', () => {
        levelSystem.startLevel(1);
        
        // 模拟一些收集
        levelSystem.onZombieCollected(true);  // 正确
        levelSystem.onZombieCollected(false); // 错误
        levelSystem.onZombieCollected(true);  // 正确
        
        const stats = levelSystem.getLevelStats();
        
        expect(stats.correctCount).toBe(2);
        expect(stats.errorCount).toBe(1);
        expect(stats.totalCount).toBe(3);
        expect(stats.accuracy).toBeCloseTo(66.67, 1);
    });

    test('should track score correctly', () => {
        levelSystem.startLevel(1);
        
        levelSystem.addScore(10);
        levelSystem.addScore(15);
        
        expect(levelSystem.currentScore).toBe(25);
    });

    test('should get progress percentage', () => {
        levelSystem.startLevel(1);
        
        const levelConfig = GameConfig.levels[0];
        const halfZombies = Math.floor(levelConfig.zombieCount / 2);
        
        for (let i = 0; i < halfZombies; i++) {
            levelSystem.onZombieCollected(true);
        }
        
        const progress = levelSystem.getProgress();
        expect(progress).toBeCloseTo(50, 0);
    });

    test('should reset level state', () => {
        levelSystem.startLevel(1);
        levelSystem.addScore(100);
        levelSystem.onZombieCollected(true);
        
        levelSystem.resetLevel();
        
        expect(levelSystem.isLevelActive).toBe(false);
        expect(levelSystem.currentScore).toBe(0);
        expect(levelSystem.correctCount).toBe(0);
        expect(levelSystem.errorCount).toBe(0);
    });
});