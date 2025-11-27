/**
 * 弹窗系统
 * 管理游戏中的各种弹窗和教育内容
 */
import { GameConfig } from '../config/GameConfig.js';

export class Modal {
    constructor(id, options = {}) {
        this.id = id;
        this.title = options.title || '';
        this.content = options.content || '';
        this.type = options.type || 'info'; // info, success, error, warning, education
        this.buttons = options.buttons || [{ text: '确定', action: 'close' }];
        this.closable = options.closable !== false;
        this.autoClose = options.autoClose || 0;
        this.onClose = options.onClose || null;
        this.onAction = options.onAction || null;
        
        this.element = null;
        this.isVisible = false;
        this.createDOM();
    }

    /**
     * 创建DOM元素
     */
    createDOM() {
        // 创建遮罩层
        this.element = document.createElement('div');
        this.element.className = 'modal';
        this.element.style.display = 'none';
        
        // 创建弹窗内容
        const modalContent = document.createElement('div');
        modalContent.className = `modal-content modal-${this.type}`;
        
        // 标题
        if (this.title) {
            const titleElement = document.createElement('h2');
            titleElement.textContent = this.title;
            modalContent.appendChild(titleElement);
        }
        
        // 内容
        const contentElement = document.createElement('div');
        contentElement.className = 'modal-body';
        if (typeof this.content === 'string') {
            contentElement.innerHTML = this.content;
        } else {
            contentElement.appendChild(this.content);
        }
        modalContent.appendChild(contentElement);
        
        // 按钮区域
        if (this.buttons.length > 0) {
            const buttonArea = document.createElement('div');
            buttonArea.className = 'modal-buttons';
            
            this.buttons.forEach(button => {
                const btn = document.createElement('button');
                btn.textContent = button.text;
                btn.className = `modal-btn modal-btn-${button.type || 'default'}`;
                btn.onclick = () => this.handleButtonClick(button);
                buttonArea.appendChild(btn);
            });
            
            modalContent.appendChild(buttonArea);
        }
        
        // 关闭按钮
        if (this.closable) {
            const closeBtn = document.createElement('span');
            closeBtn.className = 'modal-close';
            closeBtn.innerHTML = '&times;';
            closeBtn.onclick = () => this.close();
            modalContent.appendChild(closeBtn);
        }
        
        this.element.appendChild(modalContent);
        
        // 点击遮罩关闭
        this.element.onclick = (e) => {
            if (e.target === this.element && this.closable) {
                this.close();
            }
        };
        
        // 添加到页面
        document.body.appendChild(this.element);
    }

    /**
     * 处理按钮点击
     * @param {Object} button - 按钮配置
     */
    handleButtonClick(button) {
        if (this.onAction) {
            this.onAction(button.action, button);
        }
        
        if (button.action === 'close') {
            this.close();
        }
    }

    /**
     * 显示弹窗
     */
    show() {
        this.isVisible = true;
        this.element.style.display = 'flex';
        
        // 添加显示动画
        setTimeout(() => {
            this.element.classList.add('modal-show');
        }, 10);
        
        // 自动关闭
        if (this.autoClose > 0) {
            setTimeout(() => {
                this.close();
            }, this.autoClose);
        }
    }

    /**
     * 关闭弹窗
     */
    close() {
        this.isVisible = false;
        this.element.classList.remove('modal-show');
        
        setTimeout(() => {
            this.element.style.display = 'none';
            if (this.onClose) {
                this.onClose();
            }
        }, 300);
    }

    /**
     * 销毁弹窗
     */
    destroy() {
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
    }
}

export class ModalSystem {
    constructor() {
        this.modals = new Map();
        this.activeModal = null;
        this.initializeStyles();
    }

