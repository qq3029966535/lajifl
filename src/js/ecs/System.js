/**
 * 系统基类
 * ECS架构中的系统基类，用于处理特定组件组合的逻辑
 */
export class System {
    constructor() {
        this.componentManager = null;
        this.requiredComponents = [];
        this.enabled = true;
    }

    /**
     * 设置必需的组件类型
     * @param {...string} componentTypes - 组件类型列表
     */
    setRequiredComponents(...componentTypes) {
        this.requiredComponents = componentTypes;
    }

    /**
     * 获取符合条件的实体
     */
    getEntities() {
        if (!this.componentManager) return [];
        return this.componentManager.getEntitiesWithComponents(...this.requiredComponents);
    }

    /**
     * 启用系统
     */
    enable() {
        this.enabled = true;
    }

    /**
     * 禁用系统
     */
    disable() {
        this.enabled = false;
    }

    /**
     * 系统初始化
     */
    init() {
        // 子类可以重写此方法
    }

    /**
     * 系统更新
     * @param {number} deltaTime - 时间间隔
     */
    update(deltaTime) {
        if (!this.enabled) return;
        
        const entities = this.getEntities();
        for (const entity of entities) {
            this.processEntity(entity, deltaTime);
        }
    }

    /**
     * 处理单个实体
     * @param {Entity} entity - 实体
     * @param {number} deltaTime - 时间间隔
     */
    processEntity(entity, deltaTime) {
        // 子类应该重写此方法
    }

    /**
     * 系统销毁
     */
    destroy() {
        this.componentManager = null;
    }
}