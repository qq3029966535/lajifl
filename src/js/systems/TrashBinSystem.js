/**
 * 垃圾桶系统
 * 管理垃圾桶的选择、放置和交互
 */
import { TrashBin } from '../entities/TrashBin.js';
import { Vector2 } from '../core/Vector2.js';
import { TrashBinType, GameConfig } from '../config/GameConfig.js';

export class TrashBinSystem {
    constructor(trackSystem) {
        this.trackSystem = trackSystem;
        this.selectedBinType = TrashBinType.KITCHEN_WASTE;
        this.placedBins = [];
        this.previewBin = null;
        this.showPreview = false;
        this.previewPosition = new Vector2(0, 0);
        
        // 放置限制
        this.maxBinsPerTrack = 5;
        this.binCost = GameConfig.gameplay.binPlacementCost;
        
        // 事件回调
        this.onBinPlaced = null;
        this.onBinRemoved = null;
        this.onSelectionChanged = null;
    }

    /**
     * 选择垃圾桶类型
     * @param {number} binType - 垃圾桶类型
     */
    selectBin(binType) {
        if (binType >= 1 && binType <= 4) {
            this.selectedBinType = binType;
            this.updatePreviewBin();
            
            // 播放选择音效和显示台词
            const binConfig = GameConfig.trashBins[binType];
            console.log(`选择: ${binConfig.name} - "${binConfig.dialogue}"`);
            
            if (this.onSelectionChanged) {
                this.onSelectionChanged(binType, binConfig);
            }
        }
    }

    /**
     * 获取当前选中的垃圾桶类型
     */
    getSelectedBinType() {
        return this.selectedBinType;
    }

    /**
     * 获取选中垃圾桶的配置
     */
    getSelectedBinConfig() {
        return GameConfig.trashBins[this.selectedBinType];
    }

    /**
     * 尝试放置垃圾桶
     * @param {number} x - X坐标
     * @param {number} y - Y坐标
     */
    placeBin(x, y) {
        const position = new Vector2(x, y);
        
        // 检查是否可以放置
        const placementResult = this.canPlaceAt(position);
        
        if (!placementResult.canPlace) {
            console.log(`无法放置垃圾桶: ${placementResult.reason}`);
            return { success: false, reason: placementResult.reason };
        }
        
        // 创建垃圾桶实体
        const bin = new TrashBin(this.selectedBinType, position);
        
        // 添加到轨道
        const track = placementResult.track;
        track.addBin(bin);
        
        // 添加到系统管理
        this.placedBins.push(bin);
        
        // 触发放置事件
        if (this.onBinPlaced) {
            this.onBinPlaced(bin, track);
        }
        
        console.log(`成功放置 ${bin.config.name} 在轨道 ${track.id}`);
        return { success: true, bin: bin, track: track };
    }

    /**
     * 检查是否可以在指定位置放置垃圾桶
     * @param {Vector2} position - 位置
     */
    canPlaceAt(position) {
        // 检查轨道系统是否允许放置
        const trackResult = this.trackSystem.isValidPlacement(
            position.x, 
            position.y, 
            GameConfig.trashBins[this.selectedBinType].collectRadius
        );
        
        if (!trackResult.valid) {
            return { canPlace: false, reason: '位置不在有效轨道上' };
        }
        
        const track = trackResult.track;
        
        // 检查轨道上的垃圾桶数量限制
        if (track.placedBins.length >= this.maxBinsPerTrack) {
            return { canPlace: false, reason: '轨道上垃圾桶数量已达上限' };
        }
        
        // 检查是否与现有垃圾桶重叠
        const binRadius = GameConfig.trashBins[this.selectedBinType].collectRadius;
        for (const existingBin of this.placedBins) {
            const distance = Vector2.distance(position, existingBin.getComponent('Transform').position);
            if (distance < binRadius * 2) {
                return { canPlace: false, reason: '与现有垃圾桶距离太近' };
            }
        }
        
        return { canPlace: true, track: track };
    }

    /**
     * 移除垃圾桶
     * @param {TrashBin} bin - 要移除的垃圾桶
     */
    removeBin(bin) {
        // 从轨道移除
        this.trackSystem.removeBinFromTrack(bin);
        
        // 从系统移除
        const index = this.placedBins.indexOf(bin);
        if (index > -1) {
            this.placedBins.splice(index, 1);
        }
        
        // 销毁实体
        bin.destroy();
        
        // 触发移除事件
        if (this.onBinRemoved) {
            this.onBinRemoved(bin);
        }
        
        console.log(`移除了 ${bin.config.name}`);
    }

    /**
     * 获取指定位置的垃圾桶
     * @param {number} x - X坐标
     * @param {number} y - Y坐标
     */
    getBinAt(x, y) {
        const position = new Vector2(x, y);
        
        for (const bin of this.placedBins) {
            const binTransform = bin.getComponent('Transform');
            const binCollider = bin.getComponent('Collider');
            
            if (binCollider.checkCollision(
                { getWorldBounds: () => ({ x: position.x, y: position.y }) },
                { position: position },
                binTransform
            )) {
                return bin;
            }
        }
        
        return null;
    }

    /**
     * 显示放置预览
     * @param {number} x - X坐标
     * @param {number} y - Y坐标
     */
    showPlacementPreview(x, y) {
        this.showPreview = true;
        this.previewPosition.set(x, y);
        
        if (!this.previewBin) {
            this.updatePreviewBin();
        }
    }

    /**
     * 隐藏放置预览
     */
    hidePlacementPreview() {
        this.showPreview = false;
    }

