/**
 * 垃圾僵尸系统
 * 管理垃圾僵尸的生成、移动和生命周期
 */
import { TrashZombie } from '../entities/TrashZombie.js';
import { Vector2 } from '../core/Vector2.js';
import { TrashType, GameConfig } from '../config/GameConfig.js';

export class TrashZombieSystem {
    constructor(trackSystem) {
        this.trackSystem = trackSystem;
        this.activeZombies = [];
        this.spawnQueue = [];
        this.spawnTimer = 0;
        
        // 生成配置
        this.baseSpawnInterval = 2000; // 基础生成间隔（毫秒）
        this.currentSpawnInterval = this.baseSpawnInterval;
        this.maxActiveZombies = 10;
        
        // 难度配置
        this.difficultyMultiplier = 1.0;
        this.speedMultiplier = 1.0;
        
        // 事件回调
        this.onZombieSpawned = null;
        this.onZombieReachedEnd = null;
        this.onZombieDestroyed = null;
    }

    /**
     * 生成垃圾僵尸
     * @param {string} type - 垃圾类型
     * @param {number} trackId - 轨道ID
     * @param {Object} options - 生成选项
     */
    spawnZombie(type, trackId, options = {}) {
        const track = this.trackSystem.getTrackById(trackId);
        if (!track) {
            console.warn(`轨道 ${trackId} 不存在`);
            return null;
        }
        
        // 检查活跃僵尸数量限制
        if (this.activeZombies.length >= this.maxActiveZombies) {
            console.warn('活跃垃圾僵尸数量已达上限');
            return null;
        }
        
        // 在轨道起点生成
        const startPosition = track.startPoint.clone();
        
        // 添加一些随机偏移，避免重叠
        const offset = (Math.random() - 0.5) * track.width * 0.5;
        const perpendicular = new Vector2(-track.direction.y, track.direction.x);
        startPosition.x += perpendicular.x * offset;
        startPosition.y += perpendicular.y * offset;
        
        // 创建垃圾僵尸
        const zombie = new TrashZombie(type, trackId, startPosition);
        zombie.setTrack(track);
        
        // 应用选项
        if (options.speed) {
            const movement = zombie.getComponent('Movement');
            if (movement) {
                movement.setSpeed(options.speed * this.speedMultiplier);
            }
        }
        
        // 添加到活跃列表
        this.activeZombies.push(zombie);
        
        // 触发生成事件
        if (this.onZombieSpawned) {
            this.onZombieSpawned(zombie, track);
        }
        
        console.log(`生成垃圾僵尸: ${zombie.labelText} 在轨道 ${trackId}`);
        return zombie;
    }

    /**
     * 批量生成垃圾僵尸
     * @param {Array} spawnData - 生成数据数组
     */
    spawnZombies(spawnData) {
        for (const data of spawnData) {
            this.spawnZombie(data.type, data.trackId, data.options);
        }
    }

    /**
     * 添加到生成队列
     * @param {Object} spawnData - 生成数据
     */
    addToSpawnQueue(spawnData) {
        this.spawnQueue.push({
            ...spawnData,
            spawnTime: Date.now() + (spawnData.delay || 0)
        });
    }

    /**
     * 处理生成队列
     */
    processSpawnQueue() {
        const currentTime = Date.now();
        const toSpawn = [];
        
        // 找出需要生成的僵尸
        for (let i = this.spawnQueue.length - 1; i >= 0; i--) {
            const spawnData = this.spawnQueue[i];
            if (currentTime >= spawnData.spawnTime) {
                toSpawn.push(spawnData);
                this.spawnQueue.splice(i, 1);
            }
        }
        
        // 生成僵尸
        for (const data of toSpawn) {
            this.spawnZombie(data.type, data.trackId, data.options);
        }
    }

    /**
     * 自动生成垃圾僵尸
     * @param {number} deltaTime - 时间间隔
     */
    autoSpawn(deltaTime) {
        this.spawnTimer += deltaTime;
        
        if (this.spawnTimer >= this.currentSpawnInterval) {
            this.spawnRandomZombie();
            this.spawnTimer = 0;
            
            // 动态调整生成间隔
            this.adjustSpawnInterval();
        }
    }

    /**
     * 生成随机垃圾僵尸
     */
    spawnRandomZombie() {
        const activeTracks = this.trackSystem.getActiveTracks();
        if (activeTracks.length === 0) return;
        
        // 随机选择轨道
        const randomTrack = activeTracks[Math.floor(Math.random() * activeTracks.length)];
        
        // 随机选择垃圾类型
        const trashTypes = [
            TrashType.KITCHEN_WASTE,
            TrashType.RECYCLABLE,
            TrashType.HAZARDOUS,
            TrashType.OTHER
        ];
        const randomType = trashTypes[Math.floor(Math.random() * trashTypes.length)];
        
        // 随机速度变化
        const speedVariation = 0.8 + Math.random() * 0.4; // 0.8-1.2倍速度
        
        this.spawnZombie(randomType, randomTrack.id, {
            speed: 50 * speedVariation
        });
    }

    /**
     * 调整生成间隔
     */
    adjustSpawnInterval() {
        // 根据难度和活跃僵尸数量调整生成间隔
        const zombieRatio = this.activeZombies.length / this.maxActiveZombies;
        const intervalMultiplier = Math.max(0.5, 1 - zombieRatio * 0.5);
        
        this.currentSpawnInterval = this.baseSpawnInterval * intervalMultiplier / this.difficultyMultiplier;
    }

