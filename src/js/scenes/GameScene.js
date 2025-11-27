/**
 * 游戏场景
 * 主要的游戏玩法场景
 */
import { Scene } from '../core/Scene.js';
import { TrackSystem } from '../systems/TrackSystem.js';
import { TrashBinSystem } from '../systems/TrashBinSystem.js';
import { CollectionSystem } from '../systems/CollectionSystem.js';
import { TrashZombieSystem } from '../systems/TrashZombieSystem.js';
import { LevelSystem } from '../systems/LevelSystem.js';
import { TimerSystem } from '../ui/TimerSystem.js';
import { ParticleSystem } from '../effects/ParticleSystem.js';
import { TrashZombie } from '../entities/TrashZombie.js';
import { Vector2 } from '../core/Vector2.js';
import { GameConfig, TrashType } from '../config/GameConfig.js';

export class GameScene extends Scene {
    constructor() {
        super('GameScene');
        this.trackSystem = new TrackSystem();
        this.trashBinSystem = null; // 将在初始化时创建
        this.collectionSystem = null; // 将在初始化时创建
        this.trashZombieSystem = null; // 将在初始化时创建
        this.levelSystem = new LevelSystem();
        this.timerSystem = new TimerSystem();
        this.particleSystem = new ParticleSystem();
        
        this.currentLevel = 1;
        this.gameState = 'playing'; // playing, paused, gameOver, victory
        this.selectedBinType = 1;
        
        // UI状态
        this.showDialogue = false;
        this.dialogueText = '';
        this.dialogueTime = 0;
    }

    /**
     * 初始化游戏场景
     */
    init() {
        super.init();
        
        // 初始化垃圾桶系统
        this.trashBinSystem = new TrashBinSystem(this.trackSystem);
        this.setupTrashBinCallbacks();
        
        // 初始化垃圾僵尸系统
        this.trashZombieSystem = new TrashZombieSystem(this.trackSystem);
        this.setupTrashZombieCallbacks();
        
        // 初始化收集系统
        this.collectionSystem = new CollectionSystem(this.trashBinSystem);
        this.setupCollectionCallbacks();
        
        // 设置关卡系统回调
        this.setupLevelCallbacks();
        
        // 加载游戏进度
        this.levelSystem.loadProgress();
        
        this.loadLevel(this.currentLevel);
    }

    /**
     * 设置垃圾桶系统回调
     */
    setupTrashBinCallbacks() {
        this.trashBinSystem.setCallbacks({
            onBinPlaced: (bin, track) => {
                console.log(`垃圾桶放置成功: ${bin.config.name} 在轨道 ${track.id}`);
                // 可以添加音效或特效
            },
            onBinRemoved: (bin) => {
                console.log(`垃圾桶已移除: ${bin.config.name}`);
            },
            onSelectionChanged: (binType, config) => {
                this.selectedBinType = binType;
                this.showDialogue = true;
                this.dialogueText = config.dialogue;
                this.dialogueTime = 0;
            }
        });
    }

    /**
     * 设置垃圾僵尸系统回调
     */
    setupTrashZombieCallbacks() {
        this.trashZombieSystem.setCallbacks({
            onZombieSpawned: (zombie, track) => {
                // 记录到关卡系统
                this.levelSystem.recordEvent('zombieSpawned');
                
                // 将僵尸添加到收集系统
                this.collectionSystem.addTrashZombie(zombie);
                console.log(`生成垃圾僵尸: ${zombie.labelText} 在轨道 ${track.id}`);
            },
            onZombieReachedEnd: (zombie) => {
                // 记录到关卡系统
                this.levelSystem.recordEvent('zombieEscaped');
                
                console.log('垃圾逃脱！游戏失败');
            },
            onZombieDestroyed: (zombie) => {
                // 从收集系统移除
                this.collectionSystem.removeTrashZombie(zombie);
            }
        });
    }

