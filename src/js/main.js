/**
 * 游戏入口文件
 */
import { GameEngine } from './core/GameEngine.js';
import { gameErrorHandler } from './core/ErrorHandler.js';
import { performanceManager } from './core/PerformanceManager.js';
import { audioManager } from './audio/AudioManager.js';
import { musicManager } from './audio/MusicManager.js';
import { statisticsManager } from './data/StatisticsManager.js';
import { progressManager } from './data/ProgressManager.js';

class EcoDefenseGame {
    constructor() {
        this.engine = new GameEngine();
        this.canvas = null;
        this.isInitialized = false;
    }

    /**
     * 初始化游戏
     */
    async init() {
        try {
            console.log('保卫家园游戏启动中...');
            
            // 初始化全局系统
            this.initializeGlobalSystems();
            
            // 获取画布元素
            this.canvas = document.getElementById('game-canvas');
            if (!this.canvas) {
                throw new Error('找不到游戏画布元素');
            }

            // 初始化游戏引擎
            await this.engine.init(this.canvas);
            
            // 设置事件监听
            this.setupEventListeners();
            
            // 开始性能监控
            performanceManager.startMonitoring();
            
            // 启动游戏
            this.engine.start();
            
            this.isInitialized = true;
            
            // 显示欢迎信息
            this.showWelcomeMessage();
            
            console.log('保卫家园游戏启动成功！');
            
        } catch (error) {
            console.error('游戏初始化失败:', error);
            gameErrorHandler.handleError(error);
            this.showError('游戏初始化失败，请刷新页面重试。');
        }
    }

    /**
     * 初始化全局系统
     */
    initializeGlobalSystems() {
        // 初始化错误处理器
        gameErrorHandler.onError('*', (error) => {
            console.log('游戏错误被捕获:', error.type, error.message);
        });
        
        // 初始化性能管理器
        performanceManager.setOptimizationLevel('auto');
        
        // 初始化音频系统
        audioManager.initializeAudioContext();
        musicManager.switchToMenuMusic();
        
        // 初始化统计系统
        statisticsManager.sessionStartTime = Date.now();
        
        // 初始化进度系统
        progressManager.playerData.lastPlayedAt = Date.now();
        
        // 设置全局引用
        window.audioManager = audioManager;
        window.musicManager = musicManager;
        window.performanceManager = performanceManager;
        window.statisticsManager = statisticsManager;
        window.progressManager = progressManager;
        window.gameErrorHandler = gameErrorHandler;
        
        console.log('全局系统初始化完成');
    }

    /**
     * 显示欢迎信息
     */
    showWelcomeMessage() {
        const playerLevel = progressManager.getPlayerLevel();
        const progressPercentage = progressManager.getProgressPercentage();
        
        console.log(`欢迎回来，${playerLevel.title}！`);
        console.log(`游戏进度: ${progressPercentage.toFixed(1)}%`);
        
        // 检查新解锁内容
        const unlocked = progressManager.checkUnlocks();
        if (unlocked.length > 0) {
            console.log('新功能解锁:', unlocked.join(', '));
        }
        
        // 检查新成就
        const achievements = progressManager.checkAchievements();
        if (achievements.length > 0) {
            achievements.forEach(achievement => {
                console.log(`🏆 成就解锁: ${achievement.name}`);
            });
        }
    }

    /**
     * 设置事件监听器
     */
    setupEventListeners() {
        // 键盘事件监听
        document.addEventListener('keydown', (event) => {
            this.handleKeyDown(event);
        });

        // 鼠标事件监听
        this.canvas.addEventListener('click', (event) => {
            this.handleMouseClick(event);
        });
        
        this.canvas.addEventListener('mousemove', (event) => {
            this.handleMouseMove(event);
        });

        // 窗口大小变化监听
        window.addEventListener('resize', () => {
            this.handleResize();
        });

        // 垃圾桶选择按钮事件
        const binOptions = document.querySelectorAll('.bin-option');
        binOptions.forEach(option => {
            option.addEventListener('click', (event) => {
                this.handleBinSelection(event);
            });
        });
    }

    /**
     * 处理键盘按下事件
     */
    handleKeyDown(event) {
        const key = event.key;
        
        // 将输入传递给游戏引擎
        this.engine.handleKeyInput(key);
        
        // 数字键1-4选择垃圾桶
        if (key >= '1' && key <= '4') {
            const binType = parseInt(key);
            this.selectBin(binType);
            event.preventDefault();
        }
    }

