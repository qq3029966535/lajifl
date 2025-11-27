/**
 * HUD系统
 * 管理游戏中的用户界面显示
 */
import { Vector2 } from '../core/Vector2.js';
import { GameConfig } from '../config/GameConfig.js';

export class HUDElement {
    constructor(id, position, options = {}) {
        this.id = id;
        this.position = position.clone();
        this.visible = options.visible !== false;
        this.width = options.width || 100;
        this.height = options.height || 30;
        this.backgroundColor = options.backgroundColor || 'rgba(0, 0, 0, 0.7)';
        this.textColor = options.textColor || '#FFFFFF';
        this.font = options.font || '16px Arial';
        this.padding = options.padding || 10;
        this.borderRadius = options.borderRadius || 5;
        this.border = options.border || null;
        this.text = options.text || '';
        this.value = options.value || 0;
        this.maxValue = options.maxValue || 100;
        this.format = options.format || 'text'; // text, number, progress, time
    }

    /**
     * 设置文本
     * @param {string} text - 文本内容
     */
    setText(text) {
        this.text = text;
    }

    /**
     * 设置数值
     * @param {number} value - 数值
     */
    setValue(value) {
        this.value = value;
    }

    /**
     * 设置最大值
     * @param {number} maxValue - 最大值
     */
    setMaxValue(maxValue) {
        this.maxValue = maxValue;
    }

    /**
     * 显示元素
     */
    show() {
        this.visible = true;
    }

    /**
     * 隐藏元素
     */
    hide() {
        this.visible = false;
    }

    /**
     * 渲染HUD元素
     * @param {CanvasRenderingContext2D} ctx - 渲染上下文
     */
    render(ctx) {
        if (!this.visible) return;

        ctx.save();

        // 绘制背景
        if (this.backgroundColor) {
            ctx.fillStyle = this.backgroundColor;
            this.drawRoundedRect(ctx, this.position.x, this.position.y, this.width, this.height, this.borderRadius);
            ctx.fill();
        }

        // 绘制边框
        if (this.border) {
            ctx.strokeStyle = this.border.color || '#FFFFFF';
            ctx.lineWidth = this.border.width || 1;
            this.drawRoundedRect(ctx, this.position.x, this.position.y, this.width, this.height, this.borderRadius);
            ctx.stroke();
        }

        // 绘制内容
        this.renderContent(ctx);

        ctx.restore();
    }

    /**
     * 渲染内容
     * @param {CanvasRenderingContext2D} ctx - 渲染上下文
     */
    renderContent(ctx) {
        ctx.fillStyle = this.textColor;
        ctx.font = this.font;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';

        const centerX = this.position.x + this.width / 2;
        const centerY = this.position.y + this.height / 2;

        switch (this.format) {
            case 'text':
                ctx.textAlign = 'center';
                ctx.fillText(this.text, centerX, centerY);
                break;

            case 'number':
                ctx.textAlign = 'center';
                ctx.fillText(this.value.toString(), centerX, centerY);
                break;

            case 'progress':
                this.renderProgressBar(ctx);
                break;

            case 'time':
                ctx.textAlign = 'center';
                const timeText = this.formatTime(this.value);
                ctx.fillText(timeText, centerX, centerY);
                break;

            default:
                ctx.textAlign = 'center';
                ctx.fillText(this.text || this.value.toString(), centerX, centerY);
                break;
        }
    }

    /**
     * 渲染进度条
     * @param {CanvasRenderingContext2D} ctx - 渲染上下文
     */
    renderProgressBar(ctx) {
        const barX = this.position.x + this.padding;
        const barY = this.position.y + this.padding;
        const barWidth = this.width - this.padding * 2;
        const barHeight = this.height - this.padding * 2;

        // 背景
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.fillRect(barX, barY, barWidth, barHeight);

        // 进度
        const progress = Math.max(0, Math.min(1, this.value / this.maxValue));
        const progressWidth = barWidth * progress;

        ctx.fillStyle = this.getProgressColor(progress);
        ctx.fillRect(barX, barY, progressWidth, barHeight);

        // 文字
        ctx.fillStyle = this.textColor;
        ctx.textAlign = 'center';
        ctx.fillText(
            `${Math.round(progress * 100)}%`,
            this.position.x + this.width / 2,
            this.position.y + this.height / 2
        );
    }

    /**
     * 获取进度条颜色
     * @param {number} progress - 进度值 (0-1)
     */
    getProgressColor(progress) {
        if (progress > 0.7) return '#4CAF50'; // 绿色
        if (progress > 0.3) return '#FF9800'; // 橙色
        return '#F44336'; // 红色
    }