    /**
     * 设置收集系统回调
     */
    setupCollectionCallbacks() {
        this.collectionSystem.setCallbacks({
            onCorrectCollection: (trash, bin, result) => {
                // 记录到关卡系统
                this.levelSystem.recordEvent('zombieCollected', {
                    isCorrect: true,
                    points: result.points
                });
                
                // 创建收集特效
                const trashTransform = trash.getComponent('Transform');
                const binTransform = bin.getComponent('Transform');
                if (trashTransform && binTransform) {
                    this.particleSystem.createCollectionEffect(
                        trashTransform.position,
                        binTransform.position,
                        { color: bin.config.color }
                    );
                }
                
                console.log(`正确收集！获得 ${result.points} 分`);
            },
            onIncorrectCollection: (trash, bin, result) => {
                // 记录到关卡系统
                this.levelSystem.recordEvent('zombieCollected', {
                    isCorrect: false,
                    points: 0
                });
                
                // 创建错误特效
                const binTransform = bin.getComponent('Transform');
                if (binTransform) {
                    this.particleSystem.createExplosion(
                        binTransform.position,
                        { colors: ['#FF4444', '#FF6666'], count: 6 }
                    );
                }
                
                console.log('错误收集！');
            },
            onTrashEscaped: (trash) => {
                // 记录到关卡系统
                this.levelSystem.recordEvent('zombieEscaped');
                
                console.log('垃圾逃脱！游戏失败');
            }
        });
    }

    /**
     * 设置关卡系统回调
     */
    setupLevelCallbacks() {
        this.levelSystem.setCallbacks({
            onLevelStart: (level) => {
                console.log(`关卡 ${level.id} 开始`);
                
                // 创建并启动计时器
                this.timerSystem.createTimer('levelTimer', level.timeLimit, {
                    onWarning: (remaining) => {
                        console.log(`时间警告: 剩余 ${remaining} 秒`);
                    },
                    onCritical: (remaining) => {
                        console.log(`时间危险: 剩余 ${remaining} 秒`);
                    },
                    onFinished: () => {
                        console.log('时间耗尽');
                        this.gameOver('时间耗尽');
                    }
                });
                
                this.timerSystem.setActiveTimer('levelTimer');
                this.timerSystem.startTimer('levelTimer');
            },
            onLevelComplete: (level) => {
                console.log(`关卡 ${level.id} 完成！分数: ${level.score}`);
                this.victory();
            },
            onLevelFailed: (level) => {
                console.log(`关卡 ${level.id} 失败`);
                this.gameOver('关卡失败');
            },
            onProgressUpdate: (stats) => {
                // 可以在这里更新UI显示
            }
        });
    }

    /**
     * 加载关卡
     * @param {number} levelId - 关卡ID
     */
    loadLevel(levelId) {
        // 使用关卡系统加载关卡
        const levelData = this.levelSystem.loadLevel(levelId);
        if (!levelData) {
            console.error(`无法加载关卡 ${levelId}`);
            return;
        }

        // 初始化轨道
        this.trackSystem.initializeTracks(levelData.trackCount);
        
        // 设置垃圾僵尸系统难度
        if (this.trashZombieSystem) {
            this.trashZombieSystem.setDifficulty(levelId, levelData);
            this.trashZombieSystem.setAutoSpawn(true);
        }
        
        // 重置游戏状态
        this.gameState = 'playing';
        this.currentLevel = levelId;
        
        // 开始关卡
        this.levelSystem.startCurrentLevel();
        
        console.log(`加载关卡 ${levelId}，轨道数: ${levelData.trackCount}`);
    }

