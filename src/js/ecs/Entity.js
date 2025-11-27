/**
 * 实体类
 * ECS架构中的实体，用于组合各种组件
 */
export class Entity {
    static nextId = 1;

    constructor() {
        this.id = Entity.nextId++;
        this.components = new Map();
        this.active = true;
    }

    /**
     * 添加组件
     * @param {Component} component - 要添加的组件
     */
    addComponent(component) {
        const componentType = component.constructor.name;
        this.components.set(componentType, component);
        component.entity = this;
        return this;
    }

    /**
     * 获取组件
     * @param {string} componentType - 组件类型名称
     */
    getComponent(componentType) {
        return this.components.get(componentType);
    }

    /**
     * 检查是否有指定组件
     * @param {string} componentType - 组件类型名称
     */
    hasComponent(componentType) {
        return this.components.has(componentType);
    }

    /**
     * 移除组件
     * @param {string} componentType - 组件类型名称
     */
    removeComponent(componentType) {
        const component = this.components.get(componentType);
        if (component) {
            component.entity = null;
            this.components.delete(componentType);
        }
        return this;
    }

    /**
     * 获取所有组件
     */
    getAllComponents() {
        return Array.from(this.components.values());
    }

    /**
     * 检查实体是否有指定的所有组件
     * @param {...string} componentTypes - 组件类型名称列表
     */
    hasComponents(...componentTypes) {
        return componentTypes.every(type => this.hasComponent(type));
    }

    /**
     * 激活实体
     */
    activate() {
        this.active = true;
    }

    /**
     * 停用实体
     */
    deactivate() {
        this.active = false;
    }

    /**
     * 销毁实体
     */
    destroy() {
        this.components.clear();
        this.active = false;
    }
}