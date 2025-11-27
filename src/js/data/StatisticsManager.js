/**
 * 统计数据管理器
 * 管理游戏中的各种统计数据和成就
 */
import { GameConfig } from '../config/GameConfig.js';

export class GameStatistics {
    constructor() {
        this.sessionStats = this.createEmptyStats();
        this.levelStats = new Map();
        this.overallStats = this.loadOverallStats();
        this.currentLevel = 1;
        this.sessionStartTime = Date.now();
    }

    /**
     * 创建空的统计数据
     */
    createEmptyStats() {
        return {
            score: 0,
            correctClassifications: 0,
            incorrectClassifications: 0,
            totalAttempts: 0,
            accuracy: 100,
            timeSpent: 0,
            levelsCompleted: 0,
            trashCollected: {
                [GameConfig.TrashType.KITCHEN_WASTE]: 0,
                [GameConfig.TrashType.RECYCLABLE]: 0,
                [GameConfig.TrashType.HAZARDOUS]: 0,
                [GameConfig.TrashType.OTHER]: 0
            },
            binUsage: {
                [GameConfig.TrashBinType.KITCHEN_WASTE]: 0,
                [GameConfig.TrashBinType.RECYCLABLE]: 0,
                [GameConfig.TrashBinType.HAZARDOUS]: 0,
                [GameConfig.TrashBinType.OTHER]: 0
            },
            streaks: {
                current: 0,
                best: 0
            },
            achievements: []
        };
    }

    /**
     * 开始新关卡统计
     * @param {number} levelId - 关卡ID
     */
    startLevel(levelId) {
        this.currentLevel = levelId;
        
        if (!this.levelStats.has(levelId)) {
            this.levelStats.set(levelId, {
                id: levelId,
                attempts: 0,
                completions: 0,
                bestScore: 0,
                bestAccuracy: 0,
                bestTime: Infinity,
                totalScore: 0,
                totalTime: 0,
                averageAccuracy: 0,
                firstCompletedAt: null,
                lastPlayedAt: Date.now(),
                stats: this.createEmptyStats()
            });
        }
        
        const levelData = this.levelStats.get(levelId);
        levelData.attempts++;
        levelData.lastPlayedAt = Date.now();
        levelData.currentAttemptStart = Date.now();
    }

    /**
     * 记录正确分类
     * @param {string} trashType - 垃圾类型
     * @param {number} binType - 垃圾桶类型
     * @param {number} points - 获得分数
     */
    recordCorrectClassification(trashType, binType, points = 10) {
        // 更新会话统计
        this.sessionStats.correctClassifications++;
        this.sessionStats.totalAttempts++;
        this.sessionStats.score += points;
        this.sessionStats.trashCollected[trashType]++;
        this.sessionStats.binUsage[binType]++;
        this.sessionStats.streaks.current++;
        
        // 更新最佳连击
        if (this.sessionStats.streaks.current > this.sessionStats.streaks.best) {
            this.sessionStats.streaks.best = this.sessionStats.streaks.current;
        }
        
        // 更新关卡统计
        const levelData = this.levelStats.get(this.currentLevel);
        if (levelData) {
            levelData.stats.correctClassifications++;
            levelData.stats.totalAttempts++;
            levelData.stats.score += points;
            levelData.stats.trashCollected[trashType]++;
            levelData.stats.binUsage[binType]++;
        }
        
        // 更新准确率
        this.updateAccuracy();
        
        // 检查成就
        this.checkAchievements();
    }

    /**
     * 记录错误分类
     * @param {string} trashType - 垃圾类型
     * @param {number} wrongBinType - 错误的垃圾桶类型
     * @param {number} correctBinType - 正确的垃圾桶类型
     */
    recordIncorrectClassification(trashType, wrongBinType, correctBinType) {
        // 更新会话统计
        this.sessionStats.incorrectClassifications++;
        this.sessionStats.totalAttempts++;
        this.sessionStats.streaks.current = 0; // 重置连击
        
        // 更新关卡统计
        const levelData = this.levelStats.get(this.currentLevel);
        if (levelData) {
            levelData.stats.incorrectClassifications++;
            levelData.stats.totalAttempts++;
        }
        
        // 更新准确率
        this.updateAccuracy();
        
        // 记录错误类型用于分析
        this.recordClassificationError(trashType, wrongBinType, correctBinType);
    }

