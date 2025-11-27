/**
 * 轨道系统
 * 管理游戏中所有轨道的创建、布局和交互
 */
import { Track } from '../entities/Track.js';
import { Vector2 } from '../core/Vector2.js';
import { GameConfig } from '../config/GameConfig.js';

export class TrackSystem {
    constructor() {
        this.tracks = [];
        this.config = GameConfig.tracks;
        this.debugMode = false;
    }

    /**
     * 初始化轨道
     * @param {number} count - 轨道数量
     */
    initializeTracks(count) {
        this.clearTracks();
        
        const trackCount = Math.min(count, this.config.maxCount);
        const totalHeight = trackCount * this.config.spacing;
        const startY = this.config.startY;
        
        for (let i = 0; i < trackCount; i++) {
            const trackY = startY + i * this.config.spacing;
            
            const startPoint = new Vector2(this.config.startX, trackY);
            const endPoint = new Vector2(this.config.endX, trackY);
            
            const track = new Track(i + 1, startPoint, endPoint, this.config.width);
            this.tracks.push(track);
        }
        
        console.log(`初始化了 ${trackCount} 条轨道`);
    }

    /**
     * 根据索引获取轨道
     * @param {number} index - 轨道索引
     */
    getTrackByIndex(index) {
        return this.tracks[index];
    }

    /**
     * 根据ID获取轨道
     * @param {number} id - 轨道ID
     */
    getTrackById(id) {
        return this.tracks.find(track => track.id === id);
    }

    /**
     * 获取所有轨道
     */
    getAllTracks() {
        return [...this.tracks];
    }

    /**
     * 获取活跃轨道
     */
    getActiveTracks() {
        return this.tracks.filter(track => track.active);
    }

    /**
     * 检查位置是否可以放置垃圾桶
     * @param {number} x - X坐标
     * @param {number} y - Y坐标
     * @param {number} binRadius - 垃圾桶半径
     */
    isValidPlacement(x, y, binRadius = 20) {
        const position = new Vector2(x, y);
        
        // 检查是否在任何轨道上
        for (const track of this.getActiveTracks()) {
            if (track.canPlaceBin(position, binRadius)) {
                return { valid: true, track: track };
            }
        }
        
        return { valid: false, track: null };
    }

    /**
     * 获取最佳放置位置
     * @param {number} x - 目标X坐标
     * @param {number} y - 目标Y坐标
     * @param {number} binRadius - 垃圾桶半径
     */
    getBestPlacementPosition(x, y, binRadius = 20) {
        const targetPosition = new Vector2(x, y);
        let bestPosition = null;
        let bestTrack = null;
        let minDistance = Infinity;
        
        // 在所有轨道上寻找最佳位置
        for (const track of this.getActiveTracks()) {
            const position = track.getBestPlacementPosition(targetPosition, binRadius);
            if (position) {
                const distance = Vector2.distance(targetPosition, position);
                if (distance < minDistance) {
                    minDistance = distance;
                    bestPosition = position;
                    bestTrack = track;
                }
            }
        }
        
        return bestPosition ? { position: bestPosition, track: bestTrack } : null;
    }

    /**
     * 检查移动物体与所有轨道上垃圾桶的碰撞
     * @param {Vector2} position - 物体位置
     * @param {number} radius - 物体半径
     */
    checkCollisionWithAllBins(position, radius) {
        const allCollisions = [];
        
        for (const track of this.getActiveTracks()) {
            const collisions = track.checkCollisionWithBins(position, radius);
            allCollisions.push(...collisions);
        }
        
        return allCollisions;
    }

    /**
     * 获取指定位置的轨道
     * @param {number} x - X坐标
     * @param {number} y - Y坐标
     */
    getTrackAtPosition(x, y) {
        for (const track of this.getActiveTracks()) {
            if (track.isPointOnTrack(x, y)) {
                return track;
            }
        }
        return null;
    }