    /**
     * 更新游戏场景
     * @param {number} deltaTime - 时间间隔
     */
    update(deltaTime) {
        super.update(deltaTime);
        
        if (this.gameState === 'playing') {
            // 更新关卡系统
            this.levelSystem.update(deltaTime);
            
            // 更新计时器系统
            this.timerSystem.update(deltaTime);
            
            // 更新轨道系统
            this.trackSystem.update(deltaTime);
            
            // 更新垃圾桶系统
            if (this.trashBinSystem) {
                this.trashBinSystem.update(deltaTime);
            }
            
            // 更新收集系统
            if (this.collectionSystem) {
                this.collectionSystem.update(deltaTime);
            }
            
            // 更新对话框
            if (this.showDialogue) {
                this.dialogueTime += deltaTime;
                if (this.dialogueTime > 3000) { // 3秒后隐藏
                    this.showDialogue = false;
                }
            }
            
            // 更新垃圾僵尸系统
            if (this.trashZombieSystem) {
                this.trashZombieSystem.update(deltaTime);
            }
            
            // 更新粒子系统
            this.particleSystem.update(deltaTime);
        }
    }

    /**
     * 渲染游戏场景
     * @param {RenderSystem} renderSystem - 渲染系统
     */
    render(renderSystem) {
        // 渲染轨道
        renderSystem.add2DRender((ctx) => {
            this.trackSystem.render(ctx);
        }, renderSystem.layers.TRACKS);
        
        // 渲染垃圾桶
        if (this.trashBinSystem) {
            this.trashBinSystem.render(renderSystem);
        }
        
        // 渲染垃圾僵尸
        if (this.trashZombieSystem) {
            this.trashZombieSystem.render(renderSystem);
        }
        
        // 渲染收集系统反馈
        if (this.collectionSystem) {
            this.collectionSystem.render(renderSystem);
        }
        
        // 渲染粒子效果
        renderSystem.add2DRender((ctx) => {
            this.particleSystem.render(ctx);
        }, renderSystem.layers.EFFECTS);
        
        // 渲染UI
        renderSystem.add2DRender((ctx) => {
            this.renderUI(ctx);
            // 渲染计时器
            this.timerSystem.render(ctx);
        }, renderSystem.layers.UI);
        
        super.render(renderSystem);
    }

    /**
     * 渲染游戏UI
     * @param {CanvasRenderingContext2D} ctx - 渲染上下文
     */
    renderUI(ctx) {
        ctx.save();
        
        // 渲染HUD背景
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(0, 0, ctx.canvas.width, 60);
        
        // 渲染分数
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 18px Arial';
        const levelStats = this.levelSystem.getCurrentLevelStats();
        const score = levelStats ? levelStats.score : 0;
        ctx.fillText(`分数: ${score}`, 20, 30);
        
        // 渲染关卡信息
        const levelStats = this.levelSystem.getCurrentLevelStats();
        if (levelStats) {
            const minutes = Math.floor(levelStats.remainingTime / 60);
            const seconds = Math.floor(levelStats.remainingTime % 60);
            const timeText = `时间: ${minutes}:${seconds.toString().padStart(2, '0')}`;
            ctx.fillText(timeText, 200, 30);
            
            // 渲染进度
            ctx.fillText(`进度: ${Math.round(levelStats.progress)}%`, 350, 30);
        }
        
        // 渲染关卡
        ctx.fillText(`关卡: ${this.currentLevel}`, 400, 30);
        
        // 渲染选中的垃圾桶类型
        const binConfig = GameConfig.trashBins[this.selectedBinType];
        if (binConfig) {
            ctx.fillText(`选中: ${binConfig.name}`, 600, 30);
        }
        
        // 渲染垃圾桶统计
        if (this.trashBinSystem) {
            const stats = this.trashBinSystem.getSystemStats();
            ctx.fillText(`垃圾桶: ${stats.totalBins}`, 800, 30);
        }
        
        // 渲染收集统计
        if (this.collectionSystem) {
            const collectionStats = this.collectionSystem.getCollectionStats();
            ctx.fillText(`准确率: ${Math.round(collectionStats.accuracy)}%`, 950, 30);
        }
        
        // 渲染垃圾僵尸统计
        if (this.trashZombieSystem) {
            const zombieStats = this.trashZombieSystem.getSystemStats();
            ctx.fillText(`活跃垃圾: ${zombieStats.activeZombies}`, 20, 50);
        }
        
        // 渲染对话框
        if (this.showDialogue) {
            this.renderDialogue(ctx);
        }
        
        // 渲染游戏状态
        if (this.gameState !== 'playing') {
            this.renderGameStateOverlay(ctx);
        }
        
        ctx.restore();
    }

