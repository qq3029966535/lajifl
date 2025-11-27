/**
 * 收集系统
 * 处理垃圾桶收集垃圾僵尸的逻辑和反馈
 */
import { CollisionUtils } from '../utils/CollisionUtils.js';
import { Vector2 } from '../core/Vector2.js';
import { GameConfig } from '../config/GameConfig.js';
import { FeedbackSystem } from '../ui/FeedbackSystem.js';

export class CollectionSystem {
    constructor(trashBinSystem, audioManager = null) {
        this.trashBinSystem = trashBinSystem;
        this.audioManager = audioManager;
        this.feedbackSystem = new FeedbackSystem();
        this.activeTrashZombies = [];
        this.collectionHistory = [];
        
        // 统计数据
        this.totalCollections = 0;
        this.correctCollections = 0;
        this.incorrectCollections = 0;
        
        // 事件回调
        this.onCorrectCollection = null;
        this.onIncorrectCollection = null;
        this.onTrashEscaped = null;
    }

    /**
     * 添加垃圾僵尸到系统
     * @param {TrashZombie} trashZombie - 垃圾僵尸
     */
    addTrashZombie(trashZombie) {
        if (!this.activeTrashZombies.includes(trashZombie)) {
            this.activeTrashZombies.push(trashZombie);
        }
    }

    /**
     * 移除垃圾僵尸
     * @param {TrashZombie} trashZombie - 垃圾僵尸
     */
    removeTrashZombie(trashZombie) {
        const index = this.activeTrashZombies.indexOf(trashZombie);
        if (index > -1) {
            this.activeTrashZombies.splice(index, 1);
        }
    }

    /**
     * 检查收集碰撞
     * @param {number} deltaTime - 时间间隔
     */
    checkCollections(deltaTime) {
        const binsToCheck = this.trashBinSystem.getAllBins();
        const trashToRemove = [];
        
        for (const trash of this.activeTrashZombies) {
            if (trash.isCollected || trash.isInRetryMode) continue;
            
            const trashTransform = trash.getComponent('Transform');
            const trashCollider = trash.getComponent('Collider');
            if (!trashTransform || !trashCollider) continue;
            
            // 检查与所有垃圾桶的碰撞
            for (const bin of binsToCheck) {
                const binTransform = bin.getComponent('Transform');
                const binCollider = bin.getComponent('Collider');
                if (!binTransform || !binCollider) continue;
                
                // 使用碰撞器组件进行精确碰撞检测
                if (trashCollider.checkCollision(binCollider, trashTransform, binTransform)) {
                    const shouldRemove = this.performCollection(trash, bin);
                    if (shouldRemove) {
                        trashToRemove.push(trash);
                    }
                    break;
                }
            }
        }
        
        // 移除已收集的垃圾
        for (const trash of trashToRemove) {
            this.removeTrashZombie(trash);
        }
    }

    /**
     * 执行收集操作
     * @param {TrashZombie} trash - 垃圾僵尸
     * @param {TrashBin} bin - 垃圾桶
     */
    performCollection(trash, bin) {
        // 让垃圾桶尝试收集垃圾
        const collectionResult = bin.collect(trash);
        
        // 检查是否正确分类
        const isCorrect = collectionResult.correct;
        
        if (isCorrect) {
            // 正确分类，直接收集
            trash.getCollected(bin, true);
            this.totalCollections++;
            this.correctCollections++;
            this.handleCorrectCollection(trash, bin, collectionResult);
        } else {
            // 错误分类，检查是否可以重试
            if (trash.canRetry()) {
                // 可以重试，不移除垃圾
                trash.getCollected(bin, false);
                this.handleIncorrectCollection(trash, bin, collectionResult);
                
                // 显示重试提示
                this.showRetryHint(trash, bin);
                
                // 不从活跃列表中移除，让玩家有机会重新分类
                return false; // 返回false表示不要移除垃圾
            } else {
                // 不能重试，强制收集
                trash.getCollected(bin, false);
                this.totalCollections++;
                this.incorrectCollections++;
                this.handleIncorrectCollection(trash, bin, collectionResult);
            }
        }
        
        // 记录收集历史
        const collectionRecord = {
            timestamp: Date.now(),
            trashType: trash.type,
            binType: bin.type,
            correct: collectionResult.correct,
            points: collectionResult.points,
            retryCount: trash.retryCount
        };
        this.collectionHistory.push(collectionRecord);
        
        console.log(`收集统计: 总计${this.totalCollections}, 正确${this.correctCollections}, 错误${this.incorrectCollections}`);
        return true; // 返回true表示可以移除垃圾
    }

