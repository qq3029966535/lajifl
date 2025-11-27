/**
 * 反馈系统
 * 管理游戏中的各种UI反馈效果
 */
import { Vector2 } from '../core/Vector2.js';

export class FeedbackMessage {
    constructor(text, position, options = {}) {
        this.text = text;
        this.position = position.clone();
        this.startPosition = position.clone();
        
        this.color = options.color || '#FFFFFF';
        this.fontSize = options.fontSize || 16;
        this.duration = options.duration || 2000;
        this.fadeOut = options.fadeOut !== false;
        this.moveUp = options.moveUp !== false;
        
        this.life = this.duration;
        this.alpha = 1;
        this.scale = options.scale || 1;
        this.velocity = new Vector2(0, options.moveUp ? -30 : 0);
        
        this.isAlive = true;
    }

    /**
     * 更新反馈消息
     * @param {number} deltaTime - 时间间隔
     */
    update(deltaTime) {
        if (!this.isAlive) return;
        
        const dt = deltaTime / 1000;
        
        // 更新位置
        this.position.add(new Vector2(
            this.velocity.x * dt,
            this.velocity.y * dt
        ));
        
        // 更新生命周期
        this.life -= deltaTime;
        
        // 淡出效果
        if (this.fadeOut) {
            this.alpha = Math.max(0, this.life / this.duration);
        }
        
        // 缩放效果
        const lifeRatio = this.life / this.duration;
        if (lifeRatio > 0.8) {
            // 开始时放大
            this.scale = 1 + (1 - lifeRatio) * 5 * 0.5;
        } else {
            this.scale = 1;
        }
        
        // 检查是否死亡
        if (this.life <= 0) {
            this.isAlive = false;
        }
    }

    /**
     * 渲染反馈消息
     * @param {CanvasRenderingContext2D} ctx - 渲染上下文
     */
    render(ctx) {
        if (!this.isAlive) return;
        
        ctx.save();
        
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = this.color;
        ctx.font = `bold ${this.fontSize * this.scale}px Arial`;
        ctx.textAlign = 'center';
        
        // 添加描边效果
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.strokeText(this.text, this.position.x, this.position.y);
        ctx.fillText(this.text, this.position.x, this.position.y);
        
        ctx.restore();
    }
}

export class FeedbackSystem {
    constructor() {
        this.messages = [];
        this.animations = [];
    }

    /**
     * 显示成功反馈
     * @param {Vector2} position - 位置
     * @param {string} message - 消息
     * @param {number} points - 分数
     */
    showSuccess(position, message = '正确分类！', points = 10) {
        // 主要成功消息
        this.addMessage(message, position, {
            color: '#4CAF50',
            fontSize: 20,
            duration: 2000,
            moveUp: true
        });
        
        // 分数消息
        if (points > 0) {
            const scorePosition = new Vector2(position.x + 30, position.y - 20);
            this.addMessage(`+${points}`, scorePosition, {
                color: '#FFD700',
                fontSize: 16,
                duration: 1500,
                moveUp: true
            });
        }
        
        // 创建成功粒子效果
        this.createSuccessParticles(position);
    }

    /**
     * 显示错误反馈
     * @param {Vector2} position - 位置
     * @param {string} message - 消息
     * @param {string} correctAnswer - 正确答案
     */
    showError(position, message = '分类错误！', correctAnswer = '') {
        // 错误消息
        this.addMessage(message, position, {
            color: '#F44336',
            fontSize: 18,
            duration: 3000,
            moveUp: false
        });
        
        // 正确答案提示
        if (correctAnswer) {
            const hintPosition = new Vector2(position.x, position.y + 25);
            this.addMessage(`应投入: ${correctAnswer}`, hintPosition, {
                color: '#FF9800',
                fontSize: 14,
                duration: 3000,
                moveUp: false
            });
        }
        
        // 创建错误粒子效果
        this.createErrorParticles(position);
    }

    /**
     * 显示一般信息
     * @param {Vector2} position - 位置
     * @param {string} message - 消息
     * @param {Object} options - 选项
     */
    showInfo(position, message, options = {}) {
        this.addMessage(message, position, {
            color: '#2196F3',
            fontSize: 16,
            duration: 2000,
            ...options
        });
    }

    /**
     * 显示警告信息
     * @param {Vector2} position - 位置
     * @param {string} message - 消息
     */
    showWarning(position, message) {
        this.addMessage(message, position, {
            color: '#FF9800',
            fontSize: 16,
            duration: 2500,
            moveUp: true
        });
    }

    /**
     * 添加反馈消息
     * @param {string} text - 文本
     * @param {Vector2} position - 位置
     * @param {Object} options - 选项
     */
    addMessage(text, position, options = {}) {
        const message = new FeedbackMessage(text, position, options);
        this.messages.push(message);
    }

