/**
 * 渲染系统
 * 统一管理2D Canvas和3D WebGL渲染
 */
// import * as THREE from 'three';

export class RenderSystem {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx2D = canvas.getContext('2d');
        
        // 3D渲染器设置
        this.renderer3D = null;
        this.scene3D = null;
        this.camera3D = null;
        this.init3D();
        
        // 渲染层级
        this.layers = {
            BACKGROUND: 0,
            TRACKS: 1,
            ENTITIES: 2,
            EFFECTS: 3,
            UI: 4,
            DEBUG: 5
        };
        
        // 渲染队列
        this.renderQueue = [];
        this.debugMode = false;
    }

    /**
     * 初始化3D渲染器
     */
    init3D() {
        // 暂时禁用3D渲染，专注于2D渲染
        console.log('3D渲染暂时禁用，使用2D模式');
        this.renderer3D = null;
        this.scene3D = null;
        this.camera3D = null;
    }

    /**
     * 开始渲染帧
     */
    beginFrame() {
        // 清空2D画布
        this.ctx2D.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 清空3D场景的动态对象
        if (this.renderer3D) {
            // 移除之前帧的动态3D对象
            const objectsToRemove = [];
            this.scene3D.traverse((child) => {
                if (child.userData && child.userData.dynamic) {
                    objectsToRemove.push(child);
                }
            });
            
            objectsToRemove.forEach(obj => {
                this.scene3D.remove(obj);
            });
        }
        
        // 清空渲染队列
        this.renderQueue = [];
    }

    /**
     * 添加2D渲染项到队列
     * @param {Function} renderFunc - 渲染函数
     * @param {number} layer - 渲染层级
     */
    add2DRender(renderFunc, layer = this.layers.ENTITIES) {
        this.renderQueue.push({
            type: '2D',
            renderFunc,
            layer
        });
    }

    /**
     * 添加3D对象到场景（暂时禁用）
     * @param {Object} object - 3D对象
     * @param {boolean} dynamic - 是否为动态对象
     */
    add3DObject(object, dynamic = true) {
        // 3D渲染暂时禁用
        console.log('3D对象添加被跳过（3D渲染已禁用）');
    }

    /**
     * 渲染背景
     */
    renderBackground() {
        const gradient = this.ctx2D.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#98FB98'); // 薄荷绿
        gradient.addColorStop(0.5, '#87CEEB'); // 天空蓝
        gradient.addColorStop(1, '#F0FFF0'); // 淡绿色
        
        this.ctx2D.fillStyle = gradient;
        this.ctx2D.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    /**
     * 渲染轨道
     * @param {Array} tracks - 轨道数组
     */
    renderTracks(tracks) {
        this.ctx2D.save();
        
        for (const track of tracks) {
            // 轨道背景
            this.ctx2D.fillStyle = '#87CEEB'; // 天空蓝
            this.ctx2D.fillRect(
                track.startPoint.x - track.width / 2,
                track.startPoint.y - track.width / 2,
                track.endPoint.x - track.startPoint.x + track.width,
                track.width
            );
            
            // 轨道边框
            this.ctx2D.strokeStyle = '#4682B4';
            this.ctx2D.lineWidth = 2;
            this.ctx2D.strokeRect(
                track.startPoint.x - track.width / 2,
                track.startPoint.y - track.width / 2,
                track.endPoint.x - track.startPoint.x + track.width,
                track.width
            );
        }
        
        this.ctx2D.restore();
    }

    /**
     * 创建垃圾桶3D模型
     * @param {string} type - 垃圾桶类型
     * @param {string} color - 颜色
     */
    createTrashBin3D(type, color) {
        if (!this.renderer3D) return null;
        
        const group = new THREE.Group();
        
        // 垃圾桶主体
        const bodyGeometry = new THREE.CylinderGeometry(15, 18, 30, 8);
        const bodyMaterial = new THREE.MeshLambertMaterial({ color: color });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 15;
        group.add(body);
        
        // 垃圾桶盖子
        const lidGeometry = new THREE.CylinderGeometry(16, 16, 3, 8);
        const lidMaterial = new THREE.MeshLambertMaterial({ color: color });
        const lid = new THREE.Mesh(lidGeometry, lidMaterial);
        lid.position.y = 32;
        group.add(lid);
        
        // 添加表情（简单的眼睛和嘴巴）
        const eyeGeometry = new THREE.SphereGeometry(2, 8, 8);
        const eyeMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
        
        const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        leftEye.position.set(-5, 20, 16);
        group.add(leftEye);
        
        const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        rightEye.position.set(5, 20, 16);
        group.add(rightEye);
        
        // 嘴巴
        const mouthGeometry = new THREE.TorusGeometry(4, 1, 4, 8, Math.PI);
        const mouthMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
        const mouth = new THREE.Mesh(mouthGeometry, mouthMaterial);
        mouth.position.set(0, 15, 16);
        mouth.rotation.z = Math.PI;
        group.add(mouth);
        
        return group;
    }

    /**
     * 创建垃圾僵尸3D模型
     * @param {string} trashType - 垃圾类型
     */
    createTrashZombie3D(trashType) {
        if (!this.renderer3D) return null;
        
        const group = new THREE.Group();
        
        // 根据垃圾类型创建不同的模型
        switch (trashType) {
            case 'kitchen_waste':
                return this.createKitchenWasteZombie();
            case 'recyclable':
                return this.createRecyclableZombie();
            case 'hazardous':
                return this.createHazardousZombie();
            case 'other':
                return this.createOtherZombie();
            default:
                return this.createDefaultZombie();
        }
    }

    /**
     * 创建厨余垃圾僵尸
     */
    createKitchenWasteZombie() {
        const group = new THREE.Group();
        
        // 主体（摇晃的垃圾袋）
        const bodyGeometry = new THREE.SphereGeometry(12, 8, 6);
        const bodyMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x8B4513,
            transparent: true,
            opacity: 0.8
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.scale.y = 1.5;
        group.add(body);
        
        // 添加滴落效果的粒子
        for (let i = 0; i < 3; i++) {
            const dropGeometry = new THREE.SphereGeometry(1, 4, 4);
            const dropMaterial = new THREE.MeshBasicMaterial({ color: 0x654321 });
            const drop = new THREE.Mesh(dropGeometry, dropMaterial);
            drop.position.set(
                (Math.random() - 0.5) * 20,
                -15 - i * 5,
                (Math.random() - 0.5) * 20
            );
            group.add(drop);
        }
        
        return group;
    }

    /**
     * 创建可回收垃圾僵尸
     */
    createRecyclableZombie() {
        const group = new THREE.Group();
        
        // 塑料瓶
        const bottleGeometry = new THREE.CylinderGeometry(4, 6, 20, 8);
        const bottleMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x1E90FF,
            transparent: true,
            opacity: 0.7
        });
        const bottle = new THREE.Mesh(bottleGeometry, bottleMaterial);
        bottle.position.x = -8;
        group.add(bottle);
        
        // 纸箱
        const boxGeometry = new THREE.BoxGeometry(12, 12, 12);
        const boxMaterial = new THREE.MeshLambertMaterial({ color: 0xD2691E });
        const box = new THREE.Mesh(boxGeometry, boxMaterial);
        box.position.x = 8;
        group.add(box);
        
        // 金属罐
        const canGeometry = new THREE.CylinderGeometry(5, 5, 15, 8);
        const canMaterial = new THREE.MeshLambertMaterial({ color: 0xC0C0C0 });
        const can = new THREE.Mesh(canGeometry, canMaterial);
        can.position.y = 15;
        group.add(can);
        
        return group;
    }

    /**
     * 创建有害垃圾僵尸
     */
    createHazardousZombie() {
        const group = new THREE.Group();
        
        // 电池主体
        const batteryGeometry = new THREE.CylinderGeometry(6, 6, 18, 8);
        const batteryMaterial = new THREE.MeshLambertMaterial({ color: 0x8B0000 });
        const battery = new THREE.Mesh(batteryGeometry, batteryMaterial);
        group.add(battery);
        
        // 警告标志
        const warningGeometry = new THREE.ConeGeometry(8, 4, 3);
        const warningMaterial = new THREE.MeshBasicMaterial({ color: 0xFFFF00 });
        const warning = new THREE.Mesh(warningGeometry, warningMaterial);
        warning.position.y = 12;
        group.add(warning);
        
        // 添加闪烁效果（通过材质动画实现）
        battery.userData.flashing = true;
        
        return group;
    }

    /**
     * 创建其他垃圾僵尸
     */
    createOtherZombie() {
        const group = new THREE.Group();
        
        // 混合垃圾堆
        const colors = [0x808080, 0x696969, 0x778899, 0xA9A9A9];
        
        for (let i = 0; i < 4; i++) {
            const pieceGeometry = new THREE.BoxGeometry(
                4 + Math.random() * 4,
                4 + Math.random() * 4,
                4 + Math.random() * 4
            );
            const pieceMaterial = new THREE.MeshLambertMaterial({ 
                color: colors[i % colors.length] 
            });
            const piece = new THREE.Mesh(pieceGeometry, pieceMaterial);
            piece.position.set(
                (Math.random() - 0.5) * 16,
                (Math.random() - 0.5) * 16,
                (Math.random() - 0.5) * 16
            );
            piece.rotation.set(
                Math.random() * Math.PI,
                Math.random() * Math.PI,
                Math.random() * Math.PI
            );
            group.add(piece);
        }
        
        return group;
    }

    /**
     * 创建默认僵尸
     */
    createDefaultZombie() {
        const group = new THREE.Group();
        
        const geometry = new THREE.BoxGeometry(16, 16, 16);
        const material = new THREE.MeshLambertMaterial({ color: 0x666666 });
        const mesh = new THREE.Mesh(geometry, material);
        group.add(mesh);
        
        return group;
    }

    /**
     * 结束渲染帧
     */
    endFrame() {
        // 按层级排序渲染队列
        this.renderQueue.sort((a, b) => a.layer - b.layer);
        
        // 执行2D渲染
        for (const item of this.renderQueue) {
            if (item.type === '2D') {
                try {
                    item.renderFunc(this.ctx2D);
                } catch (error) {
                    console.error('2D渲染错误:', error);
                }
            }
        }
        
        // 渲染调试信息
        if (this.debugMode) {
            this.renderDebugInfo();
        }
    }

    /**
     * 渲染调试信息
     */
    renderDebugInfo() {
        this.ctx2D.save();
        this.ctx2D.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx2D.fillRect(10, 10, 200, 100);
        
        this.ctx2D.fillStyle = '#FFFFFF';
        this.ctx2D.font = '12px Arial';
        this.ctx2D.fillText('调试信息:', 20, 30);
        this.ctx2D.fillText(`渲染项数量: ${this.renderQueue.length}`, 20, 50);
        this.ctx2D.fillText(`3D对象数量: ${this.scene3D ? this.scene3D.children.length : 0}`, 20, 70);
        this.ctx2D.fillText(`FPS: ${Math.round(1000 / 16)}`, 20, 90);
        
        this.ctx2D.restore();
    }

    /**
     * 切换调试模式
     */
    toggleDebugMode() {
        this.debugMode = !this.debugMode;
    }

    /**
     * 调整画布大小
     * @param {number} width - 宽度
     * @param {number} height - 高度
     */
    resize(width, height) {
        this.canvas.width = width;
        this.canvas.height = height;
        
        if (this.renderer3D) {
            this.renderer3D.setSize(width, height);
            
            // 更新相机
            this.camera3D.left = -width / 2;
            this.camera3D.right = width / 2;
            this.camera3D.top = height / 2;
            this.camera3D.bottom = -height / 2;
            this.camera3D.updateProjectionMatrix();
        }
    }

    /**
     * 销毁渲染系统
     */
    destroy() {
        if (this.renderer3D) {
            this.renderer3D.dispose();
            this.renderer3D = null;
        }
        
        if (this.scene3D) {
            // 清理3D场景中的所有对象
            while (this.scene3D.children.length > 0) {
                const child = this.scene3D.children[0];
                this.scene3D.remove(child);
                
                // 清理几何体和材质
                if (child.geometry) child.geometry.dispose();
                if (child.material) {
                    if (Array.isArray(child.material)) {
                        child.material.forEach(material => material.dispose());
                    } else {
                        child.material.dispose();
                    }
                }
            }
            this.scene3D = null;
        }
        
        this.camera3D = null;
        this.renderQueue = [];
        
        console.log('渲染系统已销毁');
    }
}