    /**
     * 处理鼠标点击事件
     */
    handleMouseClick(event) {
        const rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        
        // 将点击事件传递给游戏引擎
        this.engine.handleMouseClick(x, y);
    }

    /**
     * 处理鼠标移动事件
     */
    handleMouseMove(event) {
        const rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        
        // 将移动事件传递给游戏引擎
        this.engine.handleMouseMove(x, y);
    }

    /**
     * 处理窗口大小变化
     */
    handleResize() {
        // 保持画布居中
        console.log('窗口大小变化');
    }

    /**
     * 处理垃圾桶选择
     */
    handleBinSelection(event) {
        const binType = parseInt(event.target.dataset.type);
        this.selectBin(binType);
    }

    /**
     * 选择垃圾桶类型
     */
    selectBin(binType) {
        // 更新UI显示
        const binOptions = document.querySelectorAll('.bin-option');
        binOptions.forEach(option => {
            option.classList.remove('selected');
        });
        
        const selectedOption = document.querySelector(`[data-type="${binType}"]`);
        if (selectedOption) {
            selectedOption.classList.add('selected');
        }
        
        console.log(`选择垃圾桶类型: ${binType}`);
        // 这里将在后续任务中实现具体的选择逻辑
    }

    /**
     * 显示错误信息
     */
    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'modal';
        errorDiv.innerHTML = `
            <div class="modal-content">
                <h2>错误</h2>
                <p>${message}</p>
                <button onclick="location.reload()">重新加载</button>
            </div>
        `;
        document.body.appendChild(errorDiv);
    }
}

// 页面加载完成后启动游戏
document.addEventListener('DOMContentLoaded', async () => {
    const game = new EcoDefenseGame();
    await game.init();
    
    // 将游戏实例暴露到全局
    window.game = game;
});

// 处理页面卸载
window.addEventListener('beforeunload', () => {
    try {
        // 保存游戏数据
        if (window.statisticsManager) {
            window.statisticsManager.saveStats();
        }
        
        if (window.progressManager) {
            window.progressManager.savePlayerData();
        }
        
        // 停止性能监控
        if (window.performanceManager) {
            window.performanceManager.stopMonitoring();
        }
        
        // 销毁游戏引擎
        if (window.game && window.game.engine) {
            window.game.engine.destroy();
        }
        
        // 销毁全局系统
        if (window.audioManager) {
            window.audioManager.destroy();
        }
        
        if (window.musicManager) {
            window.musicManager.destroy();
        }
        
        console.log('游戏资源清理完成');
        
    } catch (error) {
        console.warn('资源清理时发生错误:', error);
    }
});

// 处理页面可见性变化
document.addEventListener('visibilitychange', () => {
    if (window.game && window.game.engine && window.game.engine.currentScene) {
        if (document.hidden) {
            // 页面隐藏时暂停游戏
            if (window.game.engine.currentScene.pauseGame) {
                window.game.engine.currentScene.pauseGame();
            }
            
            // 暂停音乐
            if (window.musicManager) {
                window.musicManager.pauseMusic();
            }
        } else {
            // 页面显示时恢复游戏
            if (window.game.engine.currentScene.resumeGame) {
                window.game.engine.currentScene.resumeGame();
            }
            
            // 恢复音乐
            if (window.musicManager) {
                window.musicManager.resumeMusic();
            }
        }
    }
});

// 开发模式下的调试功能
if (typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'development') {
    // 添加调试快捷键
    document.addEventListener('keydown', (event) => {
        if (event.ctrlKey || event.metaKey) {
            switch (event.key) {
                case 'p':
                    // Ctrl+P: 显示性能报告
                    event.preventDefault();
                    if (window.performanceManager) {
                        console.log('性能报告:', window.performanceManager.getPerformanceReport());
                    }
                    break;
                    
                case 's':
                    // Ctrl+S: 显示统计数据
                    event.preventDefault();
                    if (window.statisticsManager) {
                        console.log('统计数据:', window.statisticsManager.generateReport());
                    }
                    break;
                    
                case 'e':
                    // Ctrl+E: 显示错误日志
                    event.preventDefault();
                    if (window.gameErrorHandler) {
                        console.log('错误统计:', window.gameErrorHandler.getErrorStatistics());
                    }
                    break;
            }
        }
    });
    
    console.log('开发模式已启用');
    console.log('调试快捷键: Ctrl+P(性能), Ctrl+S(统计), Ctrl+E(错误)');
}