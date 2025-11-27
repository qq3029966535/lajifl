/**
 * 游戏配置文件
 * 包含所有游戏相关的配置参数
 */

export const TrashBinType = {
    KITCHEN_WASTE: 1,
    RECYCLABLE: 2,
    HAZARDOUS: 3,
    OTHER: 4
};

export const TrashType = {
    KITCHEN_WASTE: 'kitchen_waste',
    RECYCLABLE: 'recyclable',
    HAZARDOUS: 'hazardous',
    OTHER: 'other'
};

export const GameConfig = {
    // 画布配置
    canvas: {
        width: 1200,
        height: 800
    },
    
    // 轨道配置
    tracks: {
        maxCount: 5,
        width: 80,
        spacing: 120,
        startX: 1100,
        endX: 100,
        startY: 150
    },
    
    // 垃圾桶配置
    trashBins: {
        [TrashBinType.KITCHEN_WASTE]: {
            name: "厨余垃圾桶",
            color: "#4CAF50",
            dialogue: "果皮菜叶，统统到我嘴里来！",
            collectTypes: [TrashType.KITCHEN_WASTE],
            collectRadius: 40
        },
        [TrashBinType.RECYCLABLE]: {
            name: "可回收垃圾桶",
            color: "#2196F3",
            dialogue: "塑料金属纸箱，都是我的宝藏！",
            collectTypes: [TrashType.RECYCLABLE],
            collectRadius: 40
        },
        [TrashBinType.HAZARDOUS]: {
            name: "有害垃圾桶",
            color: "#F44336",
            dialogue: "电池灯管别乱跑，小心我释放净化波！",
            collectTypes: [TrashType.HAZARDOUS],
            collectRadius: 40
        },
        [TrashBinType.OTHER]: {
            name: "其他垃圾桶",
            color: "#FF9800",
            dialogue: "疑难杂症交给我，分类小能手就是我！",
            collectTypes: [TrashType.OTHER],
            collectRadius: 40
        }
    },
    
    // 关卡配置
    levels: [
        {
            id: 1,
            trackCount: 1,
            trashTypes: [TrashType.KITCHEN_WASTE, TrashType.RECYCLABLE, TrashType.HAZARDOUS],
            timeLimit: 120, // 2分钟
            spawnPattern: "basic",
            zombieCount: 15,
            spawnInterval: 3000
        },
        {
            id: 2,
            trackCount: 2,
            trashTypes: [TrashType.KITCHEN_WASTE, TrashType.RECYCLABLE, TrashType.HAZARDOUS, TrashType.OTHER],
            timeLimit: 120,
            spawnPattern: "medium",
            zombieCount: 20,
            spawnInterval: 2500
        },
        {
            id: 3,
            trackCount: 3,
            trashTypes: [TrashType.KITCHEN_WASTE, TrashType.RECYCLABLE, TrashType.HAZARDOUS, TrashType.OTHER],
            timeLimit: 120,
            spawnPattern: "hard",
            zombieCount: 25,
            spawnInterval: 2000
        },
        {
            id: 4,
            trackCount: 4,
            trashTypes: [TrashType.KITCHEN_WASTE, TrashType.RECYCLABLE, TrashType.HAZARDOUS, TrashType.OTHER],
            timeLimit: 120,
            spawnPattern: "expert",
            zombieCount: 30,
            spawnInterval: 1800
        },
        {
            id: 5,
            trackCount: 5,
            trashTypes: [TrashType.KITCHEN_WASTE, TrashType.RECYCLABLE, TrashType.HAZARDOUS, TrashType.OTHER],
            timeLimit: 120,
            spawnPattern: "master",
            zombieCount: 35,
            spawnInterval: 1500
        }
    ],
    
    // 游戏机制配置
    gameplay: {
        correctScore: 10,
        timeBonus: 1,
        lives: 3,
        binPlacementCost: 0
    },
    
    // 颜色主题
    colors: {
        background: '#98FB98',      // 薄荷绿
        track: '#87CEEB',          // 天空蓝
        energy: '#FFFFFF',         // 纯净白
        ui: '#2E7D32',            // 深绿色
        success: '#4CAF50',        // 成功绿
        error: '#F44336',          // 错误红
        warning: '#FF9800'         // 警告橙
    },
    
    // 环保知识库
    ecoFacts: [
        "1节电池污染1㎡土地50年",
        "1吨废纸可生产800公斤新纸",
        "塑料瓶需要450年才能完全分解",
        "回收1吨塑料可节省2000升石油",
        "厨余垃圾占生活垃圾的40-60%",
        "正确分类可减少80%的垃圾处理成本"
    ]
};