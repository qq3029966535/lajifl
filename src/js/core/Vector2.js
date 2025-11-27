/**
 * 二维向量类
 * 用于表示位置、速度、方向等
 */
export class Vector2 {
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }

    /**
     * 设置向量值
     */
    set(x, y) {
        this.x = x;
        this.y = y;
        return this;
    }

    /**
     * 复制另一个向量
     */
    copy(vector) {
        this.x = vector.x;
        this.y = vector.y;
        return this;
    }

    /**
     * 克隆向量
     */
    clone() {
        return new Vector2(this.x, this.y);
    }

    /**
     * 向量加法
     */
    add(vector) {
        this.x += vector.x;
        this.y += vector.y;
        return this;
    }

    /**
     * 向量减法
     */
    subtract(vector) {
        this.x -= vector.x;
        this.y -= vector.y;
        return this;
    }

    /**
     * 向量乘法（标量）
     */
    multiply(scalar) {
        this.x *= scalar;
        this.y *= scalar;
        return this;
    }

    /**
     * 向量除法（标量）
     */
    divide(scalar) {
        if (scalar !== 0) {
            this.x /= scalar;
            this.y /= scalar;
        }
        return this;
    }

    /**
     * 计算向量长度
     */
    length() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }

    /**
     * 计算向量长度的平方
     */
    lengthSquared() {
        return this.x * this.x + this.y * this.y;
    }

    /**
     * 归一化向量
     */
    normalize() {
        const length = this.length();
        if (length > 0) {
            this.divide(length);
        }
        return this;
    }

    /**
     * 计算两点间距离
     */
    static distance(v1, v2) {
        const dx = v1.x - v2.x;
        const dy = v1.y - v2.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    /**
     * 计算两点间距离的平方
     */
    static distanceSquared(v1, v2) {
        const dx = v1.x - v2.x;
        const dy = v1.y - v2.y;
        return dx * dx + dy * dy;
    }

    /**
     * 向量点积
     */
    static dot(v1, v2) {
        return v1.x * v2.x + v1.y * v2.y;
    }

    /**
     * 线性插值
     */
    static lerp(v1, v2, t) {
        return new Vector2(
            v1.x + (v2.x - v1.x) * t,
            v1.y + (v2.y - v1.y) * t
        );
    }
}