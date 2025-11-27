/**
 * 补救机制测试
 */
import { TrashZombie } from '../src/js/entities/TrashZombie.js';
import { TrashBin } from '../src/js/entities/TrashBin.js';
import { Vector2 } from '../src/js/core/Vector2.js';
import { TrashBinType, TrashType } from '../src/js/config/GameConfig.js';

describe('Retry Mechanism', () => {
    let trash;
    let correctBin;
    let wrongBin;

    beforeEach(() => {
        trash = new TrashZombie(TrashType.KITCHEN_WASTE, 1, new Vector2(100, 100));
        correctBin = new TrashBin(TrashBinType.KITCHEN_WASTE, new Vector2(50, 100));
        wrongBin = new TrashBin(TrashBinType.HAZARDOUS, new Vector2(50, 100));
    });

    test('should allow retry after incorrect classification', () => {
        expect(trash.canRetry()).toBe(true);
        expect(trash.retryCount).toBe(0);
        
        // 错误分类
        trash.getCollected(wrongBin, false);
        
        expect(trash.isInRetryMode).toBe(true);
        expect(trash.retryCount).toBe(1);
        expect(trash.canRetry()).toBe(true);
        expect(trash.isCollected).toBe(false);
    });

    test('should exit retry mode after delay', () => {
        trash.getCollected(wrongBin, false);
        expect(trash.isInRetryMode).toBe(true);
        
        // 模拟时间流逝
        trash.update(1100); // 超过1秒的重试延迟
        
        expect(trash.isInRetryMode).toBe(false);
    });

    test('should limit retry attempts', () => {
        // 第一次错误
        trash.getCollected(wrongBin, false);
        expect(trash.canRetry()).toBe(true);
        
        // 退出重试模式
        trash.update(1100);
        
        // 第二次错误
        trash.getCollected(wrongBin, false);
        expect(trash.canRetry()).toBe(false);
        expect(trash.retryCount).toBe(2);
        
        // 第三次错误应该强制收集
        trash.getCollected(wrongBin, false);
        expect(trash.isCollected).toBe(true);
    });

    test('should collect immediately on correct classification', () => {
        // 正确分类
        trash.getCollected(correctBin, true);
        
        expect(trash.isCollected).toBe(true);
        expect(trash.isInRetryMode).toBe(false);
        expect(trash.retryCount).toBe(0);
    });

    test('should track misclassification status', () => {
        expect(trash.hasBeenMisclassified).toBe(false);
        
        trash.getCollected(wrongBin, false);
        
        expect(trash.hasBeenMisclassified).toBe(true);
    });

    test('should provide correct retry information', () => {
        const info = trash.getInfo();
        
        expect(info.retryCount).toBe(0);
        expect(info.maxRetries).toBe(2);
        expect(info.isInRetryMode).toBe(false);
        expect(info.hasBeenMisclassified).toBe(false);
        
        trash.getCollected(wrongBin, false);
        
        const updatedInfo = trash.getInfo();
        expect(updatedInfo.retryCount).toBe(1);
        expect(updatedInfo.isInRetryMode).toBe(true);
        expect(updatedInfo.hasBeenMisclassified).toBe(true);
    });
});