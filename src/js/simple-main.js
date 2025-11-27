/**
 * 简化的游戏入口文件 - 用于调试
 */

console.log('简化游戏启动...');

class SimpleGame {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.isRunning = false;
        this.time = 0;
        
        // 游戏状态
        this.selectedBinType = 1; // 当前选中的垃圾桶类型 (1-4)
        this.placedBins = []; // 已放置的垃圾桶
        this.tracks = []; // 轨道数据
        this.trashItems = []; // 移动的垃圾
        this.score = 0;
        this.collectedCount = 0;
        
        // 垃圾桶配置
        this.binConfig = {
            1: { name: '厨余', color: '#4CAF50', collectTypes: ['kitchen_waste'] },
            2: { name: '可回收', color: '#2196F3', collectTypes: ['recyclable'] },
            3: { name: '有害', color: '#F44336', collectTypes: ['hazardous'] },
            4: { name: '其他', color: '#FF9800', collectTypes: ['other'] }
        };
        
        // 垃圾类型配置 - 更具体的垃圾物品
        this.trashConfig = {
            kitchen_waste: { 
                name: '厨余垃圾', 
                color: '#8B4513',
                items: [
                    { name: '香蕉皮', icon: '🍌', color: '#FFD700' },
                    { name: '苹果核', icon: '🍎', color: '#FF6B6B' },
                    { name: '袋装厨余', icon: '🥬', color: '#90EE90' },
                    { name: '鱼骨头', icon: '🐟', color: '#C0C0C0' },
                    { name: '蛋壳', icon: '🥚', color: '#F5F5DC' },
                    { name: '菜叶', icon: '🥬', color: '#228B22' },
                    { name: '剩饭', icon: '🍚', color: '#FFFACD' },
                    { name: '果皮', icon: '🍊', color: '#FFA500' }
                ]
            },
            recyclable: { 
                name: '可回收垃圾', 
                color: '#1E90FF',
                items: [
                    { name: '废纸', icon: '📄', color: '#F5F5F5' },
                    { name: '塑料瓶', icon: '🍼', color: '#87CEEB' },
                    { name: '玻璃瓶', icon: '🍾', color: '#98FB98' },
                    { name: '废铁', icon: '🔩', color: '#708090' },
                    { name: '纸箱', icon: '📦', color: '#D2691E' },
                    { name: '易拉罐', icon: '🥤', color: '#C0C0C0' },
                    { name: '报纸', icon: '📰', color: '#DCDCDC' },
                    { name: '塑料袋', icon: '🛍️', color: '#FFB6C1' }
                ]
            },
            hazardous: { 
                name: '有害垃圾', 
                color: '#8B0000',
                items: [
                    { name: '废电池', icon: '🔋', color: '#2F4F4F' },
                    { name: '化学药品', icon: '🧪', color: '#9400D3' },
                    { name: '过期药品', icon: '💊', color: '#FF1493' },
                    { name: '废灯管', icon: '💡', color: '#FFFF00' },
                    { name: '杀虫剂', icon: '🪲', color: '#8B0000' },
                    { name: '油漆桶', icon: '🎨', color: '#FF4500' },
                    { name: '温度计', icon: '🌡️', color: '#C0C0C0' },
                    { name: 'X光片', icon: '🩻', color: '#2F2F2F' }
                ]
            },
            other: { 
                name: '其他垃圾', 
                color: '#696969',
                items: [
                    { name: '烟头', icon: '🚬', color: '#8B4513' },
                    { name: '尘土', icon: '💨', color: '#A9A9A9' },
                    { name: '碎瓷器', icon: '🏺', color: '#F0E68C' },
                    { name: '毛发', icon: '💇', color: '#654321' },
                    { name: '猫砂', icon: '🐱', color: '#D2B48C' },
                    { name: '口香糖', icon: '🍬', color: '#FFB6C1' },
                    { name: '纸尿裤', icon: '👶', color: '#F0F8FF' },
                    { name: '陶瓷碎片', icon: '🏺', color: '#CD853F' }
                ]
            }
        };
        
        this.lastTrashSpawn = 0;
        this.trashSpawnInterval = 2000; // 2秒生成一个垃圾
        this.missedTrash = 0; // 未收集的垃圾数量
        
        // 游戏状态
        this.currentLevel = 1;
        this.gameTime = 0; // 游戏总时间
        this.levelTime = 120; // 关卡时间限制（秒）
        this.remainingTime = this.levelTime;
        this.gameState = 'playing'; // 'playing', 'levelComplete', 'gameOver', 'paused'
        this.totalTrashSpawned = 0; // 本关卡生成的垃圾总数
        this.levelTrashTarget = 20; // 每关需要处理的垃圾数量
        
