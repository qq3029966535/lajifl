/**
 * 关卡系统
 * 管理游戏关卡的加载、进度和数据
 */
import { GameConfig } from '../config/GameConfig.js';

export class LevelData {
    constructor(config) {
        this.id = config.id;
        this.trackCount = config.trackCount;
        this.trashTypes = [...config.trashTypes];
        this.timeLimit = config.timeLimit;
        this.spawnPattern = config.spawnPattern;
        this.zombieCount = config.zombieCount;
        this.spawnInterval = config.spawnInterval;
        
        // 运行时状态
        this.isActive = false;
        this.startTime = 0;
        this.elapsedTime = 0;
        this.zombiesSpawned = 0;
        this.zombiesCollected = 0;
        this.zombiesEscaped = 0;
        this.score = 0;
        this.accuracy = 0;
        
        // 完成条件
        this.isComplete = false;
        this.isFailed = false;
    }

    /**
     * 开始关卡
     */
    start() {
        this.isActive = true;
        this.startTime = Date.now();
        this.reset();
    }

    /**
     * 重置关卡数据
     */
    reset() {
        this.elapsedTime = 0;
        this.zombiesSpawned = 0;
        this.zombiesCollected = 0;
        this.zombiesEscaped = 0;
        this.score = 0;
        this.accuracy = 0;
        this.isComplete = false;
        this.isFailed = false;
    }

    /**
     * 更新关卡状态
     * @param {number} deltaTime - 时间间隔
     */
    update(deltaTime) {
        if (!this.isActive) return;
        
        this.elapsedTime += deltaTime;
        
        // 计算准确率
        const totalProcessed = this.zombiesCollected + this.zombiesEscaped;
        this.accuracy = totalProcessed > 0 ? (this.zombiesCollected / totalProcessed) * 100 : 0;
        
        // 检查完成条件
        this.checkCompletion();
    }

    /**
     * 检查关卡完成条件
     */
    checkCompletion() {
        // 失败条件：有垃圾逃脱
        if (this.zombiesEscaped > 0) {
            this.isFailed = true;
            this.isActive = false;
            return;
        }
        
        // 失败条件：时间耗尽
        if (this.elapsedTime >= this.timeLimit * 1000) {
            this.isFailed = true;
            this.isActive = false;
            return;
        }
        
        // 完成条件：所有垃圾都被正确收集
        if (this.zombiesSpawned >= this.zombieCount && this.zombiesCollected >= this.zombieCount) {
            this.isComplete = true;
            this.isActive = false;
            return;
        }
    }

    /**
     * 记录垃圾生成
     */
    recordZombieSpawned() {
        this.zombiesSpawned++;
    }

    /**
     * 记录垃圾收集
     * @param {boolean} isCorrect - 是否正确收集
     * @param {number} points - 获得分数
     */
    recordZombieCollected(isCorrect, points = 0) {
        if (isCorrect) {
            this.zombiesCollected++;
            this.score += points;
        }
    }

    /**
     * 记录垃圾逃脱
     */
    recordZombieEscaped() {
        this.zombiesEscaped++;
    }

    /**
     * 获取剩余时间
     */
    getRemainingTime() {
        return Math.max(0, this.timeLimit - this.elapsedTime / 1000);
    }

    /**
     * 获取进度百分比
     */
    getProgress() {
        if (this.zombieCount === 0) return 0;
        return Math.min(100, (this.zombiesCollected / this.zombieCount) * 100);
    }

    /**
     * 获取关卡统计
     */
    getStats() {
        return {
            id: this.id,
            trackCount: this.trackCount,
            timeLimit: this.timeLimit,
            elapsedTime: this.elapsedTime / 1000,
            remainingTime: this.getRemainingTime(),
            zombieCount: this.zombieCount,
            zombiesSpawned: this.zombiesSpawned,
            zombiesCollected: this.zombiesCollected,
            zombiesEscaped: this.zombiesEscaped,
            score: this.score,
            accuracy: this.accuracy,
            progress: this.getProgress(),
            isComplete: this.isComplete,
            isFailed: this.isFailed,
            isActive: this.isActive
        };
    }
}

