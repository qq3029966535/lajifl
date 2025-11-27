/**
 * 场景管理器
 * 负责场景的加载、切换和管理
 */
export class SceneManager {
    constructor() {
        this.scenes = new Map();
        this.currentScene = null;
        this.nextScene = null;
        this.isTransitioning = false;
    }

    /**
     * 注册场景
     * @param {string} name - 场景名称
     * @param {Scene} scene - 场景实例
     */
    registerScene(name, scene) {
        this.scenes.set(name, scene);
        console.log(`场景 ${name} 已注册`);
    }

    /**
     * 加载场景
     * @param {string} sceneName - 场景名称
     */
    async loadScene(sceneName) {
        if (this.isTransitioning) {
            console.warn('场景切换中，请稍后');
            return false;
        }

        const scene = this.scenes.get(sceneName);
        if (!scene) {
            console.error(`场景 ${sceneName} 不存在`);
            return false;
        }

        this.nextScene = scene;
        this.isTransitioning = true;

        try {
            // 停用当前场景
            if (this.currentScene) {
                this.currentScene.deactivate();
            }

            // 初始化新场景
            await scene.init();
            
            // 激活新场景
            scene.activate();
            
            // 切换场景
            this.currentScene = scene;
            this.nextScene = null;
            this.isTransitioning = false;

            console.log(`场景切换到: ${sceneName}`);
            return true;

        } catch (error) {
            console.error(`场景 ${sceneName} 加载失败:`, error);
            this.isTransitioning = false;
            return false;
        }
    }

    /**
     * 获取当前场景
     */
    getCurrentScene() {
        return this.currentScene;
    }

    /**
     * 切换到指定场景
     * @param {string} sceneName - 目标场景名称
     */
    async transitionTo(sceneName) {
        return await this.loadScene(sceneName);
    }

    /**
     * 更新当前场景
     * @param {number} deltaTime - 时间间隔
     */
    update(deltaTime) {
        if (this.currentScene && !this.isTransitioning) {
            this.currentScene.update(deltaTime);
        }
    }

    /**
     * 渲染当前场景
     * @param {RenderSystem} renderSystem - 渲染系统
     */
    render(renderSystem) {
        if (this.currentScene && !this.isTransitioning) {
            this.currentScene.render(renderSystem);
        }

        // 如果正在切换场景，显示过渡效果
        if (this.isTransitioning) {
            this.renderTransition(renderSystem);
        }
    }

    /**
     * 渲染场景切换过渡效果
     * @param {RenderSystem} renderSystem - 渲染系统
     */
    renderTransition(renderSystem) {
        renderSystem.add2DRender((ctx) => {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
            
            ctx.fillStyle = '#FFFFFF';
            ctx.font = '24px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('加载中...', ctx.canvas.width / 2, ctx.canvas.height / 2);
        }, renderSystem.layers.UI);
    }

    /**
     * 销毁场景管理器
     */
    destroy() {
        // 销毁当前场景
        if (this.currentScene) {
            this.currentScene.destroy();
        }

        // 销毁所有注册的场景
        for (const [name, scene] of this.scenes) {
            scene.destroy();
        }

        this.scenes.clear();
        this.currentScene = null;
        this.nextScene = null;
        this.isTransitioning = false;

        console.log('场景管理器已销毁');
    }
}