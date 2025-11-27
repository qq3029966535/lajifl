/**
 * 碰撞检测测试
 */
import { CollisionUtils } from '../src/js/utils/CollisionUtils.js';
import { Vector2 } from '../src/js/core/Vector2.js';
import { Track } from '../src/js/entities/Track.js';

describe('Collision Detection', () => {
    test('Point in circle collision', () => {
        const center = new Vector2(0, 0);
        const radius = 10;
        
        expect(CollisionUtils.pointInCircle(new Vector2(5, 5), center, radius)).toBe(true);
        expect(CollisionUtils.pointInCircle(new Vector2(15, 0), center, radius)).toBe(false);
        expect(CollisionUtils.pointInCircle(new Vector2(7, 7), center, radius)).toBe(true);
    });

    test('Point in rectangle collision', () => {
        const rect = { x: 0, y: 0, width: 100, height: 50 };
        
        expect(CollisionUtils.pointInRectangle(new Vector2(50, 25), rect)).toBe(true);
        expect(CollisionUtils.pointInRectangle(new Vector2(150, 25), rect)).toBe(false);
        expect(CollisionUtils.pointInRectangle(new Vector2(0, 0), rect)).toBe(true);
        expect(CollisionUtils.pointInRectangle(new Vector2(100, 50), rect)).toBe(true);
    });

    test('Point to line distance', () => {
        const lineStart = new Vector2(0, 0);
        const lineEnd = new Vector2(100, 0);
        
        // 点在线上
        expect(CollisionUtils.pointToLineDistance(new Vector2(50, 0), lineStart, lineEnd)).toBe(0);
        
        // 点在线的垂直方向
        expect(CollisionUtils.pointToLineDistance(new Vector2(50, 10), lineStart, lineEnd)).toBe(10);
        
        // 点在线段延长线上
        expect(CollisionUtils.pointToLineDistance(new Vector2(150, 0), lineStart, lineEnd)).toBe(50);
    });

    test('Circle to circle collision', () => {
        const center1 = new Vector2(0, 0);
        const center2 = new Vector2(15, 0);
        
        expect(CollisionUtils.circleToCircle(center1, 10, center2, 10)).toBe(true);
        expect(CollisionUtils.circleToCircle(center1, 5, center2, 5)).toBe(false);
        expect(CollisionUtils.circleToCircle(center1, 8, center2, 8)).toBe(true);
    });

    test('Track point collision', () => {
        const track = new Track(
            1,
            new Vector2(0, 0),
            new Vector2(100, 0),
            20
        );
        
        // 点在轨道上
        expect(track.isPointOnTrack(50, 0)).toBe(true);
        expect(track.isPointOnTrack(50, 5)).toBe(true);
        
        // 点在轨道外
        expect(track.isPointOnTrack(50, 15)).toBe(false);
        expect(track.isPointOnTrack(150, 0)).toBe(false);
    });

    test('Track bin placement', () => {
        const track = new Track(
            1,
            new Vector2(0, 0),
            new Vector2(100, 0),
            40
        );
        
        const position1 = new Vector2(50, 0);
        const position2 = new Vector2(30, 0);
        const binRadius = 15;
        
        // 第一个位置应该可以放置
        expect(track.canPlaceBin(position1, binRadius)).toBe(true);
        
        // 模拟放置垃圾桶
        track.addBin({ position: position1, collectRadius: binRadius });
        
        // 第二个位置太近，不应该可以放置
        expect(track.canPlaceBin(position2, binRadius)).toBe(false);
        
        // 距离足够远的位置应该可以放置
        const position3 = new Vector2(80, 0);
        expect(track.canPlaceBin(position3, binRadius)).toBe(true);
    });
});