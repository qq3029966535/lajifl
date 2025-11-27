/**
 * 位置变换组件
 * 管理实体的位置、旋转和缩放
 */
import { Component } from '../Component.js';
import { Vector2 } from '../../core/Vector2.js';

export class Transform extends Component {
    constructor(x = 0, y = 0, rotation = 0, scale = 1) {
        super();
        this.position = new Vector2(x, y);
        this.rotation = rotation; // 弧度
        this.scale = scale;
        this.localPosition = new Vector2(x, y);
        this.worldPosition = new Vector2(x, y);
    }

    /**
     * 设置位置
     * @param {number} x - X坐标
     * @param {number} y - Y坐标
     */
    setPosition(x, y) {
        this.position.set(x, y);
        this.updateWorldPosition();
    }

    /**
     * 移动位置
     * @param {number} deltaX - X轴偏移
     * @param {number} deltaY - Y轴偏移
     */
    translate(deltaX, deltaY) {
        this.position.x += deltaX;
        this.position.y += deltaY;
        this.updateWorldPosition();
    }

    /**
     * 设置旋转角度
     * @param {number} rotation - 旋转角度（弧度）
     */
    setRotation(rotation) {
        this.rotation = rotation;
    }

    /**
     * 旋转
     * @param {number} deltaRotation - 旋转增量（弧度）
     */
    rotate(deltaRotation) {
        this.rotation += deltaRotation;
    }

    /**
     * 设置缩放
     * @param {number} scale - 缩放值
     */
    setScale(scale) {
        this.scale = scale;
    }

    /**
     * 更新世界坐标
     */
    updateWorldPosition() {
        this.worldPosition.copy(this.position);
        // 这里可以添加父子关系的坐标变换逻辑
    }

    /**
     * 获取前方向量
     */
    getForward() {
        return new Vector2(
            Math.cos(this.rotation),
            Math.sin(this.rotation)
        );
    }

    /**
     * 获取右方向量
     */
    getRight() {
        return new Vector2(
            Math.cos(this.rotation + Math.PI / 2),
            Math.sin(this.rotation + Math.PI / 2)
        );
    }

    /**
     * 计算到另一个Transform的距离
     * @param {Transform} other - 另一个Transform组件
     */
    distanceTo(other) {
        return Vector2.distance(this.position, other.position);
    }

    /**
     * 计算到另一个Transform的方向
     * @param {Transform} other - 另一个Transform组件
     */
    directionTo(other) {
        const direction = new Vector2(
            other.position.x - this.position.x,
            other.position.y - this.position.y
        );
        return direction.normalize();
    }
}