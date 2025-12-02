/**
 * Canvas测试文件 - 验证Canvas基本功能
 */

console.log('Canvas测试开始...');

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM加载完成');
    
    const canvas = document.getElementById('game-canvas');
    console.log('Canvas元素:', canvas);
    
    if (!canvas) {
        console.error('找不到Canvas元素');
        return;
    }
    
    const ctx = canvas.getContext('2d');
    console.log('Canvas上下文:', ctx);
    
    if (!ctx) {
        console.error('无法获取2D上下文');
        return;
    }
    
    console.log('Canvas尺寸:', canvas.width, 'x', canvas.height);
    
    // 测试基本绘制
    try {
        // 清空画布
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // 绘制背景
        ctx.fillStyle = '#98FB98';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        console.log('背景绘制完成');
        
        // 绘制测试文字
        ctx.fillStyle = '#2E7D32';
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('保卫家园游戏', canvas.width / 2, 150);
        console.log('标题绘制完成');
        
        // 绘制测试矩形
        ctx.fillStyle = '#4CAF50';
        ctx.fillRect(100, 200, 200, 100);
        console.log('矩形绘制完成');
        
        // 绘制测试圆形
        ctx.beginPath();
        ctx.arc(canvas.width / 2, canvas.height / 2, 50, 0, Math.PI * 2);
        ctx.fillStyle = '#2196F3';
        ctx.fill();
        console.log('圆形绘制完成');
        
        // 绘制状态信息
        ctx.fillStyle = '#000000';
        ctx.font = '16px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('Canvas测试成功！', 20, 50);
        ctx.fillText(`Canvas尺寸: ${canvas.width} x ${canvas.height}`, 20, 80);
        ctx.fillText('如果你能看到这些文字，说明Canvas工作正常', 20, 110);
        
        console.log('Canvas测试完成 - 所有绘制操作成功');
        
    } catch (error) {
        console.error('Canvas绘制错误:', error);
    }
});