export class LevelSystem {
    constructor() {
        this.levels = new Map();
        this.currentLevel = null;
        this.unlockedLevels = [1]; // 默认解锁第一关
        
        // 初始化所有关卡
        this.initializeLevels();
        
        // 事件回调
        this.onLevelStart = null;
        this.onLevelComplete = null;
        this.onLevelFailed = null;
        this.onProgressUpdate = null;
    }

    /**
     * 初始化所有关卡
     */
    initializeLevels() {
        for (const levelConfig of GameConfig.levels) {
            const levelData = new LevelData(levelConfig);
            this.levels.set(levelConfig.id, levelData);
        }
        
        console.log(`初始化了 ${this.levels.size} 个关卡`);
    }

    /**
     * 加载关卡
     * @param {number} levelId - 关卡ID
     */
    loadLevel(levelId) {
        const level = this.levels.get(levelId);
        if (!level) {
            console.error(`关卡 ${levelId} 不存在`);
            return null;
        }
        
        if (!this.isLevelUnlocked(levelId)) {
            console.error(`关卡 ${levelId} 未解锁`);
            return null;
        }
        
        // 停止当前关卡
        if (this.currentLevel) {
            this.currentLevel.isActive = false;
        }
        
        this.currentLevel = level;
        return level;
    }

    /**
     * 开始当前关卡
     */
    startCurrentLevel() {
        if (!this.currentLevel) {
            console.error('没有加载的关卡');
            return false;
        }
        
        this.currentLevel.start();
        
        if (this.onLevelStart) {
            this.onLevelStart(this.currentLevel);
        }
        
        console.log(`开始关卡 ${this.currentLevel.id}`);
        return true;
    }

    /**
     * 重新开始当前关卡
     */
    restartCurrentLevel() {
        if (!this.currentLevel) return false;
        
        this.currentLevel.reset();
        this.currentLevel.start();
        
        if (this.onLevelStart) {
            this.onLevelStart(this.currentLevel);
        }
        
        console.log(`重新开始关卡 ${this.currentLevel.id}`);
        return true;
    }

    /**
     * 检查关卡是否解锁
     * @param {number} levelId - 关卡ID
     */
    isLevelUnlocked(levelId) {
        return this.unlockedLevels.includes(levelId);
    }

    /**
     * 解锁关卡
     * @param {number} levelId - 关卡ID
     */
    unlockLevel(levelId) {
        if (!this.unlockedLevels.includes(levelId)) {
            this.unlockedLevels.push(levelId);
            this.unlockedLevels.sort((a, b) => a - b);
            console.log(`解锁关卡 ${levelId}`);
        }
    }

    /**
     * 获取下一个关卡ID
     */
    getNextLevelId() {
        if (!this.currentLevel) return null;
        
        const nextId = this.currentLevel.id + 1;
        return this.levels.has(nextId) ? nextId : null;
    }

    /**
     * 完成当前关卡
     */
    completeCurrentLevel() {
        if (!this.currentLevel) return;
        
        this.currentLevel.isComplete = true;
        this.currentLevel.isActive = false;
        
        // 解锁下一关
        const nextLevelId = this.getNextLevelId();
        if (nextLevelId) {
            this.unlockLevel(nextLevelId);
        }
        
        if (this.onLevelComplete) {
            this.onLevelComplete(this.currentLevel);
        }
        
        console.log(`完成关卡 ${this.currentLevel.id}`);
    }

    /**
     * 关卡失败
     */
    failCurrentLevel() {
        if (!this.currentLevel) return;
        
        this.currentLevel.isFailed = true;
        this.currentLevel.isActive = false;
        
        if (this.onLevelFailed) {
            this.onLevelFailed(this.currentLevel);
        }
        
        console.log(`关卡 ${this.currentLevel.id} 失败`);
    }