    /**
     * 记录分类错误
     * @param {string} trashType - 垃圾类型
     * @param {number} wrongBinType - 错误的垃圾桶类型
     * @param {number} correctBinType - 正确的垃圾桶类型
     */
    recordClassificationError(trashType, wrongBinType, correctBinType) {
        if (!this.sessionStats.errors) {
            this.sessionStats.errors = [];
        }
        
        this.sessionStats.errors.push({
            trashType,
            wrongBinType,
            correctBinType,
            timestamp: Date.now()
        });
    }

    /**
     * 完成关卡
     * @param {Object} levelResult - 关卡结果
     */
    completeLevel(levelResult) {
        const levelData = this.levelStats.get(this.currentLevel);
        if (!levelData) return;
        
        const completionTime = Date.now() - levelData.currentAttemptStart;
        
        // 更新关卡数据
        levelData.completions++;
        levelData.totalScore += levelResult.score;
        levelData.totalTime += completionTime;
        
        // 更新最佳记录
        if (levelResult.score > levelData.bestScore) {
            levelData.bestScore = levelResult.score;
        }
        
        if (levelResult.accuracy > levelData.bestAccuracy) {
            levelData.bestAccuracy = levelResult.accuracy;
        }
        
        if (completionTime < levelData.bestTime) {
            levelData.bestTime = completionTime;
        }
        
        // 首次完成记录
        if (!levelData.firstCompletedAt) {
            levelData.firstCompletedAt = Date.now();
            this.sessionStats.levelsCompleted++;
        }
        
        // 计算平均准确率
        levelData.averageAccuracy = levelData.totalScore / levelData.attempts;
        
        // 保存数据
        this.saveStats();
        
        // 检查成就
        this.checkAchievements();
    }

    /**
     * 更新准确率
     */
    updateAccuracy() {
        if (this.sessionStats.totalAttempts > 0) {
            this.sessionStats.accuracy = 
                (this.sessionStats.correctClassifications / this.sessionStats.totalAttempts) * 100;
        }
        
        // 更新关卡准确率
        const levelData = this.levelStats.get(this.currentLevel);
        if (levelData && levelData.stats.totalAttempts > 0) {
            levelData.stats.accuracy = 
                (levelData.stats.correctClassifications / levelData.stats.totalAttempts) * 100;
        }
    }

    /**
     * 获取关卡统计数据
     * @param {number} levelId - 关卡ID
     */
    getLevelStats(levelId) {
        return this.levelStats.get(levelId) || null;
    }

    /**
     * 获取会话统计数据
     */
    getSessionStats() {
        const sessionTime = Date.now() - this.sessionStartTime;
        return {
            ...this.sessionStats,
            timeSpent: sessionTime,
            averageScore: this.sessionStats.totalAttempts > 0 ? 
                this.sessionStats.score / this.sessionStats.totalAttempts : 0
        };
    }

    /**
     * 获取总体统计数据
     */
    getOverallStats() {
        return {
            ...this.overallStats,
            totalPlayTime: this.calculateTotalPlayTime(),
            totalLevelsCompleted: this.countCompletedLevels(),
            averageAccuracy: this.calculateOverallAccuracy(),
            favoriteTrashType: this.getFavoriteTrashType(),
            mostUsedBin: this.getMostUsedBin()
        };
    }

    /**
     * 计算总游戏时间
     */
    calculateTotalPlayTime() {
        let totalTime = 0;
        for (const levelData of this.levelStats.values()) {
            totalTime += levelData.totalTime;
        }
        return totalTime;
    }

    /**
     * 统计完成的关卡数
     */
    countCompletedLevels() {
        let completed = 0;
        for (const levelData of this.levelStats.values()) {
            if (levelData.completions > 0) {
                completed++;
            }
        }
        return completed;
    }

