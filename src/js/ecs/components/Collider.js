/**
 * 碰撞器组件
 * 管理实体的碰撞检测
 */
import { Component } from '../Component.js';
import { Vector2 } from '../../core/Vector2.js';

export const ColliderType = {
    CIRCLE: 'circle',
    RECTANGLE: 'rectangle',
    POINT: 'point'
};

export class Collider extends Component {
    constructor(bounds, type = ColliderType.CIRCLE) {
        super();
        this.type = type;
        this.bounds = bounds || {};
        this.isTrigger = false;
        this.enabled = true;
        this.layer = 0;
        this.tags = new Set();
        
        // 设置默认边界
        this.setupDefaultBounds();
    }

    /**
     * 设置默认边界
     */
    setupDefaultBounds() {
        switch (this.type) {
            case ColliderType.CIRCLE:
                this.bounds.radius = this.bounds.radius || 16;
                break;
            case ColliderType.RECTANGLE:
                this.bounds.width = this.bounds.width || 32;
                this.bounds.height = this.bounds.height || 32;
                break;
            case ColliderType.POINT:
                // 点碰撞器不需要额外参数
                break;
        }
    }

    /**
     * 设置为触发器
     * @param {boolean} isTrigger - 是否为触发器
     */
    setTrigger(isTrigger) {
        this.isTrigger = isTrigger;
    }

    /**
     * 启用/禁用碰撞器
     * @param {boolean} enabled - 是否启用
     */
    setEnabled(enabled) {
        this.enabled = enabled;
    }

    /**
     * 设置碰撞层
     * @param {number} layer - 碰撞层
     */
    setLayer(layer) {
        this.layer = layer;
    }

    /**
     * 添加标签
     * @param {string} tag - 标签
     */
    addTag(tag) {
        this.tags.add(tag);
    }

    /**
     * 移除标签
     * @param {string} tag - 标签
     */
    removeTag(tag) {
        this.tags.delete(tag);
    }

    /**
     * 检查是否有标签
     * @param {string} tag - 标签
     */
    hasTag(tag) {
        return this.tags.has(tag);
    }

    /**
     * 获取世界边界
     * @param {Transform} transform - 变换组件
     */
    getWorldBounds(transform) {
        if (!transform) return null;

        const worldBounds = { ...this.bounds };
        
        switch (this.type) {
            case ColliderType.CIRCLE:
                worldBounds.x = transform.position.x;
                worldBounds.y = transform.position.y;
                worldBounds.radius = this.bounds.radius * transform.scale;
                break;
                
            case ColliderType.RECTANGLE:
                worldBounds.x = transform.position.x - (this.bounds.width * transform.scale) / 2;
                worldBounds.y = transform.position.y - (this.bounds.height * transform.scale) / 2;
                worldBounds.width = this.bounds.width * transform.scale;
                worldBounds.height = this.bounds.height * transform.scale;
                break;
                
            case ColliderType.POINT:
                worldBounds.x = transform.position.x;
                worldBounds.y = transform.position.y;
                break;
        }
        
        return worldBounds;
    }

    /**
     * 检查与另一个碰撞器的碰撞
     * @param {Collider} other - 另一个碰撞器
     * @param {Transform} thisTransform - 当前实体的变换
     * @param {Transform} otherTransform - 另一个实体的变换
     */
    checkCollision(other, thisTransform, otherTransform) {
        if (!this.enabled || !other.enabled) return false;
        if (!thisTransform || !otherTransform) return false;

        const thisBounds = this.getWorldBounds(thisTransform);
        const otherBounds = other.getWorldBounds(otherTransform);

        return this.testCollision(thisBounds, this.type, otherBounds, other.type);
    }

    /**
     * 测试两个边界的碰撞
     * @param {Object} bounds1 - 第一个边界
     * @param {string} type1 - 第一个类型
     * @param {Object} bounds2 - 第二个边界
     * @param {string} type2 - 第二个类型
     */
    testCollision(bounds1, type1, bounds2, type2) {
        // 圆形与圆形碰撞
        if (type1 === ColliderType.CIRCLE && type2 === ColliderType.CIRCLE) {
            return this.circleToCircle(bounds1, bounds2);
        }
        
        // 矩形与矩形碰撞
        if (type1 === ColliderType.RECTANGLE && type2 === ColliderType.RECTANGLE) {
            return this.rectangleToRectangle(bounds1, bounds2);
        }
        
        // 圆形与矩形碰撞
        if (type1 === ColliderType.CIRCLE && type2 === ColliderType.RECTANGLE) {
            return this.circleToRectangle(bounds1, bounds2);
        }
        
        if (type1 === ColliderType.RECTANGLE && type2 === ColliderType.CIRCLE) {
            return this.circleToRectangle(bounds2, bounds1);
        }
        
        // 点与其他形状的碰撞
        if (type1 === ColliderType.POINT) {
            return this.pointToShape(bounds1, bounds2, type2);
        }
        
        if (type2 === ColliderType.POINT) {
            return this.pointToShape(bounds2, bounds1, type1);
        }
        
        return false;
    }

    /**
     * 圆形与圆形碰撞检测
     */
    circleToCircle(circle1, circle2) {
        const dx = circle1.x - circle2.x;
        const dy = circle1.y - circle2.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < (circle1.radius + circle2.radius);
    }

    /**
     * 矩形与矩形碰撞检测
     */
    rectangleToRectangle(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }

    /**
     * 圆形与矩形碰撞检测
     */
    circleToRectangle(circle, rect) {
        const closestX = Math.max(rect.x, Math.min(circle.x, rect.x + rect.width));
        const closestY = Math.max(rect.y, Math.min(circle.y, rect.y + rect.height));
        
        const dx = circle.x - closestX;
        const dy = circle.y - closestY;
        
        return (dx * dx + dy * dy) < (circle.radius * circle.radius);
    }

    /**
     * 点与形状碰撞检测
     */
    pointToShape(point, shape, shapeType) {
        switch (shapeType) {
            case ColliderType.CIRCLE:
                const dx = point.x - shape.x;
                const dy = point.y - shape.y;
                return (dx * dx + dy * dy) < (shape.radius * shape.radius);
                
            case ColliderType.RECTANGLE:
                return point.x >= shape.x && point.x <= shape.x + shape.width &&
                       point.y >= shape.y && point.y <= shape.y + shape.height;
                       
            default:
                return false;
        }
    }

    /**
     * 渲染碰撞器边界（调试用）
     * @param {CanvasRenderingContext2D} ctx - 渲染上下文
     * @param {Transform} transform - 变换组件
     */
    renderDebug(ctx, transform) {
        if (!this.enabled || !transform) return;

        const bounds = this.getWorldBounds(transform);
        
        ctx.save();
        ctx.strokeStyle = this.isTrigger ? '#00FF00' : '#FF0000';
        ctx.lineWidth = 2;
        
        switch (this.type) {
            case ColliderType.CIRCLE:
                ctx.beginPath();
                ctx.arc(bounds.x, bounds.y, bounds.radius, 0, Math.PI * 2);
                ctx.stroke();
                break;
                
            case ColliderType.RECTANGLE:
                ctx.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height);
                break;
                
            case ColliderType.POINT:
                ctx.beginPath();
                ctx.arc(bounds.x, bounds.y, 3, 0, Math.PI * 2);
                ctx.fill();
                break;
        }
        
        ctx.restore();
    }
}