    /**
     * 创建成功粒子效果
     * @param {Vector2} position - 位置
     */
    createSuccessParticles(position) {
        // 这里可以集成粒子系统
        console.log('✨ 成功粒子效果', position);
    }

    /**
     * 创建错误粒子效果
     * @param {Vector2} position - 位置
     */
    createErrorParticles(position) {
        // 这里可以集成粒子系统
        console.log('💥 错误粒子效果', position);
    }

    /**
     * 显示分类演示动画
     * @param {string} trashType - 垃圾类型
     * @param {string} correctBinType - 正确的垃圾桶类型
     * @param {Vector2} position - 位置
     */
    showClassificationDemo(trashType, correctBinType, position) {
        const demoAnimation = {
            trashType,
            correctBinType,
            position: position.clone(),
            duration: 3000,
            startTime: Date.now(),
            phase: 'showing' // showing -> moving -> complete
        };
        
        this.animations.push(demoAnimation);
        
        // 显示演示文字
        this.addMessage('正确分类演示', position, {
            color: '#9C27B0',
            fontSize: 14,
            duration: 3000,
            moveUp: false
        });
    }

    /**
     * 更新反馈系统
     * @param {number} deltaTime - 时间间隔
     */
    update(deltaTime) {
        // 更新所有消息
        for (const message of this.messages) {
            message.update(deltaTime);
        }
        
        // 移除死亡的消息
        this.messages = this.messages.filter(message => message.isAlive);
        
        // 更新动画
        this.updateAnimations(deltaTime);
    }

    /**
     * 更新动画
     * @param {number} deltaTime - 时间间隔
     */
    updateAnimations(deltaTime) {
        const currentTime = Date.now();
        
        for (let i = this.animations.length - 1; i >= 0; i--) {
            const animation = this.animations[i];
            const elapsed = currentTime - animation.startTime;
            
            if (elapsed >= animation.duration) {
                this.animations.splice(i, 1);
            } else {
                // 更新动画状态
                const progress = elapsed / animation.duration;
                
                if (progress < 0.3) {
                    animation.phase = 'showing';
                } else if (progress < 0.8) {
                    animation.phase = 'moving';
                } else {
                    animation.phase = 'complete';
                }
            }
        }
    }

    /**
     * 渲染反馈系统
     * @param {CanvasRenderingContext2D} ctx - 渲染上下文
     */
    render(ctx) {
        // 渲染所有消息
        for (const message of this.messages) {
            message.render(ctx);
        }
        
        // 渲染动画
        this.renderAnimations(ctx);
    }

    /**
     * 渲染动画
     * @param {CanvasRenderingContext2D} ctx - 渲染上下文
     */
    renderAnimations(ctx) {
        for (const animation of this.animations) {
            this.renderClassificationDemo(ctx, animation);
        }
    }

    /**
     * 渲染分类演示动画
     * @param {CanvasRenderingContext2D} ctx - 渲染上下文
     * @param {Object} animation - 动画对象
     */
    renderClassificationDemo(ctx, animation) {
        const currentTime = Date.now();
        const elapsed = currentTime - animation.startTime;
        const progress = elapsed / animation.duration;
        
        ctx.save();
        
        // 演示框背景
        const boxWidth = 200;
        const boxHeight = 100;
        const boxX = animation.position.x - boxWidth / 2;
        const boxY = animation.position.y - boxHeight / 2;
        
        ctx.fillStyle = 'rgba(156, 39, 176, 0.8)';
        ctx.fillRect(boxX, boxY, boxWidth, boxHeight);
        
        ctx.strokeStyle = '#9C27B0';
        ctx.lineWidth = 2;
        ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);
        
        // 演示内容
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        
        const centerX = animation.position.x;
        const centerY = animation.position.y;
        
        switch (animation.phase) {
            case 'showing':
                ctx.fillText('正确分类方式:', centerX, centerY - 20);
                ctx.fillText(`${animation.trashType} → ${animation.correctBinType}`, centerX, centerY + 5);
                break;
                
            case 'moving':
                // 显示移动动画
                const moveProgress = (progress - 0.3) / 0.5;
                const arrowX = boxX + 20 + (boxWidth - 40) * moveProgress;
                
                ctx.fillText('演示中...', centerX, centerY - 20);
                ctx.fillText('→', arrowX, centerY + 5);
                break;
                
            case 'complete':
                ctx.fillText('记住正确分类！', centerX, centerY);
                break;
        }
        
        ctx.restore();
    }

    /**
     * 清空所有反馈
     */
    clear() {
        this.messages = [];
        this.animations = [];
    }

    /**
     * 获取活跃消息数量
     */
    getActiveMessageCount() {
        return this.messages.length;
    }

    /**
     * 销毁反馈系统
     */
    destroy() {
        this.clear();
    }
}