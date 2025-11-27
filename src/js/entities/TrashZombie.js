/**
 * 垃圾僵尸实体类
 * 表示移动的垃圾，需要被正确分类收集
 */
import { Entity } from '../ecs/Entity.js';
import { Transform } from '../ecs/components/Transform.js';
import { Renderer } from '../ecs/components/Renderer.js';
import { Movement } from '../ecs/components/Movement.js';
import { Collider, ColliderType } from '../ecs/components/Collider.js';
import { Vector2 } from '../core/Vector2.js';
import { TrashType, GameConfig } from '../config/GameConfig.js';

export class TrashZombie extends Entity {
    constructor(type, trackId, startPosition) {
        super();
        
        this.type = type;
        this.trackId = trackId;
        this.speed = 50; // 像素/秒
        this.isCollected = false;
        this.progress = 0; // 沿轨道的进度 (0-1)
        
        // 补救机制相关
        this.hasBeenMisclassified = false;
        this.retryCount = 0;
        this.maxRetries = 2; // 最多允许2次重试
        this.isInRetryMode = false;
        this.retryTimer = 0;
        this.retryDelay = 1000; // 重试延迟1秒
        
        // 视觉效果
        this.hasLabel = true;
        this.labelText = this.getTypeLabel(type);
        this.effectTime = 0;
        
        // 初始化组件
        this.initializeComponents(startPosition);
    }

    /**
     * 获取垃圾类型标签
     * @param {string} type - 垃圾类型
     */
    getTypeLabel(type) {
        const labels = {
            [TrashType.KITCHEN_WASTE]: '厨余',
            [TrashType.RECYCLABLE]: '可回收',
            [TrashType.HAZARDOUS]: '有害',
            [TrashType.OTHER]: '其他'
        };
        return labels[type] || '未知';
    }

    /**
     * 获取垃圾类型颜色
     * @param {string} type - 垃圾类型
     */
    getTypeColor(type) {
        const colors = {
            [TrashType.KITCHEN_WASTE]: '#8B4513',
            [TrashType.RECYCLABLE]: '#1E90FF',
            [TrashType.HAZARDOUS]: '#FF4500',
            [TrashType.OTHER]: '#808080'
        };
        return colors[type] || '#666666';
    }

    /**
     * 初始化实体组件
     * @param {Vector2} startPosition - 起始位置
     */
    initializeComponents(startPosition) {
        // 变换组件
        const transform = new Transform(startPosition.x, startPosition.y);
        this.addComponent(transform);
        
        // 渲染组件
        const renderer = new Renderer();
        renderer.setColor(this.getTypeColor(this.type));
        renderer.setSize(24, 24);
        this.addComponent(renderer);
        
        // 移动组件
        const movement = new Movement(this.speed, new Vector2(-1, 0)); // 向左移动
        movement.startMoving();
        this.addComponent(movement);
        
        // 碰撞组件
        const collider = new Collider(
            { radius: 12 },
            ColliderType.CIRCLE
        );
        collider.addTag('trash');
        collider.addTag(`trash_type_${this.type}`);
        this.addComponent(collider);
    }

    /**
     * 被收集
     * @param {TrashBin} bin - 收集的垃圾桶
     * @param {boolean} isCorrect - 是否正确分类
     */
    getCollected(bin, isCorrect = true) {
        if (this.isCollected) return;
        
        if (isCorrect) {
            // 正确收集，直接完成
            this.isCollected = true;
            
            // 停止移动
            const movement = this.getComponent('Movement');
            if (movement) {
                movement.stopMoving();
            }
            
            // 播放收集动画
            this.playCollectionEffect(bin);
            
            console.log(`${this.labelText}垃圾被${bin.config.name}正确收集`);
        } else {
            // 错误收集，进入重试模式
            this.handleMisclassification(bin);
        }
    }

    /**
     * 处理错误分类
     * @param {TrashBin} bin - 错误的垃圾桶
     */
    handleMisclassification(bin) {
        this.hasBeenMisclassified = true;
        this.retryCount++;
        
        if (this.retryCount <= this.maxRetries) {
            // 还有重试机会
            this.enterRetryMode();
            console.log(`${this.labelText}垃圾分类错误，进入重试模式 (${this.retryCount}/${this.maxRetries})`);
        } else {
            // 重试次数用完，强制收集
            this.isCollected = true;
            const movement = this.getComponent('Movement');
            if (movement) {
                movement.stopMoving();
            }
            console.log(`${this.labelText}垃圾重试次数用完，强制收集`);
        }
    }

