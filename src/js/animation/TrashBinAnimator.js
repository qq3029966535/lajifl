/**
 * 垃圾桶动画系统
 * 管理垃圾桶的各种动画和表情效果
 */
import { Vector2 } from '../core/Vector2.js';

export class TrashBinAnimation {
    constructor(type, duration, options = {}) {
        this.type = type;
        this.duration = duration;
        this.elapsed = 0;
        this.isActive = true;
        this.loop = options.loop || false;
        this.easing = options.easing || 'linear';
        this.onComplete = options.onComplete || null;
        
        // 动画属性
        this.scale = options.scale || { start: 1, end: 1 };
        this.rotation = options.rotation || { start: 0, end: 0 };
        this.offset = options.offset || { start: new Vector2(0, 0), end: new Vector2(0, 0) };
        this.expression = options.expression || 'normal';
        
        this.currentScale = this.scale.start;
        this.currentRotation = this.rotation.start;
        this.currentOffset = this.offset.start.clone();
        this.currentExpression = this.expression;
    }

    /**
     * 更新动画
     * @param {number} deltaTime - 时间间隔
     */
    update(deltaTime) {
        if (!this.isActive) return;
        
        this.elapsed += deltaTime;
        const progress = Math.min(this.elapsed / this.duration, 1);
        const easedProgress = this.applyEasing(progress);
        
        // 更新动画属性
        this.currentScale = this.lerp(this.scale.start, this.scale.end, easedProgress);
        this.currentRotation = this.lerp(this.rotation.start, this.rotation.end, easedProgress);
        this.currentOffset = Vector2.lerp(this.offset.start, this.offset.end, easedProgress);
        
        // 检查动画完成
        if (progress >= 1) {
            if (this.loop) {
                this.elapsed = 0;
            } else {
                this.isActive = false;
                if (this.onComplete) {
                    this.onComplete();
                }
            }
        }
    }

    /**
     * 应用缓动函数
     * @param {number} t - 进度 (0-1)
     */
    applyEasing(t) {
        switch (this.easing) {
            case 'easeIn':
                return t * t;
            case 'easeOut':
                return 1 - (1 - t) * (1 - t);
            case 'easeInOut':
                return t < 0.5 ? 2 * t * t : 1 - 2 * (1 - t) * (1 - t);
            case 'bounce':
                return this.bounceEasing(t);
            case 'elastic':
                return this.elasticEasing(t);
            default:
                return t; // linear
        }
    }

    /**
     * 弹跳缓动
     * @param {number} t - 进度
     */
    bounceEasing(t) {
        if (t < 1 / 2.75) {
            return 7.5625 * t * t;
        } else if (t < 2 / 2.75) {
            return 7.5625 * (t -= 1.5 / 2.75) * t + 0.75;
        } else if (t < 2.5 / 2.75) {
            return 7.5625 * (t -= 2.25 / 2.75) * t + 0.9375;
        } else {
            return 7.5625 * (t -= 2.625 / 2.75) * t + 0.984375;
        }
    }

    /**
     * 弹性缓动
     * @param {number} t - 进度
     */
    elasticEasing(t) {
        if (t === 0) return 0;
        if (t === 1) return 1;
        
        const p = 0.3;
        const s = p / 4;
        return Math.pow(2, -10 * t) * Math.sin((t - s) * (2 * Math.PI) / p) + 1;
    }

    /**
     * 线性插值
     * @param {number} start - 起始值
     * @param {number} end - 结束值
     * @param {number} t - 进度
     */
    lerp(start, end, t) {
        return start + (end - start) * t;
    }

    /**
     * 停止动画
     */
    stop() {
        this.isActive = false;
    }
}

export class TrashBinAnimator {
    constructor(trashBin) {
        this.trashBin = trashBin;
        this.animations = [];
        this.currentExpression = 'normal';
        this.expressionTimer = 0;
        this.idleTimer = 0;
        
        // 表情配置
        this.expressions = {
            normal: { eyes: '• •', mouth: '—' },
            happy: { eyes: '^ ^', mouth: '∪' },
            excited: { eyes: '★ ★', mouth: 'O' },
            sad: { eyes: '• •', mouth: '∩' },
            angry: { eyes: '> <', mouth: '︿' },
            surprised: { eyes: 'O O', mouth: 'o' },
            sleepy: { eyes: '- -', mouth: '~' },
            wink: { eyes: '^ •', mouth: '∪' }
        };
        
        // 台词配置
        this.dialogues = {
            idle: [
                "我准备好了！",
                "垃圾分类小能手！",
                "环保从我做起~",
                "来吧，我等着呢！"
            ],
            success: [
                "太棒了！",
                "分类正确！",
                "嗷呜~好吃！",
                "就是这样！",
                "环保小卫士！"
            ],
            error: [
                "这个不对哦~",
                "我不吃这个",
                "分错啦！",
                "再想想看~"
            ]
        };
        
        this.startIdleAnimation();
    }

