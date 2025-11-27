/**
 * 场景基类
 * 所有游戏场景的基础类
 */
export class Scene {
    constructor(name) {
        this.name = name;
        this.isActive = false;
        this.isInitialized = false;
        this.entities = [];
        this.systems = [];
    }

    /**
     * 初始化场景
     */
    init() {
        this.isInitialized = true;
        console.log(`场景 ${this.name} 初始化完成`);
    }

    /**
     * 激活场景
     */
    activate() {
        this.isActive = true;
        console.log(`场景 ${this.name} 已激活`);
    }

    /**
     * 停用场景
     */
    deactivate() {
        this.isActive = false;
        console.log(`场景 ${this.name} 已停用`);
    }

    /**
     * 更新场景
     * @param {number} deltaTime - 时间间隔
     */
    update(deltaTime) {
        if (!this.isActive) return;

        // 更新所有系统
        for (const system of this.systems) {
            if (system.update) {
                system.update(deltaTime);
            }
        }

        // 更新所有实体
        for (const entity of this.entities) {
            if (entity.update) {
                entity.update(deltaTime);
            }
        }
    }

    /**
     * 渲染场景
     * @param {RenderSystem} renderSystem - 渲染系统
     */
    render(renderSystem) {
        if (!this.isActive) return;

        // 渲染所有实体
        for (const entity of this.entities) {
            if (entity.render) {
                entity.render(renderSystem);
            }
        }

        // 渲染所有系统
        for (const system of this.systems) {
            if (system.render) {
                system.render(renderSystem);
            }
        }
    }

    /**
     * 处理键盘输入
     * @param {string} key - 按键
     */
    handleKeyInput(key) {
        // 子类重写此方法
    }

    /**
     * 处理鼠标点击
     * @param {number} x - 鼠标X坐标
     * @param {number} y - 鼠标Y坐标
     */
    handleMouseClick(x, y) {
        // 子类重写此方法
    }

    /**
     * 处理鼠标移动
     * @param {number} x - 鼠标X坐标
     * @param {number} y - 鼠标Y坐标
     */
    handleMouseMove(x, y) {
        // 子类重写此方法
    }

    /**
     * 添加实体
     * @param {Object} entity - 实体对象
     */
    addEntity(entity) {
        this.entities.push(entity);
    }

    /**
     * 移除实体
     * @param {Object} entity - 实体对象
     */
    removeEntity(entity) {
        const index = this.entities.indexOf(entity);
        if (index > -1) {
            this.entities.splice(index, 1);
        }
    }

    /**
     * 添加系统
     * @param {Object} system - 系统对象
     */
    addSystem(system) {
        this.systems.push(system);
    }

    /**
     * 移除系统
     * @param {Object} system - 系统对象
     */
    removeSystem(system) {
        const index = this.systems.indexOf(system);
        if (index > -1) {
            this.systems.splice(index, 1);
        }
    }

    /**
     * 清理场景
     */
    cleanup() {
        this.entities = [];
        this.systems = [];
        this.isActive = false;
        console.log(`场景 ${this.name} 已清理`);
    }

    /**
     * 销毁场景
     */
    destroy() {
        this.cleanup();
        this.isInitialized = false;
        console.log(`场景 ${this.name} 已销毁`);
    }
}