    /**
     * 处理正确收集
     * @param {TrashZombie} trash - 垃圾僵尸
     * @param {TrashBin} bin - 垃圾桶
     * @param {Object} result - 收集结果
     */
    handleCorrectCollection(trash, bin, result) {
        // 播放成功音效
        this.playSuccessSound();
        
        // 显示成功反馈
        const binTransform = bin.getComponent('Transform');
        if (binTransform) {
            this.feedbackSystem.showSuccess(
                binTransform.position,
                '正确分类！',
                result.points
            );
        }
        
        // 触发垃圾桶庆祝动画
        bin.playAnimation('celebrating');
        
        // 触发回调
        if (this.onCorrectCollection) {
            this.onCorrectCollection(trash, bin, result);
        }
    }

    /**
     * 处理错误收集
     * @param {TrashZombie} trash - 垃圾僵尸
     * @param {TrashBin} bin - 垃圾桶
     * @param {Object} result - 收集结果
     */
    handleIncorrectCollection(trash, bin, result) {
        // 播放错误音效
        this.playErrorSound();
        
        // 显示错误反馈
        const correctBinType = this.getCorrectBinType(trash.type);
        const correctBinName = GameConfig.trashBins[correctBinType].name;
        
        const binTransform = bin.getComponent('Transform');
        if (binTransform) {
            this.feedbackSystem.showError(
                binTransform.position,
                '分类错误！',
                correctBinName
            );
        }
        
        // 触发垃圾桶愤怒动画
        bin.playAnimation('angry');
        
        // 显示正确分类演示
        this.showCorrectClassificationDemo(trash.type, correctBinType, binTransform?.position);
        
        // 触发回调
        if (this.onIncorrectCollection) {
            this.onIncorrectCollection(trash, bin, result);
        }
    }