        // 关卡配置
        this.levelConfig = {
            1: { 
                tracks: 1, 
                trashTypes: ['kitchen_waste', 'recyclable', 'hazardous'], 
                timeLimit: 90,
                trashTarget: 15,
                description: '基础3类垃圾分类'
            },
            2: { 
                tracks: 2, 
                trashTypes: ['kitchen_waste', 'recyclable', 'hazardous', 'other'], 
                timeLimit: 120,
                trashTarget: 20,
                description: '增加其他垃圾类型'
            },
            3: { 
                tracks: 3, 
                trashTypes: ['kitchen_waste', 'recyclable', 'hazardous', 'other'], 
                timeLimit: 150,
                trashTarget: 25,
                description: '3轨道4类垃圾'
            },
            4: { 
                tracks: 4, 
                trashTypes: ['kitchen_waste', 'recyclable', 'hazardous', 'other'], 
                timeLimit: 180,
                trashTarget: 30,
                description: '4轨道高难度挑战'
            },
            5: { 
                tracks: 5, 
                trashTypes: ['kitchen_waste', 'recyclable', 'hazardous', 'other'], 
                timeLimit: 210,
                trashTarget: 35,
                description: '终极5轨道挑战'
            }
        };
        
        this.initializeLevel();
    }

    async init() {
        try {
            console.log('获取Canvas元素...');
            this.canvas = document.getElementById('game-canvas');
            
            if (!this.canvas) {
                throw new Error('找不到Canvas元素');
            }
            
            console.log('Canvas元素找到:', this.canvas);
            console.log('Canvas尺寸:', this.canvas.width, 'x', this.canvas.height);
            
            this.ctx = this.canvas.getContext('2d');
            
            if (!this.ctx) {
                throw new Error('无法获取2D上下文');
            }
            
            console.log('2D上下文获取成功');
            
            // 设置事件监听
            this.setupEvents();
            
            // 初始化UI状态
            this.updateBinSelector();
            
            // 初始化第一关
            this.initializeLevel();
            
            // 开始游戏循环
            this.start();
            
            console.log('简化游戏初始化成功');
            
        } catch (error) {
            console.error('游戏初始化失败:', error);
            this.showError(error.message);
        }
    }

    initializeLevel() {
        // 重置关卡状态
        this.tracks = [];
        this.placedBins = [];
        this.trashItems = [];
        this.totalTrashSpawned = 0;
        this.gameTime = 0;
        this.gameState = 'playing';
        
        // 获取当前关卡配置
        const config = this.levelConfig[this.currentLevel];
        this.levelTime = config.timeLimit;
        this.remainingTime = this.levelTime;
        this.levelTrashTarget = config.trashTarget;
        
        // 根据关卡创建轨道
        const trackCount = config.tracks;
        const trackSpacing = Math.min(80, (this.canvas ? (this.canvas.height - 400) / trackCount : 80));
        const startY = 280;
        
        for (let i = 0; i < trackCount; i++) {
            this.tracks.push({
                id: i + 1,
                y: startY + i * trackSpacing,
                startX: 100,
                endX: 1100,
                width: 50,
                height: 50
            });
        }
        
        console.log(`初始化关卡 ${this.currentLevel}: ${trackCount}条轨道, ${config.trashTypes.length}种垃圾类型`);
    }

    setupEvents() {
        // 键盘事件 - 数字键1-4选择垃圾桶
        document.addEventListener('keydown', (event) => {
            console.log('按键:', event.key);
            
            if (event.key >= '1' && event.key <= '4') {
                this.selectedBinType = parseInt(event.key);
                this.updateBinSelector();
                console.log('选择垃圾桶类型:', this.selectedBinType);
            }
        });

        // 鼠标事件 - 点击轨道放置垃圾桶
        this.canvas.addEventListener('click', (event) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;
            console.log('鼠标点击:', x, y);
            
            this.handleCanvasClick(x, y);
        });

        // UI按钮事件 - 垃圾桶选择器
        document.querySelectorAll('.bin-option').forEach((button, index) => {
            button.addEventListener('click', () => {
                this.selectedBinType = index + 1;
                this.updateBinSelector();
                console.log('通过UI选择垃圾桶类型:', this.selectedBinType);
            });
        });
    }

    updateBinSelector() {
        // 更新UI中的垃圾桶选择器状态
        document.querySelectorAll('.bin-option').forEach((button, index) => {
            button.classList.remove('selected');
            if (index + 1 === this.selectedBinType) {
                button.classList.add('selected');
            }
        });
    }

    handleCanvasClick(x, y) {
        // 检查是否点击在轨道上
        for (const track of this.tracks) {
            if (this.isPointOnTrack(x, y, track)) {
                // 检查该轨道是否已有垃圾桶
                const existingBin = this.placedBins.find(bin => bin.trackId === track.id);
                
                if (existingBin) {
                    // 如果已有垃圾桶，移除旧的，放置新的
                    this.removeBin(existingBin.id);
                    console.log('移除旧垃圾桶，放置新垃圾桶');
                }
                
                this.placeBin(x, y, track.id);
                return;
            }
        }
        
        console.log('点击位置不在轨道上');
    }

    removeBin(binId) {
        const index = this.placedBins.findIndex(bin => bin.id === binId);
        if (index > -1) {
            this.placedBins.splice(index, 1);
            console.log('移除垃圾桶:', binId);
        }
    }

    isPointOnTrack(x, y, track) {
        return x >= track.startX && x <= track.endX &&
               y >= track.y && y <= track.y + track.height;
    }

    // 这个方法现在不需要了，因为我们允许重新放置垃圾桶

    placeBin(x, y, trackId) {
        const binConfig = this.binConfig[this.selectedBinType];
        const track = this.tracks.find(t => t.id === trackId);
        
        const newBin = {
            id: Date.now(), // 简单的ID生成
            type: this.selectedBinType,
            x: x,
            y: track.y + track.height / 2, // 垃圾桶放在轨道中央
            trackId: trackId,
            color: binConfig.color,
            name: binConfig.name,
            collectTypes: binConfig.collectTypes,
            collectRadius: 40 // 收集半径
        };
        
        this.placedBins.push(newBin);
        console.log('放置垃圾桶:', newBin);
    }

    start() {
        this.isRunning = true;
        this.gameLoop();
        console.log('游戏循环开始');
    }

    gameLoop() {
        if (!this.isRunning) return;

        this.update();
        this.render();

        requestAnimationFrame(() => this.gameLoop());
    }

    update() {
        if (this.gameState !== 'playing') return;
        
        this.time += 16; // 假设16ms每帧
        this.gameTime += 16;
        
        // 更新剩余时间
        this.remainingTime = Math.max(0, this.levelTime - Math.floor(this.gameTime / 1000));
        
        // 检查时间到
        if (this.remainingTime <= 0) {
            this.checkGameOver();
            return;
        }
        
        // 生成垃圾
        this.spawnTrash();
        
        // 更新垃圾移动
        this.updateTrash();
        
        // 检测碰撞和收集
        this.checkCollisions();
        
        // 检查关卡完成条件
        this.checkLevelComplete();
    }

    spawnTrash() {
        // 检查是否还需要生成垃圾
        if (this.totalTrashSpawned >= this.levelTrashTarget || this.gameState !== 'playing') {
            return;
        }
        
        if (this.time - this.lastTrashSpawn > this.trashSpawnInterval) {
            // 随机选择轨道
            const randomTrack = this.tracks[Math.floor(Math.random() * this.tracks.length)];
            
            // 根据当前关卡选择垃圾类型
            const config = this.levelConfig[this.currentLevel];
            const availableTypes = config.trashTypes;
            const randomType = availableTypes[Math.floor(Math.random() * availableTypes.length)];
            const trashConfig = this.trashConfig[randomType];
            
            // 随机选择具体垃圾物品
            const randomItem = trashConfig.items[Math.floor(Math.random() * trashConfig.items.length)];
            
            const newTrash = {
                id: Date.now() + Math.random(),
                type: randomType,
                name: randomItem.name,
                x: randomTrack.endX + 50, // 从轨道右端开始
                y: randomTrack.y + randomTrack.height / 2,
                trackId: randomTrack.id,
                speed: 40 + Math.random() * 20, // 稍微慢一点，便于观察
                color: randomItem.color,
                icon: randomItem.icon,
                collected: false,
                size: 25, // 稍微大一点
                categoryColor: trashConfig.color, // 保存类别颜色用于标签
                hasShownError: false, // 是否已显示过错误提示
                errorBins: [] // 记录已经碰撞过的错误垃圾桶，避免重复提示
            };
            
            this.trashItems.push(newTrash);
            this.totalTrashSpawned++;
            this.lastTrashSpawn = this.time;
            
            console.log(`生成垃圾 ${this.totalTrashSpawned}/${this.levelTrashTarget}: ${newTrash.name}`);
        }
    }

    updateTrash() {
        for (let i = this.trashItems.length - 1; i >= 0; i--) {
            const trash = this.trashItems[i];
            
            if (!trash.collected) {
                // 向左移动
                trash.x -= trash.speed * (16 / 1000); // 根据帧时间调整
                
                // 只有当垃圾完全走出轨道左端时才移除并记录为未收集
                const track = this.tracks.find(t => t.id === trash.trackId);
                if (trash.x < track.startX - 50) {
                    this.trashItems.splice(i, 1);
                    this.missedTrash++;
                    console.log(`垃圾未被收集: ${trash.name}，已走完轨道`);
                    
                    // 检查游戏失败条件：任一垃圾通过轨道
                    this.checkGameOver();
                }
            }
        }
    }

    checkCollisions() {
        for (const trash of this.trashItems) {
            if (trash.collected) continue;
            
            for (const bin of this.placedBins) {
                // 检查垃圾是否在同一轨道上
                if (trash.trackId === bin.trackId) {
                    // 计算距离
                    const distance = Math.sqrt(
                        Math.pow(trash.x - bin.x, 2) + 
                        Math.pow(trash.y - bin.y, 2)
                    );
                    
                    // 如果在收集范围内
                    if (distance < bin.collectRadius) {
                        // 检查垃圾桶是否能收集这种垃圾
                        if (bin.collectTypes.includes(trash.type)) {
                            // 正确收集 - 垃圾被吃掉
                            trash.collected = true;
                            this.score += 10;
                            this.collectedCount++;
                            console.log(`正确收集: ${trash.name} -> ${bin.name}`);
                            
                            // 添加收集效果
                            this.addCollectionEffect(bin.x, bin.y, true);
                        } else {
                            // 错误的垃圾桶 - 垃圾继续前进，但显示错误提示
                            // 避免对同一个垃圾桶重复显示错误提示
                            if (!trash.errorBins.includes(bin.id)) {
                                trash.errorBins.push(bin.id);
                                console.log(`错误垃圾桶: ${trash.name} 不能被 ${bin.name} 收集，继续前进`);
                                
                                // 添加错误效果，但不收集垃圾
                                this.addCollectionEffect(bin.x, bin.y, false);
                            }
                        }
                    }
                }
            }
        }
        
        // 只移除已正确收集的垃圾
        this.trashItems = this.trashItems.filter(trash => !trash.collected);
    }

    addCollectionEffect(x, y, isCorrect) {
        // 简单的文字效果
        const effect = {
            x: x,
            y: y,
            text: isCorrect ? '+10' : '错误!',
            color: isCorrect ? '#4CAF50' : '#F44336',
            life: 1000, // 1秒
            startTime: this.time
        };
        
        if (!this.effects) this.effects = [];
        this.effects.push(effect);
    }

    render() {
        try {
            // 清空画布
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            
            // 绘制渐变背景
            const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
            gradient.addColorStop(0, '#98FB98');
            gradient.addColorStop(0.5, '#87CEEB');
            gradient.addColorStop(1, '#F0FFF0');
            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            
            // 绘制标题
            this.ctx.fillStyle = '#2E7D32';
            this.ctx.font = 'bold 48px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('生态防御游戏', this.canvas.width / 2, 100);
            
            // 绘制副标题
            this.ctx.fillStyle = '#4CAF50';
            this.ctx.font = '20px Arial';
            this.ctx.fillText('游戏正在运行...', this.canvas.width / 2, 150);
            
            // 动态圆形已移除
            
            // 绘制轨道
            for (const track of this.tracks) {
                this.ctx.fillStyle = '#87CEEB';
                this.ctx.fillRect(track.startX, track.y, track.endX - track.startX, track.height);
                this.ctx.strokeStyle = '#4682B4';
                this.ctx.lineWidth = 2;
                this.ctx.strokeRect(track.startX, track.y, track.endX - track.startX, track.height);
                
                // 绘制轨道标签
                this.ctx.fillStyle = '#FFFFFF';
                this.ctx.font = '12px Arial';
                this.ctx.textAlign = 'left';
                this.ctx.fillText(`轨道 ${track.id}`, track.startX + 10, track.y + 25);
            }
            
            // 绘制已放置的垃圾桶
            for (const bin of this.placedBins) {
                // 绘制收集范围（半透明圆圈）
                this.ctx.save();
                this.ctx.globalAlpha = 0.2;
                this.ctx.fillStyle = bin.color;
                this.ctx.beginPath();
                this.ctx.arc(bin.x, bin.y, bin.collectRadius, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.restore();
                
                // 绘制垃圾桶
                this.drawBin(bin.x, bin.y, bin.color, bin.name, bin.type === this.selectedBinType);
            }
            
            // 绘制底部垃圾桶选择器
            this.drawBottomBinSelector();
            
            // 绘制移动的垃圾
            for (const trash of this.trashItems) {
                this.drawTrash(trash);
            }
            
            // 绘制收集效果
            this.drawEffects();
            

            
            // 绘制左上角HUD
            this.drawHUD();
            
            // 绘制游戏状态覆盖层
            this.drawGameStateOverlay();
            
        } catch (error) {
            console.error('渲染错误:', error);
        }
    }
    
    drawGameStateOverlay() {
        if (this.gameState === 'levelComplete') {
            // 关卡完成覆盖层
            this.ctx.save();
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            
            this.ctx.fillStyle = '#4CAF50';
            this.ctx.font = 'bold 48px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('关卡完成！', this.canvas.width / 2, this.canvas.height / 2 - 50);
            
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.font = '24px Arial';
            this.ctx.fillText('正在进入下一关...', this.canvas.width / 2, this.canvas.height / 2 + 20);
            
            // 绘制关卡完成统计
            this.ctx.font = '18px Arial';
            this.ctx.fillText(`关卡 ${this.currentLevel} 完成`, this.canvas.width / 2, this.canvas.height / 2 + 60);
            this.ctx.fillText(`收集垃圾: ${this.collectedCount}`, this.canvas.width / 2, this.canvas.height / 2 + 85);
            this.ctx.fillText(`奖励分数: +100`, this.canvas.width / 2, this.canvas.height / 2 + 110);
            
            this.ctx.restore();
        } else if (this.gameState === 'gameComplete') {
            // 游戏全部完成覆盖层
            this.ctx.save();
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            
            // 绘制烟花效果背景
            this.ctx.fillStyle = '#FFD700';
            this.ctx.font = 'bold 64px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('🎉 恭喜通关！ 🎉', this.canvas.width / 2, this.canvas.height / 2 - 80);
            
            this.ctx.fillStyle = '#4CAF50';
            this.ctx.font = 'bold 36px Arial';
            this.ctx.fillText('生态防御大师！', this.canvas.width / 2, this.canvas.height / 2 - 20);
            
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.font = '24px Arial';
            this.ctx.fillText(`最终分数: ${this.score}`, this.canvas.width / 2, this.canvas.height / 2 + 30);
            this.ctx.fillText(`总收集垃圾: ${this.collectedCount}`, this.canvas.width / 2, this.canvas.height / 2 + 60);
            
            const totalAccuracy = this.collectedCount + this.missedTrash > 0 ? 
                Math.round((this.collectedCount / (this.collectedCount + this.missedTrash)) * 100) : 100;
            this.ctx.fillText(`总准确率: ${totalAccuracy}%`, this.canvas.width / 2, this.canvas.height / 2 + 90);
            
            this.ctx.font = '18px Arial';
            this.ctx.fillStyle = '#CCCCCC';
            this.ctx.fillText('感谢您为环保事业做出的贡献！', this.canvas.width / 2, this.canvas.height / 2 + 130);
            
            this.ctx.restore();
        }
    }

    drawBin(x, y, color, name, isSelected = false, scale = 1) {
        this.ctx.save();
        
        // 选中状态的光晕效果
        if (isSelected) {
            this.ctx.shadowColor = color;
            this.ctx.shadowBlur = 10;
        }
        
        const binWidth = 30 * scale;
        const binHeight = 40 * scale;
        
        // 垃圾桶主体
        this.ctx.fillStyle = color;
        this.ctx.fillRect(x - binWidth/2, y - binHeight/2, binWidth, binHeight);
        
        // 垃圾桶盖子
        this.ctx.fillStyle = this.lightenColor(color, 0.2);
        this.ctx.fillRect(x - binWidth/2 - 3, y - binHeight/2 - 5, binWidth + 6, 8);
        
        // 垃圾桶把手
        this.ctx.strokeStyle = this.darkenColor(color, 0.3);
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(x - binWidth/3, y - binHeight/2 - 2, 4, 0, Math.PI, true);
        this.ctx.arc(x + binWidth/3, y - binHeight/2 - 2, 4, 0, Math.PI, true);
        this.ctx.stroke();
        
        // 标签
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = `bold ${10 * scale}px Arial`;
        this.ctx.textAlign = 'center';
        this.ctx.fillText(name, x, y + 2);
        
        // 选中状态的边框
        if (isSelected) {
            this.ctx.strokeStyle = '#FFFFFF';
            this.ctx.lineWidth = 3;
            this.ctx.strokeRect(x - binWidth/2 - 2, y - binHeight/2 - 7, binWidth + 4, binHeight + 12);
        }
        
        this.ctx.restore();
    }

    lightenColor(color, amount) {
        // 简单的颜色变亮函数
        const hex = color.replace('#', '');
        const r = Math.min(255, parseInt(hex.substr(0, 2), 16) + Math.round(255 * amount));
        const g = Math.min(255, parseInt(hex.substr(2, 2), 16) + Math.round(255 * amount));
        const b = Math.min(255, parseInt(hex.substr(4, 2), 16) + Math.round(255 * amount));
        return `rgb(${r}, ${g}, ${b})`;
    }

    darkenColor(color, amount) {
        // 简单的颜色变暗函数
        const hex = color.replace('#', '');
        const r = Math.max(0, parseInt(hex.substr(0, 2), 16) - Math.round(255 * amount));
        const g = Math.max(0, parseInt(hex.substr(2, 2), 16) - Math.round(255 * amount));
        const b = Math.max(0, parseInt(hex.substr(4, 2), 16) - Math.round(255 * amount));
        return `rgb(${r}, ${g}, ${b})`;
    }

    drawTrash(trash) {
        this.ctx.save();
        
        // 如果垃圾经过了错误的垃圾桶，添加一个红色边框提示
        if (trash.errorBins && trash.errorBins.length > 0) {
            this.ctx.strokeStyle = '#FF0000';
            this.ctx.lineWidth = 3;
            this.ctx.beginPath();
            this.ctx.arc(trash.x, trash.y, trash.size/2 + 3, 0, Math.PI * 2);
            this.ctx.stroke();
        }
        
        // 绘制垃圾主体（圆形背景）
        this.ctx.fillStyle = trash.color;
        this.ctx.beginPath();
        this.ctx.arc(trash.x, trash.y, trash.size/2, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 绘制边框
        this.ctx.strokeStyle = this.darkenColor(trash.color, 0.4);
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
        
        // 绘制图标（更大更清晰）
        this.ctx.font = '20px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(trash.icon, trash.x, trash.y - 2);
        
        // 绘制垃圾名称（在垃圾下方）
        this.ctx.fillStyle = '#000000';
        this.ctx.font = 'bold 10px Arial';
        this.ctx.textBaseline = 'top';
        this.ctx.fillText(trash.name, trash.x, trash.y + trash.size/2 + 3);
        
        // 绘制类型标签（在垃圾上方）
        const trashConfig = this.trashConfig[trash.type];
        const labelWidth = this.ctx.measureText(trashConfig.name).width + 8;
        
        this.ctx.fillStyle = trash.categoryColor;
        this.ctx.fillRect(trash.x - labelWidth/2, trash.y - trash.size/2 - 18, labelWidth, 14);
        
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = 'bold 9px Arial';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(trashConfig.name, trash.x, trash.y - trash.size/2 - 11);
        
        // 如果垃圾经过了错误的垃圾桶，显示一个小的警告图标
        if (trash.errorBins && trash.errorBins.length > 0) {
            this.ctx.font = '12px Arial';
            this.ctx.fillText('⚠️', trash.x + trash.size/2 + 5, trash.y - trash.size/2);
        }
        
        this.ctx.restore();
    }

    drawEffects() {
        if (!this.effects) return;
        
        for (let i = this.effects.length - 1; i >= 0; i--) {
            const effect = this.effects[i];
            const elapsed = this.time - effect.startTime;
            
            if (elapsed > effect.life) {
                this.effects.splice(i, 1);
                continue;
            }
            
            // 计算透明度和位置
            const alpha = 1 - (elapsed / effect.life);
            const offsetY = -elapsed / 10; // 向上飘动
            
            this.ctx.save();
            this.ctx.globalAlpha = alpha;
            this.ctx.fillStyle = effect.color;
            this.ctx.font = 'bold 16px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(effect.text, effect.x, effect.y + offsetY);
            this.ctx.restore();
        }
    }

    drawHUD() {
        this.ctx.save();
        
        // HUD背景 - 扩大以容纳更多信息
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(10, 10, 400, 100);
        this.ctx.strokeStyle = '#4CAF50';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(10, 10, 400, 100);
        
        // HUD文字
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = 'bold 16px Arial';
        this.ctx.textAlign = 'left';
        
        // 第一行：关卡、分数、时间
        const config = this.levelConfig[this.currentLevel];
        this.ctx.fillText(`关卡 ${this.currentLevel}/5: ${config.description}`, 20, 30);
        this.ctx.fillText(`分数: ${this.score}`, 20, 50);
        
        // 时间（格式化为分:秒）
        const minutes = Math.floor(this.remainingTime / 60);
        const seconds = this.remainingTime % 60;
        const timeText = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        this.ctx.fillText(`时间: ${timeText}`, 150, 50);
        
        // 关卡进度
        const progress = `${this.totalTrashSpawned}/${this.levelTrashTarget}`;
        this.ctx.fillText(`垃圾进度: ${progress}`, 250, 50);
        
        // 统计信息
        this.ctx.font = '12px Arial';
        this.ctx.fillStyle = '#CCCCCC';
        this.ctx.fillText(`已收集: ${this.collectedCount}`, 20, 70);
        this.ctx.fillText(`未收集: ${this.missedTrash}`, 120, 70);
        this.ctx.fillText(`当前垃圾: ${this.trashItems.length}`, 220, 70);
        
        // 准确率
        const accuracy = this.collectedCount + this.missedTrash > 0 ? 
            Math.round((this.collectedCount / (this.collectedCount + this.missedTrash)) * 100) : 100;
        this.ctx.fillText(`准确率: ${accuracy}%`, 320, 70);
        
        // 轨道数量提示
        this.ctx.fillText(`轨道数: ${this.tracks.length}`, 20, 90);
        
        // 可用垃圾类型
        const availableTypes = config.trashTypes.map(type => this.trashConfig[type].name).join(', ');
        this.ctx.fillText(`垃圾类型: ${availableTypes}`, 120, 90);
        
        this.ctx.restore();
    }

    drawBottomBinSelector() {
        this.ctx.save();
        
        // 底部垃圾桶选择器 - 调整到屏幕底部中央
        const selectorY = this.canvas.height - 140; // 更靠近底部
        const selectorWidth = 600; // 增加宽度以容纳更大的垃圾桶
        const selectorX = (this.canvas.width - selectorWidth) / 2;
        
        // 选择器整体背景和边框
        this.ctx.fillStyle = 'rgba(40, 40, 40, 0.95)';
        this.ctx.fillRect(selectorX - 20, selectorY - 20, selectorWidth + 40, 120);
        this.ctx.strokeStyle = '#4CAF50';
        this.ctx.lineWidth = 4;
        this.ctx.strokeRect(selectorX - 20, selectorY - 20, selectorWidth + 40, 120);
        
        // 选择器标题
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = 'bold 18px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('选择垃圾桶类型 (按数字键1-4)', this.canvas.width / 2, selectorY - 5);
        
        // 根据当前关卡显示可用的垃圾桶选项
        const config = this.levelConfig[this.currentLevel];
        const availableTypes = config.trashTypes;
        
        const allBinTypes = [
            { id: 1, name: '厨余', color: '#4CAF50', symbol: '🥬', type: 'kitchen_waste' },
            { id: 2, name: '可回收', color: '#2196F3', symbol: '♻️', type: 'recyclable' },
            { id: 3, name: '有害', color: '#F44336', symbol: '☢️', type: 'hazardous' },
            { id: 4, name: '其他', color: '#FF9800', symbol: '🗑️', type: 'other' }
        ];
        
        // 只显示当前关卡可用的垃圾桶类型
        const binTypes = allBinTypes.filter(bin => availableTypes.includes(bin.type));
        
        // 动态调整选择器宽度和间距
        const binCount = binTypes.length;
        const binSpacing = Math.min(140, (selectorWidth - 40) / binCount);
        const startX = selectorX + (selectorWidth - binCount * binSpacing) / 2 + binSpacing / 2;
        
        binTypes.forEach((binType, index) => {
            const x = startX + index * binSpacing;
            const y = selectorY + 50;
            const isSelected = binType.id === this.selectedBinType;
            
            // 每个垃圾桶的背景框
            this.ctx.fillStyle = isSelected ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.05)';
            this.ctx.fillRect(x - 65, y - 35, 130, 70);
            
            // 垃圾桶选择框边框
            this.ctx.strokeStyle = isSelected ? binType.color : 'rgba(255, 255, 255, 0.3)';
            this.ctx.lineWidth = isSelected ? 4 : 2;
            this.ctx.strokeRect(x - 65, y - 35, 130, 70);
            
            // 选中状态的高亮效果
            if (isSelected) {
                // 内发光效果
                this.ctx.shadowColor = binType.color;
                this.ctx.shadowBlur = 15;
                this.ctx.strokeStyle = binType.color;
                this.ctx.lineWidth = 3;
                this.ctx.strokeRect(x - 63, y - 33, 126, 66);
                this.ctx.shadowBlur = 0; // 重置阴影
            }
            
            // 绘制更大更立体的垃圾桶
            this.drawLargeBin(x, y - 10, binType.color, binType.symbol, isSelected);
            
            // 绘制数字键提示
            this.ctx.fillStyle = binType.color;
            this.ctx.fillRect(x - 60, y - 30, 25, 20);
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.font = 'bold 16px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(binType.id.toString(), x - 47.5, y - 16);
            
            // 绘制垃圾桶名称
            this.ctx.fillStyle = isSelected ? '#FFFFFF' : '#CCCCCC';
            this.ctx.font = 'bold 14px Arial';
            this.ctx.fillText(binType.name, x, y + 25);
            
            // 如果垃圾桶在当前关卡不可用，显示禁用状态
            if (!availableTypes.includes(binType.type)) {
                this.ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
                this.ctx.fillRect(x - 65, y - 35, 130, 70);
                this.ctx.fillStyle = '#FF0000';
                this.ctx.font = 'bold 20px Arial';
                this.ctx.fillText('✗', x, y);
            }
        });
        
        this.ctx.restore();
    }

    drawLargeBin(x, y, color, symbol, isSelected = false) {
        this.ctx.save();
        
        const binWidth = 50; // 增大垃圾桶
        const binHeight = 55;
        
        // 绘制阴影效果（立体感）
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        this.ctx.fillRect(x - binWidth/2 + 3, y - binHeight/2 + 3, binWidth, binHeight + 8);
        
        // 垃圾桶主体（梯形效果，更立体）
        const gradient = this.ctx.createLinearGradient(x - binWidth/2, y - binHeight/2, x + binWidth/2, y + binHeight/2);
        gradient.addColorStop(0, this.lightenColor(color, 0.2));
        gradient.addColorStop(0.5, color);
        gradient.addColorStop(1, this.darkenColor(color, 0.2));
        
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.moveTo(x - binWidth/2 + 4, y - binHeight/2);
        this.ctx.lineTo(x + binWidth/2 - 4, y - binHeight/2);
        this.ctx.lineTo(x + binWidth/2, y + binHeight/2);
        this.ctx.lineTo(x - binWidth/2, y + binHeight/2);
        this.ctx.closePath();
        this.ctx.fill();
        
        // 垃圾桶盖子（更立体）
        const lidGradient = this.ctx.createLinearGradient(x, y - binHeight/2 - 8, x, y - binHeight/2);
        lidGradient.addColorStop(0, this.lightenColor(color, 0.4));
        lidGradient.addColorStop(1, this.lightenColor(color, 0.1));
        
        this.ctx.fillStyle = lidGradient;
        this.ctx.fillRect(x - binWidth/2 - 4, y - binHeight/2 - 8, binWidth + 8, 12);
        
        // 盖子边缘高光
        this.ctx.fillStyle = this.lightenColor(color, 0.6);
        this.ctx.fillRect(x - binWidth/2 - 4, y - binHeight/2 - 8, binWidth + 8, 3);
        
        // 垃圾桶把手（更大更立体）
        this.ctx.strokeStyle = this.darkenColor(color, 0.4);
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.arc(x - binWidth/3, y - binHeight/2 - 2, 6, 0, Math.PI, true);
        this.ctx.arc(x + binWidth/3, y - binHeight/2 - 2, 6, 0, Math.PI, true);
        this.ctx.stroke();
        
        // 把手高光
        this.ctx.strokeStyle = this.lightenColor(color, 0.3);
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.arc(x - binWidth/3 - 1, y - binHeight/2 - 3, 6, 0, Math.PI, true);
        this.ctx.arc(x + binWidth/3 - 1, y - binHeight/2 - 3, 6, 0, Math.PI, true);
        this.ctx.stroke();
        
        // 垃圾桶边框（立体效果）
        this.ctx.strokeStyle = this.darkenColor(color, 0.4);
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(x - binWidth/2 + 4, y - binHeight/2);
        this.ctx.lineTo(x + binWidth/2 - 4, y - binHeight/2);
        this.ctx.lineTo(x + binWidth/2, y + binHeight/2);
        this.ctx.lineTo(x - binWidth/2, y + binHeight/2);
        this.ctx.closePath();
        this.ctx.stroke();
        
        // 左侧高光（立体效果）
        this.ctx.strokeStyle = this.lightenColor(color, 0.4);
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(x - binWidth/2 + 4, y - binHeight/2);
        this.ctx.lineTo(x - binWidth/2, y + binHeight/2);
        this.ctx.stroke();
        
        // 垃圾桶纹理线条
        this.ctx.strokeStyle = this.darkenColor(color, 0.2);
        this.ctx.lineWidth = 1;
        for (let i = 1; i < 4; i++) {
            const lineY = y - binHeight/2 + (binHeight * i / 4);
            this.ctx.beginPath();
            this.ctx.moveTo(x - binWidth/2 + 6, lineY);
            this.ctx.lineTo(x + binWidth/2 - 6, lineY);
            this.ctx.stroke();
        }
        
        // 类型符号（更大）
        this.ctx.font = '32px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        
        // 符号阴影
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        this.ctx.fillText(symbol, x + 1, y + 1);
        
        // 符号主体
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.fillText(symbol, x, y);
        
        // 选中状态的特殊效果
        if (isSelected) {
            // 外发光效果
            this.ctx.shadowColor = color;
            this.ctx.shadowBlur = 20;
            this.ctx.strokeStyle = '#FFFFFF';
            this.ctx.lineWidth = 4;
            this.ctx.beginPath();
            this.ctx.moveTo(x - binWidth/2 + 4, y - binHeight/2);
            this.ctx.lineTo(x + binWidth/2 - 4, y - binHeight/2);
            this.ctx.lineTo(x + binWidth/2, y + binHeight/2);
            this.ctx.lineTo(x - binWidth/2, y + binHeight/2);
            this.ctx.closePath();
            this.ctx.stroke();
            
            // 重置阴影
            this.ctx.shadowBlur = 0;
            
            // 选中指示器（顶部光环）
            this.ctx.strokeStyle = '#FFD700';
            this.ctx.lineWidth = 3;
            this.ctx.beginPath();
            this.ctx.arc(x, y - binHeight/2 - 15, 8, 0, Math.PI * 2);
            this.ctx.stroke();
            
            this.ctx.fillStyle = '#FFD700';
            this.ctx.beginPath();
            this.ctx.arc(x, y - binHeight/2 - 15, 4, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        this.ctx.restore();
    }

    checkLevelComplete() {
        // 检查是否所有垃圾都被正确分类
        if (this.totalTrashSpawned >= this.levelTrashTarget && 
            this.trashItems.length === 0 && 
            this.missedTrash === 0) {
            
            this.gameState = 'levelComplete';
            console.log(`关卡 ${this.currentLevel} 完成！`);
            
            // 延迟2秒后自动进入下一关
            setTimeout(() => {
                this.nextLevel();
            }, 2000);
        }
    }
    
    checkGameOver() {
        // 游戏失败：任一垃圾通过轨道或时间到
        if (this.missedTrash > 0 || this.remainingTime <= 0) {
            this.gameState = 'gameOver';
            console.log('游戏失败！');
            this.showGameOverDialog();
        }
    }
    
    nextLevel() {
        if (this.currentLevel < 5) {
            this.currentLevel++;
            this.score += 100; // 关卡完成奖励
            this.initializeLevel();
            console.log(`进入关卡 ${this.currentLevel}`);
        } else {
            // 游戏全部完成
            this.gameState = 'gameComplete';
            console.log('恭喜！游戏全部完成！');
        }
    }
    
    restartLevel() {
        this.missedTrash = 0;
        this.collectedCount = 0;
        this.score = Math.max(0, this.score - 50); // 重新开始扣分
        this.initializeLevel();
        console.log(`重新开始关卡 ${this.currentLevel}`);
    }
    
    continueLevel() {
        this.gameState = 'playing';
        this.missedTrash = 0; // 重置未收集计数，给玩家第二次机会
        console.log(`继续关卡 ${this.currentLevel}`);
    }
    
    showGameOverDialog() {
        // 创建游戏失败对话框
        const dialog = document.createElement('div');
        dialog.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.9);
            color: white;
            padding: 30px;
            border-radius: 10px;
            text-align: center;
            z-index: 1000;
            border: 3px solid #F44336;
        `;
        
        dialog.innerHTML = `
            <h2 style="color: #F44336; margin-bottom: 20px;">关卡失败！</h2>
            <p style="margin-bottom: 20px;">垃圾通过了轨道或时间已到</p>
            <button id="restart-btn" style="margin: 10px; padding: 10px 20px; font-size: 16px; background: #4CAF50; color: white; border: none; border-radius: 5px; cursor: pointer;">重新开始</button>
            <button id="continue-btn" style="margin: 10px; padding: 10px 20px; font-size: 16px; background: #2196F3; color: white; border: none; border-radius: 5px; cursor: pointer;">继续本关</button>
        `;
        
        document.body.appendChild(dialog);
        
        // 添加按钮事件
        document.getElementById('restart-btn').onclick = () => {
            document.body.removeChild(dialog);
            this.restartLevel();
        };
        
        document.getElementById('continue-btn').onclick = () => {
            document.body.removeChild(dialog);
            this.continueLevel();
        };
    }

    showError(message) {
        // 在Canvas上显示错误信息
        if (this.ctx) {
            this.ctx.fillStyle = '#FF0000';
            this.ctx.font = '24px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('错误: ' + message, this.canvas.width / 2, this.canvas.height / 2);
        }
        
        // 也在控制台显示
        console.error('游戏错误:', message);
    }
}

// 页面加载完成后启动游戏
document.addEventListener('DOMContentLoaded', async () => {
    console.log('DOM加载完成，启动简化游戏');
    
    const game = new SimpleGame();
    await game.init();
    
    // 暴露到全局用于调试
    window.simpleGame = game;
});