    /**
     * 更新预览垃圾桶
     */
    updatePreviewBin() {
        this.previewBin = {
            type: this.selectedBinType,
            config: GameConfig.trashBins[this.selectedBinType],
            alpha: 0.6
        };
    }

    /**
     * 获取所有已放置的垃圾桶
     */
    getAllBins() {
        return [...this.placedBins];
    }

    /**
     * 根据类型获取垃圾桶
     * @param {number} binType - 垃圾桶类型
     */
    getBinsByType(binType) {
        return this.placedBins.filter(bin => bin.type === binType);
    }

    /**
     * 清空所有垃圾桶
     */
    clearAllBins() {
        for (const bin of this.placedBins) {
            this.trackSystem.removeBinFromTrack(bin);
            bin.destroy();
        }
        
        this.placedBins = [];
        console.log('清空了所有垃圾桶');
    }

    /**
     * 获取系统统计信息
     */
    getSystemStats() {
        const stats = {
            totalBins: this.placedBins.length,
            binsByType: {},
            totalCollections: 0,
            totalCorrectCollections: 0,
            overallAccuracy: 0
        };
        
        // 按类型统计
        for (let type = 1; type <= 4; type++) {
            const bins = this.getBinsByType(type);
            stats.binsByType[type] = {
                count: bins.length,
                collections: bins.reduce((sum, bin) => sum + bin.collectCount, 0),
                correctCollections: bins.reduce((sum, bin) => sum + bin.correctCollections, 0)
            };
        }
        
        // 总体统计
        for (const bin of this.placedBins) {
            stats.totalCollections += bin.collectCount;
            stats.totalCorrectCollections += bin.correctCollections;
        }
        
        stats.overallAccuracy = stats.totalCollections > 0 
            ? (stats.totalCorrectCollections / stats.totalCollections) * 100 
            : 0;
        
        return stats;
    }

    /**
     * 更新垃圾桶系统
     * @param {number} deltaTime - 时间间隔
     */
    update(deltaTime) {
        // 更新所有垃圾桶
        for (const bin of this.placedBins) {
            bin.update(deltaTime);
        }
    }

    /**
     * 渲染垃圾桶系统
     * @param {RenderSystem} renderSystem - 渲染系统
     */
    render(renderSystem) {
        // 渲染所有已放置的垃圾桶
        for (const bin of this.placedBins) {
            bin.render(renderSystem);
        }
        
        // 渲染预览垃圾桶
        if (this.showPreview && this.previewBin) {
            this.renderPreview(renderSystem);
        }
    }

    /**
     * 渲染预览垃圾桶
     * @param {RenderSystem} renderSystem - 渲染系统
     */
    renderPreview(renderSystem) {
        const canPlace = this.canPlaceAt(this.previewPosition).canPlace;
        
        renderSystem.add2DRender((ctx) => {
            ctx.save();
            
            // 设置透明度
            ctx.globalAlpha = this.previewBin.alpha;
            
            // 移动到预览位置
            ctx.translate(this.previewPosition.x, this.previewPosition.y);
            
            // 根据是否可以放置设置颜色
            const color = canPlace ? this.previewBin.config.color : '#FF4444';
            
            // 绘制预览垃圾桶（简化版本）
            ctx.fillStyle = color;
            ctx.fillRect(-16, -20, 32, 40);
            
            // 绘制边框
            ctx.strokeStyle = canPlace ? '#FFFFFF' : '#FF0000';
            ctx.lineWidth = 2;
            ctx.strokeRect(-16, -20, 32, 40);
            
            // 绘制收集范围
            ctx.strokeStyle = canPlace ? 'rgba(255, 255, 255, 0.5)' : 'rgba(255, 0, 0, 0.5)';
            ctx.lineWidth = 1;
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.arc(0, 0, this.previewBin.config.collectRadius, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
            
            ctx.restore();
        }, renderSystem.layers.UI);
    }

    /**
     * 处理键盘输入
     * @param {string} key - 按键
     */
    handleKeyInput(key) {
        // 数字键1-4选择垃圾桶类型
        if (key >= '1' && key <= '4') {
            this.selectBin(parseInt(key));
        }
    }

    /**
     * 处理鼠标移动（用于预览）
     * @param {number} x - 鼠标X坐标
     * @param {number} y - 鼠标Y坐标
     */
    handleMouseMove(x, y) {
        this.showPlacementPreview(x, y);
    }

    /**
     * 处理鼠标点击
     * @param {number} x - 鼠标X坐标
     * @param {number} y - 鼠标Y坐标
     */
    handleMouseClick(x, y) {
        // 检查是否点击了现有垃圾桶（用于移除）
        const existingBin = this.getBinAt(x, y);
        if (existingBin) {
            // 右键或特殊键可以移除垃圾桶
            console.log(`点击了 ${existingBin.config.name}`);
            return { action: 'select', bin: existingBin };
        }
        
        // 尝试放置新垃圾桶
        const result = this.placeBin(x, y);
        return { action: 'place', result: result };
    }

    /**
     * 设置事件回调
     * @param {Object} callbacks - 回调函数对象
     */
    setCallbacks(callbacks) {
        this.onBinPlaced = callbacks.onBinPlaced;
        this.onBinRemoved = callbacks.onBinRemoved;
        this.onSelectionChanged = callbacks.onSelectionChanged;
    }

    /**
     * 销毁垃圾桶系统
     */
    destroy() {
        this.clearAllBins();
        this.previewBin = null;
        console.log('垃圾桶系统已销毁');
    }
}