    /**
     * 获取最近的轨道
     * @param {Vector2} position - 位置
     */
    getNearestTrack(position) {
        let nearestTrack = null;
        let minDistance = Infinity;
        
        for (const track of this.getActiveTracks()) {
            // 计算到轨道中心线的距离
            const centerX = (track.startPoint.x + track.endPoint.x) / 2;
            const centerY = (track.startPoint.y + track.endPoint.y) / 2;
            const distance = Vector2.distance(position, new Vector2(centerX, centerY));
            
            if (distance < minDistance) {
                minDistance = distance;
                nearestTrack = track;
            }
        }
        
        return nearestTrack;
    }

    /**
     * 在轨道上放置垃圾桶
     * @param {TrashBin} bin - 垃圾桶
     * @param {Vector2} position - 位置
     */
    placeBinOnTrack(bin, position) {
        const track = this.getTrackAtPosition(position.x, position.y);
        if (track && track.canPlaceBin(position, bin.collectRadius)) {
            track.addBin(bin);
            return track;
        }
        return null;
    }

    /**
     * 从轨道移除垃圾桶
     * @param {TrashBin} bin - 垃圾桶
     */
    removeBinFromTrack(bin) {
        for (const track of this.tracks) {
            track.removeBin(bin);
        }
    }

    /**
     * 获取轨道统计信息
     */
    getTrackStats() {
        const stats = {
            totalTracks: this.tracks.length,
            activeTracks: this.getActiveTracks().length,
            totalBins: 0,
            trackDetails: []
        };
        
        for (const track of this.tracks) {
            stats.totalBins += track.placedBins.length;
            stats.trackDetails.push({
                id: track.id,
                active: track.active,
                binCount: track.placedBins.length,
                length: Math.round(track.length)
            });
        }
        
        return stats;
    }

    /**
     * 清空所有轨道
     */
    clearTracks() {
        this.tracks = [];
    }

    /**
     * 激活轨道
     * @param {number} trackId - 轨道ID
     */
    activateTrack(trackId) {
        const track = this.getTrackById(trackId);
        if (track) {
            track.active = true;
        }
    }

    /**
     * 停用轨道
     * @param {number} trackId - 轨道ID
     */
    deactivateTrack(trackId) {
        const track = this.getTrackById(trackId);
        if (track) {
            track.active = false;
        }
    }

    /**
     * 切换调试模式
     */
    toggleDebugMode() {
        this.debugMode = !this.debugMode;
    }

    /**
     * 更新轨道系统
     * @param {number} deltaTime - 时间间隔
     */
    update(deltaTime) {
        // 轨道系统通常不需要每帧更新
        // 但可以在这里添加动画效果或其他逻辑
    }

    /**
     * 渲染所有轨道
     * @param {CanvasRenderingContext2D} ctx - 渲染上下文
     */
    render(ctx) {
        for (const track of this.tracks) {
            track.render(ctx);
            
            if (this.debugMode) {
                track.renderDebug(ctx);
            }
        }
        
        if (this.debugMode) {
            this.renderDebugInfo(ctx);
        }
    }

    /**
     * 渲染调试信息
     * @param {CanvasRenderingContext2D} ctx - 渲染上下文
     */
    renderDebugInfo(ctx) {
        const stats = this.getTrackStats();
        
        ctx.save();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(10, 120, 200, 120);
        
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '12px Arial';
        ctx.fillText('轨道系统调试信息:', 20, 140);
        ctx.fillText(`总轨道数: ${stats.totalTracks}`, 20, 160);
        ctx.fillText(`活跃轨道数: ${stats.activeTracks}`, 20, 180);
        ctx.fillText(`总垃圾桶数: ${stats.totalBins}`, 20, 200);
        
        let y = 220;
        for (const detail of stats.trackDetails) {
            ctx.fillText(
                `轨道${detail.id}: ${detail.active ? '活跃' : '停用'} (${detail.binCount}桶)`,
                20,
                y
            );
            y += 15;
        }
        
        ctx.restore();
    }

    /**
     * 销毁轨道系统
     */
    destroy() {
        this.clearTracks();
        console.log('轨道系统已销毁');
    }
}