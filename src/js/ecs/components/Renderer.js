/**
 * 渲染组件
 * 管理实体的视觉表现
 */
import { Component } from '../Component.js';

export class Renderer extends Component {
    constructor(sprite = null, animations = null) {
        super();
        this.sprite = sprite;
        this.animations = animations || new Map();
        this.currentAnimation = null;
        this.visible = true;
        this.color = '#FFFFFF';
        this.alpha = 1.0;
        this.width = 32;
        this.height = 32;
        this.offsetX = 0;
        this.offsetY = 0;
    }

    /**
     * 设置精灵图像
     * @param {HTMLImageElement|string} sprite - 图像或颜色
     */
    setSprite(sprite) {
        this.sprite = sprite;
    }

    /**
     * 设置颜色
     * @param {string} color - 颜色值
     */
    setColor(color) {
        this.color = color;
    }

    /**
     * 设置透明度
     * @param {number} alpha - 透明度 (0-1)
     */
    setAlpha(alpha) {
        this.alpha = Math.max(0, Math.min(1, alpha));
    }

    /**
     * 设置尺寸
     * @param {number} width - 宽度
     * @param {number} height - 高度
     */
    setSize(width, height) {
        this.width = width;
        this.height = height;
    }

    /**
     * 设置渲染偏移
     * @param {number} offsetX - X轴偏移
     * @param {number} offsetY - Y轴偏移
     */
    setOffset(offsetX, offsetY) {
        this.offsetX = offsetX;
        this.offsetY = offsetY;
    }

    /**
     * 添加动画
     * @param {string} name - 动画名称
     * @param {Animation} animation - 动画对象
     */
    addAnimation(name, animation) {
        this.animations.set(name, animation);
    }

    /**
     * 播放动画
     * @param {string} name - 动画名称
     */
    playAnimation(name) {
        const animation = this.animations.get(name);
        if (animation) {
            this.currentAnimation = animation;
            animation.reset();
        }
    }

    /**
     * 停止动画
     */
    stopAnimation() {
        this.currentAnimation = null;
    }

    /**
     * 显示渲染器
     */
    show() {
        this.visible = true;
    }

    /**
     * 隐藏渲染器
     */
    hide() {
        this.visible = false;
    }

    /**
     * 更新渲染器
     * @param {number} deltaTime - 时间间隔
     */
    update(deltaTime) {
        if (this.currentAnimation) {
            this.currentAnimation.update(deltaTime);
        }
    }

    /**
     * 渲染实体
     * @param {CanvasRenderingContext2D} ctx - 渲染上下文
     * @param {Transform} transform - 变换组件
     */
    render(ctx, transform) {
        if (!this.visible || !transform) return;

        ctx.save();

        // 设置透明度
        ctx.globalAlpha = this.alpha;

        // 应用变换
        ctx.translate(
            transform.position.x + this.offsetX,
            transform.position.y + this.offsetY
        );
        ctx.rotate(transform.rotation);
        ctx.scale(transform.scale, transform.scale);

        // 渲染内容
        if (this.sprite) {
            if (typeof this.sprite === 'string') {
                // 渲染颜色矩形
                ctx.fillStyle = this.sprite;
                ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
            } else {
                // 渲染图像
                ctx.drawImage(
                    this.sprite,
                    -this.width / 2,
                    -this.height / 2,
                    this.width,
                    this.height
                );
            }
        } else {
            // 默认渲染为彩色矩形
            ctx.fillStyle = this.color;
            ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
        }

        ctx.restore();
    }
}