    /**
     * 渲染游戏状态覆盖层
     * @param {CanvasRenderingContext2D} ctx - 渲染上下文
     */
    renderGameStateOverlay(ctx) {
        // 半透明背景
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        
        // 状态文字
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 36px Arial';
        ctx.textAlign = 'center';
        
        let statusText = '';
        switch (this.gameState) {
            case 'paused':
                statusText = '游戏暂停';
                break;
            case 'gameOver':
                statusText = '游戏结束';
                break;
            case 'victory':
                statusText = '关卡完成！';
                break;
        }
        
        ctx.fillText(statusText, ctx.canvas.width / 2, ctx.canvas.height / 2);
        
        // 提示文字
        ctx.font = '18px Arial';
        ctx.fillText('按 ESC 返回菜单', ctx.canvas.width / 2, ctx.canvas.height / 2 + 50);
        
        ctx.textAlign = 'left';
    }

    /**
     * 渲染对话框
     * @param {CanvasRenderingContext2D} ctx - 渲染上下文
     */
    renderDialogue(ctx) {
        if (!this.showDialogue) return;
        
        ctx.save();
        
        // 对话框背景
        const dialogueWidth = 400;
        const dialogueHeight = 80;
        const dialogueX = (ctx.canvas.width - dialogueWidth) / 2;
        const dialogueY = ctx.canvas.height - dialogueHeight - 100;
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(dialogueX, dialogueY, dialogueWidth, dialogueHeight);
        
        ctx.strokeStyle = '#4CAF50';
        ctx.lineWidth = 2;
        ctx.strokeRect(dialogueX, dialogueY, dialogueWidth, dialogueHeight);
        
        // 对话框文字
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        
        // 分行显示长文本
        const words = this.dialogueText.split('');
        const maxCharsPerLine = 30;
        const lines = [];
        let currentLine = '';
        
        for (const char of words) {
            if (currentLine.length < maxCharsPerLine) {
                currentLine += char;
            } else {
                lines.push(currentLine);
                currentLine = char;
            }
        }
        if (currentLine) lines.push(currentLine);
        
        const lineHeight = 20;
        const startY = dialogueY + (dialogueHeight - lines.length * lineHeight) / 2 + lineHeight;
        
        lines.forEach((line, index) => {
            ctx.fillText(line, dialogueX + dialogueWidth / 2, startY + index * lineHeight);
        });
        
        ctx.restore();
    }



    /**
     * 暂停所有系统
     */
    pauseAllSystems() {
        if (this.trashZombieSystem) {
            this.trashZombieSystem.pauseAllZombies();
        }
        this.timerSystem.pauseAll();
    }

    /**
     * 恢复所有系统
     */
    resumeAllSystems() {
        if (this.trashZombieSystem) {
            this.trashZombieSystem.resumeAllZombies();
        }
        this.timerSystem.resumeAll();
    }

