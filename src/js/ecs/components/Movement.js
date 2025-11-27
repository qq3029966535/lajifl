/**
 * 移动组件
 * 管理实体的移动和速度
 */
import { Component } from '../Component.js';
import { Vector2 } from '../../core/Vector2.js';

export class Movement extends Component {
    constructor(speed = 0, direction = null) {
        super();
        this.speed = speed; // 像素/秒
        this.velocity = new Vector2(0, 0);
        this.direction = direction ? direction.clone() : new Vector2(1, 0);
        this.maxSpeed = speed;
        this.acceleration = new Vector2(0, 0);
        this.friction = 0.9;
        this.isMoving = false;
    }

    /**
     * 设置速度
     * @param {number} speed - 速度值
     */
    setSpeed(speed) {
        this.speed = speed;
        this.maxSpeed = speed;
    }

    /**
     * 设置方向
     * @param {Vector2} direction - 方向向量
     */
    setDirection(direction) {
        this.direction.copy(direction).normalize();
        this.updateVelocity();
    }

    /**
     * 设置方向（角度）
     * @param {number} angle - 角度（弧度）
     */
    setDirectionAngle(angle) {
        this.direction.set(Math.cos(angle), Math.sin(angle));
        this.updateVelocity();
    }

    /**
     * 更新速度向量
     */
    updateVelocity() {
        this.velocity.copy(this.direction).multiply(this.speed);
    }

    /**
     * 开始移动
     */
    startMoving() {
        this.isMoving = true;
        this.updateVelocity();
    }

    /**
     * 停止移动
     */
    stopMoving() {
        this.isMoving = false;
        this.velocity.set(0, 0);
    }

    /**
     * 添加力
     * @param {Vector2} force - 力向量
     */
    addForce(force) {
        this.acceleration.add(force);
    }

    /**
     * 设置目标位置（自动移动到目标）
     * @param {Vector2} target - 目标位置
     */
    moveToTarget(target) {
        if (!this.entity || !this.entity.hasComponent('Transform')) return;

        const transform = this.entity.getComponent('Transform');
        const direction = transform.directionTo({ position: target });
        this.setDirection(direction);
        this.startMoving();
    }

    /**
     * 更新移动组件
     * @param {number} deltaTime - 时间间隔（毫秒）
     */
    update(deltaTime) {
        if (!this.entity || !this.entity.hasComponent('Transform')) return;

        const transform = this.entity.getComponent('Transform');
        const dt = deltaTime / 1000; // 转换为秒

        if (this.isMoving) {
            // 应用加速度
            this.velocity.add(new Vector2(
                this.acceleration.x * dt,
                this.acceleration.y * dt
            ));

            // 限制最大速度
            if (this.velocity.length() > this.maxSpeed) {
                this.velocity.normalize().multiply(this.maxSpeed);
            }

            // 更新位置
            transform.translate(
                this.velocity.x * dt,
                this.velocity.y * dt
            );
        }

        // 应用摩擦力
        this.velocity.multiply(this.friction);
        this.acceleration.set(0, 0);

        // 如果速度很小，停止移动
        if (this.velocity.length() < 0.1) {
            this.velocity.set(0, 0);
        }
    }

    /**
     * 检查是否在移动
     */
    isMovingNow() {
        return this.isMoving && this.velocity.length() > 0.1;
    }

    /**
     * 获取当前速度大小
     */
    getCurrentSpeed() {
        return this.velocity.length();
    }

    /**
     * 反弹（反转方向）
     */
    bounce() {
        this.direction.multiply(-1);
        this.updateVelocity();
    }
}