    /**
     * 播放收集成功动画
     */
    playSuccessAnimation() {
        this.clearAnimations();
        
        // 欢呼跳跃动画
        const jumpAnimation = new TrashBinAnimation('jump', 800, {
            scale: { start: 1, end: 1.2 },
            offset: { start: new Vector2(0, 0), end: new Vector2(0, -20) },
            easing: 'bounce',
            expression: 'excited'
        });
        
        // 旋转动画
        const spinAnimation = new TrashBinAnimation('spin', 600, {
            rotation: { start: 0, end: Math.PI * 2 },
            easing: 'easeOut'
        });
        
        this.addAnimation(jumpAnimation);
        this.addAnimation(spinAnimation);
        
        // 设置表情
        this.setExpression('happy', 2000);
        
        // 显示成功台词
        this.showDialogue('success');
    }

    /**
     * 播放错误动画
     */
    playErrorAnimation() {
        this.clearAnimations();
        
        // 摇头动画
        const shakeAnimation = new TrashBinAnimation('shake', 600, {
            offset: { 
                start: new Vector2(0, 0), 
                end: new Vector2(0, 0) 
            },
            easing: 'linear'
        });
        
        // 自定义摇头逻辑
        shakeAnimation.update = (deltaTime) => {
            if (!shakeAnimation.isActive) return;
            
            shakeAnimation.elapsed += deltaTime;
            const progress = shakeAnimation.elapsed / shakeAnimation.duration;
            
            if (progress < 1) {
                const shakeIntensity = 10 * (1 - progress);
                const shakeFreq = 20;
                shakeAnimation.currentOffset.x = Math.sin(shakeAnimation.elapsed * shakeFreq) * shakeIntensity;
            } else {
                shakeAnimation.isActive = false;
                shakeAnimation.currentOffset.x = 0;
            }
        };
        
        this.addAnimation(shakeAnimation);
        
        // 设置表情
        this.setExpression('sad', 2000);
        
        // 显示错误台词
        this.showDialogue('error');
    }

    /**
     * 播放放置动画
     */
    playPlaceAnimation() {
        this.clearAnimations();
        
        // 从上方落下的动画
        const dropAnimation = new TrashBinAnimation('drop', 500, {
            scale: { start: 0.8, end: 1 },
            offset: { start: new Vector2(0, -50), end: new Vector2(0, 0) },
            easing: 'bounce',
            expression: 'surprised'
        });
        
        this.addAnimation(dropAnimation);
        
        // 眨眼表情
        setTimeout(() => {
            this.setExpression('wink', 500);
        }, 300);
    }

    /**
     * 播放待机动画
     */
    startIdleAnimation() {
        // 呼吸动画
        const breatheAnimation = new TrashBinAnimation('breathe', 2000, {
            scale: { start: 1, end: 1.05 },
            easing: 'easeInOut',
            loop: true
        });
        
        this.addAnimation(breatheAnimation);
        
        // 随机眨眼
        this.scheduleRandomBlink();
    }

    /**
     * 安排随机眨眼
     */
    scheduleRandomBlink() {
        const blinkDelay = 2000 + Math.random() * 3000; // 2-5秒随机眨眼
        
        setTimeout(() => {
            if (this.currentExpression === 'normal') {
                this.setExpression('sleepy', 200);
                setTimeout(() => {
                    this.setExpression('normal', 100);
                }, 200);
            }
            this.scheduleRandomBlink();
        }, blinkDelay);
    }

    /**
     * 设置表情
     * @param {string} expression - 表情名称
     * @param {number} duration - 持续时间
     */
    setExpression(expression, duration = 1000) {
        if (this.expressions[expression]) {
            this.currentExpression = expression;
            this.expressionTimer = duration;
        }
    }

    /**
     * 显示台词
     * @param {string} category - 台词类别
     */
    showDialogue(category) {
        const dialogues = this.dialogues[category];
        if (dialogues && dialogues.length > 0) {
            const randomDialogue = dialogues[Math.floor(Math.random() * dialogues.length)];
            
            // 创建台词显示元素
            this.createDialogueBubble(randomDialogue);
        }
    }

    /**
     * 创建台词气泡
     * @param {string} text - 台词文本
     */
    createDialogueBubble(text) {
        // 这里可以集成到UI系统中显示台词气泡
        console.log(`${this.trashBin.type}垃圾桶说: "${text}"`);
        
        // 可以通过事件系统通知UI显示台词
        if (this.trashBin.onDialogue) {
            this.trashBin.onDialogue(text, this.trashBin.position);
        }
    }

    /**
     * 添加动画
     * @param {TrashBinAnimation} animation - 动画对象
     */
    addAnimation(animation) {
        this.animations.push(animation);
    }

    /**
     * 清除所有动画
     */
    clearAnimations() {
        this.animations = [];
    }

