/**
 * 碰撞检测工具类
 * 提供各种几何形状的碰撞检测算法
 */
import { Vector2 } from '../core/Vector2.js';

export class CollisionUtils {
    /**
     * 点与圆形碰撞检测
     * @param {Vector2} point - 点
     * @param {Vector2} circleCenter - 圆心
     * @param {number} radius - 半径
     */
    static pointInCircle(point, circleCenter, radius) {
        const distance = Vector2.distance(point, circleCenter);
        return distance <= radius;
    }

    /**
     * 点与矩形碰撞检测
     * @param {Vector2} point - 点
     * @param {Object} rect - 矩形 {x, y, width, height}
     */
    static pointInRectangle(point, rect) {
        return point.x >= rect.x && 
               point.x <= rect.x + rect.width &&
               point.y >= rect.y && 
               point.y <= rect.y + rect.height;
    }

    /**
     * 点与多边形碰撞检测（射线法）
     * @param {Vector2} point - 点
     * @param {Array<Vector2>} polygon - 多边形顶点数组
     */
    static pointInPolygon(point, polygon) {
        let inside = false;
        const x = point.x;
        const y = point.y;
        
        for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
            const xi = polygon[i].x;
            const yi = polygon[i].y;
            const xj = polygon[j].x;
            const yj = polygon[j].y;
            
            if (((yi > y) !== (yj > y)) && 
                (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
                inside = !inside;
            }
        }
        
        return inside;
    }

    /**
     * 圆形与圆形碰撞检测
     * @param {Vector2} center1 - 第一个圆心
     * @param {number} radius1 - 第一个半径
     * @param {Vector2} center2 - 第二个圆心
     * @param {number} radius2 - 第二个半径
     */
    static circleToCircle(center1, radius1, center2, radius2) {
        const distance = Vector2.distance(center1, center2);
        return distance <= (radius1 + radius2);
    }

    /**
     * 矩形与矩形碰撞检测
     * @param {Object} rect1 - 第一个矩形
     * @param {Object} rect2 - 第二个矩形
     */
    static rectangleToRectangle(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }

    /**
     * 圆形与矩形碰撞检测
     * @param {Vector2} circleCenter - 圆心
     * @param {number} radius - 半径
     * @param {Object} rect - 矩形
     */
    static circleToRectangle(circleCenter, radius, rect) {
        const closestX = Math.max(rect.x, Math.min(circleCenter.x, rect.x + rect.width));
        const closestY = Math.max(rect.y, Math.min(circleCenter.y, rect.y + rect.height));
        
        const distance = Vector2.distance(circleCenter, new Vector2(closestX, closestY));
        return distance <= radius;
    }

    /**
     * 点到线段的最短距离
     * @param {Vector2} point - 点
     * @param {Vector2} lineStart - 线段起点
     * @param {Vector2} lineEnd - 线段终点
     */
    static pointToLineDistance(point, lineStart, lineEnd) {
        const A = point.x - lineStart.x;
        const B = point.y - lineStart.y;
        const C = lineEnd.x - lineStart.x;
        const D = lineEnd.y - lineStart.y;

        const dot = A * C + B * D;
        const lenSq = C * C + D * D;
        
        if (lenSq === 0) {
            // 线段退化为点
            return Vector2.distance(point, lineStart);
        }
        
        let param = dot / lenSq;
        
        let xx, yy;
        
        if (param < 0) {
            xx = lineStart.x;
            yy = lineStart.y;
        } else if (param > 1) {
            xx = lineEnd.x;
            yy = lineEnd.y;
        } else {
            xx = lineStart.x + param * C;
            yy = lineStart.y + param * D;
        }
        
        const dx = point.x - xx;
        const dy = point.y - yy;
        return Math.sqrt(dx * dx + dy * dy);
    }

