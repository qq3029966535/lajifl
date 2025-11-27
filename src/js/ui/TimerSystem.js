/**
 * 计时器系统
 * 管理游戏中的倒计时和时间显示
 */
import { Vector2 } from '../core/Vector2.js';

export class Timer {
    constructor(duration, options = {}) {
        this.duration = duration * 1000; // 转换为毫秒
        this.remaining = this.duration;
        this.isRunning = false;
        this.isPaused = false;
        this.isFinished = false;
        
        // 显示选项
        this.showWarning = options.showWarning !== false;
        this.warningThreshold = options.warningThreshold || 30; // 30秒警告
        this.showCritical = options.showCritical !== false;
        this.criticalThreshold = options.criticalThreshold || 10; // 10秒危险
        
        // 事件回调
        this.onTick = options.onTick;
        this.onWarning = options.onWarning;
        this.onCritical = options.onCritical;
        this.onFinished = options.onFinished;
        
        // 状态标记
        this.hasTriggeredWarning = false;
        this.hasTriggeredCritical = false;
    }

    /**
     * 开始计时
     */
    start() {
        this.isRunning = true;
        this.isPaused = false;
        console.log(`计时器开始: ${this.duration / 1000}秒`);
    }

    /**
     * 暂停计时
     */
    pause() {
        this.isPaused = true;
        console.log('计时器暂停');
    }

    /**
     * 恢复计时
     */
    resume() {
        this.isPaused = false;
        console.log('计时器恢复');
    }

    /**
     * 停止计时
     */
    stop() {
        this.isRunning = false;
        this.isPaused = false;
        console.log('计时器停止');
    }

    /**
     * 重置计时器
     */
    reset() {
        this.remaining = this.duration;
        this.isFinished = false;
        this.hasTriggeredWarning = false;
        this.hasTriggeredCritical = false;
        console.log('计时器重置');
    }

    /**
     * 设置剩余时间
     * @param {number} seconds - 秒数
     */
    setRemaining(seconds) {
        this.remaining = Math.max(0, seconds * 1000);
        this.isFinished = this.remaining === 0;
    }

    /**
     * 增加时间
     * @param {number} seconds - 增加的秒数
     */
    addTime(seconds) {
        this.remaining += seconds * 1000;
        this.remaining = Math.min(this.remaining, this.duration);
    }

    /**
     * 更新计时器
     * @param {number} deltaTime - 时间间隔（毫秒）
     */
    update(deltaTime) {
        if (!this.isRunning || this.isPaused || this.isFinished) return;
        
        const previousRemaining = this.remaining;
        this.remaining -= deltaTime;
        
        if (this.remaining <= 0) {
            this.remaining = 0;
            this.isFinished = true;
            this.isRunning = false;
            
            if (this.onFinished) {
                this.onFinished();
            }
            return;
        }
        
        // 检查警告阈值
        const remainingSeconds = this.remaining / 1000;
        
        if (this.showWarning && !this.hasTriggeredWarning && remainingSeconds <= this.warningThreshold) {
            this.hasTriggeredWarning = true;
            if (this.onWarning) {
                this.onWarning(remainingSeconds);
            }
        }
        
        if (this.showCritical && !this.hasTriggeredCritical && remainingSeconds <= this.criticalThreshold) {
            this.hasTriggeredCritical = true;
            if (this.onCritical) {
                this.onCritical(remainingSeconds);
            }
        }
        
        // 每秒触发一次tick事件
        if (Math.floor(previousRemaining / 1000) !== Math.floor(this.remaining / 1000)) {
            if (this.onTick) {
                this.onTick(remainingSeconds);
            }
        }
    }

    /**
     * 获取剩余时间（秒）
     */
    getRemainingSeconds() {
        return Math.ceil(this.remaining / 1000);
    }

    /**
     * 获取剩余时间（毫秒）
     */
    getRemainingMilliseconds() {
        return this.remaining;
    }

    /**
     * 获取进度百分比
     */
    getProgress() {
        return ((this.duration - this.remaining) / this.duration) * 100;
    }

    /**
     * 获取格式化的时间字符串
     * @param {boolean} showMilliseconds - 是否显示毫秒
     */
    getFormattedTime(showMilliseconds = false) {
        const totalSeconds = this.remaining / 1000;
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = Math.floor(totalSeconds % 60);
        
        if (showMilliseconds) {
            const milliseconds = Math.floor((this.remaining % 1000) / 10);
            return `${minutes}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(2, '0')}`;
        } else {
            return `${minutes}:${seconds.toString().padStart(2, '0')}`;
        }
    }

    /**
     * 检查是否处于警告状态
     */
    isInWarningState() {
        return this.remaining / 1000 <= this.warningThreshold;
    }

    /**
     * 检查是否处于危险状态
     */
    isInCriticalState() {
        return this.remaining / 1000 <= this.criticalThreshold;
    }
}

export class TimerSystem {
    constructor() {
        this.timers = new Map();
        this.activeTimer = null;
        this.displayPosition = new Vector2(200, 30);
        this.displayStyle = {
            font: 'bold 18px Arial',
            normalColor: '#FFFFFF',
            warningColor: '#FF9800',
            criticalColor: '#F44336',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            padding: 10
        };
    }

    /**
     * 创建计时器
     * @param {string} name - 计时器名称
     * @param {number} duration - 持续时间（秒）
     * @param {Object} options - 选项
     */
    createTimer(name, duration, options = {}) {
        const timer = new Timer(duration, options);
        this.timers.set(name, timer);
        return timer;
    }

    /**
     * 获取计时器
     * @param {string} name - 计时器名称
     */
    getTimer(name) {
        return this.timers.get(name);
    }