    /**
     * 进入重试模式
     */
    enterRetryMode() {
        this.isInRetryMode = true;
        this.retryTimer = 0;
        
        // 暂停移动
        const movement = this.getComponent('Movement');
        if (movement) {
            movement.stopMoving();
        }
        
        // 改变视觉效果表示重试状态
        const renderer = this.getComponent('Renderer');
        if (renderer) {
            renderer.setAlpha(0.7); // 半透明表示重试状态
        }
    }

    /**
     * 退出重试模式
     */
    exitRetryMode() {
        this.isInRetryMode = false;
        this.retryTimer = 0;
        
        // 恢复移动
        const movement = this.getComponent('Movement');
        if (movement) {
            movement.startMoving();
        }
        
        // 恢复视觉效果
        const renderer = this.getComponent('Renderer');
        if (renderer) {
            renderer.setAlpha(1.0);
        }
    }

    /**
     * 检查是否可以重新分类
     */
    canRetry() {
        return this.retryCount < this.maxRetries && !this.isCollected;
    }

    /**
     * 播放收集特效
     * @param {TrashBin} bin - 收集的垃圾桶
     */
    playCollectionEffect(bin) {
        const transform = this.getComponent('Transform');
        const renderer = this.getComponent('Renderer');
        
        if (transform && renderer) {
            // 移动到垃圾桶位置
            const binTransform = bin.getComponent('Transform');
            if (binTransform) {
                transform.setPosition(binTransform.position.x, binTransform.position.y);
            }
            
            // 逐渐缩小并消失
            renderer.setAlpha(0.5);
            transform.setScale(0.5);
        }
        
        // 设置销毁定时器
        setTimeout(() => {
            this.destroy();
        }, 500);
    }

    /**
     * 检查是否到达轨道终点
     */
    isAtEnd() {
        return this.progress >= 1.0;
    }

    /**
     * 设置轨道引用
     * @param {Track} track - 轨道对象
     */
    setTrack(track) {
        this.track = track;
        this.updateMovementDirection();
    }

    /**
     * 更新移动方向
     */
    updateMovementDirection() {
        if (this.track) {
            const movement = this.getComponent('Movement');
            if (movement) {
                movement.setDirection(this.track.direction);
            }
        }
    }

    /**
     * 更新沿轨道的进度
     * @param {number} deltaTime - 时间间隔
     */
    updateTrackProgress(deltaTime) {
        if (!this.track) return;
        
        const transform = this.getComponent('Transform');
        if (!transform) return;
        
        // 计算当前在轨道上的进度
        this.progress = this.track.getProgressAlongTrack(transform.position);
        
        // 如果到达终点，停止移动
        if (this.progress >= 1.0) {
            const movement = this.getComponent('Movement');
            if (movement) {
                movement.stopMoving();
            }
        }
    }

    /**
     * 更新垃圾僵尸
     * @param {number} deltaTime - 时间间隔
     */
    update(deltaTime) {
        if (this.isCollected) return;
        
        this.effectTime += deltaTime;
        
        // 处理重试模式
        if (this.isInRetryMode) {
            this.updateRetryMode(deltaTime);
        } else {
            // 正常更新
            this.updateTrackProgress(deltaTime);
        }
        
        // 更新特效
        this.updateEffects(deltaTime);
        
        // 检查是否到达终点
        if (this.isAtEnd() && !this.isInRetryMode) {
            this.reachEnd();
        }
    }

    /**
     * 更新重试模式
     * @param {number} deltaTime - 时间间隔
     */
    updateRetryMode(deltaTime) {
        this.retryTimer += deltaTime;
        
        if (this.retryTimer >= this.retryDelay) {
            // 重试时间到，退出重试模式
            this.exitRetryMode();
        }
    }

