/**
 * 主菜单场景
 */
import { Scene } from '../core/Scene.js';

export class MenuScene extends Scene {
    constructor() {
        super('MenuScene');
        this.title = '保卫家园游戏';
        this.subtitle = '2150年，地球因垃圾污染濒临崩溃！\n你作为"环保卫士"，需在虚拟绿色家园中建立分类防线，\n阻止垃圾僵尸军团入侵生态核心区！';
        this.buttons = [
            { text: '开始游戏', action: 'startGame', x: 0, y: 0, width: 200, height: 60 },
            { text: '游戏说明', action: 'showInstructions', x: 0, y: 0, width: 200, height: 60 },
            { text: '关卡选择', action: 'levelSelect', x: 0, y: 0, width: 200, height: 60 }
        ];
        this.selectedButton = 0;
    }

    /**
     * 初始化菜单场景
     */
    init() {
        super.init();
        this.calculateButtonPositions();
    }

    /**
     * 计算按钮位置
     */
    calculateButtonPositions() {
        const centerX = 600; // 画布宽度的一半
        const startY = 450;
        const spacing = 80;

        this.buttons.forEach((button, index) => {
            button.x = centerX - button.width / 2;
            button.y = startY + index * spacing;
        });
    }

    /**
     * 更新菜单场景
     * @param {number} deltaTime - 时间间隔
     */
    update(deltaTime) {
        super.update(deltaTime);
        // 菜单场景通常不需要复杂的更新逻辑
    }

    /**
     * 渲染菜单场景
     * @param {RenderSystem} renderSystem - 渲染系统
     */
    render(renderSystem) {
        // 添加菜单渲染到队列
        renderSystem.add2DRender((ctx) => {
            // 绘制标题
            this.drawTitle(ctx);
            
            // 绘制副标题
            this.drawSubtitle(ctx);
            
            // 绘制按钮
            this.drawButtons(ctx);
        }, renderSystem.layers.UI);
        
        super.render(renderSystem);
    }



    /**
     * 绘制标题
     */
    drawTitle(ctx) {
        ctx.fillStyle = '#2E7D32';
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(this.title, ctx.canvas.width / 2, 150);
        
        // 添加阴影效果
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(this.title, ctx.canvas.width / 2 - 2, 148);
    }

    /**
     * 绘制副标题
     */
    drawSubtitle(ctx) {
        ctx.fillStyle = '#2E7D32';
        ctx.font = '18px Arial';
        ctx.textAlign = 'center';
        
        const lines = this.subtitle.split('\n');
        lines.forEach((line, index) => {
            ctx.fillText(line, ctx.canvas.width / 2, 220 + index * 25);
        });
    }

    /**
     * 绘制按钮
     */
    drawButtons(ctx) {
        this.buttons.forEach((button, index) => {
            const isSelected = index === this.selectedButton;
            
            // 绘制按钮背景
            ctx.fillStyle = isSelected ? '#4CAF50' : '#2E7D32';
            ctx.fillRect(button.x, button.y, button.width, button.height);
            
            // 绘制按钮边框
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 2;
            ctx.strokeRect(button.x, button.y, button.width, button.height);
            
            // 绘制按钮文字
            ctx.fillStyle = '#FFFFFF';
            ctx.font = 'bold 20px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(
                button.text,
                button.x + button.width / 2,
                button.y + button.height / 2 + 7
            );
        });
    }

    /**
     * 处理键盘输入
     * @param {string} key - 按键
     */
    handleKeyInput(key) {
        switch (key) {
            case 'ArrowUp':
                this.selectedButton = Math.max(0, this.selectedButton - 1);
                break;
            case 'ArrowDown':
                this.selectedButton = Math.min(this.buttons.length - 1, this.selectedButton + 1);
                break;
            case 'Enter':
            case ' ':
                this.executeButtonAction(this.selectedButton);
                break;
        }
    }

    /**
     * 处理鼠标点击
     * @param {number} x - 鼠标X坐标
     * @param {number} y - 鼠标Y坐标
     */
    handleMouseClick(x, y) {
        this.buttons.forEach((button, index) => {
            if (x >= button.x && x <= button.x + button.width &&
                y >= button.y && y <= button.y + button.height) {
                this.selectedButton = index;
                this.executeButtonAction(index);
            }
        });
    }

    /**
     * 执行按钮动作
     * @param {number} buttonIndex - 按钮索引
     */
    executeButtonAction(buttonIndex) {
        const button = this.buttons[buttonIndex];
        if (!button) return;

        console.log(`执行动作: ${button.action}`);
        
        switch (button.action) {
            case 'startGame':
                this.startGame();
                break;
            case 'showInstructions':
                this.showInstructions();
                break;
            case 'levelSelect':
                console.log('关卡选择');
                break;
        }
    }

    /**
     * 开始游戏
     */
    startGame() {
        // 通知场景管理器切换到游戏场景
        if (this.sceneManager) {
            this.sceneManager.transitionTo('game');
        }
    }

    /**
     * 设置场景管理器引用
     * @param {SceneManager} sceneManager - 场景管理器
     */
    setSceneManager(sceneManager) {
        this.sceneManager = sceneManager;
    }

    /**
     * 显示游戏说明
     */
    showInstructions() {
        const instructions = `
游戏说明：

1. 使用数字键1-4选择垃圾桶类型：
   1 - 厨余垃圾桶（果皮菜叶）
   2 - 可回收垃圾桶（塑料金属纸箱）
   3 - 有害垃圾桶（电池灯管）
   4 - 其他垃圾桶（疑难杂症）

2. 点击轨道放置垃圾桶

3. 正确分类移动的垃圾僵尸

4. 每关限时2分钟，所有垃圾正确分类即通关

5. 任何垃圾通过轨道未被分类即失败

按键说明：
- ESC: 暂停/返回菜单
- 空格: 恢复游戏
- F1: 切换调试模式
        `;
        
        alert(instructions);
    }
}