/**
 * 进度管理器
 * 管理玩家进度、解锁内容和成就系统
 */
import { GameConfig } from '../config/GameConfig.js';

export class PlayerProgress {
    constructor() {
        this.playerData = this.loadPlayerData();
        this.achievements = new Map();
        this.unlockedContent = new Set();
        this.initializeAchievements();
        this.initializeUnlocks();
    }

    /**
     * 初始化默认玩家数据
     */
    createDefaultPlayerData() {
        return {
            playerId: this.generatePlayerId(),
            playerName: '环保小卫士',
            createdAt: Date.now(),
            lastPlayedAt: Date.now(),
            
            // 关卡进度
            levelProgress: {
                currentLevel: 1,
                maxUnlockedLevel: 1,
                completedLevels: [],
                levelStars: {}, // 关卡星级评价
                totalStars: 0
            },
            
            // 游戏统计
            gameStats: {
                totalPlayTime: 0,
                totalGamesPlayed: 0,
                totalScore: 0,
                highestScore: 0,
                totalCorrectClassifications: 0,
                totalIncorrectClassifications: 0,
                overallAccuracy: 0,
                longestStreak: 0,
                favoriteTrashType: null,
                mostUsedBin: null
            },
            
            // 成就系统
            achievements: {
                unlocked: [],
                progress: {},
                totalPoints: 0
            },
            
            // 解锁内容
            unlocks: {
                freePlayMode: false,
                levelSelect: false,
                customization: false,
                statistics: false
            },
            
            // 设置
            settings: {
                soundEnabled: true,
                musicEnabled: true,
                soundVolume: 0.8,
                musicVolume: 0.6,
                difficulty: 'normal',
                language: 'zh-CN'
            },
            
            // 历史记录
            history: {
                bestTimes: {},
                accuracyHistory: [],
                scoreHistory: [],
                playDates: []
            }
        };
    }

