/**
 * 游戏配置测试
 */
import { GameConfig, TrashBinType, TrashType } from '../src/js/config/GameConfig.js';

describe('Game Configuration', () => {
    test('should have valid trash bin types', () => {
        expect(TrashBinType.KITCHEN_WASTE).toBe(1);
        expect(TrashBinType.RECYCLABLE).toBe(2);
        expect(TrashBinType.HAZARDOUS).toBe(3);
        expect(TrashBinType.OTHER).toBe(4);
    });

    test('should have valid trash types', () => {
        expect(TrashType.KITCHEN_WASTE).toBe('kitchen_waste');
        expect(TrashType.RECYCLABLE).toBe('recyclable');
        expect(TrashType.HAZARDOUS).toBe('hazardous');
        expect(TrashType.OTHER).toBe('other');
    });

    test('should have correct trash bin configurations', () => {
        const kitchenBin = GameConfig.trashBins[TrashBinType.KITCHEN_WASTE];
        
        expect(kitchenBin.name).toBe('厨余垃圾桶');
        expect(kitchenBin.color).toBe('#4CAF50');
        expect(kitchenBin.collectTypes).toContain(TrashType.KITCHEN_WASTE);
        expect(kitchenBin.collectRadius).toBe(40);
    });

    test('should have 5 levels configured', () => {
        expect(GameConfig.levels).toHaveLength(5);
        
        GameConfig.levels.forEach((level, index) => {
            expect(level.id).toBe(index + 1);
            expect(level.timeLimit).toBe(120);
            expect(level.trackCount).toBeGreaterThan(0);
            expect(level.trackCount).toBeLessThanOrEqual(5);
        });
    });

    test('should have increasing difficulty across levels', () => {
        for (let i = 1; i < GameConfig.levels.length; i++) {
            const prevLevel = GameConfig.levels[i - 1];
            const currentLevel = GameConfig.levels[i];
            
            expect(currentLevel.trackCount).toBeGreaterThanOrEqual(prevLevel.trackCount);
            expect(currentLevel.zombieCount).toBeGreaterThan(prevLevel.zombieCount);
            expect(currentLevel.spawnInterval).toBeLessThanOrEqual(prevLevel.spawnInterval);
        }
    });

    test('should have valid color theme', () => {
        expect(GameConfig.colors.background).toMatch(/^#[0-9A-F]{6}$/i);
        expect(GameConfig.colors.track).toMatch(/^#[0-9A-F]{6}$/i);
        expect(GameConfig.colors.success).toMatch(/^#[0-9A-F]{6}$/i);
        expect(GameConfig.colors.error).toMatch(/^#[0-9A-F]{6}$/i);
    });

    test('should have eco facts', () => {
        expect(GameConfig.ecoFacts).toBeInstanceOf(Array);
        expect(GameConfig.ecoFacts.length).toBeGreaterThan(0);
        
        GameConfig.ecoFacts.forEach(fact => {
            expect(typeof fact).toBe('string');
            expect(fact.length).toBeGreaterThan(0);
        });
    });

    test('should have valid gameplay configuration', () => {
        expect(GameConfig.gameplay.correctScore).toBeGreaterThan(0);
        expect(GameConfig.gameplay.lives).toBeGreaterThan(0);
        expect(GameConfig.gameplay.binPlacementCost).toBeGreaterThanOrEqual(0);
    });
});