    /**
     * 更新关卡系统
     * @param {number} deltaTime - 时间间隔
     */
    update(deltaTime) {
        if (!this.currentLevel || !this.currentLevel.isActive) return;
        
        const previousStats = this.currentLevel.getStats();
        this.currentLevel.update(deltaTime);
        const currentStats = this.currentLevel.getStats();
        
        // 检查状态变化
        if (this.currentLevel.isComplete && !previousStats.isComplete) {
            this.completeCurrentLevel();
        } else if (this.currentLevel.isFailed && !previousStats.isFailed) {
            this.failCurrentLevel();
        }
        
        // 触发进度更新事件
        if (this.onProgressUpdate) {
            this.onProgressUpdate(currentStats);
        }
    }

    /**
     * 记录游戏事件
     * @param {string} eventType - 事件类型
     * @param {Object} data - 事件数据
     */
    recordEvent(eventType, data = {}) {
        if (!this.currentLevel) return;
        
        switch (eventType) {
            case 'zombieSpawned':
                this.currentLevel.recordZombieSpawned();
                break;
            case 'zombieCollected':
                this.currentLevel.recordZombieCollected(data.isCorrect, data.points);
                break;
            case 'zombieEscaped':
                this.currentLevel.recordZombieEscaped();
                break;
        }
    }

    /**
     * 获取当前关卡统计
     */
    getCurrentLevelStats() {
        return this.currentLevel ? this.currentLevel.getStats() : null;
    }

    /**
     * 获取所有关卡信息
     */
    getAllLevelsInfo() {
        const levelsInfo = [];
        
        for (const [id, level] of this.levels) {
            levelsInfo.push({
                id: id,
                unlocked: this.isLevelUnlocked(id),
                completed: level.isComplete,
                bestScore: level.score,
                bestAccuracy: level.accuracy
            });
        }
        
        return levelsInfo.sort((a, b) => a.id - b.id);
    }

    /**
     * 保存进度到本地存储
     */
    saveProgress() {
        const progressData = {
            unlockedLevels: this.unlockedLevels,
            levelStats: {}
        };
        
        for (const [id, level] of this.levels) {
            if (level.isComplete) {
                progressData.levelStats[id] = {
                    completed: true,
                    bestScore: level.score,
                    bestAccuracy: level.accuracy
                };
            }
        }
        
        localStorage.setItem('ecoDefenseProgress', JSON.stringify(progressData));
        console.log('游戏进度已保存');
    }

    /**
     * 从本地存储加载进度
     */
    loadProgress() {
        try {
            const savedData = localStorage.getItem('ecoDefenseProgress');
            if (savedData) {
                const progressData = JSON.parse(savedData);
                this.unlockedLevels = progressData.unlockedLevels || [1];
                
                // 恢复关卡统计
                for (const [levelId, stats] of Object.entries(progressData.levelStats || {})) {
                    const level = this.levels.get(parseInt(levelId));
                    if (level && stats.completed) {
                        level.isComplete = true;
                        level.score = stats.bestScore || 0;
                        level.accuracy = stats.bestAccuracy || 0;
                    }
                }
                
                console.log('游戏进度已加载');
            }
        } catch (error) {
            console.error('加载游戏进度失败:', error);
        }
    }

    /**
     * 设置事件回调
     * @param {Object} callbacks - 回调函数对象
     */
    setCallbacks(callbacks) {
        this.onLevelStart = callbacks.onLevelStart;
        this.onLevelComplete = callbacks.onLevelComplete;
        this.onLevelFailed = callbacks.onLevelFailed;
        this.onProgressUpdate = callbacks.onProgressUpdate;
    }

    /**
     * 销毁关卡系统
     */
    destroy() {
        this.saveProgress();
        this.levels.clear();
        this.currentLevel = null;
        console.log('关卡系统已销毁');
    }
}