/**
 * 碰撞检测系统
 * 统一管理游戏中所有实体的碰撞检测
 */
import { CollisionUtils } from '../utils/CollisionUtils.js';
import { Vector2 } from '../core/Vector2.js';

export class CollisionSystem {
    constructor() {
        this.collisionPairs = [];
        this.spatialGrid = new SpatialGrid(100); // 空间分割网格，提高性能
        this.debugMode = false;
        
        // 碰撞事件回调
        this.onCollisionEnter = null;
        this.onCollisionStay = null;
        this.onCollisionExit = null;
    }

    /**
     * 添加碰撞对
     * @param {Entity} entityA - 实体A
     * @param {Entity} entityB - 实体B
     * @param {Function} callback - 碰撞回调
     */
    addCollisionPair(entityA, entityB, callback) {
        this.collisionPairs.push({
            entityA,
            entityB,
            callback,
            wasColliding: false
        });
    }

    /**
     * 移除碰撞对
     * @param {Entity} entityA - 实体A
     * @param {Entity} entityB - 实体B
     */
    removeCollisionPair(entityA, entityB) {
        this.collisionPairs = this.collisionPairs.filter(pair => 
            !(pair.entityA === entityA && pair.entityB === entityB) &&
            !(pair.entityA === entityB && pair.entityB === entityA)
        );
    }

    /**
     * 检查两个实体是否碰撞
     * @param {Entity} entityA - 实体A
     * @param {Entity} entityB - 实体B
     */
    checkEntityCollision(entityA, entityB) {
        const transformA = entityA.getComponent('Transform');
        const colliderA = entityA.getComponent('Collider');
        const transformB = entityB.getComponent('Transform');
        const colliderB = entityB.getComponent('Collider');
        
        if (!transformA || !colliderA || !transformB || !colliderB) {
            return false;
        }
        
        if (!colliderA.enabled || !colliderB.enabled) {
            return false;
        }
        
        return colliderA.checkCollision(colliderB, transformA, transformB);
    }

    /**
     * 检查点与实体的碰撞
     * @param {Vector2} point - 点
     * @param {Entity} entity - 实体
     */
    checkPointCollision(point, entity) {
        const transform = entity.getComponent('Transform');
        const collider = entity.getComponent('Collider');
        
        if (!transform || !collider || !collider.enabled) {
            return false;
        }
        
        const bounds = collider.getWorldBounds(transform);
        return CollisionUtils.pointInCircle(point, transform.position, bounds.radius);
    }

    /**
     * 获取指定位置的所有实体
     * @param {Vector2} position - 位置
     * @param {Array} entities - 要检查的实体列表
     */
    getEntitiesAtPosition(position, entities) {
        const result = [];
        
        for (const entity of entities) {
            if (this.checkPointCollision(position, entity)) {
                result.push(entity);
            }
        }
        
        return result;
    }

    /**
     * 获取指定区域内的所有实体
     * @param {Vector2} center - 中心点
     * @param {number} radius - 半径
     * @param {Array} entities - 要检查的实体列表
     */
    getEntitiesInRadius(center, radius, entities) {
        const result = [];
        
        for (const entity of entities) {
            const transform = entity.getComponent('Transform');
            if (!transform) continue;
            
            const distance = Vector2.distance(center, transform.position);
            if (distance <= radius) {
                result.push(entity);
            }
        }
        
        return result;
    }

    /**
     * 射线检测
     * @param {Vector2} origin - 射线起点
     * @param {Vector2} direction - 射线方向
     * @param {number} maxDistance - 最大距离
     * @param {Array} entities - 要检查的实体列表
     */
    raycast(origin, direction, maxDistance, entities) {
        const hits = [];
        const normalizedDirection = direction.clone().normalize();
        
        for (const entity of entities) {
            const transform = entity.getComponent('Transform');
            const collider = entity.getComponent('Collider');
            
            if (!transform || !collider || !collider.enabled) continue;
            
            // 简化的射线-圆形碰撞检测
            const toEntity = new Vector2(
                transform.position.x - origin.x,
                transform.position.y - origin.y
            );
            
            const projection = Vector2.dot(toEntity, normalizedDirection);
            
            if (projection < 0 || projection > maxDistance) continue;
            
            const projectionPoint = new Vector2(
                origin.x + normalizedDirection.x * projection,
                origin.y + normalizedDirection.y * projection
            );
            
            const bounds = collider.getWorldBounds(transform);
            const distance = Vector2.distance(projectionPoint, transform.position);
            
            if (distance <= bounds.radius) {
                hits.push({
                    entity,
                    distance: projection,
                    point: projectionPoint
                });
            }
        }
        
        // 按距离排序
        hits.sort((a, b) => a.distance - b.distance);
        return hits;
    }

