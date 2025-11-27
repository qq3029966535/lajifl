/**
 * 垃圾桶实体类
 * 管理垃圾桶的行为、动画和收集逻辑
 */
import { Entity } from '../ecs/Entity.js';
import { Transform } from '../ecs/components/Transform.js';
import { Renderer } from '../ecs/components/Renderer.js';
import { Collider, ColliderType } from '../ecs/components/Collider.js';
import { Vector2 } from '../core/Vector2.js';
import { TrashBinType, TrashType, GameConfig } from '../config/GameConfig.js';

export class TrashBin extends Entity {
    constructor(type, position) {
        super();
        
        this.type = type;
        this.config = GameConfig.trashBins[type];
        this.collectRadius = this.config.collectRadius;
        this.collectTypes = [...this.config.collectTypes];
        
        // 动画状态
        this.animationState = 'idle'; // idle, collecting, celebrating, angry
        this.animationTime = 0;
        this.expression = 'neutral'; // neutral, happy, angry, surprised
        
        // 收集统计
        this.collectCount = 0;
        this.correctCollections = 0;
        this.incorrectCollections = 0;
        
        // 初始化组件
        this.initializeComponents(position);
    }

    /**
     * 初始化实体组件
     * @param {Vector2} position - 初始位置
     */
    initializeComponents(position) {
        // 变换组件
        const transform = new Transform(position.x, position.y);
        this.addComponent(transform);
        
        // 渲染组件
        const renderer = new Renderer();
        renderer.setColor(this.config.color);
        renderer.setSize(32, 40); // Q版垃圾桶尺寸
        this.addComponent(renderer);
        
        // 碰撞组件
        const collider = new Collider(
            { radius: this.collectRadius },
            ColliderType.CIRCLE
        );
        collider.setTrigger(true);
        collider.addTag('trashbin');
        collider.addTag(`bin_type_${this.type}`);
        this.addComponent(collider);
    }

    /**
     * 检查是否可以收集指定类型的垃圾
     * @param {string} trashType - 垃圾类型
     */
    canCollect(trashType) {
        return this.collectTypes.includes(trashType);
    }

    /**
     * 收集垃圾
     * @param {TrashZombie} trash - 垃圾僵尸
     */
    collect(trash) {
        const isCorrect = this.canCollect(trash.type);
        
        this.collectCount++;
        
        if (isCorrect) {
            this.correctCollections++;
            this.playAnimation('celebrating');
            this.setExpression('happy');
            console.log(`${this.config.name} 正确收集了 ${trash.type}`);
            return { success: true, correct: true, points: GameConfig.gameplay.correctScore };
        } else {
            this.incorrectCollections++;
            this.playAnimation('angry');
            this.setExpression('angry');
            console.log(`${this.config.name} 错误收集了 ${trash.type}`);
            return { success: true, correct: false, points: 0 };
        }
    }

    /**
     * 播放动画
     * @param {string} animationType - 动画类型
     */
    playAnimation(animationType) {
        this.animationState = animationType;
        this.animationTime = 0;
        
        switch (animationType) {
            case 'collecting':
                // 收集动画：垃圾桶张嘴
                break;
            case 'celebrating':
                // 庆祝动画：跳跃和转圈
                break;
            case 'angry':
                // 愤怒动画：摇摆和变红
                break;
            case 'idle':
            default:
                // 待机动画：轻微呼吸效果
                break;
        }
    }

    /**
     * 设置表情
     * @param {string} expression - 表情类型
     */
    setExpression(expression) {
        this.expression = expression;
    }

    /**
     * 说话（显示拟人化台词）
     */
    speak() {
        return this.config.dialogue;
    }

    /**
     * 更新垃圾桶
     * @param {number} deltaTime - 时间间隔
     */
    update(deltaTime) {
        this.animationTime += deltaTime;
        
        // 更新动画
        this.updateAnimation(deltaTime);
        
        // 动画结束后回到待机状态
        if (this.animationTime > 2000 && this.animationState !== 'idle') {
            this.playAnimation('idle');
            this.setExpression('neutral');
        }
    }

    /**
     * 更新动画效果
     * @param {number} deltaTime - 时间间隔
     */
    updateAnimation(deltaTime) {
        const transform = this.getComponent('Transform');
        const renderer = this.getComponent('Renderer');
        
        if (!transform || !renderer) return;
        
        const time = this.animationTime / 1000; // 转换为秒
        
        switch (this.animationState) {
            case 'idle':
                // 轻微的呼吸动画
                const breathScale = 1 + Math.sin(time * 2) * 0.05;
                transform.setScale(breathScale);
                break;
                
            case 'collecting':
                // 张嘴动画（通过缩放模拟）
                const mouthScale = 1 + Math.sin(time * 10) * 0.2;
                transform.setScale(mouthScale);
                break;
                
            case 'celebrating':
                // 跳跃和旋转动画
                const jumpHeight = Math.abs(Math.sin(time * 8)) * 10;
                transform.position.y -= jumpHeight;
                transform.rotate(deltaTime * 0.01);
                
                // 恢复位置（简化处理）
                transform.position.y += jumpHeight;
                break;
                
            case 'angry':
                // 摇摆动画
                const shakeX = Math.sin(time * 15) * 3;
                const originalX = transform.position.x;
                transform.position.x = originalX + shakeX;
                
                // 变红效果
                renderer.setColor('#FF4444');
                
                // 恢复位置
                transform.position.x = originalX;
                break;
        }
    }

