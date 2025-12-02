/**
 * 测试场景 - 用于验证渲染系统
 */
import { Scene } from '../core/Scene.js';

export class TestScene extends Scene {
    constructor() {
        super('TestScene');
        this.time = 0;
    }

    /**
     * 初始化测试场景
     */
    init() {
        super.init();
        console.log('测试场景初始化完成');
    }

    /**
     * 更新测试场景
     * @param {number} deltaTime - 时间间隔
     */
    update(deltaTime) {
        super.update(deltaTime);
        this.time += deltaTime;
    }

    /**
     * 渲染测试场景
     * @param {RenderSystem} renderSystem - 渲染系统
     */
    render(renderSystem) {
        // 添加测试渲染到队列
        renderSystem.add2DRender((ctx) => {
            // 绘制测试文本
            ctx.fillStyle = '#2E7D32';
            ctx.font = 'bold 32px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('保卫家园游戏', ctx.canvas.width / 2, 100);
            
            // 绘制副标题
            ctx.fillStyle = '#4CAF50';
            ctx.font = '18px Arial';
            ctx.fillText('游戏正在运行...', ctx.canvas.width / 2, 150);
            
            // 绘制动态圆形
            const centerX = ctx.canvas.width / 2;
            const centerY = ctx.canvas.height / 2;
            const radius = 50 + Math.sin(this.time / 1000) * 20;
            
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
            ctx.fillStyle = '#87CEEB';
            ctx.fill();
            ctx.strokeStyle = '#4682B4';
            ctx.lineWidth = 3;
            ctx.stroke();
            
            // 绘制轨道示例
            for (let i = 0; i < 3; i++) {
                const y = 300 + i * 100;
                ctx.fillStyle = '#87CEEB';
                ctx.fillRect(100, y, 1000, 60);
                ctx.strokeStyle = '#4682B4';
                ctx.lineWidth = 2;
                ctx.strokeRect(100, y, 1000, 60);
            }
            
            // 绘制垃圾桶示例
            const binColors = ['#4CAF50', '#2196F3', '#F44336', '#FF9800'];
            const binNames = ['厨余', '可回收', '有害', '其他'];
            
            for (let i = 0; i < 4; i++) {
                const x = 200 + i * 200;
                const y = 250;
                
                // 垃圾桶主体
                ctx.fillStyle = binColors[i];
                ctx.fillRect(x - 20, y, 40, 50);
                
                // 垃圾桶盖子
                ctx.fillRect(x - 25, y - 5, 50, 10);
                
                // 标签
                ctx.fillStyle = '#FFFFFF';
                ctx.font = '12px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(binNames[i], x, y + 25);
            }
            
            // 绘制移动的垃圾僵尸示例
            const zombieX = 1000 - (this.time / 10) % 1200;
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(zombieX, 320, 30, 30);
            ctx.fillStyle = '#FFFFFF';
            ctx.font = '10px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('垃圾', zombieX + 15, 340);
            
            // 绘制控制说明
            ctx.fillStyle = '#2E7D32';
            ctx.font = '16px Arial';
            ctx.textAlign = 'left';
            ctx.fillText('控制说明:', 50, 650);
            ctx.fillText('1-4: 选择垃圾桶类型', 50, 680);
            ctx.fillText('鼠标点击: 放置垃圾桶', 50, 710);
            ctx.fillText('ESC: 返回菜单', 50, 740);
            
            // 绘制FPS
            ctx.fillStyle = '#666666';
            ctx.font = '12px Arial';
            ctx.textAlign = 'right';
            ctx.fillText(`FPS: ${Math.round(1000 / 16)}`, ctx.canvas.width - 20, 30);
            
        }, renderSystem.layers.UI);
        
        super.render(renderSystem);
    }

    /**
     * 处理键盘输入
     * @param {string} key - 按键
     */
    handleKeyInput(key) {
        console.log(`测试场景收到按键: ${key}`);
        
        if (key === 'Escape') {
            // 返回菜单
            console.log('返回菜单');
        }
    }

    /**
     * 处理鼠标点击
     * @param {number} x - 鼠标X坐标
     * @param {number} y - 鼠标Y坐标
     */
    handleMouseClick(x, y) {
        console.log(`测试场景收到鼠标点击: (${x}, ${y})`);
    }
}