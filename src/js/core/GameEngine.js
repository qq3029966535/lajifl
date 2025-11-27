/**
 * 游戏引擎核心类
 * 管理游戏的主循环、初始化和销毁
 */
import { SceneManager } from './SceneManager.js';
import { MenuScene } from '../scenes/MenuScene.js';
import { RenderSystem } from '../rendering/RenderSystem.js';

export class GameEngine {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.isRunning = false;
        this.lastTime = 0;
        this.targetFPS = 60;
        this.frameTime = 1000 / this.targetFPS;
        
        // 核心系统
        this.sceneManager = null;
        this.renderSystem = null;
        this.inputManager = null;
        this.audioManager = null;
        this.resourceManager = null;
    }

    /**
     * 初始化游戏引擎
     * @param {HTMLCanvasElement} canvas - 游戏画布
     */
    async init(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        
        if (!this.ctx) {
            throw new Error('无法获取2D渲染上下文');
        }

        // 初始化各个管理器
        await this.initializeManagers();
        
        console.log('游戏引擎初始化完成');
        return true;
    }

    /**
     * 初始化各个管理器
     */
    async initializeManagers() {
        // 初始化渲染系统
        this.renderSystem = new RenderSystem(this.canvas);
        
        // 初始化场景管理器
        this.sceneManager = new SceneManager();
        
        // 注册菜单场景
        const menuScene = new MenuScene();
        menuScene.setSceneManager(this.sceneManager);
        this.sceneManager.registerScene('menu', menuScene);
        
        // 导入并注册测试场景
        const { TestScene } = await import('../scenes/TestScene.js');
        const testScene = new TestScene();
        this.sceneManager.registerScene('test', testScene);
        
        // 导入并注册游戏场景
        try {
            const { GameScene } = await import('../scenes/GameScene.js');
            const gameScene = new GameScene();
            this.sceneManager.registerScene('game', gameScene);
        } catch (error) {
            console.warn('游戏场景加载失败，使用测试场景:', error);
        }
        
        // 加载初始场景 - 先使用测试场景验证渲染
        await this.sceneManager.loadScene('test');
        
        console.log('管理器初始化完成');
    }

    /**
     * 启动游戏主循环
     */
    start() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        this.lastTime = performance.now();
        this.gameLoop();
        
        console.log('游戏开始运行');
    }

    /**
     * 停止游戏
     */
    stop() {
        this.isRunning = false;
        console.log('游戏停止');
    }

    /**
     * 游戏主循环
     */
    gameLoop() {
        if (!this.isRunning) return;

        const currentTime = performance.now();
        const deltaTime = currentTime - this.lastTime;

        if (deltaTime >= this.frameTime) {
            this.update(deltaTime);
            this.render();
            this.lastTime = currentTime;
        }

        requestAnimationFrame(() => this.gameLoop());
    }

    /**
     * 更新游戏逻辑
     * @param {number} deltaTime - 时间间隔
     */
    update(deltaTime) {
        if (this.sceneManager) {
            this.sceneManager.update(deltaTime);
        }
    }

    /**
     * 渲染游戏画面
     */
    render() {
        if (!this.renderSystem) return;
        
        // 开始渲染帧
        this.renderSystem.beginFrame();
        
        // 渲染背景
        this.renderSystem.renderBackground();
        
        // 渲染当前场景
        if (this.sceneManager) {
            this.sceneManager.render(this.renderSystem);
        }
        
        // 结束渲染帧
        this.renderSystem.endFrame();
    }

    /**
     * 销毁游戏引擎
     */
    destroy() {
        this.stop();
        
        if (this.sceneManager) {
            this.sceneManager.destroy();
        }
        
        if (this.renderSystem) {
            this.renderSystem.destroy();
        }
        
        this.canvas = null;
        this.ctx = null;
        
        console.log('游戏引擎已销毁');
    }

    /**
     * 获取画布尺寸
     */
    getCanvasSize() {
        return {
            width: this.canvas.width,
            height: this.canvas.height
        };
    }

    /**
     * 处理键盘输入
     * @param {string} key - 按键
     */
    handleKeyInput(key) {
        const currentScene = this.sceneManager.getCurrentScene();
        if (currentScene && currentScene.handleKeyInput) {
            currentScene.handleKeyInput(key);
        }
    }

    /**
     * 处理鼠标点击
     * @param {number} x - 鼠标X坐标
     * @param {number} y - 鼠标Y坐标
     */
    handleMouseClick(x, y) {
        const currentScene = this.sceneManager.getCurrentScene();
        if (currentScene && currentScene.handleMouseClick) {
            currentScene.handleMouseClick(x, y);
        }
    }

    /**
     * 处理鼠标移动
     * @param {number} x - 鼠标X坐标
     * @param {number} y - 鼠标Y坐标
     */
    handleMouseMove(x, y) {
        const currentScene = this.sceneManager.getCurrentScene();
        if (currentScene && currentScene.handleMouseMove) {
            currentScene.handleMouseMove(x, y);
        }
    }
}