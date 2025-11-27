/**
 * 收集系统测试
 */
import { TrashBin } from '../src/js/entities/TrashBin.js';
import { TrashZombie } from '../src/js/entities/TrashZombie.js';
import { CollectionSystem } from '../src/js/systems/CollectionSystem.js';
import { TrashBinSystem } from '../src/js/systems/TrashBinSystem.js';
import { TrackSystem } from '../src/js/systems/TrackSystem.js';
import { Vector2 } from '../src/js/core/Vector2.js';
import { TrashBinType, TrashType } from '../src/js/config/GameConfig.js';

describe('Collection System', () => {
    let trackSystem;
    let trashBinSystem;
    let collectionSystem;

    beforeEach(() => {
        trackSystem = new TrackSystem();
        trackSystem.initializeTracks(1);
        
        trashBinSystem = new TrashBinSystem(trackSystem);
        collectionSystem = new CollectionSystem(trashBinSystem);
    });

    test('TrashBin should collect correct trash type', () => {
        const bin = new TrashBin(TrashBinType.KITCHEN_WASTE, new Vector2(100, 100));
        const trash = new TrashZombie(TrashType.KITCHEN_WASTE, 1, new Vector2(90, 100));
        
        const result = bin.collect(trash);
        
        expect(result.success).toBe(true);
        expect(result.correct).toBe(true);
        expect(result.points).toBeGreaterThan(0);
    });

    test('TrashBin should reject incorrect trash type', () => {
        const bin = new TrashBin(TrashBinType.KITCHEN_WASTE, new Vector2(100, 100));
        const trash = new TrashZombie(TrashType.HAZARDOUS, 1, new Vector2(90, 100));
        
        const result = bin.collect(trash);
        
        expect(result.success).toBe(true);
        expect(result.correct).toBe(false);
        expect(result.points).toBe(0);
    });

    test('CollectionSystem should track statistics', () => {
        const bin = new TrashBin(TrashBinType.KITCHEN_WASTE, new Vector2(100, 100));
        trashBinSystem.placedBins.push(bin);
        
        const trash1 = new TrashZombie(TrashType.KITCHEN_WASTE, 1, new Vector2(100, 100));
        const trash2 = new TrashZombie(TrashType.HAZARDOUS, 1, new Vector2(100, 100));
        
        collectionSystem.performCollection(trash1, bin);
        collectionSystem.performCollection(trash2, bin);
        
        const stats = collectionSystem.getCollectionStats();
        
        expect(stats.total).toBe(2);
        expect(stats.correct).toBe(1);
        expect(stats.incorrect).toBe(1);
        expect(stats.accuracy).toBe(50);
    });

    test('TrashZombie should have correct type properties', () => {
        const trash = new TrashZombie(TrashType.RECYCLABLE, 1, new Vector2(0, 0));
        
        expect(trash.type).toBe(TrashType.RECYCLABLE);
        expect(trash.labelText).toBe('可回收');
        expect(trash.isCollected).toBe(false);
    });

    test('Collection should mark trash as collected', () => {
        const bin = new TrashBin(TrashBinType.RECYCLABLE, new Vector2(100, 100));
        const trash = new TrashZombie(TrashType.RECYCLABLE, 1, new Vector2(100, 100));
        
        expect(trash.isCollected).toBe(false);
        
        trash.getCollected(bin);
        
        expect(trash.isCollected).toBe(true);
    });
});