    /**
     * 格式化时间
     * @param {number} seconds - 秒数
     */
    formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
    }

    /**
     * 绘制圆角矩形
     */
    drawRoundedRect(ctx, x, y, width, height, radius) {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
    }
}

export class HUDSystem {
    constructor() {
        this.elements = new Map();
        this.layout = 'default';
        this.theme = {
            primaryColor: GameConfig.colors.ui,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            textColor: '#FFFFFF',
            successColor: GameConfig.colors.success,
            errorColor: GameConfig.colors.error,
            warningColor: GameConfig.colors.warning
        };
    }

    /**
     * 创建HUD元素
     * @param {string} id - 元素ID
     * @param {Vector2} position - 位置
     * @param {Object} options - 选项
     */
    createElement(id, position, options = {}) {
        const element = new HUDElement(id, position, {
            ...options,
            backgroundColor: options.backgroundColor || this.theme.backgroundColor,
            textColor: options.textColor || this.theme.textColor
        });
        this.elements.set(id, element);
        return element;
    }

    /**
     * 获取HUD元素
     * @param {string} id - 元素ID
     */
    getElement(id) {
        return this.elements.get(id);
    }

    /**
     * 移除HUD元素
     * @param {string} id - 元素ID
     */
    removeElement(id) {
        return this.elements.delete(id);
    }

    /**
     * 初始化游戏HUD
     * @param {number} canvasWidth - 画布宽度
     * @param {number} canvasHeight - 画布高度
     */
    initializeGameHUD(canvasWidth, canvasHeight) {
        // 分数显示
        this.createElement('score', new Vector2(20, 20), {
            width: 120,
            height: 35,
            format: 'text',
            text: '分数: 0',
            font: 'bold 16px Arial'
        });

        // 时间显示
        this.createElement('timer', new Vector2(160, 20), {
            width: 120,
            height: 35,
            format: 'time',
            value: 120,
            font: 'bold 16px Arial'
        });

        // 关卡显示
        this.createElement('level', new Vector2(300, 20), {
            width: 100,
            height: 35,
            format: 'text',
            text: '关卡: 1',
            font: 'bold 16px Arial'
        });

        // 进度条
        this.createElement('progress', new Vector2(420, 20), {
            width: 200,
            height: 35,
            format: 'progress',
            value: 0,
            maxValue: 100
        });

        // 准确率显示
        this.createElement('accuracy', new Vector2(640, 20), {
            width: 120,
            height: 35,
            format: 'text',
            text: '准确率: 100%',
            font: 'bold 16px Arial'
        });

        // 垃圾桶选择器
        this.createBinSelector(canvasWidth, canvasHeight);

        // 状态指示器
        this.createElement('status', new Vector2(canvasWidth - 150, 20), {
            width: 130,
            height: 35,
            format: 'text',
            text: '准备就绪',
            font: 'bold 14px Arial',
            backgroundColor: this.theme.successColor
        });
    }

    /**
     * 创建垃圾桶选择器
     * @param {number} canvasWidth - 画布宽度
     * @param {number} canvasHeight - 画布高度
     */
    createBinSelector(canvasWidth, canvasHeight) {
        const selectorY = canvasHeight - 80;
        const selectorWidth = 400;
        const selectorX = (canvasWidth - selectorWidth) / 2;

        // 垃圾桶选择背景
        this.createElement('binSelectorBg', new Vector2(selectorX - 10, selectorY - 10), {
            width: selectorWidth + 20,
            height: 60,
            format: 'text',
            text: '',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            borderRadius: 10
        });

        // 四个垃圾桶选项
        const binTypes = [
            { id: 1, name: '厨余', key: '1', color: GameConfig.trashBins[1].color },
            { id: 2, name: '可回收', key: '2', color: GameConfig.trashBins[2].color },
            { id: 3, name: '有害', key: '3', color: GameConfig.trashBins[3].color },
            { id: 4, name: '其他', key: '4', color: GameConfig.trashBins[4].color }
        ];

        binTypes.forEach((binType, index) => {
            this.createElement(`bin${binType.id}`, new Vector2(selectorX + index * 95, selectorY), {
                width: 85,
                height: 40,
                format: 'text',
                text: `${binType.key} - ${binType.name}`,
                font: 'bold 12px Arial',
                backgroundColor: binType.color,
                borderRadius: 5
            });
        });
    }