    /**
     * 计算总体准确率
     */
    calculateOverallAccuracy() {
        let totalCorrect = 0;
        let totalAttempts = 0;
        
        for (const levelData of this.levelStats.values()) {
            totalCorrect += levelData.stats.correctClassifications;
            totalAttempts += levelData.stats.totalAttempts;
        }
        
        return totalAttempts > 0 ? (totalCorrect / totalAttempts) * 100 : 0;
    }

    /**
     * 获取最喜欢的垃圾类型
     */
    getFavoriteTrashType() {
        let maxCount = 0;
        let favoriteType = null;
        
        for (const [type, count] of Object.entries(this.sessionStats.trashCollected)) {
            if (count > maxCount) {
                maxCount = count;
                favoriteType = type;
            }
        }
        
        return favoriteType;
    }

    /**
     * 获取最常用的垃圾桶
     */
    getMostUsedBin() {
        let maxUsage = 0;
        let mostUsedBin = null;
        
        for (const [binType, usage] of Object.entries(this.sessionStats.binUsage)) {
            if (usage > maxUsage) {
                maxUsage = usage;
                mostUsedBin = binType;
            }
        }
        
        return mostUsedBin;
    }

    /**
     * 检查成就
     */
    checkAchievements() {
        const achievements = [];
        
        // 准确率成就
        if (this.sessionStats.accuracy >= 95 && this.sessionStats.totalAttempts >= 10) {
            achievements.push('perfectionist'); // 完美主义者
        }
        
        // 连击成就
        if (this.sessionStats.streaks.best >= 10) {
            achievements.push('streak_master'); // 连击大师
        }
        
        // 分类数量成就
        const totalClassified = this.sessionStats.correctClassifications + this.sessionStats.incorrectClassifications;
        if (totalClassified >= 100) {
            achievements.push('classifier_expert'); // 分类专家
        }
        
        // 环保成就
        if (this.sessionStats.trashCollected[GameConfig.TrashType.RECYCLABLE] >= 20) {
            achievements.push('recycling_hero'); // 回收英雄
        }
        
        // 速度成就
        const sessionTime = Date.now() - this.sessionStartTime;
        if (this.sessionStats.levelsCompleted >= 3 && sessionTime < 300000) { // 5分钟内完成3关
            achievements.push('speed_demon'); // 速度恶魔
        }
        
        // 添加新成就
        achievements.forEach(achievement => {
            if (!this.sessionStats.achievements.includes(achievement)) {
                this.sessionStats.achievements.push(achievement);
                this.onAchievementUnlocked(achievement);
            }
        });
    }

    /**
     * 成就解锁回调
     * @param {string} achievement - 成就ID
     */
    onAchievementUnlocked(achievement) {
        const achievementData = this.getAchievementData(achievement);
        console.log(`🏆 成就解锁: ${achievementData.name}`);
        
        // 可以触发UI显示成就通知
        if (this.onAchievement) {
            this.onAchievement(achievementData);
        }
    }

    /**
     * 获取成就数据
     * @param {string} achievementId - 成就ID
     */
    getAchievementData(achievementId) {
        const achievements = {
            perfectionist: {
                id: 'perfectionist',
                name: '完美主义者',
                description: '在10次以上分类中保持95%以上准确率',
                icon: '🎯'
            },
            streak_master: {
                id: 'streak_master',
                name: '连击大师',
                description: '连续正确分类10次',
                icon: '🔥'
            },
            classifier_expert: {
                id: 'classifier_expert',
                name: '分类专家',
                description: '累计分类100个垃圾',
                icon: '🎓'
            },
            recycling_hero: {
                id: 'recycling_hero',
                name: '回收英雄',
                description: '正确分类20个可回收垃圾',
                icon: '♻️'
            },
            speed_demon: {
                id: 'speed_demon',
                name: '速度恶魔',
                description: '5分钟内完成3个关卡',
                icon: '⚡'
            }
        };
        
        return achievements[achievementId] || { id: achievementId, name: '未知成就', description: '', icon: '🏆' };
    }