    /**
     * 移除垃圾僵尸
     * @param {TrashZombie} zombie - 垃圾僵尸
     */
    removeZombie(zombie) {
        const index = this.activeZombies.indexOf(zombie);
        if (index > -1) {
            this.activeZombies.splice(index, 1);
            
            // 触发销毁事件
            if (this.onZombieDestroyed) {
                this.onZombieDestroyed(zombie);
            }
        }
    }

    /**
     * 检查到达终点的僵尸
     */
    checkEndReached() {
        const zombiesToRemove = [];
        
        for (const zombie of this.activeZombies) {
            if (zombie.isAtEnd() && !zombie.isCollected) {
                zombiesToRemove.push(zombie);
                
                // 触发到达终点事件
                if (this.onZombieReachedEnd) {
                    this.onZombieReachedEnd(zombie);
                }
            }
        }
        
        // 移除到达终点的僵尸
        for (const zombie of zombiesToRemove) {
            this.removeZombie(zombie);
            zombie.destroy();
        }
        
        return zombiesToRemove.length > 0;
    }

    /**
     * 清理已收集的僵尸
     */
    cleanupCollectedZombies() {
        const zombiesToRemove = [];
        
        for (const zombie of this.activeZombies) {
            if (zombie.isCollected) {
                zombiesToRemove.push(zombie);
            }
        }
        
        for (const zombie of zombiesToRemove) {
            this.removeZombie(zombie);
        }
    }

    /**
     * 设置难度
     * @param {number} level - 关卡等级
     * @param {Object} levelConfig - 关卡配置
     */
    setDifficulty(level, levelConfig = null) {
        this.difficultyMultiplier = 1 + (level - 1) * 0.2; // 每关增加20%难度
        this.speedMultiplier = 1 + (level - 1) * 0.1; // 每关增加10%速度
        this.maxActiveZombies = Math.min(15, 5 + level * 2); // 最大僵尸数量递增
        
        // 如果有关卡配置，使用配置中的生成间隔
        if (levelConfig && levelConfig.spawnInterval) {
            this.baseSpawnInterval = levelConfig.spawnInterval;
            this.currentSpawnInterval = this.baseSpawnInterval;
        }
        
        console.log(`设置难度: 等级${level}, 难度倍数${this.difficultyMultiplier}, 速度倍数${this.speedMultiplier}, 生成间隔${this.baseSpawnInterval}ms`);
    }

    /**
     * 暂停所有僵尸
     */
    pauseAllZombies() {
        for (const zombie of this.activeZombies) {
            const movement = zombie.getComponent('Movement');
            if (movement) {
                movement.stopMoving();
            }
        }
    }

    /**
     * 恢复所有僵尸
     */
    resumeAllZombies() {
        for (const zombie of this.activeZombies) {
            const movement = zombie.getComponent('Movement');
            if (movement) {
                movement.startMoving();
            }
        }
    }

    /**
     * 获取系统统计
     */
    getSystemStats() {
        return {
            activeZombies: this.activeZombies.length,
            maxActiveZombies: this.maxActiveZombies,
            spawnQueueLength: this.spawnQueue.length,
            currentSpawnInterval: this.currentSpawnInterval,
            difficultyMultiplier: this.difficultyMultiplier,
            speedMultiplier: this.speedMultiplier,
            zombiesByType: this.getZombiesByType()
        };
    }

    /**
     * 按类型统计僵尸
     */
    getZombiesByType() {
        const stats = {};
        
        for (const zombie of this.activeZombies) {
            if (!stats[zombie.type]) {
                stats[zombie.type] = 0;
            }
            stats[zombie.type]++;
        }
        
        return stats;
    }

    /**
     * 更新垃圾僵尸系统
     * @param {number} deltaTime - 时间间隔
     */
    update(deltaTime) {
        // 处理生成队列
        this.processSpawnQueue();
        
        // 自动生成（如果启用）
        if (this.autoSpawnEnabled) {
            this.autoSpawn(deltaTime);
        }
        
        // 更新所有活跃僵尸
        for (const zombie of this.activeZombies) {
            zombie.update(deltaTime);
        }
        
        // 检查到达终点的僵尸
        this.checkEndReached();
        
        // 清理已收集的僵尸
        this.cleanupCollectedZombies();
    }

    /**
     * 渲染所有垃圾僵尸
     * @param {RenderSystem} renderSystem - 渲染系统
     */
    render(renderSystem) {
        for (const zombie of this.activeZombies) {
            zombie.render(renderSystem);
        }
    }

    /**
     * 启用/禁用自动生成
     * @param {boolean} enabled - 是否启用
     */
    setAutoSpawn(enabled) {
        this.autoSpawnEnabled = enabled;
        if (enabled) {
            this.spawnTimer = 0;
        }
    }

    /**
     * 设置事件回调
     * @param {Object} callbacks - 回调函数对象
     */
    setCallbacks(callbacks) {
        this.onZombieSpawned = callbacks.onZombieSpawned;
        this.onZombieReachedEnd = callbacks.onZombieReachedEnd;
        this.onZombieDestroyed = callbacks.onZombieDestroyed;
    }

    /**
     * 清空所有僵尸
     */
    clearAllZombies() {
        for (const zombie of this.activeZombies) {
            zombie.destroy();
        }
        this.activeZombies = [];
        this.spawnQueue = [];
    }

    /**
     * 销毁系统
     */
    destroy() {
        this.clearAllZombies();
        console.log('垃圾僵尸系统已销毁');
    }
}