    /**
     * 更新游戏数据
     * @param {Object} gameStats - 游戏统计数据
     */
    updateGameData(gameStats) {
        if (!gameStats.levelStats) return;

        const stats = gameStats.levelStats;

        // 更新分数
        const scoreElement = this.getElement('score');
        if (scoreElement) {
            scoreElement.setText(`分数: ${stats.score}`);
        }

        // 更新时间
        const timerElement = this.getElement('timer');
        if (timerElement) {
            timerElement.setValue(stats.remainingTime);
            // 根据剩余时间改变颜色
            if (stats.remainingTime <= 10) {
                timerElement.textColor = this.theme.errorColor;
            } else if (stats.remainingTime <= 30) {
                timerElement.textColor = this.theme.warningColor;
            } else {
                timerElement.textColor = this.theme.textColor;
            }
        }

        // 更新关卡
        const levelElement = this.getElement('level');
        if (levelElement) {
            levelElement.setText(`关卡: ${stats.id}`);
        }

        // 更新进度
        const progressElement = this.getElement('progress');
        if (progressElement) {
            progressElement.setValue(stats.progress);
        }

        // 更新准确率
        const accuracyElement = this.getElement('accuracy');
        if (accuracyElement) {
            accuracyElement.setText(`准确率: ${Math.round(stats.accuracy)}%`);
        }

        // 更新状态
        const statusElement = this.getElement('status');
        if (statusElement) {
            if (stats.isComplete) {
                statusElement.setText('关卡完成！');
                statusElement.backgroundColor = this.theme.successColor;
            } else if (stats.isFailed) {
                statusElement.setText('关卡失败');
                statusElement.backgroundColor = this.theme.errorColor;
            } else if (stats.remainingTime <= 10) {
                statusElement.setText('时间紧急！');
                statusElement.backgroundColor = this.theme.errorColor;
            } else {
                statusElement.setText('进行中...');
                statusElement.backgroundColor = this.theme.primaryColor;
            }
        }
    }

    /**
     * 更新垃圾桶选择状态
     * @param {number} selectedType - 选中的垃圾桶类型
     */
    updateBinSelection(selectedType) {
        for (let i = 1; i <= 4; i++) {
            const binElement = this.getElement(`bin${i}`);
            if (binElement) {
                if (i === selectedType) {
                    binElement.border = { color: '#FFFFFF', width: 3 };
                    binElement.backgroundColor = this.lightenColor(GameConfig.trashBins[i].color, 0.2);
                } else {
                    binElement.border = null;
                    binElement.backgroundColor = GameConfig.trashBins[i].color;
                }
            }
        }
    }

    /**
     * 显示临时消息
     * @param {string} message - 消息内容
     * @param {string} type - 消息类型 (success, error, warning, info)
     * @param {number} duration - 显示时长（毫秒）
     */
    showMessage(message, type = 'info', duration = 3000) {
        const colors = {
            success: this.theme.successColor,
            error: this.theme.errorColor,
            warning: this.theme.warningColor,
            info: this.theme.primaryColor
        };

        const messageElement = this.createElement('tempMessage', new Vector2(400, 100), {
            width: 300,
            height: 50,
            format: 'text',
            text: message,
            font: 'bold 16px Arial',
            backgroundColor: colors[type] || colors.info,
            borderRadius: 10
        });

        // 自动隐藏消息
        setTimeout(() => {
            this.removeElement('tempMessage');
        }, duration);
    }

    /**
     * 设置主题
     * @param {Object} theme - 主题配置
     */
    setTheme(theme) {
        Object.assign(this.theme, theme);
    }

    /**
     * 变亮颜色
     * @param {string} color - 原始颜色
     * @param {number} amount - 变亮程度 (0-1)
     */
    lightenColor(color, amount) {
        const hex = color.replace('#', '');
        const r = Math.min(255, parseInt(hex.substr(0, 2), 16) + Math.round(255 * amount));
        const g = Math.min(255, parseInt(hex.substr(2, 2), 16) + Math.round(255 * amount));
        const b = Math.min(255, parseInt(hex.substr(4, 2), 16) + Math.round(255 * amount));
        
        return `rgb(${r}, ${g}, ${b})`;
    }

    /**
     * 渲染所有HUD元素
     * @param {CanvasRenderingContext2D} ctx - 渲染上下文
     */
    render(ctx) {
        for (const element of this.elements.values()) {
            element.render(ctx);
        }
    }

    /**
     * 清空所有元素
     */
    clear() {
        this.elements.clear();
    }

    /**
     * 销毁HUD系统
     */
    destroy() {
        this.clear();
        console.log('HUD系统已销毁');
    }
}