    /**
     * 生成统计报告
     */
    generateReport() {
        const sessionStats = this.getSessionStats();
        const overallStats = this.getOverallStats();
        
        return {
            session: sessionStats,
            overall: overallStats,
            levels: Array.from(this.levelStats.values()),
            achievements: this.sessionStats.achievements.map(id => this.getAchievementData(id)),
            recommendations: this.generateRecommendations()
        };
    }

    /**
     * 生成改进建议
     */
    generateRecommendations() {
        const recommendations = [];
        
        // 基于准确率的建议
        if (this.sessionStats.accuracy < 80) {
            recommendations.push({
                type: 'accuracy',
                message: '建议多练习垃圾分类知识，提高分类准确率',
                priority: 'high'
            });
        }
        
        // 基于错误类型的建议
        if (this.sessionStats.errors && this.sessionStats.errors.length > 0) {
            const errorAnalysis = this.analyzeErrors();
            if (errorAnalysis.mostCommonError) {
                recommendations.push({
                    type: 'error_pattern',
                    message: `注意区分${errorAnalysis.mostCommonError.trashType}的正确分类`,
                    priority: 'medium'
                });
            }
        }
        
        // 基于使用习惯的建议
        const binUsage = Object.values(this.sessionStats.binUsage);
        const maxUsage = Math.max(...binUsage);
        const minUsage = Math.min(...binUsage);
        
        if (maxUsage > minUsage * 3) {
            recommendations.push({
                type: 'balance',
                message: '尝试平衡使用各种类型的垃圾桶',
                priority: 'low'
            });
        }
        
        return recommendations;
    }

    /**
     * 分析错误模式
     */
    analyzeErrors() {
        if (!this.sessionStats.errors || this.sessionStats.errors.length === 0) {
            return { mostCommonError: null, errorPatterns: [] };
        }
        
        const errorCounts = {};
        
        this.sessionStats.errors.forEach(error => {
            const key = `${error.trashType}->${error.wrongBinType}`;
            errorCounts[key] = (errorCounts[key] || 0) + 1;
        });
        
        const sortedErrors = Object.entries(errorCounts)
            .sort(([,a], [,b]) => b - a)
            .map(([pattern, count]) => ({ pattern, count }));
        
        return {
            mostCommonError: this.sessionStats.errors[0],
            errorPatterns: sortedErrors
        };
    }

    /**
     * 保存统计数据
     */
    saveStats() {
        try {
            const dataToSave = {
                levelStats: Array.from(this.levelStats.entries()),
                overallStats: this.overallStats,
                lastSaved: Date.now()
            };
            
            localStorage.setItem('ecoDefenseStats', JSON.stringify(dataToSave));
        } catch (error) {
            console.warn('保存统计数据失败:', error);
        }
    }

    /**
     * 加载总体统计数据
     */
    loadOverallStats() {
        try {
            const saved = localStorage.getItem('ecoDefenseStats');
            if (saved) {
                const data = JSON.parse(saved);
                
                // 恢复关卡统计
                if (data.levelStats) {
                    this.levelStats = new Map(data.levelStats);
                }
                
                return data.overallStats || this.createEmptyStats();
            }
        } catch (error) {
            console.warn('加载统计数据失败:', error);
        }
        
        return this.createEmptyStats();
    }

    /**
     * 重置统计数据
     */
    resetStats() {
        this.sessionStats = this.createEmptyStats();
        this.levelStats.clear();
        this.overallStats = this.createEmptyStats();
        this.sessionStartTime = Date.now();
        
        // 清除本地存储
        localStorage.removeItem('ecoDefenseStats');
    }

    /**
     * 导出统计数据
     */
    exportStats() {
        const report = this.generateReport();
        const exportData = {
            exportDate: new Date().toISOString(),
            gameVersion: '1.0.0',
            data: report
        };
        
        return JSON.stringify(exportData, null, 2);
    }
}

// 创建全局统计管理器实例
export const statisticsManager = new GameStatistics();