    /**
     * 点在线段上的投影点
     * @param {Vector2} point - 点
     * @param {Vector2} lineStart - 线段起点
     * @param {Vector2} lineEnd - 线段终点
     */
    static projectPointOnLine(point, lineStart, lineEnd) {
        const A = point.x - lineStart.x;
        const B = point.y - lineStart.y;
        const C = lineEnd.x - lineStart.x;
        const D = lineEnd.y - lineStart.y;

        const dot = A * C + B * D;
        const lenSq = C * C + D * D;
        
        if (lenSq === 0) {
            return lineStart.clone();
        }
        
        let param = dot / lenSq;
        param = Math.max(0, Math.min(1, param)); // 限制在线段范围内
        
        return new Vector2(
            lineStart.x + param * C,
            lineStart.y + param * D
        );
    }

    /**
     * 线段与线段相交检测
     * @param {Vector2} line1Start - 第一条线段起点
     * @param {Vector2} line1End - 第一条线段终点
     * @param {Vector2} line2Start - 第二条线段起点
     * @param {Vector2} line2End - 第二条线段终点
     */
    static lineToLine(line1Start, line1End, line2Start, line2End) {
        const x1 = line1Start.x, y1 = line1Start.y;
        const x2 = line1End.x, y2 = line1End.y;
        const x3 = line2Start.x, y3 = line2Start.y;
        const x4 = line2End.x, y4 = line2End.y;

        const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
        
        if (Math.abs(denom) < 1e-10) {
            return false; // 平行线
        }

        const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom;
        const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / denom;

        return t >= 0 && t <= 1 && u >= 0 && u <= 1;
    }

    /**
     * 获取线段与线段的交点
     * @param {Vector2} line1Start - 第一条线段起点
     * @param {Vector2} line1End - 第一条线段终点
     * @param {Vector2} line2Start - 第二条线段起点
     * @param {Vector2} line2End - 第二条线段终点
     */
    static getLineIntersection(line1Start, line1End, line2Start, line2End) {
        const x1 = line1Start.x, y1 = line1Start.y;
        const x2 = line1End.x, y2 = line1End.y;
        const x3 = line2Start.x, y3 = line2Start.y;
        const x4 = line2End.x, y4 = line2End.y;

        const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
        
        if (Math.abs(denom) < 1e-10) {
            return null; // 平行线
        }

        const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom;
        
        if (t >= 0 && t <= 1) {
            return new Vector2(
                x1 + t * (x2 - x1),
                y1 + t * (y2 - y1)
            );
        }
        
        return null;
    }

    /**
     * 检查点是否在扇形内
     * @param {Vector2} point - 点
     * @param {Vector2} center - 扇形中心
     * @param {number} radius - 半径
     * @param {number} startAngle - 起始角度（弧度）
     * @param {number} endAngle - 结束角度（弧度）
     */
    static pointInSector(point, center, radius, startAngle, endAngle) {
        // 首先检查是否在圆内
        if (!this.pointInCircle(point, center, radius)) {
            return false;
        }
        
        // 计算点相对于中心的角度
        const dx = point.x - center.x;
        const dy = point.y - center.y;
        let angle = Math.atan2(dy, dx);
        
        // 标准化角度到 [0, 2π]
        if (angle < 0) angle += Math.PI * 2;
        
        // 标准化起始和结束角度
        let start = startAngle % (Math.PI * 2);
        let end = endAngle % (Math.PI * 2);
        if (start < 0) start += Math.PI * 2;
        if (end < 0) end += Math.PI * 2;
        
        // 检查角度是否在范围内
        if (start <= end) {
            return angle >= start && angle <= end;
        } else {
            // 跨越0度的情况
            return angle >= start || angle <= end;
        }
    }

    /**
     * 计算两个边界框的重叠区域
     * @param {Object} rect1 - 第一个矩形
     * @param {Object} rect2 - 第二个矩形
     */
    static getOverlapArea(rect1, rect2) {
        const left = Math.max(rect1.x, rect2.x);
        const right = Math.min(rect1.x + rect1.width, rect2.x + rect2.width);
        const top = Math.max(rect1.y, rect2.y);
        const bottom = Math.min(rect1.y + rect1.height, rect2.y + rect2.height);
        
        if (left < right && top < bottom) {
            return {
                x: left,
                y: top,
                width: right - left,
                height: bottom - top,
                area: (right - left) * (bottom - top)
            };
        }
        
        return null;
    }
}