    /**
     * 生成玩家ID
     */
    generatePlayerId() {
        return 'player_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * 初始化成就系统
     */
    initializeAchievements() {
        const achievementDefinitions = [
            // 基础成就
            {
                id: 'first_steps',
                name: '初来乍到',
                description: '完成第一个关卡',
                icon: '🌱',
                points: 10,
                type: 'progression',
                condition: { type: 'level_complete', value: 1 }
            },
            {
                id: 'getting_started',
                name: '渐入佳境',
                description: '完成前3个关卡',
                icon: '🌿',
                points: 25,
                type: 'progression',
                condition: { type: 'levels_completed', value: 3 }
            },
            {
                id: 'eco_warrior',
                name: '环保战士',
                description: '完成所有关卡',
                icon: '🌳',
                points: 100,
                type: 'progression',
                condition: { type: 'all_levels_complete', value: 5 }
            },
            
            // 技能成就
            {
                id: 'perfectionist',
                name: '完美主义者',
                description: '单关卡达到100%准确率',
                icon: '🎯',
                points: 30,
                type: 'skill',
                condition: { type: 'perfect_accuracy', value: 100 }
            },
            {
                id: 'streak_master',
                name: '连击大师',
                description: '连续正确分类15次',
                icon: '🔥',
                points: 40,
                type: 'skill',
                condition: { type: 'streak', value: 15 }
            },
            {
                id: 'speed_demon',
                name: '速度恶魔',
                description: '在60秒内完成一个关卡',
                icon: '⚡',
                points: 50,
                type: 'skill',
                condition: { type: 'time_limit', value: 60 }
            },
            
            // 分类成就
            {
                id: 'kitchen_expert',
                name: '厨余专家',
                description: '正确分类50个厨余垃圾',
                icon: '🥬',
                points: 20,
                type: 'classification',
                condition: { type: 'trash_type_count', trashType: 'kitchen_waste', value: 50 }
            },
            {
                id: 'recycling_hero',
                name: '回收英雄',
                description: '正确分类50个可回收垃圾',
                icon: '♻️',
                points: 20,
                type: 'classification',
                condition: { type: 'trash_type_count', trashType: 'recyclable', value: 50 }
            },
            {
                id: 'hazard_handler',
                name: '危险品处理员',
                description: '正确分类30个有害垃圾',
                icon: '☢️',
                points: 30,
                type: 'classification',
                condition: { type: 'trash_type_count', trashType: 'hazardous', value: 30 }
            },
            {
                id: 'classification_master',
                name: '分类大师',
                description: '累计正确分类500个垃圾',
                icon: '🏆',
                points: 100,
                type: 'classification',
                condition: { type: 'total_classifications', value: 500 }
            },
            
            // 时间成就
            {
                id: 'dedicated_player',
                name: '专注玩家',
                description: '累计游戏时间达到1小时',
                icon: '⏰',
                points: 25,
                type: 'time',
                condition: { type: 'play_time', value: 3600000 } // 1小时毫秒数
            },
            {
                id: 'daily_player',
                name: '每日玩家',
                description: '连续7天游戏',
                icon: '📅',
                points: 50,
                type: 'time',
                condition: { type: 'daily_streak', value: 7 }
            },
            
            // 特殊成就
            {
                id: 'eco_educator',
                name: '环保教育家',
                description: '查看所有环保知识',
                icon: '📚',
                points: 30,
                type: 'special',
                condition: { type: 'eco_facts_viewed', value: GameConfig.ecoFacts.length }
            },
            {
                id: 'no_mistakes',
                name: '零失误',
                description: '完成一个关卡且无任何错误分类',
                icon: '💎',
                points: 75,
                type: 'special',
                condition: { type: 'flawless_level', value: 1 }
            }
        ];

        achievementDefinitions.forEach(achievement => {
            this.achievements.set(achievement.id, achievement);
        });
    }

    /**
     * 初始化解锁系统
     */
    initializeUnlocks() {
        this.unlockConditions = {
            freePlayMode: { type: 'levels_completed', value: 3 },
            levelSelect: { type: 'levels_completed', value: 2 },
            customization: { type: 'achievements_count', value: 5 },
            statistics: { type: 'levels_completed', value: 1 }
        };
    }

    /**
     * 更新关卡进度
     * @param {number} levelId - 关卡ID
     * @param {Object} result - 关卡结果
     */
    updateLevelProgress(levelId, result) {
        const progress = this.playerData.levelProgress;
        
        // 标记关卡完成
        if (!progress.completedLevels.includes(levelId)) {
            progress.completedLevels.push(levelId);
        }
        
        // 解锁下一关卡
        const nextLevel = levelId + 1;
        if (nextLevel <= GameConfig.levels.length && nextLevel > progress.maxUnlockedLevel) {
            progress.maxUnlockedLevel = nextLevel;
        }
        
        // 计算星级评价
        const stars = this.calculateLevelStars(result);
        progress.levelStars[levelId] = Math.max(progress.levelStars[levelId] || 0, stars);
        
        // 更新总星数
        progress.totalStars = Object.values(progress.levelStars).reduce((sum, stars) => sum + stars, 0);
        
        // 更新统计数据
        this.updateGameStats(result);
        
        // 检查成就和解锁
        this.checkAchievements();
        this.checkUnlocks();
        
        // 保存进度
        this.savePlayerData();
    }

    /**
     * 计算关卡星级
     * @param {Object} result - 关卡结果
     */
    calculateLevelStars(result) {
        let stars = 1; // 基础完成星级
        
        // 准确率星级
        if (result.accuracy >= 90) stars++;
        if (result.accuracy >= 95) stars++;
        
        // 时间奖励星级
        if (result.timeRemaining > 30) stars++;
        
        // 无错误奖励星级
        if (result.errors === 0) stars++;
        
        return Math.min(stars, 5); // 最多5星
    }

    /**
     * 更新游戏统计
     * @param {Object} result - 游戏结果
     */
    updateGameStats(result) {
        const stats = this.playerData.gameStats;
        
        stats.totalGamesPlayed++;
        stats.totalScore += result.score;
        stats.totalCorrectClassifications += result.correctCount;
        stats.totalIncorrectClassifications += result.errorCount;
        
        // 更新最高分
        if (result.score > stats.highestScore) {
            stats.highestScore = result.score;
        }
        
        // 更新最长连击
        if (result.longestStreak > stats.longestStreak) {
            stats.longestStreak = result.longestStreak;
        }
        
        // 更新总体准确率
        const totalAttempts = stats.totalCorrectClassifications + stats.totalIncorrectClassifications;
        if (totalAttempts > 0) {
            stats.overallAccuracy = (stats.totalCorrectClassifications / totalAttempts) * 100;
        }
        
        // 记录历史数据
        this.recordHistoryData(result);
    }

    /**
     * 记录历史数据
     * @param {Object} result - 游戏结果
     */
    recordHistoryData(result) {
        const history = this.playerData.history;
        const today = new Date().toDateString();
        
        // 记录游戏日期
        if (!history.playDates.includes(today)) {
            history.playDates.push(today);
        }
        
        // 记录准确率历史
        history.accuracyHistory.push({
            date: Date.now(),
            accuracy: result.accuracy
        });
        
        // 记录分数历史
        history.scoreHistory.push({
            date: Date.now(),
            score: result.score
        });
        
        // 限制历史记录长度
        if (history.accuracyHistory.length > 100) {
            history.accuracyHistory = history.accuracyHistory.slice(-100);
        }
        
        if (history.scoreHistory.length > 100) {
            history.scoreHistory = history.scoreHistory.slice(-100);
        }
    }

    /**
     * 检查成就
     */
    checkAchievements() {
        const unlockedAchievements = [];
        
        for (const [id, achievement] of this.achievements) {
            if (this.playerData.achievements.unlocked.includes(id)) {
                continue; // 已解锁
            }
            
            if (this.checkAchievementCondition(achievement.condition)) {
                this.unlockAchievement(id);
                unlockedAchievements.push(achievement);
            }
        }
        
        return unlockedAchievements;
    }

    /**
     * 检查成就条件
     * @param {Object} condition - 成就条件
     */
    checkAchievementCondition(condition) {
        const stats = this.playerData.gameStats;
        const progress = this.playerData.levelProgress;
        
        switch (condition.type) {
            case 'level_complete':
                return progress.completedLevels.includes(condition.value);
                
            case 'levels_completed':
                return progress.completedLevels.length >= condition.value;
                
            case 'all_levels_complete':
                return progress.completedLevels.length >= GameConfig.levels.length;
                
            case 'perfect_accuracy':
                return stats.overallAccuracy >= condition.value;
                
            case 'streak':
                return stats.longestStreak >= condition.value;
                
            case 'total_classifications':
                return stats.totalCorrectClassifications >= condition.value;
                
            case 'play_time':
                return stats.totalPlayTime >= condition.value;
                
            case 'achievements_count':
                return this.playerData.achievements.unlocked.length >= condition.value;
                
            default:
                return false;
        }
    }

    /**
     * 解锁成就
     * @param {string} achievementId - 成就ID
     */
    unlockAchievement(achievementId) {
        const achievement = this.achievements.get(achievementId);
        if (!achievement) return;
        
        this.playerData.achievements.unlocked.push(achievementId);
        this.playerData.achievements.totalPoints += achievement.points;
        
        console.log(`🏆 成就解锁: ${achievement.name} (+${achievement.points}分)`);
        
        // 触发成就解锁事件
        if (this.onAchievementUnlocked) {
            this.onAchievementUnlocked(achievement);
        }
    }

    /**
     * 检查解锁内容
     */
    checkUnlocks() {
        const unlocked = [];
        
        for (const [feature, condition] of Object.entries(this.unlockConditions)) {
            if (this.playerData.unlocks[feature]) {
                continue; // 已解锁
            }
            
            if (this.checkUnlockCondition(condition)) {
                this.playerData.unlocks[feature] = true;
                unlocked.push(feature);
                console.log(`🔓 功能解锁: ${feature}`);
            }
        }
        
        return unlocked;
    }

    /**
     * 检查解锁条件
     * @param {Object} condition - 解锁条件
     */
    checkUnlockCondition(condition) {
        const stats = this.playerData.gameStats;
        const progress = this.playerData.levelProgress;
        
        switch (condition.type) {
            case 'levels_completed':
                return progress.completedLevels.length >= condition.value;
                
            case 'achievements_count':
                return this.playerData.achievements.unlocked.length >= condition.value;
                
            default:
                return false;
        }
    }

    /**
     * 获取玩家等级
     */
    getPlayerLevel() {
        const points = this.playerData.achievements.totalPoints;
        
        if (points >= 500) return { level: 10, title: '环保大师' };
        if (points >= 400) return { level: 9, title: '分类专家' };
        if (points >= 300) return { level: 8, title: '环保达人' };
        if (points >= 250) return { level: 7, title: '绿色卫士' };
        if (points >= 200) return { level: 6, title: '环保使者' };
        if (points >= 150) return { level: 5, title: '分类能手' };
        if (points >= 100) return { level: 4, title: '环保新星' };
        if (points >= 60) return { level: 3, title: '分类学徒' };
        if (points >= 30) return { level: 2, title: '环保新手' };
        return { level: 1, title: '初学者' };
    }

    /**
     * 获取进度百分比
     */
    getProgressPercentage() {
        const totalLevels = GameConfig.levels.length;
        const completedLevels = this.playerData.levelProgress.completedLevels.length;
        return (completedLevels / totalLevels) * 100;
    }

    /**
     * 获取成就进度
     */
    getAchievementProgress() {
        const totalAchievements = this.achievements.size;
        const unlockedAchievements = this.playerData.achievements.unlocked.length;
        return {
            unlocked: unlockedAchievements,
            total: totalAchievements,
            percentage: (unlockedAchievements / totalAchievements) * 100
        };
    }

    /**
     * 获取推荐下一步行动
     */
    getRecommendations() {
        const recommendations = [];
        const progress = this.playerData.levelProgress;
        const stats = this.playerData.gameStats;
        
        // 关卡推荐
        if (progress.currentLevel <= progress.maxUnlockedLevel) {
            recommendations.push({
                type: 'level',
                title: '继续挑战',
                description: `尝试关卡 ${progress.currentLevel}`,
                action: 'play_level',
                priority: 'high'
            });
        }
        
        // 成就推荐
        const nearAchievements = this.getNearAchievements();
        if (nearAchievements.length > 0) {
            recommendations.push({
                type: 'achievement',
                title: '即将解锁',
                description: `${nearAchievements[0].name} - ${nearAchievements[0].description}`,
                action: 'view_achievements',
                priority: 'medium'
            });
        }
        
        // 技能提升推荐
        if (stats.overallAccuracy < 85) {
            recommendations.push({
                type: 'skill',
                title: '提升准确率',
                description: '多练习垃圾分类知识',
                action: 'practice_mode',
                priority: 'medium'
            });
        }
        
        return recommendations;
    }

    /**
     * 获取接近解锁的成就
     */
    getNearAchievements() {
        const near = [];
        
        for (const [id, achievement] of this.achievements) {
            if (this.playerData.achievements.unlocked.includes(id)) {
                continue;
            }
            
            const progress = this.getAchievementProgressValue(achievement.condition);
            if (progress >= 0.7) { // 70%以上进度
                near.push({
                    ...achievement,
                    progress: progress
                });
            }
        }
        
        return near.sort((a, b) => b.progress - a.progress);
    }

    /**
     * 获取成就进度值
     * @param {Object} condition - 成就条件
     */
    getAchievementProgressValue(condition) {
        const stats = this.playerData.gameStats;
        const progress = this.playerData.levelProgress;
        
        switch (condition.type) {
            case 'levels_completed':
                return Math.min(progress.completedLevels.length / condition.value, 1);
                
            case 'total_classifications':
                return Math.min(stats.totalCorrectClassifications / condition.value, 1);
                
            case 'streak':
                return Math.min(stats.longestStreak / condition.value, 1);
                
            default:
                return 0;
        }
    }

    /**
     * 保存玩家数据
     */
    savePlayerData() {
        try {
            this.playerData.lastPlayedAt = Date.now();
            localStorage.setItem('ecoDefenseProgress', JSON.stringify(this.playerData));
        } catch (error) {
            console.warn('保存玩家数据失败:', error);
        }
    }

    /**
     * 加载玩家数据
     */
    loadPlayerData() {
        try {
            const saved = localStorage.getItem('ecoDefenseProgress');
            if (saved) {
                const data = JSON.parse(saved);
                // 合并默认数据以确保新字段存在
                return { ...this.createDefaultPlayerData(), ...data };
            }
        } catch (error) {
            console.warn('加载玩家数据失败:', error);
        }
        
        return this.createDefaultPlayerData();
    }

    /**
     * 重置玩家数据
     */
    resetProgress() {
        this.playerData = this.createDefaultPlayerData();
        localStorage.removeItem('ecoDefenseProgress');
    }

    /**
     * 导出玩家数据
     */
    exportProgress() {
        return JSON.stringify({
            exportDate: new Date().toISOString(),
            gameVersion: '1.0.0',
            playerData: this.playerData
        }, null, 2);
    }

    /**
     * 导入玩家数据
     * @param {string} jsonData - JSON格式的玩家数据
     */
    importProgress(jsonData) {
        try {
            const imported = JSON.parse(jsonData);
            if (imported.playerData) {
                this.playerData = { ...this.createDefaultPlayerData(), ...imported.playerData };
                this.savePlayerData();
                return true;
            }
        } catch (error) {
            console.warn('导入玩家数据失败:', error);
        }
        
        return false;
    }
}

// 创建全局进度管理器实例
export const progressManager = new PlayerProgress();