    /**
     * 更新视觉特效
     * @param {number} deltaTime - 时间间隔
     */
    updateEffects(deltaTime) {
        const renderer = this.getComponent('Renderer');
        const transform = this.getComponent('Transform');
        if (!renderer || !transform) return;
        
        const time = this.effectTime / 1000; // 转换为秒
        
        // 根据垃圾类型添加特效
        switch (this.type) {
            case TrashType.HAZARDOUS:
                // 有害垃圾闪烁红光和警报效果
                const flash = Math.sin(time * 8) * 0.3 + 0.7;
                renderer.setAlpha(flash);
                
                // 轻微震动
                const shake = Math.sin(time * 15) * 1;
                this.basePosition = this.basePosition || transform.position.clone();
                transform.position.x = this.basePosition.x + shake;
                break;
                
            case TrashType.KITCHEN_WASTE:
                // 厨余垃圾摇摆和滴落效果
                const sway = Math.sin(time * 3) * 3;
                this.basePosition = this.basePosition || transform.position.clone();
                transform.position.y = this.basePosition.y + sway;
                
                // 随机生成滴落粒子
                if (Math.random() < 0.02) {
                    this.createDropParticle();
                }
                break;
                
            case TrashType.RECYCLABLE:
                // 可回收垃圾闪亮效果
                const shine = Math.sin(time * 4) * 0.2 + 0.8;
                renderer.setAlpha(shine);
                
                // 轻微旋转
                transform.rotate(deltaTime * 0.001);
                break;
                
            case TrashType.OTHER:
                // 其他垃圾轻微浮动
                const float = Math.sin(time * 2) * 1.5;
                this.basePosition = this.basePosition || transform.position.clone();
                transform.position.y = this.basePosition.y + float;
                break;
        }
    }

    /**
     * 创建滴落粒子效果
     */
    createDropParticle() {
        // 这里可以创建粒子效果，暂时用控制台输出模拟
        if (Math.random() < 0.1) { // 降低频率
            console.log('💧 厨余垃圾滴落效果');
        }
    }

    /**
     * 获取类型特效描述
     */
    getTypeEffectDescription() {
        const effects = {
            [TrashType.KITCHEN_WASTE]: '滴落酸液',
            [TrashType.RECYCLABLE]: '闪亮光泽',
            [TrashType.HAZARDOUS]: '警报红光',
            [TrashType.OTHER]: '轻微浮动'
        };
        return effects[this.type] || '无特效';
    }

    /**
     * 到达轨道终点
     */
    reachEnd() {
        console.log(`${this.labelText}垃圾到达终点，游戏失败！`);
        // 触发游戏失败事件
        this.destroy();
    }

    /**
     * 渲染垃圾僵尸
     * @param {RenderSystem} renderSystem - 渲染系统
     */
    render(renderSystem) {
        if (this.isCollected) return;
        
        const transform = this.getComponent('Transform');
        const renderer = this.getComponent('Renderer');
        
        if (!transform || !renderer) return;
        
        // 渲染垃圾主体
        renderSystem.add2DRender((ctx) => {
            this.renderTrash(ctx, transform, renderer);
        }, renderSystem.layers.ENTITIES);
        
        // 如果支持3D，创建3D模型
        if (renderSystem.renderer3D) {
            const trashModel = renderSystem.createTrashZombie3D(this.type);
            if (trashModel) {
                trashModel.position.set(transform.position.x, 0, -transform.position.y);
                renderSystem.add3DObject(trashModel);
            }
        }
    }

    /**
     * 渲染2D垃圾
     * @param {CanvasRenderingContext2D} ctx - 渲染上下文
     * @param {Transform} transform - 变换组件
     * @param {Renderer} renderer - 渲染组件
     */
    renderTrash(ctx, transform, renderer) {
        ctx.save();
        
        // 应用变换
        ctx.translate(transform.position.x, transform.position.y);
        ctx.rotate(transform.rotation);
        ctx.scale(transform.scale, transform.scale);
        ctx.globalAlpha = renderer.alpha;
        
        // 绘制垃圾主体
        this.drawTrashBody(ctx, renderer);
        
        // 绘制类型标签
        if (this.hasLabel) {
            this.drawTypeLabel(ctx);
        }
        
        // 绘制重试状态
        if (this.isInRetryMode || this.hasBeenMisclassified) {
            this.drawRetryStatus(ctx);
        }
        
        // 绘制特效
        this.drawEffects(ctx);
        
        ctx.restore();
    }

