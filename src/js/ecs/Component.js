/**
 * 组件基类
 * ECS架构中的组件基类，所有组件都应继承此类
 */
export class Component {
    constructor() {
        this.entity = null;
    }

    /**
     * 组件初始化
     */
    init() {
        // 子类可以重写此方法
    }

    /**
     * 组件更新
     * @param {number} deltaTime - 时间间隔
     */
    update(deltaTime) {
        // 子类可以重写此方法
    }

    /**
     * 组件销毁
     */
    destroy() {
        this.entity = null;
    }
}