    /**
     * 设置活跃计时器
     * @param {string} name - 计时器名称
     */
    setActiveTimer(name) {
        const timer = this.timers.get(name);
        if (timer) {
            this.activeTimer = timer;
            return true;
        }
        return false;
    }

    /**
     * 开始计时器
     * @param {string} name - 计时器名称
     */
    startTimer(name) {
        const timer = this.timers.get(name);
        if (timer) {
            timer.start();
            return true;
        }
        return false;
    }

    /**
     * 暂停计时器
     * @param {string} name - 计时器名称
     */
    pauseTimer(name) {
        const timer = this.timers.get(name);
        if (timer) {
            timer.pause();
            return true;
        }
        return false;
    }

    /**
     * 恢复计时器
     * @param {string} name - 计时器名称
     */
    resumeTimer(name) {
        const timer = this.timers.get(name);
        if (timer) {
            timer.resume();
            return true;
        }
        return false;
    }

    /**
     * 重置计时器
     * @param {string} name - 计时器名称
     */
    resetTimer(name) {
        const timer = this.timers.get(name);
        if (timer) {
            timer.reset();
            return true;
        }
        return false;
    }

    /**
     * 移除计时器
     * @param {string} name - 计时器名称
     */
    removeTimer(name) {
        return this.timers.delete(name);
    }

    /**
     * 暂停所有计时器
     */
    pauseAll() {
        for (const timer of this.timers.values()) {
            timer.pause();
        }
    }

    /**
     * 恢复所有计时器
     */
    resumeAll() {
        for (const timer of this.timers.values()) {
            timer.resume();
        }
    }

    /**
     * 设置显示位置
     * @param {number} x - X坐标
     * @param {number} y - Y坐标
     */
    setDisplayPosition(x, y) {
        this.displayPosition.set(x, y);
    }

    /**
     * 设置显示样式
     * @param {Object} style - 样式对象
     */
    setDisplayStyle(style) {
        Object.assign(this.displayStyle, style);
    }

    /**
     * 更新计时器系统
     * @param {number} deltaTime - 时间间隔
     */
    update(deltaTime) {
        for (const timer of this.timers.values()) {
            timer.update(deltaTime);
        }
    }

    /**
     * 渲染计时器显示
     * @param {CanvasRenderingContext2D} ctx - 渲染上下文
     */
    render(ctx) {
        if (!this.activeTimer) return;
        
        const timer = this.activeTimer;
        const timeText = timer.getFormattedTime();
        
        ctx.save();
        
        // 选择颜色
        let textColor = this.displayStyle.normalColor;
        if (timer.isInCriticalState()) {
            textColor = this.displayStyle.criticalColor;
        } else if (timer.isInWarningState()) {
            textColor = this.displayStyle.warningColor;
        }
        
        // 绘制背景
        ctx.font = this.displayStyle.font;
        const textMetrics = ctx.measureText(`时间: ${timeText}`);
        const bgWidth = textMetrics.width + this.displayStyle.padding * 2;
        const bgHeight = 24 + this.displayStyle.padding * 2;
        
        ctx.fillStyle = this.displayStyle.backgroundColor;
        ctx.fillRect(
            this.displayPosition.x - this.displayStyle.padding,
            this.displayPosition.y - 20 - this.displayStyle.padding,
            bgWidth,
            bgHeight
        );
        
        // 绘制文字
        ctx.fillStyle = textColor;
        ctx.fillText(`时间: ${timeText}`, this.displayPosition.x, this.displayPosition.y);
        
        // 绘制进度条（如果处于警告或危险状态）
        if (timer.isInWarningState()) {
            this.renderProgressBar(ctx, timer);
        }
        
        // 绘制闪烁效果（危险状态）
        if (timer.isInCriticalState()) {
            this.renderCriticalEffect(ctx, timer);
        }
        
        ctx.restore();
    }

    /**
     * 渲染进度条
     * @param {CanvasRenderingContext2D} ctx - 渲染上下文
     * @param {Timer} timer - 计时器
     */
    renderProgressBar(ctx, timer) {
        const barWidth = 100;
        const barHeight = 4;
        const barX = this.displayPosition.x;
        const barY = this.displayPosition.y + 10;
        
        // 背景
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.fillRect(barX, barY, barWidth, barHeight);
        
        // 进度
        const progress = (timer.getRemainingSeconds() / timer.duration * 1000);
        const progressWidth = barWidth * progress;
        
        ctx.fillStyle = timer.isInCriticalState() ? 
            this.displayStyle.criticalColor : 
            this.displayStyle.warningColor;
        ctx.fillRect(barX, barY, progressWidth, barHeight);
    }

    /**
     * 渲染危险状态效果
     * @param {CanvasRenderingContext2D} ctx - 渲染上下文
     * @param {Timer} timer - 计时器
     */
    renderCriticalEffect(ctx, timer) {
        const time = Date.now() / 1000;
        const flash = Math.sin(time * 8) > 0;
        
        if (flash) {
            ctx.fillStyle = 'rgba(244, 67, 54, 0.2)';
            ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        }
    }

    /**
     * 获取所有计时器状态
     */
    getAllTimerStats() {
        const stats = {};
        for (const [name, timer] of this.timers) {
            stats[name] = {
                remaining: timer.getRemainingSeconds(),
                progress: timer.getProgress(),
                isRunning: timer.isRunning,
                isPaused: timer.isPaused,
                isFinished: timer.isFinished,
                isWarning: timer.isInWarningState(),
                isCritical: timer.isInCriticalState()
            };
        }
        return stats;
    }

    /**
     * 清空所有计时器
     */
    clear() {
        this.timers.clear();
        this.activeTimer = null;
    }

    /**
     * 销毁计时器系统
     */
    destroy() {
        this.clear();
        console.log('计时器系统已销毁');
    }
}