    /**
     * 更新碰撞检测系统
     * @param {number} deltaTime - 时间间隔
     */
    update(deltaTime) {
        // 检查所有碰撞对
        for (const pair of this.collisionPairs) {
            const isColliding = this.checkEntityCollision(pair.entityA, pair.entityB);
            
            if (isColliding && !pair.wasColliding) {
                // 碰撞开始
                if (pair.callback) {
                    pair.callback('enter', pair.entityA, pair.entityB);
                }
                if (this.onCollisionEnter) {
                    this.onCollisionEnter(pair.entityA, pair.entityB);
                }
            } else if (isColliding && pair.wasColliding) {
                // 碰撞持续
                if (pair.callback) {
                    pair.callback('stay', pair.entityA, pair.entityB);
                }
                if (this.onCollisionStay) {
                    this.onCollisionStay(pair.entityA, pair.entityB);
                }
            } else if (!isColliding && pair.wasColliding) {
                // 碰撞结束
                if (pair.callback) {
                    pair.callback('exit', pair.entityA, pair.entityB);
                }
                if (this.onCollisionExit) {
                    this.onCollisionExit(pair.entityA, pair.entityB);
                }
            }
            
            pair.wasColliding = isColliding;
        }
    }

    /**
     * 渲染调试信息
     * @param {CanvasRenderingContext2D} ctx - 渲染上下文
     * @param {Array} entities - 实体列表
     */
    renderDebug(ctx, entities) {
        if (!this.debugMode) return;
        
        ctx.save();
        
        // 渲染所有碰撞器
        for (const entity of entities) {
            const transform = entity.getComponent('Transform');
            const collider = entity.getComponent('Collider');
            
            if (transform && collider) {
                collider.renderDebug(ctx, transform);
            }
        }
        
        // 渲染碰撞对连线
        ctx.strokeStyle = '#FFFF00';
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 2]);
        
        for (const pair of this.collisionPairs) {
            if (pair.wasColliding) {
                const transformA = pair.entityA.getComponent('Transform');
                const transformB = pair.entityB.getComponent('Transform');
                
                if (transformA && transformB) {
                    ctx.beginPath();
                    ctx.moveTo(transformA.position.x, transformA.position.y);
                    ctx.lineTo(transformB.position.x, transformB.position.y);
                    ctx.stroke();
                }
            }
        }
        
        ctx.setLineDash([]);
        ctx.restore();
    }

    /**
     * 切换调试模式
     */
    toggleDebugMode() {
        this.debugMode = !this.debugMode;
    }

    /**
     * 设置事件回调
     * @param {Object} callbacks - 回调函数对象
     */
    setCallbacks(callbacks) {
        this.onCollisionEnter = callbacks.onCollisionEnter;
        this.onCollisionStay = callbacks.onCollisionStay;
        this.onCollisionExit = callbacks.onCollisionExit;
    }

    /**
     * 清空所有碰撞对
     */
    clear() {
        this.collisionPairs = [];
    }

    /**
     * 销毁碰撞系统
     */
    destroy() {
        this.clear();
        this.spatialGrid = null;
    }
}

/**
 * 空间分割网格
 * 用于优化碰撞检测性能
 */
class SpatialGrid {
    constructor(cellSize) {
        this.cellSize = cellSize;
        this.grid = new Map();
    }

    /**
     * 获取网格键
     * @param {number} x - X坐标
     * @param {number} y - Y坐标
     */
    getKey(x, y) {
        const gridX = Math.floor(x / this.cellSize);
        const gridY = Math.floor(y / this.cellSize);
        return `${gridX},${gridY}`;
    }

    /**
     * 添加实体到网格
     * @param {Entity} entity - 实体
     */
    addEntity(entity) {
        const transform = entity.getComponent('Transform');
        if (!transform) return;
        
        const key = this.getKey(transform.position.x, transform.position.y);
        
        if (!this.grid.has(key)) {
            this.grid.set(key, []);
        }
        
        this.grid.get(key).push(entity);
    }

    /**
     * 从网格移除实体
     * @param {Entity} entity - 实体
     */
    removeEntity(entity) {
        const transform = entity.getComponent('Transform');
        if (!transform) return;
        
        const key = this.getKey(transform.position.x, transform.position.y);
        const cell = this.grid.get(key);
        
        if (cell) {
            const index = cell.indexOf(entity);
            if (index > -1) {
                cell.splice(index, 1);
            }
            
            if (cell.length === 0) {
                this.grid.delete(key);
            }
        }
    }

    /**
     * 获取附近的实体
     * @param {Vector2} position - 位置
     * @param {number} radius - 半径
     */
    getNearbyEntities(position, radius) {
        const entities = new Set();
        const cellRadius = Math.ceil(radius / this.cellSize);
        
        const centerX = Math.floor(position.x / this.cellSize);
        const centerY = Math.floor(position.y / this.cellSize);
        
        for (let x = centerX - cellRadius; x <= centerX + cellRadius; x++) {
            for (let y = centerY - cellRadius; y <= centerY + cellRadius; y++) {
                const key = `${x},${y}`;
                const cell = this.grid.get(key);
                
                if (cell) {
                    for (const entity of cell) {
                        entities.add(entity);
                    }
                }
            }
        }
        
        return Array.from(entities);
    }

    /**
     * 清空网格
     */
    clear() {
        this.grid.clear();
    }
}