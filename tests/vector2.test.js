/**
 * Vector2 数学库测试
 */
import { Vector2 } from '../src/js/core/Vector2.js';

describe('Vector2', () => {
    test('should create vector with default values', () => {
        const v = new Vector2();
        expect(v.x).toBe(0);
        expect(v.y).toBe(0);
    });

    test('should create vector with specified values', () => {
        const v = new Vector2(3, 4);
        expect(v.x).toBe(3);
        expect(v.y).toBe(4);
    });

    test('should clone vector correctly', () => {
        const v1 = new Vector2(5, 6);
        const v2 = v1.clone();
        
        expect(v2.x).toBe(5);
        expect(v2.y).toBe(6);
        expect(v2).not.toBe(v1); // 不同的对象引用
    });

    test('should add vectors correctly', () => {
        const v1 = new Vector2(1, 2);
        const v2 = new Vector2(3, 4);
        
        v1.add(v2);
        
        expect(v1.x).toBe(4);
        expect(v1.y).toBe(6);
    });

    test('should subtract vectors correctly', () => {
        const v1 = new Vector2(5, 7);
        const v2 = new Vector2(2, 3);
        
        v1.subtract(v2);
        
        expect(v1.x).toBe(3);
        expect(v1.y).toBe(4);
    });

    test('should multiply by scalar correctly', () => {
        const v = new Vector2(2, 3);
        
        v.multiply(2);
        
        expect(v.x).toBe(4);
        expect(v.y).toBe(6);
    });

    test('should divide by scalar correctly', () => {
        const v = new Vector2(8, 12);
        
        v.divide(4);
        
        expect(v.x).toBe(2);
        expect(v.y).toBe(3);
    });

    test('should calculate magnitude correctly', () => {
        const v = new Vector2(3, 4);
        
        expect(v.magnitude()).toBe(5);
    });

    test('should calculate squared magnitude correctly', () => {
        const v = new Vector2(3, 4);
        
        expect(v.magnitudeSquared()).toBe(25);
    });

    test('should normalize vector correctly', () => {
        const v = new Vector2(3, 4);
        
        v.normalize();
        
        expect(v.magnitude()).toBeCloseTo(1, 5);
        expect(v.x).toBeCloseTo(0.6, 5);
        expect(v.y).toBeCloseTo(0.8, 5);
    });

    test('should calculate distance between vectors', () => {
        const v1 = new Vector2(0, 0);
        const v2 = new Vector2(3, 4);
        
        expect(Vector2.distance(v1, v2)).toBe(5);
    });

    test('should calculate squared distance between vectors', () => {
        const v1 = new Vector2(0, 0);
        const v2 = new Vector2(3, 4);
        
        expect(Vector2.distanceSquared(v1, v2)).toBe(25);
    });

    test('should calculate dot product correctly', () => {
        const v1 = new Vector2(2, 3);
        const v2 = new Vector2(4, 5);
        
        expect(Vector2.dot(v1, v2)).toBe(23); // 2*4 + 3*5 = 23
    });

    test('should lerp between vectors correctly', () => {
        const v1 = new Vector2(0, 0);
        const v2 = new Vector2(10, 20);
        
        const result = Vector2.lerp(v1, v2, 0.5);
        
        expect(result.x).toBe(5);
        expect(result.y).toBe(10);
    });

    test('should create static vectors correctly', () => {
        expect(Vector2.zero().x).toBe(0);
        expect(Vector2.zero().y).toBe(0);
        
        expect(Vector2.one().x).toBe(1);
        expect(Vector2.one().y).toBe(1);
        
        expect(Vector2.up().x).toBe(0);
        expect(Vector2.up().y).toBe(-1);
        
        expect(Vector2.down().x).toBe(0);
        expect(Vector2.down().y).toBe(1);
        
        expect(Vector2.left().x).toBe(-1);
        expect(Vector2.left().y).toBe(0);
        
        expect(Vector2.right().x).toBe(1);
        expect(Vector2.right().y).toBe(0);
    });

    test('should set vector values correctly', () => {
        const v = new Vector2(1, 2);
        
        v.set(5, 6);
        
        expect(v.x).toBe(5);
        expect(v.y).toBe(6);
    });

    test('should check vector equality correctly', () => {
        const v1 = new Vector2(3, 4);
        const v2 = new Vector2(3, 4);
        const v3 = new Vector2(5, 6);
        
        expect(v1.equals(v2)).toBe(true);
        expect(v1.equals(v3)).toBe(false);
    });

    test('should convert to string correctly', () => {
        const v = new Vector2(3.14, 2.71);
        
        expect(v.toString()).toBe('(3.14, 2.71)');
    });

    test('should handle zero vector normalization', () => {
        const v = new Vector2(0, 0);
        
        v.normalize();
        
        expect(v.x).toBe(0);
        expect(v.y).toBe(0);
    });

    test('should handle division by zero', () => {
        const v = new Vector2(4, 6);
        
        expect(() => v.divide(0)).toThrow();
    });
});