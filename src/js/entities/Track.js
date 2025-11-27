/**
 * 轨道类
 * 管理游戏中的轨道数据和行为
 */
import { Vector2 } from '../core/Vector2.js';
import { CollisionUtils } from '../utils/CollisionUtils.js';

export class Track {
    constructor(id, startPoint, endPoint, width) {
        this.id = id;
        this.startPoint = startPoint.clone();
        this.endPoint = endPoint.clone();
        this.width = width;
        this.length = Vector2.distance(startPoint, endPoint);
        this.direction = this.calculateDirection();
        this.placedBins = [];
        this.active = true;
    }

    /**
     * 计算轨道方向
     */
    calculateDirection() {
        const direction = new Vector2(
            this.endPoint.x - this.startPoint.x,
            this.endPoint.y - this.startPoint.y
        );
        return direction.normalize();
    }

    /**
     * 检查点是否在轨道上
     * @param {number} x - X坐标
     * @param {number} y - Y坐标
     */
    isPointOnTrack(x, y) {
        const point = new Vector2(x, y);
        
        // 使用更精确的点到线段距离计算
        const distance = CollisionUtils.pointToLineDistance(point, this.startPoint, this.endPoint);
        
        // 检查是否在轨道宽度范围内
        return distance <= this.width / 2;
    }

    /**
     * 检查点是否在轨道的有效放置区域内
     * @param {number} x - X坐标
     * @param {number} y - Y坐标
     * @param {number} margin - 边距
     */
    isPointInPlacementArea(x, y, margin = 0) {
        const point = new Vector2(x, y);
        const distance = CollisionUtils.pointToLineDistance(point, this.startPoint, this.endPoint);
        
        // 检查是否在轨道宽度加边距的范围内
        return distance <= (this.width / 2 - margin);
    }

    /**
     * 检查圆形区域是否与轨道重叠
     * @param {Vector2} center - 圆心
     * @param {number} radius - 半径
     */
    isCircleOverlapping(center, radius) {
        const distance = CollisionUtils.pointToLineDistance(center, this.startPoint, this.endPoint);
        return distance <= (this.width / 2 + radius);
    }

    /**
     * 获取沿轨道的进度（0-1）
     * @param {Vector2} position - 位置
     */
    getProgressAlongTrack(position) {
        const toPosition = new Vector2(
            position.x - this.startPoint.x,
            position.y - this.startPoint.y
        );
        
        const projection = Vector2.dot(toPosition, this.direction);
        return Math.max(0, Math.min(1, projection / this.length));
    }

    /**
     * 根据进度获取轨道上的位置
     * @param {number} progress - 进度（0-1）
     */
    getPositionAtProgress(progress) {
        progress = Math.max(0, Math.min(1, progress));
        
        return new Vector2(
            this.startPoint.x + this.direction.x * this.length * progress,
            this.startPoint.y + this.direction.y * this.length * progress
        );
    }

    /**
     * 获取轨道中心线
     */
    getCenterLine() {
        return {
            start: this.startPoint.clone(),
            end: this.endPoint.clone()
        };
    }

    /**
     * 获取轨道边界
     */
    getBounds() {
        // 计算垂直于轨道方向的向量
        const perpendicular = new Vector2(-this.direction.y, this.direction.x);
        const halfWidth = this.width / 2;
        
        // 计算四个角点
        const topLeft = new Vector2(
            this.startPoint.x + perpendicular.x * halfWidth,
            this.startPoint.y + perpendicular.y * halfWidth
        );
        
        const topRight = new Vector2(
            this.endPoint.x + perpendicular.x * halfWidth,
            this.endPoint.y + perpendicular.y * halfWidth
        );
        
        const bottomLeft = new Vector2(
            this.startPoint.x - perpendicular.x * halfWidth,
            this.startPoint.y - perpendicular.y * halfWidth
        );
        
        const bottomRight = new Vector2(
            this.endPoint.x - perpendicular.x * halfWidth,
            this.endPoint.y - perpendicular.y * halfWidth
        );
        
        return {
            topLeft,
            topRight,
            bottomLeft,
            bottomRight,
            minX: Math.min(topLeft.x, topRight.x, bottomLeft.x, bottomRight.x),
            maxX: Math.max(topLeft.x, topRight.x, bottomLeft.x, bottomRight.x),
            minY: Math.min(topLeft.y, topRight.y, bottomLeft.y, bottomRight.y),
            maxY: Math.max(topLeft.y, topRight.y, bottomLeft.y, bottomRight.y)
        };
    }

    /**
     * 检查是否可以在指定位置放置垃圾桶
     * @param {Vector2} position - 位置
     * @param {number} binRadius - 垃圾桶半径
     */
    canPlaceBin(position, binRadius = 20) {
        // 检查位置是否在轨道的有效放置区域内
        if (!this.isPointInPlacementArea(position.x, position.y, binRadius)) {
            return false;
        }
        
        // 检查与已放置垃圾桶的距离
        for (const bin of this.placedBins) {
            const distance = Vector2.distance(position, bin.position);
            if (distance < binRadius * 2.2) { // 稍微增加间距
                return false;
            }
        }
        
        // 检查是否太靠近轨道端点
        const startDistance = Vector2.distance(position, this.startPoint);
        const endDistance = Vector2.distance(position, this.endPoint);
        const minEndDistance = binRadius * 1.5;
        
        if (startDistance < minEndDistance || endDistance < minEndDistance) {
            return false;
        }
        
        return true;
    }