    /**
     * 绘制垃圾主体
     * @param {CanvasRenderingContext2D} ctx - 渲染上下文
     * @param {Renderer} renderer - 渲染组件
     */
    drawTrashBody(ctx, renderer) {
        const size = renderer.width;
        
        // 根据类型绘制不同形状
        switch (this.type) {
            case TrashType.KITCHEN_WASTE:
                // 厨余垃圾：不规则形状
                ctx.fillStyle = renderer.color;
                ctx.beginPath();
                ctx.ellipse(0, 0, size/2, size/3, 0, 0, Math.PI * 2);
                ctx.fill();
                break;
                
            case TrashType.RECYCLABLE:
                // 可回收：矩形
                ctx.fillStyle = renderer.color;
                ctx.fillRect(-size/2, -size/2, size, size);
                break;
                
            case TrashType.HAZARDOUS:
                // 有害垃圾：三角形
                ctx.fillStyle = renderer.color;
                ctx.beginPath();
                ctx.moveTo(0, -size/2);
                ctx.lineTo(-size/2, size/2);
                ctx.lineTo(size/2, size/2);
                ctx.closePath();
                ctx.fill();
                break;
                
            case TrashType.OTHER:
            default:
                // 其他垃圾：圆形
                ctx.fillStyle = renderer.color;
                ctx.beginPath();
                ctx.arc(0, 0, size/2, 0, Math.PI * 2);
                ctx.fill();
                break;
        }
        
        // 边框
        ctx.strokeStyle = '#333333';
        ctx.lineWidth = 1;
        ctx.stroke();
    }

    /**
     * 绘制类型标签
     * @param {CanvasRenderingContext2D} ctx - 渲染上下文
     */
    drawTypeLabel(ctx) {
        ctx.fillStyle = '#FFFFFF';
        ctx.strokeStyle = '#000000';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.lineWidth = 2;
        
        // 绘制文字描边
        ctx.strokeText(this.labelText, 0, -18);
        // 绘制文字
        ctx.fillText(this.labelText, 0, -18);
    }

    /**
     * 绘制特效
     * @param {CanvasRenderingContext2D} ctx - 渲染上下文
     */
    drawEffects(ctx) {
        const time = this.effectTime / 1000;
        
        switch (this.type) {
            case TrashType.HAZARDOUS:
                // 有害垃圾：警告符号和红光
                this.drawHazardousEffects(ctx, time);
                break;
                
            case TrashType.KITCHEN_WASTE:
                // 厨余垃圾：滴落效果和气味线
                this.drawKitchenWasteEffects(ctx, time);
                break;
                
            case TrashType.RECYCLABLE:
                // 可回收垃圾：闪光效果
                this.drawRecyclableEffects(ctx, time);
                break;
                
            case TrashType.OTHER:
                // 其他垃圾：问号标识
                this.drawOtherEffects(ctx, time);
                break;
        }
    }