    /**
     * 渲染垃圾桶
     * @param {RenderSystem} renderSystem - 渲染系统
     */
    render(renderSystem) {
        const transform = this.getComponent('Transform');
        const renderer = this.getComponent('Renderer');
        
        if (!transform || !renderer) return;
        
        // 添加垃圾桶主体渲染
        renderSystem.add2DRender((ctx) => {
            this.renderBin(ctx, transform, renderer);
        }, renderSystem.layers.ENTITIES);
        
        // 如果支持3D，创建3D模型
        if (renderSystem.renderer3D) {
            const binModel = renderSystem.createTrashBin3D(this.type, this.config.color);
            if (binModel) {
                binModel.position.set(transform.position.x, 0, -transform.position.y);
                renderSystem.add3DObject(binModel);
            }
        }
    }

    /**
     * 渲染2D垃圾桶
     * @param {CanvasRenderingContext2D} ctx - 渲染上下文
     * @param {Transform} transform - 变换组件
     * @param {Renderer} renderer - 渲染组件
     */
    renderBin(ctx, transform, renderer) {
        ctx.save();
        
        // 应用变换
        ctx.translate(transform.position.x, transform.position.y);
        ctx.rotate(transform.rotation);
        ctx.scale(transform.scale, transform.scale);
        
        // 绘制垃圾桶主体
        this.drawBinBody(ctx, renderer);
        
        // 绘制表情
        this.drawExpression(ctx);
        
        // 绘制收集范围（调试模式）
        if (this.showCollectionRange) {
            this.drawCollectionRange(ctx);
        }
        
        ctx.restore();
    }

    /**
     * 绘制垃圾桶主体
     * @param {CanvasRenderingContext2D} ctx - 渲染上下文
     * @param {Renderer} renderer - 渲染组件
     */
    drawBinBody(ctx, renderer) {
        const width = renderer.width;
        const height = renderer.height;
        
        // 垃圾桶主体（梯形）
        ctx.fillStyle = renderer.color;
        ctx.beginPath();
        ctx.moveTo(-width * 0.4, -height * 0.5);
        ctx.lineTo(width * 0.4, -height * 0.5);
        ctx.lineTo(width * 0.5, height * 0.3);
        ctx.lineTo(-width * 0.5, height * 0.3);
        ctx.closePath();
        ctx.fill();
        
        // 垃圾桶盖子
        ctx.fillStyle = this.getLighterColor(renderer.color);
        ctx.fillRect(-width * 0.5, -height * 0.5, width, height * 0.2);
        
        // 边框
        ctx.strokeStyle = '#333333';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-width * 0.4, -height * 0.5);
        ctx.lineTo(width * 0.4, -height * 0.5);
        ctx.lineTo(width * 0.5, height * 0.3);
        ctx.lineTo(-width * 0.5, height * 0.3);
        ctx.closePath();
        ctx.stroke();
        
        // 盖子边框
        ctx.strokeRect(-width * 0.5, -height * 0.5, width, height * 0.2);
    }

    /**
     * 绘制表情
     * @param {CanvasRenderingContext2D} ctx - 渲染上下文
     */
    drawExpression(ctx) {
        // 眼睛
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(-8, -5, 3, 0, Math.PI * 2);
        ctx.arc(8, -5, 3, 0, Math.PI * 2);
        ctx.fill();
        
        // 嘴巴根据表情变化
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        switch (this.expression) {
            case 'happy':
                // 笑脸
                ctx.arc(0, 5, 8, 0, Math.PI);
                break;
            case 'angry':
                // 愤怒
                ctx.moveTo(-8, 8);
                ctx.lineTo(8, 12);
                break;
            case 'surprised':
                // 惊讶（圆形嘴巴）
                ctx.arc(0, 8, 4, 0, Math.PI * 2);
                break;
            case 'neutral':
            default:
                // 中性表情
                ctx.moveTo(-6, 8);
                ctx.lineTo(6, 8);
                break;
        }
        
        ctx.stroke();
    }

    /**
     * 绘制收集范围
     * @param {CanvasRenderingContext2D} ctx - 渲染上下文
     */
    drawCollectionRange(ctx) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.arc(0, 0, this.collectRadius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
    }

    /**
     * 获取较亮的颜色
     * @param {string} color - 原始颜色
     */
    getLighterColor(color) {
        // 简单的颜色变亮算法
        const hex = color.replace('#', '');
        const r = Math.min(255, parseInt(hex.substr(0, 2), 16) + 40);
        const g = Math.min(255, parseInt(hex.substr(2, 2), 16) + 40);
        const b = Math.min(255, parseInt(hex.substr(4, 2), 16) + 40);
        
        return `rgb(${r}, ${g}, ${b})`;
    }

    /**
     * 获取垃圾桶统计信息
     */
    getStats() {
        return {
            type: this.type,
            name: this.config.name,
            collectCount: this.collectCount,
            correctCollections: this.correctCollections,
            incorrectCollections: this.incorrectCollections,
            accuracy: this.collectCount > 0 ? (this.correctCollections / this.collectCount) * 100 : 0
        };
    }

    /**
     * 重置统计信息
     */
    resetStats() {
        this.collectCount = 0;
        this.correctCollections = 0;
        this.incorrectCollections = 0;
    }

    /**
     * 切换收集范围显示
     */
    toggleCollectionRangeDisplay() {
        this.showCollectionRange = !this.showCollectionRange;
    }
}