    /**
     * 初始化样式
     */
    initializeStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.7);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 1000;
                opacity: 0;
                transition: opacity 0.3s ease;
            }
            
            .modal-show {
                opacity: 1;
            }
            
            .modal-content {
                background: white;
                padding: 30px;
                border-radius: 15px;
                text-align: center;
                max-width: 500px;
                min-width: 300px;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
                position: relative;
                transform: scale(0.8);
                transition: transform 0.3s ease;
            }
            
            .modal-show .modal-content {
                transform: scale(1);
            }
            
            .modal-content h2 {
                color: #2E7D32;
                margin-bottom: 15px;
                font-size: 24px;
            }
            
            .modal-body {
                margin-bottom: 20px;
                line-height: 1.6;
                text-align: left;
            }
            
            .modal-buttons {
                display: flex;
                justify-content: center;
                gap: 10px;
                margin-top: 20px;
            }
            
            .modal-btn {
                background: #4CAF50;
                color: white;
                border: none;
                padding: 12px 24px;
                border-radius: 8px;
                cursor: pointer;
                font-size: 16px;
                transition: background 0.3s ease;
            }
            
            .modal-btn:hover {
                background: #45a049;
            }
            
            .modal-btn-primary {
                background: #2196F3;
            }
            
            .modal-btn-primary:hover {
                background: #1976D2;
            }
            
            .modal-btn-danger {
                background: #F44336;
            }
            
            .modal-btn-danger:hover {
                background: #D32F2F;
            }
            
            .modal-close {
                position: absolute;
                top: 10px;
                right: 15px;
                font-size: 28px;
                font-weight: bold;
                cursor: pointer;
                color: #aaa;
            }
            
            .modal-close:hover {
                color: #000;
            }
            
            .modal-error .modal-content {
                border-left: 5px solid #F44336;
            }
            
            .modal-success .modal-content {
                border-left: 5px solid #4CAF50;
            }
            
            .modal-warning .modal-content {
                border-left: 5px solid #FF9800;
            }
            
            .modal-education .modal-content {
                border-left: 5px solid #9C27B0;
                max-width: 600px;
            }
            
            .eco-fact {
                background: linear-gradient(135deg, #E8F5E8, #F0FFF0);
                padding: 15px;
                border-radius: 10px;
                margin: 10px 0;
                border-left: 4px solid #4CAF50;
            }
            
            .classification-demo {
                display: flex;
                align-items: center;
                justify-content: space-between;
                background: #F5F5F5;
                padding: 15px;
                border-radius: 10px;
                margin: 10px 0;
            }
            
            .demo-item {
                text-align: center;
                flex: 1;
            }
            
            .demo-arrow {
                font-size: 24px;
                color: #4CAF50;
                margin: 0 10px;
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * 创建弹窗
     * @param {string} id - 弹窗ID
     * @param {Object} options - 弹窗选项
     */
    createModal(id, options) {
        const modal = new Modal(id, options);
        this.modals.set(id, modal);
        return modal;
    }

    /**
     * 显示错误分类提示弹窗
     * @param {string} trashType - 垃圾类型
     * @param {string} correctBin - 正确的垃圾桶
     * @param {Function} onRetry - 重试回调
     */
    showErrorClassificationModal(trashType, correctBin, onRetry) {
        const content = `
            <div class="classification-demo">
                <div class="demo-item">
                    <div style="font-size: 18px; margin-bottom: 5px;">${trashType}</div>
                    <div style="color: #666;">垃圾类型</div>
                </div>
                <div class="demo-arrow">→</div>
                <div class="demo-item">
                    <div style="font-size: 18px; margin-bottom: 5px; color: #4CAF50;">${correctBin}</div>
                    <div style="color: #666;">正确分类</div>
                </div>
            </div>
            <p style="text-align: center; margin-top: 15px;">
                请记住正确的分类方式，保护环境从正确分类开始！
            </p>
        `;

        const modal = this.createModal('errorClassification', {
            title: '分类错误提示',
            content: content,
            type: 'error',
            buttons: [
                { text: '重新尝试', action: 'retry', type: 'primary' },
                { text: '继续游戏', action: 'continue' }
            ],
            onAction: (action) => {
                if (action === 'retry' && onRetry) {
                    onRetry();
                }
            }
        });

        modal.show();
        return modal;
    }

    /**
     * 显示环保知识弹窗
     * @param {Array} facts - 环保知识数组
     * @param {Object} stats - 游戏统计数据
     */
    showEcoEducationModal(facts, stats) {
        const randomFact = facts[Math.floor(Math.random() * facts.length)];
        
        const content = `
            <div class="eco-fact">
                <h3 style="color: #2E7D32; margin-bottom: 10px;">🌱 环保小知识</h3>
                <p>${randomFact}</p>
            </div>
            
            <div style="margin: 20px 0;">
                <h4 style="color: #2E7D32;">本关统计数据：</h4>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 10px;">
                    <div>正确分类: ${stats.correctCount || 0}个</div>
                    <div>错误分类: ${stats.errorCount || 0}个</div>
                    <div>准确率: ${Math.round(stats.accuracy || 0)}%</div>
                    <div>获得分数: ${stats.score || 0}分</div>
                </div>
            </div>
            
            <p style="text-align: center; color: #666; font-style: italic;">
                每一次正确分类都是对地球的贡献！
            </p>
        `;

        const modal = this.createModal('ecoEducation', {
            title: '关卡完成！',
            content: content,
            type: 'education',
            buttons: [
                { text: '下一关', action: 'next', type: 'primary' },
                { text: '重玩本关', action: 'replay' }
            ]
        });

        modal.show();
        return modal;
    }

    /**
     * 显示失败选择弹窗
     * @param {number} livesRemaining - 剩余生命数
     * @param {Function} onChoice - 选择回调
     */
    showFailureModal(livesRemaining, onChoice) {
        const content = `
            <p style="font-size: 18px; margin-bottom: 20px;">
                很遗憾，垃圾通过了防线！
            </p>
            
            <div style="background: #FFF3E0; padding: 15px; border-radius: 10px; margin: 15px 0;">
                <p style="color: #E65100;">
                    剩余复活机会: <strong>${livesRemaining}</strong>
                </p>
            </div>
            
            <p style="color: #666;">
                ${livesRemaining > 0 ? '你可以选择使用复活机会继续游戏，或者重新开始本关。' : '复活机会已用完，需要重新开始本关。'}
            </p>
        `;

        const buttons = livesRemaining > 0 ? [
            { text: '使用复活机会', action: 'continue', type: 'primary' },
            { text: '重新开始', action: 'restart' }
        ] : [
            { text: '重新开始', action: 'restart', type: 'primary' }
        ];

        const modal = this.createModal('failure', {
            title: '关卡失败',
            content: content,
            type: 'error',
            buttons: buttons,
            closable: false,
            onAction: (action) => {
                if (onChoice) {
                    onChoice(action);
                }
            }
        });

        modal.show();
        return modal;
    }

    /**
     * 显示通关庆祝弹窗
     * @param {Object} gameStats - 游戏统计数据
     */
    showVictoryModal(gameStats) {
        const content = `
            <div style="text-align: center; margin: 20px 0;">
                <div style="font-size: 48px; margin-bottom: 10px;">🎉</div>
                <h3 style="color: #4CAF50;">恭喜通关所有关卡！</h3>
            </div>
            
            <div class="eco-fact">
                <h4 style="color: #2E7D32;">总体表现：</h4>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 10px;">
                    <div>总分数: ${gameStats.totalScore || 0}</div>
                    <div>总准确率: ${Math.round(gameStats.overallAccuracy || 0)}%</div>
                    <div>正确分类: ${gameStats.totalCorrect || 0}个</div>
                    <div>完成时间: ${gameStats.totalTime || 0}秒</div>
                </div>
            </div>
            
            <p style="text-align: center; margin-top: 20px; color: #2E7D32; font-weight: bold;">
                你已经成为垃圾分类小能手！继续在生活中实践环保分类吧！
            </p>
        `;

        const modal = this.createModal('victory', {
            title: '游戏完成！',
            content: content,
            type: 'success',
            buttons: [
                { text: '重新开始', action: 'restart', type: 'primary' },
                { text: '自由模式', action: 'freeplay' }
            ]
        });

        modal.show();
        return modal;
    }

    /**
     * 显示暂停菜单
     * @param {Function} onAction - 动作回调
     */
    showPauseModal(onAction) {
        const content = `
            <p style="text-align: center; margin: 20px 0;">
                游戏已暂停
            </p>
        `;

        const modal = this.createModal('pause', {
            title: '暂停',
            content: content,
            type: 'info',
            buttons: [
                { text: '继续游戏', action: 'resume', type: 'primary' },
                { text: '重新开始', action: 'restart' },
                { text: '返回菜单', action: 'menu' }
            ],
            onAction: onAction
        });

        modal.show();
        return modal;
    }

    /**
     * 获取弹窗
     * @param {string} id - 弹窗ID
     */
    getModal(id) {
        return this.modals.get(id);
    }

    /**
     * 关闭弹窗
     * @param {string} id - 弹窗ID
     */
    closeModal(id) {
        const modal = this.modals.get(id);
        if (modal) {
            modal.close();
        }
    }

    /**
     * 关闭所有弹窗
     */
    closeAll() {
        for (const modal of this.modals.values()) {
            modal.close();
        }
    }

    /**
     * 销毁弹窗系统
     */
    destroy() {
        for (const modal of this.modals.values()) {
            modal.destroy();
        }
        this.modals.clear();
    }
}