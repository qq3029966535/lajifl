/**
 * 垃圾僵尸系统测试
 */
import { TrashZombieSystem } from '../src/js/systems/TrashZombieSystem.js';
import { TrackSystem } from '../src/js/systems/TrackSystem.js';
import { TrashType } from '../src/js/config/GameConfig.js';

describe('TrashZombieSystem', () => {
    let trackSystem;
    let zombieSystem;

    beforeEach(() => {
        trackSystem = new TrackSystem();
        trackSystem.initializeTracks(2);
        
        zombieSystem = new TrashZombieSystem(trackSystem);
    });

    afterEach(() => {
        zombieSystem.destroy();
    });

    test('should spawn zombie on valid track', () => {
        const zombie = zombieSystem.spawnZombie(TrashType.KITCHEN_WASTE, 1);
        
        expect(zombie).toBeTruthy();
        expect(zombie.type).toBe(TrashType.KITCHEN_WASTE);
        expect(zombie.trackId).toBe(1);
        expect(zombieSystem.activeZombies).toContain(zombie);
    });

    test('should not spawn zombie on invalid track', () => {
        const zombie = zombieSystem.spawnZombie(TrashType.KITCHEN_WASTE, 999);
        
        expect(zombie).toBeNull();
        expect(zombieSystem.activeZombies).toHaveLength(0);
    });

    test('should respect max active zombies limit', () => {
        zombieSystem.maxActiveZombies = 2;
        
        // 生成最大数量的僵尸
        zombieSystem.spawnZombie(TrashType.KITCHEN_WASTE, 1);
        zombieSystem.spawnZombie(TrashType.RECYCLABLE, 1);
        
        // 尝试生成超出限制的僵尸
        const extraZombie = zombieSystem.spawnZombie(TrashType.HAZARDOUS, 1);
        
        expect(extraZombie).toBeNull();
        expect(zombieSystem.activeZombies).toHaveLength(2);
    });

    test('should remove zombie correctly', () => {
        const zombie = zombieSystem.spawnZombie(TrashType.KITCHEN_WASTE, 1);
        expect(zombieSystem.activeZombies).toHaveLength(1);
        
        zombieSystem.removeZombie(zombie);
        expect(zombieSystem.activeZombies).toHaveLength(0);
    });

    test('should set difficulty correctly', () => {
        const levelConfig = {
            spawnInterval: 1000
        };
        
        zombieSystem.setDifficulty(3, levelConfig);
        
        expect(zombieSystem.difficultyMultiplier).toBe(1.4); // 1 + (3-1) * 0.2
        expect(zombieSystem.speedMultiplier).toBe(1.2); // 1 + (3-1) * 0.1
        expect(zombieSystem.baseSpawnInterval).toBe(1000);
    });

    test('should get system stats', () => {
        zombieSystem.spawnZombie(TrashType.KITCHEN_WASTE, 1);
        zombieSystem.spawnZombie(TrashType.RECYCLABLE, 2);
        
        const stats = zombieSystem.getSystemStats();
        
        expect(stats.activeZombies).toBe(2);
        expect(stats.zombiesByType[TrashType.KITCHEN_WASTE]).toBe(1);
        expect(stats.zombiesByType[TrashType.RECYCLABLE]).toBe(1);
    });

    test('should clear all zombies', () => {
        zombieSystem.spawnZombie(TrashType.KITCHEN_WASTE, 1);
        zombieSystem.spawnZombie(TrashType.RECYCLABLE, 2);
        
        expect(zombieSystem.activeZombies).toHaveLength(2);
        
        zombieSystem.clearAllZombies();
        
        expect(zombieSystem.activeZombies).toHaveLength(0);
    });
});