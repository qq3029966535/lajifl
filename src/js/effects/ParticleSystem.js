/**
 * 粒子系统
 * 管理游戏中的各种粒子效果
 */
import { Vector2 } from '../core/Vector2.js';

export class Particle {
    constructor(position, velocity, options = {}) {
        this.position = position.clone();
        this.velocity = velocity.clone();
        this.acceleration = options.acceleration || new Vector2(0, 0);
        
        this.life = options.life || 1000; // 生命周期（毫秒）
        this.maxLife = this.life;
        this.size = options.size || 2;
        this.color = options.color || '#FFFFFF';
        this.alpha = options.alpha || 1;
        
        this.gravity = options.gravity || 0;
        this.friction = options.friction || 0.98;
        this.fadeOut = options.fadeOut !== false;
        
        this.isAlive = true;
    }

    /**
     * 更新粒子
     * @param {number} deltaTime - 时间间隔
     */
    update(deltaTime) {
        if (!this.isAlive) return;
        
        const dt = deltaTime / 1000; // 转换为秒
        
        // 应用重力
        if (this.gravity) {
            this.acceleration.y += this.gravity;
        }
        
        // 更新速度
        this.velocity.add(new Vector2(
            this.acceleration.x * dt,
            this.acceleration.y * dt
        ));
        
        // 应用摩擦力
        this.velocity.multiply(this.friction);
        
        // 更新位置
        this.position.add(new Vector2(
            this.velocity.x * dt,
            this.velocity.y * dt
        ));
        
        // 更新生命周期
        this.life -= deltaTime;
        
        // 淡出效果
        if (this.fadeOut) {
            this.alpha = Math.max(0, this.life / this.maxLife);
        }
        
        // 检查是否死亡
        if (this.life <= 0) {
            this.isAlive = false;
        }
        
        // 重置加速度
        this.acceleration.set(0, 0);
    }

    /**
     * 渲染粒子
     * @param {CanvasRenderingContext2D} ctx - 渲染上下文
     */
    render(ctx) {
        if (!this.isAlive) return;
        
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = this.color;
        
        ctx.beginPath();
        ctx.arc(this.position.x, this.position.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
}

export class ParticleSystem {
    constructor() {
        this.particles = [];
        this.emitters = [];
    }

    /**
     * 创建粒子
     * @param {Vector2} position - 位置
     * @param {Vector2} velocity - 速度
     * @param {Object} options - 选项
     */
    createParticle(position, velocity, options = {}) {
        const particle = new Particle(position, velocity, options);
        this.particles.push(particle);
        return particle;
    }

    /**
     * 创建爆炸效果
     * @param {Vector2} position - 爆炸位置
     * @param {Object} options - 选项
     */
    createExplosion(position, options = {}) {
        const particleCount = options.count || 8;
        const speed = options.speed || 50;
        const colors = options.colors || ['#FF6B35', '#F7931E', '#FFD23F'];
        
        for (let i = 0; i < particleCount; i++) {
            const angle = (Math.PI * 2 * i) / particleCount;
            const velocity = new Vector2(
                Math.cos(angle) * speed,
                Math.sin(angle) * speed
            );
            
            this.createParticle(position, velocity, {
                life: 800 + Math.random() * 400,
                size: 2 + Math.random() * 3,
                color: colors[Math.floor(Math.random() * colors.length)],
                gravity: 20,
                friction: 0.95
            });
        }
    }

    /**
     * 创建滴落效果
     * @param {Vector2} position - 起始位置
     * @param {Object} options - 选项
     */
    createDropEffect(position, options = {}) {
        const dropCount = options.count || 3;
        const color = options.color || '#8B4513';
        
        for (let i = 0; i < dropCount; i++) {
            const velocity = new Vector2(
                (Math.random() - 0.5) * 10,
                Math.random() * 20 + 10
            );
            
            this.createParticle(position, velocity, {
                life: 1000 + Math.random() * 500,
                size: 1 + Math.random(),
                color: color,
                gravity: 50,
                friction: 0.99
            });
        }
    }

    /**
     * 创建闪光效果
     * @param {Vector2} position - 位置
     * @param {Object} options - 选项
     */
    createSparkleEffect(position, options = {}) {
        const sparkleCount = options.count || 5;
        const colors = options.colors || ['#87CEEB', '#1E90FF', '#FFFFFF'];
        
        for (let i = 0; i < sparkleCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 20 + Math.random() * 30;
            const velocity = new Vector2(
                Math.cos(angle) * speed,
                Math.sin(angle) * speed
            );
            
            this.createParticle(position, velocity, {
                life: 600 + Math.random() * 400,
                size: 1 + Math.random() * 2,
                color: colors[Math.floor(Math.random() * colors.length)],
                friction: 0.96,
                fadeOut: true
            });
        }
    }

    /**
     * 创建烟雾效果
     * @param {Vector2} position - 位置
     * @param {Object} options - 选项
     */
    createSmokeEffect(position, options = {}) {
        const smokeCount = options.count || 4;
        const color = options.color || 'rgba(128, 0, 128, 0.6)';
        
        for (let i = 0; i < smokeCount; i++) {
            const velocity = new Vector2(
                (Math.random() - 0.5) * 15,
                -Math.random() * 25 - 10
            );
            
            this.createParticle(position, velocity, {
                life: 1500 + Math.random() * 1000,
                size: 3 + Math.random() * 4,
                color: color,
                friction: 0.98,
                fadeOut: true
            });
        }
    }

    /**
     * 创建收集效果
     * @param {Vector2} startPosition - 起始位置
     * @param {Vector2} targetPosition - 目标位置
     * @param {Object} options - 选项
     */
    createCollectionEffect(startPosition, targetPosition, options = {}) {
        const particleCount = options.count || 6;
        const color = options.color || '#4CAF50';
        
        for (let i = 0; i < particleCount; i++) {
            // 计算朝向目标的速度
            const direction = new Vector2(
                targetPosition.x - startPosition.x,
                targetPosition.y - startPosition.y
            ).normalize();
            
            const speed = 80 + Math.random() * 40;
            const velocity = new Vector2(
                direction.x * speed + (Math.random() - 0.5) * 20,
                direction.y * speed + (Math.random() - 0.5) * 20
            );
            
            this.createParticle(startPosition, velocity, {
                life: 800 + Math.random() * 400,
                size: 2 + Math.random() * 2,
                color: color,
                friction: 0.97
            });
        }
    }

    /**
     * 更新粒子系统
     * @param {number} deltaTime - 时间间隔
     */
    update(deltaTime) {
        // 更新所有粒子
        for (const particle of this.particles) {
            particle.update(deltaTime);
        }
        
        // 移除死亡的粒子
        this.particles = this.particles.filter(particle => particle.isAlive);
    }

    /**
     * 渲染粒子系统
     * @param {CanvasRenderingContext2D} ctx - 渲染上下文
     */
    render(ctx) {
        for (const particle of this.particles) {
            particle.render(ctx);
        }
    }

    /**
     * 获取粒子数量
     */
    getParticleCount() {
        return this.particles.length;
    }

    /**
     * 清空所有粒子
     */
    clear() {
        this.particles = [];
    }

    /**
     * 销毁粒子系统
     */
    destroy() {
        this.clear();
        this.emitters = [];
    }
}