    /**
     * 绘制有害垃圾特效
     */
    drawHazardousEffects(ctx, time) {
        // 警告符号
        ctx.fillStyle = '#FFFF00';
        ctx.strokeStyle = '#FF0000';
        ctx.font = 'bold 10px Arial';
        ctx.textAlign = 'center';
        ctx.lineWidth = 1;
        
        // 闪烁的警告标志
        const flash = Math.sin(time * 8) > 0;
        if (flash) {
            ctx.strokeText('⚠', 12, -8);
            ctx.fillText('⚠', 12, -8);
        }
        
        // 红色光晕
        const glowRadius = 15 + Math.sin(time * 6) * 3;
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, glowRadius);
        gradient.addColorStop(0, 'rgba(255, 0, 0, 0.3)');
        gradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, glowRadius, 0, Math.PI * 2);
        ctx.fill();
    }

    /**
     * 绘制厨余垃圾特效
     */
    drawKitchenWasteEffects(ctx, time) {
        // 滴落效果
        for (let i = 0; i < 3; i++) {
            const dropY = 15 + (time * 20 + i * 10) % 30;
            const dropX = (Math.sin(time + i) * 3);
            
            ctx.fillStyle = '#8B4513';
            ctx.beginPath();
            ctx.ellipse(dropX, dropY, 1, 2, 0, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // 气味线条
        ctx.strokeStyle = 'rgba(139, 69, 19, 0.5)';
        ctx.lineWidth = 1;
        for (let i = 0; i < 2; i++) {
            const waveY = -20 - i * 5;
            const waveX = Math.sin(time * 3 + i) * 5;
            
            ctx.beginPath();
            ctx.moveTo(waveX - 3, waveY);
            ctx.quadraticCurveTo(waveX, waveY - 3, waveX + 3, waveY);
            ctx.stroke();
        }
    }

    /**
     * 绘制可回收垃圾特效
     */
    drawRecyclableEffects(ctx, time) {
        // 闪光效果
        const sparkles = 4;
        for (let i = 0; i < sparkles; i++) {
            const angle = (time * 2 + i * Math.PI * 2 / sparkles) % (Math.PI * 2);
            const radius = 18 + Math.sin(time * 4) * 3;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            
            const sparkleSize = 1 + Math.sin(time * 6 + i) * 0.5;
            
            ctx.fillStyle = '#87CEEB';
            ctx.beginPath();
            ctx.arc(x, y, sparkleSize, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // 回收符号
        ctx.strokeStyle = '#1E90FF';
        ctx.lineWidth = 2;
        ctx.font = 'bold 8px Arial';
        ctx.textAlign = 'center';
        
        const symbolAlpha = 0.5 + Math.sin(time * 4) * 0.3;
        ctx.globalAlpha = symbolAlpha;
        ctx.strokeText('♻', 0, -20);
        ctx.globalAlpha = 1;
    }

    /**
     * 绘制其他垃圾特效
     */
    drawOtherEffects(ctx, time) {
        // 问号标识
        ctx.fillStyle = '#666666';
        ctx.font = 'bold 10px Arial';
        ctx.textAlign = 'center';
        
        const bounce = Math.sin(time * 4) * 2;
        ctx.fillText('?', 0, -18 + bounce);
        
        // 混乱的小点
        for (let i = 0; i < 3; i++) {
            const dotAngle = time + i * Math.PI * 2 / 3;
            const dotRadius = 12;
            const dotX = Math.cos(dotAngle) * dotRadius;
            const dotY = Math.sin(dotAngle) * dotRadius;
            
            ctx.fillStyle = '#999999';
            ctx.beginPath();
            ctx.arc(dotX, dotY, 1, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    /**
     * 获取垃圾信息
     */
    getInfo() {
        return {
            type: this.type,
            label: this.labelText,
            trackId: this.trackId,
            progress: this.progress,
            isCollected: this.isCollected,
            retryCount: this.retryCount,
            maxRetries: this.maxRetries,
            isInRetryMode: this.isInRetryMode,
            hasBeenMisclassified: this.hasBeenMisclassified
        };
    }

    /**
     * 绘制重试状态
     * @param {CanvasRenderingContext2D} ctx - 渲染上下文
     */
    drawRetryStatus(ctx) {
        if (this.isInRetryMode) {
            // 绘制重试倒计时
            const remainingTime = Math.ceil((this.retryDelay - this.retryTimer) / 1000);
            
            ctx.fillStyle = '#FF9800';
            ctx.font = 'bold 12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(`重试: ${remainingTime}s`, 0, -25);
            
            // 绘制重试进度条
            const progress = this.retryTimer / this.retryDelay;
            const barWidth = 20;
            const barHeight = 3;
            
            ctx.fillStyle = 'rgba(255, 152, 0, 0.3)';
            ctx.fillRect(-barWidth / 2, -30, barWidth, barHeight);
            
            ctx.fillStyle = '#FF9800';
            ctx.fillRect(-barWidth / 2, -30, barWidth * progress, barHeight);
        } else if (this.hasBeenMisclassified) {
            // 显示重试次数
            const retriesLeft = this.maxRetries - this.retryCount;
            
            ctx.fillStyle = '#F44336';
            ctx.font = '10px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(`剩余重试: ${retriesLeft}`, 0, -25);
        }
    }
    }
}