    /**
     * 显示重试提示
     * @param {TrashZombie} trash - 垃圾僵尸
     * @param {TrashBin} bin - 垃圾桶
     */
    showRetryHint(trash, bin) {
        const binTransform = bin.getComponent('Transform');
        if (!binTransform) return;
        
        const retriesLeft = trash.maxRetries - trash.retryCount;
        this.feedbackSystem.showWarning(
            binTransform.position,
            `还有 ${retriesLeft} 次重试机会！`
        );
        
        // 显示切换垃圾桶的提示
        const hintPosition = new Vector2(binTransform.position.x, binTransform.position.y + 30);
        this.feedbackSystem.showInfo(
            hintPosition,
            '按数字键切换垃圾桶类型',
            { duration: 2000, moveUp: false }
        );
    }
    }

    /**
     * 获取垃圾类型对应的正确垃圾桶类型
     * @param {string} trashType - 垃圾类型
     */
    getCorrectBinType(trashType) {
        for (const [binType, config] of Object.entries(GameConfig.trashBins)) {
            if (config.collectTypes.includes(trashType)) {
                return parseInt(binType);
            }
        }
        return 4; // 默认为其他垃圾桶
    }



    /**
     * 显示正确分类演示
     * @param {string} trashType - 垃圾类型
     * @param {number} correctBinType - 正确的垃圾桶类型
     * @param {Vector2} position - 显示位置
     */
    showCorrectClassificationDemo(trashType, correctBinType, position) {
        const trashTypeNames = {
            'kitchen_waste': '厨余垃圾',
            'recyclable': '可回收垃圾',
            'hazardous': '有害垃圾',
            'other': '其他垃圾'
        };
        
        const binConfig = GameConfig.trashBins[correctBinType];
        const trashTypeName = trashTypeNames[trashType] || '未知垃圾';
        
        // 使用反馈系统显示演示
        if (position) {
            this.feedbackSystem.showClassificationDemo(
                trashTypeName,
                binConfig.name,
                position
            );
        }
        
        console.log(`正确分类演示: ${trashTypeName} 应该投入 ${binConfig.name}`);
        console.log(`提示: ${binConfig.dialogue}`);
    }

    /**
     * 播放成功音效
     */
    playSuccessSound() {
        if (this.audioManager) {
            this.audioManager.playSound('success');
        } else {
            // 简单的音效模拟
            console.log('🎵 叮！分类正确音效');
        }
    }

    /**
     * 播放错误音效
     */
    playErrorSound() {
        if (this.audioManager) {
            this.audioManager.playSound('error');
        } else {
            // 简单的音效模拟
            console.log('🔊 警报！分类错误音效');
        }
    }

    /**
     * 检查垃圾是否逃脱
     */
    checkEscapedTrash() {
        const escapedTrash = [];
        
        for (const trash of this.activeTrashZombies) {
            if (trash.isAtEnd() && !trash.isCollected) {
                escapedTrash.push(trash);
            }
        }
        
        for (const trash of escapedTrash) {
            this.handleTrashEscaped(trash);
            this.removeTrashZombie(trash);
        }
        
        return escapedTrash.length > 0;
    }

    /**
     * 处理垃圾逃脱
     * @param {TrashZombie} trash - 逃脱的垃圾
     */
    handleTrashEscaped(trash) {
        console.log(`垃圾逃脱: ${trash.labelText}垃圾到达了轨道终点！`);
        
        if (this.onTrashEscaped) {
            this.onTrashEscaped(trash);
        }
    }

    /**
     * 获取收集统计
     */
    getCollectionStats() {
        return {
            total: this.totalCollections,
            correct: this.correctCollections,
            incorrect: this.incorrectCollections,
            accuracy: this.totalCollections > 0 ? (this.correctCollections / this.totalCollections) * 100 : 0,
            activeTrash: this.activeTrashZombies.length,
            history: [...this.collectionHistory]
        };
    }

    /**
     * 重置统计数据
     */
    resetStats() {
        this.totalCollections = 0;
        this.correctCollections = 0;
        this.incorrectCollections = 0;
        this.collectionHistory = [];
    }

    /**
     * 更新收集系统
     * @param {number} deltaTime - 时间间隔
     */
    update(deltaTime) {
        // 检查收集碰撞
        this.checkCollections(deltaTime);
        
        // 检查逃脱的垃圾
        this.checkEscapedTrash();
        
        // 更新反馈系统
        this.feedbackSystem.update(deltaTime);
    }

    /**
     * 设置事件回调
     * @param {Object} callbacks - 回调函数对象
     */
    setCallbacks(callbacks) {
        this.onCorrectCollection = callbacks.onCorrectCollection;
        this.onIncorrectCollection = callbacks.onIncorrectCollection;
        this.onTrashEscaped = callbacks.onTrashEscaped;
    }

    /**
     * 清空所有垃圾
     */
    clearAllTrash() {
        for (const trash of this.activeTrashZombies) {
            trash.destroy();
        }
        this.activeTrashZombies = [];
    }

    /**
     * 渲染收集系统
     * @param {RenderSystem} renderSystem - 渲染系统
     */
    render(renderSystem) {
        // 渲染反馈系统
        renderSystem.add2DRender((ctx) => {
            this.feedbackSystem.render(ctx);
        }, renderSystem.layers.UI);
    }

    /**
     * 销毁收集系统
     */
    destroy() {
        this.clearAllTrash();
        this.collectionHistory = [];
        this.feedbackSystem.destroy();
        console.log('收集系统已销毁');
    }
}