    /**
     * 更新动画系统
     * @param {number} deltaTime - 时间间隔
     */
    update(deltaTime) {
        // 更新所有动画
        for (let i = this.animations.length - 1; i >= 0; i--) {
            const animation = this.animations[i];
            animation.update(deltaTime);
            
            if (!animation.isActive) {
                this.animations.splice(i, 1);
            }
        }
        
        // 更新表情计时器
        if (this.expressionTimer > 0) {
            this.expressionTimer -= deltaTime;
            if (this.expressionTimer <= 0) {
                this.currentExpression = 'normal';
            }
        }
        
        // 更新待机计时器
        this.idleTimer += deltaTime;
        if (this.idleTimer > 5000) { // 5秒无操作显示待机台词
            this.showDialogue('idle');
            this.idleTimer = 0;
        }
    }

    /**
     * 渲染垃圾桶动画
     * @param {CanvasRenderingContext2D} ctx - 渲染上下文
     * @param {Vector2} position - 基础位置
     * @param {number} size - 垃圾桶大小
     */
    render(ctx, position, size) {
        ctx.save();
        
        // 计算最终变换
        let finalScale = 1;
        let finalRotation = 0;
        let finalOffset = new Vector2(0, 0);
        
        for (const animation of this.animations) {
            finalScale *= animation.currentScale;
            finalRotation += animation.currentRotation;
            finalOffset.add(animation.currentOffset);
        }
        
        // 应用变换
        const renderPos = Vector2.add(position, finalOffset);
        
        ctx.translate(renderPos.x, renderPos.y);
        ctx.rotate(finalRotation);
        ctx.scale(finalScale, finalScale);
        
        // 渲染垃圾桶主体
        this.renderBinBody(ctx, size);
        
        // 渲染表情
        this.renderExpression(ctx, size);
        
        ctx.restore();
    }

    /**
     * 渲染垃圾桶主体
     * @param {CanvasRenderingContext2D} ctx - 渲染上下文
     * @param {number} size - 大小
     */
    renderBinBody(ctx, size) {
        const binColor = this.trashBin.color || '#4CAF50';
        
        // 垃圾桶主体
        ctx.fillStyle = binColor;
        ctx.fillRect(-size/2, -size/2, size, size * 0.8);
        
        // 垃圾桶盖子
        ctx.fillStyle = this.lightenColor(binColor, 0.2);
        ctx.fillRect(-size/2 - 5, -size/2 - 10, size + 10, 15);
        
        // 垃圾桶把手
        ctx.strokeStyle = this.darkenColor(binColor, 0.3);
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(-size/3, -size/2 - 5, 8, 0, Math.PI, true);
        ctx.arc(size/3, -size/2 - 5, 8, 0, Math.PI, true);
        ctx.stroke();
    }

    /**
     * 渲染表情
     * @param {CanvasRenderingContext2D} ctx - 渲染上下文
     * @param {number} size - 大小
     */
    renderExpression(ctx, size) {
        const expression = this.expressions[this.currentExpression];
        if (!expression) return;
        
        ctx.fillStyle = '#000000';
        ctx.font = `${size * 0.15}px Arial`;
        ctx.textAlign = 'center';
        
        // 眼睛
        ctx.fillText(expression.eyes, 0, -size * 0.1);
        
        // 嘴巴
        ctx.font = `${size * 0.12}px Arial`;
        ctx.fillText(expression.mouth, 0, size * 0.1);
    }

    /**
     * 变亮颜色
     * @param {string} color - 原始颜色
     * @param {number} amount - 变亮程度
     */
    lightenColor(color, amount) {
        const hex = color.replace('#', '');
        const r = Math.min(255, parseInt(hex.substr(0, 2), 16) + Math.round(255 * amount));
        const g = Math.min(255, parseInt(hex.substr(2, 2), 16) + Math.round(255 * amount));
        const b = Math.min(255, parseInt(hex.substr(4, 2), 16) + Math.round(255 * amount));
        
        return `rgb(${r}, ${g}, ${b})`;
    }

    /**
     * 变暗颜色
     * @param {string} color - 原始颜色
     * @param {number} amount - 变暗程度
     */
    darkenColor(color, amount) {
        const hex = color.replace('#', '');
        const r = Math.max(0, parseInt(hex.substr(0, 2), 16) - Math.round(255 * amount));
        const g = Math.max(0, parseInt(hex.substr(2, 2), 16) - Math.round(255 * amount));
        const b = Math.max(0, parseInt(hex.substr(4, 2), 16) - Math.round(255 * amount));
        
        return `rgb(${r}, ${g}, ${b})`;
    }

    /**
     * 重置动画状态
     */
    reset() {
        this.clearAnimations();
        this.currentExpression = 'normal';
        this.expressionTimer = 0;
        this.idleTimer = 0;
        this.startIdleAnimation();
    }

    /**
     * 销毁动画器
     */
    destroy() {
        this.clearAnimations();
    }
}