    /**
     * 获取最佳放置位置
     * @param {Vector2} targetPosition - 目标位置
     * @param {number} binRadius - 垃圾桶半径
     */
    getBestPlacementPosition(targetPosition, binRadius = 20) {
        // 将目标位置投影到轨道上
        const projectedPosition = CollisionUtils.projectPointOnLine(
            targetPosition, 
            this.startPoint, 
            this.endPoint
        );
        
        // 检查投影位置是否可用
        if (this.canPlaceBin(projectedPosition, binRadius)) {
            return projectedPosition;
        }
        
        // 如果投影位置不可用，尝试在附近找到可用位置
        const searchRadius = binRadius * 3;
        const searchSteps = 8;
        
        for (let i = 1; i <= searchSteps; i++) {
            const angle = (Math.PI * 2 * i) / searchSteps;
            const testPosition = new Vector2(
                projectedPosition.x + Math.cos(angle) * searchRadius,
                projectedPosition.y + Math.sin(angle) * searchRadius
            );
            
            if (this.canPlaceBin(testPosition, binRadius)) {
                return testPosition;
            }
        }
        
        return null; // 找不到合适的位置
    }

    /**
     * 检查移动物体是否会与轨道上的垃圾桶碰撞
     * @param {Vector2} position - 物体位置
     * @param {number} radius - 物体半径
     */
    checkCollisionWithBins(position, radius) {
        const collidedBins = [];
        
        for (const bin of this.placedBins) {
            if (CollisionUtils.circleToCircle(position, radius, bin.position, bin.collectRadius)) {
                collidedBins.push(bin);
            }
        }
        
        return collidedBins;
    }

    /**
     * 添加垃圾桶到轨道
     * @param {TrashBin} bin - 垃圾桶
     */
    addBin(bin) {
        if (!this.placedBins.includes(bin)) {
            this.placedBins.push(bin);
        }
    }

    /**
     * 从轨道移除垃圾桶
     * @param {TrashBin} bin - 垃圾桶
     */
    removeBin(bin) {
        const index = this.placedBins.indexOf(bin);
        if (index > -1) {
            this.placedBins.splice(index, 1);
        }
    }

    /**
     * 渲染轨道
     * @param {CanvasRenderingContext2D} ctx - 渲染上下文
     */
    render(ctx) {
        if (!this.active) return;
        
        ctx.save();
        
        // 绘制轨道背景
        const bounds = this.getBounds();
        
        // 创建轨道路径
        ctx.beginPath();
        ctx.moveTo(bounds.topLeft.x, bounds.topLeft.y);
        ctx.lineTo(bounds.topRight.x, bounds.topRight.y);
        ctx.lineTo(bounds.bottomRight.x, bounds.bottomRight.y);
        ctx.lineTo(bounds.bottomLeft.x, bounds.bottomLeft.y);
        ctx.closePath();
        
        // 填充轨道背景
        ctx.fillStyle = '#87CEEB'; // 天空蓝
        ctx.fill();
        
        // 绘制轨道边框
        ctx.strokeStyle = '#4682B4';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // 绘制轨道中心线
        ctx.beginPath();
        ctx.moveTo(this.startPoint.x, this.startPoint.y);
        ctx.lineTo(this.endPoint.x, this.endPoint.y);
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 5]);
        ctx.stroke();
        ctx.setLineDash([]);
        
        // 绘制轨道ID（调试用）
        ctx.fillStyle = '#2E7D32';
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        const centerX = (this.startPoint.x + this.endPoint.x) / 2;
        const centerY = (this.startPoint.y + this.endPoint.y) / 2;
        ctx.fillText(`轨道 ${this.id}`, centerX, centerY - this.width / 2 - 10);
        
        ctx.restore();
    }

    /**
     * 渲染调试信息
     * @param {CanvasRenderingContext2D} ctx - 渲染上下文
     */
    renderDebug(ctx) {
        ctx.save();
        
        // 绘制轨道边界
        const bounds = this.getBounds();
        ctx.strokeStyle = '#FF0000';
        ctx.lineWidth = 1;
        ctx.strokeRect(bounds.minX, bounds.minY, bounds.maxX - bounds.minX, bounds.maxY - bounds.minY);
        
        // 绘制起点和终点
        ctx.fillStyle = '#00FF00';
        ctx.beginPath();
        ctx.arc(this.startPoint.x, this.startPoint.y, 5, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#FF0000';
        ctx.beginPath();
        ctx.arc(this.endPoint.x, this.endPoint.y, 5, 0, Math.PI * 2);
        ctx.fill();
        
        // 显示轨道信息
        ctx.fillStyle = '#000000';
        ctx.font = '12px Arial';
        ctx.fillText(`长度: ${Math.round(this.length)}`, this.startPoint.x, this.startPoint.y - 20);
        ctx.fillText(`宽度: ${this.width}`, this.startPoint.x, this.startPoint.y - 5);
        
        ctx.restore();
    }
}