    /**
     * 处理键盘输入
     * @param {string} key - 按键
     */
    handleKeyInput(key) {
        // 将输入传递给垃圾桶系统
        if (this.trashBinSystem) {
            this.trashBinSystem.handleKeyInput(key);
        }
        
        switch (key) {
            case '1':
            case '2':
            case '3':
            case '4':
                // 垃圾桶系统已经处理了选择逻辑
                break;
            case 'Escape':
                if (this.gameState === 'playing') {
                    this.pauseGame();
                } else {
                    // 返回菜单的逻辑将在后续实现
                    console.log('返回菜单');
                }
                break;
            case ' ':
                if (this.gameState === 'paused') {
                    this.resumeGame();
                }
                break;
            case 'F1':
                this.trackSystem.toggleDebugMode();
                break;
            case 'F2':
                // 切换垃圾桶收集范围显示
                if (this.trashBinSystem) {
                    for (const bin of this.trashBinSystem.getAllBins()) {
                        bin.toggleCollectionRangeDisplay();
                    }
                }
                break;
        }
    }

    /**
     * 处理鼠标点击
     * @param {number} x - 鼠标X坐标
     * @param {number} y - 鼠标Y坐标
     */
    handleMouseClick(x, y) {
        if (this.gameState !== 'playing' || !this.trashBinSystem) return;
        
        // 将点击事件传递给垃圾桶系统
        const result = this.trashBinSystem.handleMouseClick(x, y);
        
        if (result.action === 'place') {
            if (result.result.success) {
                // 放置成功，可以添加音效或特效
                console.log('垃圾桶放置成功');
            } else {
                // 放置失败，显示错误信息
                console.log(`放置失败: ${result.result.reason}`);
            }
        } else if (result.action === 'select') {
            // 选中了现有垃圾桶
            console.log(`选中了垃圾桶: ${result.bin.config.name}`);
        }
    }

    /**
     * 处理鼠标移动
     * @param {number} x - 鼠标X坐标
     * @param {number} y - 鼠标Y坐标
     */
    handleMouseMove(x, y) {
        if (this.gameState !== 'playing' || !this.trashBinSystem) return;
        
        // 显示放置预览
        this.trashBinSystem.handleMouseMove(x, y);
    }

    /**
     * 选择垃圾桶类型
     * @param {number} binType - 垃圾桶类型
     */
    selectBinType(binType) {
        if (this.trashBinSystem) {
            this.trashBinSystem.selectBin(binType);
        }
    }

    /**
     * 暂停游戏
     */
    pauseGame() {
        this.gameState = 'paused';
        this.pauseAllSystems();
        console.log('游戏暂停');
    }

    /**
     * 恢复游戏
     */
    resumeGame() {
        this.gameState = 'playing';
        this.resumeAllSystems();
        console.log('游戏恢复');
    }

    /**
     * 游戏结束
     * @param {string} reason - 结束原因
     */
    gameOver(reason) {
        this.gameState = 'gameOver';
        console.log(`游戏结束: ${reason}`);
    }

    /**
     * 关卡胜利
     */
    victory() {
        this.gameState = 'victory';
        console.log('关卡完成！');
    }

    /**
     * 重新开始当前关卡
     */
    restartLevel() {
        this.levelSystem.restartCurrentLevel();
        
        // 清理所有系统
        if (this.trashZombieSystem) {
            this.trashZombieSystem.clearAllZombies();
        }
        if (this.trashBinSystem) {
            this.trashBinSystem.clearAllBins();
        }
        if (this.collectionSystem) {
            this.collectionSystem.clearAllTrash();
        }
        this.particleSystem.clear();
        
        this.gameState = 'playing';
    }

    /**
     * 进入下一关
     */
    nextLevel() {
        const nextLevelId = this.levelSystem.getNextLevelId();
        if (nextLevelId) {
            this.loadLevel(nextLevelId);
        } else {
            console.log('已完成所有关卡！');
        }
    }

    /**
     * 获取游戏统计
     */
    getGameStats() {
        const levelStats = this.levelSystem.getCurrentLevelStats();
        return {
            level: this.currentLevel,
            gameState: this.gameState,
            levelStats: levelStats,
            trackStats: this.trackSystem.getTrackStats(),
            timerStats: this.timerSystem.getAllTimerStats()
        };
    }
}