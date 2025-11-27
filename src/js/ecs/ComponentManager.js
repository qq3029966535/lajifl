/**
 * 组件管理器
 * 管理所有实体的组件，提供查询和系统支持
 */
export class ComponentManager {
    constructor() {
        this.entities = new Map();
        this.componentTypes = new Set();
        this.systems = [];
    }

    /**
     * 注册实体
     * @param {Entity} entity - 实体
     */
    registerEntity(entity) {
        this.entities.set(entity.id, entity);
    }

    /**
     * 注销实体
     * @param {Entity} entity - 实体
     */
    unregisterEntity(entity) {
        this.entities.delete(entity.id);
    }

    /**
     * 获取实体
     * @param {number} entityId - 实体ID
     */
    getEntity(entityId) {
        return this.entities.get(entityId);
    }

    /**
     * 获取所有实体
     */
    getAllEntities() {
        return Array.from(this.entities.values());
    }

    /**
     * 获取活跃实体
     */
    getActiveEntities() {
        return this.getAllEntities().filter(entity => entity.active);
    }

    /**
     * 根据组件类型查询实体
     * @param {...string} componentTypes - 组件类型列表
     */
    getEntitiesWithComponents(...componentTypes) {
        return this.getActiveEntities().filter(entity => 
            entity.hasComponents(...componentTypes)
        );
    }

    /**
     * 根据标签查询实体
     * @param {string} tag - 标签
     */
    getEntitiesWithTag(tag) {
        return this.getActiveEntities().filter(entity => {
            const collider = entity.getComponent('Collider');
            return collider && collider.hasTag(tag);
        });
    }

    /**
     * 添加系统
     * @param {System} system - 系统
     */
    addSystem(system) {
        this.systems.push(system);
        system.componentManager = this;
    }

    /**
     * 移除系统
     * @param {System} system - 系统
     */
    removeSystem(system) {
        const index = this.systems.indexOf(system);
        if (index > -1) {
            this.systems.splice(index, 1);
            system.componentManager = null;
        }
    }

    /**
     * 更新所有系统
     * @param {number} deltaTime - 时间间隔
     */
    update(deltaTime) {
        // 更新所有组件
        for (const entity of this.getActiveEntities()) {
            for (const component of entity.getAllComponents()) {
                if (component.update) {
                    component.update(deltaTime);
                }
            }
        }

        // 更新所有系统
        for (const system of this.systems) {
            if (system.update) {
                system.update(deltaTime);
            }
        }
    }

    /**
     * 渲染所有实体
     * @param {CanvasRenderingContext2D} ctx - 渲染上下文
     */
    render(ctx) {
        const renderableEntities = this.getEntitiesWithComponents('Transform', 'Renderer');
        
        // 按层级排序
        renderableEntities.sort((a, b) => {
            const rendererA = a.getComponent('Renderer');
            const rendererB = b.getComponent('Renderer');
            return (rendererA.layer || 0) - (rendererB.layer || 0);
        });

        // 渲染所有实体
        for (const entity of renderableEntities) {
            const transform = entity.getComponent('Transform');
            const renderer = entity.getComponent('Renderer');
            
            if (renderer.visible) {
                renderer.render(ctx, transform);
            }
        }
    }

    /**
     * 渲染调试信息
     * @param {CanvasRenderingContext2D} ctx - 渲染上下文
     */
    renderDebug(ctx) {
        const collidableEntities = this.getEntitiesWithComponents('Transform', 'Collider');
        
        for (const entity of collidableEntities) {
            const transform = entity.getComponent('Transform');
            const collider = entity.getComponent('Collider');
            
            collider.renderDebug(ctx, transform);
        }
    }

    /**
     * 清理已销毁的实体
     */
    cleanup() {
        const entitiesToRemove = [];
        
        for (const [id, entity] of this.entities) {
            if (!entity.active) {
                entitiesToRemove.push(id);
            }
        }
        
        for (const id of entitiesToRemove) {
            this.entities.delete(id);
        }
    }

    /**
     * 销毁组件管理器
     */
    destroy() {
        // 销毁所有实体
        for (const entity of this.entities.values()) {
            entity.destroy();
        }
        
        // 清理系统
        for (const system of this.systems) {
            if (system.destroy) {
                system.destroy();
            }
        }
        
        this.entities.clear();
        this.systems = [];
        this.componentTypes.clear();
    }
}