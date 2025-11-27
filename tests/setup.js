/**
 * 测试环境设置
 */

// 模拟浏览器环境
global.performance = {
    now: () => Date.now()
};

global.requestAnimationFrame = (callback) => {
    setTimeout(callback, 16); // 模拟60FPS
};

// 模拟Canvas API
global.HTMLCanvasElement = class {
    constructor() {
        this.width = 1200;
        this.height = 800;
    }
    
    getContext() {
        return {
            clearRect: jest.fn(),
            fillRect: jest.fn(),
            createLinearGradient: jest.fn(() => ({
                addColorStop: jest.fn()
            }))
        };
    }
};

console.log('测试环境设置完成');